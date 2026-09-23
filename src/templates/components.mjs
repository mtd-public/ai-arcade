import { html } from './html.mjs'
import { sortGames } from '../static/js/ranking.js'

// Stroke icons on a 24px grid, drawn like the portfolio's icons.jsx.
const paths = {
  github: html`<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.53 9.53 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.57.69.48A10 10 0 0 0 12 2Z"/>`,
  menu: html`<path d="M4 7h16M4 12h16M4 17h16"/>`,
  close: html`<path d="M6 6l12 12M18 6 6 18"/>`,
  play: html`<path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/>`,
  external: html`<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,
  expand: html`<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`,
  search: html`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
  chevron: html`<path d="m9 6 6 6-6 6"/>`,
  chevronLeft: html`<path d="m15 6-6 6 6 6"/>`,
  chevronDown: html`<path d="m6 9 6 6 6-6"/>`,
  mail: html`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  chat: html`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/>`,
  rocket: html`<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1Z"/><path d="M12 15 9 12a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
  phone: html`<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>`,
  keyboard: html`<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>`,
  up: html`<path d="M12 5 5 13h4.5v6h5v-6H19Z"/>`,
  down: html`<path d="M12 19 5 11h4.5V5h5v6H19Z"/>`,
  fire: html`<path d="M12 3c.6 3-1.5 4.6-2.8 6.3C8 11 7 12.6 7 14.7A5 5 0 0 0 17 15c0-2.4-1.2-4.2-2.2-5.4-.3 1.3-1 2.2-2 2.6.4-3.3-.3-6.6-.8-9.2Z"/>`,
  sparkle: html`<path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="m12 8 1.4 2.6L16 12l-2.6 1.4L12 16l-1.4-2.6L8 12l2.6-1.4Z"/>`,
  star: html`<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z"/>`,
  chart: html`<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>`,
  sortAz: html`<path d="M4 16l3.5-9L11 16M5.2 13h4.6"/><path d="M14 7h6l-6 9h6"/>`,
  list: html`<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>`,
  grid: html`<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>`,
  bookmark: html`<path d="M6 4h12v17l-6-4-6 4Z"/>`,
  share: html`<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5"/>`,
  trophy: html`<path d="M8 4h8v5a4 4 0 0 1-8 0Z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9.5 17h5"/>`,
  image: html`<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 8"/>`,
  film: html`<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 9h18M3 15h18M8 5v4M16 5v4M8 15v4M16 15v4"/>`,
  users: html`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 6 4.8"/>`,
  user: html`<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`,
  bot: html`<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M8 13h.01M16 13h.01M9 17h6"/><circle cx="12" cy="3.5" r="1"/>`,
  plus: html`<path d="M12 5v14M5 12h14"/>`,
  upload: html`<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>`,
  link: html`<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>`,
  trash: html`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`,
  check: html`<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  info: html`<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>`,
  flag: html`<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>`,
  code: html`<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>`,
  file: html`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>`,
  lock: html`<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`,
  gamepad: html`<path d="M6.5 8h11A4.5 4.5 0 0 1 22 12.5v1a3.5 3.5 0 0 1-6.3 2.1L14.5 14h-5l-1.2 1.6A3.5 3.5 0 0 1 2 13.5v-1A4.5 4.5 0 0 1 6.5 8Z"/><path d="M7 11v3M5.5 12.5h3M16 11.5h.01M18 13.5h.01"/>`,
  eye: html`<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
  reply: html`<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 6 6v4"/>`,
  tv: html`<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="m8.5 3 3.5 4 3.5-4"/>`,
  thumbUp: html`<path d="M7 11v9H4.5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"/><path d="m7 11 3.8-6.6a2.1 2.1 0 0 1 3.9 1.4L14 10h5a2 2 0 0 1 2 2.4l-1.3 6A2 2 0 0 1 17.7 20H7"/>`,
  thumbDown: html`<path d="M17 13V4h2.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1Z"/><path d="m17 13-3.8 6.6a2.1 2.1 0 0 1-3.9-1.4L10 14H5a2 2 0 0 1-2-2.4l1.3-6A2 2 0 0 1 6.3 4H17"/>`,
  volume: html`<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.2 6.3a7.8 7.8 0 0 1 0 11.4"/>`,
  volumeOff: html`<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>`,
  next: html`<path d="M5 5.5v13l9-6.5Z"/><path d="M18 5.5v13"/>`,
  moon: html`<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z"/>`,
  sun: html`<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5"/>`,
}

export function icon(name, size = 20) {
  return html`<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`
}

// A gold arcade token. Decorative, so hidden from assistive tech.
export function coin(size = 32, className = 'coin') {
  return html`<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="14" fill="#ffd45c" stroke="#191333" stroke-width="2.5"/><circle cx="16" cy="16" r="9.6" fill="none" stroke="#c99a3d" stroke-width="1.8"/><path d="m16 10.6 1.65 3.35 3.7.54-2.68 2.6.63 3.68L16 19.03l-3.3 1.74.63-3.68-2.68-2.6 3.7-.54Z" fill="#c99a3d"/></svg>`
}

// The joystick mark used in the logo and favicon.
export function brandMark(size = 30) {
  return html`<svg class="brand__mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect width="32" height="32" rx="8" fill="#ffd45c"/><rect x="5" y="21" width="22" height="6" rx="3" fill="#191333"/><rect x="14.5" y="11" width="3" height="11" rx="1.5" fill="#191333"/><circle cx="16" cy="10.5" r="5.5" fill="#ff5a4f" stroke="#191333" stroke-width="1.8"/><circle cx="14.3" cy="8.8" r="1.5" fill="#ffc2bd"/></svg>`
}

const mainNav = (ctx) => [
  { href: ctx.href(), label: 'Arcade', icon: 'gamepad', match: (p) => p === '' || p.startsWith('games/') },
  { href: ctx.href('discover/'), label: 'Discover', icon: 'tv', match: (p) => p === 'discover/' },
  { href: ctx.href('leaderboards/'), label: 'Leaderboards', icon: 'trophy', match: (p) => p === 'leaderboards/' },
  { href: ctx.href('submit/'), label: 'Submit a game', icon: 'upload', match: (p) => p === 'submit/' },
  { href: ctx.href('guidelines/'), label: 'Guidelines', icon: 'file', match: (p) => p === 'guidelines/' },
  { href: ctx.href('about/'), label: 'About', icon: 'info', match: (p) => p === 'about/' },
]

export function siteHeader(ctx, page) {
  const { site } = ctx
  return html`
    <header class="topbar" data-topbar>
      <div class="topbar__main">
        <div class="container topbar__inner">
          <a href="${ctx.href()}" class="brand" aria-label="${site.name} home">
            ${brandMark()}
            <span class="brand__name">${site.name}</span>
          </a>
          <form class="topsearch" role="search" action="${ctx.href()}" method="get" data-topsearch>
            <label class="visually-hidden" for="site-search">Search games</label>
            ${icon('search', 18)}
            <input id="site-search" name="q" type="search" placeholder="Search games, genres, tags" autocomplete="off" enterkeyhint="search" />
            <kbd class="topsearch__key" aria-hidden="true">/</kbd>
          </form>
          <div class="topbar__actions">
            <a class="btn btn--gold btn--sm topbar__submit" href="${ctx.href('submit/')}">${icon('plus', 16)} Submit</a>
            <button class="btn btn--dark btn--sm topbar__signin" type="button" data-sign-in>${icon('user', 16)} Sign in</button>
            <button class="topbar__icon topbar__theme" type="button" aria-label="Dark mode" aria-pressed="false" data-theme-toggle>
              <span class="topbar__theme-moon">${icon('moon', 19)}</span>
              <span class="topbar__theme-sun">${icon('sun', 19)}</span>
            </button>
            <button class="topbar__icon" type="button" aria-label="Search" aria-expanded="false" data-search-toggle>${icon('search', 20)}</button>
            <button class="topbar__icon topbar__menu" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu" data-nav-toggle>
              <span class="topbar__menu-open">${icon('menu', 22)}</span>
              <span class="topbar__menu-close">${icon('close', 22)}</span>
            </button>
          </div>
        </div>
      </div>
      <nav class="subnav" id="site-menu" aria-label="Main">
        <div class="container subnav__inner">
          ${mainNav(ctx).map(
            (l) => html`<a class="subnav__link" href="${l.href}"${l.match(page.path) ? html` aria-current="page"` : ''}>${icon(l.icon, 17)} ${l.label}</a>`,
          )}
          <span class="subnav__hud" aria-hidden="true">${coin(16)} <span class="hud__blink">Free play</span></span>
          <div class="subnav__mobile-actions">
            <a class="btn btn--gold" href="${ctx.href('submit/')}">${icon('plus', 18)} Submit a game</a>
            <button class="btn btn--ghost" type="button" data-sign-in>${icon('user', 18)} Sign in</button>
          </div>
        </div>
      </nav>
      <div class="scroll-progress" data-scroll-progress></div>
    </header>`
}

// Shown on every page while preview mode is on (arcade.js unhides it), and a
// dismissible note on community pages explaining what's live today.
export function notices(ctx, page) {
  return html`
    <div class="notice notice--preview" data-preview-banner hidden>
      <div class="container notice__inner">
        <span class="notice__tag">Preview mode</span>
        <span>You're seeing <strong>sample data</strong> and features that aren't live yet. None of these votes, players, comments or scores are real.</span>
        <a class="notice__link" href="?preview=0" data-preview-exit>Exit preview</a>
      </div>
    </div>
    ${page.communityNotice &&
    html`<div class="notice notice--soft" data-community-notice hidden>
      <div class="container notice__inner">
        ${icon('info', 18)}
        <span>Community features are rolling out. Votes and saves are kept on this device until accounts launch.</span>
        <a class="notice__link" href="?preview=1">Preview them with sample data</a>
        <button class="notice__close" type="button" aria-label="Dismiss" data-notice-dismiss>${icon('close', 16)}</button>
      </div>
    </div>`}`
}

export function siteFooter(ctx) {
  const { site } = ctx
  return html`
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div class="site-footer__brand">
          <a href="${ctx.href()}" class="brand brand--footer">${brandMark(26)}<span class="brand__name">${site.name}</span></a>
          <p>${site.tagline}. Free to play, no downloads. Vote for your favorites and help the best games rise to the top.</p>
          <p class="site-footer__hud" aria-hidden="true">${coin(18)} <span class="hud__blink">Insert coin</span> <span class="site-footer__hud-dim">Free play</span></p>
        </div>
        <nav class="site-footer__col" aria-label="Arcade">
          <h2>Arcade</h2>
          <a href="${ctx.href()}?sort=hot#feed">Hot games</a>
          <a href="${ctx.href()}?sort=new#feed">New games</a>
          <a href="${ctx.href('discover/')}">Discover mode</a>
          <a href="${ctx.href('leaderboards/')}">Leaderboards</a>
        </nav>
        <nav class="site-footer__col" aria-label="Community">
          <h2>Community</h2>
          <a href="${ctx.href('submit/')}">Submit a game</a>
          <a href="${ctx.href('submit/')}?kind=media">Share a clip</a>
          <a href="${ctx.href('guidelines/')}">Guidelines</a>
        </nav>
        <nav class="site-footer__col" aria-label="Site">
          <h2>Site</h2>
          <a href="${ctx.href('about/')}">About</a>
          <a href="${ctx.href('contact/')}">Contact</a>
          <a href="${ctx.href('privacy/')}">Privacy</a>
        </nav>
        <p class="site-footer__legal">
          &copy; ${ctx.year} <a href="${site.owner.url}">${site.owner.name}</a>. Games are made with ${ctx.aiToolsText} and other AI tools by their creators.
        </p>
      </div>
    </footer>`
}

export function categoryBadge(ctx, game) {
  return html`<span class="badge" style="--accent: ${game.accent}; --tint: ${game.tint}">${ctx.categories[game.category]}</span>`
}

// The cover screenshot, or a coloured title plate when a game has none yet.
export function cover(ctx, game, { eager = false, className = 'cover' } = {}) {
  if (!game.cover) {
    return html`<span class="${className} cover--plate" style="--accent: ${game.accent}; --tint: ${game.tint}" role="img" aria-label="${game.title}"><span>${game.title}</span></span>`
  }
  return html`<img class="${className}" src="${ctx.asset(game.cover)}" alt="Screenshot of ${game.title}" width="600" height="800" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async" />`
}

// The front of an arcade cabinet: backlit marquee, CRT screen, control deck.
// `title` is the marquee element (a heading in some places, a span elsewhere).
export function cabinet(ctx, game, { title, eager = false, door = false, badge = '' } = {}) {
  return html`
    <div class="cabinet${game.title.length > 15 ? ' cabinet--long-title' : ''}" style="--accent: ${game.accent}; --tint: ${game.tint}">
      ${title ?? html`<span class="cabinet__marquee"><span>${game.title}</span></span>`}
      <div class="cabinet__bezel">
        <div class="cabinet__screen">
          ${cover(ctx, game, { eager })}
          ${badge}
        </div>
      </div>
      <div class="cabinet__deck" aria-hidden="true">
        <span class="cabinet__stick"></span>
        <span class="cabinet__buttons"><i></i><i></i><i></i></span>
      </div>
      ${door &&
      html`<div class="cabinet__door" aria-hidden="true">
        <span class="cabinet__slot"><b>25¢</b></span><span class="cabinet__slot"><b>25¢</b></span>
        <span class="cabinet__insert">Insert coin</span>
      </div>`}
    </div>`
}

// Up/down voting. Anything inside [data-vote] with data-dir is a vote button;
// arcade.js keeps every widget for the same game in sync.
export function voteBox(game, { size = 'row' } = {}) {
  return html`
    <div class="vote vote--${size}" data-vote="${game.slug}">
      <button class="vote__btn vote__btn--up" type="button" data-dir="1" aria-pressed="false" aria-label="Upvote ${game.title}">${icon('up', size === 'big' ? 22 : 18)}</button>
      <span class="vote__score" data-score aria-live="polite">Vote</span>
      ${size === 'big' && html`<span class="vote__label">votes</span>`}
      <button class="vote__btn vote__btn--down" type="button" data-dir="-1" aria-pressed="false" aria-label="Downvote ${game.title}">${icon('down', size === 'big' ? 22 : 18)}</button>
    </div>`
}

export function saveButton(game, { label = true, className = 'stat stat--btn' } = {}) {
  return html`<button class="${className}" type="button" data-save="${game.slug}" aria-pressed="false" aria-label="Save ${game.title}" title="Save">${icon('bookmark', 16)}${label && html` <span data-save-label>Save</span>`}</button>`
}

export function shareButton(ctx, game, { label = true, className = 'stat stat--btn' } = {}) {
  return html`<button class="${className}" type="button" data-share="${ctx.abs(`games/${game.slug}/`)}" data-share-title="${game.title}" aria-label="Share ${game.title}" title="Share">${icon('share', 16)}${label && html` Share`}</button>`
}

// One game in the home feed. The same markup renders as a Reddit-style row
// (list view) or an arcade cabinet (grid view); CSS switches between them.
export function feedItem(ctx, game, { rank, eager = false } = {}) {
  const url = ctx.href(`games/${game.slug}/`)
  const search = [game.title, game.tagline, ctx.categories[game.category], game.creator?.name, ...(game.tags ?? [])].join(' ').toLowerCase()
  return html`
    <li class="feed-item" data-feed-item data-slug="${game.slug}" data-title="${game.title}" data-added="${game.added}" data-category="${game.category}" data-search="${search}" style="--accent: ${game.accent}; --tint: ${game.tint}">
      ${rank != null && html`<span class="feed-item__rank" data-rank aria-hidden="true">${rank}</span>`}
      ${voteBox(game)}
      <a class="feed-item__thumb" href="${url}" tabindex="-1" aria-hidden="true">
        ${cabinet(ctx, game, {
          eager,
          badge: html`${ctx.isNew(game) && html`<span class="game-card__new">New!</span>`}<span class="game-card__press">Press start</span>`,
        })}
      </a>
      <div class="feed-item__body">
        <h3 class="feed-item__title"><a href="${url}">${game.title}</a></h3>
        <p class="feed-item__tagline">${game.tagline}</p>
        <p class="feed-item__meta">
          ${categoryBadge(ctx, game)}
          <span>by ${game.creator.name}</span>
          <span aria-hidden="true">·</span>
          <time datetime="${game.added}" data-relative>${game.added}</time>
          ${ctx.isNew(game) && html`<span class="pill pill--new">New</span>`}
          ${game.ai.copilot && html`<span class="pill pill--ai">${icon('sparkle', 13)} Co-pilot</span>`}
          ${game.ai.coop && html`<span class="pill pill--ai">${icon('users', 13)} Co-op AI</span>`}
        </p>
        <div class="feed-item__stats">
          <a class="stat" href="${url}#comments">${icon('chat', 16)} <span data-stat="comments">Comments</span></a>
          <span class="stat stat--minor" data-stat-wrap="plays" hidden>${icon('eye', 16)} <span data-stat="plays"></span></span>
          ${game.achievements.length > 0 && html`<a class="stat stat--minor" href="${url}#achievements" title="${game.achievements.length} achievements">${icon('trophy', 16)} ${game.achievements.length}<span class="visually-hidden"> achievements</span></a>`}
          <a class="stat stat--minor" href="${url}#media" data-stat-wrap="clips" hidden>${icon('film', 16)} <span data-stat="clips"></span></a>
          <span class="feed-item__tools">
            ${saveButton(game, { label: false, className: 'stat stat--btn stat--icon' })}
            ${shareButton(ctx, game, { label: false, className: 'stat stat--btn stat--icon' })}
          </span>
        </div>
      </div>
      <a class="btn btn--gold btn--sm feed-item__play" href="${url}#play">${icon('play', 15)} Play</a>
    </li>`
}

// The sidebar's top five: "Trending this week" when there's community data,
// "Just added" otherwise. Every other game is rendered (the rest hidden) so the
// page script can re-rank them when data loads; see rankTopList in render.js.
export function trendingCard(ctx, { exclude = '', limit = 5 } = {}) {
  const games = sortGames(
    ctx.games.filter((g) => g.slug !== exclude),
    ctx.community,
    ctx.hasData ? 'hot' : 'new',
    ctx.now,
  )
  return html`
    <section class="side-card" data-top5 data-limit="${limit}">
      <h2 class="side-card__title">${icon('fire', 18)} <span data-top5-title>${ctx.hasData ? 'Trending this week' : 'Just added'}</span> <span class="sample-tag">Sample</span></h2>
      <ol class="toplist" data-top5-list>
        ${games.map(
          (game, i) => html`
            <li class="toplist__item" data-slug="${game.slug}" data-title="${game.title}" data-added="${game.added}"${i >= limit ? html` hidden` : ''}>
              <span class="toplist__rank" data-toplist-rank>${i + 1}</span>
              <img class="toplist__thumb" src="${ctx.asset(game.cover)}" alt="" width="600" height="800" loading="lazy" decoding="async" />
              <span class="toplist__text">
                <a class="toplist__title" href="${ctx.href(`games/${game.slug}/`)}">${game.title}</a>
                <span class="toplist__meta">${ctx.categories[game.category]}</span>
              </span>
              <span class="toplist__score" data-toplist-score></span>
            </li>`,
        )}
      </ol>
    </section>`
}

export function emptyState({ iconName = 'info', title, body, action = '' }) {
  return html`
    <div class="empty">
      <span class="empty__icon">${icon(iconName, 22)}</span>
      <p class="empty__title">${title}</p>
      ${body && html`<p class="empty__body">${body}</p>`}
      ${action}
    </div>`
}

// A section heading with an optional "Sample" tag that shows in preview mode.
export function sectionTitle(text, { id, sample = false, level = 2, count = '' } = {}) {
  const inner = html`${text}${count && html` <span class="section-title__count" data-count>${count}</span>`}${sample && html` <span class="sample-tag">Sample</span>`}`
  return level === 2
    ? html`<h2 class="section-title"${id ? html` id="${id}"` : ''}>${inner}</h2>`
    : html`<h3 class="section-title section-title--sm"${id ? html` id="${id}"` : ''}>${inner}</h3>`
}

// One ad unit. Renders the real AdSense unit when a publisher ID and slot ID
// are configured, a labelled placeholder while testing, or nothing.
export function adSlot(ctx, name, { label = 'Advertisement', className = '' } = {}) {
  const { ads } = ctx
  const slotId = ads.slots?.[name]
  if (ads.client && slotId) {
    return html`
      <aside class="ad-slot ${className}" aria-label="${label}">
        <p class="ad-slot__label">${label}</p>
        <ins class="adsbygoogle" style="display:block" data-ad-client="${ads.client}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </aside>`
  }
  if (!ads.client && ads.showPlaceholders) {
    return html`
      <aside class="ad-slot ad-slot--placeholder ${className}" aria-hidden="true">
        <p class="ad-slot__label">Ad space · <code>${name}</code></p>
        <p class="ad-slot__hint">Where an AdSense unit goes once it's set up. See docs/ADSENSE.md.</p>
      </aside>`
  }
  return ''
}
