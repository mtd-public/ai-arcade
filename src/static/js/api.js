// The one place the site reads and writes community data: votes, plays,
// comments, clips, leaderboards, achievements, saved games and submissions.
// Pages never fetch anything themselves; they call these functions.
//
// Today there's no backend, so:
//   - community numbers come from a static snapshot (data/community.json),
//     which is empty until something fills it in;
//   - your own votes, saves, best scores and drafts are kept in this browser;
//   - things that need an account (comments, submitting) report "not yet".
//
// Preview mode (?preview=1) swaps in labelled sample data so the UI can be
// judged with activity in it. When a backend exists, set `portal.apiBase` in
// site.config.mjs; the `remote` branches below call the endpoints listed in
// docs/PORTAL.md, and no page code has to change.

import { hasData, statsFor } from './ranking.js'

export const config = (() => {
  try {
    return JSON.parse(document.getElementById('arcade-config')?.textContent || '{}')
  } catch {
    return {}
  }
})()

// ---- Storage that never throws (private windows, blocked storage) ----------

const store = {
  get(key, fallback) {
    try {
      const value = localStorage.getItem(`arcade:${key}`)
      return value == null ? fallback : JSON.parse(value)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`arcade:${key}`, JSON.stringify(value))
    } catch {
      // Not persisted; the page still works for this visit.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(`arcade:${key}`)
    } catch {
      // Nothing to do.
    }
  },
}

// ---- Preview mode ------------------------------------------------------------

export const preview = (() => {
  const param = new URLSearchParams(location.search).get('preview')
  try {
    if (param === '1') sessionStorage.setItem('arcade:preview', '1')
    if (param === '0') sessionStorage.removeItem('arcade:preview')
    return sessionStorage.getItem('arcade:preview') === '1'
  } catch {
    return param === '1'
  }
})()

// Thrown by features that need accounts or a backend that doesn't exist yet.
export class NotAvailable extends Error {
  constructor(feature, message) {
    super(message ?? `${feature} isn't available yet.`)
    this.feature = feature
  }
}

// ---- Remote backend (used when portal.apiBase is set) --------------------------

const remote = Boolean(config.apiBase) && !preview

async function request(method, path, body) {
  const response = await fetch(`${config.apiBase.replace(/\/+$/, '')}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error(`${method} ${path} failed with ${response.status}`)
  return response.status === 204 ? null : response.json()
}

// ---- Community data --------------------------------------------------------------

let snapshot = null

function loadCommunity() {
  snapshot ??= (
    remote
      ? request('GET', '/community')
      : fetch(preview ? config.sampleUrl : config.dataUrl).then((r) => (r.ok ? r.json() : {}))
  ).catch(() => ({}))
  return snapshot
}

const votes = () => store.get('votes', {})

// Community data plus your own vote. `available` is false while nothing is
// tracking votes or plays yet, so pages can show honest empty states.
export async function community() {
  const data = await loadCommunity()
  return {
    data,
    available: hasData(data),
    sample: Boolean(data.sample),
    stats(slug) {
      const s = statsFor(data, slug)
      const v = remote ? 0 : (votes()[slug] ?? 0)
      if (v > 0) {
        s.up += 1
        s.week.up += 1
      } else if (v < 0) {
        s.down += 1
        s.week.down += 1
      }
      return s
    },
  }
}

export const myVote = (slug) => votes()[slug] ?? 0

// dir is 1 (up) or -1 (down). Voting the same way twice clears the vote.
export async function vote(slug, dir) {
  const all = votes()
  const value = all[slug] === dir ? 0 : dir
  if (value) all[slug] = value
  else delete all[slug]
  store.set('votes', all)
  if (remote) await request('POST', `/games/${slug}/vote`, { value })
  return value
}

export const comments = async (slug) =>
  remote ? request('GET', `/games/${slug}/comments`) : ((await loadCommunity()).comments?.[slug] ?? [])

export async function postComment(slug, body) {
  if (!remote) throw new NotAvailable('Comments', 'Comments open when accounts launch.')
  return request('POST', `/games/${slug}/comments`, { body })
}

export const leaderboard = async (slug) =>
  remote ? request('GET', `/games/${slug}/leaderboard`) : ((await loadCommunity()).leaderboards?.[slug] ?? [])

export const topPlayers = async () => (remote ? request('GET', '/players/top') : ((await loadCommunity()).players ?? []))

export async function clips({ game, featured } = {}) {
  const list = remote ? await request('GET', `/clips${game ? `?game=${encodeURIComponent(game)}` : ''}`) : ((await loadCommunity()).clips ?? [])
  return list.filter((c) => (!game || c.game === game) && (!featured || c.featured))
}

// Share of players who've unlocked each achievement, e.g. { krackenSlayer: 12 }.
export const achievementRates = async (slug) =>
  remote ? request('GET', `/games/${slug}/achievements`) : ((await loadCommunity()).achievements?.[slug] ?? {})

// ---- Things games report through the Arcade Bridge -----------------------------

export async function recordPlay(slug) {
  const plays = store.get('plays', {})
  plays[slug] = (plays[slug] ?? 0) + 1
  store.set('plays', plays)
  if (remote) await request('POST', `/games/${slug}/plays`).catch(() => {})
}

export const myBest = (slug) => store.get('best', {})[slug] ?? null

export async function reportScore(slug, score, mode = 'solo') {
  const best = store.get('best', {})
  if (!(best[slug]?.score >= score)) {
    best[slug] = { score, mode, at: new Date().toISOString() }
    store.set('best', best)
  }
  if (remote) await request('POST', `/games/${slug}/scores`, { score, mode }).catch(() => {})
}

export const unlocked = (slug) => store.get('unlocked', {})[slug] ?? []

export function unlock(slug, id) {
  const all = store.get('unlocked', {})
  all[slug] = [...new Set([...(all[slug] ?? []), id])]
  store.set('unlocked', all)
  if (remote) request('POST', `/games/${slug}/achievements`, { id }).catch(() => {})
}

// ---- Saved games ---------------------------------------------------------------

export const savedGames = () => store.get('saved', [])
export const isSaved = (slug) => savedGames().includes(slug)

export function toggleSave(slug) {
  const saved = new Set(savedGames())
  if (saved.has(slug)) saved.delete(slug)
  else saved.add(slug)
  store.set('saved', [...saved])
  return saved.has(slug)
}

// ---- Accounts ------------------------------------------------------------------

export async function session() {
  return remote ? request('GET', '/session').catch(() => null) : null
}

export function signIn() {
  if (!remote) throw new NotAvailable('Accounts', 'Accounts are coming soon. Voting and saving already work on this device.')
  location.href = `${config.apiBase.replace(/\/+$/, '')}/auth/sign-in?return=${encodeURIComponent(location.href)}`
}

// ---- Submissions ---------------------------------------------------------------

export const loadDraft = (kind) => store.get(`draft:${kind}`, null)
export const saveDraft = (kind, data) => store.set(`draft:${kind}`, { ...data, savedAt: new Date().toISOString() })
export const clearDraft = (kind) => store.remove(`draft:${kind}`)

// kind is 'game' or 'media'. Files (screenshots, clips) are passed separately
// because they'd be uploaded, not stored with the draft.
// The page saves the form as a draft before calling this, so nothing is lost
// while submissions are closed or if the request fails.
export async function submit(kind, data, files = []) {
  if (!remote) return { status: 'closed', savedDraft: true }
  const body = new FormData()
  body.append('data', JSON.stringify(data))
  for (const { field, file } of files) body.append(field, file)
  const response = await fetch(`${config.apiBase.replace(/\/+$/, '')}/submissions/${kind}`, { method: 'POST', credentials: 'include', body })
  if (!response.ok) throw new Error(`Submission failed with ${response.status}`)
  return response.json()
}
