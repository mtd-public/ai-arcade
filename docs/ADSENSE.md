# Turning on Google AdSense

Everything AdSense needs is already built into the site and switched **off**. Nothing Google-ad-related loads until you set your publisher ID. This guide covers what to have in place before applying, signing up, connecting the site, the review, where ads go, privacy and consent, and getting paid.

AdSense rules and screens change. Where this guide and Google's own help pages disagree, trust Google's (links at the end).

## What the code does when you turn it on

Everything is driven by `ads` in [`site.config.mjs`](../site.config.mjs):

```js
ads: {
  client: 'ca-pub-1234567890123456',   // your publisher ID
  slots: {
    homeFeed: '1111111111',    // ad unit IDs from AdSense (optional)
    gameContent: '2222222222',
    gameFooter: '3333333333',
  },
  showPlaceholders: true,
},
```

Setting `client` makes the next build:

1. **Add the AdSense code snippet** to the `<head>` of every page except the 404 page ([`src/templates/layout.mjs`](../src/templates/layout.mjs)):
   ```html
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-…" crossorigin="anonymous"></script>
   ```
   This is the snippet AdSense asks you to paste between `<head>` and `</head>`. It verifies the site, lets Google review it, and serves Auto ads if you turn those on.
2. **Add the verification meta tag** to every page: `<meta name="google-adsense-account" content="ca-pub-…">`.
3. **Write `/ads.txt`** with Google's line: `google.com, pub-…, DIRECT, f08c47fec0942fa0` ([`scripts/build.mjs`](../scripts/build.mjs)).
4. **Add the Advertising section to the privacy policy**, with the disclosures AdSense requires ([`src/templates/info.mjs`](../src/templates/info.mjs)).
5. **Replace the dashed "Ad space" placeholders** with real ad units for any slot that has an ID, and with nothing for slots that don't ([`adSlot()` in `src/templates/components.mjs`](../src/templates/components.mjs)).

The build refuses a publisher ID or slot ID in the wrong format, and warns if `ads.txt` isn't at the root of a domain.

## 1. Before you apply

Most rejections come from applying too early. Work through this list first.

- [ ] **Your own domain, live over HTTPS.** AdSense doesn't accept `github.io` addresses, and `ads.txt` only counts at the root of a domain. Follow [CUSTOM-DOMAIN.md](CUSTOM-DOMAIN.md) first.
- [ ] **You're 18 or older**, and you'll use one AdSense account. Google allows one account per person (payee); add more sites to the same account later.
- [ ] **Real, original content on every page.** "Low value content" is the most common rejection, and a site that mostly links out to games is at risk of it. Each game page here already has a description, controls and tips; make them yours, add more, and keep adding games. The build warns when a description is under 80 words. Extra pages help too, such as a making-of article per game or a devlog.
- [ ] **About, Contact and Privacy pages.** They're built in. Set `contactEmail` in `site.config.mjs` (an address on your own domain looks best), read the privacy policy, and update `privacyUpdated` whenever you change it.
- [ ] **Everything works.** `npm run check` passes, every game loads, and the site works on a phone.
- [ ] **Google can find the site.** Add it to [Google Search Console](https://search.google.com/search-console) and submit `/sitemap.xml`. There's no official traffic minimum, but a site that's indexed and gets some visitors is in a better position.

## 2. Sign up

1. Go to [adsense.google.com](https://adsense.google.com/start/) and choose **Get started**. Sign in with the Google account you want to keep long-term.
2. Enter your site's address (your domain, not the github.io one), choose your country or territory, and accept the terms. The country ties to your payments profile and is hard to change later.
3. Fill in the **payments profile**: account type (individual or business), and your name and address exactly as they appear on your bank account. Payments are made to this name.
4. Google may ask you to verify your phone number and identity along the way.

Your publisher ID is shown under **Account → Settings → Account information**. It looks like `pub-1234567890123456`. In the site config it goes in with a `ca-` prefix: `ca-pub-1234567890123456`.

## 3. Connect and verify your site

1. Put your ID in `site.config.mjs`: `client: 'ca-pub-1234567890123456'`. Commit and push, and wait for the deploy to finish.
2. Check it's live: view the source of your home page and look for `adsbygoogle.js?client=ca-pub-…`, then open `https://your-domain/ads.txt`.
3. In AdSense, open **Sites**, select your site, and choose a verification method. The site supports all three, so pick any:
   - **AdSense code snippet**
   - **Ads.txt snippet**
   - **Meta tag**
4. Tick the box to confirm you've added the code, then **Verify**. Verification is usually immediate.
5. Choose **Request review**.

## 4. The review

The site's status in **Sites** moves from **Getting ready** to either **Ready** or **Needs attention**. Expect anything from a few days to a few weeks. While you wait:

- Keep the site online and the AdSense code in place. Removing the code can stall the review.
- Keep adding content, but avoid a redesign or domain change mid-review.
- Don't put ads or any other ad network on the site yet.

If the review comes back **Needs attention**, AdSense names the reason. The common ones:

| Reason | What to do |
|---|---|
| Low value content | Longer, more original game pages; more games; a few articles. Wait a couple of weeks, then request review again. |
| Site down or unavailable | Check the domain resolves, HTTPS works, and `https://your-domain/` loads without redirect loops. |
| Site navigation / not enough content | Make sure the menu links work (`npm run check`) and every page has text, not just a player. |
| Policy violation | Read the notice. Game content with graphic violence, or copied content, are the usual culprits. |

Fix the problem, then choose **Request review** again.

## 5. Choose how ads appear

Once the site is **Ready**, pick Auto ads, manual ad units, or both.

### Auto ads

In **Ads → By site**, edit your site and turn on **Auto ads**. The AdSense code is already on every page, so there's nothing else to add. Before you apply the settings:

- Use the preview to see where Google wants to place ads, and remove any that land next to the game player.
- Think twice about **anchor ads** on a games site. They stick to the top or bottom of a phone screen, which is exactly where the games put their thumbsticks and buttons. Test on a phone with a game running, or turn them off.
- **Vignette ads** (full-screen, between page loads) can be annoying when someone is hopping between games. Try with and without them.

### Manual ad units (the slots in this repo)

The site has three slots, placed to keep ads clear of gameplay:

| Slot | Where it appears |
|---|---|
| `homeFeed` | Home page, under the game grid |
| `gameContent` | Each game page, after the description and "How to play", well below the player |
| `gameFooter` | Each game page, under "More games" |

To fill one:

1. In AdSense, go to **Ads → By ad unit → Display ads**.
2. Name it after the slot (for example `gameContent`), leave it **Responsive**, and **Create**.
3. AdSense shows code containing `data-ad-slot="1234567890"`. Copy just that number into `ads.slots` in `site.config.mjs`. The build writes the rest of the code:
   ```html
   <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-…" data-ad-slot="1234567890" data-ad-format="auto" data-full-width-responsive="true"></ins>
   <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
   ```
4. Push. New units can stay blank for up to an hour or so while AdSense starts serving them.

To add another slot, add a key to `ads.slots` and call `adSlot(ctx, 'yourKey')` wherever it should go in a template.

## 6. Placement rules for a games site

Invalid clicks are the fastest way to lose an AdSense account, and games generate a lot of stray taps. The layout follows these rules; keep following them if you move ads around.

- **Keep ads away from the game.** Google's guidance for game pages is to keep ad units at least 150 pixels from the playable area, or off the game page entirely. No ad sits beside or over the player here.
- **Never put ads inside a game** or its frame. (In-game ads are a separate program, see [section 9](#9-later-ads-inside-the-games).)
- **Don't make ads look like part of the game**, such as an ad styled as a Play button or a level menu. Ad units carry an "Advertisement" label.
- **No ads on pages without content.** The 404 page never loads the AdSense code.
- **Never click your own ads**, and never ask anyone else to ("support us by clicking" is against the rules). To check an ad, look at it; don't click it.
- **Don't hide or move ads with scripts**, or place them where content jumps under someone's finger as the page loads.

## 7. Privacy, consent and ads.txt

**Privacy policy.** Setting `client` adds the Advertising section to `/privacy/`: that Google and other vendors use cookies to serve ads based on previous visits, how Google uses advertising cookies, and links to opt out through Google's Ads Settings and aboutads.info. Read the whole policy against how you actually run the site, and update `privacyUpdated`. It's a starting point, not legal advice.

**Europe, the UK and Switzerland.** To show personalized ads to visitors there, Google requires a Google-certified consent management platform (CMP) that uses the IAB's Transparency and Consent Framework. That's been enforced since 16 January 2024 for the EEA and UK and since 31 July 2024 for Switzerland. Without one, those visitors only get limited ads. The simplest option is Google's own:

1. In AdSense, open **Privacy & messaging → European regulations**.
2. Create a message for your site, style it, and **Publish**.

Google serves the message through the AdSense code already on the page, so no code changes are needed. Don't add a second cookie banner on top of it.

**US state privacy laws.** The same **Privacy & messaging** area has a **US state regulations** message that gives visitors in the relevant states an opt-out. Turning it on is worth considering.

**ads.txt.** The build writes `/ads.txt` automatically. Google's crawler reads it only at the root of your domain (`https://your-domain/ads.txt`), which is why it only works properly after the move to your own domain. AdSense may show an "Earnings at risk" warning until it has crawled the file, which can take a few days. If you add another ad network later, add its lines alongside Google's in `scripts/build.mjs`.

## 8. Getting paid

1. **Tax information.** Under **Payments → Payments info → Manage settings**, fill in the tax form AdSense asks for (US residents: a W-9; outside the US: usually a W-8BEN). Without it, Google may withhold tax from US earnings.
2. **Address verification.** When your balance reaches the verification threshold ($10 in the US), Google mails a PIN to your payments address. Enter it in AdSense. Payments are held until you do.
3. **Payment method.** Add a bank account (or another method offered in your country). Google may send a small test deposit to confirm it.
4. **Threshold and schedule.** Google pays once your balance reaches the payment threshold ($100 in the US). Earnings are finalized at the start of each month, and payments go out around the 21st.

## 9. Later: ads inside the games

AdSense's **H5 Games Ads** program shows interstitials (at natural breaks, like between levels) and optional rewarded ads inside HTML5 games, using Google's Ad Placement API. It's by application, is separate from the display ads above, and needs code changes in each game's own repository. It supports games shown in an iframe on another site, as they are here. Look at it once the arcade has steady traffic.

## Troubleshooting

- **Empty ad slots.** Normal for a while after approval or after creating a unit. Also check for ad blockers, and remember ads don't serve on `localhost`.
- **"Ads.txt not found" or "Earnings at risk".** Make sure `https://your-domain/ads.txt` loads and contains your `pub-` ID, then give the crawler a few days.
- **The placeholders disappeared.** They're only drawn while `client` is empty, so they vanish once AdSense is on. Set `showPlaceholders: false` to hide them sooner.

## Google's help pages

- [Eligibility requirements for AdSense](https://support.google.com/adsense/answer/9724)
- [Connect your site to AdSense](https://support.google.com/adsense/answer/7584263)
- [AdSense Program policies](https://support.google.com/adsense/answer/48182)
- [Ad placement policies](https://support.google.com/adsense/answer/1346295)
- [AdSense for content ads on game play pages](https://support.google.com/adsense/answer/2768340)
- [Consent management requirements for the EEA, UK and Switzerland](https://support.google.com/adsense/answer/13554116)
- [Address verification (PIN)](https://support.google.com/adsense/answer/157667)
- [Payment thresholds](https://support.google.com/adsense/answer/1709871)
- [Get started with H5 Games Ads](https://support.google.com/adsense/answer/9959170)
