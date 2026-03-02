# Specification

## Summary
**Goal:** Add a default description template and four shape-specific description templates (Turtle, Dolphin, Frog, Whale) to the backend, and update the BulkProductUpload component to use these templates via a dropdown.

**Planned changes:**
- Update (or create) the "Default" description template in backend stable storage with the specified base text about clear sound, Pro Learning App, and free postage
- Seed four shape-specific templates ("Turtle", "Dolphin", "Frog", "Whale") in backend stable storage during initialisation, each with a short shape-to-melody story followed by the base text; seeding is idempotent
- Update the BulkProductUpload frontend component to default to the "Default" template on load, pre-populating all description fields with its content
- Add all five templates (Default, Turtle, Dolphin, Frog, Whale) as selectable options in the template dropdown
- When the user changes the selected template, update all unedited description fields with the newly selected template's content; manually edited fields are not overwritten

**User-visible outcome:** In the Bulk Product Upload screen, traders see description fields pre-filled with the default ocarina description. They can switch to a shape-specific template (Turtle, Dolphin, Frog, or Whale) from the dropdown to apply the corresponding story-driven description to all unedited items. All five templates are also visible in Dashboard > Description Templates.
