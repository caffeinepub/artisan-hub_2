import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateCheckoutSession, useGetCart, useGetProduct } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import type { Product, CartItem } from '../backend';

export default function Checkout() {
  const [mode, setMode] = useState<'single' | 'cart' | null>(null);
  const [singleProduct, setSingleProduct] = useState<Product | null>(null);
  const createCheckout = useCreateCheckoutSession();
  const { data: cartItems = [] } = useGetCart();
  const getProduct = useGetProduct();

  useEffect(() => {
    const buyNowProductId = sessionStorage.getItem('buyNowProductId');
    
    if (buyNowProductId) {
      setMode('single');
      getProduct.mutateAsync(BigInt(buyNowProductId)).then((product) => {
        if (product) {
          setSingleProduct(product);
        } else {
          toast.error('Product not found');
        }
      }).catch(() => {
        toast.error('Failed to load product');
      });
    } else {
      setMode('cart');
    }
  }, []);

  const handleCheckout = async () => {
    try {
      let items;

      if (mode === 'single' && singleProduct) {
        items = [
          {
            productName: singleProduct.name,
            productDescription: singleProduct.stripeProductDescription,
            priceInCents: BigInt(singleProduct.price),
            quantity: BigInt(1),
            currency: 'eur',
          },
        ];
      } else if (mode === 'cart' && cartItems.length > 0) {
        items = cartItems.map((item: CartItem) => ({
          productName: item.product.name,
          productDescription: item.product.stripeProductDescription,
          priceInCents: BigInt(item.product.price),
          quantity: BigInt(item.quantity),
          currency: 'eur',
        }));
      } else {
        toast.error('No products to checkout');
        return;
      }

      const session = await createCheckout.mutateAsync(items);

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      window.location.href = session.url;
    } catch (error) {
      toast.error('Failed to create checkout session');
      console.error(error);
    }
  };

  if (!mode) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (mode === 'single' && !singleProduct) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Loading Product...</h1>
      </div>
    );
  }

  if (mode === 'cart' && cartItems.length === 0) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">No Products Selected</h1>
        <p className="text-muted-foreground">Please add items to your basket first.</p>
      </div>
    );
  }

  const displayItems = mode === 'single' && singleProduct 
    ? [{ product: singleProduct, quantity: BigInt(1) }] 
    : cartItems;

  const total = displayItems.reduce(
    (sum, item) => sum + Number(item.product.price) * Number(item.quantity),
    0
  );

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-serif text-4xl font-bold mb-8">Checkout</h1>
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {displayItems.map((item) => {
              const imageUrl = item.product.images.length > 0
                ? item.product.images[0].getDirectURL()
                : '/assets/generated/product-placeholder.dim_400x400.png';

              return (
                <div key={item.product.id.toString()} className="flex gap-4">
                  <img
                    src={imageUrl}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.product.shape}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity.toString()}</p>
                  </div>
                  <p className="font-semibold">
                    ${((Number(item.product.price) * Number(item.quantity)) / 100).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${(total / 100).toFixed(2)}</span>
            </div>
          </div>
          <Button 
            onClick={handleCheckout} 
            className="w-full gap-2" 
            disabled={createCheckout.isPending}
            size="lg"
          >
            <ShoppingCart className="h-4 w-4" />
            {createCheckout.isPending ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
