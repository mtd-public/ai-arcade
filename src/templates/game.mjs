import { formatDate, html } from './html.mjs'
import { adSlot, categoryBadge, coin, gameCard, icon } from './components.mjs'

// Up to `count` other games, same genre first.
function relatedGames(ctx, game, count = 4) {
  const others = ctx.games.filter((g) => g.slug !== game.slug)
  const same = others.filter((g) => g.category === game.category)
  const rest = others.filter((g) => g.category !== game.category)
  return [...same, ...rest].slice(0, count)
}

function controlsTable(game) {
  if (!game.controls?.length) return ''
  return html`
    <div class="table-wrap">
      <table class="controls">
        <thead>
          <tr>
            <th scope="col">Action</th>
            <th scope="col"><span class="controls__head">${icon('phone', 16)} Touch</span></th>
            <th scope="col"><span class="controls__head">${icon('keyboard', 16)} Keyboard</span></th>
          </tr>
        </thead>
        <tbody>
          ${game.controls.map(
            (row) => html`
              <tr>
                <th scope="row">${row.action}</th>
                <td data-label="Touch">${row.touch || '—'}</td>
                <td data-label="Keyboard">${row.keyboard || '—'}</td>
              </tr>`,
          )}
        </tbody>
      </table>
    </div>`
}

// The in-page player. Without JavaScript (or with embed: false) the button is
// a plain link that opens the game in a new tab; arcade.js swaps in an iframe.
function player(ctx, game) {
  const embed = game.embed !== false
  return html`
    <section id="play" class="player player--${game.orientation}" aria-label="Play ${game.title}" data-player>
      <div class="player__screen" data-player-screen>
        <div class="player__poster" data-player-poster>
          ${game.cover && html`<img class="player__backdrop" src="${ctx.asset(game.cover)}" alt="" aria-hidden="true" width="600" height="800" loading="lazy" decoding="async" />`}
          <a
            class="player__start"
            href="${game.url}"
            target="_blank"
            rel="noopener"
            aria-label="${embed ? `Play ${game.title} here` : `Play ${game.title} in a new tab`}"
            ${embed && html`data-embed-src="${game.url}" data-embed-title="${game.title}"`}
          >
            <span class="player__slot" aria-hidden="true"></span>
            <span class="player__coin">${coin(92)}</span>
            <span class="player__start-label">Insert coin</span>
            <span class="player__start-sub">${embed ? 'Free play · starts right here' : 'Free play · opens in a new tab'}</span>
          </a>
          ${game.orientation === 'landscape' && html`<p class="player__hint">Best played in landscape. On a phone, turn it sideways or use full screen.</p>`}
        </div>
      </div>
      <div class="player__bar">
        <span class="player__bar-title"><span class="player__1up">1UP</span> ${game.title}</span>
        <div class="player__bar-actions">
          ${embed && html`<button type="button" class="chip-button" data-player-fullscreen hidden>${icon('expand', 16)} Full screen</button>`}
          <a class="chip-button" href="${game.url}" target="_blank" rel="noopener">${icon('external', 16)} New tab</a>
          ${embed && html`<button type="button" class="chip-button" data-player-close hidden>${icon('close', 16)} Close</button>`}
        </div>
      </div>
    </section>`
}

export function gamePage(ctx, game) {
  const { site } = ctx
  const related = relatedGames(ctx, game)
  const category = ctx.categories[game.category]

  const content = html`
    <div class="container">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${ctx.href()}">Arcade</a>
        ${icon('chevron', 14)}
        <a href="${ctx.href()}?genre=${game.category}#games">${category}</a>
        ${icon('chevron', 14)}
        <span aria-current="page">${game.title}</span>
      </nav>

      <header class="game-hero" style="--accent: ${game.accent}; --tint: ${game.tint}">
        <div class="game-hero__copy">
          ${categoryBadge(ctx, game)}
          <h1 class="game-hero__title">${game.title}</h1>
          <p class="game-hero__lede">${game.tagline}</p>
          <ul class="tag-list" aria-label="Tags">
            ${(game.tags ?? []).map((t) => html`<li>${t}</li>`)}
          </ul>
          <div class="game-hero__actions">
            <a class="btn btn--primary" href="#play" data-play-now>${icon('play', 18)} Play now</a>
            <a class="btn btn--ghost" href="${game.url}" target="_blank" rel="noopener">${icon('external', 18)} Open in a new tab</a>
          </div>
        </div>
      </header>

      ${player(ctx, game)}

      <div class="game-body">
        <div class="game-body__main">
          <section class="prose" aria-labelledby="about-game">
            <h2 id="about-game">About ${game.title}</h2>
            ${game.description.map((p) => html`<p>${p}</p>`)}
          </section>

          <section class="prose" aria-labelledby="how-to-play">
            <h2 id="how-to-play">How to play</h2>
            ${controlsTable(game)}
            ${game.tips?.length > 0 &&
            html`
              <h3>Tips</h3>
              <ul class="tips">
                ${game.tips.map((t) => html`<li>${t}</li>`)}
              </ul>`}
          </section>

          ${adSlot(ctx, 'gameContent')}
        </div>

        <aside class="facts" aria-label="Game details">
          <dl>
            <div><dt>Genre</dt><dd>${category}</dd></div>
            <div><dt>Plays on</dt><dd>Phone, tablet and desktop browsers</dd></div>
            <div><dt>Best held</dt><dd>${game.orientation === 'landscape' ? 'Sideways (landscape)' : 'Upright (portrait)'}</dd></div>
            <div><dt>Price</dt><dd>Free, no sign-up</dd></div>
            ${game.builtWith?.length > 0 &&
            html`<div><dt>Built with</dt><dd><ul class="chip-list">${game.builtWith.map((b) => html`<li>${b}</li>`)}</ul></dd></div>`}
            <div><dt>Made with AI</dt><dd>${ctx.aiToolsText}</dd></div>
            ${game.added && html`<div><dt>Added</dt><dd><time datetime="${game.added}">${formatDate(game.added)}</time></dd></div>`}
          </dl>
          ${game.repo &&
          html`<a class="btn btn--ghost btn--small facts__source" href="${game.repo}" target="_blank" rel="noopener">${icon('code', 18)} Source on GitHub</a>`}
        </aside>
      </div>

      <section class="related" aria-labelledby="more-games">
        <p class="section__eyebrow">Next stage</p>
        <h2 id="more-games" class="section__heading">More games</h2>
        <div class="games__grid games__grid--related">
          ${related.map((g) => gameCard(ctx, g))}
        </div>
        ${adSlot(ctx, 'gameFooter')}
      </section>
    </div>`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.tagline,
    url: ctx.abs(`games/${game.slug}/`),
    image: game.cover ? ctx.abs(game.cover) : undefined,
    genre: category,
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: site.owner.name, url: site.owner.url },
  }

  return {
    page: {
      path: `games/${game.slug}/`,
      title: `${game.title}: play free in your browser`,
      description: game.tagline,
      image: game.og ?? game.cover,
      imageSize: game.og ? [1200, 630] : [600, 800],
      schema,
      bodyClass: 'page-game',
    },
    content,
  }
}
