// Discover mode: one random game at a time. Play until game over, give it a
// quick review (recommend or not, save it if you like), then change the
// channel: TV static while the next game tunes in.
//
// The end of a run is spotted by js/game-over.js (the Arcade Bridge, or the
// game's own game-over screen). Players can always end a turn themselves with
// "Next channel", which asks for the review first.

import * as api from '../api.js'
import { watchGameOver } from '../game-over.js'
import { createStatic, hiss } from '../tv-static.js'
import { $, h, reduceMotion } from '../ui.js'

const MIN_STATIC_MS = reduceMotion ? 350 : 750 // the snow shows at least this long
const MAX_TUNE_MS = 6000 // stop waiting for a slow game to finish loading
const REVIEW_DELAY_MS = 1400 // time to see the final score before the review
const OSD_MS = 2600 // how long the channel and title stay on screen
const SOUND_KEY = 'arcade:discover-sound'

const pad = (n) => String(n).padStart(2, '0')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function init() {
  const board = $('[data-discover]')
  if (!board) return
  const lineup = JSON.parse($('#discover-lineup')?.textContent || '[]')
  if (!lineup.length) return
  const bySlug = new Map(lineup.map((game) => [game.slug, game]))

  const ui = {
    stage: $('[data-stage]', board),
    ambient: $('[data-ambient]', board),
    number: $('[data-channel-number]', board),
    now: $('[data-now-title]', board),
    osdChannel: $('[data-osd-channel]', board),
    osdTitle: $('[data-osd-title]', board),
    start: $('[data-start-panel]', board),
    info: $('[data-info]', board),
    tab: $('[data-info-tab]', board),
    channelUp: $('[data-channel-up]', board),
    sound: $('[data-sound]', board),
    review: $('[data-review]', board),
    announce: $('[data-announce]'),
    history: $('[data-history]'),
    historyList: $('[data-history-list]'),
  }
  const snow = createStatic($('[data-static]', board), { still: reduceMotion })
  snow.idle()

  let turn = null // { game, frame, watcher, startedAt, ended, reviewTimer }
  let busy = false
  let osdTimer = 0

  // ---- Sound -----------------------------------------------------------------------
  let soundOn = true
  try {
    soundOn = localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    // Storage blocked: default to on.
  }
  const paintSound = () => ui.sound.setAttribute('aria-pressed', String(soundOn))
  paintSound()
  ui.sound.addEventListener('click', () => {
    soundOn = !soundOn
    paintSound()
    try {
      localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off')
    } catch {
      // Remembered for this visit only.
    }
  })

  // ---- On-screen display -------------------------------------------------------------
  const showOsd = (channel, title = '') => {
    clearTimeout(osdTimer)
    ui.osdChannel.textContent = channel
    ui.osdTitle.textContent = title
    ui.osdChannel.classList.add('is-on')
    ui.osdTitle.classList.toggle('is-on', Boolean(title))
  }
  const hideOsdSoon = () => {
    clearTimeout(osdTimer)
    osdTimer = setTimeout(() => {
      ui.osdChannel.classList.remove('is-on')
      ui.osdTitle.classList.remove('is-on')
    }, OSD_MS)
  }

  // ---- Changing the channel ------------------------------------------------------------
  async function changeChannel() {
    if (busy) return
    busy = true
    try {
      if (turn) finishTurn()
      const { game, reshuffled } = await api.nextDiscover(lineup, turn?.game.slug)
      await tuneTo(game, reshuffled)
    } finally {
      busy = false
    }
  }

  async function tuneTo(game, reshuffled) {
    const started = performance.now()
    const old = turn
    board.dataset.state = 'tuning'
    ui.start.hidden = true
    ui.review.hidden = true
    ui.channelUp.hidden = true
    old?.watcher?.stop()
    if (soundOn) hiss()
    // The old picture squeezes to a line, then snow while the next one tunes in.
    if (old && !reduceMotion) {
      old.frame.classList.add('is-leaving')
      await sleep(170)
    }
    snow.start()
    showOsd(`CH ${pad(game.channel)}`, reshuffled ? 'Seen them all. Reshuffling' : '')
    old?.frame.remove() // which also stops its sound
    board.classList.toggle('player--landscape', game.orientation === 'landscape')
    board.classList.toggle('player--portrait', game.orientation !== 'landscape')
    ui.ambient.hidden = !game.cover
    if (game.cover) ui.ambient.src = game.cover

    const frame = document.createElement('iframe')
    frame.className = 'player__frame'
    frame.title = `${game.title} (game)`
    frame.allow = 'fullscreen; autoplay; gamepad; accelerometer; gyroscope'
    frame.allowFullscreen = true
    const loaded = new Promise((resolve) => {
      frame.addEventListener('load', resolve, { once: true })
      setTimeout(resolve, MAX_TUNE_MS)
    })
    frame.src = game.url
    ui.stage.append(frame)
    turn = { game, frame, watcher: null, startedAt: 0, ended: null, reviewTimer: 0, score: null }
    paintInfo(game)

    await loaded
    const wait = MIN_STATIC_MS - (performance.now() - started)
    if (wait > 0) await sleep(wait)
    if (turn?.frame !== frame) return // the channel changed again meanwhile

    snow.stop()
    frame.classList.add('is-arriving')
    frame.addEventListener('animationend', () => frame.classList.remove('is-arriving'), { once: true })
    board.dataset.state = 'playing'
    ui.channelUp.hidden = false
    showOsd(`CH ${pad(game.channel)}`, game.title)
    hideOsdSoon()
    frame.focus()
    turn.startedAt = Date.now()
    turn.watcher = watchGameOver(frame, game, onGameOver)
    setHint(
      turn.watcher.canSee()
        ? 'Play until game over. The review pops up when your run ends.'
        : 'When your run ends, press Next channel to review it.',
    )
    api.recordPlay(game.slug)
    ui.announce.textContent = `Channel ${game.channel}: ${game.title}`
  }

  // Close out the turn that's ending: how long it lasted and how it ended.
  function finishTurn() {
    const { game, startedAt, ended, reviewTimer } = turn
    clearTimeout(reviewTimer)
    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0
    api.recordTurn(game.slug, { seconds, ended: ended ?? 'skip', recommend: api.myReview(game.slug) })
    paintHistory()
  }

  // ---- Game over and the review ------------------------------------------------------------
  function onGameOver({ score = null } = {}) {
    if (board.dataset.state !== 'playing' || !turn || turn.reviewTimer) return
    turn.ended = 'game-over'
    // Games on the Arcade Bridge send their score: keep it as a personal best.
    if (Number.isFinite(score)) {
      turn.score = score
      api.reportScore(turn.game.slug, score)
    }
    turn.reviewTimer = setTimeout(() => {
      turn.reviewTimer = 0
      if (board.dataset.state === 'playing') showReview('game-over')
    }, REVIEW_DELAY_MS)
  }

  function showReview(reason) {
    const { game } = turn
    clearTimeout(turn.reviewTimer)
    turn.reviewTimer = 0
    turn.ended ??= reason
    board.dataset.state = 'review'
    $('[data-review-over]', ui.review).textContent = turn.ended === 'game-over' ? 'Game over' : `Leaving CH ${pad(game.channel)}`
    $('[data-review-game]', ui.review).textContent = game.title
    const scoreLine = $('[data-review-score]', ui.review)
    scoreLine.hidden = !Number.isFinite(turn.score)
    if (Number.isFinite(turn.score)) scoreLine.textContent = `Score ${turn.score.toLocaleString()}`
    $('[data-review-page]', ui.review).href = game.page
    paintVerdict(api.myReview(game.slug))
    paintSave(api.isSaved(game.slug))
    ui.review.hidden = false
    ui.channelUp.hidden = true
    // Take focus back from the game so the review works from the keyboard.
    $('[data-verdict="up"]', ui.review).focus({ preventScroll: true })
  }

  function keepPlaying() {
    if (!turn || board.dataset.state !== 'review') return
    ui.review.hidden = true
    ui.channelUp.hidden = false
    turn.ended = null
    board.dataset.state = 'playing'
    turn.frame.focus()
  }

  const paintVerdict = (recommend) => {
    $('[data-verdict="up"]', ui.review).setAttribute('aria-pressed', String(recommend === true))
    $('[data-verdict="down"]', ui.review).setAttribute('aria-pressed', String(recommend === false))
  }
  const paintSave = (saved) => {
    $('[data-review-save]', ui.review).setAttribute('aria-pressed', String(saved))
    $('[data-review-save-text]', ui.review).textContent = saved ? 'Saved to my games' : 'Save to my games'
  }

  ui.review.addEventListener('click', (event) => {
    if (!turn) return
    const { slug } = turn.game
    const verdict = event.target.closest('[data-verdict]')
    if (verdict) {
      const want = verdict.dataset.verdict === 'up'
      const next = api.myReview(slug) === want ? null : want
      api.review(slug, next)
      paintVerdict(next)
    }
    if (event.target.closest('[data-review-save]')) paintSave(api.toggleSave(slug))
    if (event.target.closest('[data-next]')) changeChannel()
    if (event.target.closest('[data-keep-playing]')) keepPlaying()
  })

  // "Next channel" mid-run: review first, then the review's Next changes it.
  ui.channelUp.addEventListener('click', () => {
    if (board.dataset.state === 'playing') showReview('manual')
  })

  $('[data-start]', board).addEventListener('click', () => {
    board.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' })
    changeChannel()
  })

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
    if (event.target.closest?.('input, textarea, select')) return
    const state = board.dataset.state
    if ((event.key === 'n' || event.key === 'N') && state === 'review') {
      event.preventDefault()
      changeChannel()
    } else if ((event.key === 'n' || event.key === 'N') && state === 'playing') {
      event.preventDefault()
      showReview('manual')
    } else if (event.key === 'Escape' && state === 'review') {
      keepPlaying()
    }
  })

  // ---- Now playing and history --------------------------------------------------------------
  function setHint(text) {
    const hint = $('[data-hint]', ui.info)
    if (hint) hint.textContent = text
  }

  function paintInfo(game) {
    ui.number.textContent = pad(game.channel)
    ui.now.textContent = game.title
    ui.info.innerHTML = String(
      h`<a class="discover-board__title" href="${game.page}">${game.title}</a>
        <span class="discover-board__meta">${game.genre} · by ${game.creator}</span>
        <span class="discover-board__hint" data-hint>Tuning in…</span>`,
    )
    ui.tab.href = game.url
    ui.tab.hidden = false
  }

  function paintHistory() {
    const recent = api
      .discoverHistory()
      .filter((entry) => bySlug.has(entry.slug))
      .slice(0, 8)
    ui.history.hidden = !recent.length
    ui.historyList.innerHTML = String(
      h`${recent.map((entry) => {
        const game = bySlug.get(entry.slug)
        const verdict = entry.recommend === true ? 'Recommended' : entry.recommend === false ? 'Not for me' : 'No review'
        return h`<li class="discover-history__item">
          <a href="${game.page}">
            ${game.cover ? h`<img src="${game.cover}" alt="" width="600" height="800" loading="lazy" />` : ''}
            <span class="discover-history__text">
              <span class="discover-history__name">${game.title}</span>
              <span class="discover-history__verdict discover-history__verdict--${entry.recommend === true ? 'up' : entry.recommend === false ? 'down' : 'none'}">${verdict}</span>
            </span>
          </a>
        </li>`
      })}`,
    )
  }

  paintHistory()
}
