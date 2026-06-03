# Store Launch Assets — Compliance Spec

**Date:** 2026-06-01
**Status:** Pending user review
**Scope:** Phone-only Apple App Store and Google Play launch assets for `wird al-asas`.

## Source Requirements

- Apple App Store Connect screenshot specifications:
  https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Apple App Store Connect app icon guidance:
  https://developer.apple.com/help/app-store-connect/manage-app-information/add-an-app-icon
- Google Play preview asset requirements:
  https://support.google.com/googleplay/android-developer/answer/9866151

## Preflight Gate

Before exporting final assets, verify the native distribution targets:

- iOS build is configured as iPhone-only. If the app supports iPad, this spec is incomplete and must be expanded with iPad screenshots before submission.
- Android release target is phones only. If tablets, Wear OS, TV, Automotive, XR, or Chromebook-specific listings are enabled, this spec is incomplete and must be expanded for those device types.
- Store captions are English. Arabic remains in the UI, brand, and Kufic icon.

## Visual Direction

Use **Quiet Editorial** as the screenshot system:

- Warm cream backgrounds, near-black foreground, restrained amber accent, sparse typography.
- The app UI must be captured from the running app and placed into the marketing composition. Do not manually redraw the in-device UI.
- Use a restrained Kufic grid accent only on screenshot 1 and the Google Play feature graphic.
- Keep marketing text short, timeless, and non-promotional.
- Do not use claims such as "best", "#1", "top", "new", "free", "download now", "install now", awards, ranking, price, discounts, testimonials, or time-sensitive language.

Google allows stylized screenshots, but discourages device imagery because it can become obsolete. Use a minimal generic phone frame only when it improves clarity; keep the first three screenshots focused on actual UI, and keep taglines under 20% of each image.

## Icon Design

Create an original grid Kufic icon spelling:

```text
الورد الأساس
```

The provided reference images are style references only. Do not copy their exact glyph layout except for the textual meaning.

Design requirements:

- Use the app design-system colors.
- Preserve legibility at small sizes.
- Avoid badges, store logos, ranking/category/price text, and misleading marks.
- Keep the primary icon artwork centered with enough margin for platform masks.

Required icon exports:

- `assets/store/icon/icon-master-1024.png`
  - 1024×1024 PNG master.
  - Fully opaque PNG with no alpha channel and no transparent pixels.
  - No baked rounded corners.
- `assets/store/app-store/app-icon-1024.png`
  - 1024×1024 PNG for Apple/Xcode asset catalog.
  - No alpha channel and no transparent pixels.
  - No baked rounded corners; Apple applies platform rounding.
- `assets/store/google-play/app-icon-512.png`
  - 512×512 32-bit PNG with alpha.
  - Maximum file size 1024KB.
  - Must meet Google Play icon design specifications.
- `assets/store/icon/maskable-512.png`
  - 512×512 PNG for Android/PWA maskable use.
  - Main artwork contained within the safe center area.

## Apple App Store Screenshots

Produce exactly 5 iPhone screenshots.

Primary Apple export size:

- 6.9-inch iPhone portrait: `1320×2868`
- Format: `.png` preferred, `.jpg`/`.jpeg` allowed.
- Opaque output: no alpha channel and no transparent pixels.
- Count is compliant with Apple's 1-10 screenshot requirement.

Screenshot topics:

1. Daily wird counter
2. Progress/completion state
3. Four adhkar flow
4. History/streaks
5. Reset/settings personalization

Apple screenshot filenames:

- `assets/store/app-store/01-daily-wird-counter-1320x2868.png`
- `assets/store/app-store/02-progress-completion-1320x2868.png`
- `assets/store/app-store/03-four-adhkar-flow-1320x2868.png`
- `assets/store/app-store/04-history-streaks-1320x2868.png`
- `assets/store/app-store/05-reset-settings-1320x2868.png`

## Google Play Screenshots

Produce exactly 5 phone screenshots.

Primary Google export size:

- Portrait: `1080×1920`
- Aspect ratio: 9:16
- Format: JPEG or 24-bit PNG with no alpha. Use PNG unless file size becomes excessive.
- Each image must have minimum side at least 320px and maximum side no more than 3840px.
- The maximum side must not be more than 2× the minimum side.
- Count is within Google's phone screenshot limit of up to 8 screenshots and exceeds the minimum required 2 screenshots.
- The set exceeds Google's recommendation threshold for apps: at least 4 screenshots at minimum 1080px resolution.

Google screenshot filenames:

- `assets/store/google-play/01-daily-wird-counter-1080x1920.png`
- `assets/store/google-play/02-progress-completion-1080x1920.png`
- `assets/store/google-play/03-four-adhkar-flow-1080x1920.png`
- `assets/store/google-play/04-history-streaks-1080x1920.png`
- `assets/store/google-play/05-reset-settings-1080x1920.png`

Google screenshot content rules:

- Screenshots must demonstrate actual in-app experience.
- Captured UI must not be blurry, distorted, stretched, compressed, skewed, sideways, or upside down.
- Do not show service providers or notifications in status bars. Battery, Wi-Fi, and cell indicators should appear full or be removed through a clean device frame.
- Avoid small caption text and visually noisy backgrounds.
- Do not include Google Play badges, Apple badges, or third-party trademarks.

## Google Play Feature Graphic

Produce:

- `assets/store/google-play/feature-graphic-1024x500.png`

Requirements:

- Dimensions: `1024×500`
- Format: JPEG or 24-bit PNG with no alpha. Use PNG.
- Use the Quiet Editorial system with the restrained Kufic grid accent.
- Keep prominent visuals and the focal point centered.
- Keep app name, primary slogan, icon, and main UI out of cutoff zones.
- Restrict background elements to the edges.
- Do not duplicate the app icon prominently.
- Avoid fine detail that will disappear on phone screens.
- Avoid pure white, pure black, and dark gray as dominant backgrounds.
- Do not include store badges, rankings, awards, price, promotional copy, testimonials, or time-sensitive content.

## Copy And Alt Text

Screenshot captions:

- English.
- Short and plain.
- No call-to-action.
- No ranking, pricing, awards, testimonials, or time-sensitive claims.
- Must not occupy more than 20% of any Google Play screenshot.

Include Google Play alt text in the manifest for every Google screenshot and feature graphic:

- Maximum 140 characters each.
- Do not start with "photo of" or "image of".
- Describe the key app state or feature.

Required manifest:

- `assets/store/ASSET_MANIFEST.md`

The manifest must list:

- Every generated asset path.
- Target store and upload location.
- Width, height, format, alpha/opacity status, and file size.
- Google Play alt text for each Google screenshot and feature graphic.
- Validation result for each compliance check.

## Capture And Export Process

- Start the app locally and capture the real UI at deterministic states.
- Add temporary capture-only helpers only if required, and avoid production behavior changes.
- Preserve existing uncommitted user changes.
- Export all final images into `assets/store/`.
- Run image validation before delivery:
  - Dimensions match this spec exactly.
  - File formats match this spec.
  - Apple assets have no alpha channel and no transparent pixels.
  - Google screenshot and feature graphic assets are JPEG or 24-bit PNG with no alpha.
  - Google Play icon is 512×512 32-bit PNG with alpha and <=1024KB.
  - No generated asset exceeds its platform file-size constraint where one is specified.

## Non-Goals

- No tablet, Wear OS, TV, Automotive, XR, Chromebook, or preview video assets unless the preflight gate finds those targets enabled.
- No extra screenshots beyond the 5 approved phone screenshots.
- No manual recreation of app UI inside screenshots.
