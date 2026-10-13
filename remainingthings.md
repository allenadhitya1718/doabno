# Everything still needed to hand DOABNO over

Written 2026-10-13. Everything that could be built without outside accounts, papers or decisions **has been built and tested**. What is left is accounts to open, papers to collect, switches to flip, and a few things deliberately not built. This list is in the order to do them. Tick the box when done.

**Who** column: **Client** = the company (papers, approvals, payment) · **Owner** = whoever will own the technical accounts · **Dev** = the developer / Claude session · **Anyone** = a person following the steps.

Companion files: `HANDOVER.md` (how it all works and everyday jobs) · `ClientRequirements.pdf` (the one-page list sent to the client) · `ROADMAP.md` (status) · `backend/README.md` (database details).

---

## 0. The shortest path to launch

| # | What | Who | Blocks launch? |
|---|---|---|---|
| 1 | Client sends the papers in section 1 | Client | Yes |
| 2 | Open the accounts in section 2 (domain, Cloudflare, Resend, GitHub secrets) | Owner | Yes |
| 3 | Run the 6 database files and make the first owner (section 3) | Owner | Yes |
| 4 | Get real feeds and links (section 4); approvals take weeks | Dev + Client | Yes (for real prices) |
| 5 | Legal approval (section 7) | Client | Yes |
| 6 | Deploy the click function and switch it on (section 5.6) | Owner / Dev | Yes (for earning) |
| 7 | Launch-day checklist (section 9) | Everyone | |

Without 4, the site runs on demo prices. It can still be shown to the client.

---

## 1. Papers and information from the client
No work on their side except sending and signing. Full wording is in `ClientRequirements.pdf`.

- [ ] Company legal name, trade name, commercial registration number (copy), VAT / tax number, registered address *(Client)*
- [ ] Authorized signatory: name, title, email, phone (will e-sign affiliate terms) *(Client)*
- [ ] Signed authorization letter allowing us to apply and manage affiliate and store accounts for the company *(Client; Dev prepares the template)*
- [ ] Bank details for commission payouts: bank, account holder, IBAN, SWIFT, currency; any tax form a program asks for *(Client)*
- [ ] Anything already held: affiliate accounts, store contacts, agreements, stores that must be listed *(Client)*
- [ ] Saudi legal adviser: name and contact, then their **written** answer on storing user data in Frankfurt (section 7) *(Client)*
- [ ] Approval or edits of the legal texts: privacy, terms, disclaimer, cookies, affiliate disclosure *(Client)*
- [ ] A named contact for privacy requests (answers within 30 days) *(Client)*
- [ ] The domain name wanted, and permission to register it in the company's name, with a billing contact *(Client)*
- [ ] The email address that will own the technical accounts *(Client)*
- [ ] Admin users: name, email, role (owner / catalog / partners / analyst) *(Client)*
- [ ] Approval of the final screens and Arabic wording; About us text if different from the draft *(Client)*
- [ ] Decisions: which Gulf markets next; native app or installable web app enough; SMS needed or not (section 5.7) *(Client)*

---

## 2. Accounts to open and set up
Use the shared company email as the owner of every account, switch on two-step login (2FA) on all of them, and keep passwords in a company password manager.

### 2.1 Domain name *(Owner, about 15 minutes, about $10 to $15 a year)*
- [ ] Register the domain in the **company's** name (Cloudflare Registrar is simplest if you use Cloudflare for hosting; any registrar works).
- [ ] If registered elsewhere, point its name servers to Cloudflare (Cloudflare gives you two name servers when you add the site).
- [ ] Decide: `www.domain` redirects to `domain` (or the reverse); set that in Cloudflare (Rules, Redirect Rules).

### 2.2 Cloudflare: hosting *(Owner, about 30 minutes, free; $5/month only if traffic needs it)*
1. [ ] Create a Cloudflare account (company email) and **Add a site** with the domain.
2. [ ] Workers & Pages, **Create**, **Pages**, **Connect to Git**, pick the GitHub repo `allenadhitya1718/doabno` (allow Cloudflare to read it).
3. [ ] Settings for the project:
   - Production branch: `main`
   - Build command: `node scripts/build-site.js`
   - Build output directory: `dist`
   - No environment variables needed (the Supabase address and public key are inside `config.js` by design).
4. [ ] **Custom domains** on the project: add the domain (and `www`). Cloudflare issues the HTTPS certificate by itself.
5. [ ] First deploy runs automatically. Check three addresses: `https://domain/` (website), `/app/` (app), `/admin/` (admin portal, sign in as the owner).
6. [ ] Optional: turn on **Web Analytics** (free, no cookies) for visitor numbers; **Rules, Redirect Rules** for `www`; **Security, Bots** basic protection.
7. [ ] Preview deployments (other branches) are on by default; leave them on for testing, or restrict them to the team under Access.
- Every push to `main` now redeploys the site in about a minute. The code that is hosted is whatever is on `main`.
- *Vendor screens change; if a label differs, look for the same idea.*

### 2.3 Resend: email *(Owner, about 45 minutes including DNS, free: 100 emails a day, 3,000 a month)*
Two jobs: price-drop alert emails (sent by the importer job), and sign-up / confirmation emails (sent by Supabase through Resend's SMTP).
1. [ ] Create a Resend account (company email).
2. [ ] **Domains, Add domain**: use the company domain (or a sub-domain such as `mail.domain`). Resend shows 3 to 4 DNS records (SPF, DKIM, optionally DMARC). Add them in Cloudflare DNS exactly as shown, set the proxy to **DNS only** (grey cloud), then press Verify. Verification can take minutes to hours.
3. [ ] **API Keys, Create**: name `doabno-alerts`, permission **Sending access**, domain restricted to yours. Copy the key once; it is shown only once.
4. [ ] Decide the sender address, for example `DOABNO <alerts@domain>` (must be on the verified domain).
5. [ ] GitHub secrets (section 2.4): `RESEND_API_KEY` = the key, `ALERT_FROM` = the sender, `SITE_URL` = the website address (for example `https://domain`).
6. [ ] **Supabase sign-up emails through Resend:** Supabase, Authentication, Emails / SMTP settings, **enable custom SMTP**:
   - Host `smtp.resend.com`, Port `465` (or `587`)
   - Username `resend`, Password = a Resend API key (create a second key named `doabno-supabase-auth`)
   - Sender email `no-reply@domain`, sender name `DOABNO`
   Without this, Supabase's built-in sender allows only a few emails an hour and sign-ups will stall.
7. [ ] Supabase, Authentication, Email Templates: edit the **Confirm signup** (and Reset password) text, bilingual if wanted, so it says DOABNO and not "Supabase". Keep the `{{ .ConfirmationURL }}` link.
8. [ ] Test: create a new account on the live site, check the email arrives (and is not in spam), click the link, confirm you land signed in.
9. [ ] Test alerts: set a price alert with email and consent ticked, then run `node backend/importer/cli.js alerts --dry true` (shows who would be emailed), then the real run (section 4.4).
- Above 100 alert emails a day: Resend Pro $20/month, or lower `ALERT_MAX_EMAILS`.

### 2.4 GitHub *(Owner, about 20 minutes, free)*
1. [ ] Make sure the repo belongs to the company (or an organization the company owns), not a personal account. Transfer if needed (Settings, Danger zone, Transfer).
2. [ ] Invite the people who will maintain it; everyone uses 2FA.
3. [ ] **Merge `redesign-v2` into `main`** (done on 2026-10-13; repeat for later work). Scheduled jobs and the hosted site run from `main`.
4. [ ] Settings, Secrets and variables, **Actions**, add these **repository secrets** (names exactly):

| Secret | Value | Used by |
|---|---|---|
| `SUPABASE_URL` | the project URL | daily import |
| `SUPABASE_SERVICE_KEY` | Supabase, Settings, API Keys, the **secret** key | daily import, alerts |
| `RESEND_API_KEY` | from 2.3 | alert emails |
| `ALERT_FROM` | `DOABNO <alerts@domain>` | alert emails |
| `SITE_URL` | `https://domain` | links in emails |
| `SUPABASE_DB_URL` | Supabase, Settings, Database, Connection string, **Session pooler** | weekly backup |
| `BACKUP_PASSPHRASE` | a long random phrase, saved in the password manager | weekly backup |
| one per store feed key, for example `NOON_FEED_KEY` | the store's feed login | daily import (also add it to the `env:` list in `.github/workflows/import-feeds.yml`) |

5. [ ] Actions tab: run **"Back up database"** by hand once (Run workflow) and confirm it ends green with an artifact `database-backup`.
6. [ ] Optional: branch protection on `main` (require a pull request); turn on Dependabot alerts.
- Never put these values in the repo, in `config.js`, or in chat.

### 2.5 Supabase *(Owner, about 30 minutes)*
Already created (project `hmanlftkhvruqgvkencn`, Frankfurt, free). To finish:
1. [ ] **Ownership:** make sure the project sits in an organization owned by the company; add the technical people as members; 2FA on.
2. [ ] **SQL Editor:** run `backend/supabase/migrations/0001` to `0007` in order, then the two seed files only if demo data is wanted. Done so far: 0001 to 0004. **Still to run: `0005_alerts.sql`, `0006_click_stats.sql` and `0007_admin_people.sql`.**
3. [ ] **First owner:** after that person signs up on the website, run the SQL in `backend/README.md` ("Making the first admin"). Done once for the current owner account.
4. [ ] **Authentication, URL Configuration:** Site URL = `https://domain`; Redirect URLs = `https://domain/**` and `https://domain/app/**` (keep the localhost ones only while testing).
5. [ ] **Authentication, Providers, Email:** keep **Confirm email ON** for launch.
6. [ ] **Sign-up protection:** Authentication, Attack Protection: turn on CAPTCHA (Cloudflare Turnstile, free) and set sensible rate limits. *(If CAPTCHA is turned on, the sign-up forms need the Turnstile widget added: a small change for the Dev.)*
7. [ ] **Password rules:** minimum length 8 or more; "leaked password protection" is a Pro feature.
8. [ ] **Plan:** free is fine to launch; move to **Pro ($25/month)** when any of these happen: the project pauses after a quiet week, the 500 MB database is nearly full, or you want automatic daily backups. Pro also removes the pausing.
9. [ ] **Keep it awake on the free plan:** a free uptime check (for example UptimeRobot) opening the website every few hours.
10. [ ] **Privacy paperwork:** from the Supabase dashboard (Legal / account settings) sign the **Data Processing Agreement (DPA)**; keep a copy for the lawyer (section 7).
11. [ ] Check **Advisors** (Security and Performance) after any database change; fix anything marked red.
12. [ ] Do a **restore test once** (`HANDOVER.md` section 6) on a throwaway project.

---

## 3. First-time database steps (checklist form)
- [x] Project created, 0001 to 0004 and seed data loaded, catalog connected to all three pages.
- [ ] Run `0005_alerts.sql` (price-drop alerts).
- [ ] Run `0006_click_stats.sql` (real traffic in the admin).
- [ ] Run `0007_admin_people.sql` (admin: suspend, delete and export shopper accounts; privacy requests record the market). Run it before the admin's Users and Privacy pages are used live.
- [ ] Remove demo data when real feeds are in (decide with the client; the demo catalog is only there so the screens are not empty).

---

## 4. Real store data: feeds, links, approvals

### 4.1 Applications *(Dev prepares and submits for the client; approvals take weeks)*
- [ ] **Noon:** affiliate programme (UAE / KSA). Apply through Noon's affiliate page or a network that carries it. Terms found online vary (rates and tracking by coupon or link); confirm the real terms in the approval email.
- [ ] **Affiliate network** such as Awin or Admitad (whichever the client prefers or is approved): apply, then apply to each store's programme inside it.
- [ ] **Amazon Associates**, one account **per country** (amazon.sa, amazon.ae, amazon.com, amazon.co.uk). Amazon's product API changed in 2026 (the Creators API replaces the old one; reported rule: a minimum number of qualifying sales in 30 days). Confirm current rules on Amazon's site before building on it. Plan for Amazon to come last.
- [ ] Direct feeds from stores that offer one.
- [ ] Record each approval: store, login, feed address, tracking-link format, payment terms (commission or per click).

### 4.2 Turn a feed on *(Dev, per store, about 30 minutes)*
1. [ ] In Admin, Stores, add the store (market, categories, cost per click).
2. [ ] Add the feed row in the SQL Editor (template in `HANDOVER.md`, section 5): store id, format (`xml`, `csv`, `json`, `google_merchant`), schedule, address with `${KEY_NAME}` for any login.
3. [ ] Add the key as a GitHub secret and to the `env:` list in `import-feeds.yml`.
4. [ ] Try the file first without saving anything: `node backend/importer/cli.js dry-run --file feed.csv --format csv --store <store-id>` and read the rejected-items list.
5. [ ] Run the import from GitHub, Actions, "Import store feeds", Run workflow. Check Admin, Store feeds: status, items, rejected.
6. [ ] Items are matched to products **by barcode (EAN/GTIN)**. Items with no match go to the rejected list. Decide how new products get created (today products are added from the demo catalog or by SQL; a "create product from feed" tool is **not built**).
7. [ ] Store links: the importer saves each item's link in `offers.url`. Without a link, "Visit store" cannot redirect.

### 4.3 Product photos and logos
- Demo photos come from Unsplash and store logos from a favicon service. For launch use images from the store feeds (check the network's terms allow showing them) or the company's own, and licensed brand logos. *(Client + Dev)*
- [ ] Replace demo photo and logo sources before launch.

### 4.4 Alert emails, first live run
- [ ] After 2.3 is done and at least one real alert exists: `node backend/importer/cli.js alerts` (needs the three variables set on that computer) or let the daily job do it.

---

## 5. Switches and optional features

### 5.1 Content-Security-Policy and headers
Already in the hosting build. Re-test after any new outside service is added (for example Turnstile, analytics): its address must be allowed in the policy in `scripts/build-site.js`.

### 5.2 Role rules
Done and tested. Owners add team members in Admin, Settings, Team (the person signs up on the website first).

### 5.3 Google sign-in *(Owner + Dev, about 1 hour, free)*
1. [ ] Google Cloud Console: create a project, set up the **OAuth consent screen** (app name DOABNO, support email, the domain, privacy-policy and terms links).
2. [ ] Credentials, **Create OAuth client ID**, type Web application. Authorized redirect URI: `https://hmanlftkhvruqgvkencn.supabase.co/auth/v1/callback`.
3. [ ] Copy the client ID and secret into Supabase, Authentication, Providers, **Google**, enable.
4. [ ] In the three `assets/config.js` files set `socialLogin: ['google']` (add `'apple'` later), commit, push. The buttons appear in the website dialog and the app profile.
5. [ ] Test sign-in end to end.

### 5.4 Apple sign-in *(Client company + Dev, needs Apple Developer Program, $99/year)*
1. [ ] Enrol the company in the Apple Developer Program.
2. [ ] Create an **App ID**, a **Services ID** (the web login), and a **key** with Sign in with Apple; note Team ID, Key ID, Services ID.
3. [ ] Return URL: `https://hmanlftkhvruqgvkencn.supabase.co/auth/v1/callback`; add the domain.
4. [ ] Supabase, Providers, **Apple**: enter the IDs and key. Apple client secrets expire every 6 months at most: put a reminder in the calendar to renew it.
5. [ ] Add `'apple'` to `socialLogin` in `config.js`.

### 5.5 Installable web app and push notifications *(not built; optional)*
- **Installable app** (home-screen icon): needs a web manifest and a small service worker (about a day of work). The page already works on phones.
- **Push notifications:** OneSignal free plan covers mobile push up to 1,000 monthly users. Needs an account, the manifest above, and code to ask permission and send the same price-drop messages. About 2 days. *Decide with the client whether it is wanted for launch.*

### 5.6 Click tracking *(Owner, about 20 minutes, free)*
1. [ ] Supabase, Edge Functions, create function `go` from `backend/supabase/functions/go/index.ts`, **JWT verification off**; or in a terminal from the `backend` folder: `supabase functions deploy go` (settings file included).
2. [ ] Function secrets: `CLICK_SALT` (any long random text) and `SITE_URL` (`https://domain`).
3. [ ] In the three `config.js` files set `clickOutUrl: 'https://hmanlftkhvruqgvkencn.supabase.co/functions/v1/go'`, commit, push.
4. [ ] Test with an offer that has a store link: click "Visit store", you should land on the store, and Admin, Clicks and revenue should show the click (zero before real clicks).
5. [ ] This is also what earns commission, so test it with each network's own tracking link format.

### 5.7 SMS *(not built; no feature uses SMS today)*
Two possible uses, both **optional** and not needed for launch:
1. **Sign in or verify by phone number (one-time code).** Supabase supports phone login through a message provider (Twilio, MessageBird, Vonage or similar). Needs: a provider account; for Saudi numbers, a registered **sender ID** (registration with the telecom regulator and operators needs company papers and can take weeks; check the provider's current Saudi rules); Arabic message templates; per-message cost (check the provider's price list). Build work: a phone field, the code step, and an account setting. About 3 to 4 days.
2. **SMS price alerts** (instead of or as well as email). Needs the same provider and sender-ID registration, a phone number stored with consent, an opt-out ("STOP") handling, and a sender next to the email sender in `backend/importer`. About 2 to 3 days.
- **Recommendation:** launch without SMS (email and later push cover alerts, and email sign-up works). Add SMS only if the client asks, because it adds recurring cost and a registration wait.
- If wanted: [ ] choose a provider; [ ] start sender-ID registration early; [ ] confirm consent wording with the legal adviser (SMS marketing has its own rules in Saudi Arabia).

### 5.8 Native iOS and Android apps *(not built)*
The `app-v2` folder is a phone-sized web prototype. Store apps need Apple ($99/year) and Google ($25 once) developer accounts in the company's name, plus about 3 weeks of work (Expo / React Native on the same database). Decide with the client; an installable web app (5.5) may be enough.

---

## 6. Developer follow-ups (not blocking, in rough priority)
- [ ] **Search-engine visibility:** page addresses use `#/`, so Google cannot index product pages. Fix = move the website to a server-rendered framework (Next.js) with clean addresses, a sitemap, and the existing structured data. About 3 weeks; the biggest remaining piece.
- [ ] **Create products from feeds:** a tool to turn unmatched feed items into new products (with review).
- [ ] **Remove inline scripts and styles** so the Content-Security-Policy can be strict (`unsafe-inline` removed).
- [ ] **CAPTCHA widget** on sign-up and the privacy-request form (see 2.5 item 6).
- [ ] **Hourly price refresh:** move the importer from the free daily GitHub job to a small always-on worker (about $5 to $10 a month, about a day).
- [ ] **Other Gulf markets** (Qatar, Kuwait, Bahrain, Oman): add the market rows, stores, feeds, currency; about a week each.
- [ ] **Settings back end:** the admin's Settings tabs other than exchange rates, popular searches and team (markets, notifications, site content, app links, maintenance, affiliate tags, security) are saved in the browser only. Needs a settings table and the site reading it. Note: the affiliate tags and tracking settings there should drive real link building once feeds exist.
- [ ] **Alert history screen** (who was emailed and when) for support.
- [ ] **Monitoring:** free uptime check, Supabase advisors monthly, GitHub Actions failure emails to the team.
- [ ] **Keep the figma screenshot folders** in step with design changes if the client still reviews in Figma (they were not updated for the live-data versions; the capture tool needs a demo-data mode first).

---

## 7. Legal and privacy *(Client + legal adviser; blocks a public launch)*
- [ ] Written advice from a Saudi legal adviser on storing user data outside the Kingdom (Saudi PDPL applies to Saudi residents' data wherever stored). Give them: what is stored (email, name, favorites, alerts, consent times), where (Frankfurt, Supabase and its sub-processors), and the DPA from 2.5 item 10.
- [ ] If Saudi hosting is required: the personal-data tables are separate (`profiles`, `favorites`, `alerts`, `privacy_requests`, Supabase login) and can move to a Saudi-hosted database or self-hosted Supabase.
- [ ] Final, approved texts: privacy policy, terms of use, disclaimer, cookie policy, affiliate disclosure, legal notice (imprint). Today's texts are placeholders.
- [ ] Named privacy contact; a process to answer requests within 30 days (they land in `privacy_requests`).
- [ ] Cookie consent: the banner exists; confirm categories with the adviser.
- [ ] Affiliate disclosure visible near "Visit store" (a short sentence is in the footer today).
- [ ] Marketing consent: emails go only to people who ticked the box; keep the recorded consent times.

---

## 8. Money: monthly and yearly
| Item | At launch | Later |
|---|---|---|
| Domain | about $10 to $15 a year | same |
| Supabase | $0 | $25/month (Pro) |
| Cloudflare hosting | $0 | $5/month if needed |
| Resend email | $0 (100/day) | $20/month above that |
| GitHub | $0 | $0 |
| Apple / Google developer | not needed | $99/year and $25 once, only for store apps or Apple sign-in |
| SMS | not used | per message, provider's price list |
| OneSignal push | not used | free up to 1,000 monthly users |
Prices come from third-party pages and change: confirm on each vendor's page.

---

## 9. Launch-day checklist
1. [ ] All seven migrations run; first owner can sign in at `/admin/`.
2. [ ] `main` holds the final code; Cloudflare deploy is green; domain and HTTPS work for `/`, `/app/`, `/admin/`.
3. [ ] `config.js` has the live Supabase address and public key (no secret key anywhere; the build refuses one).
4. [ ] Sign-up with a fresh email: confirmation email arrives, link signs you in, favorites and an alert save, sign-out and back in restores them.
5. [ ] Price alert with email consent: dry run lists it; real run sends one email; a second run sends none.
6. [ ] Privacy request form saves a row; the owner can read it; "Delete my account" works.
7. [ ] Admin: edit a product, hide it, check it vanishes from the site; pause a store; add a coupon; roles checked with a non-owner account.
8. [ ] At least one real feed imported with a sensible rejected list; a "Visit store" click is recorded and lands on the store.
9. [ ] Backup workflow green; a restore tested on a throwaway project.
10. [ ] Legal texts approved and published; privacy contact named.
11. [ ] Uptime check running; team knows where errors show (GitHub Actions emails, Supabase advisors).
12. [ ] Passwords and the backup passphrase stored in the company password manager; ownership of every account confirmed in the company's name.

## 10. After launch (monthly)
- [ ] Check Admin, Store feeds: errors and rejected counts; ask the store about any broken feed.
- [ ] Check Supabase: database size, advisors, plan limits.
- [ ] Renew anything that expires: Apple sign-in secret (6 months), domain, affiliate approvals still active.
- [ ] Review privacy requests and any unanswered ones.
- [ ] Read the Admin activity log for unexpected changes; remove admins who left.
