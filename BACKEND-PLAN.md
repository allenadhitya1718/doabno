# DOABNO: plan from prototype to live product

## Context
The website (`web-v2/`), app (`app-v2/`) and admin (`admin-v2/`) are finished static prototypes. All three read the same demo catalog (`*/assets/data.js`, 20 products, 4 markets, 5 categories) and keep every user action in browser localStorage. There is no server, database, login, or real store data. This plan covers everything needed to go live and hand over, with the tooling picked for lowest cost and fastest build that one developer can run. Target: a working version in about 3 days (see the 3-day cut below).

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
| Login | **Supabase Auth** (email + Google/Apple) | Built in; no extra service. | $0 | Over 50,000 monthly users || Website (server-rendered for SEO, Arabic RTL) | **Next.js on Cloudflare** (Workers via the OpenNext adapter) | Vercel's free plan bans commercial use and Vercel Pro is $20/seat. Cloudflare's free plan allows commercial use. Risk: the adapter has some App Router edge cases, so test early. | $0 | Free daily request cap is hit: Workers Paid, $5/mo (10M requests included) |
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

## Phases (one developer; estimates in working weeks)
**Phase 0: Decisions and paperwork (week 1, runs in parallel with everything).**
Apply to Noon, Awin, Admitad/others and Amazon Associates (ae, sa). Create accounts: Supabase, Cloudflare, GitHub (private repo), Resend, OneSignal, domain. Get a lawyer on: PDPL data-location approach, privacy policy, terms, affiliate disclosure, cookie text. Pick the first 5-10 stores and the feed format of each.

**Phase 1: Foundation (about 1.5 weeks).**
Monorepo (web, app, admin, worker, shared types). Postgres schema from data.js: markets, currencies/rates, categories, subcategories, stores, products, product_translations (en/ar), offers, price_history, coupons, clicks, feeds, feed_runs. User-data tables kept separate (profiles, favorites, alerts, consents, privacy_requests) so they can be moved to another region. Migrations, Supabase Auth and row-level security set up, a seed script that loads data.js, price history stored only when a price changes, and a free staging database branch plus a production one. Backups: the free plan has no daily backups, so also run a weekly database dump to free file storage.

**Phase 2: Feed pipeline (about 2-3 weeks).**
Import script (run daily by GitHub Actions; moves to a Railway worker later if hourly is needed) with adapters for CSV, XML, JSON API and Google Merchant. GTIN matching plus unmatched-items review queue. Outlier and stock checks (port the existing rule). Exchange-rate updates. Scheduling (hourly/6-hourly/daily as the feeds page shows). Real "Run now" and rejected-items list. Alert evaluation hook. Needs: at least two real feeds to test with.

**Phase 3: Public site on Next.js (about 3 weeks).**
Port `web-v2/` screens to server-rendered pages with clean URLs (today's `#/` links cannot be indexed). Per-page titles, canonical, hreflang en/ar, structured product data, sitemap. Product, category, search, deals, coupons from the database. Arabic RTL carried over. Postgres search. **Click-out endpoint:** logs the click, then redirects to the store's affiliate link (this is what earns money and feeds the admin's traffic reports). Target the PRD's 7-second response time with caching.

**Phase 4: Accounts, favorites, alerts, privacy (about 1.5-2 weeks).**
Real sign-up/login with Supabase Auth (email + Google/Apple, matching the profile screens), email verification, favorites and alerts in the database (one shape for web and app), alert emails with recorded marketing consent, data download, account deletion, cookie consent record, privacy-request intake with the 30-day promise, CCPA opt-out.

**Phase 5: Admin on the real back end (about 2 weeks).**
Replace the localStorage overrides in `admin-v2/admin.js` with API calls: products, categories, stores, coupons, rates, popular searches. Real sign-in with two-factor and roles (owner/catalog/partners/analyst), audit log, CSV export from real clicks, live feed status.

**Phase 6: Mobile app (about 1 week as a PWA; about 3 weeks if native).**
Cheapest first: make the website installable (home-screen icon, push via OneSignal) using the app's layout. Only if the client needs store listings: Expo app on the same API with store builds and review submissions.

**Phase 7: More Gulf markets (about 1 week each).**
Qatar, Kuwait, Bahrain, Oman: stores, feeds, currency, delivery text. Mostly data work once the pipeline exists.

**Phase 8: Hardening, launch, handover (about 1.5 weeks).**
Load and speed tests against the 7-second target, security review (rate limits, secrets, input checks), backups restore drill, monitoring and alerts, legal pages approved, staged launch. Handover pack: architecture diagram, runbook (how to add a store/feed, rotate keys, restore backup), env/secret list, accounts ownership transferred to the client.

Total: about **14-17 weeks** for one developer with the PWA (add about 2 weeks for a native app); Phases 3, 4 and 6 can overlap if more people join.

## Risks and open items
- Affiliate approvals and feed access are outside our control and set the real launch date.
- Amazon API rules changed in 2026 and sources disagree; verify on Amazon before relying on it.
- Saudi PDPL transfer rules (in force since September 2024) apply even if the server is abroad; legal advice needed. Plan keeps personal data separable. Also confirm with the adviser where backups, logs, support access and the provider's sub-processors handle data, since a provider can process some data outside the region you pick (Supabase's docs mention telemetry and support), and review Supabase's data-processing agreement. If Saudi hosting is required, the user tables can move to Postgres on Saudi infrastructure or a self-hosted Supabase.
- Arabic search quality must be tested on real product names, including mixed Arabic/English.
- Several vendor prices came from third-party comparison pages; re-check before purchase.
- Free-tier limits are the main risk of the cheapest path: Supabase's 500 MB (keep history change-only), GitHub Actions minutes (daily imports only), Resend's 100 emails/day (cap alert sends). Each has a named upgrade in the stack table.
- Supabase free pauses after a week without activity; a free uptime ping every few hours keeps it awake, and a paused project needs a manual restart.
- Next.js on Cloudflare uses an adapter; prove it in Phase 3 week 1 with product and search pages, and fall back to Vercel Pro ($20) if it blocks us.

## Verification (how we'll know each phase works)
- Phase 1: seed loads the 20 products; counts match data.js; staging restore from backup works.
- Phase 2: two real feeds import end to end; re-running creates no duplicates; a bad feed shows as an error row; outlier flag matches the rule.
- Phase 3: pages render with JavaScript off (view-source shows content); Lighthouse SEO check; Arabic pages mirrored; click-out logs a row and redirects.
- Phase 4: sign up, verify email, set alert, trigger a price drop, receive email; delete account removes data.
- Phase 5: admin edit persists across browsers; audit log records the edit; non-owner roles blocked.
- Phase 8: load test meets the response-time target; handover checklist walked through by someone who didn't build it.

## Critical files in the current repo
`admin-v2/assets/data.js` (schema + seed source), `admin-v2/admin.js` (feeds, admin operations to rewire), `web-v2/v2.js` and `app-v2/mobile.js` (screens and storage keys to replace), `README.md` (stated production intent), `PRD-CHECKLIST.md` (requirements to tick off).

## The 3-day cut (if the deadline is fixed)
Everything above is about 14-17 weeks; three days only fits a reduced version. Needs one real store feed in hand by day 2.
- **Day 1:** Supabase project (Frankfurt), schema, demo catalog loaded from data.js, login, favorites and alerts saved in the database.
- **Day 2:** import for 1-2 real stores (daily), the "Visit store" click that logs the click and redirects.
- **Day 3:** admin connected to the real database, deployed live, handover note.
- **Left out:** the Google-friendly Next.js rebuild, native app, extra Gulf markets, hourly refresh, final legal sign-off. A public launch with real Saudi users should wait for the legal sign-off and affiliate approvals; three days is realistic for a client demo.