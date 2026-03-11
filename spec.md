# 3Docarina Shop

## Current State
The Ocarina Music Studio page has product cards each with an inline OcarinaPanel. The panel contains note buttons, horizontal scrolling tablature strip during playback, and preset song buttons. There is no persistent sheet music display on the page itself.

## Requested Changes (Diff)

### Add
- `SheetMusicMiniPlayer` component: a persistent sticky-bottom panel on the Studio page, always visible during playback
- The panel shows a traditional treble clef staff (5 staff lines) with filled note heads positioned correctly for the C5–C6 diatonic range
- Note head positions on staff:
  - C5 = 3rd space (between 3rd and 4th lines)
  - D5 = 4th line
  - E5 = 4th space (between 4th and 5th lines)
  - F5 = 5th line (top)
  - G5 = 1st space above staff
  - A5 = 1st ledger line above staff
  - B5 = space above 1st ledger line
  - C6 = 2nd ledger line above staff
- During playback: current note is highlighted (amber), past notes are faded, upcoming notes are normal
- Staff scrolls/advances so the current note is always centred in the view
- Ledger lines rendered above the staff for A5 and C6
- Treble clef symbol (𝄞) drawn at the left of the staff
- Below the staff: playback controls — song selector pill buttons, Play/Stop button, scale selector dropdown
- Side of the panel: current note name + 4-hole ocarina diagram matching the active note
- Panel is sticky at the bottom of the viewport on the Studio page, dark background, semi-transparent blur

### Modify
- `OcarinaStudio.tsx`: import and render `SheetMusicMiniPlayer` as a sticky bottom panel (fixed to bottom of screen). Pass no product-specific props — it has its own standalone scale selector and song selector.

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/components/SheetMusicMiniPlayer.tsx`
   - SVG-based treble clef staff with 5 lines (10px spacing)
   - Map each of the 8 diatonic notes (C5–D5–E5–F5–G5–A5–B5–C6) to staff Y positions
   - Render note heads as filled ellipses with stems; ledger lines for A5 and C6
   - Horizontal scrolling view: show all song notes, animate active note into centre
   - Scale selector (alto/soprano/bass/bass-low) using existing SCALE_NOTES
   - Song selector buttons from PRESET_SONGS
   - Play/Stop using existing `playMelody` utility
   - Current note side panel with FourHoleDiagram imported from OcarinaPanel
   - Sticky fixed bottom of viewport, z-50, dark bg with backdrop blur
2. Update `OcarinaStudio.tsx` to render `<SheetMusicMiniPlayer />` at the bottom of the page as a fixed panel
3. Add bottom padding to the main content area so content is not hidden behind the sticky panel
