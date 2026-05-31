# Design System — Al Wird Al-Asas

## References
- **Manuscript**: Al Wird Al-Asas printed layout — white ground, scholarly Arabic calligraphy, warm gold count labels, italic serif transliteration, generous vertical space
- **Behold app**: Near-black canvas, pure white primary text, warm amber single accent, ALL CAPS spaced metadata labels, bold sans headings, hairline dividers, zero chrome

## Fonts

| Role | Font | Notes |
|------|------|-------|
| Arabic dhikr text | IBM Plex Sans Arabic | `next/font/google` → `IBM_Plex_Sans_Arabic`. Variable: `--font-arabic` |
| UI text, transliterations, labels, counts | Geist Mono | Already in project. Variable: `--font-geist-mono` |

Geist Sans (`--font-geist-sans`) is loaded but not used in the UI — Geist Mono covers all English roles.

## Color Palette

All values in oklch (Tailwind v4 native).

| Token | oklch | Approx hex | Role |
|-------|-------|-----------|------|
| `--background` | `oklch(0.06 0 0)` | ~#0A0A0A | App canvas — near-black, not pure black |
| `--foreground` | `oklch(1 0 0)` | #FFFFFF | Primary text (Arabic, headings) |
| `--muted-foreground` | `oklch(0.55 0 0)` | ~#808080 | Secondary text (translation, dimmed labels) |
| `--accent` | `oklch(0.72 0.10 70)` | ~#C9A36A | Warm amber — count labels, progress ring stroke, completion accent |
| `--border` | `oklch(1 0 0 / 8%)` | white/8% | Hairline dividers |
| `--card` | `oklch(0.10 0 0)` | ~#1A1A1A | Sheet/overlay surfaces |

## Typography Scale

| Element | Font | Size | Weight | Style | Case |
|---------|------|------|--------|-------|------|
| Arabic dhikr | IBM Plex Sans Arabic | 2.5–3rem | 400 | — | — |
| Count label `[ 200 / ٢٠٠ ]` | Geist Mono | 0.7rem | 400 | — | — |
| Transliteration | Geist Mono | 0.85rem | 400 | italic | — |
| Translation | Geist Mono | 0.8rem | 400 | — | — |
| UI labels (SETTINGS, TODAY…) | Geist Mono | 0.65rem | 400 | — | uppercase, tracked |

## Layout Principles

- **Dark canvas, no borders on interactive surfaces** — tap targets defined by position, not chrome
- **Generous vertical space** — each dhikr card owns its full viewport height
- **Single accent color** — amber used only for: count label, progress ring fill, completion overlay accent
- **No decorative elements** — no shadows, no gradients, no icons beyond the gear (⚙)
- **Hairline dividers only** when separating distinct regions (settings sheet rows)

## Count Label Format

```
[ 200 / ٢٠٠ ]
```

Both numerals shown — Western left, Arabic-Indic right. Amber color. Geist Mono.

## Progress Ring

- Track: `white/10%` on dark background
- Fill: amber (`--accent`) — animates from 12 o'clock via `rotate: -90`
- On completion: fill stays amber, brief pulse

## Completion Overlay

- Full-screen dark scrim (`oklch(0 0 0 / 85%)`)
- Arabic text `تَقَبَّلَ اللَّهُ` centered, white, IBM Plex Sans Arabic, large
- Tap anywhere to dismiss — no button, no chrome

## Decisions Log

| Date | Decision |
|------|----------|
| 2026-05-30 | Dark theme (Behold-style), not white (manuscript is print reference only) |
| 2026-05-30 | Arabic font: IBM Plex Sans Arabic (minimal, geometric, zero calligraphic flourish) |
| 2026-05-30 | English/UI font: Geist Mono (already in project, mono for all English roles) |
| 2026-05-30 | Warm amber accent, single color, used sparingly |
