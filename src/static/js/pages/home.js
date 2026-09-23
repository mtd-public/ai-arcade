// Home page: the featured carousel, and the feed's sorting, genre filter,
// search, saved filter and list/cabinet views, plus the sidebar's community
// cards. The feed rows are already in the HTML; this reorders and filters
// them, and fills in numbers when community data is available.

import * as api from '../api.js'
import { SORTS, sortGames } from '../ranking.js'
import { playersList, rankTopList, videoCard } from '../render.js'
import { $, $$, plural, reduceMotion } from '../ui.js'

export async function init({ community }) {
  initCarousel()

  const feed = $('[data-feed]')
  if (!feed) return
  const games = $$('[data-feed-item]', feed).map((el) => ({
    el,
    slug: el.dataset.slug,
    title: el.dataset.title,
    added: el.dataset.added,
    category: el.dataset.category,
    search: el.dataset.search,
  }))

  const genreSelect = $('[data-genre]')
  const savedChip = $('[data-saved-filter]')
  const status = $('[data-feed-status]')
  const empty = $('[data-feed-empty]')
  const count = $('[data-feed-count]')
  const search = $('#site-search')
  const sortButtons = $$('[data-sort]')
  const viewButtons = $$('[data-view]')

  const params = new URLSearchParams(location.search)
  const state = {
    sort: SORTS.some((s) => s.id === params.get('sort')) ? params.get('sort') : 'hot',
    genre: $$('option', genreSelect).some((o) => o.value === params.get('genre')) ? params.get('genre') : 'all',
    q: params.get('q') ?? '',
    saved: params.get('saved') === '1',
    view: 'list',
  }
  try {
    state.view = localStorage.getItem('arcade:view') === 'grid' ? 'grid' : 'list'
  } catch {
    // Default view.
  }
  if (search) search.value = state.q

  // Until community data loads (or if there is none), rank on catalog data.
  let c = { available: false, stats: () => ({ up: 0, down: 0, plays: 0, comments: 0, clips: 0, week: {} }) }
  const snapshot = () => ({ generatedAt: c.available ? 'now' : null, games: Object.fromEntries(games.map((g) => [g.slug, c.stats(g.slug)])) })

  function render({ updateUrl = true } = {}) {
    // A sort that needs data falls back to Hot until there is some.
    const sort = !c.available && SORTS.find((s) => s.id === state.sort)?.needsData ? 'hot' : state.sort
    const ordered = sortGames(games, snapshot(), sort)
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean)
    const saved = new Set(api.savedGames())
    let shown = 0
    for (const game of ordered) {
      const visible =
        (state.genre === 'all' || game.category === state.genre) &&
        words.every((w) => game.search.includes(w)) &&
        (!state.saved || saved.has(game.slug))
      game.el.hidden = !visible
      feed.append(game.el)
      if (visible) {
        shown += 1
        const rank = $('[data-rank]', game.el)
        rank.textContent = String(shown)
        rank.toggleAttribute('data-top', shown <= 3)
      }
    }

    for (const btn of sortButtons) {
      const on = btn.dataset.sort === sort
      btn.classList.toggle('is-active', on)
      btn.setAttribute('aria-pressed', String(on))
    }
    genreSelect.value = state.genre
    savedChip.setAttribute('aria-pressed', String(state.saved))
    for (const btn of viewButtons) btn.setAttribute('aria-pressed', String(btn.dataset.view === state.view))
    feed.classList.toggle('feed--list', state.view === 'list')
    feed.classList.toggle('feed--grid', state.view === 'grid')

    count.textContent = String(shown)
    empty.hidden = shown > 0
    const filters = [
      state.q && `matching “${state.q}”`,
      state.genre !== 'all' && genreSelect.selectedOptions[0].textContent.replace(/\s*\(\d+\)$/, ''),
      state.saved && 'saved',
    ].filter(Boolean)
    status.textContent = filters.length ? `${plural(shown, 'game')} · ${filters.join(' · ')}` : ''

    if (updateUrl) {
      const url = new URL(location.href)
      const set = (key, value, fallback) => (value && value !== fallback ? url.searchParams.set(key, value) : url.searchParams.delete(key))
      set('sort', state.sort, 'hot')
      set('genre', state.genre, 'all')
      set('q', state.q.trim(), '')
      set('saved', state.saved ? '1' : '', '')
      history.replaceState(null, '', url)
    }
  }

  sortButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      state.sort = btn.dataset.sort
      render()
    }),
  )
  genreSelect.addEventListener('change', () => {
    state.genre = genreSelect.value
    render()
  })
  savedChip.addEventListener('click', () => {
    state.saved = !state.saved
    render()
  })
  viewButtons.forEach((btn) =>
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view
      try {
        localStorage.setItem('arcade:view', state.view)
      } catch {
        // Not remembered, that's all.
      }
      render({ updateUrl: false })
    }),
  )
  $('[data-feed-clear]')?.addEventListener('click', () => {
    Object.assign(state, { genre: 'all', q: '', saved: false })
    if (search) search.value = ''
    render()
  })

  // The header search box filters the feed live on this page.
  search?.addEventListener('input', () => {
    state.q = search.value
    render()
  })
  $('[data-topsearch]')?.addEventListener('submit', (event) => {
    event.preventDefault()
    state.q = search.value
    render()
    $('#feed').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
  })

  // Genre links in the sidebar set the filter instead of reloading.
  $$('[data-genre-link]').forEach((link) =>
    link.addEventListener('click', (event) => {
      event.preventDefault()
      state.genre = link.dataset.genreLink
      render()
      $('#feed').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
    }),
  )

  document.addEventListener('arcade:save', () => state.saved && render({ updateUrl: false }))

  render({ updateUrl: false })
  if (state.q || location.hash === '#feed') $('#feed').scrollIntoView()

  // ---- Community data ----------------------------------------------------------
  c = await community
  // Sorts that need community data unlock once there is some.
  if (c.available) {
    for (const btn of sortButtons.filter((b) => b.hasAttribute('data-needs-data'))) {
      btn.disabled = false
      btn.title = SORTS.find((s) => s.id === btn.dataset.sort).hint
      $('svg:last-child', btn)?.remove()
    }
  }
  if (c.available) {
    for (const game of games) {
      const s = c.stats(game.slug)
      const comments = $('[data-stat="comments"]', game.el)
      if (comments) comments.textContent = plural(s.comments, 'comment')
      showStat(game.el, 'plays', plural(s.plays, 'play'))
      if (s.clips) showStat(game.el, 'clips', plural(s.clips, 'clip'))
    }
  }
  render({ updateUrl: false })
  rankTopList($('[data-top5]'), c)
  document.addEventListener('arcade:vote', () => rankTopList($('[data-top5]'), c))

  const players = await api.topPlayers()
  if (players.length) $('[data-players-body]').innerHTML = String(playersList(players))

  const [clip] = await api.clips({ featured: true })
  if (clip) {
    $('[data-featured-clip-body]').innerHTML = String(videoCard(clip))
    $('[data-featured-clip]').hidden = false
  }
}

function showStat(root, name, text) {
  const wrap = $(`[data-stat-wrap="${name}"]`, root)
  if (!wrap) return
  $(`[data-stat="${name}"]`, wrap).textContent = text
  wrap.hidden = false
}

// Featured spotlight: arrows, thumbnail dots, arrow keys and swipes.
function initCarousel() {
  const carousel = $('[data-carousel]')
  if (!carousel) return
  const slides = $$('[data-slide]', carousel)
  const dots = $$('[data-carousel-dot]', carousel)
  if (slides.length < 2) return
  let current = 0

  const show = (index) => {
    current = (index + slides.length) % slides.length
    slides.forEach((slide, i) => (slide.hidden = i !== current))
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)))
  }

  $('[data-carousel-prev]', carousel)?.addEventListener('click', () => show(current - 1))
  $('[data-carousel-next]', carousel)?.addEventListener('click', () => show(current + 1))
  dots.forEach((dot, i) => dot.addEventListener('click', () => show(i)))
  carousel.addEventListener('keydown', (event) => {
    if (event.target.closest('input, textarea')) return
    if (event.key === 'ArrowRight') show(current + 1)
    if (event.key === 'ArrowLeft') show(current - 1)
  })

  let startX = null
  carousel.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse') startX = event.clientX
  })
  carousel.addEventListener('pointerup', (event) => {
    if (startX == null) return
    const dx = event.clientX - startX
    startX = null
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1))
  })
}
