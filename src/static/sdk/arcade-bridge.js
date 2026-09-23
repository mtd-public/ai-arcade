/*
 * AI Arcade Bridge, v1
 *
 * Lets a game talk to the arcade when it runs inside the arcade's in-page
 * player: report scores and achievements, learn which play mode was picked,
 * and (later) exchange state and hints with the AI co-pilot or co-op partner.
 * Outside the arcade every call is a harmless no-op, so it's safe to ship.
 *
 *   <script src="https://YOUR-ARCADE/sdk/arcade-bridge.js"></script>
 *
 *   ArcadeBridge.mode              'solo' | 'copilot' | 'coop', from ?arcade_mode=
 *   ArcadeBridge.ready()           the game has loaded and can take input
 *   ArcadeBridge.score(1234)       a run finished with this score
 *   ArcadeBridge.gameOver({ score }) the run is over (lost, or finished). Call it
 *                                  when the game-over screen shows: Discover mode
 *                                  ends the turn and asks for a review. A score
 *                                  here is recorded too, so skip score() then.
 *   ArcadeBridge.achievement(id)   an achievement unlocked (ids from the catalog)
 *   ArcadeBridge.state({ ... })    a small snapshot of game state, for the AI
 *   ArcadeBridge.on(type, fn)      messages from the arcade: 'hint' for the
 *                                  co-pilot, 'input' for the co-op AI player
 *
 * Messages are plain objects: { source, version, type, payload }. The arcade
 * only accepts them from the frame it opened. See docs/PORTAL.md.
 */
;(function () {
  var embedded = window.parent && window.parent !== window
  var mode = new URLSearchParams(location.search).get('arcade_mode') || 'solo'
  var handlers = {}

  function send(type, payload) {
    if (!embedded) return
    window.parent.postMessage({ source: 'ai-arcade-game', version: 1, type: type, payload: payload || {} }, '*')
  }

  window.addEventListener('message', function (event) {
    var data = event.data
    if (!data || data.source !== 'ai-arcade' || event.source !== window.parent) return
    ;(handlers[data.type] || []).forEach(function (fn) {
      fn(data.payload)
    })
  })

  window.ArcadeBridge = {
    version: 1,
    embedded: embedded,
    mode: mode,
    ready: function () {
      send('ready', { mode: mode })
    },
    score: function (value) {
      if (typeof value === 'number' && isFinite(value)) send('score', { score: Math.round(value), mode: mode })
    },
    gameOver: function (details) {
      var score = details && details.score
      send('game-over', { score: typeof score === 'number' && isFinite(score) ? Math.round(score) : null, mode: mode })
    },
    achievement: function (id) {
      if (id) send('achievement', { id: String(id) })
    },
    state: function (snapshot) {
      send('state', snapshot)
    },
    on: function (type, fn) {
      ;(handlers[type] = handlers[type] || []).push(fn)
    },
  }
})()
