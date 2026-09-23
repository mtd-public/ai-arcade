// Leaderboards page: tabs for the overall board and each game, filled in from
// community data when a board is first shown. ?game=<slug> opens that game.

import * as api from '../api.js'
import { playersTable, scoreTable } from '../render.js'
import { $, $$, full } from '../ui.js'

export function init() {
  const tabs = $$('[data-lb-tab]')
  const panels = $$('[data-lb-panel]')
  const loaded = new Set()

  async function load(id) {
    if (loaded.has(id)) return
    loaded.add(id)
    const panel = panels.find((p) => p.dataset.lbPanel === id)
    const body = $('[data-lb-body]', panel)
    if (id === 'overall') {
      const players = await api.topPlayers()
      if (players.length) body.innerHTML = String(playersTable(players))
      return
    }
    const best = api.myBest(id)
    if (best) {
      $('[data-my-best-score]', panel).textContent = full(best.score)
      $('[data-my-best]', panel).hidden = false
    }
    const entries = await api.leaderboard(id)
    if (entries.length) body.innerHTML = String(scoreTable(entries))
  }

  function show(id, { updateUrl = true } = {}) {
    if (!panels.some((p) => p.dataset.lbPanel === id)) id = 'overall'
    tabs.forEach((tab) => {
      const on = tab.dataset.lbTab === id
      tab.classList.toggle('is-active', on)
      tab.setAttribute('aria-pressed', String(on))
      if (on) tab.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    })
    panels.forEach((panel) => (panel.hidden = panel.dataset.lbPanel !== id))
    load(id)
    if (updateUrl) {
      const url = new URL(location.href)
      if (id === 'overall') url.searchParams.delete('game')
      else url.searchParams.set('game', id)
      history.replaceState(null, '', url)
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => show(tab.dataset.lbTab)))
  show(new URLSearchParams(location.search).get('game') ?? 'overall', { updateUrl: false })
}
