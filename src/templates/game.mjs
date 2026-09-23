import { formatDate, html } from './html.mjs'
import { adSlot, categoryBadge, coin, emptyState, feedItem, icon, saveButton, sectionTitle, shareButton, trendingCard, voteBox } from './components.mjs'
import { LICENSES } from '../static/js/game-schema.js'

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

const MODES = [
  { id: 'solo', label: 'Solo', icon: 'user' },
  { id: 'copilot', label: 'AI co-pilot', icon: 'sparkle' },
  { id: 'coop', label: 'Co-op with AI', icon: 'users' },
]

// The in-page player. Without JavaScript (or with embed: false) the start
// button is a plain link that opens the game in a new tab; app.js swaps in an
// iframe, handles play modes, and listens for the Arcade Bridge.
function player(ctx, game) {
  const embed = game.embed !== false
  return html`
    <section id="play" class="player player--${game.orientation}" aria-label="Play ${game.title}" data-player data-slug="${game.slug}" data-copilot="${String(game.ai.copilot)}" data-coop="${String(game.ai.coop)}">
      <div class="player__top">
        <div class="modes" role="radiogroup" aria-label="Play mode" data-modes>
          ${MODES.map((mode) => {
            const supported = mode.id === 'solo' || game.ai[mode.id]
            return html`<button class="modes__option" type="button" role="radio" data-mode="${mode.id}" data-supported="${String(supported)}" aria-checked="${mode.id === 'solo' ? 'true' : 'false'}" tabindex="${mode.id === 'solo' ? '0' : '-1'}">${icon(mode.icon, 16)} ${mode.label}${!supported && html` <span class="modes__soon">Soon</span>`}</button>`
          })}
        </div>
        <p class="player__note" data-mode-note aria-live="polite"></p>
      </div>
      <div class="player__stage">
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
          <span class="player__p2" data-p2-badge hidden>${icon('bot', 15)} P2 · AI</span>
        </div>
        <aside class="copilot" data-copilot-panel hidden aria-label="AI co-pilot" data-tips="${JSON.stringify(game.tips ?? [])}">
          <div class="copilot__head">
            <span class="copilot__avatar">${icon('bot', 18)}</span>
            <span class="copilot__name" data-copilot-name>AI co-pilot</span>
            <span class="copilot__status" data-copilot-status>Standing by</span>
          </div>
          <ol class="copilot__log" data-copilot-log></ol>
          <div class="copilot__ask">
            <input type="text" placeholder="Ask the co-pilot (coming soon)" disabled aria-label="Ask the co-pilot" />
            <button class="btn btn--gold btn--sm" type="button" disabled>Ask</button>
          </div>
        </aside>
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

function gallery(ctx, game) {
  if (!game.screenshots.length) return emptyState({ iconName: 'image', title: 'No screenshots yet.' })
  return html`
    <ul class="gallery" data-gallery>
      ${game.screenshots.map(
        (shot, i) => html`
          <li>
            <button class="gallery__item${shot.width > shot.height ? ' gallery__item--wide' : ''}" type="button" data-gallery-index="${i}" data-full="${ctx.asset(shot.src)}" data-caption="${shot.caption}" data-width="${shot.width}" data-height="${shot.height}" aria-label="View screenshot: ${shot.caption}">
              <img src="${ctx.asset(shot.src)}" alt="${shot.caption}" width="${shot.width}" height="${shot.height}" loading="lazy" decoding="async" />
            </button>
          </li>`,
      )}
    </ul>`
}

function achievementList(game) {
  if (!game.achievements.length) {
    return emptyState({
      iconName: 'trophy',
      title: `${game.title} doesn't list achievements yet.`,
      body: 'Creators add achievements when they submit or update a game, and games can report unlocks to the arcade.',
    })
  }
  return html`
    <ul class="achievements">
      ${game.achievements.map(
        (a) => html`
          <li class="achievement" data-achievement="${a.id}">
            <span class="achievement__medal">${icon('trophy', 22)}</span>
            <div class="achievement__text">
              <p class="achievement__title">${a.title}</p>
              <p class="achievement__desc">${a.description}</p>
              <p class="achievement__rate" data-rate hidden><span class="meter"><i data-rate-bar></i></span> <span data-rate-text></span></p>
            </div>
            <span class="achievement__unlocked" data-unlocked hidden>${icon('check', 14)} Unlocked</span>
          </li>`,
      )}
    </ul>`
}

function buildKit(ctx, game) {
  const kit = game.resources
  if (!kit) {
    return html`
      ${emptyState({
        iconName: 'code',
        title: "The creator hasn't shared a build kit for this game.",
        body: 'Build kits are optional. When a creator shares one, this is where you find the source code, the prompts and agent files used to make the game, and its license.',
      })}
      <div class="kit kit--sample" data-kit-sample hidden>
        <p class="kit__example">Example of a shared build kit <span class="sample-tag">Sample</span></p>
        <ul class="kit__files">
          <li>${icon('code', 18)} <span>Source code</span> <span class="pill">MIT</span> <span class="kit__action">View source</span></li>
          <li>${icon('file', 18)} <span>CLAUDE.md: agent instructions</span> <span class="kit__action">Open</span></li>
          <li>${icon('chat', 18)} <span>Prompt log: 42 sessions</span> <span class="kit__action">Open</span></li>
          <li>${icon('file', 18)} <span>Design doc</span> <span class="kit__action">Open</span></li>
        </ul>
        <p class="kit__tools">Made with ${ctx.aiToolsText} and Blender</p>
      </div>`
  }
  return html`
    <div class="kit">
      <ul class="kit__files">
        ${kit.source &&
        html`<li>${icon('code', 18)} <span>Source code</span> ${kit.license && html`<span class="pill">${LICENSES[kit.license] ?? kit.license}</span>`} <a class="kit__action" href="${kit.source}" target="_blank" rel="noopener">View source ${icon('external', 14)}</a></li>`}
        ${(kit.files ?? []).map(
          (f) => html`<li>${icon('file', 18)} <span>${f.label}</span> <a class="kit__action" href="${f.url}" target="_blank" rel="noopener">Open ${icon('external', 14)}</a></li>`,
        )}
      </ul>
      ${kit.tools?.length > 0 && html`<p class="kit__tools">Made with ${kit.tools.join(', ')}</p>`}
      ${kit.notes && html`<p class="kit__notes">${kit.notes}</p>`}
    </div>`
}

export function gamePage(ctx, game) {
  const category = ctx.categories[game.category]
  const hasKeyboard = game.controls.some((c) => c.keyboard)
  const hasTouch = game.controls.some((c) => c.touch)
  const related = relatedGames(ctx, game)

  const content = html`
    <div class="container game-page" style="--accent: ${game.accent}; --tint: ${game.tint}">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="${ctx.href()}">Arcade</a>
        ${icon('chevron', 14)}
        <a href="${ctx.href()}?genre=${game.category}#feed">${category}</a>
        ${icon('chevron', 14)}
        <span aria-current="page">${game.title}</span>
      </nav>

      <header class="game-head">
        ${voteBox(game, { size: 'big' })}
        <div class="game-head__main">
          <p class="game-head__kicker">
            ${categoryBadge(ctx, game)}
            <span>by <a href="${game.creator.url}">${game.creator.name}</a></span>
            <span aria-hidden="true">·</span>
            <span>added <time datetime="${game.added}" data-relative>${formatDate(game.added)}</time></span>
            ${ctx.isNew(game) && html`<span class="pill pill--new">New</span>`}
          </p>
          <h1 class="game-head__title">${game.title}</h1>
          <p class="game-head__lede">${game.tagline}</p>
          <ul class="tag-list" aria-label="Tags">${(game.tags ?? []).map((t) => html`<li>${t}</li>`)}</ul>
        </div>
        <div class="game-head__actions">
          <a class="btn btn--gold" href="#play" data-play-now>${icon('play', 18)} Play now</a>
          ${saveButton(game, { className: 'btn btn--ghost btn--sm' })}
          ${shareButton(ctx, game, { className: 'btn btn--ghost btn--sm' })}
        </div>
      </header>

      <ul class="statbar" aria-label="At a glance">
        <li data-stat-wrap="plays" hidden>${icon('eye', 16)} <strong data-stat="plays"></strong></li>
        <li><a href="#comments">${icon('chat', 16)} <strong data-stat="comments">Comments</strong></a></li>
        <li data-stat-wrap="approval" hidden>${icon('up', 16)} <strong data-stat="approval"></strong></li>
        <li><a href="#media">${icon('image', 16)} <strong>${game.screenshots.length}</strong> screenshots</a></li>
        <li data-stat-wrap="clips" hidden><a href="#media">${icon('film', 16)} <strong data-stat="clips"></strong></a></li>
        ${game.achievements.length > 0 && html`<li><a href="#achievements">${icon('trophy', 16)} <strong>${game.achievements.length}</strong> achievements</a></li>`}
        <li>${icon(hasTouch ? 'phone' : 'keyboard', 16)} ${hasTouch && hasKeyboard ? 'Touch + keyboard' : hasTouch ? 'Touch' : 'Keyboard'}</li>
      </ul>

      ${player(ctx, game)}

      <nav class="section-nav" aria-label="On this page" data-section-nav>
        <a href="#overview">Overview</a>
        <a href="#how-to-play">How to play</a>
        <a href="#media">Media</a>
        <a href="#achievements">Achievements</a>
        <a href="#leaderboard">Leaderboard</a>
        <a href="#comments">Comments</a>
        <a href="#build-kit">Build kit</a>
      </nav>

      <div class="game-layout">
        <div class="game-layout__main">
          <section class="game-section prose" id="overview" aria-labelledby="overview-title">
            ${sectionTitle(`About ${game.title}`, { id: 'overview-title' })}
            ${game.description.map((p) => html`<p>${p}</p>`)}
          </section>

          <section class="game-section prose" id="how-to-play" aria-labelledby="how-title">
            ${sectionTitle('How to play', { id: 'how-title' })}
            ${controlsTable(game)}
            ${game.tips?.length > 0 &&
            html`
              <h3>Tips</h3>
              <ul class="tips">${game.tips.map((t) => html`<li>${t}</li>`)}</ul>`}
          </section>

          ${adSlot(ctx, 'gameContent')}

          <section class="game-section" id="media" aria-labelledby="media-title">
            ${sectionTitle('Screenshots', { id: 'media-title', count: String(game.screenshots.length) })}
            ${gallery(ctx, game)}
            <div class="clips" data-clips>
              ${sectionTitle('Gameplay clips', { level: 3, sample: true })}
              <div data-clips-body>
                ${emptyState({
                  iconName: 'film',
                  title: 'No gameplay clips yet.',
                  body: 'Recorded a great run? Share a YouTube link or a short clip, and it could be featured here.',
                  action: html`<a class="btn btn--ghost btn--sm" href="${ctx.href('submit/')}?kind=media&amp;game=${game.slug}">${icon('film', 16)} Share a clip</a>`,
                })}
              </div>
            </div>
          </section>

          <section class="game-section" id="achievements" aria-labelledby="achievements-title">
            ${sectionTitle('Achievements', { id: 'achievements-title', count: game.achievements.length ? String(game.achievements.length) : '' })}
            ${achievementList(game)}
          </section>

          <section class="game-section" id="leaderboard" aria-labelledby="leaderboard-title">
            ${sectionTitle('Leaderboard', { id: 'leaderboard-title', sample: true })}
            <p class="my-best" data-my-best hidden>${icon('user', 16)} Your best on this device: <strong data-my-best-score></strong></p>
            <div data-leaderboard-body>
              ${emptyState({ iconName: 'trophy', title: 'No scores yet.', body: `Scores appear here once ${game.title} reports them to the arcade.` })}
            </div>
            <a class="section-link" href="${ctx.href('leaderboards/')}?game=${game.slug}">All leaderboards ${icon('chevron', 14)}</a>
          </section>

          <section class="game-section" id="comments" aria-labelledby="comments-title">
            ${sectionTitle('Comments', { id: 'comments-title', sample: true })}
            <div class="composer">
              <span class="avatar avatar--ghost">${icon('user', 18)}</span>
              <button class="composer__prompt" type="button" data-sign-in>Sign in to join the conversation…</button>
            </div>
            <div data-comments-body>
              ${emptyState({ iconName: 'chat', title: 'No comments yet.', body: 'Comments open when accounts launch.' })}
            </div>
          </section>

          <section class="game-section" id="build-kit" aria-labelledby="kit-title">
            ${sectionTitle('Build kit', { id: 'kit-title' })}
            ${buildKit(ctx, game)}
          </section>
        </div>

        <aside class="game-layout__side" aria-label="Game details">
          <section class="side-card rating" data-vote="${game.slug}" data-rating>
            <h2 class="side-card__title">Coin-op or game over? <span class="sample-tag">Sample</span></h2>
            <div class="rating__meter" data-rating-meter hidden>
              <span class="rating__bar"><i data-rating-bar></i></span>
              <span class="rating__labels"><span data-rating-up></span><span data-rating-down></span></span>
            </div>
            <p class="rating__empty" data-rating-empty>No votes yet. Be the first.</p>
            <div class="rating__buttons">
              <button class="rating__btn rating__btn--up" type="button" data-dir="1" aria-pressed="false">${icon('up', 18)} Coin-op</button>
              <button class="rating__btn rating__btn--down" type="button" data-dir="-1" aria-pressed="false">${icon('down', 18)} Game over</button>
            </div>
            <p class="rating__total" data-rating-total></p>
          </section>

          <section class="side-card facts">
            <dl>
              <div><dt>Genre</dt><dd>${category}</dd></div>
              <div><dt>Creator</dt><dd><a href="${game.creator.url}">${game.creator.name}</a></dd></div>
              <div><dt>Plays on</dt><dd>Phone, tablet and desktop browsers</dd></div>
              <div><dt>Best held</dt><dd>${game.orientation === 'landscape' ? 'Sideways (landscape)' : 'Upright (portrait)'}</dd></div>
              <div><dt>AI play modes</dt><dd>${game.ai.copilot || game.ai.coop ? [game.ai.copilot && 'Co-pilot', game.ai.coop && 'Co-op'].filter(Boolean).join(' · ') : 'Coming soon'}</dd></div>
              ${game.builtWith?.length > 0 &&
              html`<div><dt>Built with</dt><dd><ul class="chip-list">${game.builtWith.map((b) => html`<li>${b}</li>`)}</ul></dd></div>`}
              <div><dt>Made with AI</dt><dd>${ctx.aiToolsText}</dd></div>
              ${game.added && html`<div><dt>Added</dt><dd><time datetime="${game.added}">${formatDate(game.added)}</time></dd></div>`}
            </dl>
          </section>

          ${trendingCard(ctx, { exclude: game.slug })}
        </aside>
      </div>

      <section class="related" aria-labelledby="more-games">
        <p class="section__eyebrow">Next stage</p>
        <h2 id="more-games" class="section__heading">More games</h2>
        <ol class="feed feed--grid feed--related">
          ${related.map((g) => feedItem(ctx, g))}
        </ol>
        ${adSlot(ctx, 'gameFooter')}
      </section>
    </div>

    <dialog class="lightbox" data-lightbox aria-label="Screenshots of ${game.title}">
      <form method="dialog" class="lightbox__frame">
        <button class="lightbox__close" value="close" aria-label="Close">${icon('close', 22)}</button>
        <figure class="lightbox__figure">
          <img data-lightbox-img alt="" />
          <figcaption><span data-lightbox-caption></span> <span class="lightbox__count" data-lightbox-count></span></figcaption>
        </figure>
        <button class="lightbox__nav lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Previous screenshot">${icon('chevronLeft', 26)}</button>
        <button class="lightbox__nav lightbox__nav--next" type="button" data-lightbox-next aria-label="Next screenshot">${icon('chevron', 26)}</button>
      </form>
    </dialog>`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.tagline,
    url: ctx.abs(`games/${game.slug}/`),
    image: game.cover ? ctx.abs(game.cover) : undefined,
    screenshot: game.screenshots.map((s) => ctx.abs(s.src)),
    genre: category,
    gamePlatform: 'Web browser',
    applicationCategory: 'Game',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: game.creator.name, url: game.creator.url },
  }

  return {
    page: {
      path: `games/${game.slug}/`,
      name: 'game',
      title: `${game.title}: play free in your browser`,
      description: game.tagline,
      image: game.og ?? game.cover,
      imageSize: game.og ? [1200, 630] : [600, 800],
      schema,
      communityNotice: true,
      bodyClass: 'page-game',
    },
    content,
  }
}
