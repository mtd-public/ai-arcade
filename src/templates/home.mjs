import { html } from './html.mjs'
import { adSlot, cabinet, coin, gameCard, icon } from './components.mjs'

const steps = (ctx) => [
  {
    icon: 'idea',
    title: 'Start from a classic',
    body: "Every game begins as a short design doc: an arcade classic to riff on (Crazy Taxi, Marble Madness, Flappy Bird, Paperboy), one twist that makes it new, and controls that work with a thumb or two on a phone.",
  },
  {
    icon: 'chat',
    title: 'Build it with an AI pair programmer',
    body: `The code is written in conversation with AI coding agents (${ctx.aiToolsText}), then playtested and tuned over many rounds. The art is procedural too: the 3D models, pixel sprites and sound effects are generated in code rather than drawn or recorded.`,
  },
  {
    icon: 'rocket',
    title: 'Ship it as a web page',
    body: 'Each game is a static web page. There is nothing to install, no account to make, and the same build runs on phones, tablets and desktops. The source for every game is open on GitHub.',
  },
]

const faqs = (ctx) => [
  {
    q: 'Are the games free?',
    a: html`Yes. Every game is free to play right in your browser, with no downloads, accounts or in-app purchases.`,
  },
  {
    q: 'Do they work on my phone?',
    a: html`They're designed for phones first, with on-screen thumbsticks and buttons, and most also support a keyboard on desktop. Each game page lists its controls.`,
  },
  {
    q: 'Where are my high scores saved?',
    a: html`Games that remember a best score keep it in your browser's local storage on your own device. Nothing is sent to a server, and clearing your browser data resets it.`,
  },
  {
    q: 'What does "built with AI" mean here?',
    a: html`Each game's code was written with AI coding assistants (${ctx.aiToolsText}), directed, reviewed and playtested by a human designer. <a href="${ctx.href('about/')}">Read more about how the arcade is made.</a>`,
  },
  {
    q: 'Can I see the code?',
    a: html`Yes. Every game page links to its source on <a href="${ctx.site.owner.github}">GitHub</a>.`,
  },
]

export function homePage(ctx) {
  const { games, categories, site } = ctx
  const featured = games.filter((g) => g.featured).slice(0, 3)
  const counts = Object.keys(categories)
    .map((key) => ({ key, label: categories[key], count: games.filter((g) => g.category === key).length }))
    .filter((c) => c.count > 0)
  const randomTargets = games.map((g) => ctx.href(`games/${g.slug}/`)).join(' ')

  return html`
    <section class="hero">
      <div class="container hero__inner">
        <div class="hero__copy">
          <p class="hud">
            <span class="hud__item"><span class="hud__label">1UP</span><span class="hud__value">000000</span></span>
            <span class="hud__item"><span class="hud__label">Games</span><span class="hud__value">${String(games.length).padStart(2, '0')}</span></span>
            <span class="hud__item hud__blink">Free play</span>
          </p>
          <p class="hero__eyebrow">${site.tagline}</p>
          <h1 class="hero__title">Pick a cabinet. Press start.</h1>
          <p class="hero__lede">
            Original arcade games you can play in a browser tab: submarine shooters, a marble run through Hell, an ambulance with a pizza habit, and more. Each one was designed by ${site.owner.name} and built with AI.
          </p>
          <div class="hero__actions">
            <a class="btn btn--primary" href="#games">Browse games</a>
            <a class="btn btn--ghost" href="#games" data-random="${randomTargets}">${coin(22)} Insert coin <span class="btn__note">random game</span></a>
          </div>
        </div>
        <div class="hero__arcade" role="group" aria-label="Featured games">
          <span class="hero__coin hero__coin--1">${coin(40)}</span>
          <span class="hero__coin hero__coin--2">${coin(30)}</span>
          <span class="hero__coin hero__coin--3">${coin(34)}</span>
          ${featured.map(
            (game, i) => html`
              <a class="hero__cabinet hero__cabinet--${i + 1}" href="${ctx.href(`games/${game.slug}/`)}" aria-label="${game.title}">
                ${cabinet(ctx, game, { eager: true, door: true })}
              </a>`,
          )}
          <span class="hero__floor" aria-hidden="true"></span>
        </div>
      </div>
    </section>

    <section id="games" class="section games">
      <div class="container">
        <p class="section__eyebrow section__eyebrow--center" data-reveal>Stage 1 · Game select</p>
        <h2 class="section__heading section__heading--center" data-reveal>All games</h2>

        <div class="games__toolbar" data-reveal>
          <div class="filters" role="group" aria-label="Filter by genre">
            <button type="button" class="filter is-active" data-filter="all" aria-pressed="true">All <span class="filter__count">${games.length}</span></button>
            ${counts.map(
              (c) => html`<button type="button" class="filter" data-filter="${c.key}" aria-pressed="false">${c.label} <span class="filter__count">${c.count}</span></button>`,
            )}
          </div>
          <label class="search">
            <span class="visually-hidden">Search games</span>
            ${icon('search', 18)}
            <input type="search" placeholder="Search games" autocomplete="off" data-search />
          </label>
        </div>

        <p class="games__status" aria-live="polite" data-results></p>
        <div class="games__grid" data-grid>
          ${games.map((game, i) => gameCard(ctx, game, { eager: i < 4 }))}
        </div>
        <p class="games__empty" data-empty hidden>No games match that search. <button type="button" class="link-button" data-clear>Show all games</button></p>

        ${adSlot(ctx, 'homeFeed')}
      </div>
    </section>

    <section id="how" class="section how">
      <div class="container">
        <p class="section__eyebrow section__eyebrow--center" data-reveal>Stage 2 · Behind the screen</p>
        <h2 class="section__heading section__heading--center" data-reveal>How it's made</h2>
        <ol class="steps">
          ${steps(ctx).map(
            (step, i) => html`
              <li class="step" data-reveal>
                <span class="step__icon">${icon(step.icon, 26)}</span>
                <span class="step__number">Step ${i + 1}</span>
                <h3 class="step__title">${step.title}</h3>
                <p>${step.body}</p>
              </li>`,
          )}
        </ol>
      </div>
    </section>

    <section id="faq" class="section faq">
      <div class="container faq__inner">
        <div class="faq__intro" data-reveal>
          <p class="section__eyebrow">Stage 3 · Questions</p>
          <h2 class="section__heading">Good to know</h2>
          <p>Something else on your mind? <a href="${ctx.href('contact/')}">Get in touch</a>.</p>
        </div>
        <div class="faq__list">
          ${faqs(ctx).map(
            (f) => html`
              <details class="faq__item" data-reveal>
                <summary>${f.q}</summary>
                <p>${f.a}</p>
              </details>`,
          )}
        </div>
      </div>
    </section>`
}
