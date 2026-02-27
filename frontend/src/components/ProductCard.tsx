import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { Product } from '../backend';
import { useAddToCart } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  const { identity } = useInternetIdentity();
  
  const imageUrl = product.images && product.images.length > 0
    ? product.images[0].getDirectURL() 
    : '/assets/generated/product-placeholder.dim_400x400.png';

  const handleAddToBasket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!identity) {
      // User not logged in - show error via mutation
      try {
        await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      } catch (error) {
        // Error handling is done in the mutation's onError
      }
      return;
    }

    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
    } catch (error) {
      // Error handling is done in the mutation's onError
    }
  };

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(Number(priceInCents) / 100);
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/assets/generated/product-placeholder.dim_400x400.png';
          }}
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
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
