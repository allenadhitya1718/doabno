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

Status: the SQL has not been run against a real database yet; the first run is the test.
