// Builds the site twice, once for a GitHub Pages project path and once for a
// root domain, then checks every page: internal links and assets resolve, and
// each page has a title, description, canonical URL and a single <h1>.
// Run with `npm run check`. CI runs it before deploying.

import { spawnSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { readdir, readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const targets = [
  { name: 'github-pages', siteUrl: 'https://example.github.io/ai-arcade' },
  { name: 'own-domain', siteUrl: 'https://arcade.example.com' },
]

const problems = []

for (const { name, siteUrl } of targets) {
  const outDir = path.join('.check', name)
  const out = path.join(root, outDir)
  const build = spawnSync(process.execPath, [path.join(root, 'scripts/build.mjs')], {
    env: { ...process.env, SITE_URL: siteUrl, OUT_DIR: outDir },
    encoding: 'utf8',
  })
  if (build.status !== 0) {
    problems.push(`[${name}] build failed:\n${build.stderr || build.stdout}`)
    continue
  }

  const base = `${new URL(siteUrl).pathname.replace(/\/+$/, '')}/`
  const files = (await readdir(out, { recursive: true })).filter((f) => f.endsWith('.html'))

  // Resolve a site path like /ai-arcade/games/x/ to a file in the build.
  const resolves = (url) => {
    const clean = url.split(/[?#]/)[0]
    if (!clean.startsWith(base)) return false
    let file = path.join(out, decodeURIComponent(clean.slice(base.length)))
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html')
    return existsSync(file)
  }

  for (const file of files) {
    const page = `[${name}] ${file}`
    const markup = await readFile(path.join(out, file), 'utf8')

    if (!/<title>[^<]+<\/title>/.test(markup)) problems.push(`${page}: missing <title>`)
    if (!/<meta name="description" content="[^"]+"/.test(markup)) problems.push(`${page}: missing meta description`)
    const canonical = markup.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    if (!canonical?.startsWith(siteUrl)) problems.push(`${page}: canonical ${canonical} is not under ${siteUrl}`)
    const h1s = (markup.match(/<h1[\s>]/g) ?? []).length
    if (h1s !== 1) problems.push(`${page}: has ${h1s} <h1> elements, expected 1`)
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    if (dupes.length) problems.push(`${page}: duplicate id(s) ${[...new Set(dupes)].join(', ')}`)

    for (const [, attr, url] of markup.matchAll(/\s(href|src|data-random)="([^"]*)"/g)) {
      for (const link of attr === 'data-random' ? url.split(' ') : [url]) {
        if (!link || /^(https?:|mailto:|#|data:)/.test(link)) continue
        if (!resolves(link)) problems.push(`${page}: broken ${attr} ${link}`)
      }
    }
    for (const [, url] of markup.matchAll(/<meta property="og:image" content="([^"]+)"/g)) {
      if (!url.startsWith(siteUrl) || !resolves(new URL(url).pathname)) problems.push(`${page}: bad og:image ${url}`)
    }
  }

  const sitemap = await readFile(path.join(out, 'sitemap.xml'), 'utf8')
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    if (!loc.startsWith(siteUrl) || !resolves(new URL(loc).pathname)) problems.push(`[${name}] sitemap: ${loc} does not resolve`)
  }

  console.log(`  ✓ ${name}: checked ${files.length} pages at ${siteUrl}/`)
}

await rm(path.join(root, '.check'), { recursive: true, force: true })

if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n${problems.map((p) => `  ✖ ${p}`).join('\n')}\n`)
  process.exit(1)
}
console.log('All checks passed.')
