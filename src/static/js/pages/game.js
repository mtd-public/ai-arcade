// Game page: the in-page player (insert coin, full screen, play modes, the AI
// co-pilot panel, and the Arcade Bridge listener), the screenshot lightbox,
// the "on this page" nav, and the community sections: stats, clips,
// achievements, leaderboard and comments.

import * as api from '../api.js'
import { commentList, rankTopList, scoreTable, videoCard } from '../render.js'
import { $, $$, full, plural, reduceMotion, toast } from '../ui.js'

export async function init({ community }) {
  const player = $('[data-player]')
  if (!player) return
  const slug = player.dataset.slug
  const title = $('.game-head__title')?.textContent ?? slug

  const controls = initPlayer(player, slug, title)
  initModes(player, controls, title)
  initLightbox()
  initSectionNav()
  if (api.preview) $('[data-kit-sample]')?.removeAttribute('hidden')

  const c = await community
  rankTopList($('[data-top5]'), c)
  document.addEventListener('arcade:vote', () => rankTopList($('[data-top5]'), c))
  const s = c.stats(slug)
  const comments = $('.statbar [data-stat="comments"]')
  if (c.available) {
    if (comments) comments.textContent = plural(s.comments, 'comment')
    showStat('plays', plural(s.plays, 'play'))
    if (s.up + s.down) showStat('approval', `${Math.round((100 * s.up) / (s.up + s.down))}% coin-op`)
    if (s.clips) showStat('clips', plural(s.clips, 'clip'))
  }

  await Promise.all([renderClips(slug), renderAchievements(slug), renderLeaderboard(slug), renderComments(slug)])
}

function showStat(name, text) {
  const wrap = $(`.statbar [data-stat-wrap="${name}"]`)
  if (!wrap) return
  $(`[data-stat="${name}"]`, wrap).textContent = text
  wrap.hidden = false
}

// ---- Player --------------------------------------------------------------------

function initPlayer(player, slug, title) {
  const screen = $('[data-player-screen]', player)
  const start = $('[data-embed-src]', player)
  const fullscreenButton = $('[data-player-fullscreen]', player)
  const closeButton = $('[data-player-close]', player)
  const requestFullscreen = screen.requestFullscreen || screen.webkitRequestFullscreen
  let frame = null
  let mode = 'solo'
  const listeners = new Set()

  const gameOrigin = start ? new URL(start.dataset.embedSrc).origin : null

  const play = () => {
    if (!start || frame) return
    const url = new URL(start.dataset.embedSrc)
    // Games that support a play mode read it from the address (and the Bridge).
    if (mode !== 'solo' && player.dataset[mode] === 'true') url.searchParams.set('arcade_mode', mode)
    frame = document.createElement('iframe')
    frame.className = 'player__frame'
    frame.src = url.href
    frame.title = `${start.dataset.embedTitle} (game)`
    frame.allow = 'fullscreen; autoplay; gamepad; accelerometer; gyroscope'
    frame.allowFullscreen = true
    // Send keyboard input to the game as soon as it loads.
    frame.addEventListener('load', () => frame && frame.focus())
    screen.append(frame)
    player.classList.add('is-playing')
    if (fullscreenButton) fullscreenButton.hidden = !requestFullscreen
    if (closeButton) closeButton.hidden = false
    api.recordPlay(slug)
    listeners.forEach((fn) => fn('start'))
  }

  // Drop the coin in the slot, then start the game.
  const insertCoin = () => {
    if (frame || player.classList.contains('is-inserting')) return
    if (reduceMotion) return play()
    player.classList.add('is-inserting')
    setTimeout(play, 420)
  }

  const stop = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    frame?.remove()
    frame = null
    player.classList.remove('is-playing', 'is-inserting')
    if (fullscreenButton) fullscreenButton.hidden = true
    if (closeButton) closeButton.hidden = true
    start?.focus()
    listeners.forEach((fn) => fn('stop'))
  }

  start?.addEventListener('click', (event) => {
    event.preventDefault()
    insertCoin()
  })
  closeButton?.addEventListener('click', stop)
  fullscreenButton?.addEventListener('click', () => {
    const result = requestFullscreen?.call(screen)
    if (result?.catch) result.catch(() => window.open(start.dataset.embedSrc, '_blank', 'noopener'))
    frame?.focus()
  })

  // "Play now" in the page header scrolls to the player and starts the game.
  $$('[data-play-now]').forEach((link) =>
    link.addEventListener('click', (event) => {
      if (!start) return
      event.preventDefault()
      player.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      insertCoin()
    }),
  )

  // The Arcade Bridge: messages from the game in the frame we opened, and
  // nowhere else. See sdk/arcade-bridge.js and docs/PORTAL.md.
  window.addEventListener('message', (event) => {
    if (!frame || event.source !== frame.contentWindow || event.origin !== gameOrigin) return
    const message = event.data
    if (!message || message.source !== 'ai-arcade-game') return
    const payload = message.payload ?? {}
    if (message.type === 'ready') {
      frame.contentWindow.postMessage({ source: 'ai-arcade', version: 1, type: 'hello', payload: { mode } }, gameOrigin)
    } else if (message.type === 'score' && Number.isFinite(payload.score)) {
      api.reportScore(slug, payload.score, payload.mode ?? mode)
      showMyBest(slug)
      toast(`Score recorded: ${full(payload.score)}`)
    } else if (message.type === 'achievement' && payload.id) {
      const item = $(`[data-achievement="${CSS.escape(payload.id)}"]`)
      if (!item) return
      if (!api.unlocked(slug).includes(payload.id)) toast(`Achievement unlocked: ${$('.achievement__title', item).textContent}`)
      api.unlock(slug, payload.id)
      markUnlocked(slug)
    }
    listeners.forEach((fn) => fn(message.type, payload))
  })

  return {
    get playing() {
      return Boolean(frame)
    },
    setMode(next) {
      const changed = next !== mode
      mode = next
      // A supported mode takes effect on the next start.
      if (changed && frame && player.dataset[next] === 'true') {
        stop()
        insertCoin()
      }
    },
    on(fn) {
      listeners.add(fn)
    },
  }
}

// ---- Play modes: Solo, AI co-pilot, Co-op with AI -------------------------------

const MODE_COPY = {
  copilot: {
    name: 'AI co-pilot',
    status: 'Watching',
    intro: 'Your co-pilot watches the run and suggests what to do next.',
    unavailable: (title) => `AI co-pilot isn't available for ${title} yet. Games switch it on through the Arcade Bridge.`,
  },
  coop: {
    name: 'AI player two',
    status: 'Ready',
    intro: 'An AI takes control of player two and plays alongside you.',
    unavailable: (title) => `Co-op with AI isn't available for ${title} yet. Games switch it on through the Arcade Bridge.`,
  },
}

function initModes(player, controls, title) {
  const options = $$('[data-mode]', player)
  const note = $('[data-mode-note]', player)
  const panel = $('[data-copilot-panel]', player)
  const log = $('[data-copilot-log]', player)
  const badge = $('[data-p2-badge]', player)
  const tips = JSON.parse(panel?.dataset.tips || '[]')
  let tipTimer = null

  const say = (text, system = false) => {
    const item = document.createElement('li')
    item.className = `copilot__msg${system ? ' copilot__msg--system' : ''}`
    item.textContent = text
    log.append(item)
    log.scrollTop = log.scrollHeight
  }

  const stopTips = () => {
    clearInterval(tipTimer)
    tipTimer = null
  }

  // In preview mode, the co-pilot replays the game's own tips to show how
  // advice will appear. A real co-pilot would answer game state from the Bridge.
  const startTips = () => {
    stopTips()
    let i = 0
    const next = () => {
      if (!tips.length) return stopTips()
      say(tips[i % tips.length])
      i += 1
    }
    next()
    tipTimer = setInterval(next, 7000)
  }

  const openPanel = (mode, supported) => {
    const copy = MODE_COPY[mode]
    player.classList.add('has-panel')
    panel.hidden = false
    $('[data-copilot-name]', panel).textContent = copy.name
    $('[data-copilot-status]', panel).textContent = controls.playing ? copy.status : 'Standing by'
    log.replaceChildren()
    say(copy.intro, true)
    if (!supported) say("Preview: the AI isn't connected yet, so this shows how the panel will work.", true)
    badge.hidden = mode !== 'coop'
    if (mode === 'copilot' && controls.playing) startTips()
    else if (mode === 'copilot') say('Insert a coin to start, and tips will show up here.', true)
    else say('Player two joins when the game starts.', true)
  }

  const closePanel = () => {
    stopTips()
    player.classList.remove('has-panel')
    panel.hidden = true
    badge.hidden = true
  }

  let current = 'solo'
  const select = (option, { focus = false } = {}) => {
    const mode = option.dataset.mode
    const supported = option.dataset.supported === 'true'
    if (mode !== 'solo' && !supported && !api.preview) {
      note.textContent = MODE_COPY[mode].unavailable(title)
      return
    }
    current = mode
    options.forEach((o) => {
      const on = o === option
      o.setAttribute('aria-checked', String(on))
      o.tabIndex = on ? 0 : -1
    })
    if (focus) option.focus()
    note.textContent = mode === 'solo' ? '' : supported ? MODE_COPY[mode].intro : `Preview of ${MODE_COPY[mode].name.toLowerCase()}. Not live yet.`
    if (mode === 'solo') closePanel()
    else openPanel(mode, supported)
    controls.setMode(mode)
  }

  options.forEach((option) => option.addEventListener('click', () => select(option)))
  $('[data-modes]', player)?.addEventListener('keydown', (event) => {
    const i = options.indexOf(document.activeElement)
    if (i < 0) return
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    if (!step) return
    event.preventDefault()
    select(options[(i + step + options.length) % options.length], { focus: true })
  })

  controls.on((type) => {
    if (current === 'solo' || panel.hidden) return
    if (type === 'start') {
      $('[data-copilot-status]', panel).textContent = MODE_COPY[current].status
      if (current === 'copilot') startTips()
      else say('Player two is in. (Preview: the AI player connects once this game supports co-op.)', true)
    }
    if (type === 'stop') {
      stopTips()
      $('[data-copilot-status]', panel).textContent = 'Standing by'
    }
  })
}

// ---- Screenshot lightbox --------------------------------------------------------

function initLightbox() {
  const dialog = $('[data-lightbox]')
  const items = $$('[data-gallery-index]')
  if (!dialog || !items.length || !dialog.showModal) return
  const img = $('[data-lightbox-img]', dialog)
  const caption = $('[data-lightbox-caption]', dialog)
  const counter = $('[data-lightbox-count]', dialog)
  let current = 0

  const show = (index) => {
    current = (index + items.length) % items.length
    const item = items[current]
    img.src = item.dataset.full
    img.width = Number(item.dataset.width)
    img.height = Number(item.dataset.height)
    img.alt = item.dataset.caption
    caption.textContent = item.dataset.caption
    counter.textContent = `${current + 1} / ${items.length}`
  }

  items.forEach((item, i) =>
    item.addEventListener('click', () => {
      show(i)
      dialog.showModal()
    }),
  )
  $('[data-lightbox-prev]', dialog).addEventListener('click', () => show(current - 1))
  $('[data-lightbox-next]', dialog).addEventListener('click', () => show(current + 1))
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') show(current + 1)
    if (event.key === 'ArrowLeft') show(current - 1)
  })
  // Close when the backdrop (not the picture) is clicked.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('lightbox__frame')) dialog.close()
  })
  let startX = null
  dialog.addEventListener('pointerdown', (event) => (startX = event.clientX))
  dialog.addEventListener('pointerup', (event) => {
    if (startX == null) return
    const dx = event.clientX - startX
    startX = null
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1))
  })
}

// ---- "On this page" navigation ---------------------------------------------------

function initSectionNav() {
  const nav = $('[data-section-nav]')
  if (!nav || !('IntersectionObserver' in window)) return
  const links = $$('a', nav)
  const sections = links.map((a) => $(a.getAttribute('href'))).filter(Boolean)
  const setActive = (id) => {
    links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${id}`))
    const active = links.find((a) => a.classList.contains('is-active'))
    if (active) nav.scrollTo({ left: active.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' })
  }
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActive(visible[0].target.id)
    },
    { rootMargin: '-30% 0px -60% 0px' },
  )
  sections.forEach((section) => observer.observe(section))
}

// ---- Community sections ------------------------------------------------------------

async function renderClips(slug) {
  const clips = await api.clips({ game: slug })
  if (!clips.length) return
  const [featured, ...rest] = [...clips].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
  $('[data-clips-body]').innerHTML = `${videoCard(featured, { big: true })}${rest.length ? `<div class="clip-grid">${rest.map((c) => videoCard(c)).join('')}</div>` : ''}`
}

async function renderAchievements(slug) {
  const rates = await api.achievementRates(slug)
  for (const item of $$('[data-achievement]')) {
    const pct = rates[item.dataset.achievement]
    if (pct == null) continue
    $('[data-rate-bar]', item).style.width = `${pct}%`
    $('[data-rate-text]', item).textContent = `${pct}% of players`
    $('[data-rate]', item).hidden = false
  }
  markUnlocked(slug)
}

function markUnlocked(slug) {
  const unlocked = new Set(api.unlocked(slug))
  for (const item of $$('[data-achievement]')) {
    const on = unlocked.has(item.dataset.achievement)
    item.classList.toggle('is-unlocked', on)
    $('[data-unlocked]', item).hidden = !on
  }
}

function showMyBest(slug) {
  const best = api.myBest(slug)
  const box = $('[data-my-best]')
  if (!best || !box) return
  $('[data-my-best-score]', box).textContent = full(best.score)
  box.hidden = false
}

async function renderLeaderboard(slug) {
  showMyBest(slug)
  const entries = await api.leaderboard(slug)
  if (entries.length) $('[data-leaderboard-body]').innerHTML = String(scoreTable(entries))
}

async function renderComments(slug) {
  const comments = await api.comments(slug)
  if (!comments.length) return
  const body = $('[data-comments-body]')
  const total = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0)
  const heading = $('#comments-title')
  if (heading && !$('[data-count]', heading)) {
    const count = document.createElement('span')
    count.className = 'section-title__count'
    count.dataset.count = ''
    count.textContent = String(total)
    heading.insertBefore(count, $('.sample-tag', heading))
  }
  const draw = (sort) => {
    body.innerHTML = String(commentList(comments, sort))
    $$('[data-comment-sort]', body).forEach((btn) => btn.addEventListener('click', () => draw(btn.dataset.commentSort)))
  }
  draw('top')
}

