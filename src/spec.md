# Specification

## Summary
**Goal:** Enhance product management with easier stock editing and display total inventory value on dashboard.

**Planned changes:**
- Add increment (+) and decrement (-) buttons next to inventory counts in the product management table for quick stock adjustments
- Display total inventory value card on the dashboard showing the sum of (price × inventory count) for all products
- Create backend method to calculate total inventory value across all products
- Create React Query hook to fetch and display total inventory value with automatic updates

**User-visible outcome:** Admins can quickly adjust product stock counts with +/- buttons in the management table and see the total potential value of all inventory displayed on the dashboard.
