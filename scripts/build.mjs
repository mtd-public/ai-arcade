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
import { sampleCommunity } from '../src/data/sample-community.mjs'
import { validateGame } from '../src/static/js/game-schema.js'
import { hasData } from '../src/static/js/ranking.js'
import { layout } from '../src/templates/layout.mjs'
import { homePage } from '../src/templates/home.mjs'
import { gamePage } from '../src/templates/game.mjs'
import { guidelinesPage, leaderboardsPage, submitPage } from '../src/templates/community.mjs'
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

// ---- Validate the catalog with the same rules the submit form uses ----------

const seen = new Set()
const fileExists = (p) => existsSync(path.join(staticDir, p))

for (const [i, game] of games.entries()) {
  const where = `games[${i}]${game.slug ? ` (${game.slug})` : ''}`
  if (seen.has(game.slug)) errors.push(`${where}: slug is used twice`)
  seen.add(game.slug)
  for (const issue of validateGame(game, { categories, fileExists })) {
    ;(issue.level === 'error' ? errors : warnings).push(`${where}: ${issue.field} ${issue.message}`)
  }
  // Defaults, so templates can rely on every field being present.
  game.orientation ??= 'portrait'
  game.accent ??= '#191333'
  game.tint ??= '#f3efe3'
  game.tags ??= []
  game.controls ??= []
  game.screenshots ??= []
  game.achievements ??= []
  game.resources ??= null
  game.creator = { name: site.owner.name, url: site.owner.url, ...game.creator }
  game.ai = { copilot: false, coop: false, ...game.ai }
}

const ads = { slots: {}, showPlaceholders: true, ...site.ads }
ads.client = (ads.client || '').trim()
if (ads.client && !/^ca-pub-\d{16}$/.test(ads.client)) errors.push(`ads.client must look like ca-pub-1234567890123456, got "${ads.client}"`)
for (const [name, id] of Object.entries(ads.slots)) {
  if (id && !/^\d+$/.test(String(id))) errors.push(`ads.slots.${name} must be the numeric data-ad-slot ID from AdSense`)
}
if (site.contactEmail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site.contactEmail)) errors.push('contactEmail is not a valid email address')
if (site.portal?.apiBase && !/^https:\/\//.test(site.portal.apiBase)) errors.push('portal.apiBase must be an https:// address')

// ---- Community data snapshot ---------------------------------------------------
// The real numbers. Empty (generatedAt: null) until a backend or export job
// fills in src/data/community.json. See docs/PORTAL.md.

let community = {}
try {
  community = JSON.parse(await readFile(path.join(root, 'src/data/community.json'), 'utf8'))
  for (const slug of Object.keys(community.games ?? {})) {
    if (!seen.has(slug)) warnings.push(`community.json has stats for "${slug}", which isn't in the catalog`)
  }
} catch (error) {
  errors.push(`src/data/community.json is not valid JSON: ${error.message}`)
}

if (errors.length) {
  console.error(`\nBuild failed:\n${errors.map((e) => `  ✖ ${e}`).join('\n')}\n`)
  process.exit(1)
}

// ---- Output ------------------------------------------------------------------

await rm(outDir, { recursive: true, force: true })
await mkdir(outDir, { recursive: true })
await cp(staticDir, outDir, { recursive: true })

const now = Date.now()
await mkdir(path.join(outDir, 'data'), { recursive: true })
await writeFile(path.join(outDir, 'data/community.json'), JSON.stringify(community))
await writeFile(path.join(outDir, 'data/sample-community.json'), JSON.stringify(sampleCommunity(games, now)))

// Cache busting. The CSS and images get a hash of their own content. The ES
// modules all share one version (a hash of every script), appended to the
// entry point and to every relative import inside them, so a change to any
// module reaches browsers without a stale import chain.
const hash = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 10)
const hashes = {}
for (const file of ['css/arcade.css', 'favicon.svg', 'apple-touch-icon.png']) {
  const full = path.join(staticDir, file)
  if (existsSync(full)) hashes[file] = hash(await readFile(full))
}
const jsFiles = (await readdir(path.join(outDir, 'js'), { recursive: true })).filter((f) => f.endsWith('.js')).sort()
const jsVersion = hash(Buffer.concat(await Promise.all(jsFiles.map((f) => readFile(path.join(outDir, 'js', f))))))
hashes['js/app.js'] = jsVersion
for (const file of jsFiles) {
  const full = path.join(outDir, 'js', file)
  const source = await readFile(full, 'utf8')
  await writeFile(full, source.replace(/((?:\bfrom|\bimport)\s*\(?\s*)(['"])(\.{1,2}\/[^'"?]+\.js)\2/g, `$1$2$3?v=${jsVersion}$2`))
}

// The "New" badge goes on the most recently added games, if they're recent.
const NEW_COUNT = 3
const NEW_FOR_DAYS = 30
const newest = new Set(
  games
    .filter((g) => g.added && (now - Date.parse(`${g.added}T00:00:00Z`)) / 864e5 <= NEW_FOR_DAYS)
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
  now,
  community,
  hasData: hasData(community),
  year: new Date(now).getUTCFullYear(),
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
      name: 'home',
      title: site.name,
      description: site.description,
      communityNotice: true,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: site.name,
        url: ctx.abs(''),
        description: site.description,
        potentialAction: { '@type': 'SearchAction', target: `${ctx.abs('')}?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
      },
    },
    content: homePage(ctx),
  },
  ...games.map((game) => gamePage(ctx, game)),
  leaderboardsPage(ctx),
  submitPage(ctx),
  guidelinesPage(ctx),
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
console.log(ctx.hasData ? `Community data from ${community.generatedAt}` : 'Community data: none yet (votes and saves stay on each device; ?preview=1 shows sample data)')
