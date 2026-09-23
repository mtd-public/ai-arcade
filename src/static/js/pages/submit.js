// Submit page: two forms (a new game, or a clip/screenshots for an existing
// game) with a live preview, a checklist, drafts saved on this device, and
// validation by the same schema the build uses for the catalog.
//
// Submissions aren't open yet, so "Submit for review" saves the draft and
// says so. When a backend exists, api.submit() sends the entry and files; see
// docs/PORTAL.md for how an approved entry becomes a catalog game.

import * as api from '../api.js'
import { LIMITS, isHttpUrl, parseYouTube, slugify, validateGame, wordCount } from '../game-schema.js'
import { $, $$, debounce, h, openModal, timeAgo, toast } from '../ui.js'

// Card colours for the preview, by genre, echoing the catalog's games.
const ACCENTS = {
  shooter: ['#1f7fc4', '#e6f2fb'],
  arcade: ['#e8773a', '#fdf0e7'],
  runner: ['#b5462b', '#f8ebe5'],
  driving: ['#e2475a', '#fdecee'],
  sports: ['#7a5bd6', '#efeafc'],
  puzzle: ['#e5483b', '#fdeceb'],
}

const LABELS = {
  title: 'Title',
  url: 'Where it runs',
  tagline: 'Tagline',
  category: 'Genre',
  description: 'Description',
  tags: 'Tags',
  cover: 'Cover image',
  screenshots: 'Screenshots',
  video: 'YouTube link',
  clip: 'Clip',
  controls: 'Controls',
  achievements: 'Achievements',
  'resources.source': 'Source code link',
  'resources.license': 'License',
  'resources.files': 'Agent resources',
  name: 'Display name',
  email: 'Email',
  rights: 'Rights',
  rules: 'Guidelines',
  game: 'Game',
  media: 'Media',
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const files = { game: new Map(), media: new Map() }

export function init() {
  const forms = { game: $('[data-submit-form="game"]'), media: $('[data-submit-form="media"]') }
  if (!forms.game) return

  for (const [kind, form] of Object.entries(forms)) {
    const repeaters = initRepeaters(form)
    initToggles(form)
    initFiles(kind, form)
    initYouTube(form)
    restoreDraft(kind, form, repeaters)

    const refresh = () => {
      updateCounters(form)
      if (kind === 'game') {
        updatePreview(form)
        updateChecklist(form)
      }
    }
    const autosave = debounce(() => {
      api.saveDraft(kind, serialize(form))
      setStatus(form, 'Draft saved on this device')
    }, 800)
    form.addEventListener('input', () => {
      refresh()
      autosave()
    })
    form.addEventListener('change', refresh)
    $('[data-save-draft]', form).addEventListener('click', () => {
      api.saveDraft(kind, serialize(form))
      setStatus(form, 'Draft saved on this device')
      toast('Draft saved on this device.')
    })
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      if (kind === 'game') submitGame(form)
      else submitMedia(form)
    })
    refresh()
  }

  initKindSwitch(forms)
}

// ---- The two forms -------------------------------------------------------------

function initKindSwitch(forms) {
  const tabs = $$('[data-kind]')
  const params = new URLSearchParams(location.search)
  const show = (kind) => {
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.kind === kind)))
    forms.game.hidden = kind !== 'game'
    forms.media.hidden = kind !== 'media'
    $('[data-preview-card]').hidden = kind !== 'game'
    $('[data-checklist]').hidden = kind !== 'game'
  }
  tabs.forEach((tab) => tab.addEventListener('click', () => show(tab.dataset.kind)))
  const game = params.get('game')
  if (game && $(`#m-game option[value="${CSS.escape(game)}"]`)) $('#m-game').value = game
  show(params.get('kind') === 'media' ? 'media' : 'game')
}

// ---- Repeatable rows (controls, achievements, resources) -------------------------

function initRepeaters(form) {
  const map = new Map()
  for (const rep of $$('[data-repeater]', form)) {
    const rows = $('[data-rows]', rep)
    const template = $('[data-row-template]', rep)
    const min = Number(rep.dataset.min || 0)
    const add = (values = []) => {
      const row = template.content.firstElementChild.cloneNode(true)
      $$('input', row).forEach((input, i) => (input.value = values[i] ?? ''))
      rows.append(row)
      return row
    }
    const fill = () => {
      while (rows.children.length < min) add()
    }
    $('[data-add-row]', rep).addEventListener('click', () => {
      $('input', add()).focus()
      form.dispatchEvent(new Event('input'))
    })
    rows.addEventListener('click', (event) => {
      const remove = event.target.closest('[data-remove-row]')
      if (!remove) return
      remove.closest('.repeater__row').remove()
      fill()
      form.dispatchEvent(new Event('input'))
    })
    fill()
    map.set(rep.dataset.repeater, { rep, add, clear: () => rows.replaceChildren(), fill })
  }
  return map
}

const rowValues = (form, name) =>
  $$(`[data-repeater="${name}"] .repeater__row`, form).map((row) => $$('input', row).map((input) => input.value.trim()))

function initToggles(form) {
  for (const box of $$('[data-toggle-target]', form)) {
    const target = document.getElementById(box.dataset.toggleTarget)
    const sync = () => (target.hidden = !box.checked)
    box.addEventListener('change', sync)
    sync()
  }
}

// ---- Counters ------------------------------------------------------------------

function updateCounters(form) {
  for (const counter of $$('[data-counter-for]', form)) {
    const input = document.getElementById(counter.dataset.counterFor)
    if (input.name === 'description') {
      const words = wordCount(input.value)
      counter.textContent = `${words} ${words === 1 ? 'word' : 'words'}${words >= LIMITS.minDescriptionWords ? ' ✓' : ''}`
    } else {
      counter.textContent = `${input.value.length}/${input.maxLength}`
    }
  }
}

// ---- Files: previews only; nothing leaves the browser until submissions open -----

function initFiles(kind, form) {
  for (const input of $$('input[type="file"]', form)) {
    const drop = input.closest('.drop')
    const previews = $(`[data-preview-for="${input.id}"]`, form)
    ;['dragenter', 'dragover'].forEach((type) => drop?.addEventListener(type, () => drop.classList.add('is-over')))
    ;['dragleave', 'drop'].forEach((type) => drop?.addEventListener(type, () => drop.classList.remove('is-over')))

    input.addEventListener('change', () => {
      const list = [...input.files].slice(0, input.name === 'screenshots' ? LIMITS.screenshots : 1)
      files[kind].set(input.name, list)
      clearFieldError(form, input.id)
      previews.replaceChildren()
      for (const file of list) {
        const url = URL.createObjectURL(file)
        if (file.type.startsWith('video/')) {
          const video = document.createElement('video')
          video.src = url
          video.muted = true
          video.className = 'is-wide'
          video.addEventListener('loadedmetadata', () => {
            file.duration = video.duration
            if (video.duration > LIMITS.clipSeconds + 0.5) showFieldError(form, input.id, `is ${Math.round(video.duration)} seconds long; keep clips to ${LIMITS.clipSeconds}.`)
          })
          previews.append(video)
        } else {
          const img = document.createElement('img')
          img.src = url
          img.alt = file.name
          img.addEventListener('load', () => {
            if (img.naturalWidth > img.naturalHeight) img.classList.add('is-wide')
            file.width = img.naturalWidth
            file.height = img.naturalHeight
            if (input.name === 'cover' && (img.naturalWidth < 600 || img.naturalHeight < 800))
              showFieldError(form, input.id, `is ${img.naturalWidth}×${img.naturalHeight}; use at least 600×800 so it stays sharp.`)
            form.dispatchEvent(new Event('change'))
          })
          previews.append(img)
        }
        if (file.size > LIMITS.clipMegabytes * 1024 * 1024) showFieldError(form, input.id, `is over ${LIMITS.clipMegabytes} MB.`)
      }
      if ([...input.files].length > list.length) {
        const note = document.createElement('span')
        note.className = 'thumbs__note'
        note.textContent = `Only the first ${list.length} are used.`
        previews.append(note)
      }
      form.dispatchEvent(new Event('change'))
    })
  }
}

function initYouTube(form) {
  const input = $('input[name="video"]', form)
  const preview = $('[data-yt-preview]', form)
  if (!input) return
  const update = () => {
    const value = input.value.trim()
    const id = parseYouTube(value)
    clearFieldError(form, input.id)
    preview.hidden = !id
    if (id) {
      preview.innerHTML = String(
        h`<img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" loading="lazy" /><span>YouTube video <strong>${id}</strong>. It plays in privacy-enhanced mode.</span>`,
      )
    } else if (value) {
      showFieldError(form, input.id, "doesn't look like a YouTube link. Try the address from the Share button.")
    }
  }
  input.addEventListener('change', update)
  input.addEventListener('blur', update)
  if (input.value) update()
}

// ---- Drafts --------------------------------------------------------------------

function serialize(form) {
  const data = { fields: {}, checks: {}, rows: {} }
  for (const el of form.elements) {
    if (!el.name || ['file', 'submit', 'button'].includes(el.type) || el.closest('[data-repeater]')) continue
    if (el.type === 'checkbox') {
      if (el.value === 'on') data.checks[el.name] = el.checked
      else if (el.checked) (data.checks[el.name] ??= []).push(el.value)
    } else if (el.type === 'radio') {
      if (el.checked) data.fields[el.name] = el.value
    } else {
      data.fields[el.name] = el.value
    }
  }
  for (const rep of $$('[data-repeater]', form)) data.rows[rep.dataset.repeater] = rowValues(form, rep.dataset.repeater)
  return data
}

function restoreDraft(kind, form, repeaters) {
  const draft = api.loadDraft(kind)
  if (!draft?.fields) return
  for (const el of form.elements) {
    if (!el.name || el.type === 'file' || el.closest('[data-repeater]')) continue
    if (el.type === 'checkbox') {
      const saved = draft.checks?.[el.name]
      el.checked = Array.isArray(saved) ? saved.includes(el.value) : Boolean(saved ?? el.checked)
    } else if (el.type === 'radio') {
      el.checked = draft.fields[el.name] === el.value
    } else if (draft.fields[el.name] != null) {
      el.value = draft.fields[el.name]
    }
  }
  for (const [name, { clear, add, fill }] of repeaters) {
    const saved = (draft.rows?.[name] ?? []).filter((values) => values.some(Boolean))
    if (!saved.length) continue
    clear()
    saved.forEach((values) => add(values))
    fill()
  }
  $$('[data-toggle-target]', form).forEach((box) => box.dispatchEvent(new Event('change')))
  const hasContent = Object.values(draft.fields).some((v) => typeof v === 'string' && v.trim() && !['portrait', 'MIT'].includes(v))
  if (hasContent)
    setStatus(form, `Draft restored from ${timeAgo(draft.savedAt)}. Files aren't kept in drafts, so re-attach images and clips.`)
}

function setStatus(form, text) {
  $('[data-draft-status]', form).textContent = text
}

// ---- Live preview and checklist -------------------------------------------------

function updatePreview(form) {
  const item = $('[data-preview-feed] .feed-item')
  if (!item) return
  const f = new FormData(form)
  const title = String(f.get('title')).trim() || 'Your game'
  const category = f.get('category') || Object.keys(api.config.categories ?? {})[0]
  const [accent, tint] = ACCENTS[category] ?? ['#5b46c9', '#ecebfb']

  for (const el of [item, $('.cabinet', item), $('.badge', item)]) {
    el?.style.setProperty('--accent', accent)
    el?.style.setProperty('--tint', tint)
  }
  $('.feed-item__title a', item).textContent = title
  $('.cabinet__marquee span', item).textContent = title
  $('.feed-item__tagline', item).textContent = String(f.get('tagline')).trim() || 'Your tagline shows here.'
  $('.badge', item).textContent = api.config.categories?.[category] ?? category
  const by = $$('.feed-item__meta span', item).find((s) => s.textContent.startsWith('by '))
  if (by) by.textContent = `by ${String(f.get('name')).trim() || 'you'}`

  const screen = $('.cabinet__screen', item)
  const [cover] = files.game.get('cover') ?? []
  const current = $('img.cover', screen)
  if (cover) {
    const src = $('[data-preview-for="g-cover"] img')?.src
    if (src && current?.src !== src) {
      const img = document.createElement('img')
      img.className = 'cover'
      img.src = src
      img.alt = ''
      ;(current ?? $('.cover--plate', screen)).replaceWith(img)
    }
  } else if (current) {
    const plate = document.createElement('span')
    plate.className = 'cover cover--plate'
    plate.append(document.createElement('span'))
    current.replaceWith(plate)
  }
  const plateText = $('.cover--plate span', screen)
  if (plateText) plateText.textContent = title

  $$('.pill--ai', item).forEach((pill) => pill.remove())
  const meta = $('.feed-item__meta', item)
  if (f.has('copilot')) meta.insertAdjacentHTML('beforeend', '<span class="pill pill--ai">Co-pilot</span>')
  if (f.has('coop')) meta.insertAdjacentHTML('beforeend', '<span class="pill pill--ai">Co-op AI</span>')
}

function updateChecklist(form) {
  const f = new FormData(form)
  const text = (name) => String(f.get(name) ?? '').trim()
  const done = {
    title: text('title').length >= LIMITS.title[0],
    url: isHttpUrl(text('url'), { httpsOnly: true }),
    tagline: text('tagline').length >= LIMITS.tagline[0],
    category: Boolean(text('category')),
    description: wordCount(text('description')) >= LIMITS.minDescriptionWords,
    cover: Boolean(files.game.get('cover')?.length),
    controls: rowValues(form, 'controls').some(([action, touch, keys]) => action && (touch || keys)),
    you: Boolean(text('name')) && EMAIL.test(text('email')),
  }
  for (const [key, ok] of Object.entries(done)) $(`[data-check="${key}"]`)?.classList.toggle('is-done', ok)
}

// ---- Turning the form into a catalog entry --------------------------------------

// The same shape as an entry in src/data/games.mjs, so an approved submission
// can go straight into the catalog.
function gameEntry(form) {
  const f = new FormData(form)
  const text = (name) => String(f.get(name) ?? '').trim()
  const title = text('title')
  const shareKit = f.has('shareKit')
  return {
    slug: slugify(title),
    title,
    tagline: text('tagline'),
    url: text('url'),
    category: text('category'),
    orientation: text('orientation') || 'portrait',
    tags: text('tags')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    added: new Date().toISOString().slice(0, 10),
    creator: { name: text('name') },
    description: text('description')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean),
    controls: rowValues(form, 'controls')
      .filter((row) => row.some(Boolean))
      .map(([action, touch, keyboard]) => ({ action, touch, keyboard })),
    tips: text('tips')
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean),
    achievements: rowValues(form, 'achievements')
      .filter((row) => row.some(Boolean))
      .map(([achievementTitle, description]) => ({ id: slugify(achievementTitle), title: achievementTitle, description })),
    ai: { copilot: f.has('copilot'), coop: f.has('coop') },
    resources: shareKit
      ? {
          source: text('source') || undefined,
          license: text('license'),
          files: rowValues(form, 'files')
            .filter((row) => row.some(Boolean))
            .map(([label, url]) => ({ label, url })),
          tools: f.getAll('tools'),
        }
      : null,
    tools: f.getAll('tools'),
    video: text('video') ? { youtubeId: parseYouTube(text('video')), featureOk: f.has('featureOk') } : null,
    contact: { email: text('email') },
  }
}

async function submitGame(form) {
  clearErrors(form)
  const entry = gameEntry(form)
  const issues = validateGame(entry, { categories: api.config.categories ?? {}, submission: true }).filter((i) => i.level === 'error')
  if (!files.game.get('cover')?.length) issues.push({ field: 'cover', message: 'is required' })
  if (entry.video && !entry.video.youtubeId) issues.push({ field: 'video', message: "isn't a YouTube link we recognise" })
  issues.push(...fileIssues('game'))
  if (!entry.creator.name) issues.push({ field: 'name', message: 'is required' })
  if (!EMAIL.test(entry.contact.email)) issues.push({ field: 'email', message: 'needs to be a valid email address' })
  if (!form.elements.rights.checked) issues.push({ field: 'rights', message: 'needs to be confirmed' })
  if (!form.elements.rules.checked) issues.push({ field: 'rules', message: 'need to be read and accepted' })
  if (issues.length) return showErrors(form, 'game', issues)

  api.saveDraft('game', serialize(form))
  const result = await api.submit('game', entry, uploads('game'))
  setStatus(form, 'Draft saved on this device')
  if (result.status === 'closed') {
    openModal({
      title: 'Submissions open soon',
      body: h`<p><strong>${entry.title}</strong> looks ready to go. Submissions aren't open yet, so we saved your draft on this device.</p><p>Come back when they open and send it with one click. You'll need to re-attach the images and clips.</p>`,
    })
  } else {
    openModal({ title: 'Submitted!', body: h`<p>Thanks! <strong>${entry.title}</strong> is in the review queue.</p>` })
  }
}

async function submitMedia(form) {
  clearErrors(form)
  const f = new FormData(form)
  const text = (name) => String(f.get(name) ?? '').trim()
  const data = {
    game: text('game'),
    title: text('title'),
    video: text('video') ? parseYouTube(text('video')) : null,
    featureOk: f.has('featureOk'),
    name: text('name'),
    contact: { email: text('email') },
  }
  const issues = []
  if (!data.game) issues.push({ field: 'game', message: 'is required' })
  if (!data.title) issues.push({ field: 'title', message: 'is required' })
  if (text('video') && !data.video) issues.push({ field: 'video', message: "isn't a YouTube link we recognise" })
  const hasMedia = data.video || files.media.get('clip')?.length || files.media.get('screenshots')?.length
  if (!hasMedia) issues.push({ field: 'media', message: 'add a YouTube link, a clip or at least one screenshot' })
  issues.push(...fileIssues('media'))
  if (!data.name) issues.push({ field: 'name', message: 'is required' })
  if (!EMAIL.test(data.contact.email)) issues.push({ field: 'email', message: 'needs to be a valid email address' })
  if (!form.elements.rules.checked) issues.push({ field: 'rules', message: 'need to be confirmed' })
  if (issues.length) return showErrors(form, 'media', issues)

  api.saveDraft('media', serialize(form))
  const result = await api.submit('media', data, uploads('media'))
  if (result.status === 'closed') {
    openModal({
      title: 'Clip sharing opens soon',
      body: h`<p>Your post for <strong>${form.elements.game.selectedOptions[0].textContent}</strong> is saved on this device. Come back when sharing opens to send it.</p>`,
    })
  }
}

function fileIssues(kind) {
  const issues = []
  for (const [field, list] of files[kind]) {
    for (const file of list) {
      if (file.size > LIMITS.clipMegabytes * 1024 * 1024) issues.push({ field, message: `"${file.name}" is over ${LIMITS.clipMegabytes} MB` })
      if (file.duration > LIMITS.clipSeconds + 0.5) issues.push({ field, message: `is longer than ${LIMITS.clipSeconds} seconds` })
    }
  }
  return issues
}

const uploads = (kind) => [...files[kind]].flatMap(([field, list]) => list.map((file) => ({ field, file })))

// ---- Errors ------------------------------------------------------------------

// Where each problem is shown: the field's id, or a row input for list items.
function fieldTarget(form, kind, field) {
  const prefix = kind === 'game' ? 'g' : 'm'
  const [name, index] = field.replace(/^resources\./, 'resources-').split('.')
  const lists = { controls: 'controls', achievements: 'achievements', 'resources-files': 'files' }
  if (lists[name]) {
    const rows = $$(`[data-repeater="${lists[name]}"] .repeater__row`, form)
    return $('input', rows[Number(index) || 0] ?? rows[0] ?? form)
  }
  const ids = { 'resources-source': `${prefix}-source`, 'resources-license': `${prefix}-license`, media: `${prefix}-video` }
  return document.getElementById(ids[name] ?? `${prefix}-${name}`)
}

function showFieldError(form, id, message) {
  const input = document.getElementById(id)
  input?.setAttribute('aria-invalid', 'true')
  const slot = $(`[data-error-for="${id}"]`, form)
  if (slot) {
    const label = LABELS[input?.name] ?? 'This'
    slot.textContent = `${label} ${message}`
    slot.hidden = false
  }
}

function clearFieldError(form, id) {
  document.getElementById(id)?.removeAttribute('aria-invalid')
  const slot = $(`[data-error-for="${id}"]`, form)
  if (slot) slot.hidden = true
}

function clearErrors(form) {
  $$('[aria-invalid]', form).forEach((el) => el.removeAttribute('aria-invalid'))
  $$('[data-error-for]', form).forEach((el) => (el.hidden = true))
  const summary = $('[data-form-errors]', form)
  summary.hidden = true
  summary.replaceChildren()
}

function showErrors(form, kind, issues) {
  const summary = $('[data-form-errors]', form)
  const items = []
  for (const issue of issues) {
    const target = fieldTarget(form, kind, issue.field)
    const key = issue.field.split('.').slice(0, issue.field.startsWith('resources') ? 2 : 1).join('.')
    const label = LABELS[key] ?? key
    if (target) {
      if (!target.id) target.id = `field-${Math.random().toString(36).slice(2, 8)}`
      target.setAttribute('aria-invalid', 'true')
      const slot = $(`[data-error-for="${target.id}"]`, form)
      if (slot) {
        slot.textContent = `${label} ${issue.message}.`
        slot.hidden = false
      }
    }
    items.push(h`<li>${target ? h`<a href="#${target.id}">${label}</a>` : label} ${issue.message}.</li>`)
  }
  summary.innerHTML = String(h`<p>Fix ${items.length === 1 ? 'this' : `these ${items.length} things`} before sending:</p><ul>${items}</ul>`)
  summary.hidden = false
  summary.focus()
  summary.scrollIntoView({ block: 'center' })
}
