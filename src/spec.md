# Specification

## Summary
**Goal:** Allow admins to delete Stripe payment configuration from the admin panel.

**Planned changes:**
- Add a "Delete Stripe Configuration" button to the StripeSetup component that is visible when Stripe is configured
- Implement a confirmation dialog that warns about disabling payment processing before deletion
- Create a useDeleteStripeConfig React Query mutation hook that calls the backend and invalidates the cache
- Add a backend deleteStripeConfig() method with admin authentication that clears the stored Stripe secret key and allowed countries
- Update the StripeSetup component to refresh and show the configuration form again after successful deletion

**User-visible outcome:** Admins can remove Stripe payment settings with a delete button that shows a confirmation dialog, and after deletion the configuration form becomes available again for entering new credentials.
