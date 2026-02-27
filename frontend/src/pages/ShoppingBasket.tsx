import { useNavigate } from '@tanstack/react-router';
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useGetCartTotal } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

export default function ShoppingBasket() {
  const navigate = useNavigate();
  const { data: cart = [], isLoading } = useGetCart();
  const { data: total = BigInt(0) } = useGetCartTotal();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const handleUpdateQuantity = async (productId: bigint, currentQuantity: bigint, delta: number) => {
    const newQuantity = Number(currentQuantity) + delta;
    if (newQuantity < 1) return;

    try {
      await updateCartItem.mutateAsync({ productId, newQuantity: BigInt(newQuantity) });
    } catch (error) {
      toast.error('Failed to update quantity');
      console.error(error);
    }
  };

  const handleRemoveItem = async (productId: bigint) => {
    try {
      await removeCartItem.mutateAsync(productId);
      toast.success('Item removed from basket');
    } catch (error) {
      toast.error('Failed to remove item');
      console.error(error);
    }
  };

  const handleCheckout = () => {
    navigate({ to: '/checkout' });
  };

  const formatPrice = (priceInCents: bigint) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(Number(priceInCents) / 100);
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl font-bold mb-4">Your basket is empty</h1>
        <p className="text-muted-foreground mb-6">Add some items to your basket to get started</p>
        <Button onClick={() => navigate({ to: '/' })}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="font-serif text-4xl font-bold mb-8">Shopping Basket</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const imageUrl = item.product.images.length > 0
              ? item.product.images[0].getDirectURL()
              : '/assets/generated/product-placeholder.dim_400x400.png';

            return (
              <Card key={item.product.id.toString()}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-serif font-semibold text-lg mb-1">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{item.product.shape}</p>
                      <p className="font-semibold">{formatPrice(item.product.price)}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.product.id)}
                        disabled={removeCartItem.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity, -1)}
                          disabled={Number(item.quantity) <= 1 || updateCartItem.isPending}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity.toString()}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity, 1)}
                          disabled={updateCartItem.isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-lg">
                <span>Subtotal</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl font-bold border-t pt-4">
                <span>Total (AUD)</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full" size="lg">
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
