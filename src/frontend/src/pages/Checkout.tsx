import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetCart, useCreateCheckoutSession, useGetProduct } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import type { ShoppingItem } from '../backend';

export default function Checkout() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const { data: cart = [] } = useGetCart();
  const createCheckoutSession = useCreateCheckoutSession();
  const [buyNowProduct, setBuyNowProduct] = useState<bigint | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for Buy Now product
  useEffect(() => {
    const buyNowProductId = sessionStorage.getItem('buyNowProductId');
    if (buyNowProductId) {
      setBuyNowProduct(BigInt(buyNowProductId));
    }
  }, []);

  const { data: product } = useGetProduct(buyNowProduct);

  const items: ShoppingItem[] = buyNowProduct && product
    ? [{
        productName: product.name,
        productDescription: product.stripeProductDescription,
        priceInCents: product.price,
        quantity: BigInt(1),
        currency: 'aud',
      }]
    : cart.map(item => ({
        productName: item.product.name,
        productDescription: item.product.stripeProductDescription,
        priceInCents: item.product.price,
        quantity: item.quantity,
        currency: 'aud',
      }));

  const total = items.reduce((sum, item) => {
    return sum + Number(item.priceInCents) * Number(item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('No items to checkout');
      return;
    }

    if (!actor) {
      toast.error('Unable to connect to the service. Please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      // Clear Buy Now product from session storage
      sessionStorage.removeItem('buyNowProductId');

      // Redirect to Stripe checkout
      window.location.href = session.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create checkout session');
      setIsProcessing(false);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(priceInCents / 100);
  };

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Add some items to your cart to checkout</p>
        <Button onClick={() => navigate({ to: '/' })}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="font-serif text-4xl font-bold mb-8">Checkout</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity.toString()}</p>
                </div>
                <p className="font-semibold">
                  {formatPrice(Number(item.priceInCents) * Number(item.quantity))}
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 border-t-2">
              <p className="text-lg font-bold">Total (AUD)</p>
              <p className="text-2xl font-bold">{formatPrice(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => navigate({ to: buyNowProduct ? '/' : '/basket' })}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={isProcessing || !actor}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Proceed to Payment'
          )}
        </Button>
      </div>
    </div>
  );
}
