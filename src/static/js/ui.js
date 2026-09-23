// Small helpers shared by the page scripts: DOM lookups, escaping, number and
// time formatting, avatars, toasts and the shared dialog.

export const $ = (selector, root = document) => root.querySelector(selector)
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)]
export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch])

// A tiny HTML template tag: interpolated values are escaped unless they came
// from another h`` call (or an array of them).
class Safe {
  constructor(value) {
    this.value = value
  }
  toString() {
    return this.value
  }
}
const part = (v) => (v == null || v === false ? '' : v instanceof Safe ? v.value : Array.isArray(v) ? v.map(part).join('') : esc(v))
export function h(strings, ...values) {
  let out = strings[0]
  values.forEach((v, i) => (out += part(v) + strings[i + 1]))
  return new Safe(out)
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
const plain = new Intl.NumberFormat('en')
export const fmt = (n) => (Math.abs(n) >= 10000 ? compact.format(n) : plain.format(n))
export const full = (n) => plain.format(n)
export const plural = (n, one, many = `${one}s`) => `${fmt(n)} ${n === 1 ? one : many}`

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

// "3 days ago", "yesterday", "just now". Accepts ISO timestamps, or
// YYYY-MM-DD dates, which count in whole days ("today", "last week").
export function timeAgo(value, now = Date.now()) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const today = new Date(now)
    const days = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.parse(`${value}T00:00:00Z`)) / 864e5)
    if (days <= 0) return 'today'
    if (days < 7) return rtf.format(-days, 'day')
    if (days < 30) return rtf.format(-Math.round(days / 7), 'week')
    if (days < 365) return rtf.format(-Math.round(days / 30), 'month')
    return rtf.format(-Math.round(days / 365), 'year')
  }
  const time = Date.parse(value)
  if (Number.isNaN(time)) return value
  const seconds = (now - time) / 1000
  if (Math.abs(seconds) < 60) return 'just now'
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(-Math.round(seconds / size), unit)
  }
  return 'just now'
}

// Initials and a stable colour for a player name.
export function avatar(name, size = '') {
  const text = String(name)
  const initials = (text.match(/[a-z0-9]/gi) ?? ['?']).slice(0, 2).join('').toUpperCase()
  let hash = 0
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return h`<span class="avatar${size ? ` avatar--${size}` : ''}" style="--avatar: hsl(${hash % 360} 55% 42%)" aria-hidden="true">${initials}</span>`
}

export function toast(message) {
  const host = $('[data-toasts]')
  if (!host) return
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = message
  host.append(el)
  setTimeout(() => el.remove(), 3200)
}

const COIN = '<svg width="44" height="44" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="#ffd45c" stroke="#191333" stroke-width="2.5"/><circle cx="16" cy="16" r="9.6" fill="none" stroke="#c99a3d" stroke-width="1.8"/><path d="m16 10.6 1.65 3.35 3.7.54-2.68 2.6.63 3.68L16 19.03l-3.3 1.74.63-3.68-2.68-2.6 3.7-.54Z" fill="#c99a3d"/></svg>'

// The shared dialog. `body` is trusted markup (use h`` for anything dynamic).
export function openModal({ title, body }) {
  const dialog = $('[data-modal]')
  if (!dialog?.showModal) {
    window.alert(`${title}\n\n${String(body).replace(/<[^>]+>/g, '')}`)
    return
  }
  $('[data-modal-title]', dialog).textContent = title
  $('[data-modal-body]', dialog).innerHTML = String(body)
  $('.modal__coin', dialog).innerHTML = COIN
  dialog.showModal()
}

export function debounce(fn, wait = 150) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
