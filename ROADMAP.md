# DOABNO roadmap and work claims

**Read this before editing anything.** It says who is working on what, so two people (or two Claude Code sessions) never edit the same files at once.
Plan and reasoning: [BACKEND-PLAN.md](BACKEND-PLAN.md). Back-end setup: [backend/README.md](backend/README.md).

## How claims work
- A row under **In progress** means that person owns those files right now. **Do not edit them.** If you need a change there, ask the owner (or leave a note in the "Requests" list at the bottom) and work on something else.
- Before starting, add your own row, commit and push it **first**, then begin. When you finish, move the row to **Done** and push.
- Claims are by folder or file path. Anything not listed is free to take.
- Pull before you start (`git pull origin redesign-v2`) and push small commits often.

## Where things stand (updated 2026-10-16, late evening)
Written for the whole team. Everything below is on `main`. Detail for each item is in the files named in brackets.

### Live and working
| Piece | State |
|---|---|
| Website, mobile web app, admin | Live at https://doabno.pages.dev (Cloudflare Pages, **direct upload**, not connected to Git: every change needs a new zip). The live build is `main` as of commit `ba5b1b4`; later commits only touch the native apps, the database and the CI. To redeploy: `node scripts/build-site.js`, zip the contents of `dist/`, Cloudflare dashboard > the project > Deployments > Create new deployment. |
| Supabase (`hmanlftkhvruqgvkencn`, free plan) | Catalog, accounts, admin, alerts tables; edge functions `go` (store links) and `identify` (photo search) deployed; migrations 0001 to 0010 run (0010 = push tokens, run 2026-10-16). Plan: move the project to the friend's Pro organization with Supabase's built-in project transfer **after** the client submission (keep the project active, take a backup first, do not pause it). |
| Photo and barcode search (mobile app) | Barcodes are read on the phone (bundled ZXing, or the phone's own reader) and matched to the catalogue GTIN: tested, 14 of 14 cases. Photos without a barcode go to the `identify` function (Gemini): works with real photos (3 to 10 s). **Free tier limit: 20 requests per model per day per Google project**; two keys are set (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`) and `GEMINI_MODEL=gemini-3.6-flash`; the function falls back across models and keys and skips exhausted ones. A paid key is needed before real users. [`backend/supabase/functions/identify/README.md`] |
| Automated tests | `cd backend && npm test`: 98 tests and 250 catalogue checks pass. Emulator testing results: `TEST-RESULTS-EMULATOR.md`; what an emulator cannot test: `TEST-NOT-POSSIBLE-ON-EMULATOR.md`. |

### Phone apps (Capacitor wrappers around `app-v2`)
| App | State |
|---|---|
| **iPhone** (`ios-app/`, workflow **iOS to TestFlight**) | Two builds of 1.0.0 are uploaded to App Store Connect (the second is signed with the Push capability and was accepted by Apple). Fixed on the way: Apple needs Xcode 26 / iOS 26 SDK (runner `macos-26`), and the bundle id must not be forced onto every target. In App Store Connect still to do: wait for processing, add testers (internal testers need no review; external need Beta App Review and a privacy-policy URL), answer the App Privacy questions. Not tested on a real iPhone. Warning from Apple: raise the iOS deployment target from 14 to 15 before April 2027. [`ios-app/README.md`] |
| **Android** (`android-app/`, workflow **Android build**) | Builds a debug APK on every run (download it from the run page, Artifacts; installs on any phone or emulator). Tested on the emulator: live catalogue, barcodes, photo picker, camera, notification permission. Google Play is not set up: needs a Play Console account and four secrets (`ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) for a signed AAB. [`android-app/README.md`] |
| **Push notifications** | **Android verified end to end** (Firebase project `doabno-84332`, secrets `GOOGLE_SERVICES_JSON_B64` and `FCM_SERVICE_ACCOUNT_JSON`): the app gets a token, the manual **Push test** workflow delivered a notification to the emulator, and tapping it opens the product. **iPhone**: code and signing done, but needs an Apple push key (`APNS_KEY_P8`, `APNS_KEY_ID`). **Not yet tested with a real signed-in account**: saving the token (needs a person to sign up in the app), and the daily alert job sending the push. The daily job already has the push code; no email key (Resend) is set, so only push goes out. [`docs/push-notifications.md`] |

### GitHub secrets and variables (names only)
Set: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, `BACKUP_PASSPHRASE`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_DB_URL`, `FCM_SERVICE_ACCOUNT_JSON`, `GOOGLE_SERVICES_JSON_B64`; variable `BUNDLE_ID=com.doabno.app`.
Still needed: `APNS_KEY_P8`, `APNS_KEY_ID` (iPhone push); the four `ANDROID_*` secrets (Google Play); `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL` (alert emails). Supabase function secrets (set in the Supabase dashboard): `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_MODEL`, `CLICK_SALT`, `SITE_URL`.

### Workflows (Actions tab)
`iOS to TestFlight` (input: version, push), `Android build` (input: version), `Push test` (input: phone token and platform: sends one test notification), `Import store feeds` (daily 03:00 UTC, also runs the price-alert job and push), `Back up database` (weekly).

### Open items, with who has to do them
1. **App Store Connect** (Apple account owner): testers, App Privacy answers, then TestFlight invite for the client.
2. **Apple push key** (Apple developer account owner): Keys > + > Apple Push Notifications service; add `APNS_KEY_P8` and `APNS_KEY_ID`; re-run iOS to TestFlight.
3. **Test push with a real account** (anyone, a test email): sign up in the Android app, set an alert above the price with Push on, allow notifications; then run **Import store feeds** and look for `pushed` in the log.
4. **Paid Gemini key** (before real users): create a billing-enabled key in Google AI Studio and replace the `GEMINI_API_KEY` secret in Supabase. No code change.
5. **Supabase transfer** to the friend's Pro organization (after the client submission).
6. **Legal** (client and legal adviser): the legal notice page still has placeholders; the privacy policy needs a sentence about photos going to an AI service and notifications through Google and Apple; approval of all legal pages.
7. **Domain, Resend email, Cloudflare connected to Git** (so pushes redeploy the site without zips).
8. **Store feeds and affiliate links**: no offer has a store link yet, so "Visit store" opens nothing.
9. **Google Play** (Android): Play Console account and the signing secrets.
10. **Work through `moretests.md`** (human-style test scenarios; mind its safety rules, the site uses the live database).

### Known issues and notes
- The daily **Import store feeds** run failed once on 2026-10-16 with "fetch failed" (single run; check the next scheduled one).
- Notification icon on Android is still the default placeholder.
- The admin's settings tabs are browser-only (known gap); Google and Apple sign-in are off.
- Bugs found in testing and fixed: damaged saved session crash, Apple/Google buttons shown in the app while off, "Visit store" with no link, unknown category error, long-search overflow, favourites count (see `TEST-RESULTS-EMULATOR.md`).

## In progress (claimed: do not edit)
| Owner | Area | Files / folders claimed | Started | Status |
|---|---|---|---|---|
| devesh1905 (+ Claude session) | Back end, day 1-3 build | `backend/**` (whole folder), `.github/**`, `scripts/**`, `HANDOVER.md`, `remainingthings.md`, `ROADMAP.md`, `BACKEND-PLAN.md`, `CLAUDE.md` | 2026-10-11 | Written and tested offline: schema, seed, catalog loader, feed importer, click function. Live catalog, accounts and admin connected. Alert emails, hosting build, weekly backup workflow and handover document done (2026-10-13); waiting on accounts and secrets, see Queued |
| devesh1905 (+ Claude session) | Data loader in the three apps | `*/assets/data.js`, `*/assets/boot.js`, `*/assets/config.js` (for `web-v2`, `app-v2`, `admin-v2`) and the script tags at the bottom of each `index.html` | 2026-10-11 | Done and tested; hands off |
| devesh1905 (+ Claude session) | Accounts in website, app and admin | `web-v2/v2.js`, `web-v2/v2.css`, `web-v2/assets/account.js`, `app-v2/mobile.js`, `admin-v2/admin.js`, `app-frame/app/assets/data.js` | 2026-10-13 | Website and app done and tested live. Admin code written and tested against the mock (2026-10-13); **needs `0004_admin.sql` run, then a first owner added** (see `backend/README.md`), then a live test. Still demo in the admin: traffic and revenue numbers, feeds page and its "Run now" |
| allenadhitya1718 (+ Claude session) | Keyboard covering fields (app sheets, website dialogs) | `app-v2/mobile.js`, `app-v2/mobile.css`, `*/index.html` viewport line, `web-v2/v2.js`, `web-v2/v2.css`, `android-app/` | 2026-10-16 | Started |
| allenadhitya1718 (+ Claude session) | Account setup with a browser (no domain yet) | Supabase settings and `go` function, GitHub secrets and workflow runs, `clickOutUrl` line in `*/assets/config.js`, ticks in `remainingthings.md` and `ROADMAP.md`. Not touching hosting, domain or Resend until a domain exists | 2026-10-14 | `go` function deployed (JWT off, Confirm email on, advisors read: 0 errors), `clickOutUrl` set in the three configs, `CLICK_SALT` and the four GitHub secrets saved, import workflow green, **Back up database workflow green (run #5, 2026-10-15, 1 artifact)**, second admin (owner) added 2026-10-15, **site live at https://doabno.pages.dev (Cloudflare Pages, direct upload of `node scripts/build-site.js` output; not yet connected to Git, so redeploy by uploading a new `dist` zip)**, `SITE_URL` set in Supabase, Supabase Site URL and redirect URLs point at it. Waiting on a domain: hosting, Resend email, `SITE_URL`, Supabase redirect URLs |

## Queued (waiting on something)
_Older list, kept for detail; the status section above is more recent where they differ._

1. ~~Supabase project~~ **Done 2026-10-13:** project created, schema and seed loaded, counts verified, and the three apps now read the live catalog (`*/assets/config.js`). The live catalog matches the demo data (250 parity checks).
2. Deploy and test the click function (`backend/supabase/functions/go`), set `CLICK_SALT`; run the importer against a real feed (`backend/importer/cli.js`); add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` as GitHub secrets (the daily workflow only runs once merged to `main`).
3. **Run `backend/supabase/migrations/0003_account_functions.sql` in the Supabase SQL Editor** (account deletion and consent saved at sign-up need it). Then: Google and Apple sign-in (buttons show "coming soon" for now); decide whether Supabase "Confirm email" stays on (default on; free plan sends only a few emails per hour).
4. Admin: run `backend/supabase/migrations/0004_admin.sql`, add the first owner (SQL in `backend/README.md`), test live. Traffic and revenue numbers stay generated until real clicks exist.
5. Privacy features (data download, account deletion, consent records).
6. **Needs the owner:** run `backend/supabase/migrations/0005_alerts.sql`; create Cloudflare and Resend accounts and a domain; add the GitHub secrets listed in `HANDOVER.md` section 3; merge `redesign-v2` into `main` when approved (scheduled jobs and the live site build from `main`); set Supabase custom SMTP and redirect URLs.
7. **We run the affiliate applications, feeds and tracking links ourselves; the client only sends information** (company details, authorized signatory, authorization letter, payout details, legal adviser contact and sign-off). See `ClientRequirements.pdf`. Open for us: prepare the authorization-letter template, choose the first stores and networks, submit the applications as soon as the company details arrive.
8. `app-frame/app/assets/data.js` (a separate copy) still uses demo data only; port the loader there when the app wrapper is next touched.

9. **Account setup with a browser:** the next person's Claude Code follows [SETUP-WITH-BROWSER.md](SETUP-WITH-BROWSER.md) (open sign-in tabs, the person logs in, Claude does the settings; secrets and payments stay with the person). Claim a row here before starting.

10. **Testing:** [TESTING-MANUAL.md](TESTING-MANUAL.md) is the full test manual (normal and edge cases for website, app, admin, database, alerts, tracking, importer, hosting). Run it before launch.

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

- Test-bug fixes from the emulator testing (2026-10-16): see Requests below and `TEST-RESULTS-EMULATOR.md`; 60 tests and 250 checks pass.

- App photo and barcode search (2026-10-16): reads the barcode in a photo or from the camera on the phone (no upload) and matches the catalogue GTIN. Bundled reader in `app-v2/assets/vendor/`. Tested on the emulator (28 cases); real phone camera still to test. A vision model (identify a product from a plain photo, no barcode) is optional and not built.

- Photo identification with Gemini (2026-10-16): `backend/supabase/functions/identify/` (logic in `core.mjs`, 11 tests, deploy steps in its README) and the app flow in `app-v2/mobile.js`. Tested with a fake Gemini; **not yet deployed**: needs `npx supabase functions deploy identify` and one real call. Free tier: photos may be used by Google, so add a privacy-policy sentence or move to a paid key before launch.

- App photo search picker (2026-10-16): "Choose a photo" opens the phone's gallery/files picker, "Take a photo" opens the camera, "Scan a barcode" is the live scanner. Tested on the emulator (picker and camera open; both inputs read a barcode picture).

- Photo search fixes (2026-10-16): the identify function finds a working Gemini model by asking Google when the default names are not available (it returned `502 model` on the live key before); error replies carry Google's reason; the app shows the result right under the tiles; gallery icon on "Choose a photo". **The function must be redeployed** (`npx.cmd supabase functions deploy identify --project-ref hmanlftkhvruqgvkencn --no-verify-jwt --use-api` from `backend/`).

- Android app (2026-10-16): `android-app/` Capacitor wrapper and the `Android build` workflow (debug APK always; signed AAB when the signing secrets exist). Tested on the emulator: loads the live catalog, barcode reading, photo picker and camera (after the camera-intent fix). Not on Google Play yet (needs a Play Console account and the signing secrets, see `android-app/README.md`).
- Push notifications (2026-10-16): phone tokens (migration `0010_push_tokens.sql`, **not yet run on the live database**), FCM and APNs senders (`backend/importer/push.js`), alert job sends push beside email, app registration in `app-v2/mobile.js`, plugin in both wrappers; 12 new tests (98 in all). The iOS workflow signs with the Push capability (`push` input, automatic once `APNS_KEY_P8` exists) and Apple accepted that upload. **Android push verified end to end on 2026-10-16** (Firebase set up; the `Push test` workflow delivered a notification to the emulator and the tap carried the product link). Still open: run migration `0010` on the live database, create an Apple push key for iPhone (`APNS_KEY_P8`, `APNS_KEY_ID`), then test with a real account: `docs/push-notifications.md`.

## Not planned for the first 3 days
Next.js rebuild for Google, native app, extra Gulf markets, hourly refresh. See `BACKEND-PLAN.md`.

## Requests for the owner of a claimed area
_(add a line: who, what you need, which file)_
- allenadhitya1718 -> owner of `*/` frontends: the pages answer `/favicon.ico` with 404 (cosmetic, shows in the console). Please add a favicon (the brand app icon in `web-v2/assets/brand/` can be reused) to `web-v2`, `app-v2` and `admin-v2` root, or a `<link rel="icon">`.
- allenadhitya1718 -> owner of `.github/**`: GitHub warns that `actions/upload-artifact@v4` runs on Node 20 and that `ubuntu-latest` becomes Ubuntu 26 on 2026-10-19. The backup still passes; bump the action version when convenient.
- allenadhitya1718 -> owner of `backend/**`: `backend/supabase/functions/go/index.ts` returns 500 for an unknown, paused or link-less offer when `SITE_URL` is not set, because `Response.redirect("/")` needs a full address. A live hotfix is deployed (2026-10-15): `const SITE = ... ?? ""` plus `home()` that redirects only when `SITE` starts with http(s), else answers 404 "Link not available". Please copy that into the repo file so the next deploy does not undo it.

- **2026-10-16 (resolved)** Bugs from the emulator testing in `web-v2/v2.js`, `web-v2/assets/account.js` (and the app and admin copies), `app-v2/mobile.js` were fixed in one pass at the repo owner's request: damaged saved session crash, Apple/Google buttons in the app when off, "Visit store" with no link, `#/c/nope` error, long-search overflow, favorites count. Still open: the legal notice placeholders (needs company details and the adviser's approval). Details and re-test results: `TEST-RESULTS-EMULATOR.md`.
