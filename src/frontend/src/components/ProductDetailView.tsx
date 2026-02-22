import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../backend';
import { useAddToCart } from '../hooks/useQueries';

interface ProductDetailViewProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductDetailView({ product, open, onOpenChange }: ProductDetailViewProps) {
  const navigate = useNavigate();
  const addToCart = useAddToCart();

  if (!product) return null;

  const imageUrl = product.images.length > 0
    ? product.images[0].getDirectURL()
    : '/assets/generated/product-placeholder.dim_400x400.png';

  const handleBuyNow = () => {
    sessionStorage.setItem('buyNowProductId', product.id.toString());
    onOpenChange(false);
    navigate({ to: '/checkout' });
  };

  const handleAddToBasket = async () => {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      toast.success('Added to basket!');
    } catch (error) {
      toast.error('Failed to add to basket');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{product.shape}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Details</h3>
              <p className="text-sm text-muted-foreground">{product.stripeProductDescription}</p>
            </div>
            <div className="pt-4 border-t">
              <p className="text-3xl font-bold font-serif mb-4">
                ${(Number(product.price) / 100).toFixed(2)}
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddToBasket} 
                  variant="outline" 
                  size="lg" 
                  className="flex-1 gap-2"
                  disabled={addToCart.isPending}
                >
                  {addToCart.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4" />
                  )}
                  Add to Basket
                </Button>
                <Button onClick={handleBuyNow} size="lg" className="flex-1">
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
