#!/usr/bin/env bash
# Run from android-app/ after `npx cap add android` / `cap sync` (the android/ folder is generated, not committed).
# Copies res-overlay/ into the generated project and sets the default push notification icon and colour in the manifest.
set -euo pipefail
APP=android/app/src/main
MANIFEST=$APP/AndroidManifest.xml
cp -R res-overlay/. "$APP/res/"
if ! grep -q default_notification_icon "$MANIFEST"; then
  sed -i 's#</application>#    <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_doabno" />\n        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/doabno_notification_color" />\n    </application>#' "$MANIFEST"
fi
grep -n "default_notification" "$MANIFEST"
test -f "$APP/res/drawable/ic_stat_doabno.xml"
