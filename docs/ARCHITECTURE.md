# DOABNO architecture

How the pieces fit together. Written 2026-11-06. Operation and setup steps are in `HANDOVER.md`; the API is in `docs/API.md`.

## Overview

```
 Shoppers                          Team                          Stores and networks
 ┌──────────────┐ ┌────────────┐   ┌──────────────┐              ┌──────────────────────────────┐
 │ Website      │ │ iOS/Android│   │ Admin panel  │              │ Affiliate feeds (CSV/XML/JSON)│
 │ web-v2/      │ │ app-v2/ in │   │ admin-v2/    │              │ Amazon PA-API (later)         │
 │ (web-next/   │ │ Capacitor  │   │              │              │ Store product pages (allowed) │
 │  for SEO)    │ │            │   │              │              └──────────────┬───────────────┘
 └──────┬───────┘ └─────┬──────┘   └──────┬───────┘                             │
        │ publishable key, user JWT       │ admin JWT                           │ daily / hourly
        ▼                ▼                 ▼                                    ▼
 ┌─────────────────────────────────────────────────────┐        ┌──────────────────────────────┐
 │ Supabase                                            │◄───────│ Importer (backend/importer/)  │
 │  Postgres + row-level security                      │ service│ GitHub Actions: Import store  │
 │  PostgREST API (tables, rpc/ functions)             │  key   │ feeds, Link check, Back up    │
 │  Auth (email; Google/Apple ready, off)              │        └──────────────┬───────────────┘
 │  Edge functions: go (click-out), identify (photo)   │                       │ push / email
 └─────────────────────────────────────────────────────┘                       ▼
                                                                  FCM (Android), APNs (iPhone), Resend (email)
```

## Components

| Part | Folder | Technology | Hosted on |
|---|---|---|---|
| Website | `web-v2/` | Plain HTML, CSS, JS, no build step; hash routes (`#/p/<id>`) | Cloudflare Pages (direct upload of `node scripts/build-site.js` output) |
| Website for SEO (in progress) | `web-next/` on branch `nextjs-port` | Next.js, server-rendered, clean URLs | To decide (Cloudflare Pages or Vercel) |
| Mobile app | `app-v2/` wrapped by `ios-app/`, `android-app/` | Same plain JS, wrapped with Capacitor 7; camera, barcode (ZXing), push | App Store (TestFlight now), Google Play (not set up) |
| Admin panel | `admin-v2/` | Plain JS, same design system | Served with the website at `/admin/` |
| Database and API | `backend/supabase/` | Supabase: Postgres 17, PostgREST, Auth, Edge Functions (Deno) | Supabase cloud, Frankfurt (project to be recreated in the client's account) |
| Importer and jobs | `backend/importer/` | Node 22, zero dependencies | GitHub Actions (move to a small server when feeds grow) |
| Tests | `backend/tests/` | `node --test`, fake servers, no network | Local and CI |

## Data model (main tables)

| Area | Tables | Notes |
|---|---|---|
| Reference | `currencies`, `markets`, `categories`, `subcategories` | Rates per USD for conversion |
| Catalogue | `products`, `product_photos`, `stores` | `products.gtin` (barcode) matches feed items across stores |
| Prices | `offers`, `price_history` | One offer per product and store; `total = price + shipping`; history row only when the lowest price changes |
| Promotions | `coupons`, `popular_searches` | |
| Data sources | `feeds`, `feed_runs`, `feed_rejects`, `scrape_pages` | Feed formats `csv`, `xml`, `json`, `google_merchant`, `scrape` |
| Traffic and money | `clicks`, `conversions` (0012), `product_views` (0013), `link_checks` (0014) | Clicks are logged by the `go` function with a salted daily visitor hash, never the raw IP |
| People | `profiles`, `favorites`, `alerts`, `push_tokens`, `privacy_requests` | Linked to Supabase Auth users; cascade delete |
| Admin | `admins`, `audit_log`, `settings` (0012) | Roles: owner, catalog, partners, analyst |

Migrations run in order, `0001` to the latest, each safe to run twice from 0010 onward.

## Main flows

**Page load.** `assets/boot.js` calls `rpc/get_catalog` once and hands the JSON to `assets/data.js`, which builds the in-memory catalogue the pages use. With `supabaseUrl` empty in `config.js`, the built-in demo catalogue is used instead, so the site always renders.

**Price comparison.** For each product and market, offers are sorted by total price (price plus delivery), converted to the shopper's chosen currency with the stored rates. The freshness line shows how long ago each offer was checked.

**Prices coming in.** The daily **Import store feeds** workflow runs `backend/importer/cli.js run --schedule daily`. For each active feed: download (or read store pages for `scrape` feeds, with robots.txt obeyed), parse, clean, match to products by barcode, reject outliers (below 40% or above 250% of the median of three or more other stores), upsert offers, mark vanished products out of stock, write history. Every run is recorded in `feed_runs` with its rejects, shown on the admin Store feeds page.

**Visit store (commission).** Every offer has a tracking id `doabno-{market}-{store}-{product}`. "Visit store" opens `functions/v1/go?t=<tracking id>`, which logs the click and redirects (302) to the offer's affiliate link. Conversion reports from networks are uploaded in the admin and matched on the tracking id.

**Alerts.** After each import, the job lists alerts whose target is reached (`rpc/alerts_to_check`, service key only), sends email (Resend) and phone notifications (FCM for Android, APNs for iPhone), and marks them triggered.

**Photo search.** The app reads barcodes on the phone first. Without a barcode it sends a reduced photo to the `identify` function, which asks Gemini what the product is and returns a guess to match against the catalogue.

## Security

- **Row-level security on every table.** Visitors read only the active catalogue; people read and change only their own rows; admin access goes through `public.has_role(...)`. Since `0008_hardening.sql` anonymous callers have no insert, update or delete rights at all, except filing a privacy request (shape-checked in 0009).
- **Keys.** The publishable key is public by design and is in `config.js`. The service key, database password, Gemini, FCM, APNs and Resend keys live only in Supabase and GitHub secrets. Feed addresses can use `${FEED_*}` placeholders so feed keys never sit in the database.
- **Injection and XSS.** No SQL is built from user input (PostgREST parameters and SQL functions only). The front ends escape every value they insert into the page, and a Content-Security-Policy limits scripts and connections.
- **CSRF.** The API uses bearer tokens in headers, not cookies, so another site cannot make requests in a signed-in person's name.
- **Privacy.** Cookie consent, a "do not sell or share" switch, data download and account deletion for shoppers; admin data export and deletion with an audit log; clicks stored without IP addresses.

## Operations

| Job | When | What |
|---|---|---|
| Import store feeds | Daily 03:00 UTC and on demand | Feeds, store pages, alerts, push |
| Link check (0014) | Weekly | Tests every offer link, records the result |
| Back up database | Weekly | Encrypted `pg_dump` kept 30 days as a workflow artifact (moving to Supabase Pro adds daily backups) |
| iOS to TestFlight, Android build | On demand | Native app builds |

## Known limits and next steps

- Hash URLs cannot be indexed; the Next.js port fixes this.
- GitHub Actions jobs stop at 30 minutes; move the importer to a small server above about 500 store pages per run.
- Search uses Postgres trigram indexes, fine to about 100,000 products; a search engine (Meilisearch or Typesense) after that.
- Data residency: Frankfurt today; a Saudi region may be required under PDPL (legal adviser to decide).
