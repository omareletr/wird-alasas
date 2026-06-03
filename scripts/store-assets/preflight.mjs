import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "assets/store");
mkdirSync(outputDir, { recursive: true });

const candidates = {
  ios: ["ios", "App", "App.xcodeproj", "App.xcworkspace"].filter((p) =>
    existsSync(path.join(root, p))
  ),
  android: ["android", "capacitor.config.ts", "capacitor.config.json", "app.config.ts"].filter((p) =>
    existsSync(path.join(root, p))
  ),
};

const packageJson = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const nativeSignals = Object.keys(packageJson.dependencies ?? {}).filter((name) =>
  ["@capacitor/core", "expo", "react-native"].includes(name)
);

const iosInfoPlistPath = path.join(root, "ios/App/App/Info.plist");
const iosInfoPlist = existsSync(iosInfoPlistPath)
  ? readFileSync(iosInfoPlistPath, "utf8")
  : "";
const iosHasIpadSpecificConfig = iosInfoPlist.includes("UISupportedInterfaceOrientations~ipad");
const iosRequiresIPhoneOS = /<key>\s*LSRequiresIPhoneOS\s*<\/key>\s*<true\s*\/>/u.test(iosInfoPlist);

const androidManifestPath = path.join(root, "android/app/src/main/AndroidManifest.xml");
const androidManifestFound = existsSync(androidManifestPath);
const androidManifest = androidManifestFound
  ? readFileSync(androidManifestPath, "utf8")
  : "";
const androidHasLeanback = androidManifest.includes("android.intent.category.LEANBACK_LAUNCHER");
const androidHasWearFeature = androidManifest.includes("android.hardware.type.watch");
const androidHasTelevisionFeature = androidManifest.includes("android.hardware.type.television");
const androidHasAutomotiveFeature = androidManifest.includes("android.hardware.type.automotive");

const findings = [];
if (candidates.ios.length > 0) {
  findings.push(
    iosRequiresIPhoneOS
      ? "iOS Info.plist includes LSRequiresIPhoneOS=true."
      : "iOS Info.plist does not include LSRequiresIPhoneOS=true."
  );

  if (iosHasIpadSpecificConfig) {
    findings.push(
      "iOS Info.plist includes UISupportedInterfaceOrientations~ipad, so App Store iPad screenshot requirements must be checked before upload."
    );
  }
}

if (candidates.android.length > 0) {
  if (!androidManifestFound) {
    findings.push(
      "Android wrapper signal found, but android/app/src/main/AndroidManifest.xml was not found; non-phone Android targets were not inspected."
    );
  } else if (androidHasLeanback || androidHasWearFeature || androidHasTelevisionFeature || androidHasAutomotiveFeature) {
    findings.push(
      "Android manifest includes non-phone device signals; expand store assets before upload."
    );
  } else {
    findings.push(
      "Android manifest has no Wear OS, TV, Automotive, or Leanback launcher signals."
    );
  }
}

const blockers = [];
if (iosHasIpadSpecificConfig) {
  blockers.push("Confirm iPhone-only distribution in Xcode/App Store Connect or add iPad screenshots.");
}
if (candidates.android.length > 0 && !androidManifestFound) {
  blockers.push("Confirm Android phone-only distribution because AndroidManifest.xml was not found.");
}
if (androidHasLeanback || androidHasWearFeature || androidHasTelevisionFeature || androidHasAutomotiveFeature) {
  blockers.push("Remove/confirm non-phone Android targets or add matching Google Play assets.");
}

const result = {
  checkedAt: new Date().toISOString(),
  repo: path.basename(root),
  iosWrapperFound: candidates.ios.length > 0,
  androidWrapperFound: candidates.android.length > 0,
  nativeSignals,
  phoneOnlyStatus:
    blockers.length === 0
      ? "No blocking non-phone signals found in local wrapper files."
      : "Unresolved non-phone target risk found.",
  status:
    candidates.ios.length === 0 && candidates.android.length === 0 && nativeSignals.length === 0
      ? "No native wrapper found in this repository. Treating this as a PWA/source repo; phone-only store target must be confirmed in the external wrapper before final upload."
      : blockers.length === 0
        ? "Native wrapper signals found. Local files do not show blocking non-phone targets, but confirm store configuration before final upload."
        : "Native wrapper signals found. Resolve blockers before treating phone-only screenshots as final upload-ready assets.",
  paths: candidates,
  inspections: {
    ios: candidates.ios.length > 0
      ? {
          infoPlist: existsSync(iosInfoPlistPath) ? "ios/App/App/Info.plist" : null,
          requiresIPhoneOS: iosRequiresIPhoneOS,
          hasIpadSpecificOrientations: iosHasIpadSpecificConfig,
        }
      : null,
    android: candidates.android.length > 0
      ? {
          manifest: androidManifestFound ? "android/app/src/main/AndroidManifest.xml" : null,
          leanbackLauncher: androidHasLeanback,
          wearFeature: androidHasWearFeature,
          televisionFeature: androidHasTelevisionFeature,
          automotiveFeature: androidHasAutomotiveFeature,
        }
      : null,
  },
  findings,
  blockers,
};

writeFileSync(path.join(outputDir, "preflight.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
