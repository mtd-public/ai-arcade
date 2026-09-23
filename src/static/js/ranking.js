// Sorting and ranking, shared by the build (the order games appear in the
// HTML) and the browser (re-sorting when community data loads or the visitor
// picks another sort). Works in Node and in the browser: no DOM, no globals.
//
// Community stats for one game look like this (see docs/PORTAL.md):
//   { up, down, plays, comments, clips, week: { up, down, plays, comments } }
// `week` counts only the last 7 days, which is what "Hot" ranks on.

export const SORTS = [
  { id: 'hot', label: 'Hot', needsData: false, hint: 'Trending this week, with a boost for new games' },
  { id: 'new', label: 'New', needsData: false, hint: 'Newest games first' },
  { id: 'top', label: 'Top', needsData: true, hint: 'Most upvoted of all time' },
  { id: 'played', label: 'Most played', needsData: true, hint: 'Most plays of all time' },
  { id: 'az', label: 'A–Z', needsData: false, hint: 'Alphabetical' },
]

export function emptyStats() {
  return { up: 0, down: 0, plays: 0, comments: 0, clips: 0, week: { up: 0, down: 0, plays: 0, comments: 0 } }
}

// Stats for one game, with every field present.
export function statsFor(community, slug) {
  const base = emptyStats()
  const s = community?.games?.[slug]
  if (!s) return base
  return { ...base, ...s, week: { ...base.week, ...(s.week ?? {}) } }
}

// Whether the data source actually tracks votes and plays. The static snapshot
// has `generatedAt: null` until a backend fills it in.
export const hasData = (community) => Boolean(community?.generatedAt)

export const netVotes = (s) => (s.up ?? 0) - (s.down ?? 0)
export const totalVotes = (s) => (s.up ?? 0) + (s.down ?? 0)
export const approval = (s) => (totalVotes(s) ? Math.round((100 * s.up) / totalVotes(s)) : null)

// "Hot": this week's activity on a log scale, so popular games rise without
// one runaway hit burying everything, plus a freshness boost that fades over
// two weeks so brand-new games get seen. With no data at all, it's just
// newest-first.
export function hotScore(game, s, now = Date.now()) {
  const w = s.week ?? {}
  const activity = 3 * ((w.up ?? 0) - (w.down ?? 0)) + (w.plays ?? 0) / 10 + 2 * (w.comments ?? 0)
  const trend = Math.sign(activity) * Math.log10(1 + Math.abs(activity))
  const ageDays = game.added ? (now - Date.parse(`${game.added}T00:00:00Z`)) / 864e5 : 365
  const freshness = Math.max(0, 1 - ageDays / 14)
  return trend + freshness
}

const comparators = {
  hot: (a, b, now) => hotScore(b.game, b.stats, now) - hotScore(a.game, a.stats, now),
  new: (a, b) => (b.game.added ?? '').localeCompare(a.game.added ?? ''),
  top: (a, b) => netVotes(b.stats) - netVotes(a.stats) || (approval(b.stats) ?? 0) - (approval(a.stats) ?? 0),
  played: (a, b) => b.stats.plays - a.stats.plays,
  az: (a, b) => a.game.title.localeCompare(b.game.title),
}

// Returns a new array of games in the chosen order. Ties keep catalog order.
// `games` only needs { slug, title, added }.
export function sortGames(games, community, sortId = 'hot', now = Date.now()) {
  const compare = comparators[sortId] ?? comparators.hot
  return games
    .map((game, index) => ({ game, index, stats: statsFor(community, game.slug) }))
    .sort((a, b) => compare(a, b, now) || a.index - b.index)
    .map((entry) => entry.game)
}
