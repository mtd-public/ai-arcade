// Builds the static site into dist/. No dependencies: `node scripts/build.mjs`.
//
// Environment:
//   SITE_URL  Public address of the site (overrides siteUrl in site.config.mjs).
//             Its path becomes the base path, so https://user.github.io/ai-arcade
//             builds for /ai-arcade/ and https://example.com builds for /.
//   OUT_DIR   Output folder, relative to the repo root (default: dist).

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import site from '../site.config.mjs'
import { categories, games } from '../src/data/games.mjs'
import { layout } from '../src/templates/layout.mjs'
import { homePage } from '../src/templates/home.mjs'
import { gamePage } from '../src/templates/game.mjs'
import { aboutPage, contactPage, notFoundPage, privacyPage } from '../src/templates/info.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const staticDir = path.join(root, 'src/static')
const outDir = path.resolve(root, process.env.OUT_DIR || 'dist')

const errors = []
const warnings = []

// ---- Site address and base path -------------------------------------------

const siteUrl = (process.env.SITE_URL || site.siteUrl || '').trim().replace(/\/+$/, '')
let base = '/'
try {
  const parsed = new URL(siteUrl)
  if (!/^https?:$/.test(parsed.protocol)) throw new Error()
  base = `${parsed.pathname.replace(/\/+$/, '')}/`
} catch {
  errors.push(`siteUrl / SITE_URL must be a full http(s) address like https://example.com, got "${siteUrl}"`)
}

// ---- Validate the catalog and ad settings ------------------------------------

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const seen = new Set()
const isUrl = (value) => {
  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

for (const [i, game] of games.entries()) {
  const where = `games[${i}]${game.slug ? ` (${game.slug})` : ''}`
  const need = (field, ok, hint) => ok || errors.push(`${where}: ${field} ${hint}`)
  need('slug', SLUG.test(game.slug ?? ''), 'must be lowercase-with-dashes')
  need('slug', !seen.has(game.slug), 'is used twice')
  seen.add(game.slug)
  need('title', typeof game.title === 'string' && game.title.trim(), 'is required')
  need('tagline', typeof game.tagline === 'string' && game.tagline.trim(), 'is required')
  need('url', isUrl(game.url), 'must be a full http(s) address')
  need('repo', !game.repo || isUrl(game.repo), 'must be a full http(s) address')
  need('category', game.category in categories, `must be one of: ${Object.keys(categories).join(', ')}`)
  need('description', Array.isArray(game.description) && game.description.length > 0, 'needs at least one paragraph')
  need('orientation', ['portrait', 'landscape'].includes(game.orientation ?? 'portrait'), "must be 'portrait' or 'landscape'")
  need('added', !game.added || DATE.test(game.added), 'must look like 2026-09-23')
  for (const field of ['cover', 'og']) {
    if (game[field]) need(field, existsSync(path.join(staticDir, game[field])), `file not found: src/static/${game[field]}`)
  }
  game.orientation ??= 'portrait'
  game.accent ??= '#191333'
  game.tint ??= '#f3efe3'
  if (!game.controls?.length) warnings.push(`${where}: no controls listed; the "How to play" table will be empty`)
  if (game.description?.join(' ').split(/\s+/).length < 80)
    warnings.push(`${where}: description is under 80 words; longer original text helps AdSense review`)
}

const ads = { slots: {}, showPlaceholders: true, ...site.ads }
ads.client = (ads.client || '').trim()
if (ads.client && !/^ca-pub-\d{16}$/.test(ads.client)) errors.push(`ads.client must look like ca-pub-1234567890123456, got "${ads.client}"`)
for (const [name, id] of Object.entries(ads.slots)) {
  if (id && !/^\d+$/.test(String(id))) errors.push(`ads.slots.${name} must be the numeric data-ad-slot ID from AdSense`)
}
if (site.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site.contactEmail)) errors.push('contactEmail is not a valid email address')

if (errors.length) {
  console.error(`\nBuild failed:\n${errors.map((e) => `  ✖ ${e}`).join('\n')}\n`)
  process.exit(1)
}

// ---- Output ------------------------------------------------------------------

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })
await cp(staticDir, outDir, { recursive: true })

// Short content hashes for ?v= cache busting on the CSS and JS.
const hashes = {}
for (const file of ['css/arcade.css', 'js/arcade.js', 'favicon.svg', 'apple-touch-icon.png']) {
  const full = path.join(staticDir, file)
  if (existsSync(full)) hashes[file] = createHash('sha256').update(await readFile(full)).digest('hex').slice(0, 10)
}

const now = new Date()
// The "New" badge goes on the most recently added games, if they're recent.
const NEW_COUNT = 3
const NEW_FOR_DAYS = 30
const newest = new Set(
  games
    .filter((g) => g.added && (now - new Date(`${g.added}T00:00:00Z`)) / 864e5 <= NEW_FOR_DAYS)
    .sort((a, b) => b.added.localeCompare(a.added))
    .slice(0, NEW_COUNT)
    .map((g) => g.slug),
)
const href = (p = '') => base + p.replace(/^\/+/, '')

const ctx = {
  site,
  games,
  categories,
  ads,
  base,
  siteUrl,
  year: now.getUTCFullYear(),
  href,
  abs: (p = '') => `${siteUrl}/${p.replace(/^\/+/, '')}`,
  asset: (p) => href(p) + (hashes[p] ? `?v=${hashes[p]}` : ''),
  isNew: (game) => newest.has(game.slug),
  aiToolsText: new Intl.ListFormat('en', { type: 'conjunction' }).format(site.aiTools?.length ? site.aiTools : ['AI coding assistants']),
}

const pages = [
  {
    page: {
      path: '',
      title: site.name,
      description: site.description,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: ctx.abs(''),
        description: site.description,
      },
      bodyClass: 'page-home',
    },
    content: homePage(ctx),
  },
  ...games.map((game) => gamePage(ctx, game)),
  aboutPage(ctx),
  contactPage(ctx),
  privacyPage(ctx),
  notFoundPage(ctx),
]

for (const { page, content } of pages) {
  const file = page.path.endsWith('.html') ? page.path : path.join(page.path, 'index.html')
  await mkdir(path.dirname(path.join(outDir, file)), { recursive: true })
  await writeFile(path.join(outDir, file), String(layout(ctx, page, content)))
}

const indexable = pages.filter(({ page }) => !page.noindex)
await writeFile(
  path.join(outDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexable.map(({ page }) => `  <url><loc>${ctx.abs(page.path)}</loc></url>`).join('\n')}
</urlset>
`,
)

await writeFile(path.join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ctx.abs('sitemap.xml')}\n`)

// ads.txt authorises Google to sell ads on this domain. Crawlers only read it
// from the root of a domain (https://example.com/ads.txt), which is one reason
// AdSense needs your own domain rather than a github.io project path.
if (ads.client) {
  await writeFile(path.join(outDir, 'ads.txt'), `google.com, ${ads.client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n`)
  if (base !== '/') warnings.push(`ads.txt was written to ${base}ads.txt, but ad systems only read it at the domain root. Deploy to your own domain before going live.`)
}

const count = (await readdir(outDir, { recursive: true })).filter((f) => f.endsWith('.html')).length
for (const w of warnings) console.warn(`  ! ${w}`)
console.log(`Built ${count} pages for ${siteUrl}/ (base path ${base}) into ${path.relative(root, outDir) || '.'}/`)
console.log(ads.client ? `AdSense on: ${ads.client}` : 'AdSense off (set ads.client in site.config.mjs to turn it on)')
