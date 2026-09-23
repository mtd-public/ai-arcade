// Sample community data for preview mode (?preview=1). Every player name,
// number, comment and clip here is made up, and the site says so with a banner
// on every page while preview mode is on. It exists so the portal UI can be
// judged with activity in it, and it doubles as a worked example of the
// community data format a backend should return (docs/PORTAL.md).
//
// The build writes it to dist/data/sample-community.json. It's deterministic:
// the same catalog always produces the same numbers.

const PLAYERS = [
  'pixel_pilot',
  'coinop_kid',
  'neon_ghost',
  '8bit_bard',
  'joystick_jen',
  'crt_carl',
  'lagfree_liz',
  'turbo_tomo',
  'bossrush_bea',
  'quarter_quinn',
  'sprite_sam',
  'highscore_hal',
]

// Each comment comes with a reply that fits it.
const COMMENTS = [
  {
    body: (g) => `Played ${g.title} on my phone on the bus. The controls feel great with one thumb.`,
    reply: () => 'Same here, it plays great one-handed.',
  },
  {
    body: (g) => `${g.title} gets hard fast. Took me a dozen runs before I got anywhere.`,
    reply: () => 'Took me forever as well. Worth it though.',
  },
  {
    body: () => 'Love the art style. Hard to believe all of it is generated in code.',
    reply: () => 'Agreed, it looks great on a big screen too.',
  },
  {
    body: (g) => (g.tips?.[0] ? `Tip that finally worked for me: ${g.tips[0]}` : 'Anyone have tips? I keep dying in the same spot.'),
    reply: (g) => (g.tips?.[1] ? `Also: ${g.tips[1]}` : 'Slow down and learn the patterns. It clicks eventually.'),
  },
  {
    body: () => 'Would play a co-op mode of this in a heartbeat.',
    reply: () => 'Co-op with an AI partner would be wild.',
  },
  {
    body: () => 'Bookmarked. Coming back to take the top spot on the leaderboard.',
    reply: () => 'Good luck, see you up there.',
  },
  {
    body: (g) => `The ${g.orientation === 'landscape' ? 'landscape layout' : 'portrait layout'} works really well on my phone.`,
    reply: () => 'Agreed, no awkward rotating needed.',
  },
]

const CLIP_TITLES = {
  'dive-depths': 'Taking down the Kracken with the laser ultimate',
  'labyrinth-larry': 'No-death run through the first circle',
  'gig-ambulance': 'Three pizzas and a patient in one drift',
  'sub-sinkers': 'Stage 1 boss: sinking the battleship',
}

// Small seeded random number generator, so output is stable between builds.
function seeded(text) {
  let h = 2166136261
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

const hoursAgo = (now, hours) => new Date(now - hours * 36e5).toISOString()

export function sampleCommunity(games, now = Date.now()) {
  const data = {
    generatedAt: new Date(now).toISOString(),
    sample: true,
    games: {},
    comments: {},
    leaderboards: {},
    achievements: {},
    clips: [],
    players: [],
  }
  const points = {}

  for (const game of games) {
    const r = seeded(game.slug)
    const plays = Math.round(900 + r() * 24000)
    const up = Math.round(plays * (0.02 + r() * 0.05))
    const down = Math.round(up * (0.03 + r() * 0.16))
    const weekShare = 0.05 + r() * 0.35

    // Distinct comments from distinct players, each reply from someone else.
    const thread = []
    const count = 2 + Math.floor(r() * 4)
    const firstComment = Math.floor(r() * COMMENTS.length)
    const firstPlayer = Math.floor(r() * PLAYERS.length)
    for (let i = 0; i < count; i++) {
      const template = COMMENTS[(firstComment + i) % COMMENTS.length]
      const player = (firstPlayer + i * 5) % PLAYERS.length
      const comment = {
        id: `${game.slug}-c${i + 1}`,
        by: PLAYERS[player],
        at: hoursAgo(now, 2 + i * 9 + r() * 30),
        body: template.body(game),
        score: Math.round(r() * 40) - 2,
        replies: [],
      }
      if (r() > 0.55) {
        comment.replies.push({
          id: `${comment.id}-r1`,
          by: PLAYERS[(player + 1 + Math.floor(r() * (PLAYERS.length - 1))) % PLAYERS.length],
          at: hoursAgo(now, 1 + i * 6 + r() * 12),
          body: template.reply(game),
          score: Math.round(r() * 12),
          replies: [],
        })
      }
      thread.push(comment)
    }
    data.comments[game.slug] = thread

    const scale = [100, 1000, 10000][Math.floor(r() * 3)]
    let score = Math.round((20 + r() * 80) * scale)
    const board = []
    const used = new Set()
    for (let rank = 1; rank <= 8; rank++) {
      let player = PLAYERS[Math.floor(r() * PLAYERS.length)]
      while (used.has(player)) player = PLAYERS[(PLAYERS.indexOf(player) + 1) % PLAYERS.length]
      used.add(player)
      const modeRoll = r()
      board.push({
        rank,
        player,
        score,
        mode: modeRoll > 0.85 ? 'coop' : modeRoll > 0.7 ? 'copilot' : 'solo',
        at: hoursAgo(now, 3 + r() * 24 * 12),
      })
      points[player] = (points[player] ?? 0) + (9 - rank) * 10
      score = Math.round(score * (0.72 + r() * 0.24))
    }
    data.leaderboards[game.slug] = board

    if (game.achievements?.length) {
      data.achievements[game.slug] = Object.fromEntries(game.achievements.map((a) => [a.id, Math.round(3 + r() * 55)]))
    }

    const clips = CLIP_TITLES[game.slug] ? 1 : 0
    data.games[game.slug] = {
      up,
      down,
      plays,
      comments: thread.reduce((n, c) => n + 1 + c.replies.length, 0),
      clips,
      week: {
        up: Math.round(up * weekShare),
        down: Math.round(down * weekShare),
        plays: Math.round(plays * weekShare),
        comments: Math.min(thread.length, Math.round(1 + r() * 3)),
      },
    }
    if (clips) {
      data.clips.push({
        id: `${game.slug}-clip-1`,
        game: game.slug,
        title: CLIP_TITLES[game.slug],
        by: PLAYERS[Math.floor(r() * PLAYERS.length)],
        youtubeId: null,
        poster: game.screenshots?.[0]?.src ?? game.cover,
        duration: `0:${String(20 + Math.floor(r() * 39)).padStart(2, '0')}`,
        at: hoursAgo(now, 5 + r() * 72),
        featured: data.clips.length === 0,
      })
    }
  }

  data.players = Object.entries(points)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, pts], i) => ({ rank: i + 1, name, points: pts, games: Object.values(data.leaderboards).filter((b) => b.some((e) => e.player === name)).length }))

  return data
}
