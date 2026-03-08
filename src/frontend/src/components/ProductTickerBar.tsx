import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import type { Product } from "../backend";

interface ProductTickerBarProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
}

function TickerItem({
  product,
  ocid,
  onClick,
}: {
  product: Product;
  ocid?: string;
  onClick: () => void;
}) {
  const imageUrl =
    product.images.length > 0
      ? product.images[0].getDirectURL()
      : "/assets/generated/product-placeholder.dim_400x400.png";

  const priceAUD = `A$${(Number(product.price) / 100).toFixed(2)}`;

  return (
    <button
      type="button"
      data-ocid={ocid}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-white/10 transition-colors duration-200 shrink-0 group"
      style={{ minWidth: 0 }}
    >
      {/* Product thumbnail */}
      <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-white/10 ring-1 ring-white/20">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/generated/product-placeholder.dim_400x400.png";
          }}
        />
      </div>

      {/* Text info */}
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-medium text-white/90 truncate max-w-[100px] leading-tight">
          {product.name}
        </span>
        <span className="text-xs font-semibold text-amber-300 leading-tight">
          {priceAUD}
        </span>
      </div>

      {/* Separator dot */}
      <span className="ml-1 text-white/20 text-base select-none" aria-hidden>
        ·
      </span>
    </button>
  );
}

export default function ProductTickerBar({
  products,
  onProductClick,
}: ProductTickerBarProps) {
  const navigate = useNavigate();

  // Deduplicate + ensure we have a usable list
  const items = useMemo(() => {
    if (products.length === 0) return [];
    // Duplicate the list for seamless loop
    return [...products, ...products];
  }, [products]);

  if (products.length === 0) return null;

  // Duration: ~3s per item, minimum 20s
  const duration = Math.max(products.length * 3, 20);

  const handleClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate({ to: "/", search: { productId: product.id.toString() } });
    }
  };

  return (
    <div
      data-ocid="ticker.bar"
      className="w-full overflow-hidden border-b border-white/10"
      style={{ background: "oklch(0.22 0.04 30 / 0.92)" }}
      aria-label="Product showcase"
    >
      {/* Inner scrolling strip */}
      <div
        className="animate-ticker flex items-center"
        style={{
          width: "max-content",
          animationDuration: `${duration}s`,
        }}
      >
        {items.map((product, index) => {
          // Only assign ocid to the first copy (indices 0..products.length-1)
          const isFirstCopy = index < products.length;
          const ocid = isFirstCopy ? `ticker.item.${index + 1}` : undefined;

          return (
            <TickerItem
              key={`${product.id.toString()}-${index}`}
              product={product}
              ocid={ocid}
              onClick={() => handleClick(product)}
            />
          );
        })}
      </div>
    </div>
  );
}
