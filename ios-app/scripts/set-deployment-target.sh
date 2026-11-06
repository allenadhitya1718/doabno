#!/usr/bin/env bash
# Run from ios-app/ after `npx cap add ios` (the ios/ folder is generated, not committed). Raises the iOS deployment target to 15.0.
set -euo pipefail
TARGET=15.0
PBX=ios/App/App.xcodeproj/project.pbxproj
sed -i.bak -E "s/IPHONEOS_DEPLOYMENT_TARGET = [0-9.]+;/IPHONEOS_DEPLOYMENT_TARGET = $TARGET;/g" "$PBX" && rm -f "$PBX.bak"
PODFILE=ios/App/Podfile
if [ -f "$PODFILE" ]; then sed -i.bak -E "s/platform :ios, *'[0-9.]+'/platform :ios, '$TARGET'/" "$PODFILE" && rm -f "$PODFILE.bak"; fi
grep -n "IPHONEOS_DEPLOYMENT_TARGET" "$PBX" | sort -u -k2
[ -f "$PODFILE" ] && grep -n "platform :ios" "$PODFILE" || true
