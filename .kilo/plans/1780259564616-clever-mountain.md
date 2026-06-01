# Plan: BismillahHeader Layout Refinements

## Goal

Three targeted adjustments to `BismillahHeader` and its placement in `DhikrCard`:

1. Make the Bismillah glyph narrower (~60% screen width) instead of spanning full card width
2. Push the entire header block higher in the card
3. Increase the gap between the Bismillah glyph and the subtitle row
4. Restore `ResetButton` to its pre-bismillah position

---

## Changes

### 1. `components/counter/BismillahHeader.tsx`

**Bismillah font size — make it ~60% screen width**

The current value is `clamp(30px, 8vw, 44px)`. The Amiri U+FDFD ligature is wide — at 44px it stretches nearly the full card. To target ~60% screen width on a 390px phone:
- 60% of 390px = 234px of visual width
- The ligature is roughly 5–6× its font-size wide in Amiri
- A font-size of ~36–38px gives roughly 180–228px rendered width — well within 60% of screen

Use `clamp(24px, 6vw, 36px)`:
- At 390px wide: `6vw = 23.4px` → lower bound `24px` kicks in
- At 430px wide: `6vw = 25.8px`
- Max cap at `36px`

This brings the glyph comfortably within 60% of most phone widths.

**Gap between glyph and subtitle — increase from `gap-2` to `gap-5`**

`gap-2` = 8px is too tight. `gap-5` = 20px gives clear visual separation between the ornate Bismillah and the small subtitle row.

**Summary of BismillahHeader.tsx changes:**
- Line 7: `gap-2` → `gap-5`
- Line 19: `fontSize: "clamp(30px, 8vw, 44px)"` → `fontSize: "clamp(24px, 6vw, 36px)"`

---

### 2. `components/counter/DhikrCard.tsx`

**BismillahHeader wrapper — push up from `calc(40% - 222px)` to `calc(40% - 270px)`**

This moves the header 48px higher, providing more breathing room from the ring area.

**ResetButton — restore to original `calc(40% - 182px)`**

The original pre-bismillah position was `calc(40% - 182px)`. It was bumped to `calc(40% - 150px)` during the bismillah implementation to avoid overlap. With the header now at `-270px` (bottom ~at `-210px` for a ~60px tall block), and reset button at `-182px`, there is still ~28px of gap — enough clearance, no overlap.

Layout after changes:

| Element | `top` | approx bottom |
|---|---|---|
| BismillahHeader | `calc(40% - 270px)` | ~`calc(40% - 210px)` (block ~60px tall) |
| ResetButton | `calc(40% - 182px)` | ~`calc(40% - 158px)` (~24px tall) |
| ProgressRing | `calc(40% - 130px)` | `calc(40% + 130px)` |

28px gap between BismillahHeader bottom and ResetButton top. ✓

---

## Files changed

| File | Change |
|---|---|
| `components/counter/BismillahHeader.tsx` | `gap-2` → `gap-5`; font-size `clamp(30px, 8vw, 44px)` → `clamp(24px, 6vw, 36px)` |
| `components/counter/DhikrCard.tsx` | BismillahHeader `top` → `calc(40% - 270px)`; ResetButton `top` → `calc(40% - 182px)` |
