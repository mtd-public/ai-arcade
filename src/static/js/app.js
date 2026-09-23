// AI Arcade: entry point for every page. Handles the parts shared by all
// pages (header, menus, preview mode, votes, saves, sharing, videos, dialogs)
// and then loads the script for the current page. Every page still works
// without JavaScript: links go to the games, and forms fall back to links.

import * as api from './api.js'
import { $, $$, debounce, fmt, h, openModal, reduceMotion, timeAgo, toast } from './ui.js'

const root = document.documentElement
const community = api.community()

// ---- Light and dark themes ------------------------------------------------------
// With no saved choice the site follows the system setting. The inline script
// in <head> applies a saved choice before first paint; this runs the toggle.
// Picking the theme the system already uses clears the saved choice, so the
// site goes back to following the system.

const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches)

function paintThemeToggles() {
  const dark = isDark()
  for (const button of $$('[data-theme-toggle]')) {
    button.setAttribute('aria-pressed', String(dark))
    button.title = dark ? 'Switch to light mode' : 'Switch to dark mode'
  }
}

function setTheme(theme) {
  const followSystem = (theme === 'dark') === systemDark.matches
  if (followSystem) delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (followSystem) localStorage.removeItem('arcade:theme')
    else localStorage.setItem('arcade:theme', theme)
  } catch {
    // Storage blocked: the choice lasts until the page is closed.
  }
  paintThemeToggles()
}

$$('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => setTheme(isDark() ? 'light' : 'dark')))
systemDark.addEventListener?.('change', paintThemeToggles)
// Keep other open tabs in step.
window.addEventListener('storage', (event) => {
  if (event.key !== 'arcade:theme') return
  if (event.newValue === 'light' || event.newValue === 'dark') root.dataset.theme = event.newValue
  else delete root.dataset.theme
  paintThemeToggles()
})
paintThemeToggles()

// ---- Preview mode and notices --------------------------------------------------

if (api.preview) {
  root.classList.add('is-preview')
  $('[data-preview-banner]')?.removeAttribute('hidden')
} else {
  const notice = $('[data-community-notice]')
  let dismissed = false
  try {
    dismissed = localStorage.getItem('arcade:notice-dismissed') === '1'
  } catch {
    // Storage blocked: show the notice.
  }
  if (notice && !dismissed) notice.hidden = false
  $('[data-notice-dismiss]')?.addEventListener('click', () => {
    notice.hidden = true
    try {
      localStorage.setItem('arcade:notice-dismissed', '1')
    } catch {
      // Fine, it just comes back next time.
    }
  })
}

// ---- Header: menu, search, scroll progress -----------------------------------

const topbar = $('[data-topbar]')
const menuToggle = $('[data-nav-toggle]')
const searchToggle = $('[data-search-toggle]')
const searchInput = $('#site-search')

function setMenu(open) {
  topbar.classList.toggle('is-open', open)
  menuToggle.setAttribute('aria-expanded', String(open))
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) setSearch(false)
}

function setSearch(open) {
  topbar.classList.toggle('is-searching', open)
  searchToggle?.setAttribute('aria-expanded', String(open))
  if (open) searchInput?.focus()
}

menuToggle?.addEventListener('click', () => setMenu(!topbar.classList.contains('is-open')))
searchToggle?.addEventListener('click', () => {
  setMenu(false)
  setSearch(!topbar.classList.contains('is-searching'))
})
$$('.subnav a').forEach((link) => link.addEventListener('click', () => setMenu(false)))
window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => e.matches && (setMenu(false), setSearch(false)))

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (topbar.classList.contains('is-open')) {
      setMenu(false)
      menuToggle.focus()
    }
    if (topbar.classList.contains('is-searching')) setSearch(false)
  }
  // "/" jumps to search, unless you're typing somewhere.
  const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]')
  if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey) {
    event.preventDefault()
    if (window.matchMedia('(max-width: 900px)').matches) setSearch(true)
    else searchInput?.focus()
  }
})

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

// ---- Relative times -----------------------------------------------------------

$$('time[data-relative]').forEach((el) => {
  el.title = el.dateTime
  el.textContent = timeAgo(el.dateTime)
})

// ---- Things that need an account ---------------------------------------------------

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-sign-in]')
  if (!trigger || trigger.closest('[inert]')) return
  event.preventDefault()
  try {
    api.signIn()
  } catch (error) {
    openModal({
      title: 'Accounts are coming soon',
      body: h`<p>${error.message}</p><p>Comments, replies and reports open when accounts launch.</p>`,
    })
  }
})

// ---- Votes ---------------------------------------------------------------------------

// Paint every vote widget for one game: arrows, score, and the rating meter.
function paintVotes(slug, stats, mine) {
  for (const box of $$(`[data-vote="${slug}"]`)) {
    if (box.closest('[inert]')) continue
    box.classList.toggle('is-up', mine > 0)
    box.classList.toggle('is-down', mine < 0)
    for (const btn of $$('[data-dir]', box)) btn.setAttribute('aria-pressed', String(Number(btn.dataset.dir) === mine))

    const total = stats.up + stats.down
    const score = $('[data-score]', box)
    if (score) {
      score.textContent = total ? fmt(stats.up - stats.down) : 'Vote'
      score.classList.toggle('is-empty', !total)
    }
    if (box.hasAttribute('data-rating')) {
      const pct = total ? Math.round((100 * stats.up) / total) : 0
      $('[data-rating-meter]', box).hidden = !total
      $('[data-rating-empty]', box).hidden = Boolean(total)
      $('[data-rating-bar]', box).style.width = `${pct}%`
      $('[data-rating-up]', box).textContent = `${pct}% coin-op`
      $('[data-rating-down]', box).textContent = `${100 - pct}% game over`
      $('[data-rating-total]', box).textContent = total ? `${fmt(total)} ${total === 1 ? 'vote' : 'votes'}` : ''
    }
  }
}

community.then((c) => {
  const slugs = new Set($$('[data-vote]').map((el) => el.dataset.vote))
  for (const slug of slugs) paintVotes(slug, c.stats(slug), api.myVote(slug))
})

let votedBefore = false
document.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-vote] [data-dir]')
  if (!btn || btn.closest('[inert]')) return
  const box = btn.closest('[data-vote]')
  const slug = box.dataset.vote
  const value = await api.vote(slug, Number(btn.dataset.dir))
  const c = await community
  paintVotes(slug, c.stats(slug), value)
  if (!reduceMotion) {
    box.classList.remove('is-bumped')
    void box.offsetWidth
    box.classList.add('is-bumped')
  }
  document.dispatchEvent(new CustomEvent('arcade:vote', { detail: { slug, value } }))
  if (!votedBefore && value && !api.preview) {
    votedBefore = true
    toast('Vote saved on this device. It counts for everyone once accounts launch.')
  }
})

// ---- Save and share -------------------------------------------------------------

function paintSaves(slug) {
  const saved = api.isSaved(slug)
  for (const btn of $$(`[data-save="${slug}"]`)) {
    btn.setAttribute('aria-pressed', String(saved))
    const label = $('[data-save-label]', btn)
    if (label) label.textContent = saved ? 'Saved' : 'Save'
    else if (btn.classList.contains('btn')) btn.lastChild.textContent = saved ? ' Saved' : ' Save'
  }
}

new Set($$('[data-save]').map((el) => el.dataset.save)).forEach(paintSaves)

document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-save]')
  if (!btn || btn.closest('[inert]')) return
  const saved = api.toggleSave(btn.dataset.save)
  paintSaves(btn.dataset.save)
  toast(saved ? 'Saved. Find it with the Saved filter on the home page.' : 'Removed from your saved games.')
  document.dispatchEvent(new CustomEvent('arcade:save', { detail: { slug: btn.dataset.save, saved } }))
})

document.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-share]')
  if (!btn || btn.closest('[inert]')) return
  const url = btn.dataset.share
  const title = btn.dataset.shareTitle
  if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
    navigator.share({ title, url }).catch(() => {})
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    toast('Link copied.')
  } catch {
    openModal({ title: `Share ${title}`, body: h`<p>Copy this link:</p><p><a href="${url}">${url}</a></p>` })
  }
})

// ---- Gameplay videos: load the player only when someone presses play ----------

document.addEventListener('click', (event) => {
  const play = event.target.closest('[data-video] .video__play')
  if (!play) return
  const card = play.closest('[data-video]')
  const { youtube, src, title } = card.dataset
  if (youtube) {
    const frame = document.createElement('iframe')
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtube)}?autoplay=1&rel=0`
    frame.title = title
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
    frame.allowFullscreen = true
    card.replaceChildren(frame)
  } else if (src) {
    const video = document.createElement('video')
    video.src = src
    video.controls = true
    video.autoplay = true
    video.playsInline = true
    card.replaceChildren(video)
  } else {
    const note = document.createElement('p')
    note.className = 'video__notice'
    note.textContent = "Sample clip: there's no video behind this one. Real clips play right here."
    card.append(note)
  }
})

// ---- 404: "CONTINUE? 9 8 7 ..." -----------------------------------------------------

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

// ---- Page scripts ---------------------------------------------------------------------

const pages = {
  home: () => import('./pages/home.js'),
  game: () => import('./pages/game.js'),
  submit: () => import('./pages/submit.js'),
  leaderboards: () => import('./pages/leaderboards.js'),
}

pages[document.body.dataset.page]?.()
  .then((page) => page.init({ community, paintVotes, debounce }))
  .catch((error) => console.error('Page script failed to load', error))
