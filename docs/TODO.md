# To do

Work left over from the portal UI pass, roughly in priority order. The UI,
routes and client hooks are in place; everything below is follow-up.

## Before merging to main

- **The live site still shows the old owner name.** This branch changes it to
  `grizzly-dev` everywhere, but `main` (and so the live GitHub Pages site)
  keeps the old name until this branch is merged. Earlier commits on `main`
  also contain it; rewriting that history isn't recommended, but it's an
  option if it matters.
- **Update the docs for the portal:**
  - Write `docs/PORTAL.md`: how the pieces fit together (static pages +
    `js/app.js` page modules + `js/api.js`), the `community.json` data
    contract, the backend endpoints `api.js` expects when `portal.apiBase` is
    set, the Arcade Bridge message protocol (`sdk/arcade-bridge.js`), the Hot
    ranking formula (`js/ranking.js`), how a submission maps to a
    `src/data/games.mjs` entry, and preview mode (`?preview=1`).
  - `README.md`: new pages (leaderboards, submit, guidelines), new files
    (`src/templates/community.mjs`, `src/static/js/*`, `src/static/sdk/`,
    `src/data/community.json`, `src/data/sample-community.mjs`,
    `src/static/img/shots/`), preview mode and dark mode.
  - `docs/ADSENSE.md`: the ad slots are now `homeFeed`, `homeSidebar`,
    `gameContent` and `gameFooter`; the submit page has no ads; user-generated
    content (comments, clips, submissions) needs moderation to stay within
    AdSense policies.
- **Fix `tools/make-images.mjs` before regenerating Open Graph images.** It
  still styles `.hero__floor`, which the redesign renamed to
  `.spotlight__floor`. Also pin its browser to the light color scheme.
- Set `ads.showPlaceholders: false` in `site.config.mjs` before launch so the
  "Ad space" boxes don't show on the live site.

## Backend (the scaffolding is ready for it)

Set `portal.apiBase` in `site.config.mjs` and implement the endpoints stubbed
in `src/static/js/api.js`:

- Accounts and sign-in (`GET /session`, `/auth/sign-in`).
- Votes, plays and the community snapshot (`POST /games/:slug/vote`,
  `POST /games/:slug/plays`, `GET /community`), with one vote per account and
  rate limiting.
- Comments with replies, voting and reporting (`GET`/`POST
  /games/:slug/comments`).
- Leaderboards and achievements fed by the Arcade Bridge
  (`POST /games/:slug/scores`, `/achievements`, `GET /players/top`), with
  basic score sanity checks.
- Clips and screenshots (`GET /clips`), including uploads and YouTube links.
- Submissions (`POST /submissions/game`, `/submissions/media`) and a
  moderation queue that turns an approved game into a `games.mjs` entry.

## Games

- Add the Arcade Bridge (`sdk/arcade-bridge.js`) to each game so scores and
  achievements reach the arcade.
- Build the AI co-pilot and co-op modes in at least one game. The mode picker,
  co-pilot panel and P2 badge are UI scaffolds until a game reports support.
- Record real gameplay clips (or YouTube links) to replace the sample ones.

## Discover mode

- Add `ArcadeBridge.gameOver()` to each game. Today Discover spots game over
  with the `gameOver` rules in `src/data/games.mjs`, which look inside the
  game's page: they break if a game's game-over screen changes, and they only
  work while the arcade and the games share an origin.
- Backend: `GET /discover/next` to choose the next game (give new and
  little-played games a boost), `POST /discover/turns` for turn stats and
  `POST /games/:slug/reviews` for reviews. The client already calls these
  when `portal.apiBase` is set.
- Show discovery stats (recommend rate, average turn length) on game pages
  and in the community snapshot once there's data.
- Decide whether Discover gets an ad slot. It has none for now, to keep ads
  well away from the game area.

## Testing

- Move the browser test used during development (sorting, search, votes,
  saves, theme toggle, player, modes, lightbox, submit form, leaderboards,
  phone layout; 100 checks) into the repo and run it in CI. It needs
  Playwright.
