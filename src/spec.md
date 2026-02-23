# Specification

## Summary
**Goal:** Add a visual status indicator to show when Stripe has been configured with a green checkmark.

**Planned changes:**
- Update StripeSetup component to display a green checkmark icon with "Stripe Configured" text when a valid Stripe secret key is stored
- Add backend method to return a boolean flag indicating whether Stripe is configured without exposing the actual key
- Status indicator fetches configuration status from backend and updates immediately when Stripe is saved

**User-visible outcome:** Admins can see at a glance whether Stripe has been configured through a green checkmark status indicator in the admin panel.
