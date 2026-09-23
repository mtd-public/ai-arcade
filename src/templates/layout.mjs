import { html, jsonLd, raw } from './html.mjs'
import { notices, siteFooter, siteHeader } from './components.mjs'

// The HTML document shared by every page.
//
// page: { path, title, description, image, imageSize, schema, noindex, ads,
//         name (for data-page), communityNotice, bodyClass }
export function layout(ctx, page, content) {
  const { site, ads } = ctx
  const fullTitle = page.path === '' ? `${site.name}: ${site.tagline}` : `${page.title} | ${site.name}`
  const canonical = ctx.abs(page.path)
  const image = ctx.abs(page.image ?? 'img/og/site.jpg')
  const [imageW, imageH] = page.imageSize ?? [1200, 630]
  // The AdSense loader goes on every page that may show ads. It is also what
  // Google looks for when it verifies the site and reviews it for approval.
  const adsense = ads.client && page.ads !== false

  // Settings the browser scripts need. Kept small and public.
  const clientConfig = {
    base: ctx.base,
    dataUrl: ctx.href('data/community.json'),
    sampleUrl: ctx.href('data/sample-community.json'),
    apiBase: site.portal?.apiBase || '',
    categories: ctx.categories,
    siteName: site.name,
  }

  return html`<!doctype html>
<html lang="${site.lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <script>
      // Apply a saved light/dark choice before first paint (the toggle lives in js/app.js).
      try {
        const theme = localStorage.getItem('arcade:theme')
        if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
      } catch {}
    </script>
    <title>${fullTitle}</title>
    <meta name="description" content="${page.description}" />
    <link rel="canonical" href="${canonical}" />
    ${page.noindex && html`<meta name="robots" content="noindex" />`}
    <meta name="theme-color" content="#140f2b" />
    <link rel="icon" type="image/svg+xml" href="${ctx.asset('favicon.svg')}" />
    <link rel="apple-touch-icon" href="${ctx.asset('apple-touch-icon.png')}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site.name}" />
    <meta property="og:locale" content="${site.locale}" />
    <meta property="og:title" content="${page.title ?? site.name}" />
    <meta property="og:description" content="${page.description}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="${imageW}" />
    <meta property="og:image:height" content="${imageH}" />
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Press+Start+2P&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="${ctx.asset('css/arcade.css')}" />
    <script>document.documentElement.classList.add('js')</script>
    <script type="application/json" id="arcade-config">${raw(JSON.stringify(clientConfig).replace(/</g, '\\u003c'))}</script>
    <script type="module" src="${ctx.asset('js/app.js')}"></script>
    ${ads.client && html`<meta name="google-adsense-account" content="${ads.client}" />`}
    ${adsense && html`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ads.client}" crossorigin="anonymous"></script>`}
    ${page.schema && jsonLd(page.schema)}
  </head>
  <body data-page="${page.name ?? 'info'}"${page.bodyClass ? html` class="${page.bodyClass}"` : ''}>
    <a class="skip-link" href="#main">Skip to content</a>
    ${siteHeader(ctx, page)}
    ${notices(ctx, page)}
    <main id="main">${content}</main>
    ${siteFooter(ctx)}

    <dialog class="modal" data-modal aria-labelledby="modal-title">
      <form method="dialog" class="modal__card">
        <button class="modal__close" value="close" aria-label="Close">×</button>
        <p class="modal__coin" aria-hidden="true"></p>
        <h2 class="modal__title" id="modal-title" data-modal-title></h2>
        <div class="modal__body" data-modal-body></div>
        <div class="modal__actions"><button class="btn btn--primary" value="ok">Got it</button></div>
      </form>
    </dialog>
    <div class="toasts" aria-live="polite" data-toasts></div>
  </body>
</html>
`
}
