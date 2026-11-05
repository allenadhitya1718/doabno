# DOABNO back end

Plan: see [../BACKEND-PLAN.md](../BACKEND-PLAN.md). Database: Supabase (Postgres), Frankfurt region.

## Files
- `supabase/migrations/0001_schema.sql`: all tables, row-level security, helper functions.
- `seed/build-seed.js`: turns the demo catalog (`admin-v2/assets/data.js`) into seed SQL.
- `supabase/seed/01-catalog.sql`, `02-history.sql`: generated; re-create with `node backend/seed/build-seed.js`.

## Set up a project (about 10 minutes)
1. Create a Supabase account and a project named `doabno` (region: Central EU / Frankfurt, plan: Free). Save the database password.
2. In the dashboard open **SQL Editor**, then run these files in order (paste each one, press Run):
   `0001_schema.sql`, `01-catalog.sql`, `02-history.sql`.
3. Check: **Table Editor** shows 43 rows in `stores`, 20 in `products`, 355 in `offers`.
4. Send the **Project URL** and the **publishable (anon) key** (Settings, API Keys). These two are meant to be public; never share the `service_role` key or the database password.

Run `0002_get_catalog.sql`, `0003_account_functions.sql`, `0004_admin.sql`, `0005_alerts.sql`, `0006_click_stats.sql` and `0007_admin_people.sql` too, in that order (after `0001`). It creates `get_catalog()`, which the three apps call for the whole catalog.

Status: the SQL has not been run against a real database yet; the first run is the test.

If a run stops with an error: fix is pushed here first (pull, then re-open the file and paste again). If the next run complains that tables or policies "already exist", the earlier run left parts behind: on a new empty test project only, run `supabase/reset-dev.sql` once, then run the files again from the top.

## Other parts
- `importer/`: feed importer (CSV, XML/Google Merchant, JSON). Try it without a database: `node importer/cli.js dry-run --file feed.csv --format csv --store noon-sa`. With a database: `node importer/cli.js run --schedule daily` (needs `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`).
- `importer/scrape.js`: **store page reader**, for a store that gives no feed. A person maps each product to its page on the store's site once (`scrape_pages` table, migration `0011`), and the daily run reads those pages and takes the price from the structured data (JSON-LD "Product") the store publishes for search engines. Polite by design: one page at a time with a 3 s pause (longer if the store's robots.txt asks), robots.txt obeyed, the honest bot name `DOABNOBot/1.0 (+https://doabno.pages.dev)`, no proxies, and the run stops the moment the store answers 403 or 429. A page is only used when it agrees with our product (same barcode when the page gives one, our brand in its name otherwise); a page that cannot be read keeps the product's last offer instead of marking it out of stock. **Only for stores whose robots.txt allows product pages.** Checked 2026-11-05: eXtra allows them (prices matched the page: iPhone 17 Pro 256GB 4,699 SAR, AirPods Pro 3 999 SAR); Jarir forbids `/sa-en/dp/*` to everyone but Google and blocks price-comparison bots by name; Amazon.sa answers scripts with a captcha; noon does not answer. Do not add those. Try one page without saving: `node importer/cli.js page-test --url <product page> --product <catalog id>`. Map pages with `insert into scrape_pages (product_id, store_id, url) values (...)`; the feed row for eXtra (`format = 'scrape'`) is created by the migration. Reject reasons in `feed_rejects`: `robots_disallow`, `fetch_failed`, `timeout`, `no_product_data`, `page_mismatch`, `bad_url`, `no_product`. The client's legal adviser should still approve reading any store this way.
- `supabase/functions/go/`: the "Visit store" click-out function (logs the click, then redirects). Deploy with JWT verification off; set the `CLICK_SALT` secret.
- `../.github/workflows/import-feeds.yml`: runs the importer daily once it is on `main` and the two secrets are set.
- `tests/`: `npm test` from this folder (no installs needed). 105 tests + 250 loader checks.
- Apps read the catalog through `*/assets/boot.js` and `*/assets/config.js`. Leave `config.js` empty to keep demo data.

## Making the first admin (once)
The admin portal signs in with a normal Supabase account that also has a row in the `admins` table. Nobody can make the first one from the portal, so do it once in the SQL Editor, after that person has created an account on the website or app (use their email):

```sql
insert into public.admins (user_id, name, role)
select id, 'Their Name', 'owner' from auth.users where lower(email) = lower('owner@example.com');
```

After that, the owner adds the rest of the team from the portal (Settings, Team, Invite member; the person must have an account first). Roles: **owner** (everything), **catalog** (products, categories, popular searches), **partners** (stores, coupons, feeds), **analyst** (read only, plus the users list). The database enforces this, not the screens: a change a role is not allowed to make is refused and the page reloads.
## Price-drop emails

`node importer/cli.js alerts [--dry true]` emails people whose alert target was reached (needs `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL`; `--dry true` only lists who would get one). The daily import runs it automatically when those are set. Rules: only alerts with email on and a recorded consent; one email per drop; re-armed when the price rises above the target; at most `ALERT_MAX_EMAILS` (default 80) per run.

Full handover guide: `../HANDOVER.md`.
