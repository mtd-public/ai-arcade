import { formatDate, html } from './html.mjs'
import { coin, gameCard, icon } from './components.mjs'

// Shared frame for the text pages (About, Contact, Privacy).
function textPage(eyebrow, title, lede, body) {
  return html`
    <section class="section page">
      <div class="container page__inner">
        <header class="page__header">
          <p class="section__eyebrow">${eyebrow}</p>
          <h1 class="section__heading">${title}</h1>
          ${lede && html`<p class="page__lede">${lede}</p>`}
        </header>
        <div class="prose page__body">${body}</div>
      </div>
    </section>`
}

function contactLine(ctx) {
  const { site } = ctx
  return site.contactEmail
    ? html`email <a href="mailto:${site.contactEmail}">${site.contactEmail}</a>`
    : html`open an issue on <a href="${site.issuesUrl}">GitHub</a>`
}

export function aboutPage(ctx) {
  const { site, games } = ctx
  const body = html`
    <h2>What this is</h2>
    <p>
      ${site.name} is a small, growing collection of original browser games: ${games.length} so far, from a pixel-art submarine shooter to a word puzzle.
      Every game is free, runs in any modern browser on a phone, tablet or computer, and needs no download, account or plug-in.
    </p>

    <h2>Who makes it</h2>
    <p>
      The arcade is designed and run by <a href="${site.owner.url}">${site.owner.name}</a>, a UI/UX developer who builds interfaces for a living and games for fun.
      Each game starts as a design doc: which classic it riffs on, what the twist is, how it should feel under a thumb.
    </p>

    <h2>How the games are built with AI</h2>
    <p>
      The code for every game is written with AI coding assistants (${ctx.aiToolsText}). A human sets the design, reviews the changes, playtests every build and decides what ships.
      The AI does a lot of the typing. The decisions about what's fun, what's fair and what gets cut stay with the designer.
    </p>
    <p>
      The art is made the same way. Instead of drawn sprites or bought asset packs, the games generate their models, textures, pixel art and sound effects in code, or with scripts that drive Blender.
      That keeps every game small, fast to load, and entirely original.
    </p>

    <h2>What's next</h2>
    <p>New games are added as they're finished. The newest ones get a "New" badge on the <a href="${ctx.href()}#games">home page</a>.</p>

    <p class="page__cta">
      <a class="btn btn--primary" href="${ctx.href()}#games">Browse the games</a>
      <a class="btn btn--ghost" href="${ctx.href('contact/')}">Contact</a>
    </p>`

  return {
    page: {
      path: 'about/',
      title: 'About',
      description: `Who makes ${site.name}, and how its games are designed by a person and built with AI coding assistants.`,
      schema: { '@context': 'https://schema.org', '@type': 'AboutPage', name: `About ${site.name}`, url: ctx.abs('about/') },
    },
    content: textPage('About', `About ${site.name}`, `Original arcade games, designed by a person and built with AI.`, body),
  }
}

export function contactPage(ctx) {
  const { site } = ctx
  const body = html`
    <div class="contact-cards">
      ${site.contactEmail
        ? html`
            <a class="contact-card" href="mailto:${site.contactEmail}">
              <span class="contact-card__icon">${icon('mail', 24)}</span>
              <span class="contact-card__title">Email</span>
              <span class="contact-card__text">${site.contactEmail}</span>
            </a>`
        : ''}
      <a class="contact-card" href="${site.issuesUrl}">
        <span class="contact-card__icon">${icon('github', 24)}</span>
        <span class="contact-card__title">GitHub issues</span>
        <span class="contact-card__text">Report a problem with this site, or suggest something.</span>
      </a>
    </div>

    <h2>Found a bug in a game?</h2>
    <p>Let us know which game, what device and browser you were on, and what happened, using one of the options above.</p>

    <h2>Business and advertising</h2>
    <p>For anything else, including privacy questions about this site, ${contactLine(ctx)}.</p>`

  return {
    page: {
      path: 'contact/',
      title: 'Contact',
      description: `How to get in touch with ${site.name}: questions, bug reports and privacy requests.`,
    },
    content: textPage('Contact', 'Get in touch', 'Questions, bug reports and ideas are all welcome.', body),
  }
}

export function privacyPage(ctx) {
  const { site, ads } = ctx
  const advertising = ads.client
    ? html`
        <h2>Advertising</h2>
        <p>
          ${site.name} shows ads served by Google AdSense to help cover its costs. Google and its partners use cookies and similar technologies to show ads and to measure how they perform.
        </p>
        <ul>
          <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
          <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the Internet.</li>
          <li>You can opt out of personalized advertising by visiting Google's <a href="https://adssettings.google.com">Ads Settings</a>, or opt out of some third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info/choices/">aboutads.info</a>.</li>
        </ul>
        <p>
          Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for consent through a consent message before cookies are used for personalized ads, and can change their choice at any time from that message.
          Learn more in <a href="https://policies.google.com/technologies/partner-sites">How Google uses information from sites or apps that use its services</a>.
        </p>`
    : html`
        <h2>Advertising</h2>
        <p>
          ${site.name} does not show ads today. If that changes, for example by adding Google AdSense, this page will be updated first to explain what data the ad provider collects and how to opt out.
        </p>`

  const body = html`
    <p class="page__meta">Last updated <time datetime="${site.privacyUpdated}">${formatDate(site.privacyUpdated)}</time></p>

    <p>
      This policy explains what information ${site.name} (${ctx.abs('')}) collects when you visit, and what choices you have.
      The short version: there are no accounts, no forms and no tracking of your gameplay by this site.
    </p>

    <h2>What this site collects</h2>
    <p>
      ${site.name} has no user accounts, sign-up forms or comments, and does not ask you for personal information.
      The site itself doesn't set cookies.
    </p>
    <p>
      Like any website, the hosting provider receives technical information each time a page is requested, such as your IP address, browser type and the page you asked for, and may keep it in server logs for security and reliability.
    </p>

    <h2>Games and local storage</h2>
    <p>
      The games are hosted on GitHub Pages and some load inside this site in a frame. Games that remember a best score or your settings save them in your browser's local storage, on your device.
      That data isn't sent to a server, and clearing your browser's site data removes it.
    </p>

    <h2>Fonts</h2>
    <p>
      Text on this site is set in fonts loaded from Google Fonts. Your browser requests them from Google's servers, which receive your IP address. See <a href="https://policies.google.com/privacy">Google's privacy policy</a>.
    </p>

    ${advertising}

    <h2>Children</h2>
    <p>
      The games are made for a general audience, but this site isn't directed at children under 13 and doesn't knowingly collect personal information from them.
    </p>

    <h2>Links to other sites</h2>
    <p>Some pages link to other sites, which have their own privacy policies. This policy covers ${site.name} only.</p>

    <h2>Changes</h2>
    <p>If this policy changes, the new version will be posted on this page with a new "last updated" date.</p>

    <h2>Contact</h2>
    <p>Questions about privacy? ${contactLine(ctx)}.</p>`

  return {
    page: {
      path: 'privacy/',
      title: 'Privacy policy',
      description: `What ${site.name} collects when you visit, how ads and cookies work here, and your choices.`,
    },
    content: textPage('Legal', 'Privacy policy', null, body),
  }
}

export function notFoundPage(ctx) {
  const picks = ctx.games.filter((g) => g.featured).slice(0, 3)
  return {
    page: {
      path: '404.html',
      title: 'Page not found',
      description: 'That page is not in the arcade.',
      noindex: true,
      ads: false,
    },
    content: html`
      <section class="section page not-found">
        <div class="container">
          <div class="not-found__screen">
            <p class="not-found__over">Game over</p>
            <p class="not-found__continue" aria-hidden="true">Continue? <span data-countdown>9</span></p>
            <p class="not-found__code">Error 404 · page not found</p>
          </div>
          <h1 class="section__heading section__heading--center not-found__title">That page isn't in the arcade</h1>
          <p class="page__lede not-found__lede">It may have moved, or the link has a typo. Try one of these cabinets instead.</p>
          <div class="games__grid games__grid--related">
            ${picks.map((g) => gameCard(ctx, g, { headingLevel: 2 }))}
          </div>
          <p class="not-found__home"><a class="btn btn--primary" href="${ctx.href()}">${coin(22)} Insert coin to continue</a></p>
        </div>
      </section>`,
  }
}
