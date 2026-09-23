// Renders the social-share images (src/static/img/og/*.jpg) and the home-screen
// icon (src/static/apple-touch-icon.png) with the site's own cabinet styles.
// Run it after adding a game or changing a cover:
//
//   npm run build                # the images use dist/css/arcade.css
//   npm i --no-save playwright && npx playwright install chromium   # once
//   npm run images               # all games, the site card and the icon
//   npm run images -- word-drop  # just one game
//
// Extra Chromium flags (e.g. for a proxy) can be passed in CHROMIUM_ARGS.

import { existsSync } from 'node:fs'
import { rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import site from '../site.config.mjs'
import { categories, games } from '../src/data/games.mjs'
import { cabinet, coin } from '../src/templates/components.mjs'
import { html } from '../src/templates/html.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const css = path.join(root, 'dist/css/arcade.css')
if (!existsSync(css)) {
  console.error('Run `npm run build` first: the images are styled with dist/css/arcade.css.')
  process.exit(1)
}

let chromium
try {
  ;({ chromium } = createRequire(import.meta.url)('playwright'))
} catch {
  console.error('This tool needs Playwright: npm i --no-save playwright && npx playwright install chromium')
  process.exit(1)
}

const only = process.argv.slice(2)
const staticUrl = (p) => pathToFileURL(path.join(root, 'src/static', p)).href
const ctx = { asset: staticUrl }

const page = (body) => html`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Press+Start+2P&family=Work+Sans:wght@400;500;600&display=block" rel="stylesheet" />
    <link rel="stylesheet" href="${pathToFileURL(css).href}" />
    <style>
      body { width: 1200px; height: 630px; margin: 0; overflow: hidden; }
      *, *::before, *::after { animation: none !important; transition: none !important; }
      .og { position: relative; display: flex; align-items: center; gap: 56px; height: 100%; padding: 0 80px 0 96px; }
      .og__cab { position: relative; z-index: 1; width: 276px; flex-shrink: 0; }
      .og__cab .cabinet { box-shadow: 0 8px 0 var(--color-ink), 0 40px 50px -24px rgba(25, 19, 51, 0.6); }
      .og .hero__floor { left: 20px; right: auto; width: 480px; bottom: 0; height: 120px; }
      .og__copy { position: relative; z-index: 1; }
      .og__eyebrow { margin: 0 0 16px; font-family: var(--font-pixel); font-size: 15px; text-transform: uppercase; color: var(--color-accent-strong); }
      .og__title { margin: 0; font-family: var(--font-display); font-weight: 800; font-size: 76px; line-height: 1; letter-spacing: -0.03em; color: var(--color-ink); }
      .og__tagline { margin: 22px 0 0; font-size: 25px; line-height: 1.45; color: var(--color-text-body); }
      .og__cta { display: flex; align-items: center; gap: 14px; margin: 30px 0 0; font-family: var(--font-display); font-weight: 800; font-size: 22px; }
      .og .hud { font-size: 14px; margin: 0 0 24px; }
      .row { position: relative; height: 100%; padding-top: 36px; text-align: center; }
      .row__title { margin: 14px 0 0; font-family: var(--font-display); font-weight: 800; font-size: 64px; letter-spacing: -0.03em; line-height: 1; }
      .row__cabs { position: absolute; left: 0; right: 0; bottom: 26px; display: flex; justify-content: center; align-items: flex-end; gap: 18px; }
      .row__cabs > div { width: 168px; }
      .row__cabs > div:nth-child(3) { width: 190px; }
      .row .hero__floor { left: 60px; right: 60px; height: 110px; }
      .row .hud { font-size: 13px; }
      .icon-page { width: 180px; height: 180px; display: grid; place-items: center; background: #191333; }
    </style>
  </head>
  <body>${body}</body>
</html>`

const hud = html`<p class="hud"><span class="hud__item"><span class="hud__label">1UP</span><span class="hud__value">000000</span></span><span class="hud__item" style="color: var(--lit-gold)">Insert coin</span></p>`

const gamePage = (game) =>
  page(html`
    <div class="og" style="--accent: ${game.accent}">
      <span class="hero__floor"></span>
      <div class="og__cab">${cabinet(ctx, game, { eager: true, door: true })}</div>
      <div class="og__copy">
        ${hud}
        <p class="og__eyebrow">${site.name} · ${categories[game.category]}</p>
        <h1 class="og__title">${game.title}</h1>
        <p class="og__tagline">${game.tagline}</p>
        <p class="og__cta">${coin(34)} Free to play in your browser</p>
      </div>
    </div>`)

const sitePage = () => {
  const lineup = games.filter((g) => g.cover).slice(0, 5)
  return page(html`
    <div class="row">
      <span class="hero__floor"></span>
      ${hud}
      <p class="row__title">${site.name}</p>
      <div class="row__cabs">${lineup.map((g) => html`<div>${cabinet(ctx, g, { eager: true, door: true })}</div>`)}</div>
    </div>`)
}

const iconPage = () => page(html`<div class="icon-page"><img src="${staticUrl('favicon.svg')}" width="150" height="150" alt="" /></div>`)

const browser = await chromium.launch({ args: (process.env.CHROMIUM_ARGS || '').split(' ').filter(Boolean) })
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } })
const tmp = path.join(root, 'dist/__image.html')

async function render(markup, out, { width = 1200, height = 630, type = 'jpeg' } = {}) {
  await writeFile(tmp, String(markup))
  await tab.setViewportSize({ width, height })
  await tab.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' })
  await tab.evaluate(() => document.fonts.ready)
  await tab.screenshot({ path: out, type, ...(type === 'jpeg' && { quality: 84 }), clip: { x: 0, y: 0, width, height } })
  console.log(`  wrote ${path.relative(root, out)}`)
}

for (const game of games) {
  if (!game.cover || (only.length && !only.includes(game.slug))) continue
  await render(gamePage(game), path.join(root, 'src/static/img/og', `${game.slug}.jpg`))
}
if (!only.length) {
  await render(sitePage(), path.join(root, 'src/static/img/og/site.jpg'))
  await render(iconPage(), path.join(root, 'src/static/apple-touch-icon.png'), { width: 180, height: 180, type: 'png' })
}

await rm(tmp, { force: true })
await browser.close()
console.log('Done. Set `og` on any new game in src/data/games.mjs to img/og/<slug>.jpg.')
