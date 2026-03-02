# Specification

## Summary
**Goal:** Auto-select a shape-specific description template in the BulkProductUpload component based on each product's shape field value.

**Planned changes:**
- When a product's shape field changes to 'Turtle', 'Dolphin', 'Frog', or 'Whale', automatically apply the matching named template to that product's description field.
- When a product's shape field is set to any other value or is blank, fall back to the 'Default' template.
- Skip auto-population if the user has manually edited the description field for that product.
- Allow the template dropdown to continue functioning independently for manual overrides.

**User-visible outcome:** Users uploading bulk products will have description fields automatically populated with the appropriate shape-specific template content as soon as they set a product's shape, reducing manual template selection while still allowing manual overrides.
