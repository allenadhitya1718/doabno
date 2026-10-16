# DOABNO testing manual

Written 2026-10-16. For whoever tests the site before launch (a person, or a Claude Code session driving a browser). It covers the website, the mobile-app prototype, the admin portal, the database, email alerts, click tracking, the feed importer, hosting and security, with the odd and hostile cases included.

**How to read a test row:** *Steps* are what you do. *Expected* is what must happen. If the result differs, it is a bug: record it with the template in section 17. Tick the box when it passes.

**Priority tags:** **P1** must pass before launch · **P2** should pass · **P3** polish.

Companion files: `remainingthings.md` (setup), `HANDOVER.md` (how it works), `backend/README.md` (database), `PRD-CHECKLIST.md` (requirements). The automated tests are in section 15.

---

## 0. Before you start

### 0.1 What is being tested
| Part | Address (local) | Address (hosted) |
|---|---|---|
| Website | http://127.0.0.1:5174 | `https://<domain>/` |
| Mobile app prototype | http://127.0.0.1:5175 | `https://<domain>/app/` |
| Admin portal | http://127.0.0.1:5177 | `https://<domain>/admin/` |

Use `127.0.0.1`, not `localhost` (some browsers resolve `localhost` to IPv6 and get "refused to connect"). Local servers start from `.claude/launch.json` (preview tools) or `python serve-v2.py`. The hosted build is made by `node scripts/build-site.js` and served locally by `node scripts/serve-dist.js` (port 5190).

### 0.2 Two modes, test both
| Mode | How | What it means |
|---|---|---|
| **Demo** | `supabaseUrl` and `anonKey` empty in `*/assets/config.js` | Built-in demo data, everything saved in the browser only. No accounts. |
| **Live** | URL and key filled (the committed default) | Real catalog from Supabase, real accounts, real saved data, real admin. |

Do the whole manual in **Live** mode. Do sections 2, 3 and 8 quickly in **Demo** mode too, because the fallback must keep working.

### 0.3 Test data you need
- **Three test shoppers:** `tester1+doabno@<your mail>`, `tester2+doabno@…`, `tester3+doabno@…` (plus-addressing lands in one inbox). Password for all: a long throwaway one kept in the team password manager.
- **Four admin test users**, one per role (owner, catalog, partners, analyst), added in Admin, Settings, Team (each signs up on the website first).
- **A throwaway Supabase project** for destructive tests (restore, `reset-dev.sql`, bulk deletes). Never run those on the live project.
- **Hostile strings** to paste into every text box (section 3.3).
- **Browsers:** current Chrome/Brave, Firefox, Safari (Mac or iPhone), Edge; plus a real Android phone and a real iPhone.
- **Tools:** browser dev tools (Console, Network, Application → Local Storage), `curl`, a second browser profile (for a second user), network throttling (Slow 3G, Offline).

### 0.4 Reset between runs
Local data lives in browser storage. To start clean: dev tools → Application → Clear site data (for the website, app and admin separately; each has its own storage). Keys: `doabno.auth` (session). Signing out then in again should restore saved data from the database, not from the browser.

### 0.5 Evidence
For every failure keep: a screenshot, the page address, browser and size, the time, the account used, and any red text from the Console or the Network tab (status code and response body, never an API key).

---

## 1. Smoke test (15 minutes, run after every deploy)

| # | Check | Expected | Pass |
|---|---|---|---|
| S1 | Open `/` | Home loads in under 3 s on broadband, no red Console errors, products show with prices | ☐ |
| S2 | Open `/app/` and `/admin/` | Both load; admin shows its sign-in | ☐ |
| S3 | Search "sony" | Results list, sorted by relevance | ☐ |
| S4 | Open a product | Offers sorted by total price, price history chart draws | ☐ |
| S5 | Switch language to Arabic | Page flips to right-to-left, text is Arabic, nothing overlaps | ☐ |
| S6 | Sign up with a new test email | Confirmation email arrives; link signs you in on the site | ☐ |
| S7 | Add a favorite, set an alert, sign out, sign in | Both are still there | ☐ |
| S8 | Sign in to `/admin/` as owner | Dashboard loads; no "Access denied" | ☐ |
| S9 | Click "Visit store" on an offer with a link | Lands on the store; a click appears in the admin (after a refresh) | ☐ |
| S10 | `cd backend && npm test` | All tests pass | ☐ |

---

## 2. Website: normal behaviour

### 2.1 Home (`#/`) **P1**
| ID | Steps | Expected |
|---|---|---|
| W-HOME-1 | Load the page, wait 5 s | Hero with search, animated price graphic, category circles, price drops, stores, brands, app banner, About panel, footer |
| W-HOME-2 | Click each category circle, store tile, brand tile, "Try:" chips | Each opens the matching list or search, never a blank page |
| W-HOME-3 | Hover and press buttons and cards | Smooth effects; nothing jumps; no text turns unreadable |
| W-HOME-4 | Open the category mega-menu (header) | Every category and sub-category links to a real list; closes on Escape and on outside click |
| W-HOME-5 | Reload while on a deep link such as `#/p/<id>` | The same page reloads, not the home page |

### 2.2 Search (`#/search?q=…`) **P1**
| ID | Steps | Expected |
|---|---|---|
| W-SRCH-1 | Type 2 letters in the header box | Suggestions drop down: products, brands, stores; "Search for …" is the last row |
| W-SRCH-2 | Press Enter with text | Results page; the text stays in the box; the address holds `?q=` (copy it into a new tab: same results) |
| W-SRCH-3 | Open the box with nothing typed | Recent searches and popular searches show |
| W-SRCH-4 | Search for an Arabic name, then its English name | Both find the product (names exist in both languages) |
| W-SRCH-5 | Search a brand ("Sony"), a store name ("noon"), a model number | Brand and store searches return matching products; model number finds the exact product |
| W-SRCH-6 | Sort: Relevance, Most popular, Lowest price, Biggest drop, Top rated | Order changes accordingly; "Lowest price" is non-decreasing by best total price |
| W-SRCH-7 | Search for nonsense (`zzzzqqq`) | Friendly "no results" message with a way back; no error, no blank page |

### 2.3 Filters and lists **P1**
| ID | Steps | Expected |
|---|---|---|
| W-FILT-1 | Tick a store | Only products with an offer from that store; counts beside each option match the results |
| W-FILT-2 | Tick two brands | Products of either brand (OR within a group); combining with a store narrows (AND between groups) |
| W-FILT-3 | Min and max price | List respects both, in the **selected currency**; change currency and the same numbers apply to the new currency |
| W-FILT-4 | "Free delivery" and "In stock" switches | Only matching products; removing them restores the list |
| W-FILT-5 | "Clear filters" | Everything resets; the chosen sort stays |
| W-FILT-6 | "Show more" / paging (20 at a time) | Next items append; no duplicates; the count text is right |
| W-FILT-7 | Open a category, then a sub-category | Breadcrumbs correct (Home / Category / Sub); each crumb is a working link |

### 2.4 Product page (`#/p/<id>`) **P1**
| ID | Steps | Expected |
|---|---|---|
| W-PROD-1 | Read the offer table | Sorted by total (price + delivery); best offer marked; each row shows store, price, delivery cost and time, stock, "verified N min ago" |
| W-PROD-2 | Price history 30 / 90 days | Chart redraws; highest, current, lowest values match the chart |
| W-PROD-3 | "Visit store" on an offer | Opens the store in a new tab through the click function; affiliate disclosure is visible nearby |
| W-PROD-4 | Offer that is out of stock | Marked clearly and not shown as the best price |
| W-PROD-5 | Coupon on an offer | Code displays; copy button copies it; expiry shown |
| W-PROD-6 | Similar products block | Links open other real products; never links to itself |
| W-PROD-7 | Favorite (heart) and Alert (bell) | Heart fills and counts update in the header; bell opens the alert dialog (section 2.7) |
| W-PROD-8 | Unknown id (`#/p/does-not-exist`) | "Product not found" with a link home; no crash |
| W-PROD-9 | Product hidden by an admin | Not listed, and its address shows "not found" (after a refresh) |
| W-PROD-10 | Page title, description, canonical | Browser tab title is the product; view source of the rendered DOM shows product structured data (JSON-LD) |

### 2.5 Deals and coupons **P2**
| ID | Steps | Expected |
|---|---|---|
| W-DEAL-1 | Open Deals | Products with price drops, biggest first; each shows the drop |
| W-COUP-1 | Open Coupons, then each category chip | List filters; each card shows store, code, expiry ("expires today" for 0 days) |
| W-COUP-2 | Copy a code | Clipboard holds the code; a confirmation shows; no error if the clipboard is blocked (the code stays selectable) |
| W-COUP-3 | Category with no coupons | Empty-state message, not a blank area |

### 2.6 Favorites and Alerts pages **P1**
| ID | Steps | Expected |
|---|---|---|
| W-FAV-1 | Favorites with none | Friendly empty state with a "Browse deals" button |
| W-FAV-2 | Add 3, remove 1 | Counts in header and page agree at every step |
| W-ALR-1 | Alerts page | Each card: product, target, current best, gap ("↓ SAR 40"), "Reached target" when the price is at or below target |
| W-ALR-2 | Remove an alert | Disappears at once and stays gone after reload |

### 2.7 The alert dialog (set a target price) **P1**
| ID | Steps | Expected |
|---|---|---|
| W-ALD-1 | Target below the current best, email consent ticked | Saved; toast confirms; appears on the Alerts page |
| W-ALD-2 | Target **at or above** the current price | Either refused with a clear message or saved as "already reached"; never a silent bad state (record which) |
| W-ALD-3 | Target empty, 0, negative, letters, `1e9`, `0.001`, 99999999999 | Each is refused with a message or clamped sensibly; nothing is saved; no `NaN` anywhere |
| W-ALD-4 | Consent box not ticked | The alert saves on the page, but **no email is ever sent** (checked in 6.2) |
| W-ALD-5 | Edit the target of an existing alert | Replaces the old value; no duplicate card |
| W-ALD-6 | Set the same alert twice quickly (double-click Save) | One alert only |
| W-ALD-7 | Not signed in | Either the sign-in dialog opens first, or the alert is kept locally and syncs after sign-in (record which); it must not be lost |

### 2.8 Language, market, currency **P1**
| ID | Steps | Expected |
|---|---|---|
| W-LOC-1 | English ⇄ Arabic | All visible text changes; layout mirrors; numbers, prices and dates stay legible; no English left in Arabic mode except brand and product names |
| W-LOC-2 | Switch market (Saudi, UAE, US, UK) | Stores, products, default currency and delivery text change; other Gulf markets are marked "Soon" and cannot be chosen into an empty state |
| W-LOC-3 | Switch currency (SAR, AED, USD, GBP) | Every price converts, including filters, alert targets and the history chart axis; switching back restores exact original numbers (no drift) |
| W-LOC-4 | Reload after each change | Choices persist |
| W-LOC-5 | Market with no offers for a product | Product shows "not available in this market" or is hidden; never a price of 0 or `NaN` |
| W-LOC-6 | Arabic with long product names and a narrow phone | No overlap, no horizontal page scroll |

### 2.9 Static and legal pages **P1**
| ID | Steps | Expected |
|---|---|---|
| W-LEG-1 | Open every footer link: Privacy, Terms, Disclaimer, Prices, Cookies, Accessibility, Imprint, CCPA, Cookie settings, About | Each opens with a table of contents and a working in-page jump; both languages |
| W-LEG-2 | CCPA page toggle | The "do not sell or share" choice saves and is remembered |
| W-LEG-3 | Cookie banner on a fresh browser | Shows once; Accept / Reject both close it and are remembered; the footer "Cookie settings" reopens it; non-essential items are off until accepted |
| W-LEG-4 | Affiliate disclosure | A sentence is visible in the footer and near "Visit store" |
| W-LEG-5 | Placeholder text | Legal pages are **placeholders until the legal adviser approves**: this test fails for launch while placeholder text remains |

---

## 3. Website: edge cases and hostile input

### 3.1 Search input
| ID | Input | Expected |
|---|---|---|
| E-SRCH-1 | Empty, or only spaces | No error; popular/recent list or all products; no request storm |
| E-SRCH-2 | 5,000 characters pasted | No freeze; either truncated or "no results"; page still usable |
| E-SRCH-3 | `%`, `_`, `\`, `'`, `"`, `;`, `--`, `)(`, `[`, `*` | No error, no crash; behaves as normal text |
| E-SRCH-4 | `' OR 1=1 --` and `"; DROP TABLE products; --` | Plain "no results" (or harmless matches); database untouched |
| E-SRCH-5 | `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `"><svg onload=alert(1)>` | **Shown as text, never executed**, in the box, in "Search for …", in recent searches, in the results heading, in the address bar and after reload |
| E-SRCH-6 | Emoji, accented letters, mixed Arabic and English, Arabic digits `٣٤٥`, Arabic with diacritics | Does not break; Arabic digits and Latin digits find the same model number if supported (record behaviour) |
| E-SRCH-7 | Right-to-left override characters, zero-width characters | Page layout is not hijacked; results still sensible |
| E-SRCH-8 | `#/search?q=%E0%A4%A` (broken percent-encoding) | No crash; the page loads with a safe fallback |
| E-SRCH-9 | Type very fast, then clear | The last typed text wins; late answers never overwrite the final state |
| E-SRCH-10 | Same search 30 times | Recent searches keep a short list without duplicates |

### 3.2 Routes and addresses
| ID | Input | Expected |
|---|---|---|
| E-ROUTE-1 | `#/`, `#/xyz`, `#/p/`, `#/c/nope`, `#/c/electronics/nope`, `#/legal/nope` | Home or a friendly "not found"; never a blank screen or stack trace |
| E-ROUTE-2 | `#/p/<id>?x=<script>`, extra slashes, upper-case ids | Safe; ignored or "not found" |
| E-ROUTE-3 | Back and forward through 10 pages | Each step restores that page and its scroll/filters |
| E-ROUTE-4 | Open the same product in two tabs, favorite in one | The other tab is correct after a refresh (live) and never crashes |
| E-ROUTE-5 | Open the site with an old-style email link fragment (`#access_token=…`) | Lands signed in (see 4.5); the tokens vanish from the address bar and are not stored anywhere else |

### 3.3 Hostile strings for every text box
Paste each into: name, email, password (sign-up), search, alert target, privacy-request name and details, coupon/store/product names in the admin, team email.
- `<script>alert(1)</script>`
- `"><img src=x onerror=alert(1)>`
- `javascript:alert(1)`
- `{{7*7}}` and `${7*7}`
- `'; DROP TABLE profiles; --`
- 10,000 × `A`
- `\u0000` and `%00`
- `  leading and trailing spaces  `
- `Ωmega Ünïcode 😀 مرحبا`

**Expected for all:** shown as plain text or refused; no alert box, no layout break, no database error; nothing is executed in any other screen that later displays it (admin lists, drawers, privacy-request pages, emails, CSV export).

### 3.4 Prices and numbers
| ID | Steps | Expected |
|---|---|---|
| E-NUM-1 | Min filter greater than max | Empty result with a hint, or the two are swapped; no error |
| E-NUM-2 | Negative, decimal (`19.99`), `1e3`, very large, blank | Handled; decimals accepted; nothing becomes `NaN` |
| E-NUM-3 | A product priced under 1 (cents), over 1,000,000, price with 3 decimals (KWD-style) | Formatted correctly for the currency; no rounding to 0 |
| E-NUM-4 | Change currency while a filter holds a number | Behaviour is consistent (the number applies in the new currency); no stale result |
| E-NUM-5 | Delivery "free" vs delivery 0 vs unknown | "Free" shows for 0; unknown shows nothing or "see store", never "0" by mistake and never "NaN" |
| E-NUM-6 | Product with `was` price lower than current | No "% off" badge, no negative discount |
| E-NUM-7 | Price history with only one point, or a flat line | Chart renders (a dot or a line); no divide-by-zero |

---

## 4. Accounts and sign-in (website; the app uses the same code)

### 4.1 Sign-up **P1**
| ID | Steps | Expected |
|---|---|---|
| A-SU-1 | Valid new email, 8+ char password, tick terms | "Check your email" message; **no session until the link is clicked** (Confirm email is ON) |
| A-SU-2 | Click the email link (same browser) | Lands on the site signed in; address bar is clean; favorites/alerts empty |
| A-SU-3 | Click the same link a second time | A clear "link already used / expired" message; not a crash and not a second account |
| A-SU-4 | Open the link in a different browser | Signs in there; both browsers work |
| A-SU-5 | Sign up with an already-registered email | Neutral message (no leak of whether the email exists) or "already registered"; no second account; no crash |
| A-SU-6 | Wrong formats: `abc`, `a@b`, `a@b.`, `@x.com`, spaces, 300-char address, uppercase | Refused with a clear message; uppercase is treated as the same address as lowercase |
| A-SU-7 | Password 7 chars, empty, only spaces, 200 chars, emoji password | Short and empty refused with the rule shown; long and emoji accepted or refused with a message |
| A-SU-8 | Terms box not ticked | Refused |
| A-SU-9 | Marketing consent box ticked vs not ticked | Saved correctly (check `profiles` / consent column in the database); not ticked means no alert emails ever |
| A-SU-10 | Double-click the Create button | One account, one email |
| A-SU-11 | Sign up while offline | Clear "no connection" message; nothing half-created |
| A-SU-12 | Email delivery | Arrives within a minute, not in spam, sender is DOABNO, link points to your real domain (not localhost) |

### 4.2 Sign-in and out **P1**
| ID | Steps | Expected |
|---|---|---|
| A-SI-1 | Correct credentials | Signed in; name or avatar in the header; account page opens |
| A-SI-2 | Wrong password, unknown email | The same neutral message for both; no hint which was wrong |
| A-SI-3 | Unconfirmed account | "Please confirm your email" message; option to resend |
| A-SI-4 | 10 wrong tries in a minute | Rate-limited by Supabase with a clear message; account is not locked forever |
| A-SI-5 | Sign out | Header returns to signed-out; **saved data stays in the database** but is no longer shown; localStorage `doabno.auth` removed |
| A-SI-6 | Sign out in tab A, then act in tab B | Tab B notices (next action asks to sign in); no data written under the wrong user |
| A-SI-7 | Sign in as user 1, sign out, sign in as user 2 on the same browser | User 2 **never** sees user 1's favorites or alerts (not even for a second) |
| A-SI-8 | Password reset (if offered) | Email arrives; link opens a "set new password" step; old password stops working |

### 4.3 Session and token edge cases **P1**
| ID | Steps | Expected |
|---|---|---|
| A-SS-1 | Stay signed in for over an hour (or edit the stored expiry to the past) and act | The token refreshes silently; no random sign-out |
| A-SS-2 | Corrupt `doabno.auth` in storage (`{`, `null`, `"x"`) and reload | Site loads as signed-out; no crash |
| A-SS-3 | Delete the user in the Supabase dashboard while signed in, then act | Next call fails politely and the site signs you out; no endless loop |
| A-SS-4 | Revoke refresh token / sign out everywhere | Same as above |
| A-SS-5 | Clock off by 1 day on the device | Pages still load; sign-in either works or explains |

### 4.4 Account page and privacy tools **P1**
| ID | Steps | Expected |
|---|---|---|
| A-AC-1 | Change notification settings | Saved; still set after sign-out and in |
| A-AC-2 | "Download my data" | A JSON file with the account, favorites, alerts, consents; no other person's data; no secrets |
| A-AC-3 | "Delete my account" and confirm | Account, favorites, alerts, consent rows gone from the database; you are signed out; signing in again fails; the email can sign up again later |
| A-AC-4 | Cancel at the delete confirmation | Nothing changes |
| A-AC-5 | Delete, then click an old tab's actions | Polite sign-in prompt; no errors |
| A-AC-6 | Privacy request form (`#/privacy-request`): each type, valid email, details | Reference number shown; a row appears in the admin Privacy page with the market and the right deadline (30 days; 45 for the US) |
| A-AC-7 | Privacy form with empty fields, bad email, 10,000-char details, hostile strings | Refused or stored as plain text; admin shows it harmlessly (stored-XSS check) |
| A-AC-8 | Submit the privacy form twice | Two separate references; no crash |
| A-AC-9 | Privacy form **before migration 0007 is run** (throwaway project) | Still saves (falls back without the market field) |

### 4.5 Email-link landing **P1**
| ID | Steps | Expected |
|---|---|---|
| A-LK-1 | Open a confirmation link | Not "Product not found"; shows signed in; address bar clean |
| A-LK-2 | Link with a wrong or truncated token | Friendly "link invalid" message; no signed-in state |
| A-LK-3 | Link opened on `/app/` and on `/admin/` | Same handling on each |
| A-LK-4 | Link whose `redirect_to` is not an allowed address | Supabase refuses; you are never redirected to a foreign site (check the URL Configuration list) |

### 4.6 Social sign-in (only when switched on)
| ID | Steps | Expected |
|---|---|---|
| A-SO-1 | `socialLogin` empty | No Google/Apple buttons anywhere |
| A-SO-2 | `['google']` and the provider set up | Button appears (website dialog and app profile); sign-in returns to the site signed in; same email as an existing password account is handled (linked or clearly refused) |
| A-SO-3 | Cancel on Google's screen | Back on the site, signed out, no error text dumped |

---

## 5. Favorites and alerts: sync edge cases **P1**
The site keeps data in the browser and syncs it with the database (differences are sent, not overwritten).

| ID | Steps | Expected |
|---|---|---|
| Y-1 | Signed out: add 2 favorites and 1 alert. Sign in to an account that has other saved items | Local items merge with the account's items; nothing is lost; no duplicates |
| Y-2 | Add a favorite on the website, open the app | The same favorite is there (one account, one list) |
| Y-3 | Remove an item on the phone, refresh the website | Gone on the website too |
| Y-4 | Add 200 favorites | No slowdown that blocks the page; the heart count is right; sign-out and in restores all 200 |
| Y-5 | Go offline, favorite 3 items, go online | Items sync once connection returns, or the page says it could not save; never silently lost |
| Y-6 | Two tabs change different items at once | Both changes survive (diff sync) |
| Y-7 | Remove a product from the catalog (admin hides it) that a user favorited | The favorite disappears from lists without an error |
| Y-8 | Account deleted, then sign up again with the same email | Starts empty |
| Y-9 | Check the database | `favorites` and `alerts` contain only that user's rows; ids exist in `products` |

---

## 6. Email price alerts (importer + Resend) **P1**

### 6.1 Set-up for the test
Needs: Resend verified domain, `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL` set where the job runs, and at least one alert with consent. Use a throwaway project or your own test inbox.

### 6.2 Cases
| ID | Setup | Run | Expected |
|---|---|---|---|
| M-1 | Alert with consent, target above current price (already reached) | `node backend/importer/cli.js alerts --dry true` | Lists the person as "would be emailed"; nothing sent |
| M-2 | Same | Real run | One email arrives (not spam); subject and body in the person's language; shows product, price, store; link goes to the real site |
| M-3 | Run it again | Real run | **No second email** (already sent) |
| M-4 | Price rises above target, then drops again | Run after each change | Re-armed: a new email only after it went above and came back down |
| M-5 | Alert **without** consent | Run | Skipped as "noConsent"; no email |
| M-6 | Alert for a user with no email, or an unconfirmed user | Run | Skipped as "noEmail"; no crash |
| M-7 | Product with no price (all offers out of stock) | Run | Skipped as "noPrice" |
| M-8 | More alerts than the daily cap (default 80, `ALERT_MAX_EMAILS`) | Run | Only the cap is sent; the rest are counted "capped" and go out on the next run |
| M-9 | Wrong/expired Resend key | Run | Reported as failed, the run does not crash, alerts stay unsent so they retry |
| M-10 | Resend slow or down | Run | Per-email failure handling; the job finishes |
| M-11 | Unsubscribe path | Open the account page and untick marketing consent, run | No further emails to that person |
| M-12 | Hostile product name or user name | Run | The email shows it as plain text; no HTML injection |
| M-13 | Arabic user | Run | Email is right-to-left and readable in Gmail, Outlook and phone clients |

---

## 7. Click-out and tracking **P1**

| ID | Steps | Expected |
|---|---|---|
| C-1 | `clickOutUrl` set, click "Visit store" on an offer with a link | Brief redirect through the `go` function, then the store loads |
| C-2 | Check the admin Clicks/traffic page (after refresh) | One new click for that store, product and market; the visitor is **hashed** (no IP or raw id stored: check the `clicks` table) |
| C-3 | Offer with no store link | The button is disabled/hidden or shows a message; never goes to a broken address or to `undefined` |
| C-4 | Call `go` with missing or wrong offer id (`…/go?offer=0`, `?offer=abc`, none) | Clean error response (4xx), no server stack trace, no redirect |
| C-5 | **Open-redirect test:** try `…/go?url=https://evil.example` and `…/go?offer=1&to=https://evil.example` | The function only redirects to the stored `offers.url`; it ignores any address supplied in the request |
| C-6 | Offer url is not `https` (e.g. `http://`, `javascript:`, `data:`) | Refused by the importer; if one exists in the data, `go` does not follow it |
| C-7 | 100 clicks in 10 seconds from one browser | All handled; no crash; (note whether rate limiting is wanted) |
| C-8 | Click with an ad-blocker on | The store still opens (the redirect is on a Supabase address, not a tracker domain) |
| C-9 | Admin traffic numbers | Match the `clicks` table counts per day (Asia/Riyadh day boundaries) |
| C-10 | Each affiliate network's own link format | Tracking parameters survive the redirect (compare with the network's click report) |

---

## 8. Admin portal

### 8.1 Sign-in and roles **P1**
Roles: owner, catalog, partners, analyst. The database enforces them; the screens hide buttons to match (`backend/tests/permissions.test.js` keeps them in step).

| ID | Steps | Expected |
|---|---|---|
| AD-1 | Open `/admin/` signed out | Sign-in only; nothing of the data is shown |
| AD-2 | Sign in with a **shopper** account (not on the team) | Refused ("no access"); no data visible |
| AD-3 | Sign in as each role | Menu and buttons match the table below |
| AD-4 | As analyst, force a write from the Console (call `ACC.rest` PATCH on `products`) | The database refuses (401/403); the screen shows an error and reloads; nothing changed |
| AD-5 | Remove a team member while they are signed in | Their next action is refused |
| AD-6 | Sign out | Returns to sign-in; the session storage is cleared |

**Role matrix (expected):**
| Area | owner | catalog | partners | analyst |
|---|:-:|:-:|:-:|:-:|
| Products, categories | edit | edit | read | read |
| Stores, coupons, feeds | edit | read | edit | read |
| Exchange rates, popular searches | edit | edit | read | read |
| Shopper list | view | no | view | view |
| Suspend, export, delete shopper | **owner only** | no | no | no |
| Privacy requests | **owner only** | no | no | no |
| Team (add/remove) | owner | no | no | no |
| Traffic and revenue | view | no | view | view |
| Audit log | view | no | no | no |

(If this table and the screens disagree, trust `ROLE_RULES` in `admin-v2/admin.js` and the SQL policies, and fix the table.)

### 8.2 Each screen, as owner **P1**
| ID | Steps | Expected |
|---|---|---|
| AD-DB-1 | Dashboard | Numbers load, no `NaN`; "no data yet" states are friendly |
| AD-PR-1 | Products: search, filter, edit a name/price/status, hide, unhide | Saved at once; refresh keeps it; the change is on the public site (after a refresh); the audit log has one line per change |
| AD-PR-2 | Edit then force a refusal (e.g. sign in as analyst in another browser and try, or break the connection) | A toast says it was refused; the screen reloads to the true value (no fake success) |
| AD-ST-1 | Stores: add, edit, pause a store | Paused store's offers vanish from the site; resume restores them |
| AD-CP-1 | Coupons: add, edit, expire, delete | Reflected on the Coupons page and product pages |
| AD-RT-1 | Exchange rates: change one | Site prices in that currency change; extreme values (0, negative, text) are refused |
| AD-PS-1 | Popular searches: add, reorder, remove | Site search suggestions change |
| AD-US-1 | Users list | Real shoppers; search works; the count is right |
| AD-US-2 | User drawer: details, favorites count, alerts | Shows correct data |
| AD-US-3 | Suspend a test user | They cannot use account features while suspended (or sign-in is blocked: record which); unsuspend restores |
| AD-US-4 | Export user | The Save dialog offers `doabno-user-<id>.json`; the file holds that user's data only; treat as personal data |
| AD-US-5 | Delete user (test account only) | Gone from the list and from `auth.users`; their favorites and alerts are gone; confirmation asked first; cannot be done by non-owners |
| AD-PV-1 | Privacy requests | Requests from the public form appear with reference, type, market, deadline (30 days, 45 for the US), status; change the status through open → in progress → done; refresh keeps it |
| AD-PV-2 | A request with hostile text in name/details/reference | Rendered as text (no script runs; check the earlier stored-XSS fix) |
| AD-FD-1 | Feeds page | Real feed rows; status, items, rejected counts, last run; "Run now" explains how to run via GitHub Actions or runs it |
| AD-TR-1 | Traffic and revenue | Zeros when there are no clicks; with clicks, charts and the CSV export match the database |
| AD-TM-1 | Team: add a signed-up user with a role, change role, remove | Works; adding an email that has not signed up gives a clear message; you cannot remove the last owner |
| AD-AU-1 | Audit log | Each change shows who, what, when; cannot be edited or deleted from the screen |
| AD-SET-1 | Other Settings tabs (markets, notifications, content, app links, maintenance, affiliate tags, security) | **Browser-only today**: the page says so when live; changes do not affect the public site (known gap, see `remainingthings.md` §6) |
| AD-LAY-1 | Resize to short laptop height, collapse/expand the sidebar, click the logo | Sidebar fits without scrolling; collapsing works; cards never overlap the sidebar when hovering |
| AD-AR-1 | Arabic mode | Mirrors correctly; tables and drawers readable |

### 8.3 Admin edge cases
| ID | Steps | Expected |
|---|---|---|
| AD-E-1 | Two admins edit the same product | Last save wins, but both appear in the audit log; neither sees a crash |
| AD-E-2 | Product name of 5,000 characters or hostile text | Refused or stored safely; the public site shows it as text |
| AD-E-3 | Delete a store that has offers | Refused with a reason, or cascades with a clear warning (record which) |
| AD-E-4 | Duplicate store or coupon codes | Refused or handled; no two rows with the same key |
| AD-E-5 | Price of 0, negative, non-numeric | Refused |
| AD-E-6 | Slow network (Slow 3G) while saving | A saving indicator; no double submission; success or an honest failure |
| AD-E-7 | Session expires during an edit | Prompted to sign in; your edit is not silently dropped |
| AD-E-8 | Admin opened with the database unreachable | Clear message; no blank page |

---

## 9. Mobile app prototype (`/app/`)

Screens: Welcome, Home, Search, Product list, Product, Deals, Saved, Profile (jump buttons on the frame page). The app runs inside a phone frame on a desktop and full-screen on a phone.

| ID | Steps | Expected |
|---|---|---|
| APP-1 | Open on a real phone | Full-screen, no frame, bottom tab bar, no horizontal scroll, text readable without zoom |
| APP-2 | Walk the tabs: Home, Categories, Saved, Alerts, Profile | Each loads; back works inside the app |
| APP-3 | Search, filter, open a product, open a store | Same data and prices as the website |
| APP-4 | Sign up, sign in, favorites and alerts | Same account and lists as the website (section 5 Y-2, Y-3) |
| APP-5 | Email confirmation link opened on the phone | Lands signed in on `/app/` |
| APP-6 | Rotate the phone | Layout adjusts; nothing cut off |
| APP-7 | Arabic mode | Right-to-left; tab bar mirrored; Arabic digits and money readable |
| APP-8 | Notch, home bar, keyboard open | Inputs are not hidden behind the keyboard; safe areas respected |
| APP-9 | Pull to scroll, fast flick, long lists | Smooth; no stuck scroll |
| APP-10 | Offline | Clear message; cached screens still open |
| APP-11 | Same hostile strings as 3.3 | Same results as the website |
| APP-12 | Click "Visit store" | Same click-out behaviour as the website (C-1 to C-3) |

---

## 10. Database and security (live project)

Use `curl` with the **publishable** key only. Never use the secret (`service_role`) key for these tests, and never paste keys into chat.

```bash
URL=https://hmanlftkhvruqgvkencn.supabase.co
ANON=<publishable key from assets/config.js>
```

| ID | Command / action | Expected |
|---|---|---|
| DB-1 | `curl "$URL/rest/v1/profiles?select=*" -H "apikey: $ANON"` | `[]` or an error: an anonymous visitor cannot read personal data |
| DB-2 | Same for `favorites`, `alerts`, `privacy_requests`, `admins` (the team table), `clicks`, `audit_log` | Nothing readable anonymously |
| DB-3 | `curl "$URL/rest/v1/rpc/get_catalog" -H "apikey: $ANON" -X POST -H "Content-Type: application/json" -d '{}'` | Returns the catalog; **no hidden products, no cost-per-click or partner secrets** |
| DB-4 | Anonymous `POST` to `products`, `stores`, `coupons` | Refused (401/403) |
| DB-5 | Anonymous `POST` to `privacy_requests` with valid fields | Allowed (the public form needs it), but a `GET` still returns nothing |
| DB-6 | Signed in as shopper A, request shopper B's rows (`?user_id=eq.<B>`) | Empty or refused: row-level security holds |
| DB-7 | Shopper A tries to insert a favorite for user B | Refused |
| DB-8 | Shopper tries `rpc/admin_list_users`, `admin_delete_user`, `admin_export_user`, `admin_add_member`, `set_popular_searches` | Refused for every non-team user and for non-owners where owner-only |
| DB-9 | Analyst tries `admin_delete_user` | Refused |
| DB-10 | `rpc/alerts_to_check` as anon or shopper | Refused (service key only) |
| DB-11 | Supabase Advisors (Security and Performance) | No red items; tables show RLS enabled |
| DB-12 | Search `*/assets/config.js`, the repo and `dist/` for `service_role`, `sb_secret`, passwords | None found; `node scripts/build-site.js` refuses to build if one is present |
| DB-13 | Confirm "Confirm email" is ON and password length is at least 8 | Yes |
| DB-14 | Mass sign-up attempt (script 30 sign-ups) on the throwaway project | Rate limits answer; consider CAPTCHA (remainingthings §2.5) |
| DB-15 | Run each migration twice on the throwaway project | No errors on re-run where it is meant to be repeatable; or a clear "already exists" |

### 10.1 Web security
| ID | Check | Expected |
|---|---|---|
| SEC-1 | Response headers on the hosted site | Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, frame protection present (`_headers` file) |
| SEC-2 | Load the site inside an `<iframe>` on another page | Blocked by frame rules |
| SEC-3 | Mixed content | Everything is `https`; no browser warnings |
| SEC-4 | Console | No CSP violations during normal use; any new outside service (Turnstile, analytics) is added to the policy |
| SEC-5 | `robots.txt` | Present; `/admin/` is disallowed; public pages allowed |
| SEC-6 | Open `/admin/` assets while signed out | Static files load (that is fine); **no data** loads without a team sign-in |
| SEC-7 | Store a stolen anon key | It can only do what DB-1 to DB-10 allow |
| SEC-8 | Feed secrets | Feed variable names must start with `FEED_`; feed addresses must be `https`; no secret appears in workflow logs |
| SEC-9 | `localStorage` | Contains the session and preferences only: no passwords, no service key |
| SEC-10 | Sign-out and back button | Back button after sign-out does not show another person's cached data |

---

## 11. Feed importer and data quality

Dry run first, on files with no database writes:
`node backend/importer/cli.js dry-run --file <file> --format csv|xml|json|google_merchant --store <store-id>`

| ID | Feed content | Expected |
|---|---|---|
| F-1 | Clean file, 100 rows | All accepted; matched to products by GTIN |
| F-2 | Row with no GTIN, or a GTIN that matches nothing | Goes to the rejected list with a reason; the run continues |
| F-3 | Price 0, negative, non-numeric, empty, `1,299.00` (comma), `١٢٩٩` (Arabic digits) | Bad ones rejected with a reason; comma and Arabic digit formats parsed correctly if supported (record) |
| F-4 | Unknown currency code | Rejected |
| F-5 | Duplicate rows (same item twice) | Counted once; no duplicate offers |
| F-6 | Truncated XML / half-downloaded file | The whole run fails with a clear error (status shows `xml` error); **no partial data is saved** |
| F-7 | Empty file / headers only | Error or "0 items"; existing offers are **not** wiped |
| F-8 | Wrong format selected | Clear error; no crash |
| F-9 | Very large file (millions of rows or hundreds of MB) | Size cap refuses it cleanly; memory stays bounded |
| F-10 | Feed address `http://` (not https) | Refused |
| F-11 | Offer link not https, `javascript:`, relative | The link is dropped or the row rejected |
| F-12 | Price outlier: under 0.93× or over 1.06× of the market median with 3+ offers | Flagged for review per the rule |
| F-13 | Re-run the same feed twice | No duplicates; price history only gets a new point when the price **changed** |
| F-14 | Price drops then returns | Two history points; chart draws both |
| F-15 | Item goes out of stock, then is missing from the feed | Marked out of stock or removed as designed; not shown as best price |
| F-16 | Feed returns 401/403/404/500/timeout | Feed row shows error (`auth`, `timeout`); other feeds still run |
| F-17 | Missing `FEED_…` secret | Clear error; no request with an empty key |
| F-18 | Price with a different currency than the store's market | Converted using the stored rate or rejected (record which) |
| F-19 | Product names with HTML or very long titles | Stored as text; trimmed for display |
| F-20 | After a real import, check the public site | New prices visible after the next catalog load; admin Feeds page shows items and rejected counts |

---

## 12. Performance and resilience

| ID | Steps | Expected |
|---|---|---|
| PERF-1 | Lighthouse (mobile) on home and a product page | Aim: performance 80+, accessibility 90+, best practices 90+ (note scores) |
| PERF-2 | Slow 3G throttle | Home usable within about 7 s (the PRD target); a loading state shows meanwhile |
| PERF-3 | Catalog request size | One catalog call; size noted; cached by the browser on repeat visits |
| PERF-4 | **Supabase unreachable** (block `*.supabase.co` in dev tools) | The site falls back to demo data or shows a clear "could not load" message; never a blank page |
| PERF-5 | Offline after the first load | Already-loaded pages work; actions that need the network explain themselves |
| PERF-6 | Free plan paused (project asleep for a week) | First request is slow; the page shows a loading state; document the wake-up time |
| PERF-7 | 50 users at once (simple load tool against `get_catalog`) | Stays responsive on the free plan; note the point where it slows |
| PERF-8 | Memory: scroll the long list and open 50 products | No growth that slows the page |
| PERF-9 | Cache after a deploy | New build shows after a normal reload, not stuck on the old one |

---

## 13. Compatibility and accessibility

### 13.1 Browser and device matrix (website, app, admin)
| Browser | Desktop | Phone |
|---|:-:|:-:|
| Chrome / Brave | ☐ | ☐ (Android) |
| Safari | ☐ | ☐ (iPhone) |
| Firefox | ☐ | ☐ |
| Edge | ☐ | |

Sizes to check: 360, 390, 768, 1024, 1280, 1920 px wide; browser zoom 200%; short height (768 px tall laptop). Check right-to-left at each size.

### 13.2 Accessibility (P2, legal in some markets)
| ID | Check | Expected |
|---|---|---|
| ACC-1 | Use only the keyboard (Tab, Shift+Tab, Enter, Space, Escape, arrows) | Every control reachable; visible focus ring; menus and dialogs close with Escape; focus returns where it was |
| ACC-2 | Dialog focus | Focus stays inside an open dialog; the page behind cannot be tabbed |
| ACC-3 | Screen reader (NVDA/VoiceOver) on home, search, product | Landmarks, headings in order, buttons named; images have alt text; the price graphic has a text alternative |
| ACC-4 | Colour contrast of text and badges | At least 4.5:1 (use the dev-tools checker), in both languages |
| ACC-5 | "Reduce motion" setting on | Animations calm down or stop |
| ACC-6 | Zoom 200% and text-only enlargement | No cut-off or overlap |
| ACC-7 | Forms | Each field has a label and an error message that is read out |
| ACC-8 | Language attribute | `lang` and `dir` switch with the language |

---

## 14. Hosting and release checks (Cloudflare Pages)

| ID | Check | Expected |
|---|---|---|
| H-1 | Build log | Green; `node scripts/build-site.js` makes `dist/` (website at `/`, app at `/app/`, admin at `/admin/`) |
| H-2 | Push a `config.js` with a fake `service_role` key on a test branch | The build **refuses** |
| H-3 | `https://domain`, `https://www.domain`, `http://domain` | One canonical address; http redirects to https; www redirects as chosen |
| H-4 | HTTPS certificate | Valid; no warning |
| H-5 | Deep links (`/app/`, `/admin/`, refresh on any page) | Load without 404 |
| H-6 | 404 for a real missing file (`/nope.js`) | A normal 404, not the home page |
| H-7 | Headers and `robots.txt` | As in SEC-1 and SEC-5 |
| H-8 | Preview deployment of a non-main branch | Works and is not indexed by search engines |
| H-9 | Roll back to the previous deploy | One click restores the earlier build |
| H-10 | Supabase redirect URLs | Production address added; email links from the live site land on the live site |
| H-11 | Weekly **Back up database** workflow | Green with an encrypted `database-backup` artifact |
| H-12 | **Restore drill** on a throwaway project (`HANDOVER.md` §6) | Restored data matches (row counts of key tables) |
| H-13 | Daily **Import store feeds** workflow | Runs on `main` only; finishes green even with no feeds; failure emails reach the team |

---

## 15. Automated tests

```bash
cd backend && npm test
```
Expected: all tests pass (importer, database client, accounts, admin, alerts, site build, permissions, parity of demo vs live catalog). Run before every push and after any database change. The test **`permissions.test.js` fails if the admin screens and the database rules disagree**: treat that failure as a security bug, not a nuisance.

Add a test whenever a bug is found: the usual way is a fake server in `backend/tests/` (see `mock-supabase.js`).

---

## 16. Regression after known fixes
Re-run these every release, because they were real bugs:
1. Email confirmation link shows "Product not found" (fixed: A-LK-1).
2. Signing out after "Delete my account" crashed on a stored `null` (A-AC-3, A-AC-5).
3. Checkbox styling inside dialogs (A-SU-8, W-ALD-4).
4. Privacy form failing before migration 0007 (A-AC-9).
5. Stored-XSS in the admin privacy page (AD-PV-2, 3.3).
6. Feed variables must start with `FEED_`, feeds must be `https` (F-10, SEC-8).
7. Sidebar cards overlapping when hovering a collapsed sidebar (AD-LAY-1).
8. Truncated XML accepted as a good feed (F-6).

---

## 17. Bug report template

```
Title:            (short, what is wrong)
Test ID:          (e.g. A-SU-3)
Where:            website / app / admin / importer / database / hosting
Address:          (page address)
Mode:             demo / live         Language: en / ar     Market/currency:
Browser + size:   (e.g. Brave 1.8, 390x844)
Account / role:   (e.g. tester1, analyst)
Steps:            1.  2.  3.
Expected:
Actual:
Evidence:         (screenshot, Console text, Network status and body)
Severity:         P1 blocks launch / P2 fix soon / P3 polish
```
**Never** paste passwords, API keys, tokens, or a real person's data into a bug report.

## 18. Sign-off

| Area | Tester | Date | Result |
|---|---|---|---|
| Smoke (section 1) | | | |
| Website (2, 3) | | | |
| Accounts (4, 5) | | | |
| Email alerts (6) | | | |
| Click tracking (7) | | | |
| Admin (8) | | | |
| App (9) | | | |
| Database and security (10) | | | |
| Importer (11) | | | |
| Performance (12) | | | |
| Compatibility, accessibility (13) | | | |
| Hosting (14) | | | |
| Automated tests (15) | | | |

Launch only when every **P1** row passes, the legal pages are approved (W-LEG-5), and the launch-day checklist in `remainingthings.md` section 9 is ticked.
