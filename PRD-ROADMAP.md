# DOABNO: PRD roadmap and checklist

Checked against the client PRD on 2026-11-06. ☑ done, ◐ partly done, ☐ to do.
Detail on each built piece: `ROADMAP.md` (status), `HANDOVER.md` (accounts, restore, keys), `backend/README.md` (importer, page reader).

> **Blocker found 2026-11-05:** the Supabase project `hmanlftkhvruqgvkencn` no longer exists (its address does not resolve, the daily import has failed since 2026-10-31, it is in none of the organizations we can see). The website still loads on its built-in demo data, but sign-in, alerts, admin and imports are down. Find out who owned it; otherwise rebuild it from the migrations and restore accounts from the encrypted backup of 2026-10-25 (expires 2026-11-24, needs `BACKUP_PASSPHRASE`). Every database item below marked ☑ assumes this is fixed.

## Roadmap

| Phase | Goal | Main items | State |
|---|---|---|---|
| 0. Recover | Database back online | New Supabase project in the client's name, migrations 0001 to 0011, catalogue seed, restore accounts, update `config.js` and secrets | ☐ now |
| 1. Foundations | Accounts in the client's name, domain | doabno.com, Cloudflare, Supabase, Apple, Google Play, GitHub transfer | ◐ |
| 2. Data | Real prices for at least 5,000 products | Affiliate applications, network feeds, page reader on allowed stores, 10 to 15 brands | ◐ started |
| 3. Monetize and report | Commission and CPC tracking, reports | Tracking IDs per store and link, network conversion reports, purchase / non-purchase reports, PDF export | ◐ |
| 4. Apps to stores | Public iOS and Android apps | iPhone push key, App Store review, Play Console, signed AAB | ◐ |
| 5. SEO and speed | Indexable product pages | Clean URLs with server-rendered pages (Next.js port), sitemap | ☐ |
| 6. Compliance and launch | Legal sign-off, security review | PDPL, GDPR, CCPA texts approved, security test, under-7-second check | ◐ |
| 7. Handover | Docs and training | Manual in Arabic and English, architecture and API docs, 10 h training | ◐ |

## Checklist

### 1. Project basics
- ☑ Arabic and English, right-to-left layout
- ☑ Currencies SAR, USD, GBP, AED with automatic conversion
- ◐ Markets: Saudi and UAE live; US and UK in the data; Qatar, Kuwait, Bahrain, Oman shown as "soon"
- ☐ Domain **doabno.com** registered in the client's name and connected (site is on `doabno.pages.dev` today)
- ◐ Visual identity: logo, colours and app icon done; client approval of the final screens still to record

### 2. UI/UX
- ☑ Website, mobile web app and admin designed in both languages (`web-v2`, `app-v2`, `admin-v2`)
- ◐ Client approval of the screens before development (Figma exports in `figma-export-final/`; written approval not recorded)

### 3. Mobile app (iOS and Android)
- ☑ Search and price comparison across stores
- ☑ Ratings, offers, coupons, favourites, price alerts
- ☑ Barcode scan and photo search (photo search uses Gemini; free-tier limit, paid key needed before real users)
- ◐ Recommendations: similar and alternative products on every product page; no personalised recommendation engine yet
- ☑ Account: sign-up, sign-in, profile, alerts, data download, account deletion
- ☑ Push notifications on Android (verified end to end)
- ☐ Push notifications on iPhone (needs the Apple push key: `APNS_KEY_P8`, `APNS_KEY_ID`)
- ◐ iOS: build 4 on TestFlight, attached to version 1.0; App Privacy answers, screenshots and review submission to do
- ◐ Android: debug APK builds; Play Console account and signing secrets to do
- ☐ Tested on a real iPhone and a real Android phone

### 4. Website
- ☑ Fully responsive
- ☑ Advanced filters, sorting and quick store-by-store comparison, total price including delivery
- ☑ Price history, freshness line, coupons page, deals page
- ◐ SEO: titles, descriptions and product structured data done; still `#/` addresses, so search engines cannot index product pages (needs the Next.js port, about 3 weeks)
- ☐ XML sitemap and Google Search Console

### 5. Control panel
- ☑ Users, stores, products, offers and coupons management
- ☑ Admin roles and permissions (owner, catalog, partners, analyst) and audit log
- ☑ Click tracking ("Visit store" goes through the `go` function and is logged with its tracking ID)
- ◐ CPC: cost per click set per store, revenue estimated from clicks; real billing needs CPC agreements
- ☐ Commission and conversion tracking (needs the networks' conversion reports or postbacks, available after approval)
- ☐ Purchase reports: orders, values, accepted / rejected (from network conversion data)
- ◐ Non-purchase reports: clicks recorded; "non-converting clicks" and "most viewed without purchase" need conversion data and page-view counts
- ☑ CSV export
- ☐ PDF export
- ◐ Store feeds page shows each feed's last run; admin settings tabs are saved in the browser only

### 6. Technical integrations
**Affiliate networks**
- ☐ Amazon Associates SA (signup page open; you register under the client's company)
- ☐ Amazon Associates US and UK
- ☐ noon affiliates (signup page open)
- ☐ Awin, ShareASale, CJ (US and UK stores)
- ☑ Unique tracking ID per store and product link (`doabno-{market}-{store}-{product}`)

**CPC networks**
- ☐ Google Shopping Ads, Kelkoo, PriceRunner. Note: Kelkoo and PriceRunner are comparison sites themselves; for DOABNO this means joining their publisher programs, or stores paying DOABNO per click directly
- ☑ Cost per click per store and the calculation in the admin

**Store and product integration**
- ☑ Feed importer for JSON, CSV and XML (Google Merchant too), barcode matching, price checks, rejects report
- ☑ Schedules: hourly, every 6 hours or daily per feed
- ☑ Store page reader for stores whose robots.txt allows it (eXtra, Saco, Nahdi; 15 product pages verified, live after phase 0)
- ☐ First real network feed loaded

### 7. Brands and products
- ☐ 10 to 15 well-known brands contacted and listed, after the client approves the list (Beauty, Fashion, Kids, Home, Electronics)
- ◐ Product base: 20 demo products today; target at least 5,000 active products at launch, mostly from network feeds
- ☐ Regular test of every referral link and conversion (a scheduled link checker; to build once real links exist)

### 8. Security, speed, legal
- ☑ Protection against SQL injection (database access through parameterised API and row-level security), XSS (escaped output, Content-Security-Policy), CSRF (token-based API, no cookie sessions)
- ☐ Independent security test before launch
- ◐ Response time: static site on Cloudflare loads well under 7 seconds; to measure again on real phones with the real catalogue
- ◐ PDPL, GDPR, CCPA: cookie consent, "do not sell or share", data download, account deletion, consent records built; legal texts are placeholders; Saudi legal adviser must approve, including storing data in Frankfurt

### 9. Handover and documentation
- ◐ Source code on GitHub (`allenadhitya1718/doabno`); move to the client's own organization
- ◐ Accounts in the client's name from day one: Apple and Firebase exist; domain, Cloudflare, Supabase, Google Play, Resend still to open or transfer
- ◐ Technical manual: `HANDOVER.md`, `backend/README.md`, `TESTING-MANUAL.md` in English; Arabic version to write
- ☐ Architecture document and API manual
- ☐ 10 hours of online training on the control panel

## How the store integrations work

There are four ways to get a store's prices into DOABNO. All four write into the same `offers` table, so the site and apps do not change.

| Method | When to use | What we need | Refresh |
|---|---|---|---|
| 1. Affiliate network feed | Store is on Awin (includes ShareASale) or CJ | Approval in the network, then the store's product feed URL (CSV or XML) | Network regenerates it; we load it daily or hourly |
| 2. Store API | Amazon (Product Advertising API) | Associates approval plus 3 qualifying sales in 180 days, then API keys | We ask per product on our schedule |
| 3. Direct feed from the store | Stores without a network (Jarir, eXtra, Saco, smaller shops) | Agreement with the store; a Google Merchant feed is the easiest format for them | Daily or hourly |
| 4. Store page reader | Stores whose robots.txt allows product pages | A list of product page addresses per store | Daily, one page every 3 s |

**Steps for a feed store (methods 1 and 3)**
1. Apply as a Publisher with the client's company details; add `doabno.com` and the apps.
2. Once approved, apply to each store inside the network (Namshi, Sephora, Centrepoint...).
3. Copy the store's product feed URL. If it contains a key, save the key as a GitHub secret named `FEED_<STORE>_KEY` and write `${FEED_<STORE>_KEY}` in the address.
4. Add one row in the `feeds` table: store id, format (`csv`, `xml`, `json`, `google_merchant`), schedule, address. Template in `HANDOVER.md` section 5.
5. Try it first without saving: `node backend/importer/cli.js dry-run --file feed.csv --format csv --store <store-id>`.
6. Run the **Import store feeds** workflow once; check the store's last run on the admin Store feeds page and the rejected items.
7. Copy the network's tracking link format into the store's offers, so every "Visit store" click earns commission.

**Steps for Amazon (method 2)**
1. Register Amazon Associates SA (then US, UK) under the client's company.
2. Send traffic with plain Associates links until the 3 qualifying sales.
3. Request Product Advertising API keys; save them as GitHub secrets.
4. Build the Amazon adapter in `backend/importer/` (about one day): it asks for each catalogue product by ASIN and writes the offer.
5. Show prices with Amazon's "price as of" rule; our "Checked N ago" line covers it.

**Steps for a page-reader store (method 4)**
1. Check the store's `robots.txt`; only continue if product pages are allowed.
2. Find each product's page from the store's sitemap and test it: `node backend/importer/cli.js page-test --url <page> --product <id>`.
3. Add the page to `backend/supabase/seed/03-scrape-pages.sql` and run it, with a `scrape` feed row for the store.
4. The daily job reads the pages; a store answering 403 or 429 stops the run and is reported.
5. Get the legal adviser's approval for each store read this way.

**Where each Saudi store stands**

| Store | Method | State |
|---|---|---|
| Amazon.sa | 2 | Apply now |
| noon | 1 (own program or network) | Apply now; ask support for a feed |
| Jarir | 3 | Page reading forbidden; contact Jarir directly |
| eXtra | 4, later 3 | 7 products mapped |
| Saco | 4, later 3 | 7 products mapped |
| Nahdi | 4, later 1 | 1 product mapped |
| Namshi, Centrepoint, Sephora, Ounass | 2 | Page reader where robots.txt allows, or a direct feed from the store (not on the PRD networks) |
| Carrefour, Virgin | 1 or 3 | To ask |

## Pending, in order
1. Recover the database (phase 0).
2. Register doabno.com and open the remaining accounts in the client's name.
3. Submit the PRD networks (Amazon Associates SA/US/UK, Awin incl. ShareASale, CJ) and noon applications with the client's company papers.
4. Client approves the 10 to 15 brands; contact them.
5. Load the first network feeds; grow towards 5,000 products.
6. iPhone push key, App Store submission, Play Console.
7. Conversion reports, purchase / non-purchase reports, PDF export, link checker.
8. Next.js port for SEO, sitemap, Search Console.
9. Legal texts approved, security test, speed check.
10. Arabic manual, architecture and API docs, 10 h training.
