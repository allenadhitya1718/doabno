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

### Deploying to Cloudflare (not done yet: each step below changes the Cloudflare account and needs the owner's OK)

Account: `doabno@gmail.com` (the one Wrangler on the dev machine is signed in to). Today the Pages project `doabno` serves `doabno.com`, `www.doabno.com` and `doabno.pages.dev`, including `/app/` (mobile web app) and `/admin/`. The account has no R2 bucket yet.

**The four settings** (all public values, none are secrets):

| Name | Value |
|---|---|
| `SUPABASE_URL` | `https://jturenubwqxzesjlyjpi.supabase.co` |
| `SUPABASE_ANON_KEY` | the publishable key `sb_publishable_…` from `web-v2/assets/config.js` (never `service_role`) |
| `SITE_URL` | `https://doabno-web.<account subdomain>.workers.dev` while testing, `https://doabno.com` after the switch |
| `NEXT_PUBLIC_CLICK_OUT_URL` | `https://jturenubwqxzesjlyjpi.supabase.co/functions/v1/go` |

Pages are prerendered at build time and `NEXT_PUBLIC_` values are baked into the browser code, so the settings must be present **when building** (in `web-next/.env.production.local` for a deploy from this computer, or under Settings > Build > Variables with Workers Builds) as well as at run time (Worker > Settings > Variables). Changing one needs a rebuild.

**Stage 1: test copy on workers.dev: DONE 2026-11-06** at **https://doabno-web.doabno.workers.dev** (bucket `doabno-next-cache` created, Worker `doabno-web` deployed from the dev computer). Checked there: every page type in English and Arabic, 404s, `x-nextjs-cache: HIT`, CSP header, canonical links on the workers.dev address, sitemap (394 addresses), old `/#/p/…` link forwarding, Visit store through the `go` function, no console errors.

To redeploy the test copy from this computer (`.env.production.local` holds the same four values for the build). Pass the values as `--var` every time: a deploy without them resets the Worker's variables to `wrangler.jsonc`, where `SITE_URL` is a placeholder.

```bash
npm run cf:build
npx opennextjs-cloudflare deploy -- --var SITE_URL:https://doabno-web.doabno.workers.dev --var SUPABASE_URL:https://jturenubwqxzesjlyjpi.supabase.co --var SUPABASE_ANON_KEY:<publishable key> --var NEXT_PUBLIC_CLICK_OUT_URL:https://jturenubwqxzesjlyjpi.supabase.co/functions/v1/go
```

Original stage 1 steps, for reference:
1. Create the cache bucket: `npx wrangler r2 bucket create doabno-next-cache` (R2 has to be enabled on the account once; the free tier covers this site).
2. Put the four settings in `web-next/.env.production.local`, then `npm run cf:deploy`. This creates the Worker `doabno-web` on `https://doabno-web.<subdomain>.workers.dev`.
3. Add the same values as Worker variables in the dashboard (Worker > Settings > Variables).
4. Check `/en/sa`, `/ar/sa`, a product page, `/sitemap.xml`; the `x-nextjs-cache` response header should say `HIT`.
   Optional: connect Git instead (Workers & Pages > Create > Import a repository; project name `doabno-web`, root directory `web-next`, build `npm ci && npm run cf:build`, deploy `npx opennextjs-cloudflare deploy`), so each push to the chosen branch redeploys.

**Stage 2: move doabno.com to the new site (production change)**
`/app/` and `/admin/` must keep working, and they are only in the Pages project. Two safe ways:
- **A. Worker routes for the website paths only (recommended).** Add routes on the `doabno.com` zone for `doabno.com/`, `doabno.com/en/*`, `doabno.com/ar/*`, `doabno.com/_next/*`, `doabno.com/assets/*`, `doabno.com/sitemap.xml`, `doabno.com/robots.txt` (and the same for `www`), pointing at `doabno-web`. Everything else (`/app/`, `/admin/`, old files) keeps coming from Pages. Easy to undo: delete the routes.
- **B. Worker takes the whole domain** and the Next config proxies `/app/*` and `/admin/*` to `doabno.pages.dev` with rewrites. One place to manage, but every app and admin request goes through the Worker.
Then set `SITE_URL=https://doabno.com`, rebuild and deploy, and submit `https://doabno.com/sitemap.xml` in Google Search Console. Old `doabno.com/#/…` links keep working (they land on `/` and are forwarded in the browser).

## Tested again (2026-11-06, evening, after merging redesign-v2)

- Live catalogue: 92 products, all with offers in Saudi Arabia only (other markets have no offers yet, so they show no products). `next build` prerenders 492 pages; the sitemap lists 394 addresses.
- Store photos load from eXtra's and Nahdi's image servers under the Content-Security-Policy (no CSP errors in the console).
- No stars, no review counts and no `aggregateRating` anywhere (all ratings are null now); no made-up barcode in JSON-LD.
- Product page shows "Similar and alternative products" and "Cheaper alternatives" (shared `recommend.js`); offers without delivery days hide that line.
- Sign-in dialog opens from the header (English and Arabic); "Set price alert" while signed out asks to sign in, as web-v2 does.
- **Not tested:** signing in, signing up and syncing favourites and alerts with a real account. That needs a real or test account on the live project, which only the owner should create (test plan below).

## Tested (2026-11-06)

- `next build` passes, with 468 pages prerendered. That covers 2 languages × 4 markets × (home, deals, categories, 20 products, legal pages and so on).
- In demo mode and in live mode (Supabase `jturenubwqxzesjlyjpi`), in English and Arabic: home, category, subcategory, search, deals, coupons, legal pages and the product page all render. There are no console errors apart from missing store favicons, which web-v2 also has.
- Status codes: `/` returns 307 to `/en/sa`; an unknown product returns 404; `/foo` returns 404.
- Live product page: it shows the real eXtra and SACO offers. eXtra's Visit store opens `…/functions/v1/go?t=doabno-sa-extra-iphone-17-pro`, and an offer without a store link shows the "no link" notice.
- The page source has the canonical link, the hreflang links and both JSON-LD blocks.

## What is left

- [ ] **Deploy:** create the R2 bucket and the Worker, set the variables, connect the domain, and submit the sitemap in Google Search Console. Then point doabno.com (or the pages.dev site) at the Worker and retire the web-v2 upload for the website. `app-v2` and the admin stay as they are.
- [x] **Sign-in:** ported (`components/account/`), reusing web-v2's `assets/account.js` unchanged. Accounts switch on when `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set at build time; optional `SOCIAL_LOGIN=google,apple`. Favourites and alerts sync to the account 0.4 s after a change and are merged on sign-in and on every page load.
  - **Owner test still to do with a real account:** sign up (confirmation email lands on the site and signs in), sign in, add a favourite and an alert, reload, sign in on a second browser and check both appear, change a notification setting on /account, sign out, delete account. Then submit a privacy request while signed in.
- [x] **Hero animation and currency selector:** ported.
  - The animated hero follows what is typed in the hero search box.
  - The currency select converts prices in the browser (`components/CurrencyApply.tsx`).
  - Not converted yet: prices that sit inside sentences, such as the alert target in the nav dropdown and the alert button text. JSON-LD always stays in the market currency.
- [x] **Offers without delivery days:** the line is hidden, as web-v2 now does.
- [ ] **Smaller differences from web-v2:**
  - The navigation dropdown does not animate between panels.
  - The app banner phones are static.
  - Tiny 16px store favicons are not hidden, so they can look blurry.
  - Internal links are plain `<a>` tags (full page loads) rather than `next/link`.
- [ ] **Language for `/`:** `/` always redirects to `/en/sa`. A small middleware could pick Arabic or the market from the browser's language.
- [ ] **Privacy request form:** shows the confirmation but is not connected to the database yet. web-v2 has the same limit.
- [ ] **After launch:** watch Search Console for coverage and structured-data errors. Consider product pages only for the markets where a product has offers (today only Saudi Arabia has offers).
