# DOABNO roadmap and work claims

**Read this before editing anything.** It says who is working on what, so two people (or two Claude Code sessions) never edit the same files at once.
Plan and reasoning: [BACKEND-PLAN.md](BACKEND-PLAN.md). Back-end setup: [backend/README.md](backend/README.md).

## How claims work
- A row under **In progress** means that person owns those files right now. **Do not edit them.** If you need a change there, ask the owner (or leave a note in the "Requests" list at the bottom) and work on something else.
- Before starting, add your own row, commit and push it **first**, then begin. When you finish, move the row to **Done** and push.
- Claims are by folder or file path. Anything not listed is free to take.
- Pull before you start (`git pull origin redesign-v2`) and push small commits often.

## In progress (claimed: do not edit)
| Owner | Area | Files / folders claimed | Started | Status |
|---|---|---|---|---|
| devesh1905 (+ Claude session) | Back end, day 1-3 build | `backend/**` (whole folder), `.github/**`, `ROADMAP.md`, `BACKEND-PLAN.md`, `CLAUDE.md` | 2026-10-11 | Written and tested offline: schema, seed, catalog loader, feed importer, click function. Live catalog connected (2026-10-13). Next: login, favorites and alerts, click function, importer on a real feed |
| devesh1905 (+ Claude session) | Data loader in the three apps | `*/assets/data.js`, `*/assets/boot.js`, `*/assets/config.js` (for `web-v2`, `app-v2`, `admin-v2`) and the script tags at the bottom of each `index.html` | 2026-10-11 | Done and tested; hands off |
| devesh1905 (+ Claude session) | Reserved for next steps (not started) | `admin-v2/admin.js` (wire to database), `web-v2/v2.js` and `app-v2/mobile.js` (sign-in, favorites, alerts), `app-frame/app/assets/data.js` | next | Queued: starts after the Supabase project exists |

## Queued (waiting on something)
1. ~~Supabase project~~ **Done 2026-10-13:** project created, schema and seed loaded, counts verified, and the three apps now read the live catalog (`*/assets/config.js`). The live catalog matches the demo data (250 parity checks).
2. Deploy and test the click function (`backend/supabase/functions/go`), set `CLICK_SALT`; run the importer against a real feed (`backend/importer/cli.js`); add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub secrets (the daily workflow only runs once merged to `main`).
3. Sign-up and login in website and app; favorites and price alerts saved in the database (`web-v2/v2.js`, `app-v2/mobile.js`).
4. Admin saves edits to the database; roles; audit log (`admin-v2/admin.js`).
5. Privacy features (data download, account deletion, consent records).
6. Deploy to free hosting; weekly backup; handover note.
7. Needs the client: store feed samples, affiliate approvals, Saudi legal sign-off.
8. `app-frame/app/assets/data.js` (a separate copy) still uses demo data only; port the loader there when the app wrapper is next touched.

## Done
- Website, app and admin redesigns (`web-v2/`, `app-v2/`, `admin-v2/`), including the new admin on `main`.
- Figma screenshot folders (English + Arabic-only sets).
- Back-end plan (`BACKEND-PLAN.md`), database schema and demo seed data (`backend/supabase/`).
- Catalog loader: pages can read the catalog from a database or file, and fall back to demo data (tested: 250 checks).
- Feed importer (CSV, XML/Google Merchant, JSON): barcode matching, price checks, change-only history, error codes. Tested offline: 13 tests, including a fake-server test of the Supabase adapter. Not yet run on a real project.
- Click-out function and daily import workflow: written, not deployed.

## Not planned for the first 3 days
Next.js rebuild for Google, native app, extra Gulf markets, hourly refresh. See `BACKEND-PLAN.md`.

## Requests for the owner of a claimed area
_(add a line: who, what you need, which file)_
