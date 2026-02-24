# Specification

## Summary
**Goal:** Add shape filter with bulk inline editing capabilities to the product management table.

**Planned changes:**
- Add shape filter buttons above the product management table that display all unique shape values plus an 'All' option
- Implement filtering logic that shows only products matching the selected shape
- Add bulk inline editing where modifying any field on one selected product applies those changes to all selected products
- Create visual indicators showing which products are selected for bulk editing
- Display confirmation dialog before applying bulk changes
- Create React Query mutation hook for bulk product updates

**User-visible outcome:** Admins can filter products by shape using button tabs above the product management table. When multiple products are selected via checkboxes, editing any field on one product will apply those same changes to all selected products after confirmation.
