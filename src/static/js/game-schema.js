// The rules for a game entry, shared by the build (which checks every entry in
// src/data/games.mjs) and the submission form (which checks drafts in the
// browser). One set of rules, so a submission that passes here can go straight
// into the catalog. Works in Node and in the browser.

export const LIMITS = {
  title: [2, 40],
  tagline: [20, 170],
  tags: 6,
  tagLength: 24,
  screenshots: 8,
  achievements: 30,
  minDescriptionWords: 80,
  clipSeconds: 60,
  clipMegabytes: 50,
}

export const LICENSES = {
  MIT: 'MIT',
  'Apache-2.0': 'Apache 2.0',
  'GPL-3.0': 'GPL 3.0',
  'CC-BY-4.0': 'Creative Commons BY 4.0',
  'CC-BY-NC-4.0': 'Creative Commons BY-NC 4.0',
  'All-rights-reserved': 'All rights reserved (view only)',
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

export function isHttpUrl(value, { httpsOnly = false } = {}) {
  try {
    const { protocol } = new URL(value)
    return httpsOnly ? protocol === 'https:' : protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export const wordCount = (text) => String(text).trim().split(/\s+/).filter(Boolean).length

// The 11-character video ID from any common YouTube link (watch, youtu.be,
// shorts, embed, live), or null.
export function parseYouTube(value) {
  let url
  try {
    url = new URL(String(value).trim())
  } catch {
    return null
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, '')
  let id = null
  if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname === '/watch') id = url.searchParams.get('v')
    else id = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1] ?? null
  }
  return id && /^[\w-]{11}$/.test(id) ? id : null
}

// Checks one entry. Returns a list of { field, message, level } where level is
// 'error' (must fix) or 'warn' (worth fixing). Options:
//   categories  the allowed category keys, e.g. { shooter: 'Shooter', ... }
//   fileExists  (path) => boolean, for checking cover/screenshot files (build only)
//   submission  true when checking a visitor's draft rather than the catalog
export function validateGame(entry, { categories = {}, fileExists, submission = false } = {}) {
  const issues = []
  const error = (field, message) => issues.push({ field, message, level: 'error' })
  const warn = (field, message) => issues.push({ field, message, level: 'warn' })
  const text = (v) => (typeof v === 'string' ? v.trim() : '')

  if (!submission && !SLUG.test(entry.slug ?? '')) error('slug', 'must be lowercase-with-dashes')

  const title = text(entry.title)
  if (title.length < LIMITS.title[0] || title.length > LIMITS.title[1])
    error('title', `needs ${LIMITS.title[0]}–${LIMITS.title[1]} characters`)

  const tagline = text(entry.tagline)
  if (!tagline) error('tagline', 'is required')
  else if (submission && (tagline.length < LIMITS.tagline[0] || tagline.length > LIMITS.tagline[1]))
    error('tagline', `needs ${LIMITS.tagline[0]}–${LIMITS.tagline[1]} characters`)

  if (!isHttpUrl(entry.url, { httpsOnly: submission }))
    error('url', submission ? 'must be a full https:// address' : 'must be a full http(s) address')
  if (entry.repo && !isHttpUrl(entry.repo)) error('repo', 'must be a full http(s) address')
  if (!(entry.category in categories)) error('category', `must be one of: ${Object.keys(categories).join(', ')}`)
  if (!['portrait', 'landscape', undefined].includes(entry.orientation)) error('orientation', "must be 'portrait' or 'landscape'")
  if (entry.added && !DATE.test(entry.added)) error('added', 'must look like 2026-09-23')

  const tags = entry.tags ?? []
  if (tags.length > LIMITS.tags) error('tags', `can have at most ${LIMITS.tags}`)
  if (tags.some((t) => text(t).length === 0 || text(t).length > LIMITS.tagLength))
    error('tags', `each tag needs 1–${LIMITS.tagLength} characters`)

  const paragraphs = Array.isArray(entry.description) ? entry.description.filter((p) => text(p)) : []
  if (!paragraphs.length) error('description', 'needs at least one paragraph')
  else if (wordCount(paragraphs.join(' ')) < LIMITS.minDescriptionWords)
    warn('description', `is under ${LIMITS.minDescriptionWords} words; longer original text helps players and AdSense review`)

  const controls = entry.controls ?? []
  if (!controls.length) warn('controls', 'none listed; the "How to play" table will be empty')
  controls.forEach((row, i) => {
    if (!text(row.action)) error(`controls.${i}`, 'each control needs an action')
    else if (!text(row.touch) && !text(row.keyboard)) error(`controls.${i}`, `"${row.action}" needs a touch or keyboard input`)
  })

  const achievements = entry.achievements ?? []
  if (achievements.length > LIMITS.achievements) error('achievements', `can have at most ${LIMITS.achievements}`)
  achievements.forEach((a, i) => {
    if (!text(a.title) || !text(a.description)) error(`achievements.${i}`, 'each achievement needs a title and a description')
  })

  const screenshots = entry.screenshots ?? []
  if (screenshots.length > LIMITS.screenshots) error('screenshots', `can have at most ${LIMITS.screenshots}`)

  if (entry.resources) {
    const r = entry.resources
    if (r.source && !isHttpUrl(r.source)) error('resources.source', 'must be a full http(s) address')
    if (r.license && !(r.license in LICENSES)) error('resources.license', `must be one of: ${Object.keys(LICENSES).join(', ')}`)
    ;(r.files ?? []).forEach((f, i) => {
      if (!text(f.label) || !isHttpUrl(f.url)) error(`resources.files.${i}`, 'each file needs a label and a full address')
    })
  }

  if (fileExists) {
    for (const field of ['cover', 'og']) if (entry[field] && !fileExists(entry[field])) error(field, `file not found: src/static/${entry[field]}`)
    screenshots.forEach((s, i) => {
      if (!fileExists(s.src)) error(`screenshots.${i}`, `file not found: src/static/${s.src}`)
    })
  }

  return issues
}
