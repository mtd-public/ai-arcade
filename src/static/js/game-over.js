// Notices when a game running in an iframe reaches game over, two ways:
//
//   1. The game says so through the Arcade Bridge: ArcadeBridge.gameOver().
//      Works wherever the game is hosted. This is the way for new games.
//   2. The arcade spots the game's own game-over screen, using the `gameOver`
//      rules from the catalog (src/data/games.mjs): a CSS selector for the
//      screen or its "play again" button, plus an optional text pattern. This
//      needs the game on the same origin as the arcade, so it can look inside.
//
// It reports the moment the game-over screen appears, so a game played again
// and lost again is reported again.

const CHECK_EVERY = 400

export function watchGameOver(frame, game, onGameOver) {
  const origin = new URL(game.url, location.href).origin
  const rules = (game.gameOver ?? []).map(({ selector, text }) => ({ selector, pattern: text ? new RegExp(text, 'i') : null }))
  let showing = null // unknown until the first look
  let stopped = false

  const report = (how, details = {}) => {
    if (!stopped) onGameOver({ how, ...details })
  }

  const onMessage = (event) => {
    if (event.source !== frame.contentWindow || event.origin !== origin) return
    const data = event.data
    if (data?.source === 'ai-arcade-game' && data.type === 'game-over') report('bridge', { score: data.payload?.score ?? null })
  }
  window.addEventListener('message', onMessage)

  // Is a game-over screen showing? null when we can't look inside the game.
  const look = () => {
    let doc = null
    try {
      doc = frame.contentDocument
    } catch {
      // Another origin: nothing to look at.
    }
    if (!doc?.body || !rules.length) return null
    return rules.some(({ selector, pattern }) => {
      try {
        return [...doc.querySelectorAll(selector)].some((el) => el.getClientRects().length > 0 && (!pattern || pattern.test(el.textContent)))
      } catch {
        return false // a selector the game's page can't parse
      }
    })
  }

  const timer = setInterval(() => {
    const now = look()
    if (now === null) return
    if (now && showing === false) report('screen')
    showing = now
  }, CHECK_EVERY)

  return {
    // Whether the arcade can see the game-over screen itself (same origin and
    // rules in the catalog), as opposed to relying on the Bridge alone.
    canSee: () => look() !== null,
    stop() {
      stopped = true
      clearInterval(timer)
      window.removeEventListener('message', onMessage)
    },
  }
}
