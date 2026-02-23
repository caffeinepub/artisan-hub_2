# Specification

## Summary
**Goal:** Add product filtering by shape and category to the Marketplace header and create a description template management system for admins.

**Planned changes:**
- Add clickable filter tabs to Marketplace header for filtering products by shape and/or category
- Implement filter state management and dynamic product filtering logic
- Add "Description Templates" tab to admin Dashboard with template management interface
- Create DescriptionTemplateManager component for creating and editing templates
- Add React Query hooks for template CRUD operations with admin authentication
- Update BulkProductUpload to use template selector dropdown instead of single default description
- Create backend data structure and methods for storing and managing description templates
- Initialize backend with default description template on first deployment

**User-visible outcome:** Customers can filter marketplace products by clicking shape/category tabs in the header. Admins can create, edit, and delete description templates in the Dashboard, then select which template to use when bulk uploading products.
