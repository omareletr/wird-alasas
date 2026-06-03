# Store Asset Manifest

Generated: 2026-06-03T05:39:32.382Z

## Preflight

- Phone-only status: No blocking non-phone signals found in local wrapper files.
- Status: Native wrapper signals found. Local files do not show blocking non-phone targets, but confirm store configuration before final upload.
- Blockers: none

## Assets

| Path | Target | Upload location | Dimensions | Format | Alpha | Size | Google Play alt text |
|---|---|---|---:|---|---|---:|---|
| `assets/store/icon/icon-master-1024.png` | Shared | Master icon source | 1024x1024 | png | no | 34046 bytes |  |
| `assets/store/icon/maskable-512.png` | Android/PWA | Maskable icon support | 512x512 | png | yes | 13254 bytes |  |
| `assets/store/app-store/app-icon-1024.png` | Apple | App icon | 1024x1024 | png | no | 34046 bytes |  |
| `assets/store/google-play/app-icon-512.png` | Google Play | App icon | 512x512 | png | yes | 13254 bytes |  |
| `assets/store/google-play/feature-graphic-1024x500.png` | Google Play | Feature graphic | 1024x500 | png | no | 40252 bytes | Wird Al-Asas feature graphic with phone preview and Kufic accent. |
| `assets/store/app-store/01-daily-wird-counter-1320x2868.png` | Apple | iPhone screenshot | 1320x2868 | png | no | 187139 bytes |  |
| `assets/store/google-play/01-daily-wird-counter-1080x1920.png` | Google Play | Phone screenshot | 1080x1920 | png | no | 116365 bytes | Daily wird counter showing partial progress on the first dhikr. |
| `assets/store/app-store/02-progress-completion-1320x2868.png` | Apple | iPhone screenshot | 1320x2868 | png | no | 235836 bytes |  |
| `assets/store/google-play/02-progress-completion-1080x1920.png` | Google Play | Phone screenshot | 1080x1920 | png | no | 152933 bytes | Counter screen showing progress near completion across the daily adhkar. |
| `assets/store/app-store/03-four-adhkar-flow-1320x2868.png` | Apple | iPhone screenshot | 1320x2868 | png | no | 203766 bytes |  |
| `assets/store/google-play/03-four-adhkar-flow-1080x1920.png` | Google Play | Phone screenshot | 1080x1920 | png | no | 129008 bytes | Dhikr card screen showing the third remembrance in the four-part wird flow. |
| `assets/store/app-store/04-history-streaks-1320x2868.png` | Apple | iPhone screenshot | 1320x2868 | png | no | 225000 bytes |  |
| `assets/store/google-play/04-history-streaks-1080x1920.png` | Google Play | Phone screenshot | 1080x1920 | png | no | 134457 bytes | History sheet showing current streak, longest streak, and activity calendar. |
| `assets/store/app-store/05-reset-settings-1320x2868.png` | Apple | iPhone screenshot | 1320x2868 | png | no | 222556 bytes |  |
| `assets/store/google-play/05-reset-settings-1080x1920.png` | Google Play | Phone screenshot | 1080x1920 | png | no | 139413 bytes | Settings sheet showing mode, feedback, and daily reset time controls. |

## Validation Notes

- Run `node scripts/store-assets/validate-assets.mjs` before upload.
- Apple upload readiness remains blocked until the iOS iPhone-only/iPad screenshot preflight blocker is resolved.
