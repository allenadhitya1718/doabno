<div dir="rtl">

**ملخص بالعربية.** العقد يشترط أن تكون كل حسابات الاستضافة والنطاق والمتاجر (App Store وGoogle Play) والواجهات البرمجية باسم العميل، وأن تكون الشيفرة على GitHub أو GitLab الخاص بالعميل. هذه الوثيقة هي خطة النقل. الترتيب المقترح: (1) ينشئ العميل حسابات الشركة أولًا (GitHub منظمة، Supabase منظمة، Cloudflare، Apple Developer، Google Play، Firebase/Google Cloud، Resend). (2) نقل المستودع. (3) نقل مشروع Supabase مع أخذ نسخة احتياطية قبلها وعدم إيقاف المشروع. (4) Cloudflare والنطاق. (5) Firebase. (6) حسابا Apple وGoogle Play (الأطول زمنًا، ويُبدآن مبكرًا). (7) Resend ومفتاح Gemini وحسابات الأفلييت (تُنشأ جديدة غالبًا ولا تُنقل). بعد كل نقل تُحدَّث الأسرار والإعدادات المذكورة هنا. أي بند موسوم "غير موثّق" لم نتحقق منه من وثائق رسمية ويجب التأكد منه قبل التنفيذ.

</div>

# DOABNO: moving every account into the client's name

Written 2026-11-06. Contract rule: all hosting, domain, app store and API accounts are in the client's name, and the source code is on the client's GitHub or GitLab. This is the plan to get there without breaking the live site, the apps or the daily jobs.

Status marks: **Verified** = read in the vendor's official documentation (linked). **Unverified** = from experience or inference; check the vendor's current page before acting.

## 0. Principles

1. **The client creates the accounts first** (company email, company details, company payment card). We never create accounts for them with a personal email and never handle their passwords. Anything that needs the client's identity (Apple D-U-N-S, Saudi commercial registration, ID checks, payment cards) is done by the client personally.
2. **Order matters** because of dependencies: GitHub holds the secrets that run the jobs, Supabase holds the data, Cloudflare serves the site, and the apps point at Supabase and Firebase. Follow section 1.
3. **Backup before every move.** Run the `Back up database` workflow and download the artifact; keep the `BACKUP_PASSPHRASE` safe. Note the current secret *names* and where each value comes from (values are never written down in the repo).
4. **One move per day**, with a smoke test after each (site loads, search works, sign-in works, admin loads, one import run is green).
5. Until every step is done, keep a second owner (our side) on each account, then remove ourselves last (section 11).

## 1. Order of work

| # | Step | Who acts | Client must have first | Typical time |
|---|---|---|---|---|
| 0 | Company email addresses, a password manager, company card | Client | - | day 0 |
| 1 | Start **Apple Developer** (organisation) and **Google Play** (organisation) enrolment | Client (identity checks) | D-U-N-S number for Apple, CR, authorised signatory | days to weeks, so start first |
| 2 | GitHub organisation, then repository transfer | Client creates; we (repo admin) start; client accepts | GitHub account and an organisation | 1 hour |
| 3 | Re-add GitHub secrets | Client (values) with us | Step 2 | 1 hour |
| 4 | Supabase organisation, then project transfer | Client creates org; we start the transfer | Supabase account, org (Pro plan advised) | 1 hour |
| 5 | Cloudflare account, Pages project, domain | Client creates; shared work | Cloudflare account; registrar login for the domain | 1 to 2 hours |
| 6 | Firebase / Google Cloud project | Client adds as Owner; we step down | Google account of the company | 30 min |
| 7 | Apple app transfer or re-publish | Client's Account Holder + ours | Step 1 finished | days |
| 8 | Google Play | Client + ours (Google support) | Step 1 finished | days |
| 9 | Resend, Gemini, affiliate accounts | Client creates; we configure | See sections 8 to 10 | varies |
| 10 | Remove our access, rotate keys | Client + us | Everything above | 1 hour |

## 2. GitHub: repository `allenadhitya1718/doabno`

**What the docs say (verified, [GitHub: transferring a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository)):** you need admin rights on the repo; for an organisation target you need permission to create repositories there; the target must not already have a repo of that name; links and `git` remotes of the old address redirect (until someone creates a new repo at the old address); the old owner stays a collaborator; webhooks and deploy keys stay associated; a private repo moved to a Free plan owner loses some features (protected branches, Pages). The page says that secrets "remain associated" with the transferred repository.

**Do not trust this blindly (unverified):** in practice, check Settings > Secrets and variables > Actions on the new repository straight after the transfer. If anything is missing (or if the client prefers a clean start), re-add the names below. Re-adding is also a good moment to **rotate** every key (section 12), so the previous owner's copies stop working.

Steps:
1. Client creates a GitHub organisation (for example `doabno`) on a plan that supports private repos with protected branches (Team) if wanted.
2. Back up: `git clone --mirror` of the repo, and download the latest `Back up database` artifact.
3. Current owner: repo Settings > General > Danger Zone > Transfer ownership > the client's organisation. The client's organisation owner accepts.
4. Update every local clone: `git remote set-url origin https://github.com/<client-org>/doabno.git`.
5. Check Actions are enabled, branch `main` is still the default, and `redesign-v2` exists.
6. Re-check the **secrets and variables** (names only; values come from the original source):
   - Database and jobs: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_DB_URL`, `BACKUP_PASSPHRASE`
   - Alert emails: `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL`
   - Feeds: any `FEED_*` key (for example `FEED_NOON_KEY`)
   - iPhone: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, `APNS_KEY_P8`, `APNS_KEY_ID`; variable `BUNDLE_ID` (`com.doabno.app`)
   - Android: `GOOGLE_SERVICES_JSON_B64`, `FCM_SERVICE_ACCOUNT_JSON`, and later `ANDROID_KEYSTORE_B64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`
7. Run `Import store feeds` and `Back up database` by hand once. Both must be green.

**What breaks if done wrong:** scheduled jobs (daily import, price alerts, push, weekly backup) fail silently if secrets are missing; the weekly backup is the only safety net on the Free Supabase plan. The workflows only run from `main`. If the old repo name is reused for a new repository, GitHub's redirects are deleted. Do **not** also transfer while someone has uncommitted work in a claimed area (see `ROADMAP.md`).

## 3. Supabase: project `jturenubwqxzesjlyjpi` (Singapore)

**Docs (verified, [Supabase: transfer a project](https://supabase.com/docs/guides/platform/project-transfer)):** start from the project's general settings; you must be an **owner of the source organisation** and at least a **member of the target organisation**; the project must have **no active GitHub integration**, no project-scoped roles and no log drains; the source organisation is billed up to the transfer, the target afterwards; moving from a paid plan to Free may cause 1 to 2 minutes of downtime and loss of paid features; a Free organisation can hold only two projects; your rights afterwards depend on your role in the target organisation; a transfer does **not** change region. The page does not say what happens to API keys or custom domains: treat as unverified and test.

Steps:
1. Client creates a Supabase account and an organisation in the company name; plan **Pro** (the Free limit of two projects, no daily backups, and pausing after inactivity are all unsuitable for production). Add our person to that organisation as a member (Owner role makes the later steps easier; remove after).
2. **Backup first:** run `Back up database`, download the artifact, and also record `select count(*)` of `products`, `offers`, `profiles`, `settings`.
3. **Keep the project active.** Do not pause it before, during or after the transfer (a pause stops the site and the daily jobs, and restoring a paused project is not instant).
4. Project Settings > General > Transfer project > choose the client's organisation.
5. After the transfer, check that **the project URL and the publishable key did not change**. If they did, update `assets/config.js` in all three folders and `SUPABASE_URL` in GitHub, then redeploy the site (section 4). The service key is unverified: after the transfer open Settings > API Keys; if the old key still works, rotate it anyway (section 12).
6. Re-check Authentication > URL Configuration (Site URL `https://doabno.com`, redirect URLs), custom SMTP (Resend), Edge Function secrets (`CLICK_SALT`, `SITE_URL`, `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, `GEMINI_MODEL`) and that functions `go` and `identify` are still deployed with JWT verification off.
7. Smoke test: open the site, search, sign in, open admin, run `Import store feeds`.

**What breaks if done wrong:** pausing the project; changing region (this needs a different, much heavier migration); leaving the GitHub integration connected (the transfer is refused); moving to a Free organisation that already has two projects. The legal adviser's view on where data is stored (Singapore) should be settled before real users sign up, because moving region later means a dump and restore into a new project.

## 4. Cloudflare Pages and the domain

**Docs (verified, [Cloudflare Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)):** an apex domain used with Pages must be a **zone on the same Cloudflare account** as the Pages project; subdomains only need a CNAME to the `*.pages.dev` address. The page says nothing about moving a Pages project between accounts: **unverified**, assume it cannot be moved.

Plan (create-new, not move):
1. Client creates a Cloudflare account (company email) and adds the domain `doabno.com` as a zone: either **transfer the registration** to the client's registrar account first (if the domain is registered under our name or a personal name: ask the registrar for the authorisation (EPP) code; the client accepts at their registrar), or at minimum **change the registrant to the client**.
2. Point the registrar's nameservers to the client's Cloudflare zone (the domain stays online during this if the DNS records are copied first).
3. In the client's Cloudflare account, create the Pages project `doabno`, and deploy from the repo (the client or we, once the repo is transferred and `wrangler login` is done in the client's account):
   ```
   node scripts/build-site.js
   npx wrangler pages deploy dist --project-name doabno --branch main
   ```
4. Add the custom domain `doabno.com` (and `www`) to the new project; wait for the certificate.
5. Update everything that mentions the old `doabno.pages.dev` address: GitHub `SITE_URL`, Supabase function secret `SITE_URL`, Supabase Site URL and redirect URLs, affiliate applications. Delete the old project **only after** the new one has served traffic for a few days.

**What breaks if done wrong:** an old Wrangler login on the developer's computer keeps deploying to the old account; email records (MX, SPF, DKIM for Resend) are lost if DNS is not copied before switching nameservers; Supabase sign-in links fail if the redirect URLs still point to the old address.

## 5. Firebase project `doabno-84332`

Used for Android push (FCM). Secrets involved: `GOOGLE_SERVICES_JSON_B64`, `FCM_SERVICE_ACCOUNT_JSON`. The Firebase documentation page I checked did not describe ownership transfer, so everything here is **unverified**; confirm in Firebase console > Project settings > Users and permissions, and Google Cloud console > IAM.

Plan:
1. Client creates a company Google account (or Google Workspace) and opens the Firebase console once.
2. Current owner adds the client's account as **Owner** of the project (Firebase Project settings > Users and permissions, or Google Cloud IAM). Project ID and app registrations stay the same, so `google-services.json` and the Android app keep working with no rebuild.
3. Client sets billing (Firebase push works on the free Spark plan; Blaze only if other paid features are added).
4. Optionally create a **new service account key**, update `FCM_SERVICE_ACCOUNT_JSON`, delete the old key (section 12).
5. Current owner removes themselves last.

**What breaks if done wrong:** deleting the project or its service account stops Android push; a new Firebase project would need a new `google-services.json`, a new app build and new tokens on every phone. For iPhone push via APNs, no Firebase project is needed.

## 6. Apple Developer and App Store Connect (iPhone app, bundle id `com.doabno.app`)

Likely situation: the app was uploaded to TestFlight under a developer account that is not the client's. Two routes:

- **Route A (recommended if the account is only a test account): re-publish under the client's account.** The client enrols as an organisation, we create the App ID `com.doabno.app` there, create new keys, set GitHub secrets `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, `APNS_KEY_P8`, `APNS_KEY_ID`, run `iOS to TestFlight`. Needs the bundle id to be free (it cannot be in two accounts). If the old account holds it, delete the app record or transfer it (route B) first.
- **Route B: App Store Connect app transfer.** **Verified** ([Apple: overview of app transfer](https://developer.apple.com/help/app-store-connect/transfer-an-app/overview-of-app-transfer)): the Account Holder of the sending team starts it and the Account Holder of the receiving team accepts; back up everything first, the app is removed from the sender's account; before starting, **turn off beta testing and remove all builds and testers from TestFlight**, and clear Test Information; the app keeps its bundle id; APNs *certificates* stay valid until they expire, but if you use APNs *keys* the recipient generates or reuses a key and the servers (our `APNS_KEY_P8`/`APNS_KEY_ID`) must be updated; with Sign in with Apple, transfer identifiers must be generated per user (not used yet: social sign-in is off). Full criteria are on Apple's "App transfer criteria" page (not read in full: **unverified** for paid-agreement and other eligibility conditions).

Steps for the client first: enrol as an **organisation** (needs a D-U-N-S number, legal entity status and the authority to sign; Apple verifies by phone), accept agreements, add the second Account Holder contact. Create the APNs key (Keys > + > Apple Push Notifications service). Note: Apple allows two APNs keys per team; the existing team reached that limit (see memory note), which is a reason to use a fresh client team.

**What breaks if done wrong:** pushing a TestFlight build with testers still attached blocks the transfer; sending push with the old key after transfer silently stops iPhone notifications; users on TestFlight must be re-invited after route A.

## 7. Google Play Console (Android app)

Play is not set up yet, so the cleanest path is that **the client creates the developer account in the company name from the start** (organisation account, US$25 once, verification with D-U-N-S and identity). Then there is nothing to transfer: we only generate the signing key, store the four `ANDROID_*` secrets in GitHub and upload the signed bundle from the `Android build` workflow.

If an app was already created under another account: **Verified** ([Google Play: transfer app ownership](https://support.google.com/googleplay/android-developer/answer/6230247)): both accounts must be active and compliant; you need each account's registration transaction ID; Google support handles the request (about two business days) after the target owner approves; closed-testing groups do not transfer and must be recreated; Firebase links, Google Cloud ownership and Analytics permissions do not transfer automatically; reports and earnings history stay with the old account; target needs a payments profile for paid apps. Keep the upload key and the Play App Signing details safe: losing them means a key-reset request.

## 8. Resend (alert emails)

Not created yet. The client creates it with a company email, adds the domain `doabno.com`, publishes the DNS records Resend shows (SPF, DKIM) in the client's Cloudflare DNS, and creates an API key. We then set GitHub secrets `RESEND_API_KEY`, `ALERT_FROM`, `SITE_URL` and Supabase custom SMTP. Nothing to transfer. **Unverified:** Resend has no account-transfer feature we know of, so always create it in the client's name directly. What breaks if skipped: price-drop emails stay off (push still works) and Supabase's built-in email is limited to a few messages an hour.

## 9. Gemini key (photo search)

Two free keys exist (`GEMINI_API_KEY`, `GEMINI_API_KEY_2`, model `GEMINI_MODEL`), which are limited to 20 requests per model per day. The client creates a Google AI Studio / Google Cloud project with billing in the company name, creates a paid key, and we replace the `GEMINI_API_KEY` secret in Supabase (no code change). Delete the old keys. What breaks: nothing if replaced in order (new key first, then delete old); photo search shows errors once the free quota is used.

## 10. Affiliate and store accounts

These are registered **under the client's company**, not transferred, because most programmes forbid transferring accounts and tie payouts to the registered entity (**unverified** per programme; read each programme's terms).

| Programme | Current state | Client action | Our action |
|---|---|---|---|
| noon | Joined 2026-11-06 under organisation **JEC** with Fahad Alkhalaf (affiliate id `AFF7afd47407a73`, project `PRJ651175`) | Decide whether DOABNO's own legal entity should hold the account instead of JEC; if yes, apply again in the company name, with payout documents (ID, bank) | Ask `affiliate.support@noon.com` whether an account can be moved to another entity, and for the product feed and written permission to use noon's name and logo |
| Amazon Associates (amazon.sa) | Pending | Client's company applies, sale history, tax and bank details | Add the tracking tags in admin settings |
| Awin (incl. ShareASale), CJ | Pending | Client's company signs up, signatory, payout details | Request feeds, configure `feeds` rows |

What breaks if done wrong: commission goes to the wrong legal entity (hard to recover); links built under a personal ID keep paying the wrong party; changing the tracking id breaks old links already live in `offers`, so ask each network whether old links keep working.

## 11. Final access clean-up

1. Client confirms they can sign in to every account with their own credentials and have two owners each.
2. Remove our personal accounts as owners from GitHub, Supabase, Cloudflare, Firebase, Apple, Google Play (keep a support role only if the client wants a maintenance contract, with written scope).
3. Remove saved logins on our computers (`npx wrangler logout`, `supabase logout`, GitHub CLI `gh auth logout`).
4. Update `HANDOVER.md` and `docs/HANDOVER-ar.md` (account owners, addresses).

## 12. Rotate keys at the end

After the last move, rotate every key that the previous owner could have copied: Supabase service key, Resend key, Gemini keys, `CLICK_SALT` (changing it only changes visitor hashes), `BACKUP_PASSPHRASE` (keep the old one until old backups are no longer needed), Firebase service-account key, Apple and Google signing/API keys. How: `HANDOVER.md` section 7 (`docs/HANDOVER-ar.md` section 7).

## 13. Open questions for the client

1. Legal entity name that will hold all accounts, and its D-U-N-S, commercial registration and signatory.
2. Who currently owns the domain `doabno.com` at the registrar?
3. Which Apple account holds the TestFlight build and does it belong to the company?
4. Should noon stay under organisation JEC or move to DOABNO's own entity?
5. Is a maintenance contract wanted after handover (affects section 11)?
