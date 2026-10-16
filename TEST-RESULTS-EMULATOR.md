# Emulator test results (TESTING-MANUAL.md)

Run 2026-10-16 on the Android emulator `Resizable_Experimental` (Android 37.2, Chrome, 411x806 CSS px, 1080x2400), **Live mode** (committed `config.js`, real Supabase catalog), website served from `serve-v2.py` on 127.0.0.1:5174 through `adb reverse`. Driven through Chrome's debug connection, so each row below is a measured result, not a guess.

What could **not** be done on the emulator is in [TEST-NOT-POSSIBLE-ON-EMULATOR.md](TEST-NOT-POSSIBLE-ON-EMULATOR.md).

**Source tested:** branch `redesign-v2` at `d1defc0` (the manual's commit). Not tested: `main` (it has 68 newer commits, including the stored-XSS fix on the admin privacy page).

## Summary
| | Count |
|---|---|
| Automated tests (`cd backend && npm test`) | 60 pass, 0 fail; parity 250 checks pass |
| Failures found | 9 (3 P1 including the imprint placeholder); the "Fix later" list below has them all |
| Passed on the emulator | see tables |

## Status after the fix pass (2026-10-16)
Fixed and re-tested on the emulator: failures **1, 3, 4, 5, 7, 8**. Failure **2 was withdrawn**: it came from my test changing only the `#` part of the address, which does not reload the page; on a real page load the code clears the address bar, stays signed out and shows "This link has expired or was already used". Failure **9 is by design**: the top menu is hidden below 820 px and the bottom tab bar replaces it. Not changed: failure 6 (legal notice needs the company's details and the adviser's approval). Fix details are in the table below.

| Failure | Fix | Re-test |
|---|---|---|
| 1 | `account.js` (website, app, admin copies) drops a stored session that is not the expected shape; `refreshAccountBtn` checks the name | `"x"`, `{"access_token":123}` now load signed out and the bad value is removed; `{`, `null` still fine; admin also fine |
| 3 | App Profile shows Apple/Google only for providers in `socialLogin` | Only "Continue with email" shows |
| 4 | `paintListing` returns when the page has no results area | `#/c/nope` no exception, both from another page and on direct load |
| 5, 8 | Wrapping rules in `web-v2/v2.css` and `app-v2/mobile.css` | 5,000 / 3,000 character search: no sideways scroll |
| 7 | With the live catalog, a "Visit store" with no link says "The store link for {store} is not available yet." (English and Arabic, website and app); the "(demo)" message stays in demo mode | Website English and Arabic and app Arabic toasts checked |
| header count | Counts each existing product once | 200 saved ids (100 duplicates, 100 unknown) now show 1 |

Re-run after the fixes: `npm test` 60 pass, 250 checks pass; website hostile-string search (0 alerts, none injected); all 20 products in the app and 6 other app routes, no problems.

## Failures found in the first pass (record with section 17 template if filing)

| # | Test ID | Sev | What happens | Steps |
|---|---|---|---|---|
| 1 | A-SS-2 | **P1** | A damaged saved session crashes the whole website to an almost empty page. Expected: loads signed out. `"x"` and `{"access_token":123}` in `localStorage['doabno.auth']` throw `TypeError: Cannot read properties of undefined (reading 'split')` at `refreshAccountBtn` (`web-v2/v2.js:463`, called from `applyLang` → `init`). `{` and `null` are handled fine. | Set `doabno.auth` to `"x"`, reload `/` |
| 2 | A-LK-2 / E-ROUTE-5 | **P1** | An email-link address with a wrong token (`#access_token=abc.def.ghi&…&type=signup`) shows "Product not found", leaves the token in the address bar, and shows no "link invalid" message. Expected: friendly invalid-link message, clean address bar, not signed in. (Not signed in: correct.) | Open `/#access_token=abc.def.ghi&refresh_token=xyz&expires_in=3600&token_type=bearer&type=signup` |
| 3 | A-SO-1 | P2 | In the app (`/app/`), Profile tab, signed out, **"Continue with Apple" and "Continue with Google" buttons are visible** although `socialLogin` is `[]` in every `config.js`. Manual says none should show when it is empty (the website sign-in dialog correctly shows none). | `/app/` → Start → Profile |
| 4 | E-ROUTE-1 | P3 | `#/c/nope` (unknown category) shows "Product not found" but also throws `TypeError: Cannot set properties of null (setting 'innerHTML')` at `paintListing` (`v2.js:891`, from `route`). Page recovers. | Open `/#/c/nope` |
| 5 | E-SRCH-2 | P3 | A 5,000-character search makes the page scroll sideways (page is wider than the screen; the heading does not wrap). Page stays usable. | Open `/#/search?q=` + 5,000 × `A` |
| 6 | W-LEG-5 | P1 for launch | `#/legal/imprint` still contains `[to be completed]` three times (company details). Other legal pages have no placeholder markers; whether their wording is approved is the legal adviser's call. | Open `/#/legal/imprint` |

### More failures found in the second pass
| # | Test ID | Sev | What happens |
|---|---|---|---|
| 7 | C-3 / W-PROD-3 / APP-12 | P2 | **"Visit store" does nothing in Live mode.** All 355 offers in the live catalog have `url: null` (no store links yet). Clicking shows the toast "Opening noon through a tracked partner link… (demo)" (app: Arabic equivalent) and nothing opens. The button is not disabled and the toast says "(demo)" even in Live mode. Expected until affiliate links exist, but the button should be disabled or say "link coming soon" rather than pretend to open a store. |
| 8 | APP-11 / E-SRCH-2 | P3 | App: a 3,000-character search also makes the screen scroll sideways (same cause as failure 5). |
| 9 | W-HOME-4 | P3 | On a phone-width screen the header "Categories" button has zero size (not visible), so the category mega-menu cannot be opened. Categories are still reachable from the home page circles and the app, but the manual expects the menu. Desktop width was not tested here. |

## Fix later (all failures in one list)
1. **P1** `web-v2/v2.js:463` `refreshAccountBtn`: a stored session that is valid JSON but the wrong shape (`"x"`, `{"access_token":123}`) crashes the whole page. Check the shape before using it, and drop the stored value if wrong (failure 1). Check the same in `app-v2` and `admin-v2` (not tested).
2. **P1** Email link with a bad or truncated token: show "link invalid / expired", remove the token from the address bar, do not show "Product not found" (failure 2).
3. **P1 (launch)** `#/legal/imprint` has `[to be completed]` three times; legal wording needs adviser approval (failure 6).
4. P2 App profile shows Apple/Google buttons although `socialLogin` is empty (failure 3).
5. P2 "Visit store" with no link: disable or label it; remove "(demo)" wording in Live mode (failure 7).
6. P3 `#/c/nope` throws in `paintListing` (`v2.js:891`) (failure 4).
7. P3 Very long search text overflows sideways on website and app (failures 5 and 8): wrap the heading text.
8. P3 Categories menu button has no size at phone width (failure 9).
9. P3 Header favorites count counts stale and duplicate ids.
10. Review: silent fall back to demo prices when Supabase is unreachable; CSP `script-src 'unsafe-inline'`; `robots.txt` also blocks `/app/`; favicon requests to `t3.gstatic.com`.

## Observations (not failures, but you should know)
- **PERF-4:** with `*.supabase.co` blocked the site silently falls back to **demo data** (same prices, no "could not load" notice). The manual allows this; for production, silently showing demo prices to shoppers may not be wanted.
- **PERF-2:** with a Slow-3G-like throttle (400 ms latency, ~50 KB/s) product cards appeared after about **11.8 s** (PRD target about 7 s). The emulator is not a stand-in for a real network; recheck on a real phone.
- **Data freshness:** product pages say "Checked ~4,840 min ago" (about 3.4 days) with a warning mark, because no feed has run. Expected until feeds go live.
- Sort menu has Relevance, Lowest price, Biggest drop, Top rated on search; the Deals page also has "Most popular". The manual lists "Most popular" for search too.
- Catalog has 20 products in total, so "Show more" never appears (W-FILT-6: first page of 20, no duplicates).
- Every page requests favicons from `t3.gstatic.com`; some return 404 (e.g. virginmegastore.sa, saco.com.sa). Harmless, but it is a third-party request (note for the privacy policy and CSP; it is allowed in `scripts/build-site.js`).
- `dist/_headers` CSP allows `script-src 'unsafe-inline'`, which weakens protection against injected scripts. `robots.txt` also disallows `/app/` (manual SEC-5 says only `/admin/`).
- Favorites count in the header counts every saved id, including ones whose product no longer exists or duplicates (200 saved ids showed "200" in the header but 100 products on the page; ids were made up for the test).

## Passed (emulator, Live mode)

### Smoke / website
| ID | Result |
|---|---|
| S1 | Home loads, products and prices show, no Console errors |
| S2 | `/app/` and `/admin/` load; admin shows sign-in only (no data) |
| S3 | Search "sony" returns results |
| S4 (partly) | Product page: offers sorted by total (noon 1,413 < Amazon 1,440 < Virgin 1,469 < Carrefour 1,480 < eXtra 1,500), best-price tag, coupon code shown, price history block with Highest / Current / Lowest, JSON-LD present, title set |
| S5 | Arabic switches `lang=ar dir=rtl`, text translated, no sideways scroll |
| W-HOME-1 | Home content present |
| W-SRCH-2/6/7 | Results page with `?q=` heading; sort order Lowest price non-decreasing (96.99, 107, 137, 183, 224); nonsense query shows no-results page, no error |
| W-FILT-1/2/5 | Store filter 20→16; plus brand Sony → 2; Clear all → 20 |
| W-FILT-3 | Price min/max respected; min>max → 0 results with a hint; `-5` / `abc` ignored; `1e3` min works; huge value → 0; no `NaN` anywhere |
| W-FILT-4 | Free delivery 20→19; In stock 20→19 |
| W-PROD-8 | Unknown product id shows "Product not found" with Home link |
| W-LOC-1 | Arabic product page: right-to-left, prices as "1,413 ر.س", "Sony" and "noon" stay Latin (brand and store names) |
| W-LOC-2 | Market UAE: currency switches to AED, 4 stores, prices change |
| W-LOC-3 | SAR 1,413 → AED 1,384 → USD $377 → GBP £298 → back to SAR 1,413 exactly (no drift) |
| W-LOC-4 | Market and currency persist after reload |
| W-LEG-1 | All 10 footer pages open with a heading, no sideways scroll, no Console errors |
| W-LEG-3 | Cookie banner shows on a fresh browser; "Essential only" closes it and stores `"essential"`; stays closed after reload |
| W-COUP-1 | Coupons page: category chips, code, "Copy code", "Expires in N days" |
| W-DEAL-1 | Deals page lists price drops (Nespresso −28%, etc.) |
| W-FAV-2 | Favorite from product page → header count 1, saved in `doabno2.favs`, survives reload; Favorites page lists them |
| W-ALD-7 | Not signed in: "Set price alert" opens the sign-in dialog first |

### Edge cases
| ID | Result |
|---|---|
| E-SRCH-3/4/5/6/7 | `<script>`, `<img onerror>`, `"><svg onload>`, `' OR 1=1 --`, `%_q;--)(*[`, `{{7*7}}`, Arabic with digits, emoji and RTL-override characters: **no alert ever fired, no element injected**, shown as plain text in the heading; no layout break |
| E-SRCH-1 | Empty and spaces-only search show all products, no error |
| E-SRCH-8 | Broken percent-encoding (`%E0%A4%A`) loads a results page, no crash |
| E-ROUTE-1 | `#/xyz`, `#/p/`, `#/legal/nope`, `#/p/does-not-exist` → "Product not found" page (see failure 4 for `#/c/nope`) |
| E-ROUTE-3 | Back and forward through five pages lands on the right pages |
| A-SS-2 | `doabno.auth` = `{` or `null`: loads signed out (see failure 1 for the other two) |
| A-SU-6/7 (client side) | Invalid addresses (`abc`, `@x.com`, `a@b.`), blank fields, 8 spaces, 7-char password: **no request is sent** (checked by watching `fetch`); nothing created. No on-screen message was seen in these runs (I only looked for common error element names, so this is not proof there is none) |
| E-NUM-1/2 | Min>max, negative and text prices handled, no `NaN` |
| Y-4 | 200 saved ids: page loads in under 3 s, no errors |

### Resilience, layout, accessibility
| ID | Result |
|---|---|
| PERF-5 | Offline after first load: already-loaded pages still navigate |
| COMPAT | Width 360, 390, 768 and 1024 px on home, product, search and a legal page: no sideways scroll (emulated through Chrome, same phone) |
| ACC (quick) | Product page: 0 images without `alt`, 0 buttons/links without a name, 0 inputs without a label, one `h1`, `lang` set |
| APP-2/3 (partly) | `/app/` welcome → home → Search, Deals, Saved, Profile, Home tabs all load, Arabic right-to-left, no `NaN`, no sideways scroll; same prices as website (iPhone 17 Pro 3,914) |

### Second pass (emulator)
| ID | Result |
|---|---|
| W-LOC-5 sweep | All 20 products opened in all 4 markets (80 pages) and 6 list pages in each market: no `NaN`, `undefined`, price of 0, "not found", sideways scroll or Console errors (except the favicon 404s) |
| Catalog data quality (from `get_catalog`) | 355 offers: no price ≤ 0, no `was` below price, no negative shipping, no `daysMin` > `daysMax`, no duplicate offers, no orphan store or product, every offer's currency matches its market, 80 history series (88 to 90 points, none ≤ 0), no expired coupon, every product has offers in every market. **Only gap: every `url` is null** (failure 7) |
| W-HOME-4 | All 26 menu links open real pages (no "not found"); menu closes on Escape |
| W-PROD-2 | 30 / 90 day buttons work; the stats match the data (high 1,784.35, low 1,413 in both windows) |
| W-COUP-1/2/3 | Category chips filter; "Home & Kitchen" shows "No coupons in this category yet"; Copy code puts `DOAB10` in the clipboard and shows "Code DOAB10 copied" |
| E-SRCH-9 | Rapid typing then clearing: final state is the empty box with recent and popular lists, no stale results |
| E-SRCH-10 | 30 identical searches plus 12 different ones: recents keeps 6, no duplicates, newest first |
| ACC-5 | Reduced-motion setting: no endless animations running, and the stylesheet has a reduced-motion rule |
| ACC-6 | Inconclusive: the viewport override did not go below about 340 px wide; text size at 200%: no sideways scroll |
| APP-2/3/7/10/11 | All 29 app routes (home, search, categories, deals, five category pages, saved, alerts, profile, bad routes, all 20 products) load with no `NaN`, no sideways scroll, no Console errors; hostile strings not executed (0 alerts); app in English has zero Arabic left over on 6 screens; offline after first load still opens deals, a product and saved |
| APP markets | Switching country in the app: UAE AED 1,346.00, USA 356.99, UK 315.99, Saudi SAR 1,413.00 (same numbers as the website for UAE and Saudi) |
| APP-6 | Landscape rotation: app fits (914 x 327 CSS px), no sideways scroll, tab bar stays at the bottom; content area is small because the browser bars take space |
| APP-8 | Not verifiable: the emulator's on-screen keyboard did not open (hardware-keyboard setting); the sign-in sheet itself renders correctly with a focused email field |
| A-SO-1 (app) | See failure 3 |

### Database (anonymous key only, read requests plus refused writes)
| ID | Result |
|---|---|
| DB-1/2 | `GET` on `profiles`, `favorites`, `alerts`, `privacy_requests`, `admins`, `clicks`, `audit_log` with the publishable key returns `[]` |
| DB-3 | `get_catalog` returns: rates, offers, stores, coupons, history, markets, popular, products, categories, currencies. Products carry `status`; **no cost/partner fields seen**. (Not checked: whether admin-hidden products are absent, needs an admin to hide one.) |
| DB-4 | Anonymous `POST` to `products` and `stores` → 401 permission denied. `coupons` → 400 identity-column error (a parse-time error, so it does **not** prove the permission was denied; see not-possible file) |
| DB-8/10 | `rpc/admin_list_users` and `rpc/alerts_to_check` → 401 permission denied. `admin_delete_user`, `admin_export_user`, `admin_add_member`, `set_popular_searches` → **404 "function not found"** with an empty argument object. This may only mean the argument names differ (PostgREST matches by argument names) or that migration `0007` is not applied on the live project; it does not prove they are protected. Needs a check against the migration files with the owner |
| SEC-1/5 (local build file) | `dist/_headers` has CSP, nosniff, referrer policy, frame protection; `robots.txt` disallows `/admin/` |
| DB-12 | Search of `web-v2`, `app-v2`, `admin-v2` for `service_role`, `sb_secret_`, JWT-looking keys: only the two warning comments ("never put a service_role key here") |

## Not run on purpose
Anything that would **write to the live Supabase project** (creating accounts, privacy requests, alert dialog submit, write probes). An attempt to send delete requests with filters matching nothing was stopped by the tool's safety check; I agree with that stop. These need a throwaway project. See the other file.

## Loose ends from this session
- Python server `serve-v2.py` may still be running on port 5174 (started in the background) and an `adb reverse` for 5174 is active.
- Chrome on the emulator has the test pages open.
- Nothing was committed or pushed. New files only: this file and `TEST-NOT-POSSIBLE-ON-EMULATOR.md`.

## App photo and barcode search (added 2026-10-16)
The "Search by photo or barcode" sheet used to be a placeholder: a photo was never analysed (it matched words in the file name, or showed the three most popular products). It now reads the **barcode** in the picture, on the phone, and matches it to the product's GTIN (the barcode number in the catalogue). Reader: the phone's own BarcodeDetector when it exists, otherwise the bundled ZXing library (`app-v2/assets/vendor/zxing.min.js`, @zxing/library 0.21.3, Apache-2.0, loaded only when needed). The sample buttons now show and search the catalogue barcode.

Tested on the emulator by feeding generated EAN-13 pictures to the photo input, with the phone's reader (native) and with ZXing only (as on iPhone and desktop), on the dev server and on the production build (security policy allows the library: no violations). 14 of 14 cases pass in each mode:
clean barcode for four different products; very large (3,200 px) and very small (190 px) pictures; noisy; turned 90°, 270°, 180°; tilted 12°; a valid barcode that is not in the catalogue (message "Barcode … was read, but we don't have this product yet"); a photo with no barcode (message asking for a closer, sharper photo); a barcode with a wrong check digit (not read); the sample button. Read time was about 0.3 to 0.8 seconds each.

Not tested here: the live camera (the emulator has no camera available to the page; the app shows its "camera isn't available" message), and real photos of real product boxes (lighting, curved packaging, glare). These need a real phone; see `TEST-NOT-POSSIBLE-ON-EMULATOR.md`.

## Photo identification with Gemini (added 2026-10-16)
New function `backend/supabase/functions/identify` (see its README for deploy steps). The app uses it only when a photo has no readable barcode.

- **Automated:** 11 new tests (`backend/tests/identify.test.js`, fake Gemini): the key is sent in a header and never appears in an address or reply; the photo and the key are never in the response; answers are cleaned (tags removed, long text cut, odd category or confidence fixed); wrong or missing public key, wrong method, bad JSON, wrong picture type, too small or too large images are refused before Gemini is called; preflight works; missing secret gives "not configured"; per-visitor and overall limits; Gemini errors (busy, bad key, missing model, no quota on the first model, error, network down); a command written inside the photo cannot change the reply. Whole suite: 71 tests pass, 250 checks pass.
- **Emulator, app against the real function code with a fake Gemini, in both barcode-reader modes:** product photo without barcode finds Sony headphones; jeans find the Levi's; a product not in the catalogue shows "looks like Bosch Cordless Drill, we don't have it yet" with a search link; "nothing recognisable" shows the no-barcode message; Gemini busy, error and wrong-key each show a clear message; a slow 3-second answer still works; a photo that has a barcode sends nothing anywhere; an unreachable function and demo mode (no server) both fall back to the no-barcode message. 11 of 11 pass.
- **Not tested:** the real Gemini (the key is stored in Supabase and I cannot reach the project from here), so the model names and the free-tier limits are unconfirmed until the function is deployed and called once. Accuracy on real photos is also unknown.

## Photo search picker (added 2026-10-16)
The photo input used to force the camera (`capture`), so a photo could not be chosen from the gallery. The sheet now has **Choose a photo** (the phone's own picker: gallery and files), **Take a photo** (camera) and **Scan a barcode** (live scanner). Checked on the emulator by tapping: the Android photo picker opens showing the gallery pictures, and the camera app opens from the second button; both inputs read a barcode picture and can be used twice in a row with the same picture. Barcode (14) and identify (11) emulator cases still pass. Not tested: a real phone's picker and camera.

## Photo search: live function check and fixes (added 2026-10-16)
- The deployed function answers: preflight 204, a missing key gets 401. With a real photo and the live key it returned **`502 model`**: Google rejected all three default model names, so photo identification could not work yet. Fixed in code (the function now asks Google for the models the key may use and tries them; replies carry Google's reason); **needs a redeploy**. 13 function tests now (73 in all, 250 checks).
- On the emulator, "Choose a photo" worked, but Android's picker needs **Done** to be pressed after picking, and the result appeared at the bottom of the sheet, out of sight, so it looked broken. The result area now sits directly under the tiles and scrolls into view. "Choose a photo" has a gallery icon (the camera icon stays on "Take a photo").
- Not tested: real Gemini answers (waiting for the redeploy).
