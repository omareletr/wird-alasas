# Store Launch Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce upload-ready phone-only Apple App Store and Google Play launch assets that comply with `docs/superpowers/specs/2026-06-01-store-launch-assets-design.md`.

**Architecture:** Build a local asset pipeline under `scripts/store-assets/` that captures real app UI states, composes store canvases, exports required PNGs, and validates every file. Keep production app behavior unchanged; use temporary capture routes/helpers only if the normal app state cannot be made deterministic from storage.

**Tech Stack:** Next.js 15 app, Browser/Playwright-style screenshots, Node.js scripts, SVG/HTML composition, PNG validation, generated assets under `assets/store/`.

---

## File Structure

- Create `scripts/store-assets/preflight.mjs`: checks phone-only assumptions and records wrapper status.
- Create `scripts/store-assets/capture-states.mjs`: documents and/or automates capture states for the running app.
- Create `scripts/store-assets/compose-assets.mjs`: builds the app icon, screenshots, feature graphic, and manifest.
- Create `scripts/store-assets/validate-assets.mjs`: validates dimensions, PNG alpha rules, and Google icon file size.
- Create `assets/store/ASSET_MANIFEST.md`: final upload manifest with validation results and Google alt text.
- Create `assets/store/app-store/*.png`: Apple icon and 5 screenshots.
- Create `assets/store/google-play/*.png`: Google icon, 5 screenshots, feature graphic.
- Create `assets/store/icon/*.png`: master and maskable icon exports.
- Modify no production app files unless capture proves impossible without a temporary route; if needed, create `app/store-capture/page.tsx` and remove it before final delivery unless the user asks to keep it.

## Task 1: Preflight Store Target Check

**Files:**
- Create: `scripts/store-assets/preflight.mjs`
- Output: `assets/store/preflight.json`

- [ ] **Step 1: Create the preflight script**

```js
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

const result = {
  checkedAt: new Date().toISOString(),
  repo: path.basename(root),
  iosWrapperFound: candidates.ios.length > 0,
  androidWrapperFound: candidates.android.length > 0,
  nativeSignals,
  status:
    candidates.ios.length === 0 && candidates.android.length === 0 && nativeSignals.length === 0
      ? "No native wrapper found in this repository. Treating this as a PWA/source repo; phone-only store target must be confirmed in the external wrapper before final upload."
      : "Native wrapper signals found. Inspect the listed paths before final upload and confirm phone-only distribution.",
  paths: candidates,
};

writeFileSync(path.join(outputDir, "preflight.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
```

- [ ] **Step 2: Run preflight**

Run: `node scripts/store-assets/preflight.mjs`

Expected:
- Creates `assets/store/preflight.json`.
- If no `ios/`, `android/`, Capacitor, Expo, or React Native files exist, output explicitly says the native wrapper is not in this repo and phone-only must be confirmed externally.

- [ ] **Step 3: Decide whether to continue**

If the preflight finds tablet or non-phone targets in this repo, stop and expand the spec. If no wrapper is present, continue with phone-only assets and record the external-wrapper caveat in `ASSET_MANIFEST.md`.

## Task 2: App State Capture Strategy

**Files:**
- Create: `scripts/store-assets/capture-states.mjs`
- Output directory: `assets/store/captures/`

- [ ] **Step 1: Create capture state definitions**

```js
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const captureDir = path.join(root, "assets/store/captures");
mkdirSync(captureDir, { recursive: true });

const states = [
  {
    id: "daily-wird-counter",
    route: "/",
    viewport: { width: 390, height: 844 },
    description: "Main counter with first dhikr active and partial progress.",
    storage: {
      settings: { state: { hasOnboarded: true, resetHour: 5, feedbackMode: "haptic" }, version: 0 },
      session: {
        state: {
          activeIndex: 0,
          mode: "shortened",
          counts: { 0: 7, 1: 0, 2: 0, 3: 0 },
          sessionStartedAt: 1780387200000
        },
        version: 0
      }
    }
  },
  {
    id: "progress-completion",
    route: "/",
    viewport: { width: 390, height: 844 },
    description: "Counter near completion to show progress and achievement.",
    storage: {
      settings: { state: { hasOnboarded: true, resetHour: 5, feedbackMode: "haptic" }, version: 0 },
      session: {
        state: {
          activeIndex: 0,
          mode: "shortened",
          counts: { 0: 20, 1: 20, 2: 10, 3: 8 },
          sessionStartedAt: 1780387200000
        },
        version: 0
      }
    }
  },
  {
    id: "four-adhkar-flow",
    route: "/",
    viewport: { width: 390, height: 844 },
    description: "Later dhikr card active to show the four-part flow.",
    storage: {
      settings: { state: { hasOnboarded: true, resetHour: 5, feedbackMode: "haptic" }, version: 0 },
      session: {
        state: {
          activeIndex: 2,
          mode: "shortened",
          counts: { 0: 20, 1: 14, 2: 4, 3: 0 },
          sessionStartedAt: 1780387200000
        },
        version: 0
      }
    }
  },
  {
    id: "history-streaks",
    route: "/",
    viewport: { width: 390, height: 844 },
    description: "History sheet open with streak and calendar activity visible.",
    storage: {
      settings: { state: { hasOnboarded: true, resetHour: 5, feedbackMode: "haptic" }, version: 0 },
      session: {
        state: {
          activeIndex: 0,
          mode: "shortened",
          counts: { 0: 12, 1: 7, 2: 0, 3: 0 },
          sessionStartedAt: 1780387200000
        },
        version: 0
      }
    },
    action: "open-history"
  },
  {
    id: "reset-settings",
    route: "/",
    viewport: { width: 390, height: 844 },
    description: "Settings sheet open to show mode, feedback, and daily reset time.",
    storage: {
      settings: { state: { hasOnboarded: true, resetHour: 5, feedbackMode: "haptic" }, version: 0 },
      session: {
        state: {
          activeIndex: 0,
          mode: "shortened",
          counts: { 0: 5, 1: 0, 2: 0, 3: 0 },
          sessionStartedAt: 1780387200000
        },
        version: 0
      }
    },
    action: "open-settings"
  }
];

writeFileSync(path.join(captureDir, "states.json"), JSON.stringify(states, null, 2));
console.log(`Wrote ${states.length} capture states to assets/store/captures/states.json`);
```

- [ ] **Step 2: Run the state generator**

Run: `node scripts/store-assets/capture-states.mjs`

Expected:
- `assets/store/captures/states.json` exists and contains exactly 5 states.

- [ ] **Step 3: Capture the UI**

Run the app with `npm run dev`, then use the Browser plugin or Playwright to:
- Open `http://localhost:3000`.
- Inject each state into localStorage using the existing Zustand persist keys found in `lib/store/sessionStore.ts` and `lib/store/settingsStore.ts`.
- Reload the page.
- For `history-streaks`, click the History button.
- For `reset-settings`, click the Settings button.
- Save raw captures to:
  - `assets/store/captures/daily-wird-counter.png`
  - `assets/store/captures/progress-completion.png`
  - `assets/store/captures/four-adhkar-flow.png`
  - `assets/store/captures/history-streaks.png`
  - `assets/store/captures/reset-settings.png`

Expected:
- Each raw capture is a real app screenshot, not a hand-drawn reconstruction.

## Task 3: Compose Final Assets

**Files:**
- Create: `scripts/store-assets/compose-assets.mjs`
- Output: all final PNG assets under `assets/store/`

- [ ] **Step 1: Create the composition script**

Implement this script with these constants and responsibilities:

```js
const APPLE_SCREEN = { width: 1320, height: 2868 };
const GOOGLE_SCREEN = { width: 1080, height: 1920 };
const FEATURE = { width: 1024, height: 500 };
const ICON_MASTER = { width: 1024, height: 1024 };
const GOOGLE_ICON = { width: 512, height: 512 };

const COLORS = {
  cream: "#f4efe2",
  creamDeep: "#e9dfca",
  ink: "#171512",
  muted: "#7c7264",
  amber: "#a86820",
  gold: "#c48a3b"
};
```

The script must:
- Read the 5 raw captures from `assets/store/captures/`.
- Build an original grid Kufic icon using rectilinear SVG geometry for `الورد الأساس`.
- Export `icon-master-1024.png`, `app-icon-1024.png`, `app-icon-512.png`, and `maskable-512.png`.
- Compose 5 Apple screenshots at `1320×2868`.
- Compose 5 Google screenshots at `1080×1920`.
- Compose `feature-graphic-1024x500.png`.
- Keep first screenshot and feature graphic as the only assets with Kufic grid accent outside the icon.
- Write `assets/store/ASSET_MANIFEST.md` with dimensions, targets, and alt text.

- [ ] **Step 2: Use imagegen only for icon concept if deterministic SVG is not visually sufficient**

If a generated bitmap is needed for the Kufic icon, generate one icon concept using `image_gen`, then place the selected image into the same export pipeline. The final exports still must pass the validator.

- [ ] **Step 3: Run the composition script**

Run: `node scripts/store-assets/compose-assets.mjs`

Expected:
- Creates all required assets named exactly as in the spec.
- Creates `assets/store/ASSET_MANIFEST.md`.

## Task 4: Validate Assets

**Files:**
- Create: `scripts/store-assets/validate-assets.mjs`

- [ ] **Step 1: Create validator**

The validator must check:
- All required files exist.
- Apple screenshots are exactly `1320×2868`.
- Google screenshots are exactly `1080×1920`.
- Google feature graphic is exactly `1024×500`.
- Apple icon is exactly `1024×1024`.
- Google Play icon is exactly `512×512`.
- Apple icon/screenshots have no alpha channel and no transparent pixels.
- Google screenshots and feature graphic are 24-bit PNG or JPEG with no alpha.
- Google Play icon is a 32-bit PNG with alpha and is `<= 1024KB`.

- [ ] **Step 2: Run validator**

Run: `node scripts/store-assets/validate-assets.mjs`

Expected:
- Prints `PASS` for every required asset.
- Exits non-zero if any dimension, alpha, or file-size rule fails.

## Task 5: Visual QA

**Files:**
- Read: final assets under `assets/store/`
- Update: `assets/store/ASSET_MANIFEST.md` if any validation note changes

- [ ] **Step 1: Inspect final assets**

Use `view_image` or the Browser plugin to inspect:
- `assets/store/app-store/01-daily-wird-counter-1320x2868.png`
- `assets/store/app-store/05-reset-settings-1320x2868.png`
- `assets/store/google-play/feature-graphic-1024x500.png`
- `assets/store/app-store/app-icon-1024.png`
- `assets/store/google-play/app-icon-512.png`

Expected:
- Captured app UI is sharp and faithful.
- Captions are readable and under the Google 20% rule.
- Kufic accent appears only on screenshot 1 and feature graphic.
- Icon reads as a grid Kufic mark and uses the app colors.

- [ ] **Step 2: Fix visual defects**

If any asset is blurry, cropped, distorted, too busy, incorrectly accented, or fails small-size icon legibility, adjust `scripts/store-assets/compose-assets.mjs`, rerun composition, and rerun validation.

## Task 6: Final Verification And Handoff

**Files:**
- Read: `assets/store/ASSET_MANIFEST.md`
- Read: `assets/store/preflight.json`

- [ ] **Step 1: Run final commands**

Run:

```bash
node scripts/store-assets/preflight.mjs
node scripts/store-assets/capture-states.mjs
node scripts/store-assets/compose-assets.mjs
node scripts/store-assets/validate-assets.mjs
```

Expected:
- Validator exits successfully.
- Manifest lists every asset and Google alt text.

- [ ] **Step 2: Report final paths**

Report:
- `assets/store/app-store/`
- `assets/store/google-play/`
- `assets/store/icon/`
- `assets/store/ASSET_MANIFEST.md`

Do not claim the assets are upload-ready unless the validator passes and visual QA is complete.
