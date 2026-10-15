# DOABNO: handover guide

For whoever runs DOABNO after the build. It says what exists, who owns what, how to set it up from nothing, how to do the everyday jobs, and what is still demo. No secrets are in this file or in the repository.

## 1. What this is
Three static web pages plus a database:

| Part | Folder | Address when hosted | What it is |
|---|---|---|---|
| Website | `web-v2/` | `/` | Search-first price comparison (English and Arabic) |
| Mobile app (prototype) | `app-v2/` | `/app/` | The phone-sized app screens, same data and accounts |
| Admin portal | `admin-v2/` | `/admin/` | Products, stores, coupons, rates, team, activity |
| Database and back end | `backend/` | Supabase (Frankfurt) | Tables, login, access rules, importer, tests |

All three pages talk straight to Supabase from the visitor's browser, using a **public** key. There is no server of our own. What each person may see or change is enforced by the database (row-level security), not by the pages.

```
 visitor / admin browser ──(public key + own login token)──► Supabase  (Postgres + login)
                                                                 ▲
 GitHub Actions (daily) ──(service key)── importer: feeds → prices, alert emails (Resend)
 GitHub Actions (weekly) ─ encrypted database backup
```

## 2. Accounts and who should own them
Create each in the company's name (or transfer to it), with a shared company email as the owner address.

| Account | Used for | Status | Cost |
|---|---|---|---|
| Supabase | Database, login, access rules | Created (project `hmanlftkhvruqgvkencn`, Frankfurt, free plan) | $0; Pro $25/mo when the 500 MB fills or it pauses |
| GitHub | The code, scheduled jobs | Repo `allenadhitya1718/doabno` (private) | $0 |
| Cloudflare | Hosting the three pages | **To create** | $0; $5/mo only if traffic needs it |
| Resend | Price-drop and sign-up emails | **To create** | $0 up to 100 emails/day |
| Domain name | The web address | **To buy** | about $10 to $15 a year |
| Affiliate networks / Noon / Amazon | Real store feeds and commission links | **Client papers needed** (see `ClientRequirements.pdf`) | free to join |
| Apple / Google developer | Only if store apps or Apple/Google sign-in are wanted | Not started | Apple $99/yr, Google $25 once |

## 3. Secrets: what exists and where each lives
Never put any of these in the repository, in `config.js`, or in chat.

| Name | What it is | Where it goes |
|---|---|---|
| Project URL, publishable key | **Public by design** | `assets/config.js` in each of the three folders |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Full database access (skips all rules) | GitHub secrets (importer, alerts) |
| `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL` | Sends the alert emails; sender address; the site's web address | GitHub secrets |
| `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE` | Backup connection (session pooler string) and its encryption passphrase | GitHub secrets |
| `CLICK_SALT` | Random text for hashing visitors in click tracking | Supabase function secret |
| Feed keys (for example `NOON_FEED_KEY`) | A store's feed login | GitHub secret, referenced in the feed address as `${NOON_FEED_KEY}` |

If a secret is ever exposed, rotate it (section 7) before anything else.

## 4. Setting up from nothing (a new project)
1. **Supabase project:** new project, region Central EU (Frankfurt). In the SQL Editor run, in order: `backend/supabase/migrations/0001` to `0007`, then `backend/supabase/seed/01-catalog.sql` and `02-history.sql` (demo catalog; skip when real feeds are in).
2. **First admin:** have that person sign up on the website, then run the SQL in `backend/README.md` ("Making the first admin").
3. **Point the pages at it:** put the project URL and publishable key in `web-v2/assets/config.js`, `app-v2/assets/config.js`, `admin-v2/assets/config.js` (same values in all three).
4. **Supabase login settings** (Authentication):
   - URL Configuration: Site URL = the real web address; Redirect URLs = that address with `/**` (and `/app/**`).
   - Email: keep "Confirm email" **on**. Turn on **custom SMTP** with Resend, because Supabase's built-in sender is limited to a few emails an hour.
5. **Hosting (Cloudflare Pages):** Workers & Pages, Create, Pages, connect the GitHub repo. Production branch `main`, build command `node scripts/build-site.js`, output directory `dist`. Add the custom domain. Every push to `main` then redeploys. (Merge `redesign-v2` into `main` first; `main` still holds the older website and app.)
6. **Click tracking (when real store links exist):** Supabase, Edge Functions, create `go` from `backend/supabase/functions/go/index.ts`, switch **JWT verification off**, set secrets `CLICK_SALT` and `SITE_URL`. Or from a terminal, in the `backend` folder: `supabase functions deploy go` (the settings file `backend/supabase/config.toml` already turns JWT checking off for it). Then put its address (`https://<project>.supabase.co/functions/v1/go`) in `clickOutUrl` in the three `assets/config.js` files: from then on, "Visit store" for an offer that has a store link logs the click and goes to the store.
7. **Scheduled jobs:** add the GitHub secrets in section 3. The daily importer (`import-feeds.yml`) and weekly backup (`backup-db.yml`) only run from `main`.

## 5. Everyday jobs
- **Add an admin:** the person signs up on the website, then an owner uses Admin, Settings, Team, Invite member. Roles: owner (all), catalog (products, categories, popular searches), partners (stores, coupons, feeds), analyst (read only plus users list).
- **Hide a product or pause a store:** Admin, Products or Stores. It disappears from the site at once.
- **Change exchange rates, popular searches, coupons:** Admin, Settings or Coupons.
- **Add a store's feed** (there is no screen for this yet): add the store in the admin, then in the SQL Editor:
  ```sql
  insert into public.feeds (store_id, format, schedule, url)
  values ('noon-sa', 'google_merchant', 'daily', 'https://example.com/feed.xml?key=${NOON_FEED_KEY}');
  ```
  Formats: `xml`, `csv`, `json`, `google_merchant`. Add the secret to the workflow's `env:` list in `.github/workflows/import-feeds.yml`.
- **Run the importer by hand:** GitHub, Actions, "Import store feeds", Run workflow (optionally a feed id). Results appear in the `feed_runs` and `feed_rejects` tables.
- **Try a feed file without saving anything:** `node backend/importer/cli.js dry-run --file feed.csv --format csv --store noon-sa`.
- **Privacy requests and deletion:** requests land in the `privacy_requests` table (owner can read them in the SQL Editor or Table Editor); answer within the 30 days the site promises. A signed-in user can delete their own account from the profile page; that removes their favorites and alerts too.
- **Try the hosted site on this computer:** `node scripts/build-site.js`, then `node scripts/serve-dist.js` (serves `dist/` with the same security headers as the host).
- **Run all tests:** `cd backend && npm test` (no installs needed).

## 6. Restoring a backup
1. GitHub, Actions, "Back up database", open the latest run, download the artifact `database-backup`.
2. Decrypt: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in doabno-DATE.dump.enc -out doabno.dump` (set `BACKUP_PASSPHRASE` first).
3. Restore into a **new, empty** Supabase project, never over a live one without care: `pg_restore --no-owner --no-privileges --dbname "<session pooler connection string>" doabno.dump` (PostgreSQL 17 client). Then point `config.js` at the new project.
4. **Test a restore once, before you need it,** on a throwaway project. Restoring the login (`auth`) tables into a fresh Supabase project can need small adjustments.
5. Free-plan projects have no automatic daily backups, so this weekly file is the safety net. Pro includes daily backups.

## 7. Rotating a key
- **Service key:** Supabase, Settings, API Keys: create a new secret key, update the GitHub secrets, delete the old one.
- **Publishable key:** rarely needed; create a new one, update the three `config.js` files, redeploy, delete the old one.
- **Resend key:** create a new one in Resend, update the GitHub secret, delete the old one.

## 8. What is real and what is still demo
**Real:** accounts, sign-in by email, favorites and price alerts saved per account, profile and consent records, privacy requests, account deletion, the admin (sign-in with roles, all edits saved, activity log, users, team), hiding products and pausing stores, shopper accounts (suspend, export, delete) and privacy requests with their legal deadlines, buttons hidden by role (and checked against the database rules by a test), the real Store feeds page, the importer and alert-email code, hosting build, backups.

**Still demo or not done:**
- **Prices and stores are demo data** until real feeds are connected. Needs the affiliate approvals and feeds from the client.
- **"Visit store" does not track clicks yet.** The function is written but not deployed (and `clickOutUrl` is empty), and demo offers have no store links.
- **Admin settings tabs are saved in the browser only** (markets and language switches, notification and sender settings, site content, app links, maintenance message, affiliate tags, security). Only exchange rates, popular searches and the team are saved in the database. Wiring the rest means a settings table and making the site read it.
- **Admin traffic and revenue numbers are real but read zero until clicks exist** (they come from the recorded "Visit store" clicks, times each store's cost per click). Only owner, partners and analyst roles can read clicks; a catalog manager sees zeros. The Store feeds page is real too: each feed's latest run, and "No feed yet" for stores without one.
- Price-drop emails are written and tested but need a Resend account and domain to send.
- **Apple and Google sign-in** are wired in but switched off: set the provider up in Supabase, then list it in `socialLogin` in the three `config.js` files and the buttons appear (details in `remainingthings.md`).
- **Content-Security-Policy is moderate:** it blocks other sites' scripts and limits where data can go, but still allows inline scripts and styles because the pages use a few inline event handlers. Removing those would allow a stricter policy.
- **SEO:** page addresses use `#/`, so search engines cannot index product pages. Fixing it means moving the website to a server-rendered framework (Next.js), about three weeks.
- **Native iOS and Android apps:** not built; the app folder is a mobile-sized prototype.
- **Other Gulf markets** (Qatar, Kuwait, Bahrain, Oman): listed as "soon", no stores or prices yet.
- **Legal texts are placeholders** and must be approved by the client's legal adviser before launch.

## 9. Legal and privacy checklist before launch
- Written advice from a Saudi legal adviser on storing user data in Frankfurt (PDPL applies to Saudi residents' data wherever it is stored). If Saudi hosting is required, the user tables (`profiles`, `favorites`, `alerts`, `privacy_requests`, and Supabase login) are separate and can move.
- Final privacy policy, terms, disclaimer, cookie policy and affiliate disclosure, approved and published.
- A named contact for privacy requests.
- Consent is recorded when someone ticks the email-alert or marketing box (`alerts.consent_at`, `profiles.consent_at`). Emails are only sent to people who ticked it.

## 10. Monthly cost
At launch about **$0 plus the domain**. Realistic first upgrades: Supabase Pro $25/mo and Cloudflare Workers paid $5/mo, so about **$30/month**; Resend Pro $20/mo only above 100 alert emails a day. Prices change; check each vendor's page.

## 11. Where things are
`ROADMAP.md` (status and open work) · `BACKEND-PLAN.md` (reasons for each tool) · `backend/README.md` (database and importer details) · `ClientRequirements.pdf` (what the client must send) · `remainingthings.md` (everything still needed to hand over, with set-up steps) · `CLAUDE.md` (rules for AI assistants working in the repo).
