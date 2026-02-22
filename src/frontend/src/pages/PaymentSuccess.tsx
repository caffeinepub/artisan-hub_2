import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { useRemoveAllCartItems } from '../hooks/useQueries';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const clearCart = useRemoveAllCartItems();

  useEffect(() => {
    sessionStorage.removeItem('buyNowProductId');
    clearCart.mutate();
  }, []);

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="font-serif text-3xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Thank you for your purchase! Your order has been confirmed and will be processed shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation with your order details and tracking information.
          </p>
          <Button onClick={() => navigate({ to: '/' })} size="lg">
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
