# Tests that could not be done on the emulator

Companion to [TEST-RESULTS-EMULATOR.md](TEST-RESULTS-EMULATOR.md). Test IDs refer to [TESTING-MANUAL.md](TESTING-MANUAL.md). Each group says what is missing.

## 1. Needs a real person, device or browser
| Tests | Why not on the emulator |
|---|---|
| Real iPhone and Safari (13.1 matrix, APP-1, APP-5, SEC-3 on iOS) | Emulator is Android only |
| Firefox, Edge, Safari desktop, Brave | Only Android Chrome was available |
| Real Android phone feel: APP-8 (notch, home bar, keyboard covering inputs), APP-9 (smooth flick scrolling), true network speed | The emulator has no real touch hardware, GPU or mobile network. Its Chrome also stalled and showed a blank page until restarted, so its rendering speed says little about real phones |
| ACC-1 to ACC-3, ACC-5, ACC-7 (keyboard-only use, dialog focus, screen reader NVDA/VoiceOver, reduce-motion, field error read-out) | Needs a screen reader and a keyboard session; only a quick DOM scan (names, labels, alt text) was done |
| ACC-4 colour contrast on every badge and both languages | Needs a contrast checker pass over each screen |
| APP-6 rotate phone, 200% zoom | Doable on the emulator later (not run this session) |
| PERF-1 Lighthouse, PERF-2 on a real 3G/4G phone | Lighthouse needs desktop Chrome with the site hosted; emulator timing is not meaningful |
| W-LEG-5 approval of legal wording | Needs the legal adviser |
| Email rendering: M-13 (Gmail, Outlook, phone), A-SU-12 (delivery, not in spam, sender, link domain) | Needs real inboxes and a verified sending domain |

## 2. Needs accounts, secrets or services that are not set up yet
| Tests | Missing |
|---|---|
| A-SU-1 to A-SU-5, A-SU-9 to A-SU-12, A-SI-*, A-SS-1/3/4/5, A-AC-*, A-LK-1/3/4, Y-1 to Y-9, W-ALD-1 to W-ALD-6, W-PROD-7 (alert), APP-4, APP-5 | Creating accounts and confirming email links needs a real inbox and a **throwaway Supabase project** (creating accounts is on the "do not do" list for this assistant, and writing test data into the live project is not wanted). The **client-side** refusals for bad addresses and passwords were tested (no request sent) |
| A-SO-2, A-SO-3 (Google/Apple sign-in) | Providers not set up; `socialLogin` empty |
| AD-* (all admin screens), AD-E-*, role matrix, AD-4/5 | Needs four team users (owner, catalog, partners, analyst) in a project whose data may be changed, and sign-in credentials. Only the signed-out admin screen was checked |
| C-1 to C-10 (click-out and tracking) | `clickOutUrl` is empty in every `config.js` and the `go` function is not deployed (ROADMAP Queued item 2). Also needs real store links and affiliate networks (C-10) |
| M-1 to M-13 (alert emails) | Needs Resend account, verified domain, `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL`, migration `0005`. The code paths are covered by `backend/tests/alerts.test.js` (13 tests) |
| H-1 to H-13 (hosting, backups, restore, import workflow) | Needs Cloudflare Pages, domain, GitHub secrets, and the scheduled jobs only run from `main` |
| DB-14 (mass sign-up), PERF-6 (paused project), PERF-7 (50 users) | Needs a throwaway project and a load tool; should not be aimed at the live project |
| F-16, F-17, F-20 (real feed errors, secret handling, real import) | Needs real feeds and `FEED_…` secrets |

## 3. Skipped to protect the live database (needs a throwaway project)
These would change or try to change data in the real project `hmanlftkhvruqgvkencn`:
- DB-4 for `coupons` (the live response was a parse error, which proves nothing about permission), and write probes on other tables (PATCH/DELETE).
- DB-5 anonymous insert into `privacy_requests`; A-AC-6 to A-AC-9 (privacy form submissions).
- DB-6, DB-7, DB-9 (shopper A vs shopper B, analyst calling owner-only functions): need two real shopper accounts and one analyst.
- DB-8 for the four functions that answered "not found" (`admin_delete_user`, `admin_export_user`, `admin_add_member`, `set_popular_searches`): find the real argument names in `backend/supabase/migrations/` and call them from a throwaway project, or ask the owner whether `0007` is applied.
- DB-11 (Supabase Advisors), DB-13 (Confirm email on, minimum password 8), DB-15 (run each migration twice): need dashboard access to the DOABNO project. The Supabase connection available in this session points at a **different** project ("my equipment workers"), which was deliberately not touched.

## 4. Not emulator work, but not run yet either (can be done on the PC)
| Tests | How |
|---|---|
| F-1 to F-15, F-18, F-19 (feed importer cases) | `node backend/importer/cli.js dry-run --file <file> ...` with test files; no database needed |
| 15 (automated tests) | Done: `cd backend && npm test`, 60 pass, plus 250 parity checks |
| H-2 (build refuses a fake secret) | Run `node scripts/build-site.js` on a copy of the folder with a fake key |
| SEC-1 to SEC-4 on the **running** hosted site | `node scripts/serve-dist.js 5190` and `curl -I`; only the `_headers` file was read this session. Note `dist/` may be an older build than the source |
| W-HOME-3 (hover effects), W-ALR-* (alerts page needs a signed-in account), A-SS-1 token refresh | Hover needs a mouse; alerts and token refresh need an account |
| E-NUM-3 to E-NUM-7 (price extremes: under 1, over 1,000,000, 3 decimals, `was` below price, one-point history) | The live catalog has no such values (checked: no `was` below price, no price ≤ 0, histories 88 to 90 points), so they can only be tested by adding odd data to a throwaway project |
| APP-8 keyboard covering inputs | The emulator's on-screen keyboard did not open; needs the keyboard enabled or a real phone |
| ACC-6 at true 200% zoom | The emulator could not narrow the page below about 340 px |

(Done in the second pass and moved to the results file: W-HOME-4, W-PROD-2, W-COUP-2, W-LOC-5/6, E-SRCH-9/10, APP-6, APP-7, APP-10, APP-11, APP-12.)

## 5. App barcode search (added 2026-10-16)
| Tests | Why not on the emulator |
|---|---|
| Live camera scanning (`Scan a barcode`) in Chrome on Android, Safari on iPhone | The emulator gave the page no camera. Needs a real phone over HTTPS (the camera only works on a secure address) |
| Real photos of real boxes: glare, curved packs, small print, low light, motion blur | Tested only with generated barcode pictures. Take 15 to 20 photos of real products and note how many read |
| Real GTINs | The catalogue's barcodes are placeholder numbers; real stores' feed barcodes will be matched by the same code once feeds are loaded |
