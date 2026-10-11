# DOABNO: plan from prototype to live product

## Context
The website (`web-v2/`), app (`app-v2/`) and admin (`admin-v2/`) are finished static prototypes. All three read the same demo catalog (`*/assets/data.js`, 20 products, 4 markets, 5 categories) and keep every user action in browser localStorage. There is no server, database, login, or real store data. This plan covers everything needed to go live and hand over, with the tooling picked for lowest cost and fastest build that one developer can run. Target: as much as possible working in 3 days (see the build schedule below); the rest listed as after-launch work.

Decisions already made: build by **one developer**; backend is **Supabase** (chosen for speed: login, storage and a data dashboard come built in); user-data location (PDPL) **needs sign-off from the client's Saudi legal adviser before real users**, so personal data stays in separate tables that can move to a Saudi host later. Until sign-off, use test accounts and sample data only.

## What the prototypes already tell us (reuse, don't redo)
- `admin-v2/assets/data.js` defines the entities: rates, markets (sa/ae/us/uk), categories+subs, stores (one row per store per market), products (with GTIN), coupons, plus generated offers/history/clicks/users. Use it as the **seed data** and the schema guide.
- Offers carry `price, shipping, total, currency, was, inStock, delivery days, updatedMin, trackingId`. Matching store items to products is meant to use **GTIN** (comment in data.js).
- `admin-v2/admin.js` (feed code, about lines 253-274 and 900-935) already models feed fields: `format` (XML/CSV/JSON API/Google Merchant), `schedule`, `status`, `items`, `rejected`, `error` (timeout/xml/auth). Keep these as the real feed-run table's columns.
- Price-outlier flag (offer under 0.93x or over 1.06x of market median, 3+ offers) is already designed: port it into the import step.
- Gaps found: website and app use different localStorage prefixes and different alert shapes (they never shared data); only the app writes click logs; sign-in accepts any password. The real build must unify these.

## Recommended stack: the cheapest that still works commercially
Rule: every piece starts on a free plan that allows commercial use, with a named trigger for when to pay.

| Need | Pick | Why this over the alternatives | Cost at launch | Pay when |
|---|---|---|---|---|
| Database + login + file storage | **Supabase** free plan (500 MB database, 50,000 monthly users, 1 GB files, 2 projects); Pro $25/mo when needed | Login, storage and a data dashboard come built in, which saves about a day versus Neon plus a separate login library, and the free plan is also $0. Trade-offs: the free plan **pauses after 1 week of inactivity** (a live site with traffic should keep it awake, not guaranteed) and the 500 MB fills up, so price history is stored **only when a price changes**. | $0 | Database pauses, nears 500 MB, or needs daily backups: Supabase Pro, $25/mo |
| Region | **Frankfurt** (Supabase has no Gulf or Saudi region; nearest are Frankfurt and Mumbai) | Pick a specific region, not a "general" one, so data stays where we choose. Region can't be changed without migrating. | included | n/a |
| Login | **Supabase Auth** (email + Google/Apple) | Built in; no extra service. | $0 | Over 50,000 monthly users || Website | **Days 1-3: the existing static pages on Cloudflare Pages (free)**; later, Next.js on Cloudflare (Workers via the OpenNext adapter) for server-rendered SEO and Arabic RTL | Vercel's free plan bans commercial use and Vercel Pro is $20/seat. Cloudflare's free plan allows commercial use. Risk: the adapter has some App Router edge cases, so test early. | $0 | Free daily request cap is hit: Workers Paid, $5/mo (10M requests included) |
| Feed imports | **GitHub Actions scheduled job** (free for private repos, within a monthly minutes allowance; my own knowledge, verify) | Runs plain Node with no CPU cap, so big XML feeds are fine. Limit: the free minutes allow roughly **daily** imports for a handful of stores, not hourly. | $0 | Need hourly imports or more stores: small always-on worker on Railway, about $5-10/mo |
| Search | **Postgres full-text + trigram** | Free, no extra service. Test Arabic quality early. | $0 | Arabic/typo quality disappoints: Meilisearch Cloud, from about $30/mo (best Arabic support of the options found) |
| Email (alerts, verification) | **Resend** free plan | 3,000/mo and 100/day free; Amazon SES is cheaper at huge volume but more setup. | $0 | Over 100 alerts a day: Resend Pro $20/mo or SES |
| Push notifications | **OneSignal** free plan | Mobile push free up to 1,000 monthly active users; web push free. | $0 | Over 1,000 app users: from $19/mo |
| Mobile app | **Installable web app (PWA) first**, native Expo app only if the client needs store listings | A PWA reuses the website, no second codebase, no store fees. Expo/stores add Apple $99/yr and Google $25 once (my own knowledge) plus about 3 weeks of work. | $0 | Client requires App Store / Play Store presence |
| Images, monitoring | Cloudflare free caching for store-supplied image links; Sentry free plan; free uptime checker | Enough at launch. | $0 | n/a |

Estimated running cost at launch: **about $0/month plus the domain (roughly $10-15/year)**. Realistic first paid steps: Supabase Pro $25 and Cloudflare Workers Paid $5: roughly **$30/month** at moderate traffic. (Neon + a free login library would be about $5 cheaper at that point but costs about a day more to build.) Figures come from third-party price pages that sometimes conflict; confirm on each vendor's page before relying on them.

Cheapest-path trade-offs the client must accept: daily (not hourly) price refresh at first; a database that must be kept small; two more upgrades likely within the first months of real traffic.

## How the real store data connects
Three sources, used together. Start the paperwork on day one because approvals take weeks.
1. **Affiliate networks (fastest, also earns commission):** Noon runs its own program (up to 10%, AED 200 payout minimum per Noon's site) and also appears on Optimise MENA, Admitad and others; Awin and similar carry other retailers. Networks give product feeds plus tracking links.
2. **Amazon:** needs a separate Associates account per country (amazon.ae and amazon.sa do not share). Amazon's product API is being replaced by the Creators API; reported access rule is about 10 qualifying sales in 30 days (sources conflict, verify on Amazon). Plan for Amazon to arrive later than the others.
3. **Direct store feeds** (XML, CSV, JSON, Google Merchant) for stores with their own programs.
4. Last resort: scraping. Fragile and often against store terms; avoid unless a store offers nothing else.

Import loop (per store, on its schedule):
download feed, stream-parse, normalise (currency, price + shipping to total), match to a product by GTIN, send unmatched items to a review queue, run the outlier/out-of-stock checks, save the offer and a daily price-history point, record a feed-run row (status, items, rejected, error), then check price alerts. Imports must be repeatable without duplicating data.

## Build schedule: 3 days, as much as possible
Key shortcut: keep the three finished front-ends and make them read from the database through a small loader that returns the **same `window.DOABNO_DATA` shape** the screens already use. No screen has to be redone. Work is about 10-12 hours a day, with me writing most of the code and you handling accounts and approvals in parallel.

**Before day 1 (you, about 1 hour, can be done today):** create the Supabase project (Frankfurt), Cloudflare and GitHub (private repo) accounts and a Resend account; start the Noon, Awin/Admitad and Amazon Associates applications; ask any one store or network for a **sample feed file** (needed on day 2).

**Day 1: database, login, and all three apps on real data.**
- Schema from data.js: markets, currencies/rates, categories, subcategories, stores, products (en/ar), offers, price history (change-only), coupons, clicks, feeds, feed_runs. User tables kept separate (profiles, favorites, alerts, consents, privacy_requests).
- Row-level security so users only see their own data; seed script loads the demo catalog for all 4 markets.
- Loader replaces `assets/data.js` in `web-v2/`, `app-v2/`, `admin-v2/`; screens unchanged.
- Real sign-up/login (email + Google/Apple) in website and app; favorites and price alerts saved in the database with one shared shape (fixes the website/app mismatch).
- Done when: the three apps show the catalog from the database; a user signs up, saves a favorite and an alert, and sees them on another device.

**Day 2: real store data and money.**
- Feed import script with adapters for CSV, XML, JSON API and Google Merchant; streaming parse; currency conversion; price + shipping to total; GTIN matching; unmatched items to a review queue; the existing price-outlier and out-of-stock checks; change-only price history; one `feed_runs` row per run (status, items, rejected, error).
- Runs daily on a free GitHub scheduled job; "Run now" in the admin triggers it.
- "Visit store" click endpoint (Supabase Edge Function): logs the click, then redirects to the store's affiliate link; admin traffic and revenue reports read the real clicks.
- Price-alert check after each import, with alert emails through Resend (marketing consent recorded).
- Done when: 1-2 real feeds import end to end and re-running makes no duplicates; a bad feed shows an error row; a click is logged and redirects; a price drop sends an email.

**Day 3: admin, privacy, go live.**
- Admin on the real database: Supabase login with roles (owner, catalog, partners, analyst), edits to products, categories, stores, coupons, exchange rates and popular searches saved for real, activity log, CSV export from real clicks, live feed status.
- Privacy features: data download, account deletion, cookie and marketing consent records, privacy-request form saved, CCPA opt-out.
- Deploy the website, app and admin to Cloudflare's free hosting; uptime ping that also keeps the free database awake; weekly database dump to free file storage.
- Stretch (only if time is left): installable web app (home-screen icon), a sitemap and pre-built product pages for basic Google visibility, extra Gulf market seed data.
- Handover note: architecture, how to add a store or feed, keys and accounts list, how to restore a backup.
- Done when: an edit in the admin shows on the live site; a non-owner role is blocked from owner actions; the handover note is walked through.

**Not possible in 3 days (moved to "after launch", rough effort):**
- Google-friendly Next.js rebuild of all screens with clean URLs (about 3 weeks).
- Native iOS/Android app (about 3 weeks; the installable web app is the stand-in).
- Other Gulf markets with real stores (about 1 week each).
- Hourly refresh instead of daily (small always-on worker, about a day to set up, $5-10/mo).
- Affiliate approvals, real store feeds, and the Saudi legal sign-off: outside our control and the real limit on a public launch. Until then, run with sample or test data only.
## Risks and open items
- Affiliate approvals and feed access are outside our control and set the real launch date.
- Amazon API rules changed in 2026 and sources disagree; verify on Amazon before relying on it.
- Saudi PDPL transfer rules (in force since September 2024) apply even if the server is abroad; legal advice needed. Plan keeps personal data separable. Also confirm with the adviser where backups, logs, support access and the provider's sub-processors handle data, since a provider can process some data outside the region you pick (Supabase's docs mention telemetry and support), and review Supabase's data-processing agreement. If Saudi hosting is required, the user tables can move to Postgres on Saudi infrastructure or a self-hosted Supabase.
- Arabic search quality must be tested on real product names, including mixed Arabic/English.
- Several vendor prices came from third-party comparison pages; re-check before purchase.
- Free-tier limits are the main risk of the cheapest path: Supabase's 500 MB (keep history change-only), GitHub Actions minutes (daily imports only), Resend's 100 emails/day (cap alert sends). Each has a named upgrade in the stack table.
- Supabase free pauses after a week without activity; a free uptime ping every few hours keeps it awake, and a paused project needs a manual restart.
- For the later Next.js rebuild, Cloudflare uses an adapter; prove it first with the product and search pages, and fall back to Vercel Pro ($20) if it blocks us.

## Verification (how we'll know each day worked)
- Day 1: counts in the database match data.js (20 products, 4 markets, 5 categories); all three apps load from the database; sign-up, favorite and alert persist across devices.
- Day 2: two real feeds import end to end; re-running creates no duplicates; a click logs a row and redirects; a test price drop sends the alert email.
- Day 3: an admin edit appears on the live site; role limits enforced; account deletion removes the user's data; the handover note works for someone who didn't build it.
## Critical files in the current repo
`admin-v2/assets/data.js` (schema + seed source), `admin-v2/admin.js` (feeds, admin operations to rewire), `web-v2/v2.js` and `app-v2/mobile.js` (screens and storage keys to replace), `README.md` (stated production intent), `PRD-CHECKLIST.md` (requirements to tick off).
