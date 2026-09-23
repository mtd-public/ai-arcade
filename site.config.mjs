// Site-wide settings. Everything a deploy needs to know lives here, so moving
// from GitHub Pages to your own domain is a one-line change (see docs/CUSTOM-DOMAIN.md).

export default {
  name: 'AI Arcade',
  tagline: 'Free browser games built with AI',
  description:
    'A community arcade of free browser games made with AI. Play in your browser, vote for your favorites, and watch the best games rise to the top.',

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
    name: 'grizzly-dev',
    // Linked from the footer and the About page.
    url: 'https://mtd-public.github.io/modern-portfolio/',
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

  // Community features: votes, comments, clips, leaderboards, submissions.
  // See docs/PORTAL.md for the data format and the endpoints a backend needs.
  portal: {
    // Address of the community backend, e.g. 'https://api.example.com'.
    // Empty means there isn't one yet: votes and saves stay on each visitor's
    // device, community numbers come from src/data/community.json, and things
    // that need accounts say "coming soon". ?preview=1 shows sample data.
    apiBase: '',
  },

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
      homeFeed: '', // Home page, under the game feed
      homeSidebar: '', // Home page, bottom of the sidebar (desktop)
      gameContent: '', // Game pages, after "How to play" (well clear of the game)
      gameFooter: '', // Game pages, below "More games"
    },

    // While `client` is empty, draw labelled dashed boxes where the ad units
    // will go, so you can judge the layout on the test site.
    showPlaceholders: true,
  },
}
