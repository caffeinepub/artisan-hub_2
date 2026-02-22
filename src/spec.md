# Specification

## Summary
**Goal:** Add description auto-copy functionality to bulk product upload and change platform currency to Australian dollars.

**Planned changes:**
- Update BulkProductUpload component to auto-copy description field from first item to subsequent items when auto-copy is enabled
- Change all price displays across frontend components to show Australian dollar formatting with '$' symbol and 'AUD' label
- Update backend Stripe checkout session creation to use Australian dollars (AUD) as the currency

**User-visible outcome:** When uploading products in bulk with auto-copy enabled, the description field will automatically copy from the first product to all others. All prices throughout the application will display in Australian dollars ($AUD), and Stripe checkout will process payments in AUD.
