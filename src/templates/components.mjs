import { html } from './html.mjs'

// Stroke icons on a 24px grid, drawn like the portfolio's icons.jsx.
const paths = {
  github: html`<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.53 9.53 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .26.18.57.69.48A10 10 0 0 0 12 2Z"/>`,
  menu: html`<path d="M4 7h16M4 12h16M4 17h16"/>`,
  close: html`<path d="M6 6l12 12M18 6 6 18"/>`,
  play: html`<path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/>`,
  external: html`<path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>`,
  expand: html`<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`,
  shuffle: html`<path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 3.8C14.3 15 15.5 16 17.5 16H21"/><path d="m18 13 3 3-3 3"/><path d="M3 16h3.5c1.3 0 2.2-.4 3-1.1M13.5 8.1c.8-.7 1.7-1.1 3-1.1H21"/><path d="m18 4 3 3-3 3"/>`,
  search: html`<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>`,
  chevron: html`<path d="m9 6 6 6-6 6"/>`,
  mail: html`<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  chat: html`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>`,
  rocket: html`<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1Z"/><path d="M12 15 9 12a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2Z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>`,
  phone: html`<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>`,
  keyboard: html`<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>`,
}

export function icon(name, size = 20) {
  return html`<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]}</svg>`
}

const navLinks = (ctx) => [
  { href: `${ctx.href()}#games`, label: 'Games' },
  { href: `${ctx.href()}#how`, label: "How it's made" },
  { href: ctx.href('about/'), label: 'About' },
]

export function siteHeader(ctx) {
  const { site } = ctx
  return html`
    <header class="site-header">
      <div class="site-header__bar container">
        <div class="site-header__brand-group">
          <a href="${ctx.href()}" class="site-header__brand">${site.name}</a>
        </div>
        <nav class="site-header__nav site-header__nav--desktop" aria-label="Main">
          ${navLinks(ctx).map((l) => html`<a href="${l.href}">${l.label}</a>`)}
        </nav>
        <button class="site-header__toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-nav-toggle>
          <span class="site-header__toggle-open">${icon('menu', 22)}</span>
          <span class="site-header__toggle-close">${icon('close', 22)}</span>
        </button>
      </div>
      <nav id="mobile-nav" class="site-header__nav site-header__nav--mobile" aria-label="Main">
        ${navLinks(ctx).map((l) => html`<a href="${l.href}">${l.label}</a>`)}
        <a href="${ctx.href('contact/')}">Contact</a>
      </nav>
      <div class="scroll-progress" data-scroll-progress></div>
    </header>`
}

export function siteFooter(ctx) {
  const { site } = ctx
  return html`
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <div class="site-footer__brand">
          <a href="${ctx.href()}" class="site-header__brand">${site.name}</a>
          <p>${site.tagline}. Free to play, no downloads, no sign-up.</p>
        </div>
        <nav class="site-footer__nav" aria-label="Footer">
          <a href="${ctx.href()}#games">Games</a>
          <a href="${ctx.href('about/')}">About</a>
          <a href="${ctx.href('contact/')}">Contact</a>
          <a href="${ctx.href('privacy/')}">Privacy</a>
        </nav>
        <p class="site-footer__hud" aria-hidden="true">${coin(18)} <span>Insert coin</span> <span class="site-footer__hud-dim">Free play</span></p>
        <p class="site-footer__legal">
          &copy; ${ctx.year} <a href="${site.owner.url}">${site.owner.name}</a>. Every game here is original, made with ${ctx.aiToolsText}.
        </p>
      </div>
    </footer>`
}

export function categoryBadge(ctx, game) {
  return html`<span class="badge" style="--accent: ${game.accent}; --tint: ${game.tint}">${ctx.categories[game.category]}</span>`
}

// A gold arcade token. Decorative, so hidden from assistive tech.
export function coin(size = 32, className = 'coin') {
  return html`<svg class="${className}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="14" fill="#ffd45c" stroke="#191333" stroke-width="2.5"/><circle cx="16" cy="16" r="9.6" fill="none" stroke="#c99a3d" stroke-width="1.8"/><path d="m16 10.6 1.65 3.35 3.7.54-2.68 2.6.63 3.68L16 19.03l-3.3 1.74.63-3.68-2.68-2.6 3.7-.54Z" fill="#c99a3d"/></svg>`
}

// The front of an arcade cabinet: backlit marquee, CRT screen, control deck.
// `title` is the marquee element (a heading on cards, a span elsewhere).
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

// A game card for grids: a mini cabinet plus genre and tagline. The whole card is one link.
export function gameCard(ctx, game, { headingLevel = 3, eager = false } = {}) {
  const title =
    headingLevel === 2
      ? html`<h2 class="cabinet__marquee"><span>${game.title}</span></h2>`
      : html`<h3 class="cabinet__marquee"><span>${game.title}</span></h3>`
  const search = [game.title, game.tagline, ctx.categories[game.category], ...(game.tags ?? [])].join(' ').toLowerCase()
  return html`
    <article class="game-card" data-game-card data-category="${game.category}" data-search="${search}" style="--accent: ${game.accent}; --tint: ${game.tint}">
      <a class="game-card__link" href="${ctx.href(`games/${game.slug}/`)}">
        ${cabinet(ctx, game, {
          title,
          eager,
          badge: html`${ctx.isNew(game) && html`<span class="game-card__new">New!</span>`}<span class="game-card__press" aria-hidden="true">Press start</span>`,
        })}
        <div class="game-card__body">
          ${categoryBadge(ctx, game)}
          <p class="game-card__tagline">${game.tagline}</p>
        </div>
      </a>
    </article>`
}

// The cover screenshot, or a coloured title plate when a game has none yet.
export function cover(ctx, game, { eager = false, className = 'cover' } = {}) {
  if (!game.cover) {
    return html`<span class="${className} cover--plate" style="--accent: ${game.accent}; --tint: ${game.tint}" role="img" aria-label="${game.title}"><span>${game.title}</span></span>`
  }
  return html`<img class="${className}" src="${ctx.asset(game.cover)}" alt="Screenshot of ${game.title}" width="600" height="800" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async" />`
}

// One ad unit. Renders the real AdSense unit when a publisher ID and slot ID
// are configured, a labelled placeholder while testing, or nothing.
export function adSlot(ctx, name, { label = 'Advertisement' } = {}) {
  const { ads } = ctx
  const slotId = ads.slots?.[name]
  if (ads.client && slotId) {
    return html`
      <aside class="ad-slot" aria-label="${label}">
        <p class="ad-slot__label">${label}</p>
        <ins class="adsbygoogle" style="display:block" data-ad-client="${ads.client}" data-ad-slot="${slotId}" data-ad-format="auto" data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </aside>`
  }
  if (!ads.client && ads.showPlaceholders) {
    return html`
      <aside class="ad-slot ad-slot--placeholder" aria-hidden="true">
        <p class="ad-slot__label">Ad space · <code>${name}</code></p>
        <p class="ad-slot__hint">Where an AdSense unit goes once it's set up. See docs/ADSENSE.md.</p>
      </aside>`
  }
  return ''
}
