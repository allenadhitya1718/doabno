# DOABNO (doabno.com)

Price comparison platform for Saudi Arabia, the Gulf, the US and the UK. Arabic + English, multi-currency.

## Structure

```
docs/   Brand guidelines (PDF)
web/    Frontend UI prototype (static HTML/CSS/JS, no build step)
  index.html
  assets/brand/   Logo SVG masters, app icons, brand CSS tokens
  assets/css/     styles.css (uses brand tokens, RTL via logical properties)
  assets/js/      i18n.js (AR/EN strings), data.js (demo catalog), app.js (router + UI)
  admin/          Admin portal: index.html, admin.css, admin-i18n.js, admin.js
  app/            Mobile app layout (clickable prototype): index.html, mobile.css, mobile-i18n.js, mobile.js
```

## Redesign v2 (try this first)

Search-first redesign of the website and the mobile app, in separate folders so it can be compared with the original (`web/`).

```bash
py serve-v2.py
```

Then open http://localhost:5174 (website), http://localhost:5174/app/ (mobile app) and http://localhost:5174/old/ (the original site; its admin portal is at `/old/admin/`). On a phone on the same Wi-Fi, use your computer's IP address instead of `localhost`.

```
web-v2/            Redesigned website (static HTML/CSS/JS): index.html, v2.css, v2.js, assets/ (demo data + brand)
app-v2/            Redesigned mobile app prototype: index.html, mobile.css, mobile.js, mobile-i18n.js, assets/
DESIGN.md          Design system notes
PRD-CHECKLIST.md   PRD requirements, old vs redesign, and what is still open
serve-v2.py        Runs web-v2, app-v2 and the original on one port
```

Needs Python 3 and an internet connection (fonts, demo photos and store logos are loaded from the web). All data is demo data.

## Run the original prototype

```bash
py serve.py
```

Run it from the project folder, then open http://127.0.0.1:5173 (site), http://127.0.0.1:5173/admin/ (admin portal) or http://127.0.0.1:5173/app/ (mobile app layout). `serve.py` works like `python -m http.server` but tells browsers to check for newer files on every load, so edits show after a normal refresh.

## What the prototype covers

The layout follows the Kelkoo model of a comparison engine: search first, offers from many stores, "Visit store" and "Compare prices" on every offer.

| Page | Route | What it shows |
|---|---|---|
| Home | `#/` | Search hero, popular categories, today's price drops, trending offers per category, category directory, popular searches and brands, stores in the market |
| All categories | `#/categories` | Every category with its subcategories |
| Category | `#/c/electronics` | Intro, subcategory tiles, trending offers |
| Subcategory / search / deals | `#/c/electronics/audio`, `#/search?q=…`, `#/deals` | "Compare N offers from M stores", filters with counts (type, price band, free delivery, on sale, brand, store), sorting, pagination |
| Product comparison | `#/p/sony-wh1000xm6` | All store offers sorted by total price incl. delivery, promo codes, price history (30/90 days), product details, ratings, similar offers |
| Favorites / price alerts | `#/favorites`, `#/alerts` | Saved in the browser for now |

Also: Arabic (RTL) / English, market selector (SA, AE, US, UK) with currency conversion (SAR, AED, USD, GBP), cookie consent, affiliate disclosure, CCPA link.

## Admin portal (`/admin/`)

Sign-in is a demo: any email and password work. The live portal should use single sign-on with two-factor authentication.

| Section | What it does |
|---|---|
| Dashboard | Outbound clicks, estimated revenue, live offers, products, stores and price alerts with trends; clicks per day; clicks by store and category; top products; a "needs attention" list (failed feeds, prices far from other stores, expiring coupons, out of stock); feed health and recent activity |
| Clicks & revenue | Daily clicks, breakdown by store / product / category / market, CSV export, and "Visit store" clicks made on the site in this browser |
| Products | Search and filter the catalog; edit names (EN/AR), brand, category, key features; hide or show a product |
| Offers | Every store offer with price, delivery, stock and flags (price check, promo code, on sale) |
| Categories | Rename categories and subcategories (EN/AR); add subcategories |
| Stores | Pause or activate stores, set cost per click, edit categories and logo colour, add stores |
| Store feeds | Import status per store (format, schedule, items, rejected items, errors) with "Run now" |
| Coupons | Add, edit and delete promo codes |
| Users | Registered shoppers with alerts and favorites |
| Settings | Exchange rates, popular searches, team roles, reset demo data |

Edits are saved in the browser (`localStorage` key `doabno.admin.data`) and the public site applies them on load in the same browser, so pausing a store or adding a coupon shows on the site straight away. **Settings → Reset all changes** restores the demo data. Traffic, revenue, feeds, users and team members are generated demo numbers; production reads them from the API.

## Mobile app layout (`/app/`)

A clickable prototype of the iPhone and Android app, for screen approval before the app is built (React Native with Expo is the recommended stack). On a computer it shows inside a phone frame with a panel to jump between screens; on a phone it fills the screen.

Screens: welcome (country and language), home, search, categories, product lists with sort and filter, product comparison (all store offers, price history, price alert, sticky "Visit store" bar), deals, saved (favorites and price alerts) and profile (sign-in, settings, notifications). It reads the same demo data as the website and shares favorites, alerts, language and country with it in the same browser.

## Screenshots for design review

With the local server running, `node capture-screens.js` saves screenshots of the main screens of the website, app and admin portal to `screens/`, with `screens/index.html` to review them on one page. It uses headless Chrome (Edge if Chrome isn't installed) with a temporary profile. Long pages are split between sections so no image is taller than 4,096 px (the most Figma keeps at full size); phone screens are saved at 2× and their file names end in `@2x`. Re-run it after design changes.

## Demo data

Everything in `web/assets/js/data.js` is **demo data**: products, stores, prices, coupons and ratings. Store names are real retailers used as placeholders; no prices come from them.

Product, category and hero photos are hotlinked from [Unsplash](https://unsplash.com) (free license) and are credited on product pages. Some show branded products, so replace them with merchant feed images before launch.

## Next steps

1. Client approves screens (required by the spec before development).
2. Port to Next.js (SSR for SEO) once screens are approved; replace `data.js` with the product API.
3. Replace demo photos with merchant feed images.
