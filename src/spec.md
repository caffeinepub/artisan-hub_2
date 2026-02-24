# Specification

## Summary
**Goal:** Fix Add to Cart functionality and implement drag-and-drop product reordering with marketplace display order persistence.

**Planned changes:**
- Fix the Add to Cart button error in ProductCard component to successfully add items to cart with proper toast notifications
- Add displayOrder field to Product type and initialize for all existing products
- Update all product retrieval methods to sort by displayOrder by default
- Create backend method updateProductDisplayOrder for batch updating product order with admin authentication
- Install and configure drag-and-drop library (@dnd-kit) in frontend
- Add drag-and-drop functionality to ProductManagementTable for reordering products by dragging table rows
- Enable drag-and-drop only when 'All' shape filter is active (no filters applied)
- Persist reordered product sequence to backend via updateProductDisplayOrder mutation
- Add visual indicators showing when drag-and-drop is available versus disabled due to active filters
- Ensure reordered products display in custom order on marketplace storefront

**User-visible outcome:** Admin users can fix cart functionality, drag and drop product rows in the dashboard to reorder products (when viewing all products without filters), and see the custom order reflected immediately on the public marketplace storefront. Shoppers can successfully add items to cart and see the products displayed in the admin-defined order.
