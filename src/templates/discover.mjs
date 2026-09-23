import { html, raw } from './html.mjs'
import { coin, icon } from './components.mjs'

// Discover mode: one random game at a time. Play until game over, give it a
// quick review, change the channel. The page ships the lineup as JSON and
// js/pages/discover.js runs the board. Today the lineup is the catalog; with a
// backend, api.nextDiscover() asks the server, which is how new games will
// get their airtime.
export function discoverPage(ctx) {
  const lineup = ctx.games
    .filter((game) => game.embed !== false)
    .map((game, i) => ({
      slug: game.slug,
      channel: i + 1,
      title: game.title,
      tagline: game.tagline,
      url: game.url,
      page: ctx.href(`games/${game.slug}/`),
      cover: game.cover ? ctx.asset(game.cover) : '',
      orientation: game.orientation ?? 'portrait',
      genre: ctx.categories[game.category],
      accent: game.accent,
      creator: game.creator.name,
      gameOver: game.gameOver ?? [],
    }))
  // Safe inside <script>: no "</" can close the tag early.
  const json = JSON.stringify(lineup).replace(/</g, '\\u003c')

  return {
    page: {
      path: 'discover/',
      name: 'discover',
      title: 'Discover: channel-surf the arcade',
      description: 'Discover mode: play a random game until game over, say whether you would recommend it, then change the channel to the next one.',
      bodyClass: 'page-discover',
      ads: false,
    },
    content: html`
      <section class="discover" aria-labelledby="discover-title">
        <div class="container">
          <header class="discover__head">
            <div>
              <p class="section__eyebrow">Channel surfing</p>
              <h1 id="discover-title" class="discover__title">Discover</h1>
            </div>
            <p class="discover__lede">A random game from the arcade. Play until game over, say whether you'd recommend it, then change the channel.</p>
          </header>

          <section class="player player--portrait discover-board" data-discover data-state="off" aria-label="Discover mode">
            <div class="player__top discover-board__top">
              <p class="discover-board__channel">
                <span class="discover-board__ch">CH</span>
                <span class="discover-board__number" data-channel-number>--</span>
                <span class="discover-board__now" data-now-title>Off air</span>
              </p>
              <button class="chip-button discover-board__sound" type="button" data-sound aria-pressed="true" title="Static sound">
                <span class="discover-board__sound-on">${icon('volume', 16)}</span>
                <span class="discover-board__sound-off">${icon('volumeOff', 16)}</span>
                <span class="visually-hidden">Static sound</span>
              </button>
            </div>

            <div class="player__stage">
              <div class="player__screen discover-board__screen">
                <img class="discover-board__ambient" data-ambient alt="" hidden />
                <div class="discover-board__stage" data-stage></div>
                <canvas class="discover-static" data-static aria-hidden="true"></canvas>
                <p class="discover-osd discover-osd--channel" data-osd-channel aria-hidden="true"></p>
                <p class="discover-osd discover-osd--title" data-osd-title aria-hidden="true"></p>

                <div class="discover-start" data-start-panel>
                  <p class="discover-start__hud">${coin(18)} <span class="hud__blink">Press start</span></p>
                  <h2 class="discover-start__title">One game. One run. Next channel.</h2>
                  <p class="discover-start__text">Play a random game until game over, give it a quick thumbs up or down, then flip to the next one. ${lineup.length} games on the air.</p>
                  <button class="btn btn--gold discover-start__button" type="button" data-start>${icon('tv', 20)} Start channel surfing</button>
                </div>

                <section class="review" data-review hidden aria-labelledby="review-title">
                  <p class="review__over" data-review-over>Game over</p>
                  <p class="review__score" data-review-score hidden></p>
                  <h2 id="review-title" class="review__title">Would you recommend <span data-review-game></span>?</h2>
                  <div class="review__verdicts" role="group" aria-label="Your review">
                    <button class="review__verdict review__verdict--up" type="button" data-verdict="up" aria-pressed="false">${icon('thumbUp', 20)} Recommend</button>
                    <button class="review__verdict review__verdict--down" type="button" data-verdict="down" aria-pressed="false">${icon('thumbDown', 20)} Not for me</button>
                  </div>
                  <button class="review__save" type="button" data-review-save aria-pressed="false">${icon('bookmark', 17)} <span data-review-save-text>Save to my games</span></button>
                  <button class="review__next" type="button" data-next>Next channel ${icon('next', 20)} <kbd>N</kbd></button>
                  <p class="review__more">
                    <button class="review__link" type="button" data-keep-playing>Keep playing</button>
                    <span aria-hidden="true">·</span>
                    <a class="review__link" data-review-page href="${ctx.href()}">Game page</a>
                  </p>
                </section>
              </div>
            </div>

            <div class="player__bar discover-board__bar">
              <p class="discover-board__info" data-info><span class="discover-board__hint" data-hint>Press start to tune in.</span></p>
              <div class="player__bar-actions">
                <a class="chip-button" data-info-tab href="${ctx.href()}" target="_blank" rel="noopener" hidden>${icon('external', 16)} New tab</a>
                <button class="chip-button chip-button--gold" type="button" data-channel-up hidden>${icon('next', 16)} Next channel</button>
              </div>
            </div>
          </section>
          <p class="visually-hidden" aria-live="polite" data-announce></p>

          <section class="discover-history" data-history hidden aria-labelledby="history-title">
            <h2 id="history-title" class="discover-history__title">${icon('tv', 18)} Recently on</h2>
            <ol class="discover-history__list" data-history-list></ol>
          </section>
        </div>
      </section>

      <section class="section discover-how" aria-labelledby="how-title">
        <div class="container">
          <p class="section__eyebrow">How it works</p>
          <h2 id="how-title" class="section__heading">Channel surfing, arcade style</h2>
          <ol class="discover-steps">
            <li>
              <span class="discover-steps__n">1</span>
              <strong>Play one run</strong>
              <span>A random game comes on. Play it until game over.</span>
            </li>
            <li>
              <span class="discover-steps__n">2</span>
              <strong>Quick review</strong>
              <span>Recommend it or not, and save it to come back later. Your review counts as your vote.</span>
            </li>
            <li>
              <span class="discover-steps__n">3</span>
              <strong>Change the channel</strong>
              <span>Hit next for another game. No repeats until you've seen every channel.</span>
            </li>
          </ol>
          <aside class="discover-creators">
            ${icon('rocket', 22)}
            <p>
              <strong>Making games?</strong> New games get airtime here. <a href="${ctx.href('submit/')}">Submit yours</a>, and call
              <code>ArcadeBridge.gameOver()</code> from the <a href="${ctx.href('sdk/arcade-bridge.js')}">Arcade Bridge</a> when a run ends, so Discover knows when to ask for a review.
            </p>
          </aside>
        </div>
      </section>
      <script type="application/json" id="discover-lineup">${raw(json)}</script>`,
  }
}
