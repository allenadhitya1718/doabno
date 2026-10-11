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

Run `0002_get_catalog.sql` too (after `0001`). It creates `get_catalog()`, which the three apps call for the whole catalog.

Status: the SQL has not been run against a real database yet; the first run is the test.

## Other parts
- `importer/`: feed importer (CSV, XML/Google Merchant, JSON). Try it without a database: `node importer/cli.js dry-run --file feed.csv --format csv --store noon-sa`. With a database: `node importer/cli.js run --schedule daily` (needs `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`).
- `supabase/functions/go/`: the "Visit store" click-out function (logs the click, then redirects). Deploy with JWT verification off; set the `CLICK_SALT` secret.
- `../.github/workflows/import-feeds.yml`: runs the importer daily once it is on `main` and the two secrets are set.
- `tests/`: `npm test` from this folder (no installs needed). 13 importer tests + 250 loader checks.
- Apps read the catalog through `*/assets/boot.js` and `*/assets/config.js`. Leave `config.js` empty to keep demo data.
