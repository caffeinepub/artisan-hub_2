import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useGetCart, useCreateCheckoutSession, useGetProduct, useValidateDiscountCode } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingCart, Tag, X, Truck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ShoppingItem, DiscountCode } from '../backend';
import { Variant_percentage_fixedAmount } from '../backend';

export default function Checkout() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const { data: cart = [] } = useGetCart();
  const createCheckoutSession = useCreateCheckoutSession();
  const validateDiscountCode = useValidateDiscountCode();
  const [buyNowProduct, setBuyNowProduct] = useState<bigint | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null);
  const [promoError, setPromoError] = useState('');

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

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.priceInCents) * Number(item.quantity);
  }, 0);

  const calculateDiscount = (code: DiscountCode | null, subtotalCents: number): number => {
    if (!code) return 0;
    if (code.discountType === Variant_percentage_fixedAmount.percentage) {
      return Math.round(subtotalCents * (code.value / 100));
    } else {
      // Fixed amount in dollars → convert to cents
      return Math.min(Math.round(code.value * 100), subtotalCents);
    }
  };

  const discountAmount = calculateDiscount(appliedCode, subtotal);
  const total = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async () => {
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }
    try {
      const result = await validateDiscountCode.mutateAsync(code);
      if (result) {
        setAppliedCode(result);
        setPromoError('');
        toast.success(`Promo code "${result.code}" applied!`);
      } else {
        setAppliedCode(null);
        setPromoError('Invalid or inactive promo code');
      }
    } catch {
      setPromoError('Failed to validate promo code. Please try again.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedCode(null);
    setPromoInput('');
    setPromoError('');
  };

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

      // Apply discount to items if a code is applied
      let checkoutItems = items;
      if (appliedCode && discountAmount > 0) {
        // Distribute discount proportionally across items
        const discountRatio = discountAmount / subtotal;
        checkoutItems = items.map(item => {
          const itemTotal = Number(item.priceInCents) * Number(item.quantity);
          const itemDiscount = Math.round(itemTotal * discountRatio);
          const discountedPrice = Math.max(1, Number(item.priceInCents) - Math.round(itemDiscount / Number(item.quantity)));
          return { ...item, priceInCents: BigInt(discountedPrice) };
        });
      }

      const session = await createCheckoutSession.mutateAsync({
        items: checkoutItems,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      sessionStorage.removeItem('buyNowProductId');
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

            {/* Subtotal */}
            <div className="flex justify-between items-center pt-2">
              <p className="text-muted-foreground">Subtotal</p>
              <p className="font-medium">{formatPrice(subtotal)}</p>
            </div>

            {/* Discount line */}
            {appliedCode && discountAmount > 0 && (
              <div className="flex justify-between items-center text-green-700 dark:text-green-400">
                <div className="flex items-center gap-1.5">
                  <Tag className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Promo: {appliedCode.code}
                    {appliedCode.discountType === Variant_percentage_fixedAmount.percentage
                      ? ` (${appliedCode.value}% off)`
                      : ` ($${appliedCode.value.toFixed(2)} off)`}
                  </span>
                </div>
                <p className="font-medium">−{formatPrice(discountAmount)}</p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t-2">
              <p className="text-lg font-bold">Total (AUD)</p>
              <p className="text-2xl font-bold">{formatPrice(total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Code */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Promo Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appliedCode ? (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-mono font-semibold text-green-700 dark:text-green-400">{appliedCode.code}</span>
                <Badge variant="secondary" className="text-xs">
                  {appliedCode.discountType === Variant_percentage_fixedAmount.percentage
                    ? `${appliedCode.value}% off`
                    : `$${appliedCode.value.toFixed(2)} off`}
                </Badge>
              </div>
              <Button variant="ghost" size="icon" onClick={handleRemovePromo} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={validateDiscountCode.isPending}
                  className="shrink-0"
                >
                  {validateDiscountCode.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
              {promoError && (
                <div className="flex items-center gap-1.5 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {promoError}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Notices */}
      <Alert className="mb-6 border-primary/20 bg-primary/5">
        <Truck className="h-4 w-4 text-primary" />
        <AlertDescription className="space-y-1">
          <p className="font-medium text-foreground">✓ Free postage included on every order</p>
          <p className="text-sm text-muted-foreground">✗ Please note: no returns are accepted on any purchases</p>
        </AlertDescription>
      </Alert>

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
