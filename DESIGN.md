# DOABNO Design System

Design reference for the DOABNO price-comparison platform (doabno.com): public website, admin portal and mobile app layout. Source of truth for brand tokens is `web/assets/brand/doabno-tokens.css`; surface-specific tokens live in `web/assets/css/styles.css`, `web/admin/admin.css` and `web/app/mobile.css`.

## 1. Principles

- **Search first.** Comparison engine model (Kelkoo-style): the search box leads, every offer carries "Visit store" and "Compare prices".
- **Trust through clarity.** Show the total price including delivery, the store, promo codes and price history. Disclose affiliate links.
- **Navy is the action, orange is the value.** Navy for primary actions and prices; orange to highlight savings, sales and the search button.
- **Bilingual by default.** Arabic (RTL) and English are equal citizens. Use CSS logical properties; never hard-code left/right.
- **Accessible.** Visible 3px focus rings, skip link, AA contrast, tabular numbers for money.

## 2. Color

### Brand tokens (`doabno-tokens.css`)

| Token | Value | Use |
|---|---|---|
| `--doabno-navy` | `#0E2A47` | Primary brand, CTAs, headings, prices |
| `--doabno-orange` | `#FF7A00` | Decorative highlight, sale tags, search button. **Not for small text on white** |
| `--doabno-orange-text` | `#A94300` | Orange text on white (AA); focus ring color |
| `--doabno-orange-on-navy` | `#FF9A46` | Orange text on navy backgrounds |
| `--doabno-ink` | `#172B3A` | Body text |
| `--doabno-muted` | `#526272` | Secondary text |
| `--doabno-surface` | `#FFFFFF` | Cards, page surface |
| `--doabno-soft` | `#F5F8FA` | Soft backgrounds, utility bar |
| `--doabno-focus` | `#A94300` | Focus outline |

### Supporting tokens (shared across surfaces)

| Token | Value | Use |
|---|---|---|
| `--navy-2` | `#173A5E` | Navy hover state |
| `--orange-wash` / `--orange-line` | `#FFF4EA` / `#FFD6B0` | "Visit store" button fill / border |
| `--line` / `--line-2` | `#E2E8EE` / `#EEF2F5` | Borders, dividers |
| `--green` / `--green-wash` | `#0F7A4A` / `#E7F6EE` | Promo codes, good/positive states |
| `--red` | `#B42318` | Errors, negative states |
| `--page` (admin, app) | `#F2F5F8` | Page background behind cards |

### Admin-only

`--side-text #C9D5E1`, `--side-muted #8FA3B8` (navy sidebar text); status pairs: good `#0F7A4A / #E7F6EE`, warn `#7A4F00 / #FFF4D6`, bad `#B42318 / #FDECEA`, info bg `#E8F0F8`; input border `#C8D2DC`.

### Rules

- Primary CTA: navy fill, white text. Value highlights use orange **plus** words/numbers, never color alone.
- Orange `#FF7A00` on white is decorative only; use `--doabno-orange-text` for text.
- Re-verify contrast at the final font size.

## 3. Typography

| Role | Font |
|---|---|
| Latin | `Inter` (400–800), fallback `system-ui, -apple-system, 'Segoe UI', sans-serif` |
| Arabic | `IBM Plex Sans Arabic` (400–700), fallback `Inter` |

Loaded from Google Fonts; `html[lang="ar"]` switches the body font.

- Base size: 15px web / 15px app / 14px admin. Line height 1.5 (app 1.45).
- Headings in navy, line-height 1.25. `h2` 20px/700, `h3` 15px/600.
- Tags: 11px, 700, uppercase, `letter-spacing .03em` (reset to 0 in Arabic).
- Prices use `.money`: `font-variant-numeric: tabular-nums; white-space: nowrap; unicode-bidi: isolate` so numbers stay intact in RTL.

## 4. Layout and spacing

- Max content width `1280px`; container padding 16px (mobile), 24px (≥768px).
- Spacing scale in practice: 4 / 6 / 8 / 12 / 16 / 24 / 28 px.
- Sticky header (72px min height, `z-index: 30`) with `scroll-padding-top: 110px` for anchors.
- Mega menu: 6-column grid, 24px gap, with an extra column separated by a logical-side border.
- Mobile: app fills the screen on phones; wide screens render it in a phone frame beside a demo panel. Respect `env(safe-area-inset-bottom)`.

## 5. Shape and elevation

| Token | Value |
|---|---|
| `--radius` | 12px (cards, panels, dropdowns) |
| `--radius-sm` | 8px (buttons, inputs) |
| Tags | 4px |
| Pills, search field, avatars/icon buttons | 999px / 50% |
| `--shadow` | `0 1px 2px rgba(14,42,71,.05), 0 6px 18px rgba(14,42,71,.08)` |
| `--shadow-lg` | `0 16px 40px rgba(14,42,71,.16)` (admin: `0 18px 44px … .2`) |

Shadows are navy-tinted, never pure black.

## 6. Components

### Buttons (`.btn`)
- **Primary**: navy bg, white text, hover `--navy-2`.
- **Ghost**: white bg, `--line` border, navy text; border turns navy on hover.
- **Visit store**: `--orange-wash` bg, `--orange-line` border, `--orange-text` text; on hover fills orange with navy text.
- Sizes: `sm` 7×12 / 13px, default 10×18 / 14px, `lg` 13×22 / 15px, `block` full width. Weight 700, radius 8px, disabled opacity .45.
- **Icon button**: 36px circle, soft bg, navy icon.

### Search
Pill input, 46px high, `#C8D2DC` border; focus: navy border + `0 0 0 3px rgba(14,42,71,.12)`. Round orange submit button (38px) inset at the inline end. Suggestions dropdown: 12px radius, `--shadow-lg`, 3-column rows (thumb / name + sub / price).

### Tags and pills
- `.tag-promo`: green wash/green text. `.tag-sale`: orange fill, navy text.
- `.pill`: 13px/600, soft bg, navy text; `.pill-good` uses green.
- `.badge`: 18px orange circle with navy count on nav items (favorites, alerts).

### Header and navigation
Utility bar (soft bg, 38px: market and language selectors, sign-in) above a white sticky header (logo 32px, search, nav buttons with chevron that rotates when expanded). Nav items are 8×12 padding, 8px radius, soft hover.

### Product visuals (`.art`)
Category-tinted background with a 50%-opacity illustration; real photo overlays when available.

### Skip link and focus
Skip link appears on focus at the inline start. Global `:focus-visible`: 3px `--doabno-focus` outline, 2px offset.

## 7. Content patterns

- **Home**: search hero, popular categories, price drops, trending offers per category, category directory, popular searches/brands, stores.
- **Listing**: "Compare N offers from M stores", filters with counts (type, price band, free delivery, on sale, brand, store), sorting, pagination.
- **Product**: offers sorted by total price incl. delivery, promo codes, 30/90-day price history, details, ratings, similar offers.
- **Admin**: dashboard KPIs with trends, needs-attention list, feed health, clicks and revenue breakdowns, product and offer management; navy sidebar on `--page` background.
- **App**: bottom-tab navigation, phone-frame preview on desktop.

## 8. Internationalization

- Strings in `i18n.js`, `admin-i18n.js`, `mobile-i18n.js` (AR/EN).
- `dir="rtl"` for Arabic; use `inset-inline-*`, `margin-inline-*`, `padding-inline-*`, `border-inline-*`.
- Directional icons (`.arrow`) flip with `scaleX(-1)` in RTL.
- Markets: SA, AE, US, UK with currencies SAR, AED, USD, GBP.
- Cookie consent, affiliate disclosure and CCPA link are required UI.

## 9. Assets

`web/assets/brand/` (served) and `brand/DOABNO_English_Brand_Kit/` (masters): primary, reverse, mono-black and mono-white logos; wordmark; symbol; app icons 32–4096px. Use reverse/white logos on navy, primary on white. Full rules in `docs/DOABNO_Brand_Guidelines_EN.pdf`.

## 10. Do / Don't

- Do reference tokens (`var(--navy)`) instead of hex values.
- Do pair orange highlights with text or numbers.
- Don't put `#FF7A00` text on white.
- Don't use physical `left`/`right` properties; use logical ones.
- Don't show a price without its currency and delivery context.
