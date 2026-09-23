import { html } from './html.mjs'
import { adSlot, cabinet, categoryBadge, coin, emptyState, feedItem, icon, trendingCard, voteBox } from './components.mjs'
import { SORTS, sortGames } from '../static/js/ranking.js'

const sortIcons = { hot: 'fire', new: 'sparkle', top: 'star', played: 'chart', az: 'sortAz' }

const faqs = (ctx) => [
  {
    q: 'Are the games free?',
    a: html`Yes. Every game is free to play right in your browser, with no downloads, accounts or in-app purchases.`,
  },
  {
    q: 'How do games get to the top?',
    a: html`<strong>Hot</strong> ranks games on the last seven days of votes, plays and comments, on a scale that lets popular games rise without one hit burying everything, plus a boost for brand-new games that fades over two weeks. <strong>Top</strong> and <strong>Most played</strong> count all time. Voting works now; play counts and comments arrive with accounts.`,
  },
  {
    q: 'Can I submit my own game?',
    a: html`Yes, if you made it (with AI help or not) and it runs in a browser. Submissions open soon. You can prepare yours on the <a href="${ctx.href('submit/')}">submit page</a> today, and read the <a href="${ctx.href('guidelines/')}">guidelines</a> first.`,
  },
  {
    q: 'What are AI co-pilot and co-op modes?',
    a: html`Two ways to play with an AI. <strong>Co-pilot</strong> watches your run and suggests what to do next. <strong>Co-op</strong> puts an AI in control of player two. Each game switches them on once it supports them; you'll see the modes above the player on its page.`,
  },
  {
    q: 'Do they work on my phone?',
    a: html`They're designed for phones first, with on-screen thumbsticks and buttons, and most also support a keyboard on desktop. Each game page lists its controls.`,
  },
  {
    q: 'Where are my votes and saved games kept?',
    a: html`In your browser, on this device, until accounts launch. Nothing is sent to a server. See the <a href="${ctx.href('privacy/')}">privacy policy</a>.`,
  },
]

function spotlight(ctx) {
  const featured = ctx.games.filter((g) => g.featured)
  if (!featured.length) return ''
  return html`
    <div class="carousel" data-carousel aria-roledescription="carousel" aria-label="Featured games">
      ${featured.map((game, i) => {
        const url = ctx.href(`games/${game.slug}/`)
        return html`
          <article class="slide" data-slide aria-roledescription="slide" aria-label="${i + 1} of ${featured.length}: ${game.title}"${i ? html` hidden` : ''} style="--accent: ${game.accent}; --tint: ${game.tint}">
            <a class="slide__cabinet" href="${url}" tabindex="-1" aria-hidden="true">${cabinet(ctx, game, { door: true, eager: i === 0 })}</a>
            <div class="slide__body">
              <p class="slide__kicker"><span class="pill pill--gold">${icon('star', 14)} Featured</span> ${categoryBadge(ctx, game)}</p>
              <h2 class="slide__title"><a href="${url}">${game.title}</a></h2>
              <p class="slide__tagline">${game.tagline}</p>
              <div class="slide__meta">
                ${voteBox(game, { size: 'inline' })}
                <span>by ${game.creator.name}</span>
                ${game.achievements.length > 0 && html`<span>${icon('trophy', 15)} ${game.achievements.length} achievements</span>`}
                <span>${icon('image', 15)} ${game.screenshots.length} screenshots</span>
              </div>
              <div class="slide__actions">
                <a class="btn btn--gold" href="${url}#play">${icon('play', 17)} Play now</a>
                <a class="btn btn--dark" href="${url}">Game page ${icon('chevron', 16)}</a>
              </div>
            </div>
            <div class="slide__shots" aria-hidden="true">
              ${game.screenshots.slice(0, 2).map(
                (shot) => html`<a href="${url}#media" tabindex="-1"><img src="${ctx.asset(shot.src)}" alt="" width="${shot.width}" height="${shot.height}" loading="lazy" decoding="async" /></a>`,
              )}
            </div>
          </article>`
      })}
      ${featured.length > 1 &&
      html`<div class="carousel__controls">
        <button class="carousel__arrow" type="button" data-carousel-prev aria-label="Previous featured game">${icon('chevronLeft', 20)}</button>
        <div class="carousel__dots">
          ${featured.map(
            (game, i) => html`<button class="carousel__dot" type="button" data-carousel-dot="${i}" aria-label="Show ${game.title}" aria-current="${i === 0 ? 'true' : 'false'}"><img src="${ctx.asset(game.cover)}" alt="" width="600" height="800" loading="lazy" /></button>`,
          )}
        </div>
        <button class="carousel__arrow" type="button" data-carousel-next aria-label="Next featured game">${icon('chevron', 20)}</button>
      </div>`}
    </div>`
}

export function homePage(ctx) {
  const { games, categories } = ctx
  const ranked = sortGames(games, ctx.community, 'hot', ctx.now)
  const genres = Object.keys(categories)
    .map((key) => ({ key, label: categories[key], count: games.filter((g) => g.category === key).length }))
    .filter((c) => c.count > 0)

  return html`
    <section class="spotlight" aria-labelledby="spotlight-title">
      <div class="container spotlight__inner">
        <div class="spotlight__intro">
          <p class="hud">
            <span class="hud__item"><span class="hud__label">1UP</span><span class="hud__value">000000</span></span>
            <span class="hud__item"><span class="hud__label">Games</span><span class="hud__value">${String(games.length).padStart(2, '0')}</span></span>
            <span class="hud__item hud__blink">Free play</span>
          </p>
          <h1 id="spotlight-title" class="spotlight__title">The arcade for games made with AI</h1>
          <p class="spotlight__lede">Play free in your browser, vote for your favorites, and watch the best games rise to the top.</p>
        </div>
        ${spotlight(ctx)}
      </div>
      <span class="spotlight__floor" aria-hidden="true"></span>
    </section>

    <div class="container portal" id="feed">
      <div class="portal__main">
        <div class="feed-head">
          <h2 class="feed-head__title">All games <span class="feed-head__count" data-feed-count>${games.length}</span></h2>
          <div class="sort-tabs" role="group" aria-label="Sort games">
            ${SORTS.map((sort) => {
              const locked = sort.needsData && !ctx.hasData
              return html`<button class="sort-tab${sort.id === 'hot' ? ' is-active' : ''}" type="button" data-sort="${sort.id}" aria-pressed="${sort.id === 'hot' ? 'true' : 'false'}" title="${locked ? `${sort.hint}. Arrives with community data.` : sort.hint}"${locked ? html` disabled data-needs-data` : ''}>${icon(sortIcons[sort.id], 16)} ${sort.label}${locked && html` ${icon('lock', 13)}`}</button>`
            })}
          </div>
        </div>
        <div class="feed-filters">
          <label class="select">
            <span class="visually-hidden">Genre</span>
            <select data-genre>
              <option value="all">All genres</option>
              ${genres.map((g) => html`<option value="${g.key}">${g.label} (${g.count})</option>`)}
            </select>
            ${icon('chevronDown', 16)}
          </label>
          <button class="chip" type="button" data-saved-filter aria-pressed="false">${icon('bookmark', 15)} Saved</button>
          <p class="feed-status" data-feed-status aria-live="polite"></p>
          <div class="view-toggle" role="group" aria-label="Layout">
            <button type="button" data-view="list" aria-pressed="true" aria-label="List view" title="List view">${icon('list', 18)}</button>
            <button type="button" data-view="grid" aria-pressed="false" aria-label="Cabinet view" title="Cabinet view">${icon('grid', 18)}</button>
          </div>
        </div>

        <ol class="feed feed--list" data-feed>
          ${ranked.map((game, i) => feedItem(ctx, game, { rank: i + 1, eager: i < 3 }))}
        </ol>
        <div data-feed-empty hidden>
          ${emptyState({
            iconName: 'search',
            title: 'No games match.',
            body: 'Try another search or genre.',
            action: html`<button class="btn btn--ghost btn--sm" type="button" data-feed-clear>Show all games</button>`,
          })}
        </div>

        ${adSlot(ctx, 'homeFeed')}
      </div>

      <aside class="portal__side" aria-label="More from the arcade">
        <section class="side-card side-card--cta">
          ${coin(44)}
          <h2 class="side-card__heading">Made a game with AI?</h2>
          <p>Put it in the arcade. Players vote the best games to the top, and you can share clips, achievements and your build kit.</p>
          <a class="btn btn--gold" href="${ctx.href('submit/')}">${icon('upload', 17)} Submit your game</a>
          <a class="side-card__link" href="${ctx.href('guidelines/')}">Read the guidelines</a>
        </section>

        ${trendingCard(ctx)}

        <section class="side-card" data-players>
          <h2 class="side-card__title">${icon('trophy', 18)} Top players <span class="sample-tag">Sample</span></h2>
          <div data-players-body>
            ${emptyState({ iconName: 'trophy', title: 'No scores yet', body: 'Leaderboards fill up once games start reporting scores.' })}
          </div>
          <a class="side-card__link" href="${ctx.href('leaderboards/')}">All leaderboards ${icon('chevron', 14)}</a>
        </section>

        <section class="side-card" data-featured-clip hidden>
          <h2 class="side-card__title">${icon('film', 18)} Featured clip <span class="sample-tag">Sample</span></h2>
          <div data-featured-clip-body></div>
        </section>

        <section class="side-card">
          <h2 class="side-card__title">${icon('gamepad', 18)} Genres</h2>
          <ul class="genre-list">
            ${genres.map(
              (g) => html`<li><a href="${ctx.href()}?genre=${g.key}#feed" data-genre-link="${g.key}"><span>${g.label}</span><span class="genre-list__count">${g.count}</span></a></li>`,
            )}
          </ul>
        </section>

        ${adSlot(ctx, 'homeSidebar', { className: 'ad-slot--side' })}
      </aside>
    </div>

    <section id="faq" class="section faq">
      <div class="container faq__inner">
        <div class="faq__intro">
          <p class="section__eyebrow">Stage select · Questions</p>
          <h2 class="section__heading">Good to know</h2>
          <p>Something else on your mind? <a href="${ctx.href('contact/')}">Get in touch</a>.</p>
        </div>
        <div class="faq__list">
          ${faqs(ctx).map(
            (f) => html`
              <details class="faq__item">
                <summary>${f.q}</summary>
                <p>${f.a}</p>
              </details>`,
          )}
        </div>
      </div>
    </section>`
}
