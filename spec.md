# Specification

## Summary
**Goal:** Replace the search bar on the Marketplace page with a horizontally scrollable carousel of studio-style product cards at the top of the page.

**Planned changes:**
- Remove the search bar from the Marketplace page.
- Add a horizontally scrollable carousel at the top of the Marketplace page (where the search bar was).
- Reuse the same product card layout from OcarinaStudio.tsx, displaying product image, title, description, and assigned pitch scale.
- Each carousel card includes a "Play Demo" button (plays the ocarinaSynth demo tone sequence for the card's pitch scale, with a visual playing indicator), a "Play Ocarina" button (opens the interactive OcarinaPanel for the card's pitch scale with a close control), and a "Buy Now" link (navigates to the product detail view).
- Fetch products for the carousel using the existing `useProducts` React Query hook.
- Apply the same pitch-scale assignment logic from OcarinaStudio.tsx to carousel cards.
- All other Marketplace page sections (hero, filter tabs, featured/most-viewed/best-selling/newest product sections) remain unchanged.

**User-visible outcome:** Visitors to the Marketplace page see a horizontally scrollable row of interactive product cards at the top, where they can play demos, open the ocarina panel, or go directly to a product — while all existing marketplace content remains intact below.
