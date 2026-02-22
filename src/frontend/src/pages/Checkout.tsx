import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useCreateCheckoutSession, useGetCart, useGetProduct } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import type { Product, CartItem } from '../backend';

export default function Checkout() {
  const [mode, setMode] = useState<'single' | 'cart' | null>(null);
  const [singleProduct, setSingleProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !address.trim() || !city.trim() || !postalCode.trim() || !country.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

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
    <div className="container max-w-4xl py-12">
      <h1 className="font-serif text-4xl font-bold mb-8">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New York"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="10001"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gap-2" disabled={createCheckout.isPending}>
                  <ShoppingCart className="h-4 w-4" />
                  {createCheckout.isPending ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
