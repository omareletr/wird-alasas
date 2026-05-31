# Design Audit — wird al-asas

Work through these in order. Check each off as done.

---

## Issues

### Critical
- [x] **1. Flat typography** — `globals.css` sets `--font-sans: var(--font-geist-mono)`, making everything mono. No hierarchy between UI chrome, count display, transliteration, and translation. Consider using a sans-serif (e.g. IBM Plex Sans Latin — already partially imported) for body/prose text while keeping Geist Mono for numbers/labels.
- [x] **4. ProgressRing completed state unused** — `const completed = count >= target` in `ProgressRing.tsx` is computed but never applied. Add a visual state change when complete (color shift to full-white or amber pulse, brief scale animation, or glow).

### High
- [x] **2. Opacity ladder is unsemantic** — `text-white/30`, `/40`, `/50`, `/60` are used with no consistent mapping of intent → opacity. Establish and apply a clear ladder: `/20` = ghost, `/40` = muted, `/60` = secondary, `/80` = body, `/100` = primary.
- [x] **3. Amber accent split across two tokens** — `text-accent` (CSS var `--accent`) and `text-amber-400` (Tailwind hardcode) both render amber. Consolidate every amber use to `text-accent` / `bg-accent` etc. Files: `DayCompletionBadge.tsx`, `SettingsSheet.tsx`, `InstallPrompt.tsx`.
- [x] **5. Hardcoded sizes, no responsiveness** — Progress ring `size={260}` is fixed px. Font sizes `text-[10px]` through `text-[13px]` are inline hardcodes. `DhikrCard` uses rigid `gap-8` between all sections. Use `clamp()` or viewport-relative values / Tailwind responsive prefixes.
- [x] **6. Header has no identity** — App name "wird al-asas" appears nowhere in the UI. Header is just two clusters of tiny buttons.
- [x] **11. Tap feedback is imperceptible** — `scale: 1.06 → 1` in 150ms is barely visible. This is the core interaction — feedback should be punchy (scale 1.12+, faster in/slower out, paired with a brief ring pulse or ripple).

### Medium
- [x] **7. DayDetailSheet truncates dhikr names** — `truncate` on transliteration strings cuts off content users need to read. Change to `line-clamp-1` or remove truncation and reduce font size.
- [x] **8. InstallPrompt breaks design language** — uses `text-sm font-medium` (not mono) and `text-muted-foreground`. Only component that doesn't follow the mono-everything style. Align it.
- [x] **9. Sheet surfaces have no depth** — `bg-card` (`oklch(0.10 0 0)`) is nearly invisible against `oklch(0.06 0 0)` background. Add `backdrop-blur`, a stronger border, or a slight lightness lift so sheets read as elevated surfaces.

### Low
- [x] **10. DayCompletionBadge is floating text** — "complete" / "partial" raw text in the header has no visual weight. Wrap in a pill or add a subtle dot indicator.
- [x] **12. Contrast violations** — `text-white/30` on near-black background fails WCAG AA at 10px. Lift the minimum muted opacity to `/40` or increase font size at that weight.

---

## Files touched per issue

| Issue | Files |
|-------|-------|
| 1 | `app/globals.css`, `app/layout.tsx`, `components/counter/DhikrCard.tsx` |
| 2 | All components (audit and standardize) |
| 3 | `components/counter/DayCompletionBadge.tsx`, `components/settings/SettingsSheet.tsx`, `components/InstallPrompt.tsx` |
| 4 | `components/counter/ProgressRing.tsx` |
| 5 | `components/counter/ProgressRing.tsx` |
| 6 | `app/page.tsx` |
| 7 | `components/history/DayDetailSheet.tsx` |
| 8 | `components/InstallPrompt.tsx` |
| 9 | `app/globals.css`, `components/history/HistorySheet.tsx`, `components/settings/SettingsSheet.tsx` |
| 10 | `components/counter/DayCompletionBadge.tsx` |
| 11 | `components/counter/DhikrCard.tsx` |
| 12 | All components with `/30` text — lifted to `/40` |
