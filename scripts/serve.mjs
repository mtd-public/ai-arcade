// Local preview server. Builds the site, serves dist/ at the same base path it
// will have when deployed, and rebuilds + reloads the page when files change.
//
//   npm run dev                  build, serve, watch (http://localhost:8080)
//   npm run preview              build and serve once, no watching
//   PORT=3000 npm run dev        another port
//   SITE_URL=http://localhost:8080 npm run dev   preview a root-domain build

import { spawnSync } from 'node:child_process'
import { createReadStream, existsSync, statSync, watch } from 'node:fs'
import { createServer } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import site from '../site.config.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const port = Number(process.env.PORT) || 8080
const watching = !process.argv.includes('--no-watch')
const base = `${new URL(process.env.SITE_URL || site.siteUrl).pathname.replace(/\/+$/, '')}/`

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

// Each build runs in a fresh process so edited modules are always re-read.
function build() {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/build.mjs')], { stdio: 'inherit', env: process.env })
  return result.status === 0
}

// Live reload over Server-Sent Events, injected into HTML responses only here.
const clients = new Set()
const reloadSnippet = `<script>new EventSource('/__reload').onmessage = () => location.reload()</script>`

function send(res, status, file) {
  const type = types[path.extname(file)] || 'application/octet-stream'
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' })
  if (watching && type.startsWith('text/html')) {
    let body = ''
    createReadStream(file, 'utf8')
      .on('data', (chunk) => (body += chunk))
      .on('end', () => res.end(body.replace('</body>', `${reloadSnippet}</body>`)))
  } else {
    createReadStream(file).pipe(res)
  }
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')

  if (url.pathname === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write('\n')
    clients.add(res)
    req.on('close', () => clients.delete(res))
    return
  }

  // Like GitHub Pages: everything lives under the base path.
  if (!url.pathname.startsWith(base)) {
    if (url.pathname === '/' || `${url.pathname}/` === base) {
      res.writeHead(302, { Location: base })
      return res.end()
    }
    return send(res, 404, path.join(dist, '404.html'))
  }

  const relative = decodeURIComponent(url.pathname.slice(base.length))
  let file = path.normalize(path.join(dist, relative))
  if (!file.startsWith(dist)) return send(res, 404, path.join(dist, '404.html'))

  if (existsSync(file) && statSync(file).isDirectory()) {
    // /about -> /about/, as GitHub Pages does.
    if (!url.pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${url.pathname}/${url.search}` })
      return res.end()
    }
    file = path.join(file, 'index.html')
  }
  if (!existsSync(file)) return send(res, 404, path.join(dist, '404.html'))
  send(res, 200, file)
})

if (!build()) process.exit(1)

server.listen(port, () => {
  console.log(`\n  AI Arcade running at http://localhost:${port}${base}`)
  if (watching) console.log('  Watching src/ and site.config.mjs for changes. Ctrl+C to stop.\n')
})

if (watching) {
  let timer = null
  const rebuild = (_event, filename) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      console.log(`\n  ${filename ?? 'file'} changed, rebuilding...`)
      if (build()) for (const client of clients) client.write('data: reload\n\n')
    }, 120)
  }
  watch(path.join(root, 'src'), { recursive: true }, rebuild)
  watch(path.join(root, 'site.config.mjs'), rebuild)
}
