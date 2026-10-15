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
| devesh1905 (+ Claude session) | Back end, day 1-3 build | `backend/**` (whole folder), `.github/**`, `scripts/**`, `HANDOVER.md`, `remainingthings.md`, `ROADMAP.md`, `BACKEND-PLAN.md`, `CLAUDE.md` | 2026-10-11 | Written and tested offline: schema, seed, catalog loader, feed importer, click function. Live catalog, accounts and admin connected. Alert emails, hosting build, weekly backup workflow and handover document done (2026-10-13); waiting on accounts and secrets, see Queued |
| devesh1905 (+ Claude session) | Data loader in the three apps | `*/assets/data.js`, `*/assets/boot.js`, `*/assets/config.js` (for `web-v2`, `app-v2`, `admin-v2`) and the script tags at the bottom of each `index.html` | 2026-10-11 | Done and tested; hands off |
| devesh1905 (+ Claude session) | Accounts in website, app and admin | `web-v2/v2.js`, `web-v2/v2.css`, `web-v2/assets/account.js`, `app-v2/mobile.js`, `admin-v2/admin.js`, `app-frame/app/assets/data.js` | 2026-10-13 | Website and app done and tested live. Admin code written and tested against the mock (2026-10-13); **needs `0004_admin.sql` run, then a first owner added** (see `backend/README.md`), then a live test. Still demo in the admin: traffic and revenue numbers, feeds page and its "Run now" |
| allenadhitya1718 (+ Claude session) | Account setup with a browser (no domain yet) | Supabase settings and `go` function, GitHub secrets and workflow runs, `clickOutUrl` line in `*/assets/config.js`, ticks in `remainingthings.md` and `ROADMAP.md`. Not touching hosting, domain or Resend until a domain exists | 2026-10-14 | `go` function deployed (JWT off, Confirm email on, advisors read: 0 errors), `clickOutUrl` set in the three configs, `CLICK_SALT` and the four GitHub secrets saved, import workflow green, **Back up database workflow green (run #5, 2026-10-15, 1 artifact)**, second admin (owner) added 2026-10-15. Waiting on a domain: hosting, Resend email, `SITE_URL`, Supabase redirect URLs |

## Queued (waiting on something)
1. ~~Supabase project~~ **Done 2026-10-13:** project created, schema and seed loaded, counts verified, and the three apps now read the live catalog (`*/assets/config.js`). The live catalog matches the demo data (250 parity checks).
2. Deploy and test the click function (`backend/supabase/functions/go`), set `CLICK_SALT`; run the importer against a real feed (`backend/importer/cli.js`); add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub secrets (the daily workflow only runs once merged to `main`).
3. **Run `backend/supabase/migrations/0003_account_functions.sql` in the Supabase SQL Editor** (account deletion and consent saved at sign-up need it). Then: Google and Apple sign-in (buttons show "coming soon" for now); decide whether Supabase "Confirm email" stays on (default on; free plan sends only a few emails per hour).
4. Admin: run `backend/supabase/migrations/0004_admin.sql`, add the first owner (SQL in `backend/README.md`), test live. Traffic and revenue numbers stay generated until real clicks exist.
5. Privacy features (data download, account deletion, consent records).
6. **Needs the owner:** run `backend/supabase/migrations/0005_alerts.sql`; create Cloudflare and Resend accounts and a domain; add the GitHub secrets listed in `HANDOVER.md` section 3; merge `redesign-v2` into `main` when approved (scheduled jobs and the live site build from `main`); set Supabase custom SMTP and redirect URLs.
7. **We run the affiliate applications, feeds and tracking links ourselves; the client only sends information** (company details, authorized signatory, authorization letter, payout details, legal adviser contact and sign-off). See `ClientRequirements.pdf`. Open for us: prepare the authorization-letter template, choose the first stores and networks, submit the applications as soon as the company details arrive.
8. `app-frame/app/assets/data.js` (a separate copy) still uses demo data only; port the loader there when the app wrapper is next touched.

9. **Account setup with a browser:** the next person's Claude Code follows [SETUP-WITH-BROWSER.md](SETUP-WITH-BROWSER.md) (open sign-in tabs, the person logs in, Claude does the settings; secrets and payments stay with the person). Claim a row here before starting.

## Done
- Website, app and admin redesigns (`web-v2/`, `app-v2/`, `admin-v2/`), including the new admin on `main`.
- Figma screenshot folders (English + Arabic-only sets).
- Back-end plan (`BACKEND-PLAN.md`), database schema and demo seed data (`backend/supabase/`).
- Catalog loader: pages can read the catalog from a database or file, and fall back to demo data (tested: 250 checks).
- Feed importer (CSV, XML/Google Merchant, JSON): barcode matching, price checks, change-only history, error codes. Tested offline: 13 tests, including a fake-server test of the Supabase adapter. Not yet run on a real project.
- Click-out function and daily import workflow: written, not deployed.
- Website accounts: sign-up, sign-in, favorites and price alerts saved in the database, profile consent, privacy requests, account deletion (`web-v2/assets/account.js`; 9 tests plus a full browser run against `backend/tests/mock-supabase.js`). Also fixed the oversized checkboxes in the sign-up dialog.
- Email-confirmation link: signing in from the link in the Supabase email (login details are removed from the address bar), plus a fix for a crash after account deletion (stored `null`). Both found by the first live test.
- Admin: buttons and pages hidden by role (checked against the database rules by `backend/tests/permissions.test.js`), real Store feeds page (latest run per feed, "No feed yet"), no fake "Run now".
- Website and app "Visit store" uses the click function when `clickOutUrl` is set in `config.js` and the offer has a store link.
- **Merged into `main` (2026-10-13).** `main` had four admin commits from `allenadhitya1718` (user account drawer, privacy requests page, full settings tabs, sidebar layout). They were kept and combined with the database wiring: shopper suspend, export and delete and privacy request status now use the database (`0007_admin_people.sql`); the settings tabs stay browser-only (labelled when live); sidebar keeps their layout plus the short-screen compaction.
- Admin traffic and revenue read real recorded clicks (`0006_click_stats.sql`; zero until clicks exist; browser-checked with zero and with some clicks).
- Google and Apple sign-in wired (off until the provider is set up and listed in `socialLogin`); `backend/supabase/config.toml` for deploying the click function.
- Content-Security-Policy and security headers in the hosting build; `scripts/serve-dist.js` tests them locally (all three pages checked, no violations).
- Price-drop alert emails (`backend/importer/alerts.js`, `0005_alerts.sql`, 13 tests), hosting build (`scripts/build-site.js`), weekly encrypted backup workflow, `HANDOVER.md`. All need accounts or secrets before they run live.
- Admin on the database: real sign-in with roles, every edit (products, categories, stores, coupons, rates, popular searches) saved to the database, activity log, users and team lists, invite and remove team members (`admin-v2/admin-db.js`, `0004_admin.sql`; 9 tests plus a full browser run against the mock server).
- App accounts: email sign-up and sign-in sheet, account card with sign out and delete, favorites and alerts synced, notification choices saved to the profile (`app-v2/mobile.js`, same `account.js`; tested in a browser against the mock server).
- `ClientRequirements.pdf`: one-page list of what the client must provide (stores and feeds, affiliate accounts, legal approval, domain and accounts, content).

## Not planned for the first 3 days
Next.js rebuild for Google, native app, extra Gulf markets, hourly refresh. See `BACKEND-PLAN.md`.

## Requests for the owner of a claimed area
_(add a line: who, what you need, which file)_
- allenadhitya1718 -> owner of `backend/**`: `backend/supabase/functions/go/index.ts` returns 500 for an unknown, paused or link-less offer when `SITE_URL` is not set, because `Response.redirect("/")` needs a full address. A live hotfix is deployed (2026-10-15): `const SITE = ... ?? ""` plus `home()` that redirects only when `SITE` starts with http(s), else answers 404 "Link not available". Please copy that into the repo file so the next deploy does not undo it.
