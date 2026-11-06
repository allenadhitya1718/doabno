# DOABNO: how to connect a store, step by step

Written 2026-11-06 for the team. It covers every way a store's prices get into DOABNO, with the exact commands and screens.
Background: `docs/ARCHITECTURE.md` (how the pieces fit), `docs/API.md` (feed field names), `backend/README.md` (importer details).

---

## 0. The basics in one minute

- Every price on the site is a row in the `offers` table: one row per product and store, with price, delivery, stock, link and the time it was checked.
- The **daily job** (GitHub, Actions, **Import store feeds**, 03:00 UTC, also runnable by hand) reads every active row of the `feeds` table, fetches that source, matches items to our products and updates `offers`. It also writes price history and sends price-drop alerts.
- A store gets into `offers` in one of four ways:

| Method | Use it when | What you need | How fresh |
|---|---|---|---|
| **A. Affiliate network feed** | The store is on ArabClicks, Admitad, DCM, Awin, CJ, ShareASale | Network approval + the store's product feed address | Daily or hourly |
| **B. Store's own affiliate program** | noon, Amazon | Program approval; for Amazon also API keys after 3 sales | Daily or hourly |
| **C. Direct feed from the store** | Store has no network (Jarir, eXtra, Saco, smaller shops) | An agreement and a feed file or address from the store | Daily or hourly |
| **D. Store page reader** | Store gives nothing but its robots.txt allows product pages | A list of product page addresses | Daily, slow on purpose |

- Products are matched by **barcode** (GTIN/EAN) for A, B and C. For D, a person links each product to its page once.
- The **"Visit store"** button goes through our `go` function, which logs the click and sends the shopper to the offer's link. When that link is an affiliate (tracking) link, the sale earns commission.

Where we stand today:

| Store | Method | State |
|---|---|---|
| eXtra | D (later C) | Live, 63 products (2026-11-06) |
| Saco | D (later C) | Live, 7 products |
| Nahdi | D (later A) | Live, 29 products (2026-11-06) |
| Amazon.sa | B | Apply (affiliate-program.amazon.sa) |
| noon | B (or A) | **Joined 2026-11-06**: affiliate id `AFF7afd47407a73`, organisation JEC (project `PRJ651175`), terms accepted, Everyday Campaign active. Links are made one by one in the dashboard (server-side, no link pattern); payouts need ID and bank documents. Next: email affiliate.support@noon.com for a product feed/API with deep links and written OK to use noon's name and logo (terms 8.3) |
| Jarir | C | Page reading forbidden by its robots.txt: ask Jarir for a feed |
| Namshi, Centrepoint, Sephora, Ounass | A | Through ArabClicks or Admitad |
| Carrefour, Virgin | A or C | To ask |

---

## 1. Before any application: what to have ready

Ask the client for these once; every network asks for most of them.

- Company legal name, commercial registration (CR) number, address, phone, company email
- VAT number (if registered)
- Authorized signatory name and title, and the signed authorization letter (template: `docs/affiliate-authorization-letter-template.md`)
- Bank account for payouts: bank name, IBAN, account holder (the company)
- Website `https://doabno.pages.dev` (later `https://doabno.com`), the iPhone and Android apps
- A one-line description: "DOABNO is a Saudi price-comparison website and app. Shoppers compare the total price (with delivery) across stores and click through to buy."
- Traffic: answer honestly ("new site, launching"); never invent numbers
- Categories: Electronics first, then Beauty, Home, Fashion, Kids

Rules for whoever fills in the forms:
- Register under the **client's company**, not a personal name.
- Stop before ID, tax or bank pages until the client has given the details and approved.
- Read the terms before accepting. Check what they say about price-comparison sites, showing prices, and whether scraping is forbidden for affiliates (Amazon forbids it).

---

## 2. Method A: affiliate network feed

### 2.1 Join the network (once per network)
1. **Admitad:** https://www.admitad.com/en-sa/ → Join → choose **Publisher** (not Advertiser or Agency).
   **ArabClicks:** https://arabclicks.com → Become a publisher.
   **DCM:** https://www.dcmnetwork.com → Publishers.
2. Fill in the company details from section 1.
3. Add the "ad space" (they call the website or app this): type **Website**, address, category **Coupons / Cashback / Price comparison** (pick "price comparison" if listed), country **Saudi Arabia**.
4. Wait for approval (days to weeks). Keep the confirmation emails.

### 2.2 Apply to each store inside the network
1. In the network dashboard open **Programs / Advertisers / Offers**, filter country **Saudi Arabia**.
2. Open the store (for example Namshi), read its rules (allowed traffic types, coupon rules, whether price comparison is allowed), then **Apply / Join program**.
3. When approved, look for **Product feed / Product catalog / Data feed**. Note:
   - the **feed address** (often contains a key or token),
   - the **format** (CSV, XML, Google Merchant XML, JSON),
   - whether the feed's product link is already a **tracking (deep) link**. It usually is (`deeplink`, `aw_deep_link`, `tracking_url`). If not, ask the network for the deeplink format and tell the developer.
4. If the store has no feed, ask the network's manager: "Does <store> provide a product feed for price-comparison publishers?"

### 2.3 Connect the feed (developer)
1. **Add the store** (if new) in the admin: Admin → Stores → Add store. Note its id, for example `namshi-sa`.
2. **Keep keys out of the database.** If the feed address contains a key, save the key as a GitHub secret:
   ```bash
   gh secret set FEED_NAMSHI_KEY --repo allenadhitya1718/doabno
   ```
   (paste the key at the prompt). Then add one line under `env:` in `.github/workflows/import-feeds.yml`:
   ```yaml
   FEED_NAMSHI_KEY: ${{ secrets.FEED_NAMSHI_KEY }}
   ```
   Only names starting with `FEED_` are allowed in feed addresses.
3. **Try the feed without saving anything.** Download a copy and run:
   ```bash
   node backend/importer/cli.js dry-run --file namshi.xml --format google_merchant --store namshi-sa
   ```
   It prints how many items matched our products and why the others were rejected (`no_gtin`, `invalid_gtin`, `bad_price`, `no_match`, `price_outlier`...). `no_match` means the product is not in our catalogue yet; that is normal.
4. **Register the feed** in Supabase (SQL Editor, or `npx supabase db query --remote=jturenubwqxzesjlyjpi --yes "..."`):
   ```sql
   insert into public.feeds (store_id, format, schedule, url)
   values ('namshi-sa', 'google_merchant', 'daily', 'https://feeds.network.example/namshi.xml?key=${FEED_NAMSHI_KEY}');
   ```
   Formats: `csv`, `xml`, `json`, `google_merchant`. Schedules: `daily`, `six_hourly`, `hourly` (only `daily` runs automatically today; add a cron line to the workflow for the others).
5. **Run it once:** GitHub → Actions → **Import store feeds** → Run workflow → enter the feed id (from `select id, store_id from feeds;`). The log ends with `feed N (namshi-sa): ok, X items, Y rejected`.
6. **Check:** Admin → Store feeds shows the last run; open a product page on the site and confirm the store's price and that **Visit store** opens the store through the tracking link.

### 2.4 Grow the catalogue from a feed
Items that are not in our catalogue are rejected as `no_match`. To add them: import the products first (name, brand, category, barcode, photo) through Admin → Products, or ask the developer for a bulk import from the feed. The next run then matches them.

---

## 3. Method B: the store's own program

### 3.1 noon
1. Go to https://affiliates.noon.com/en → **Join Now** → sign up with the company email and phone.
2. Fill in the profile: website, social channels, audience Saudi Arabia, categories.
3. Read **Terms & Conditions** (footer). Look for rules about price-comparison sites and showing prices.
4. After joining, the dashboard gives **links and coupon codes**. Email `affiliate.support@noon.com`:
   > Subject: Product feed for a price-comparison publisher
   > We run DOABNO, a Saudi price-comparison site (https://doabno.pages.dev). We joined the noon affiliate program as <publisher id>. Do you provide a product feed (CSV/XML) or an API with prices, stock, barcodes and affiliate deep links for comparison publishers?
5. If noon sends a feed: follow section 2.3 with store id `noon-sa`.
   If noon gives only links: send the developer the link format; the developer stores the affiliate link on each noon offer, and noon prices stay "link only" until a feed exists.

### 3.2 Amazon.sa (then .ae, .com, .co.uk)
1. Go to https://affiliate-program.amazon.sa → **Sign up** → sign in with the company's Amazon account (create one with the company email if needed).
2. Account info: payee = the company. Website and apps: list the site and both apps.
3. Profile: preferred store ID `doabno`; topics Electronics, Beauty, Home; how you drive traffic: "price comparison website and mobile app"; visitors: honest number.
4. Read and accept the Operating Agreement, then tax and payment details (client data).
5. **Within 180 days you need 3 qualifying sales** through your links, or the account closes. Share product links through the site's Visit store buttons; you may not buy through your own links.
6. **Until API access:** use plain Associates links (SiteStripe on amazon.sa) for Amazon offers; do not scrape Amazon (it breaks their agreement and gets the account closed).
7. **After 3 sales:** request Product Advertising API keys (Associates Central → Tools → Product Advertising API). Then for the developer:
   - Save secrets `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY`, `AMAZON_PARTNER_TAG_SA` with `gh secret set ...`.
   - Check `backend/importer/amazon.js` against Amazon's current API docs (it was written before we had keys and is not wired in).
   - Add a table of ASINs per product (like `scrape_pages`), a feed format `amazon`, and wire it in `backend/importer/pipeline.js`.
   - Show Amazon prices with the "price as of" time (our "Checked N ago" line does this) and refresh at least every 24 hours, as Amazon requires.

---

## 4. Method C: direct feed from the store

For stores without a network (Jarir, eXtra, Saco, smaller shops).

1. Find the e-commerce or marketing contact (LinkedIn, the site's "Partners/Advertise" page, or the general email).
2. Send:
   > Subject: Free traffic from DOABNO, a Saudi price-comparison site
   > DOABNO (https://doabno.pages.dev) compares total prices across Saudi stores and sends shoppers straight to the store's product page. We'd like to list <store> correctly and keep your prices accurate. Could you share a product feed? The easiest is the Google Merchant Center feed you already have (XML or CSV with id, title, barcode/GTIN, price, sale price, availability, link, image, shipping). We refresh daily and link back to your product pages. We are happy to add your tracking parameters.
3. When they agree, they usually send a feed address (a Google Merchant XML URL) or a file on a schedule.
4. Connect it exactly as in section 2.3 (store id `jarir`, `extra`, `saco`...). For a store already read with the page reader (method D), switch it off after the feed works:
   ```sql
   update public.feeds set active = false where store_id = 'extra' and format = 'scrape';
   ```
5. If they want a tracking parameter on links (for example `?utm_source=doabno`), tell the developer; it can be added at import time.

---

## 5. Method D: store page reader (only where allowed)

The reader opens each mapped product page on the store's site, takes the price from the page's structured data (JSON-LD "Product"), and saves it. It obeys robots.txt, waits at least 3 seconds between pages, uses the honest name `DOABNOBot`, never uses proxies, and stops the whole run the moment the store answers 403 or 429.

### 5.1 Check the store allows it
```bash
curl -s https://www.<store>.com/robots.txt
```
Continue only if product pages are not disallowed for `*` or for bots in general. Today: eXtra, Saco, Nahdi allow it (Saco's robots.txt also blocks AI crawlers by name, `ClaudeBot` and `Claude`: the daily `DOABNOBot` reader is allowed, but do not use an AI assistant to browse Saco when looking for new pages; find them by hand); Jarir forbids product pages; Centrepoint and Sephora refuse bots (403); Amazon shows a captcha; noon does not answer. Never work around a block.
Get the client's legal adviser's OK for each store read this way.

### 5.2 Find the product's page
Use the store's sitemap (listed at the bottom of robots.txt), search it for the product name, and pick the exact model and size (colour does not matter when the price is the same).

### 5.3 Test the page without saving
```bash
cd backend
node importer/cli.js page-test --url "<product page>" --product <our product id>
```
"Importer row" shows the price, currency, stock and delivery it would save. "Rejected: page_mismatch" means the page is for another product (wrong brand or barcode): find the right page.

### 5.4 Map it
Add a line to `backend/supabase/seed/03-scrape-pages.sql` (keeps a record in git) and run it, or directly:
```sql
insert into public.scrape_pages (product_id, store_id, url)
values ('iphone-17-pro', 'extra', 'https://www.extra.com/en-sa/.../p/100460369')
on conflict (product_id, store_id) do update set url = excluded.url, active = true;
-- once per store:
insert into public.feeds (store_id, format, schedule, url) values ('extra', 'scrape', 'daily', null);
```
If the product was hidden (no real price yet), show it again: `update public.products set status = 'active' where id = 'iphone-17-pro';`

### 5.5 Run and check
Run **Import store feeds** (section 2.3 step 5). The log shows `feed N (extra): ok, X items, Y rejected`. Rejected reasons for pages: `robots_disallow`, `fetch_failed`, `timeout`, `no_product_data`, `page_mismatch`, `bad_url`.

### 5.6 Add new products from a store's pages
The reader can only fill prices for products already in our catalogue. To add products the store sells:
1. Download the store's sitemap addresses into a text file, one per line (sitemaps are listed in robots.txt; wait 3 s between files).
2. Write a list `products.json`: `[["our-id", "category", "subcategory", "<page address or a regular expression for the sitemap>"], ...]`. Categories and subcategories must already exist (see `01-catalog.sql`).
3. Run, from `backend`:
   ```bash
   node importer/pages-to-catalog.js --store extra --list products.json --urls extra-urls.txt --out supabase/seed/06-extra-catalog.sql --photo-query "?fmt=webp&wid=640"
   ```
   It reads each page in English and Arabic (3 s apart, robots.txt obeyed, stops on 403/429) and writes SQL with the products (the store's own names), the store's photo credited to it, and the page mapping. Out-of-stock and unreadable pages are skipped and listed at the top of the file. Use `--existing id1,id2` for products already in the catalogue: their page is mapped and they are shown again.
4. Read the SQL, fix any odd names, run it (needs migration `0015_product_mpn.sql` once), then run **Import store feeds**.
5. A new photo host must be allowed in the site's Content-Security-Policy (`img-src` in `scripts/build-site.js`), then rebuild and redeploy.

Done on 2026-11-06: `06-extra-catalog.sql` and `07-nahdi-catalog.sql`.

---

## 6. After any store is connected

- **Link health:** the weekly **Link check** workflow (Mondays) tests every offer link and stores the result in `link_checks` (`ok`, `not_found`, `redirect_home`, `blocked`, `error`). Fix or remove links that fail twice in a row.
- **Commission tracking:** every offer has a tracking id `doabno-{market}-{store}-{product}`. Pass it as the network's sub-id when the network allows (the developer adds it to the tracking link). Each month, download the network's conversion report (CSV) and upload it in Admin → Reports → **Import conversions**. Purchases and the "no purchase" reports then fill in.
- **Clicks:** Admin → Reports → Clicks shows Visit store clicks per store and product from the `go` function.
- **Coupons:** real codes from networks go in Admin → Coupons (all demo coupons were paused on 2026-11-06).

---

## 7. Demo data (switched off 2026-11-06)

The site shows only real prices. Demo offers and history were copied to `demo_offers` and `demo_price_history` and removed; demo coupons were paused; products without a real price were hidden (8 of 20 shown).
- Show them all again (for a demo): run `backend/supabase/seed/05-restore-demo.sql`.
- Files that did it: `04-hide-demo.sql` and `04b-hide-demo-at-read-stores.sql`.

---

## 8. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| Import log `GET feeds failed: HTTP 401` | `SUPABASE_SERVICE_KEY` secret is wrong. It must be the **legacy service_role** key (Supabase → Settings → API Keys → Legacy API keys), not the new `sb_secret_` key |
| `feed N: error auth` | The feed or store refused access (bad key, or a store page answered 403/429). Check the key; for the page reader, stop reading that store |
| Many `no_match` rejects | Products not in our catalogue, or the feed has no barcodes. Add the products, or ask for GTIN/EAN in the feed |
| Many `price_outlier` rejects | Price is below 40% or above 250% of other stores' median: usually a bundle, a different size, or a wrong currency |
| Store price not on the site | Product hidden (`status`), store inactive, or the feed row inactive. Check in Admin |
| "Visit store" goes to the home page | The offer has no link, or the store/product is paused |
