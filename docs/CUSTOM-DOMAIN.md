# Moving to your own domain

The site runs at `https://mtd-public.github.io/ai-arcade/` for testing. To run AdSense you need a domain you own (for example `example.com`; swap in yours everywhere below), because AdSense won't approve a `github.io` address and `ads.txt` has to live at the root of your domain.

There are two ways to get there. Both keep the games themselves where they are, on `mtd-public.github.io/<game>/`.

- **Option A, recommended:** keep hosting on GitHub Pages and point your domain at it. It's free, HTTPS is automatic, and pushing to `main` still deploys.
- **Option B:** build the site and upload it to another static host (Cloudflare Pages, Netlify, Vercel, or ordinary web hosting).

## How the site knows its address

Every link, the sitemap, canonical URLs and social cards are built from one address, `siteUrl`:

- `https://mtd-public.github.io/ai-arcade` builds the site for the `/ai-arcade/` path.
- `https://example.com` builds it for the domain root, `/`.

The GitHub Actions workflow fills this in automatically from GitHub Pages. On any other host, set the `SITE_URL` environment variable, or change `siteUrl` in [`site.config.mjs`](../site.config.mjs). Change it there anyway once you've moved, so local builds match production.

## Before you start: buy the domain

Any registrar works (Cloudflare Registrar, Porkbun, Namecheap and others). A few pointers:

- A `.com` or another widely recognised extension is the safest choice for AdSense and for players.
- Decide whether the main address is the bare domain (`example.com`) or `www.example.com`. The steps below use the bare domain, with `www` redirecting to it.
- Turn on the registrar's WHOIS privacy if it isn't on by default.

## Option A: GitHub Pages with a custom domain

### 1. Verify the domain with GitHub (prevents takeovers)

Do this first. It stops anyone else from pointing a GitHub Pages site at your domain.

1. Go to your **organization** settings for `mtd-public` (or your personal settings if the repo moves to your account): **Settings → Pages → Add a domain**.
2. Enter the domain. GitHub shows a TXT record like `_github-pages-challenge-mtd-public.example.com` with a value.
3. Add that TXT record at your DNS provider, wait a few minutes, and click **Verify**.

### 2. Add the domain to this repository

In **this repo → Settings → Pages → Custom domain**, enter `example.com` and **Save**.

Add the domain here *before* creating the DNS records in the next step. GitHub's docs warn that doing it the other way round leaves a window where someone else could claim it.

You don't need a `CNAME` file in the repo: with a GitHub Actions deployment, the Pages setting is what counts.

### 3. Create the DNS records

At your DNS provider, for the bare domain (the "apex", often written `@`):

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `mtd-public.github.io` |

With `www` pointing at GitHub and the apex set as the custom domain, GitHub redirects `www.example.com` to `example.com` for you.

Using Cloudflare DNS? Set these records to **DNS only** (grey cloud) at first, so GitHub can issue the HTTPS certificate.

Check the records from a terminal:

```sh
dig example.com +noall +answer        # four 185.199.x.153 addresses
dig www.example.com +noall +answer    # CNAME to mtd-public.github.io
```

DNS changes usually show up within minutes but can take up to 24 hours.

### 4. Turn on HTTPS and redeploy

1. Back in **Settings → Pages**, wait for the DNS check to pass, then tick **Enforce HTTPS**. The certificate can take a little while to be issued.
2. Open **Actions → Deploy to GitHub Pages → Run workflow**. This rebuild picks up the new address, so links and the sitemap now use `https://example.com/`.
3. Update `siteUrl` in `site.config.mjs` to `https://example.com` and push, so local builds match.

`https://mtd-public.github.io/ai-arcade/` now redirects to your domain automatically.

> **Heads-up about the other games.** Setting a custom domain on *this* repo only moves the arcade. If you ever set a custom domain on an `mtd-public.github.io` repository (the organization's own site), GitHub moves *every* project site under that domain, games included. The game URLs in `games.mjs` would still redirect, but it's worth knowing before you do it.

## Option B: any other static host

The build has no dependencies, so any host that can run Node 20+ (or any server you can upload files to) works.

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `SITE_URL=https://example.com` |
| Node version | 20 or newer |

- **Cloudflare Pages / Netlify / Vercel:** connect the GitHub repo, enter the settings above, then add your domain in the host's dashboard and follow its DNS instructions (they differ from GitHub's).
- **Plain web hosting (FTP, cPanel, S3 and so on):** run `SITE_URL=https://example.com npm run build` on your computer and upload the *contents* of `dist/` to the web root.
- Make the host serve `404.html` for missing pages. Most static hosts do this automatically.
- If you leave GitHub Pages, turn it off (**Settings → Pages → Unpublish**) or delete the workflow, so there aren't two copies of the site competing in search results.

## After the move

- [ ] `https://example.com/` loads over HTTPS, and `http://` and `www.` redirect to it.
- [ ] `https://example.com/ads.txt` loads (once AdSense is set up, see [ADSENSE.md](ADSENSE.md)).
- [ ] `https://example.com/sitemap.xml` lists `example.com` URLs.
- [ ] On a game page, the **Insert coin** button starts the game in the page.
- [ ] Add the domain to [Google Search Console](https://search.google.com/search-console) and submit `sitemap.xml`. It shows you what Google has indexed, which helps with AdSense review too.
- [ ] Update links that point at the old address: your portfolio, social profiles, and the READMEs of the game repos.
