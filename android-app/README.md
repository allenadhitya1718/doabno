# DOABNO Android app

A thin Capacitor wrapper around `app-v2`, like the iOS app. Nothing in this folder is built on a Windows PC: the GitHub workflow
`.github/workflows/android-build.yml` builds it on a Linux runner and attaches the result to the run.

## Build
GitHub > Actions > **Android build** > Run workflow (version number optional). About 8 to 12 minutes. The run page then lists the files under **Artifacts**:
- `doabno-debug-apk`: an APK that installs on any Android phone or emulator (allow "install unknown apps" on a phone). Good for testing and for showing the client.
- `doabno-release-aab` and `doabno-release-apk`: signed for Google Play. Only made when the signing secrets below are set.

## One-time setup for Google Play (the account owner; secrets never go in the repo)
1. Google Play Console account (one-time fee) and a new app with the id `com.doabno.app` (or the `BUNDLE_ID` variable).
2. Make an upload key once (any PC with Java): `keytool -genkeypair -v -keystore doabno-upload.jks -alias doabno -keyalg RSA -keysize 2048 -validity 10000`. Keep the file and the passwords safe; losing them makes updates hard.
3. GitHub repo **Settings > Secrets and variables > Actions**, secrets: `ANDROID_KEYSTORE_B64` (the .jks file as base64, for example `base64 -w0 doabno-upload.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
4. Run the workflow, download `doabno-release-aab`, and upload it in Play Console under Testing > Internal testing.

## Notes
- The camera permission is added for the barcode scanner; photos are chosen through the phone's own picker.
- The barcode scanner uses the app's bundled reader (the Android web view has no BarcodeDetector in every version).
- Push notifications: see `docs/push-notifications.md`.
