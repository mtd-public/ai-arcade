import { html, raw } from './html.mjs'
import { categoryBadge, coin, emptyState, feedItem, icon, sectionTitle } from './components.mjs'
import { LICENSES, LIMITS } from '../static/js/game-schema.js'

function pageHead({ eyebrow, title, lede, extra = '' }) {
  return html`
    <section class="page-head">
      <div class="container page-head__inner">
        <p class="section__eyebrow">${eyebrow}</p>
        <h1 class="page-head__title">${title}</h1>
        ${lede && html`<p class="page-head__lede">${lede}</p>`}
        ${extra}
      </div>
    </section>`
}

// ---- Leaderboards -------------------------------------------------------------

export function leaderboardsPage(ctx) {
  const { games } = ctx
  const content = html`
    ${pageHead({
      eyebrow: 'Hall of fame',
      title: 'Leaderboards',
      lede: 'The best runs in the arcade, per game and overall. Scores arrive straight from the games through the Arcade Bridge, so nobody types their own.',
    })}
    <div class="container lb" data-leaderboards>
      <nav class="lb__tabs" aria-label="Choose a leaderboard">
        <button class="lb__tab is-active" type="button" data-lb-tab="overall" aria-pressed="true">${icon('trophy', 18)} Overall</button>
        ${games.map(
          (g) => html`<button class="lb__tab" type="button" data-lb-tab="${g.slug}" aria-pressed="false" style="--accent: ${g.accent}">
            ${g.cover ? html`<img src="${ctx.asset(g.cover)}" alt="" width="600" height="800" loading="lazy" />` : icon('gamepad', 18)} ${g.title}
          </button>`,
        )}
      </nav>
      <div class="lb__panels">
        <section class="lb__panel side-card" data-lb-panel="overall" aria-labelledby="lb-overall">
          ${sectionTitle('Top players', { id: 'lb-overall', sample: true })}
          <p class="lb__note">Points for placing on each game's board: 80 for first, down to 10 for eighth.</p>
          <div data-lb-body>${emptyState({ iconName: 'trophy', title: 'No scores yet.', body: 'The overall board fills up once games start reporting scores.' })}</div>
        </section>
        ${games.map(
          (g) => html`
            <section class="lb__panel side-card" data-lb-panel="${g.slug}" aria-labelledby="lb-${g.slug}" hidden>
              <div class="lb__game">
                ${categoryBadge(ctx, g)}
                ${sectionTitle(g.title, { id: `lb-${g.slug}`, sample: true })}
                <a class="btn btn--gold btn--sm" href="${ctx.href(`games/${g.slug}/`)}#play">${icon('play', 15)} Play</a>
              </div>
              <p class="my-best" data-my-best hidden>${icon('user', 16)} Your best on this device: <strong data-my-best-score></strong></p>
              <div data-lb-body>${emptyState({ iconName: 'trophy', title: 'No scores yet.', body: `Scores appear once ${g.title} reports them to the arcade.` })}</div>
            </section>`,
        )}
      </div>
      <aside class="lb__aside side-card">
        <h2 class="side-card__title">${icon('info', 18)} How scores get here</h2>
        <p>Games report finished runs to the arcade through the <a href="${ctx.href('sdk/arcade-bridge.js')}">Arcade Bridge</a>, a tiny script creators add to their game. Each score is tagged with how it was played:</p>
        <ul class="mode-legend">
          <li><span class="mode-badge mode-badge--solo">Solo</span> on your own</li>
          <li><span class="mode-badge mode-badge--copilot">Co-pilot</span> with AI suggestions</li>
          <li><span class="mode-badge mode-badge--coop">Co-op</span> with an AI player two</li>
        </ul>
        <p>Until accounts launch, your best scores are kept on this device.</p>
      </aside>
    </div>`
  return {
    page: {
      path: 'leaderboards/',
      name: 'leaderboards',
      title: 'Leaderboards',
      description: `Top scores and top players across every game in ${ctx.site.name}.`,
      communityNotice: true,
    },
    content,
  }
}

// ---- Submit ------------------------------------------------------------------

function field({ id, label, hint, required = false, control, counter }) {
  return html`
    <div class="field" data-field="${id}">
      <label class="field__label" for="${id}">${label}${required ? html` <span class="field__req" aria-hidden="true">*</span>` : html` <span class="field__opt">optional</span>`}</label>
      ${control}
      ${(hint || counter) && html`<p class="field__hint" id="${id}-hint">${hint}${counter && html` <span class="field__counter" data-counter-for="${id}"></span>`}</p>`}
      <p class="field__error" id="${id}-error" data-error-for="${id}" hidden></p>
    </div>`
}

function fieldset(number, title, lede, body, { optional = false, id } = {}) {
  return html`
    <fieldset class="form-card"${id ? html` id="${id}"` : ''}>
      <legend class="form-card__legend"><span class="form-card__num">${number}</span> ${title}${optional && html` <span class="field__opt">optional</span>`}</legend>
      ${lede && html`<p class="form-card__lede">${lede}</p>`}
      ${body}
    </fieldset>`
}

const toolChoices = ['Claude Code', 'Claude', 'ChatGPT / Codex', 'Cursor', 'GitHub Copilot', 'Gemini', 'Other']

function gameForm(ctx) {
  const cats = Object.entries(ctx.categories)
  return html`
    <form class="submit-form" data-submit-form="game" novalidate>
      <div class="form-errors" data-form-errors tabindex="-1" hidden></div>

      ${fieldset(
        1,
        'Your game',
        'The basics players see in the feed.',
        html`
          ${field({ id: 'g-title', label: 'Title', required: true, counter: true, control: html`<input id="g-title" name="title" type="text" maxlength="${LIMITS.title[1]}" autocomplete="off" required aria-describedby="g-title-hint g-title-error" />`, hint: '' })}
          ${field({ id: 'g-url', label: 'Where it runs', required: true, hint: 'The https:// address of the playable game, e.g. its GitHub Pages or itch.io page.', control: html`<input id="g-url" name="url" type="url" inputmode="url" placeholder="https://" required aria-describedby="g-url-hint g-url-error" />` })}
          ${field({ id: 'g-tagline', label: 'Tagline', required: true, counter: true, hint: 'One or two sentences. What is it, and what makes it fun?', control: html`<textarea id="g-tagline" name="tagline" rows="2" maxlength="${LIMITS.tagline[1]}" required aria-describedby="g-tagline-hint g-tagline-error"></textarea>` })}
          <div class="field-row">
            ${field({
              id: 'g-category',
              label: 'Genre',
              required: true,
              control: html`<span class="select select--block"><select id="g-category" name="category" required aria-describedby="g-category-error"><option value="">Choose a genre</option>${cats.map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select>${icon('chevronDown', 16)}</span>`,
            })}
            <div class="field" data-field="g-orientation">
              <span class="field__label" id="g-orientation-label">Best held</span>
              <div class="segmented" role="radiogroup" aria-labelledby="g-orientation-label">
                <label><input type="radio" name="orientation" value="portrait" checked /> <span>${icon('phone', 16)} Upright</span></label>
                <label><input type="radio" name="orientation" value="landscape" /> <span>${icon('phone', 16)} Sideways</span></label>
              </div>
            </div>
          </div>
          ${field({ id: 'g-tags', label: 'Tags', hint: `Up to ${LIMITS.tags}, separated by commas. E.g. 3D, Boss fights, One button.`, control: html`<input id="g-tags" name="tags" type="text" autocomplete="off" aria-describedby="g-tags-hint g-tags-error" />` })}
          ${field({ id: 'g-description', label: 'Description', required: true, counter: true, hint: `A few paragraphs in your own words; leave a blank line between them. Aim for ${LIMITS.minDescriptionWords}+ words.`, control: html`<textarea id="g-description" name="description" rows="7" required aria-describedby="g-description-hint g-description-error"></textarea>` })}`,
      )}

      ${fieldset(
        2,
        'Screenshots and video',
        'Great media is what gets people to press start.',
        html`
          ${field({
            id: 'g-cover',
            label: 'Cover image',
            required: true,
            hint: '3:4 portrait, at least 600×800. JPG, PNG or WebP.',
            control: html`<label class="drop" for="g-cover">${icon('upload', 22)} <span><strong>Choose a cover</strong> or drop it here</span><input id="g-cover" name="cover" type="file" accept="image/jpeg,image/png,image/webp" required aria-describedby="g-cover-hint g-cover-error" /></label><div class="thumbs" data-preview-for="g-cover"></div>`,
          })}
          ${field({
            id: 'g-screenshots',
            label: 'Screenshots',
            hint: `Up to ${LIMITS.screenshots}. Any shape.`,
            control: html`<label class="drop" for="g-screenshots">${icon('image', 22)} <span><strong>Add screenshots</strong> or drop them here</span><input id="g-screenshots" name="screenshots" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="g-screenshots-hint g-screenshots-error" /></label><div class="thumbs" data-preview-for="g-screenshots"></div>`,
          })}
          ${field({
            id: 'g-video',
            label: 'Gameplay video on YouTube',
            hint: 'Paste a YouTube link. It plays in privacy-enhanced mode and only loads when someone presses play.',
            control: html`<input id="g-video" name="video" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" aria-describedby="g-video-hint g-video-error" /><div class="yt-preview" data-yt-preview hidden></div>`,
          })}
          ${field({
            id: 'g-clip',
            label: 'Or upload a short clip',
            hint: `MP4 or WebM, up to ${LIMITS.clipSeconds} seconds and ${LIMITS.clipMegabytes} MB.`,
            control: html`<label class="drop" for="g-clip">${icon('film', 22)} <span><strong>Choose a clip</strong></span><input id="g-clip" name="clip" type="file" accept="video/mp4,video/webm" aria-describedby="g-clip-hint g-clip-error" /></label><div class="thumbs" data-preview-for="g-clip"></div>`,
          })}
          <label class="check"><input type="checkbox" name="featureOk" checked /> <span>The arcade can feature my video on the game page and home page.</span></label>`,
      )}

      ${fieldset(
        3,
        'How to play',
        'Controls for touch and keyboard, plus any tips.',
        html`
          <div class="repeater" data-repeater="controls" data-min="1">
            <div class="repeater__head" aria-hidden="true"><span>Action</span><span>Touch</span><span>Keyboard</span><span></span></div>
            <div class="repeater__rows" data-rows></div>
            <template data-row-template>
              <div class="repeater__row">
                <input name="control-action" type="text" placeholder="Jump" aria-label="Action" />
                <input name="control-touch" type="text" placeholder="Tap the right side" aria-label="Touch input" />
                <input name="control-keyboard" type="text" placeholder="Space" aria-label="Keyboard input" />
                <button class="icon-btn" type="button" data-remove-row aria-label="Remove this control">${icon('trash', 16)}</button>
              </div>
            </template>
            <button class="btn btn--ghost btn--sm" type="button" data-add-row>${icon('plus', 16)} Add a control</button>
          </div>
          ${field({ id: 'g-tips', label: 'Tips', hint: 'One per line.', control: html`<textarea id="g-tips" name="tips" rows="3" aria-describedby="g-tips-hint"></textarea>` })}`,
      )}

      ${fieldset(
        4,
        'Achievements',
        'List the achievements your game has. Games can report unlocks to the arcade through the Arcade Bridge.',
        html`
          <div class="repeater" data-repeater="achievements" data-min="0">
            <div class="repeater__rows" data-rows></div>
            <template data-row-template>
              <div class="repeater__row repeater__row--two">
                <input name="achievement-title" type="text" placeholder="Kracken Slayer" aria-label="Achievement name" />
                <input name="achievement-description" type="text" placeholder="Defeat the Kracken." aria-label="How to unlock it" />
                <button class="icon-btn" type="button" data-remove-row aria-label="Remove this achievement">${icon('trash', 16)}</button>
              </div>
            </template>
            <button class="btn btn--ghost btn--sm" type="button" data-add-row>${icon('plus', 16)} Add an achievement</button>
          </div>`,
        { optional: true },
      )}

      ${fieldset(
        5,
        'Play with AI',
        html`Does your game support the arcade's AI play modes? It needs the <a href="${ctx.href('sdk/arcade-bridge.js')}">Arcade Bridge</a> script to share its state with the AI.`,
        html`
          <label class="check check--card"><input type="checkbox" name="copilot" /> <span><strong>${icon('sparkle', 16)} AI co-pilot</strong> An AI watches the run and suggests what to do next.</span></label>
          <label class="check check--card"><input type="checkbox" name="coop" /> <span><strong>${icon('users', 16)} Co-op with AI</strong> An AI can control player two.</span></label>`,
        { optional: true },
      )}

      ${fieldset(
        6,
        'Build kit',
        'Share how you made it, if you want to: your source code and the agent resources (prompts, agent instructions, design docs) other people can learn from or remix. Entirely your choice.',
        html`
          <label class="check check--card"><input type="checkbox" name="shareKit" data-toggle-target="kit-fields" /> <span><strong>${icon('code', 16)} Share my build kit</strong> Shown on the game page with the license you choose.</span></label>
          <div class="kit-fields" id="kit-fields" hidden>
            <div class="field-row">
              ${field({ id: 'g-source', label: 'Source code link', control: html`<input id="g-source" name="source" type="url" inputmode="url" placeholder="https://" aria-describedby="g-source-error" />` })}
              ${field({
                id: 'g-license',
                label: 'License',
                control: html`<span class="select select--block"><select id="g-license" name="license">${Object.entries(LICENSES).map(([k, v]) => html`<option value="${k}">${v}</option>`)}</select>${icon('chevronDown', 16)}</span>`,
              })}
            </div>
            <div class="repeater" data-repeater="files" data-min="0">
              <p class="field__label">Agent resources</p>
              <div class="repeater__rows" data-rows></div>
              <template data-row-template>
                <div class="repeater__row repeater__row--two">
                  <input name="file-label" type="text" placeholder="CLAUDE.md, prompt log, design doc…" aria-label="What it is" />
                  <input name="file-url" type="url" placeholder="https://" aria-label="Link" />
                  <button class="icon-btn" type="button" data-remove-row aria-label="Remove this resource">${icon('trash', 16)}</button>
                </div>
              </template>
              <button class="btn btn--ghost btn--sm" type="button" data-add-row>${icon('plus', 16)} Add a resource</button>
            </div>
          </div>
          <div class="field">
            <span class="field__label">AI tools you used</span>
            <div class="check-grid">
              ${toolChoices.map((t) => html`<label class="check"><input type="checkbox" name="tools" value="${t}" /> <span>${t}</span></label>`)}
            </div>
          </div>`,
        { optional: true },
      )}

      ${fieldset(
        7,
        'About you',
        'Your name shows on the game page. Your email stays private.',
        html`
          <div class="field-row">
            ${field({ id: 'g-name', label: 'Display name', required: true, control: html`<input id="g-name" name="name" type="text" autocomplete="nickname" required aria-describedby="g-name-error" />` })}
            ${field({ id: 'g-email', label: 'Email', required: true, control: html`<input id="g-email" name="email" type="email" autocomplete="email" required aria-describedby="g-email-error" />` })}
          </div>
          <label class="check" data-field="g-rights"><input id="g-rights" type="checkbox" name="rights" required /> <span>I made this game, or I have the right to submit it.</span></label>
          <p class="field__error" data-error-for="g-rights" hidden></p>
          <label class="check" data-field="g-rules"><input id="g-rules" type="checkbox" name="rules" required /> <span>I've read the <a href="${ctx.href('guidelines/')}">community guidelines</a>.</span></label>
          <p class="field__error" data-error-for="g-rules" hidden></p>`,
      )}

      <div class="submit-bar">
        <p class="submit-bar__status" data-draft-status aria-live="polite"></p>
        <button class="btn btn--ghost" type="button" data-save-draft>Save draft</button>
        <button class="btn btn--gold" type="submit">${icon('upload', 17)} Submit for review</button>
      </div>
    </form>`
}

function mediaForm(ctx) {
  return html`
    <form class="submit-form" data-submit-form="media" novalidate hidden>
      <div class="form-errors" data-form-errors tabindex="-1" hidden></div>
      ${fieldset(
        1,
        'Share a clip or screenshots',
        'Show off a great run. Clips can be featured on the game page and the home page.',
        html`
          ${field({
            id: 'm-game',
            label: 'Game',
            required: true,
            control: html`<span class="select select--block"><select id="m-game" name="game" required aria-describedby="m-game-error"><option value="">Choose a game</option>${ctx.games.map((g) => html`<option value="${g.slug}">${g.title}</option>`)}</select>${icon('chevronDown', 16)}</span>`,
          })}
          ${field({ id: 'm-title', label: 'Title', required: true, control: html`<input id="m-title" name="title" type="text" maxlength="80" placeholder="No-death run through the first circle" required aria-describedby="m-title-error" />` })}
          ${field({
            id: 'm-video',
            label: 'YouTube link',
            hint: 'Or upload a short clip below.',
            control: html`<input id="m-video" name="video" type="url" inputmode="url" placeholder="https://www.youtube.com/watch?v=…" aria-describedby="m-video-hint m-video-error" /><div class="yt-preview" data-yt-preview hidden></div>`,
          })}
          ${field({
            id: 'm-clip',
            label: 'Short clip',
            hint: `MP4 or WebM, up to ${LIMITS.clipSeconds} seconds and ${LIMITS.clipMegabytes} MB.`,
            control: html`<label class="drop" for="m-clip">${icon('film', 22)} <span><strong>Choose a clip</strong></span><input id="m-clip" name="clip" type="file" accept="video/mp4,video/webm" aria-describedby="m-clip-hint m-clip-error" /></label><div class="thumbs" data-preview-for="m-clip"></div>`,
          })}
          ${field({
            id: 'm-screenshots',
            label: 'Screenshots',
            control: html`<label class="drop" for="m-screenshots">${icon('image', 22)} <span><strong>Add screenshots</strong></span><input id="m-screenshots" name="screenshots" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="m-screenshots-error" /></label><div class="thumbs" data-preview-for="m-screenshots"></div>`,
          })}
          <label class="check"><input type="checkbox" name="featureOk" checked /> <span>The arcade can feature this on the game page and home page.</span></label>`,
      )}
      ${fieldset(
        2,
        'About you',
        '',
        html`
          <div class="field-row">
            ${field({ id: 'm-name', label: 'Display name', required: true, control: html`<input id="m-name" name="name" type="text" autocomplete="nickname" required aria-describedby="m-name-error" />` })}
            ${field({ id: 'm-email', label: 'Email', required: true, control: html`<input id="m-email" name="email" type="email" autocomplete="email" required aria-describedby="m-email-error" />` })}
          </div>
          <label class="check" data-field="m-rules"><input id="m-rules" type="checkbox" name="rules" required /> <span>This is my footage, and I've read the <a href="${ctx.href('guidelines/')}">community guidelines</a>.</span></label>
          <p class="field__error" data-error-for="m-rules" hidden></p>`,
      )}
      <div class="submit-bar">
        <p class="submit-bar__status" data-draft-status aria-live="polite"></p>
        <button class="btn btn--ghost" type="button" data-save-draft>Save draft</button>
        <button class="btn btn--gold" type="submit">${icon('upload', 17)} Submit for review</button>
      </div>
    </form>`
}

export function submitPage(ctx) {
  // A stand-in game for the live preview. app.js clones this feed row and
  // fills it in from the form as you type, so the preview is the real thing.
  const previewGame = {
    slug: 'your-game',
    title: 'Your game',
    tagline: 'Your tagline shows here.',
    category: Object.keys(ctx.categories)[0],
    accent: '#5b46c9',
    tint: '#ecebfb',
    added: new Date(ctx.now).toISOString().slice(0, 10),
    creator: { name: 'you' },
    tags: [],
    screenshots: [],
    achievements: [],
    ai: { copilot: false, coop: false },
    cover: null,
  }
  const previewCtx = { ...ctx, isNew: () => true, href: () => '#' }

  const content = html`
    ${pageHead({
      eyebrow: 'Player two has entered',
      title: 'Submit to the arcade',
      lede: 'Made a browser game with AI? Put it in front of players, let them vote it up, and show off clips, achievements and your build kit.',
      extra: html`<p class="status-pill">${icon('lock', 15)} Submissions open soon. You can prepare yours now; drafts are saved on this device.</p>`,
    })}
    <div class="container submit">
      <div class="submit__main">
        <div class="kind-switch" role="tablist" aria-label="What are you submitting?">
          <button class="kind-switch__tab" type="button" role="tab" aria-selected="true" data-kind="game">${icon('gamepad', 18)} A new game</button>
          <button class="kind-switch__tab" type="button" role="tab" aria-selected="false" data-kind="media">${icon('film', 18)} A clip or screenshots</button>
        </div>
        ${gameForm(ctx)}
        ${mediaForm(ctx)}
      </div>

      <aside class="submit__side">
        <section class="side-card preview-card" data-preview-card>
          <h2 class="side-card__title">${icon('eye', 18)} Live preview</h2>
          <p class="preview-card__note">How your game will look in the feed.</p>
          <ol class="feed feed--list feed--preview" data-preview-feed inert>${feedItem(previewCtx, previewGame, { rank: 1 })}</ol>
        </section>
        <section class="side-card" data-checklist>
          <h2 class="side-card__title">${icon('check', 18)} Checklist</h2>
          <ul class="checklist">
            <li data-check="title">Title</li>
            <li data-check="url">Playable https:// link</li>
            <li data-check="tagline">Tagline</li>
            <li data-check="category">Genre</li>
            <li data-check="description">Description (${LIMITS.minDescriptionWords}+ words)</li>
            <li data-check="cover">Cover image</li>
            <li data-check="controls">At least one control</li>
            <li data-check="you">Your name and email</li>
          </ul>
        </section>
        <section class="side-card">
          <h2 class="side-card__title">${icon('rocket', 18)} What happens next</h2>
          <ol class="steps-list">
            <li>We check the game runs, is safe, and follows the guidelines.</li>
            <li>It goes live in the <strong>New</strong> feed, where early votes decide if it rises.</li>
            <li>Players can vote, comment, post clips and chase your leaderboard.</li>
          </ol>
          <p class="side-card__fine">${coin(16)} Games stay free to play. The arcade is supported by ads around, never inside, the games.</p>
        </section>
      </aside>
    </div>`

  return {
    page: {
      path: 'submit/',
      name: 'submit',
      title: 'Submit a game',
      description: `Submit a browser game you made with AI to ${ctx.site.name}, or share gameplay clips and screenshots.`,
      ads: false,
    },
    content,
  }
}

// ---- Guidelines ----------------------------------------------------------------

export function guidelinesPage(ctx) {
  const rules = [
    {
      title: 'Games',
      items: [
        'Submit games you made, or have the right to share. Made with AI is welcome and expected; say which tools you used.',
        'It must run in a modern browser over https, without downloads, sign-ups or payments to play.',
        "No malware, crypto-mining, hidden tracking, or ads inside a game that pretend to be the arcade's.",
        "Keep content suitable for a general audience. Cartoon action is fine; graphic gore, sexual content and hate aren't.",
        "Don't copy other people's games, characters, art or music.",
      ],
    },
    {
      title: 'Clips and screenshots',
      items: [
        'Share footage of your own play. Keep clips short (up to a minute) and on-topic.',
        "No personal information on screen: names, faces or chats of people who didn't agree to be shown.",
        'Featured clips are picked by the arcade and credited to you.',
      ],
    },
    {
      title: 'Votes, comments and leaderboards',
      items: [
        "Vote on the game, not the creator. One person, one vote: don't use extra accounts or ask for vote trades.",
        'Be kind in comments. Critique the game, not the person. No harassment, spam or self-promotion off-topic.',
        'Scores come from the games themselves. Exploits and tampering get scores removed.',
      ],
    },
    {
      title: 'Build kits',
      items: [
        'Sharing your source and agent resources is always optional.',
        'Pick a license so people know what they can do with it, and only share files you have the right to share.',
        'Remove API keys, passwords and personal data before sharing.',
      ],
    },
    {
      title: 'Moderation',
      items: [
        'Everything submitted is reviewed before it goes live, and can be removed if it breaks these rules.',
        `See something wrong? Use the report option on it, or get in touch through the <a href="${ctx.href('contact/')}">contact page</a>.`,
        'Repeated or serious breaks lead to losing submission and comment access.',
      ],
    },
  ]
  const content = html`
    ${pageHead({ eyebrow: 'House rules', title: 'Community guidelines', lede: 'A few rules that keep the arcade fun, fair and safe for everyone.' })}
    <div class="container guidelines prose">
      ${rules.map(
        (section) => html`
          <section class="side-card guidelines__card">
            <h2>${section.title}</h2>
            <ul>${section.items.map((item) => html`<li>${item.includes('<a ') ? raw(item) : item}</li>`)}</ul>
          </section>`,
      )}
    </div>`
  return {
    page: {
      path: 'guidelines/',
      name: 'guidelines',
      title: 'Community guidelines',
      description: `The rules for submitting games, clips and comments to ${ctx.site.name}.`,
    },
    content,
  }
}
