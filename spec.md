# 3Docarina Shop

## Current State
- Marketplace hero uses two short admin-editable fallback strings ("Original Creations Market", "Discover unique original designs") with no product copy or brand story
- `FourHoleDiagram` component uses `flex flex-row` rendering all 4 holes in a single horizontal line — should be 2×2 grid
- Hero branding language references artisan/handcrafted style (outdated)
- Audio upload and fingering settings have admin checks in OcarinaPanel but SheetMusicMiniPlayer settings drawer has no admin check

## Requested Changes (Diff)

### Add
- Modern hero section on Marketplace with: bold 3D printing/music learning brand story, feature highlights (3D-printed ocarinas, music studio, original designs), professional layout with sections below hero explaining what the shop offers
- Brand copy focused on: 3D modeling & printing technology, original ocarina designs, music learning platform

### Modify
- `FourHoleDiagram` in OcarinaPanel.tsx: change container from `flex flex-row` to `grid grid-cols-2` so holes render in 2×2 parallel layout everywhere (note keys, tablature strip, mini-player)
- Marketplace hero fallback text: update to reflect 3D printing and music learning brand
- Any remaining artisan/handcrafted language replaced with 3D printing/design language
- SheetMusicMiniPlayer fingering and audio-related settings: ensure admin-only visibility

### Remove
- All artisan/handcrafted/sole-trader language from homepage copy

## Implementation Plan
1. Fix `FourHoleDiagram` grid layout (grid-cols-2 instead of flex-row) in OcarinaPanel.tsx
2. Redesign Marketplace.tsx hero and below-the-fold sections with modern 3D printing brand copy and feature highlights
3. Update fallback motto/tagline strings to reflect new brand direction
4. Audit SheetMusicMiniPlayer for admin-only gating on fingering/audio settings
