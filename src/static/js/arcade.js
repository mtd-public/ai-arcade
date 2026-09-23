// AI Arcade: small progressive enhancements. Every page still works without
// this file: links go to the games, and the filters simply don't appear to do
// anything.
;(() => {
  const $ = (selector, root = document) => root.querySelector(selector)
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---- Mobile menu ----------------------------------------------------------
  const header = $('.site-header')
  const toggle = $('[data-nav-toggle]')
  const setMenu = (open) => {
    header.classList.toggle('is-open', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    document.body.style.overflow = open ? 'hidden' : ''
  }
  if (header && toggle) {
    toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-open')))
    $$('#mobile-nav a').forEach((link) => link.addEventListener('click', () => setMenu(false)))
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        setMenu(false)
        toggle.focus()
      }
    })
    window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && setMenu(false))
  }

  // ---- Scroll progress bar in the header -----------------------------------
  const progress = $('[data-scroll-progress]')
  if (progress) {
    let queued = false
    const update = () => {
      queued = false
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`
    }
    const queue = () => {
      if (!queued) {
        queued = true
        requestAnimationFrame(update)
      }
    }
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    update()
  }

  // ---- Fade sections in as they scroll into view ---------------------------
  const reveals = $$('[data-reveal]')
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    reveals.forEach((el) => observer.observe(el))
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'))
  }

  // ---- "Random game" button ----------------------------------------------
  $$('[data-random]').forEach((button) =>
    button.addEventListener('click', (event) => {
      const targets = button.dataset.random.split(' ').filter(Boolean)
      if (!targets.length) return
      event.preventDefault()
      window.location.href = targets[Math.floor(Math.random() * targets.length)]
    }),
  )

  // ---- Genre filters and search on the home page ---------------------------
  const grid = $('[data-grid]')
  if (grid) {
    const cards = $$('[data-game-card]', grid)
    const buttons = $$('[data-filter]')
    const search = $('[data-search]')
    const results = $('[data-results]')
    const empty = $('[data-empty]')
    let genre = 'all'

    const apply = (updateUrl = true) => {
      const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
      let shown = 0
      for (const card of cards) {
        const match =
          (genre === 'all' || card.dataset.category === genre) && words.every((w) => card.dataset.search.includes(w))
        card.hidden = !match
        if (match) shown++
      }
      for (const button of buttons) {
        const on = button.dataset.filter === genre
        button.classList.toggle('is-active', on)
        button.setAttribute('aria-pressed', String(on))
      }
      empty.hidden = shown > 0
      results.textContent = genre === 'all' && !words.length ? '' : `${shown} ${shown === 1 ? 'game' : 'games'} found`

      if (updateUrl) {
        const url = new URL(window.location.href)
        if (genre === 'all') url.searchParams.delete('genre')
        else url.searchParams.set('genre', genre)
        if (words.length) url.searchParams.set('q', search.value.trim())
        else url.searchParams.delete('q')
        window.history.replaceState(null, '', url)
      }
    }

    buttons.forEach((button) =>
      button.addEventListener('click', () => {
        genre = button.dataset.filter
        apply()
      }),
    )
    search.addEventListener('input', () => apply())
    $('[data-clear]')?.addEventListener('click', () => {
      genre = 'all'
      search.value = ''
      apply()
      search.focus()
    })

    // Restore a shared or bookmarked filter, e.g. /?genre=shooter#games
    const params = new URLSearchParams(window.location.search)
    const wanted = params.get('genre')
    if (wanted && buttons.some((b) => b.dataset.filter === wanted)) genre = wanted
    if (params.get('q')) search.value = params.get('q')
    apply(false)
  }

  // ---- 404: "CONTINUE? 9 8 7 ..." ------------------------------------------
  const countdown = $('[data-countdown]')
  if (countdown && !reduceMotion) {
    let n = Number(countdown.textContent)
    const tick = setInterval(() => {
      n -= 1
      if (n >= 0) countdown.textContent = String(n)
      else {
        clearInterval(tick)
        countdown.parentElement.textContent = 'Insert coin'
      }
    }, 1000)
  }

  // ---- In-page game player -------------------------------------------------
  const player = $('[data-player]')
  if (player) {
    const screen = $('[data-player-screen]', player)
    const start = $('[data-embed-src]', player)
    const fullscreenButton = $('[data-player-fullscreen]', player)
    const closeButton = $('[data-player-close]', player)
    const requestFullscreen = screen.requestFullscreen || screen.webkitRequestFullscreen
    let frame = null

    const play = () => {
      if (!start || frame) return
      frame = document.createElement('iframe')
      frame.className = 'player__frame'
      frame.src = start.dataset.embedSrc
      frame.title = `${start.dataset.embedTitle} (game)`
      frame.allow = 'fullscreen; autoplay; gamepad; accelerometer; gyroscope'
      frame.allowFullscreen = true
      // Send keyboard input to the game as soon as it loads.
      frame.addEventListener('load', () => frame && frame.focus())
      screen.append(frame)
      player.classList.add('is-playing')
      if (fullscreenButton) fullscreenButton.hidden = !requestFullscreen
      if (closeButton) closeButton.hidden = false
    }

    // Drop the coin in the slot, then start the game.
    const insertCoin = () => {
      if (frame || player.classList.contains('is-inserting')) return
      if (reduceMotion) return play()
      player.classList.add('is-inserting')
      setTimeout(play, 420)
    }

    const stop = () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      frame?.remove()
      frame = null
      player.classList.remove('is-playing', 'is-inserting')
      if (fullscreenButton) fullscreenButton.hidden = true
      if (closeButton) closeButton.hidden = true
      start?.focus()
    }

    start?.addEventListener('click', (event) => {
      event.preventDefault()
      insertCoin()
    })
    closeButton?.addEventListener('click', stop)
    fullscreenButton?.addEventListener('click', () => {
      const result = requestFullscreen?.call(screen)
      if (result?.catch) result.catch(() => window.open(start.dataset.embedSrc, '_blank', 'noopener'))
      frame?.focus()
    })

    // "Play now" in the page header scrolls to the player and starts the game.
    $$('[data-play-now]').forEach((link) =>
      link.addEventListener('click', (event) => {
        if (!start) return
        event.preventDefault()
        player.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
        insertCoin()
      }),
    )
  }
})()
