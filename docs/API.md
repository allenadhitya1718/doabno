# DOABNO API manual

Everything the website, app, admin and jobs call. Written 2026-11-06. Architecture: `docs/ARCHITECTURE.md`.

Base address: `https://<project-ref>.supabase.co` (the project is being recreated; the ref goes in `*/assets/config.js`).

## Keys and headers

| Caller | Headers | Rights |
|---|---|---|
| Visitor (not signed in) | `apikey: <publishable key>` | Read the active catalogue; file a privacy request; record a product view |
| Signed-in shopper | `apikey: <publishable key>`, `Authorization: Bearer <user access token>` | Own profile, favourites, alerts, push tokens |
| Admin | Same as a shopper; the person must be in `admins` | By role: owner, catalog, partners, analyst |
| Jobs (importer, link checker, backup) | `apikey` and `Authorization: Bearer <service key>` | Everything; bypasses row-level security. GitHub secrets only, never in a browser |

Tokens come from Supabase Auth (`/auth/v1/token`, `/auth/v1/signup`), handled in `web-v2/assets/account.js`.
Errors follow PostgREST: HTTP status plus `{ "code", "message", "details", "hint" }`. `401`/`403` mean missing or insufficient rights.

## 1. Catalogue (public)

| Call | Returns |
|---|---|
| `POST /rest/v1/rpc/get_catalog` | One JSON document: `rates`, `currencies`, `markets`, `categories` (with `subs`), `stores` (by market), `products` (with `specs`, `photos`), `offers` (by `productId|market`), `history`, `coupons`, `popular`. Same shape as `backend/seed/catalog.local.json`. Row-level security applies, so visitors get active items only |
| `GET /rest/v1/products?select=...` | Plain table reads also work for active products and stores |

## 2. Shopper data (signed in)

| Call | Purpose |
|---|---|
| `GET /rest/v1/profiles?user_id=eq.<id>&select=display_name,market,lang,currency,notify_email,notify_push,marketing_consent,consent_at` | Read own profile |
| `PATCH /rest/v1/profiles?user_id=eq.<id>` | Change own profile |
| `GET /rest/v1/favorites?select=product_id&order=created_at` | Own favourites |
| `POST /rest/v1/favorites?on_conflict=user_id,product_id` (`Prefer: resolution=merge-duplicates`) | Add favourites |
| `DELETE /rest/v1/favorites?user_id=eq.<id>&product_id=eq.<product>` | Remove a favourite |
| `GET /rest/v1/alerts?active=eq.true&select=product_id,target_price,currency,notify_email,notify_push,consent_at,active` | Own price alerts |
| `POST /rest/v1/alerts?on_conflict=user_id,product_id` | Create or change an alert: `{ user_id, product_id, target_price, currency, notify_email, notify_push, consent_at, active }` |
| `DELETE /rest/v1/alerts?user_id=eq.<id>&product_id=eq.<product>` | Remove an alert |
| `POST /rest/v1/rpc/register_push_token` `{ p_token, p_platform: "android" \| "ios" }` | Register this phone for notifications |
| `POST /rest/v1/rpc/unregister_push_token` `{ p_token }` | Stop notifications on this phone |
| `POST /rest/v1/rpc/delete_my_account` | Delete the account and everything under it |
| `POST /rest/v1/rpc/record_view` `{ p_product_id, p_market }` | Count one product page view (anyone; only with analytics consent) (0013) |
| `POST /rest/v1/privacy_requests` | File a privacy request (anyone; shape-checked) |

## 3. Admin

All need a signed-in admin. The role decides what is allowed.

| Call | Who | Purpose |
|---|---|---|
| `rpc/admin_list_users` | owner, analyst | Shoppers with sign-up date, alerts, favourites, suspended |
| `rpc/admin_set_user_suspended` `{ p_user, p_suspended }` | owner | Suspend or restore an account |
| `rpc/admin_delete_user` `{ p_user }` | owner | Delete an account (deletion request) |
| `rpc/admin_export_user` `{ p_user }` | owner | Everything held about one person (access request) |
| `rpc/admin_list_team` | all admins | Team list (others see only themselves) |
| `rpc/admin_add_member` `{ p_email, p_role, p_name }` | owner | Add or change an admin; the person needs an account first |
| `rpc/admin_remove_member` `{ p_user }` | owner | Remove an admin |
| `rpc/set_popular_searches` `{ p_terms }` | owner, catalog | Replace the popular searches list |
| `rpc/admin_click_stats` `{ p_days }` | owner, partners, analyst | Clicks per tracking id per day (Saudi time) |
| Tables `stores`, `products`, `offers`, `coupons`, `categories` | owner, catalog (stores: partners) | Catalogue editing through normal REST calls |
| Tables `feeds`, `feed_runs`, `feed_rejects`, `scrape_pages` | owner, partners (read: analyst, catalog) | Data sources and their last runs |
| Tables `conversions`, `settings` (0012), `product_views` (0013), `link_checks` (0014) | see the migrations | Reports, settings, views, link health |
| Table `audit_log` | read: all admins | Activity feed; admins write their own entries |

## 4. Edge functions

**`GET /functions/v1/go?t=<tracking id>`** — "Visit store". No key needed.
- Tracking id format: `doabno-{market}-{store}-{product}`, for example `doabno-sa-extra-iphone-17-pro`.
- Logs the click (`clicks`: tracking id, product, store, market, salted daily visitor hash) and answers `302` to the offer's store or affiliate link.
- Unknown, paused or link-less offers redirect to the site home (`SITE_URL`) and are not logged. Bad ids get `400`.

**`POST /functions/v1/identify`** — photo to product guess.
- Headers: `apikey: <publishable key>`, `Content-Type: application/json`.
- Body: `{ "mime": "image/jpeg", "image": "<base64, about 1,000 px>" }`.
- Answer: `{ "ok": true, "guess": { "found", "brand", "name", "model", "category", "confidence" } }`.
- Limits: daily cap for everyone (`IDENTIFY_DAILY_CAP`, default 1,000) and a per-visitor limit. Details in `backend/supabase/functions/identify/README.md`.

## 5. Jobs (service key)

| Call | Used by |
|---|---|
| `GET feeds?active=eq.true&schedule=eq.<daily\|six_hourly\|hourly>` | Importer: which feeds to run |
| `POST offers?on_conflict=product_id,store_id` | Importer: write prices |
| `PATCH offers?store_id=eq.<s>&product_id=in.(...)` `{ in_stock: false }` | Importer: products a feed no longer lists |
| `POST price_history?on_conflict=product_id,market,day` | Importer: lowest-price history |
| `POST feed_runs`, `PATCH feed_runs?id=eq.<id>`, `POST feed_rejects` | Importer: run records |
| `GET scrape_pages?store_id=eq.<s>&active=eq.true` | Importer: store pages to read |
| `rpc/alerts_to_check`, `rpc/push_tokens_for`, `rpc/drop_push_tokens` | Alert job |
| `GET offers?url=not.is.null`, `POST link_checks` | Link checker (0014) |

## 6. Store feeds (what we accept)

Formats: CSV (any of `, ; tab |`), XML (Google Merchant, RSS, flat product lists), JSON (lists, wrapped lists, nested objects). Column names are matched loosely:

| Meaning | Accepted names |
|---|---|
| Barcode (required) | `gtin`, `ean`, `ean13`, `barcode`, `upc`, `gtin13`, `gtin14` |
| Price (required) | `sale_price`, `price`, `current_price`, `price_value`, `amount` |
| Regular price | `regular_price`, `original_price`, `was_price`, `list_price` (or `price` when `sale_price` is present) |
| Currency | `currency`, `price_currency`, `currency_code`, or the price text ("1,299.00 SAR"); default: the market's |
| Delivery | `shipping_price`, `shipping`, `shipping_cost`, `delivery_cost`, `delivery_price` |
| Stock | `availability`, `in_stock`, `stock`, `stock_status`, `quantity` |
| Link | `link`, `url`, `product_url`, `deeplink`, `deep_link`, `aw_deep_link`, `tracking_url` (https only) |
| Id, title, image | `id`/`sku`/`mpn`, `title`/`name`, `image_link`/`image`/`image_url` |

Rejected items are listed per run with a reason: `no_gtin`, `invalid_gtin`, `bad_price`, `unknown_currency`, `bad_shipping`, `no_match`, `price_outlier`; store pages add `robots_disallow`, `fetch_failed`, `timeout`, `no_product_data`, `page_mismatch`, `bad_url`, `no_product`.
