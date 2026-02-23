# Specification

## Summary
**Goal:** Replace AI-generated descriptions with template-based population in bulk upload and add bulk delete capability to product management.

**Planned changes:**
- Remove the "Generate AI Description" button from the bulk upload interface
- Automatically populate description fields using the selected template from the dropdown
- Add checkbox selection to each product row in the product management table
- Add a "Delete Selected" button that deletes multiple products with confirmation
- Create a React Query mutation hook for bulk delete operations

**User-visible outcome:** Admins can quickly populate product descriptions using templates during bulk upload without clicking generate buttons, and can select and delete multiple products at once from the product management table.
