# DOABNO iOS app (TestFlight)

A thin Capacitor wrapper around `app-v2`. Nothing in this folder is built on a Windows PC: the GitHub workflow
`.github/workflows/ios-testflight.yml` builds it on a macOS runner and uploads it to TestFlight.

## One-time setup (the account owner does this; secrets never go in the repo)
1. Apple Developer Program membership (paid) and **App Store Connect > Apps > New app**, with a bundle id such as `com.yourcompany.doabno`.
2. **App Store Connect > Users and Access > Integrations > App Store Connect API > Team Keys > Generate**, role **Admin** (needed so Xcode can create signing certificates in the cloud). Download the `.p8` file once; note the Key ID and the Issuer ID.
3. GitHub repo **Settings > Secrets and variables > Actions**:
   - Variable `BUNDLE_ID` = the bundle id from step 1.
   - Secrets `APPLE_TEAM_ID` (10 characters), `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8` (the whole text of the .p8 file).

## Each build
Actions > **iOS to TestFlight** > Run workflow (version number optional). About 15 to 20 minutes, then Apple processes the build for another 15 to 30 minutes before it shows in TestFlight. Add yourself under **TestFlight > Internal Testing**.

## Notes
- The first upload also needs the **export compliance** and **App Privacy** answers in App Store Connect (the app uses only standard HTTPS; collects email for accounts, favorites and price alerts).
- The barcode scanner needs `BarcodeDetector`, which iOS web views do not have yet; the app shows its normal "camera not supported" message.
- Confirmation emails link to the website, not the app. Deep links (universal links) need the domain and an `apple-app-site-association` file: a later step.
