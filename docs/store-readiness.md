# Store Readiness Checklist

This checklist covers Phase 5 for the Capacitor native app. It makes submission possible once account prerequisites are complete, but it is not a claim that the app is already approved or upload-ready.

## Current App Identity

- App name: `Wird Al-Asas`
- Current Capacitor app id: `com.omareletr.wirdalasas`
- iOS bundle identifier for v1: `com.omareletr.wirdalasas`.
- Android application id remains deferred with Google Play submission; the current Android scaffold may still contain `com.wirdalasas.app` until Android release work resumes.
- Current native version: `0.1.0` in `package.json`; native store versioning still needs final confirmation in Xcode and Android Gradle before upload.
- Distribution target: phone-first native app.
- Native app source: bundled local static assets from `npm run build:capacitor` and `npx cap sync`; no remote `server.url` is configured.

## Public Store URLs

- Privacy policy URL: `/privacy`
- Support URL: `/support`
- Final Netlify production domain is still required before submission.

Replace these relative paths with production URLs after the Netlify production domain is final, for example:

```text
https://example.netlify.app/privacy
https://example.netlify.app/support
```

## Account And ID Blockers

- Final iOS bundle identifier must be accepted in Apple Developer/App Store Connect before upload: `com.omareletr.wirdalasas`.
- Final Android application id is not confirmed because Google Play submission is deferred.
- Apple Developer Program enrollment is set up, but the App ID and App Store Connect record still need final confirmation.
- Google Play Console account setup is deferred.
- Public support email or support contact is not confirmed.
- Final Netlify production URL is not confirmed.
- Final iOS app icon/screenshot assets are not confirmed.

## TestFlight Archive Path

Prerequisites:

- Apple Developer Program membership.
- Final bundle id created in Apple Developer portal.
- App record created in App Store Connect.
- Xcode signing team selected for the `App` target.
- App version and build number set intentionally.

Build path:

```bash
npm run build:capacitor
npx cap sync ios
npx cap open ios
```

Then in Xcode:

- Select `Any iOS Device` or a connected device as the archive target.
- Confirm `App` target signing and bundle identifier.
- Use `Product > Archive`.
- Open Organizer and upload the archive to App Store Connect.
- Add the build to TestFlight after processing completes.

Validation before archive:

```bash
npm run lint
npm run build
npm run build:capacitor
npx cap sync ios
xcodebuild -list -project ios/App/App.xcodeproj
```

## Android Internal Testing Path

Prerequisites:

- Google Play Console account.
- Final Android application id.
- App entry created in Play Console.
- Android signing key strategy chosen and documented.
- Version code and version name set intentionally.

Build path:

```bash
npm run build:capacitor
npx cap sync android
npx cap open android
```

Then in Android Studio:

- Confirm package/application id.
- Configure signing for release.
- Build a signed Android App Bundle (`.aab`).
- Upload the bundle to an internal testing track in Google Play Console.

Validation before bundle:

```bash
npm run lint
npm run build
npm run build:capacitor
npx cap sync android
cd android
./gradlew projects
```

## Signing And Key Requirements

iOS:

- Use Apple-managed signing unless a manual signing requirement appears.
- Do not commit personal signing team changes unless the team id is intended for the project.
- Keep certificates and provisioning profiles out of git.

Android:

- Use Play App Signing for store release unless there is a specific reason not to.
- Store keystores and passwords outside git.
- Document who controls the upload key before the first release.

## Privacy And Data Safety Answers

Current v1 behavior:

- No account is required.
- Auth/Supabase is not part of native v1.
- Dhikr counts, history, settings, theme, reset time, feedback preference, and onboarding state are stored locally on the device.
- Native app data is not intentionally sent to an app backend.
- Android automatic backup is disabled in `android/app/src/main/AndroidManifest.xml`.
- Haptics use Capacitor native APIs and Android vibration permission.
- The public website may be hosted by Netlify, which can process basic hosting request logs.

Store form draft answers:

- Data collected by native app for tracking: no.
- Data linked to user identity by native app: no.
- Account creation: no.
- User-generated public content: no.
- Location, contacts, camera, microphone, photos: not used for v1.
- Local progress/settings/history: stored on device for app functionality.

Re-check these answers before submission if analytics, crash reporting, Supabase sync, auth, push notifications, or support forms are added.

## Store Listing Checklist

- Final app name.
- Subtitle/short description.
- Full description.
- Keywords/categories.
- Privacy policy production URL.
- Support production URL.
- Support contact email.
- Copyright holder.
- Age rating/content questionnaire.
- Data safety/privacy questionnaire.
- Final app icon.
- Phone screenshots.
- Google Play feature graphic.
- Test account details if any login is added later.

## Screenshot Requirements

Use the approved phone-only asset spec in `docs/superpowers/specs/2026-06-01-store-launch-assets-design.md` unless the store target changes.

Required current set:

- Apple App Store: 5 iPhone screenshots at `1320x2868`.
- Google Play: 5 phone screenshots at `1080x1920`.
- Google Play feature graphic: `1024x500`.
- Apple app icon: `1024x1024` opaque PNG.
- Google Play app icon: `512x512` PNG with alpha, maximum 1024KB.

Do not claim assets are upload-ready until the asset validator passes and visual QA is complete.

## Native Release Validation Checklist

Run these sequentially, not in parallel, because both Next build paths write to `.next`:

```bash
npm run lint
npm run build
npm run build:capacitor
npx cap sync
npm run test:run
```

Manual checks before store upload:

- App launches cleanly on real iPhone.
- App launches cleanly on real Android device.
- No install CTA appears in native app.
- Safe areas look correct on notched and non-notched devices.
- App works after enabling airplane mode.
- Counts, settings, history, theme, and onboarding persist after force quit and reopen.
- Haptics work on real devices.
