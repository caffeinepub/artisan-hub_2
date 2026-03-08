# Artisan Hub

## Current State
- Marketplace page has a hero section, an OcarinaCarousel component (existing), filter buttons (shape/category), a sort select, and a product grid.
- OcarinaStudio page has a hero section, a "How It Works" section, and a product grid with ProductStudioCard components.
- Both pages fetch products via `useGetProducts`.
- There is no continuous auto-scrolling product ticker/banner at the top of either page.

## Requested Changes (Diff)

### Add
- A new `ProductTickerBar` component: a full-width continuously auto-scrolling horizontal strip showing all products (image + title + price). Each item navigates to that product when clicked.
  - Scrolls continuously and automatically (CSS animation, no pause on hover unless explicitly specified — user did NOT request pause on hover).
  - On mobile: 3–5 items visible at once.
  - On desktop: as many items as possible (small fixed-size cards, fill the viewport width).
  - Clicking a product on the Marketplace page opens the ProductDetailView modal (same as clicking a product card).
  - Clicking a product on the OcarinaStudio page navigates to `/` with `?productId=` search param (same as the existing Buy Now link).
  - The bar loops seamlessly: duplicate the list once so the CSS translate animation creates an infinite loop without a jump.

### Modify
- `Marketplace.tsx`: insert `<ProductTickerBar>` at the very top of the page (above the hero section), passing all products and an `onProductClick` handler.
- `OcarinaStudio.tsx`: insert `<ProductTickerBar>` at the very top of the page (above the hero section).

### Remove
- Nothing removed.

## Implementation Plan
1. Create `src/frontend/src/components/ProductTickerBar.tsx`:
   - Accept props: `products: Product[]`, `onProductClick?: (product: Product) => void`.
   - Render a fixed-height bar (e.g. h-24 or h-28) with `overflow-hidden`.
   - Inner strip: flex row of product mini-cards, duplicated once for seamless loop.
   - Each mini-card: small square image (aspect-square, ~80px), title (truncated 1 line), price (AUD).
   - CSS keyframe animation `ticker-scroll` translating X from 0 to -50% (since list is doubled), `linear`, `infinite`, duration computed to feel smooth (e.g. 40s for typical lists, or `calc(N * 3s)` via inline style).
   - On click: call `onProductClick(product)` if provided; otherwise navigate to `/?productId=<id>` using `useNavigate` from tanstack-router.
   - Add deterministic `data-ocid` markers: `ticker.item.1`, `ticker.item.2`, etc.
   - Use Tailwind for styling; no third-party carousel library needed.
2. Update `Marketplace.tsx`: import and render `<ProductTickerBar products={allProducts} onProductClick={handleOpenProduct} />` as the first child inside the top-level `<div>`, before the hero section.
3. Update `OcarinaStudio.tsx`: import and render `<ProductTickerBar products={products} />` as the first child inside the top-level `<div>`, before the hero section. Since no modal exists on this page, clicking navigates to marketplace with the productId param.
4. Add the CSS keyframe to `index.css` (or use a Tailwind `animate-` class via arbitrary value if supported).
