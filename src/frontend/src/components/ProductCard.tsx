import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingCart } from "lucide-react";
import { useState } from "react";
import type { Product } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAddToCart } from "../hooks/useQueries";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { identity } = useInternetIdentity();
  const [imgLoaded, setImgLoaded] = useState(false);

  const imageUrl =
    product.images && product.images.length > 0
      ? product.images[0].getDirectURL()
      : "/assets/generated/product-placeholder.dim_400x400.png";

  const handleAddToBasket = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!identity) {
      // User not logged in - show error via mutation
      try {
        await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      } catch (_error) {
        // Error handling is done in the mutation's onError
      }
      return;
    }

    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
    } catch (_error) {
      // Error handling is done in the mutation's onError
    }
  };

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(Number(priceInCents) / 100);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden bg-muted relative">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "/assets/generated/product-placeholder.dim_400x400.png";
            setImgLoaded(true);
          }}
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
          <span className="line-clamp-1">{product.shape}</span>
          <span>•</span>
          <span className="line-clamp-1">{product.category}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">{formatPrice(product.price)}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddToBasket}
            disabled={addToCart.isPending}
            className="gap-1"
          >
            {addToCart.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <ShoppingCart className="h-3 w-3" />
            )}
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
