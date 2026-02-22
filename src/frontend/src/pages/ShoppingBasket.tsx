import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from '@tanstack/react-router';
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useGetCart, useUpdateCartItem, useRemoveCartItem, useGetCartTotal } from '../hooks/useQueries';

export default function ShoppingBasket() {
  const navigate = useNavigate();
  const { data: cartItems = [], isLoading } = useGetCart();
  const { data: cartTotal = BigInt(0) } = useGetCartTotal();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();

  const handleUpdateQuantity = async (productId: bigint, currentQuantity: number, delta: number) => {
    const newQuantity = currentQuantity + delta;
    if (newQuantity < 1) return;

    try {
      await updateCartItem.mutateAsync({ productId, quantity: newQuantity });
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
    sessionStorage.removeItem('buyNowProductId');
    navigate({ to: '/checkout' });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <p className="text-muted-foreground">Loading your basket...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container max-w-4xl py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="font-serif text-3xl font-bold mb-4">Your Basket is Empty</h1>
        <p className="text-muted-foreground mb-8">
          Add some beautiful artisan products to your basket to get started.
        </p>
        <Button onClick={() => navigate({ to: '/' })} size="lg">
          Browse Marketplace
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="font-serif text-4xl font-bold mb-8">Shopping Basket</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          {cartItems.map((item) => {
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
                      <h3 className="font-serif font-semibold text-lg mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.product.shape}
                      </p>
                      <p className="font-semibold">
                        ${(Number(item.product.price) / 100).toFixed(2)}
                      </p>
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
                          onClick={() => handleUpdateQuantity(item.product.id, Number(item.quantity), -1)}
                          disabled={updateCartItem.isPending || Number(item.quantity) <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {item.quantity.toString()}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpdateQuantity(item.product.id, Number(item.quantity), 1)}
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
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items ({cartItems.length})</span>
                  <span>${(Number(cartTotal) / 100).toFixed(2)}</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(Number(cartTotal) / 100).toFixed(2)}</span>
              </div>
              <Button onClick={handleCheckout} size="lg" className="w-full gap-2">
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
