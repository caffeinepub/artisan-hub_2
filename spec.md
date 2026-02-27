# Specification

## Summary
**Goal:** Add discount code support, configurable bonus items and app access URL, free postage/no returns notices, and updated T&C and Privacy Policy pages to the Original Creations Hub store.

**Planned changes:**
- Add `DiscountCode` type and stable storage to the backend with admin CRUD methods (`createDiscountCode`, `updateDiscountCode`, `deleteDiscountCode`, `getDiscountCodes`) and a public `validateDiscountCode` method
- Add `BonusItemConfig` type and `proOcarinaAppUrl` field to backend payment settings with admin getter/setter methods, all persisted in stable storage
- Add React Query hooks for discount codes (`useDiscountCodes`, `useCreateDiscountCode`, `useUpdateDiscountCode`, `useDeleteDiscountCode`, `useValidateDiscountCode`) and payment settings (`usePaymentSettings`, `useUpdatePaymentSettings`)
- Add a "Payment Settings" tab to the admin Dashboard with three sections: Discount Codes (table with create/edit/delete), Bonus Item (title, description, URL, enabled toggle), and Pro Ocarina Learning App (URL input)
- Add a "Promo Code" input with Apply button to the Checkout page; validate against the backend and show discount/error, passing the discount to the Stripe session
- Update the Payment Success page to display the configured bonus item (when enabled) and Pro Ocarina Learning App link (when URL is set)
- Add static free postage and no returns notices to ProductDetailView, Checkout page, and Payment Success page
- Update the Terms & Conditions page with Shipping (free postage), Returns (no returns/all sales final), and Digital Inclusions (Pro Ocarina Learning App) sections
- Update the Privacy Policy page with Order Fulfillment (free postage), Digital Products & App Access, and Returns & Refunds (no returns data collected) sections

**User-visible outcome:** Admins can create and manage promo codes and configure a bonus item and app URL from the Dashboard. Customers can apply promo codes at checkout for a discount. Every order confirmation shows the bonus item and Pro Ocarina app link when configured. Free postage and no returns notices appear on product pages, checkout, and the confirmation page, and the T&C and Privacy Policy pages reflect these policies.
