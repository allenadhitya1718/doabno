# Push notifications (price-drop alerts on phones)

When a product reaches the price a person set in an alert, the installed Android and iPhone apps can show a notification, in addition to the email. Tapping it opens that product.
The website and the browser version never ask for or use push.

## How it works
1. In the installed app, when a signed-in person saves an alert with **Push** on (or turns on the price-drop notifications in Profile), the app asks the phone for permission, gets the phone's push token from Apple or Google, and saves it on the account (`register_push_token`).
2. Every day after the feed import, the alert job (`node backend/importer/cli.js run`, then alerts) looks for alerts whose target was reached. For each one it sends the email (if the person agreed to emails) and a notification to every phone registered for that person (if push is on for that alert).
3. Android notifications go through Google's Firebase Cloud Messaging (FCM). iPhone notifications go straight to Apple's push service (APNs). Both use only built-in Node code; no extra packages.
4. Tokens that Google or Apple say are dead are deleted. Signing out, or turning the notifications off, removes this phone's token. An alert counts as told once an email or a notification was accepted, and is told again only after the price has gone above the target and come back.

What was built: `backend/supabase/migrations/0010_push_tokens.sql`, `backend/importer/push.js`, the push step in `backend/importer/alerts.js`, the registration code in `app-v2/mobile.js`, the `@capacitor/push-notifications` plugin in both app wrappers, and the iOS and Android workflows. 11 tests cover the sending code (`backend/tests/push.test.js`).

## One-time setup (the account owners; secrets never go in the repo)

### A. Database (anyone with the Supabase project, 2 minutes)
Supabase dashboard > SQL Editor > paste `backend/supabase/migrations/0010_push_tokens.sql` > Run. It creates the table for phone tokens and the functions the app and the alert job use, and replaces `alerts_to_check` with a version that also says whether push is wanted. Safe to run twice. **Run it before the next daily alert job**, otherwise the job's alert list will not include the push column.

### B. Android: a Firebase project (about 15 minutes, free)
1. https://console.firebase.google.com > **Add project** (name it DOABNO; Analytics is not needed).
2. In the project: **Add app > Android**. Package name exactly `com.doabno.app`. Skip the other steps, but download **google-services.json**.
3. GitHub repo > Settings > Secrets and variables > Actions > New secret **`GOOGLE_SERVICES_JSON_B64`**: the google-services.json file as base64 (PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-services.json"))`; Mac/Linux: `base64 -w0 google-services.json`).
4. In Firebase: Project settings > **Service accounts** > **Generate new private key**. GitHub secret **`FCM_SERVICE_ACCOUNT_JSON`** = the whole text of that JSON file. (This key can send notifications for the project: treat it like a password.)
5. Re-run **Android build** (Actions) so the app contains the Firebase file.

### C. iPhone: an APNs key (about 10 minutes; the Apple Developer account owner)
1. developer.apple.com > Certificates, Identifiers & Profiles > **Keys** > **+**. Tick **Apple Push Notifications service (APNs)**. Continue, Register, **Download** the `.p8` file once and note the **Key ID**.
2. GitHub secrets: **`APNS_KEY_P8`** = the whole text of the .p8 file, **`APNS_KEY_ID`** = the Key ID. (The existing `APPLE_TEAM_ID` secret and `BUNDLE_ID` variable are reused.)
3. Run **iOS to TestFlight** (Actions). When `APNS_KEY_P8` exists (or the "push" box is ticked), the workflow adds the Push Notifications entitlement and signs the archive with the App Store Connect key, so the capability is switched on for the app id automatically. If Apple refuses (the log says which capability), enable **Push Notifications** for the app id by hand under Identifiers and run again.
4. The phone must run a TestFlight or App Store build (they use Apple's production push server).

### D. Nothing else to switch on
The daily workflow "Import store feeds" already passes the secrets to the alert job. A platform without its secrets is simply skipped.

## Testing it
### Quick check without an account: the Push test workflow
GitHub > Actions > **Push test** > Run workflow, with a phone's push token and its platform. It sends one notification and fails if Google or Apple refuse it, so it proves the secrets work. (The token is what the app gets from the plugin when notification permission is granted; for a real person it is also in the `push_tokens` table.) Verified on 2026-10-16: a token from the Android emulator received the notification, and tapping it delivered `url: #/p/<product id>` to the app.

### Full check with an account
1. Install the app on a phone, sign in, open any product, **Alert**, set a target **above** today's price, leave Push on, Save, and allow notifications.
2. Check the phone registered: Supabase > Table Editor > `push_tokens` has a row for the account (the table is hidden from the API; use the dashboard).
3. GitHub > Actions > **Import store feeds** > Run workflow. In the log, look for `push: android, ios` and `alerts: {... "pushed": 1 ...}`. The notification arrives within seconds.
4. To try it without sending anything: run `node backend/importer/cli.js alerts --dry true` with the Supabase secrets in the environment; it lists "would push to N phone(s)".
5. The same alert is not sent twice. Edit the target to something lower, then higher again, to re-arm it.

## Privacy and rules
- Permission: the phone's own permission question is the consent for push. No email consent is needed for push, and none is recorded for it.
- Data: a token (a random string from Google or Apple) and the platform, linked to the account; deleted when the account is deleted or the person signs out or turns notifications off.
- The privacy policy should say that notifications are sent through Google (Firebase) and Apple.
- Apple wants a reason when asking for permission; the app asks right when the person saves an alert with push on.

## Troubleshooting
| What you see | Likely cause |
|---|---|
| No permission question in the app | Not the installed app (website or browser), not signed in, or already answered earlier (on Android the question appears once; change it in the phone's settings) |
| App shows "Notifications are blocked" | Permission was refused; allow it in the phone's settings |
| No `push_tokens` row after allowing | Android: the app was built without `GOOGLE_SERVICES_JSON_B64`. iPhone: build without the push entitlement. Migration 0010 not run |
| Job log says `FCM sign-in failed` | `FCM_SERVICE_ACCOUNT_JSON` is wrong or the Firebase Cloud Messaging API is off for the project (Google Cloud console > APIs > Firebase Cloud Messaging API) |
| iPhone: nothing arrives, job counts it as sent | The build is not from TestFlight or the App Store, or the bundle id in `BUNDLE_ID` differs from the app's |
| `pushed` stays 0 | The alert has Push off, the person has no phone registered, or the price has not reached the target |
