import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../backend';
import { useAddToCart } from '../hooks/useQueries';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useAddToCart();
  
  const imageUrl = product.images.length > 0 
    ? product.images[0].getDirectURL() 
    : '/assets/generated/product-placeholder.dim_400x400.png';

  const handleAddToBasket = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success('Added to basket!');
    } catch (error) {
      toast.error('Failed to add to basket');
      console.error(error);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{product.shape}</p>
        <div className="flex items-center justify-between">
          <p className="font-semibold text-lg">${(Number(product.price) / 100).toFixed(2)}</p>
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
