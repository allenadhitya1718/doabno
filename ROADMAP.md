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
| devesh1905 (+ Claude session) | Back end, day 1-3 build | `backend/**` (whole folder), `ROADMAP.md`, `BACKEND-PLAN.md` | 2026-10-11 | Schema, seed, catalog loader done; feed importer and click function being written |
| devesh1905 (+ Claude session) | Data loader in the three apps | `*/assets/data.js`, `*/assets/boot.js`, `*/assets/config.js` (for `web-v2`, `app-v2`, `admin-v2`) and the script tags at the bottom of each `index.html` | 2026-10-11 | Done and tested; hands off |
| devesh1905 (+ Claude session) | Reserved for next steps (not started) | `admin-v2/admin.js` (wire to database), `web-v2/v2.js` and `app-v2/mobile.js` (sign-in, favorites, alerts), `app-frame/app/assets/data.js` | next | Queued: starts after the Supabase project exists |

## Queued (waiting on something)
1. **Waiting on Supabase project** (owner has to create it): run `backend/supabase/migrations/*.sql` and the seed files, then switch `assets/config.js` from demo data to the live catalog.
2. Sign-up and login in website and app; favorites and price alerts saved in the database.
3. Real "Visit store" click tracking (function written; deploy needs the project).
4. Admin saves edits to the database; roles; audit log.
5. Privacy features (data download, account deletion, consent records).
6. Deploy to free hosting; weekly backup; handover note.
7. Needs the client: store feed samples, affiliate approvals, Saudi legal sign-off.

## Done
- Website, app and admin redesigns (`web-v2/`, `app-v2/`, `admin-v2/`), including the new admin on `main`.
- Figma screenshot folders (English + Arabic-only sets).
- Back-end plan (`BACKEND-PLAN.md`), database schema and demo seed data (`backend/supabase/`).
- Catalog loader: pages can read the catalog from a database or file, and fall back to demo data (tested: 250 checks).

## Not planned for the first 3 days
Next.js rebuild for Google, native app, extra Gulf markets, hourly refresh. See `BACKEND-PLAN.md`.

## Requests for the owner of a claimed area
_(add a line: who, what you need, which file)_
