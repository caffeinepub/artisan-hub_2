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

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(Number(priceInCents) / 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Shape</p>
              <p className="text-lg">{product.shape}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p className="text-base leading-relaxed">{product.stripeProductDescription}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Price</p>
              <p className="text-3xl font-bold">{formatPrice(product.price)}</p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddToBasket}
                disabled={addToCart.isPending}
                variant="outline"
                className="flex-1 gap-2"
              >
                {addToCart.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Add to Basket
              </Button>
              <Button onClick={handleBuyNow} className="flex-1">
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
