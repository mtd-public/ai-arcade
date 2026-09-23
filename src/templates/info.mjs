import { formatDate, html } from './html.mjs'
import { coin, feedItem, icon } from './components.mjs'

// Shared frame for the text pages (About, Contact, Privacy).
function textPage(eyebrow, title, lede, body) {
  return html`
    <section class="page-head">
      <div class="container page-head__inner">
        <p class="section__eyebrow">${eyebrow}</p>
        <h1 class="page-head__title">${title}</h1>
        ${lede && html`<p class="page-head__lede">${lede}</p>`}
      </div>
    </section>
    <div class="container page-body prose">${body}</div>`
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
      ${site.name} is a community arcade for browser games made with AI: ${games.length} so far, from a pixel-art submarine shooter to a word puzzle.
      Every game is free, runs in any modern browser on a phone, tablet or computer, and needs no download or plug-in.
    </p>
    <p>
      It works like the portals we grew up on. Players vote, and the games people actually love rise to the top of the feed.
      Each game gets its own page with screenshots, gameplay clips, achievements, a leaderboard and comments, and creators can share the build kit behind it: the source code and the prompts and agent files they made it with.
    </p>

    <h2>How the games are made</h2>
    <div class="about-steps">
      <div class="about-step">
        <span class="about-step__icon">${icon('chat', 22)}</span>
        <h3>Built with an AI pair programmer</h3>
        <p>The code is written in conversation with AI coding agents (${ctx.aiToolsText}), then playtested and tuned over many rounds. The art is procedural too: 3D models, pixel sprites and sound effects are generated in code rather than drawn or recorded.</p>
      </div>
      <div class="about-step">
        <span class="about-step__icon">${icon('rocket', 22)}</span>
        <h3>Shipped as a web page</h3>
        <p>Each game is a static web page. There's nothing to install and no account to make, and the same build runs on phones, tablets and desktops.</p>
      </div>
    </div>

    <h2>Play with AI</h2>
    <p>
      Games will be able to switch on two AI play modes. <strong>Co-pilot</strong> watches your run and suggests what to do next. <strong>Co-op</strong> puts an AI in control of player two.
      Games opt in through the Arcade Bridge, a small script that lets a game share its state with the arcade.
    </p>

    <h2>Who runs it</h2>
    <p>
      The arcade is designed and run by <a href="${site.owner.url}">${site.owner.name}</a>, a UI/UX developer who builds interfaces for a living and games for fun.
    </p>

    <h2>What's live today</h2>
    <p>
      Every game, its page and the in-page player are live. Voting and saving work now and are kept on your device.
      Accounts, comments, submissions, clips and leaderboards are on the way; you can <a href="${ctx.href()}?preview=1">preview them with sample data</a>.
    </p>

    <p class="page__cta">
      <a class="btn btn--primary" href="${ctx.href()}#feed">Browse the games</a>
      <a class="btn btn--ghost" href="${ctx.href('submit/')}">${icon('upload', 17)} Submit a game</a>
    </p>`

  return {
    page: {
      path: 'about/',
      name: 'about',
      title: 'About',
      description: `What ${site.name} is, how its games are made with AI, and what's coming next.`,
      schema: { '@context': 'https://schema.org', '@type': 'AboutPage', name: `About ${site.name}`, url: ctx.abs('about/') },
    },
    content: textPage('About', `About ${site.name}`, 'A community arcade for games made with AI.', body),
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

    <h2>Reporting content</h2>
    <p>If a game, clip or comment breaks the <a href="${ctx.href('guidelines/')}">community guidelines</a>, tell us which page it's on and what's wrong.</p>

    <h2>Business and advertising</h2>
    <p>For anything else, including privacy questions about this site, ${contactLine(ctx)}.</p>`

  return {
    page: {
      path: 'contact/',
      name: 'contact',
      title: 'Contact',
      description: `How to get in touch with ${site.name}: questions, bug reports, content reports and privacy requests.`,
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
      The short version: there are no accounts yet, and the few things the site remembers for you stay in your own browser.
    </p>

    <h2>What this site collects</h2>
    <p>
      ${site.name} doesn't have user accounts yet and doesn't ask you for personal information. The site itself doesn't set cookies.
    </p>
    <p>
      Like any website, the hosting provider receives technical information each time a page is requested, such as your IP address, browser type and the page you asked for, and may keep it in server logs for security and reliability.
    </p>

    <h2>What your browser keeps for you</h2>
    <p>
      Community features that work before accounts launch save their data in your browser's local storage, on your device only: your votes, saved games,
      submission drafts, and the best scores and achievement unlocks that games report while you play here. Preview mode is remembered for the browser tab you turned it on in.
      None of this is sent to a server, and clearing your browser's site data removes it.
    </p>

    <h2>Games</h2>
    <p>
      The games are hosted separately (currently on GitHub Pages) and load inside this site in a frame when you press play. Games that remember a best score or your settings save them in your browser, on your device.
    </p>

    <h2>Gameplay videos</h2>
    <p>
      Gameplay clips from YouTube use YouTube's privacy-enhanced mode (youtube-nocookie.com) and only load when you press play on one. From then on, <a href="https://policies.google.com/privacy">Google's privacy policy</a> applies to that video.
    </p>

    <h2>Coming soon: accounts and submissions</h2>
    <p>
      When accounts, comments and game submissions launch, they'll need a display name and an email address. This policy will be updated to explain exactly what's collected and why before any of that goes live.
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
      name: 'privacy',
      title: 'Privacy policy',
      description: `What ${site.name} collects when you visit, what your browser keeps, how ads and cookies work here, and your choices.`,
    },
    content: textPage('Legal', 'Privacy policy', null, body),
  }
}

export function notFoundPage(ctx) {
  const picks = ctx.games.filter((g) => g.featured).slice(0, 3)
  return {
    page: {
      path: '404.html',
      name: '404',
      title: 'Page not found',
      description: 'That page is not in the arcade.',
      noindex: true,
      ads: false,
    },
    content: html`
      <section class="section not-found">
        <div class="container">
          <div class="not-found__screen">
            <p class="not-found__over">Game over</p>
            <p class="not-found__continue" aria-hidden="true">Continue? <span data-countdown>9</span></p>
            <p class="not-found__code">Error 404 · page not found</p>
          </div>
          <h1 class="section__heading section__heading--center not-found__title">That page isn't in the arcade</h1>
          <p class="page-head__lede not-found__lede">It may have moved, or the link has a typo.</p>
          <p class="not-found__home"><a class="btn btn--primary" href="${ctx.href()}">${coin(22)} Insert coin to continue</a></p>
          <h2 class="section-title not-found__picks">Or try one of these</h2>
          <ol class="feed feed--grid feed--related">
            ${picks.map((g) => feedItem(ctx, g))}
          </ol>
        </div>
      </section>`,
  }
}
