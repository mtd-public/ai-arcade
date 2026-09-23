// A tiny HTML template tag. Interpolated strings are escaped; nested html``
// results, arrays and raw() values are inserted as-is; null/false/true render
// nothing, so `${cond && html`...`}` works for conditionals.

class SafeHtml {
  constructor(value) {
    this.value = value
  }
  toString() {
    return this.value
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch])
}

function render(value) {
  if (value == null || value === false || value === true) return ''
  if (value instanceof SafeHtml) return value.value
  if (Array.isArray(value)) return value.map(render).join('')
  return escapeHtml(value)
}

export function html(strings, ...values) {
  let out = strings[0]
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1]
  return new SafeHtml(out)
}

export const raw = (value) => new SafeHtml(String(value))

// JSON for <script type="application/ld+json">, safe against "</script>".
export const jsonLd = (data) =>
  html`<script type="application/ld+json">${raw(JSON.stringify(data).replace(/</g, '\\u003c'))}</script>`

export const formatDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
