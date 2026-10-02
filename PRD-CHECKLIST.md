# DOABNO: PRD checklist, old site vs redesign

**Old** = original site in `web/`. **New** = redesign in `web-v2/` (http://localhost:5174).
Legend: ☑ done, ◐ partly done, ☐ not done, n/a = back-end or delivery item that a static prototype can't show.
Old column is from the README and code review; New column was checked in the browser unless marked "not re-tested".

| PRD requirement | Old | New | Notes |
|---|:-:|:-:|---|
| Arabic and English, right-to-left | ☑ | ☑ | |
| Multi-currency (SAR, USD, GBP + AED) with automatic conversion | ☑ | ☑ | Currency picker converts every price |
| Markets: Saudi, UAE, US, UK | ☑ | ☑ | |
| Other Gulf markets (Qatar, Kuwait, Bahrain, Oman) | ☐ | ◐ | Listed as "Soon"; needs demo stores, prices and rates |
| Search-first, Idealo-style comparison | ◐ | ☑ | Big hero search plus live price animation |
| Offers sorted by total price incl. delivery | ☑ | ☑ | |
| Price history | ☑ | ☑ | 30/90 days, highest / current / lowest |
| Price freshness ("verified N min ago") | ◐ | ☑ | |
| Advanced filters and sorting | ☑ | ☑ | |
| Category browsing (menu and tiles) | ☑ | ☑ | Animated menu, category circles |
| Ratings and reviews count | ☑ | ☑ | |
| Offers and deals page | ☑ | ☑ | |
| Coupons shown on offers | ☑ | ☑ | |
| Dedicated coupons page | ☐ | ☑ | `#/coupons`: category filter, copy-code button, expiry |
| Favorites | ☑ | ☑ | |
| Price alerts | ☑ | ☑ | |
| Similar and alternative products | ☑ | ☑ | Block on every product page |
| Sign-up and profile | ◐ | ◐ | Front-end only: sign-up, sign-in, notification settings, data download, account deletion. Stored in the browser, no real accounts |
| Responsive on all devices | ☑ | ☑ | Phone layout with bottom tab bar (phone/Arabic not re-tested after the latest changes) |
| SEO-ready | ☐ | ◐ | Per-page title, description, canonical and product structured data. Still hash (`#/`) URLs, so real SEO needs the Next.js port |
| Store and brand logos | ◐ | ☑ | Hotlinked for the demo |
| App-launch banner (App Store / Google Play) | ☑ | ☑ | |
| Affiliate disclosure | ☑ | ☑ | |
| Cookie consent | ☑ | ☑ | Plus "Cookie settings" re-open link in the footer |
| CCPA "do not sell or share" | ☑ | ☑ | Page with opt-out switch |
| Privacy, terms and cookie policy pages | ☑ | ☑ | Placeholder text, needs legal approval |
| Admin panel (users, stores, products, coupons, clicks, CSV export, roles, logs) | ☑ | ☐ | Not redesigned |
| Mobile app layout (iOS / Android screens) | ☑ | ☑ | Redesigned in `app-v2/` (http://localhost:5175), same screens and flows. Not re-tested on a real phone |
| Backend: security, 7-second response time, feeds and APIs, affiliate and CPC networks, handover | n/a | n/a | |

## Still open (with ETA)

| Item | ETA |
|---|---|
| Re-test phone and Arabic layouts for the new pages | ~15 min |
| Website animations: smooth page and tab transitions, scroll reveals, hover and press effects, animated price chart, toast, cookie bar and dialog motion (paused, queued; draft is written but not applied) | ~30–40 min |
| Admin panel redesign | ~4–6 hours |
| Real SEO (clean URLs, server-rendered pages) | ~1 day, part of the Next.js port |
| Real accounts and legal text | Back-end work and legal review, outside this prototype |
| Other Gulf markets (demo data), done last by request | ~30 min |
