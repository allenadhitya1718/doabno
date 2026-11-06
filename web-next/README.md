# DOABNO website: Next.js version (SEO)

This is the DOABNO website (`web-v2/`) rebuilt with Next.js so search engines can index it. Every page has a real address (`/en/sa/p/iphone-17-pro` rather than `/#/p/iphone-17-pro`) and arrives from the server as finished HTML. It looks the same as web-v2 because it uses the same stylesheet, and it has the same wording, catalogue and price rules.

Branch: `nextjs-port`. Status: **work in progress** (see "What is left").

## Run it

```bash
cd web-next
npm install
npm run dev        # http://localhost:3100  (demo catalogue)
npm run build && npm start   # production build
```

To use the live database, copy `.env.example` to `.env.local` (for `dev`) or to `.env.production.local` (for `build`) and fill it in:

| Variable | What it is |
|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase project URL and **publishable** key, the same values as `web-v2/assets/config.js`. Leave both empty to use the demo catalogue. Never a `service_role` key. |
| `SITE_URL` | Public address of the site, used in canonical links, hreflang links and the sitemap. |
| `NEXT_PUBLIC_CLICK_OUT_URL` | Address of the `go` click function. The build bakes it into the pages, so it must be set before `npm run build`. |

## How it works

- **Addresses:** `/{lang}/{market}/…`, where `lang` is `en` or `ar` (Arabic pages are `dir="rtl"`) and `market` is `sa`, `ae`, `us` or `uk`.
  - `/` redirects to `/en/sa`.
  - Pages: home, `/c/{category}[/{sub}]`, `/search?q=`, `/deals`, `/coupons`, `/p/{product}`, `/favorites`, `/alerts`, `/about`, `/legal/{id}`, `/privacy-request` and `/account`.
- **Old links:** old `#/` links keep working. `components/HashRedirect.tsx` turns `/#/p/x` (and every other old route) into the new address, using the visitor's saved language and market.
- **Data:** `lib/catalog.ts`.
  - It calls the same `get_catalog()` database function as web-v2.
  - The answer is cached for 15 minutes (ISR, `revalidate = 900`). The database address is part of the cache key, and failed requests are not cached.
  - Without a database, or when the database does not answer within 8 seconds, the site uses the demo catalogue.
- **Shared code with web-v2:** `scripts/sync-v2.mjs` runs before every `dev` and `build`. It copies `web-v2/v2.css`, the brand files and photos, and `web-v2/assets/data.js` (the demo catalogue and price maths, wrapped as a module), so the two sites cannot drift apart. These copies are generated, git-ignored files, so edit the web-v2 originals instead.
  - The text in both languages lives in `lib/strings.ts`, which is generated from `web-v2/v2.js` with `node scripts/extract-strings.cjs ../web-v2/v2.js lib/strings.ts`. Run that again after changing text in v2.js.
- **SEO:**
  - Every page has its own title and description, a canonical link, and `hreflang` links for en, ar and x-default.
  - Product pages carry `Product` JSON-LD with an `AggregateOffer` (one `Offer` per store, with price, availability, seller and shipping), plus `BreadcrumbList` JSON-LD and OpenGraph tags.
  - `/sitemap.xml` lists every language and market for home, deals, coupons, categories, subcategories and products, and lists about and legal pages once, under `sa`.
  - `/robots.txt` blocks search, account, favourites and alerts.
  - Search result pages are `noindex`.
- **In the browser only, as in web-v2:**
  - Favourites and price alerts use the same local storage keys (`doabno2.favs`, `doabno2.alerts`).
  - The cookie banner.
  - The Visit store buttons go through the `go` function when the offer has a store link. Otherwise they show the same notice web-v2 shows.

## Hosting: Cloudflare (Workers, through OpenNext)

The choice is Cloudflare, not Vercel:
1. The site already runs on Cloudflare Pages (doabno.pages.dev), so the domain, DNS and account stay in one place.
2. Vercel's free Hobby plan does not allow commercial use. A price-comparison site that earns affiliate commission needs Vercel Pro, at $20 per member per month. Cloudflare's free Workers plan allows it, and the paid plan is $5 a month.
3. `@opennextjs/cloudflare` is the adapter Cloudflare supports for Next.js, including ISR (cached in R2). `next-on-pages` is deprecated.

The app itself is standard Next.js and uses no Cloudflare-only code, so it can still move to Vercel later without code changes.

Config files: `wrangler.jsonc` (Worker `doabno-web`, R2 binding `NEXT_INC_CACHE_R2_BUCKET` → bucket `doabno-next-cache`) and `open-next.config.ts` (R2 incremental cache, in-memory revalidation queue; switch the tag cache to D1 or Durable Objects if on-demand `revalidateTag` is ever added). Scripts:

```bash
npm run cf:build     # sync + next build + OpenNext bundle (works on Windows too)
npm run cf:preview   # runs the Worker locally on http://127.0.0.1:8787; values go in .dev.vars (git-ignored)
npm run cf:deploy    # builds and deploys (needs `npx wrangler login`)
```

### Deploying to Cloudflare (not done yet)
1. **R2 bucket:** dashboard > R2 > Create bucket `doabno-next-cache` (or `npx wrangler r2 bucket create doabno-next-cache`).
2. **Worker from Git (recommended):** Workers & Pages > Create > Import a repository. Project name `doabno-web` (must match `name` in `wrangler.jsonc`), root directory `web-next`, build command `npm ci && npm run cf:build`, deploy command `npx opennextjs-cloudflare deploy`. The build reads `../web-v2`, which Workers Builds has because it clones the whole repo.
   Or from a computer: `npm ci`, `npx wrangler login`, `npm run cf:deploy`.
3. **Variables** (none are secrets): `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable key only), `SITE_URL`, `NEXT_PUBLIC_CLICK_OUT_URL`. Set them **both** under Settings > Variables (runtime) **and** Settings > Build > Variables, because pages are prerendered and `NEXT_PUBLIC_` values are baked in at build time. Changing them needs a rebuild.
4. **Check:** open the `*.workers.dev` address, load `/en/sa` and a product page; the `x-nextjs-cache` header should say HIT.
5. **Domain:** Settings > Domains & Routes > Custom domain (the DNS zone must be on Cloudflare). Then set `SITE_URL` to it and rebuild, because canonical links, hreflang and the sitemap use it. Submit `https://<domain>/sitemap.xml` in Google Search Console.

## Tested (2026-11-06)

- `next build` passes, with 468 pages prerendered. That covers 2 languages × 4 markets × (home, deals, categories, 20 products, legal pages and so on).
- In demo mode and in live mode (Supabase `jturenubwqxzesjlyjpi`), in English and Arabic: home, category, subcategory, search, deals, coupons, legal pages and the product page all render. There are no console errors apart from missing store favicons, which web-v2 also has.
- Status codes: `/` returns 307 to `/en/sa`; an unknown product returns 404; `/foo` returns 404.
- Live product page: it shows the real eXtra and SACO offers. eXtra's Visit store opens `…/functions/v1/go?t=doabno-sa-extra-iphone-17-pro`, and an offer without a store link shows the "no link" notice.
- The page source has the canonical link, the hreflang links and both JSON-LD blocks.

## What is left

- [ ] **Deploy:** create the R2 bucket and the Worker, set the variables, connect the domain, and submit the sitemap in Google Search Console. Then point doabno.com (or the pages.dev site) at the Worker and retire the web-v2 upload for the website. `app-v2` and the admin stay as they are.
- [ ] **Sign-in:** sign-in, sign-up and account syncing are not ported. web-v2 does them with `assets/account.js`. `/account` is a placeholder, and favourites and alerts stay in this browser only.
- [ ] **Hero animation and currency selector:** being ported now (see the commit log). Until that lands, the hero is a static card and prices show in the market currency only.
- [ ] **Smaller differences from web-v2:**
  - The navigation dropdown does not animate between panels.
  - The app banner phones are static.
  - Tiny 16px store favicons are not hidden, so they can look blurry.
  - Internal links are plain `<a>` tags (full page loads) rather than `next/link`.
- [ ] **Language for `/`:** `/` always redirects to `/en/sa`. A small middleware could pick Arabic or the market from the browser's language.
- [ ] **Privacy request form:** shows the confirmation but is not connected to the database yet. web-v2 has the same limit.
- [ ] **After launch:** watch Search Console for coverage and structured-data errors. Consider product pages only for the markets where a product has offers (today all 20 products have offers everywhere).
