# Specification

## Summary
**Goal:** Add a separate Category field to products and implement independent Category filtering alongside the existing Shape filter in the marketplace.

**Planned changes:**
- Add category as a separate Text field on the Product type in the backend
- Update backend createProduct and updateProduct methods to handle category field
- Add category input field in BulkProductUpload component alongside shape field
- Add category column with inline editing in ProductManagementTable
- Create separate "Category" filter section in Marketplace header alongside "Shape" filter section
- Implement independent filtering logic where products can be filtered by shape AND/OR category
- Display both shape and category on ProductCard and ProductDetailView components
- Update React Query hooks to handle category field in product data structures

**User-visible outcome:** Users can assign and edit categories on products separately from shapes, and filter marketplace products using independent Shape and Category filter sections that work together or separately.
