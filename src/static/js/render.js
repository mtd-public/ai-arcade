// Markup for community data that arrives at runtime (clips, leaderboards,
// players, comments). Server-rendered pages ship an empty state in each spot;
// these replace it when there's something to show.

import { config } from './api.js'
import { sortGames } from './ranking.js'
import { $, $$, avatar, esc, fmt, full, h, timeAgo } from './ui.js'

const ICON = {
  play: '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>',
  up: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 5 13h4.5v6h5v-6H19Z"/></svg>',
  down: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 19 5 11h4.5V5h5v6H19Z"/></svg>',
  reply: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/></svg>',
  flag: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
}
const raw = (markup) => h([markup])

const MODES = { solo: 'Solo', copilot: 'Co-pilot', coop: 'Co-op' }

// Site-relative paths (img/...) need the base path; full URLs pass through.
export const assetUrl = (src) => (/^https?:\/\//.test(src) ? src : `${config.base ?? '/'}${src}`)

// A gameplay clip: poster + play button. The player itself (YouTube in
// privacy-enhanced mode, or an uploaded file) only loads on click; see app.js.
export function videoCard(clip, { big = false } = {}) {
  const poster = clip.poster ? assetUrl(clip.poster) : clip.youtubeId ? `https://i.ytimg.com/vi/${clip.youtubeId}/hqdefault.jpg` : ''
  return h`
    <div class="video${big ? ' video--big' : ''}" data-video data-youtube="${clip.youtubeId ?? ''}" data-src="${clip.src ?? ''}" data-title="${clip.title}">
      ${poster && h`<img class="video__poster" src="${poster}" alt="" loading="lazy" decoding="async" />`}
      <button class="video__play" type="button" aria-label="Play clip: ${clip.title}">
        <span class="video__play-icon">${raw(ICON.play)}</span>
      </button>
      ${clip.duration && h`<span class="video__duration">${clip.duration}</span>`}
      <span class="video__caption"><span>${clip.title}</span><span class="video__by">by ${clip.by}${clip.at && h` · ${timeAgo(clip.at)}`}</span></span>
    </div>`
}

// Re-rank a trending card (trendingCard in components.mjs): this week's
// hottest games when there's community data, newest first otherwise. Trending
// ranks on this week's activity, so the score shown is this week's votes.
export function rankTopList(card, c) {
  if (!card) return
  const list = $('[data-top5-list]', card)
  const limit = Number(card.dataset.limit) || 5
  const items = $$('[data-slug]', list).map((el) => ({ slug: el.dataset.slug, title: el.dataset.title, added: el.dataset.added, el }))
  const snapshot = { generatedAt: c.available ? 'now' : null, games: Object.fromEntries(items.map((g) => [g.slug, c.stats(g.slug)])) }
  $('[data-top5-title]', card).textContent = c.available ? 'Trending this week' : 'Just added'
  sortGames(items, snapshot, c.available ? 'hot' : 'new').forEach((g, i) => {
    list.append(g.el)
    g.el.hidden = i >= limit
    $('[data-toplist-rank]', g.el).textContent = i + 1
    const { week } = snapshot.games[g.slug]
    const net = week.up - week.down
    $('[data-toplist-score]', g.el).innerHTML =
      c.available && week.up + week.down
        ? String(h`<span title="Net upvotes this week">${net < 0 ? '▼' : '▲'} ${fmt(Math.abs(net))}</span><span class="visually-hidden"> net upvotes this week</span>`)
        : ''
  })
}

const medal = (rank) => h`<span class="medal${rank <= 3 ? ` medal--${rank}` : ''}">${rank}</span>`

export function scoreTable(entries) {
  return h`
    <table class="board">
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col" class="board__score">Score</th><th scope="col">Mode</th><th scope="col">When</th></tr></thead>
      <tbody>
        ${entries.map(
          (e) => h`<tr>
            <td class="board__rank">${medal(e.rank)}</td>
            <td><span class="board__player">${avatar(e.player, 'sm')} ${e.player}</span></td>
            <td class="board__score">${full(e.score)}</td>
            <td><span class="mode-badge mode-badge--${e.mode}">${MODES[e.mode] ?? e.mode}</span></td>
            <td class="board__when">${timeAgo(e.at)}</td>
          </tr>`,
        )}
      </tbody>
    </table>`
}

export function playersTable(players) {
  return h`
    <table class="board">
      <thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col" class="board__score">Points</th><th scope="col">Games</th></tr></thead>
      <tbody>
        ${players.map(
          (p) => h`<tr>
            <td class="board__rank">${medal(p.rank)}</td>
            <td><span class="board__player">${avatar(p.name, 'sm')} ${p.name}</span></td>
            <td class="board__score">${full(p.points)}</td>
            <td class="board__when">${p.games}</td>
          </tr>`,
        )}
      </tbody>
    </table>`
}

export function playersList(players) {
  return h`
    <ol class="players">
      ${players.slice(0, 5).map(
        (p) => h`<li class="players__item">
          <span class="players__rank">${p.rank}</span>
          ${avatar(p.name, 'sm')}
          <span class="players__text"><span class="players__name">${p.name}</span><span class="players__meta">${p.games} ${p.games === 1 ? 'game' : 'games'}</span></span>
          <span class="players__points">${full(p.points)}</span>
        </li>`,
      )}
    </ol>`
}

function comment(c) {
  return h`
    <li class="comment">
      ${avatar(c.by)}
      <div>
        <p class="comment__head"><span class="comment__name">${c.by}</span> <time class="comment__time" datetime="${c.at}">${timeAgo(c.at)}</time></p>
        <p class="comment__body">${c.body}</p>
        <div class="comment__actions">
          <button class="stat stat--btn" type="button" data-sign-in aria-label="Upvote">${raw(ICON.up)} ${c.score}</button>
          <button class="stat stat--btn" type="button" data-sign-in aria-label="Downvote">${raw(ICON.down)}</button>
          <button class="stat stat--btn" type="button" data-sign-in>${raw(ICON.reply)} Reply</button>
          <button class="stat stat--btn" type="button" data-sign-in>${raw(ICON.flag)} Report</button>
        </div>
        ${c.replies?.length > 0 && h`<ol class="comment__replies">${c.replies.map(comment)}</ol>`}
      </div>
    </li>`
}

export function commentList(comments, sort = 'top') {
  const sorted = [...comments].sort((a, b) => (sort === 'new' ? Date.parse(b.at) - Date.parse(a.at) : b.score - a.score))
  return h`
    <div class="comments-sort" role="group" aria-label="Sort comments">
      <button class="chip" type="button" data-comment-sort="top" aria-pressed="${String(sort === 'top')}">Top</button>
      <button class="chip" type="button" data-comment-sort="new" aria-pressed="${String(sort === 'new')}">New</button>
    </div>
    <ol class="comments">${sorted.map(comment)}</ol>`
}

export { esc }
