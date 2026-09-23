// Site-wide settings. Everything a deploy needs to know lives here, so moving
// from GitHub Pages to your own domain is a one-line change (see docs/CUSTOM-DOMAIN.md).

export default {
  name: 'AI Arcade',
  tagline: 'Free browser games built with AI',
  description:
    'A free arcade of original browser games designed by Michael Taddeucci and built with AI coding assistants. No downloads, no sign-up: pick a game and press start.',

  // The public address of the site, with no trailing slash. The build uses it
  // for canonical links, the sitemap and social cards, and takes the base path
  // (e.g. "/ai-arcade/") from it.
  //
  // In GitHub Actions this is replaced automatically with the address GitHub
  // Pages reports, so adding a custom domain in the repo's Pages settings is
  // enough. Set the SITE_URL environment variable to override it anywhere else.
  siteUrl: 'https://mtd-public.github.io/ai-arcade',

  // Language and locale for <html lang> and Open Graph.
  lang: 'en',
  locale: 'en_US',

  owner: {
    name: 'Michael Taddeucci',
    // Linked from the footer and the About page.
    url: 'https://mtd-public.github.io/modern-portfolio/',
    github: 'https://github.com/mtd-public',
  },

  // Shown on the Contact and Privacy pages. Leave empty to point people at
  // GitHub issues instead. Set a real inbox (ideally on your own domain)
  // before applying to AdSense; see docs/ADSENSE.md.
  contactEmail: '',
  issuesUrl: 'https://github.com/mtd-public/ai-arcade/issues',

  // The AI tools named on the About page and each game page.
  aiTools: ['Claude Code'],

  // The date the privacy policy last changed. Update it whenever you edit it.
  privacyUpdated: '2026-09-23',

  // Google AdSense. Everything stays off until `client` is set. See docs/ADSENSE.md
  // for the full sign-up, verification and approval walkthrough.
  ads: {
    // Your publisher ID from AdSense (Account > Account information), e.g.
    // 'ca-pub-1234567890123456'. Setting it adds the AdSense loader and the
    // site-verification meta tag to every page, writes /ads.txt, and adds the
    // advertising section to the privacy policy.
    client: '',

    // Ad unit IDs (the data-ad-slot number AdSense gives each unit). A slot
    // with an empty ID renders nothing. Leave them all empty if you only use
    // Auto ads.
    slots: {
      homeFeed: '', // Home page, between the game grid and "How it's made"
      gameContent: '', // Game pages, after "How to play" (well clear of the game)
      gameFooter: '', // Game pages, below "More games"
    },

    // While `client` is empty, draw labelled dashed boxes where the ad units
    // will go, so you can judge the layout on the test site.
    showPlaceholders: true,
  },
}
