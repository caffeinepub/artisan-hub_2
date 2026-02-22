# Specification

## Summary
**Goal:** Add a '+' increment button next to inventory counts in the product management dashboard to allow administrators to quickly increase stock quantities by 1.

**Planned changes:**
- Add a '+' button next to the inventory count in each product row in the ProductManagementTable component
- Clicking the button increments the inventory count by 1 and saves to the backend
- Show loading state on the button during update
- Display success toast notification after successful increment
- Ensure backend updateProduct function supports partial updates for inventory count only

**User-visible outcome:** Administrators can quickly increment product stock quantities by clicking a '+' button next to the inventory count in the product management table, with immediate feedback through loading states and success notifications.
