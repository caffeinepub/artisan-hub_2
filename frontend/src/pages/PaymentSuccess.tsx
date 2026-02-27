import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ExternalLink, Gift, Music, Truck, Info } from 'lucide-react';
import { useRemoveAllCartItems, usePaymentSettings } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const clearCart = useRemoveAllCartItems();
  const { data: paymentSettings, isLoading: settingsLoading } = usePaymentSettings();

  useEffect(() => {
    sessionStorage.removeItem('buyNowProductId');
    clearCart.mutate();
  }, []);

  const bonusItem = paymentSettings?.bonusItemConfig;
  const proAppUrl = paymentSettings?.proOcarinaAppUrl;

  return (
    <div className="container max-w-2xl py-16 space-y-6">
      {/* Main Success Card */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="font-serif text-3xl">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for your purchase! Your order has been confirmed and will be processed shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            You will receive an email confirmation with your order details and tracking information.
          </p>
          {/* Policy reminder */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-left text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>
              Your order includes <strong className="text-foreground">free postage</strong>. Please note: <strong className="text-foreground">no returns are accepted</strong> on any purchases.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pro Ocarina Learning App */}
      {settingsLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : proAppUrl ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Pro Ocarina Learning App</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your purchase includes complimentary access to the <strong className="text-foreground">Pro Ocarina Learning App</strong> — learn to read ocarina tablature and compose music.
            </p>
            <Button asChild className="gap-2">
              <a href={proAppUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Access your free Pro Ocarina Learning App
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Bonus Item */}
      {settingsLoading ? (
        <Skeleton className="h-32 w-full rounded-xl" />
      ) : bonusItem?.enabled && bonusItem.title ? (
        <Card className="border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-700/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Gift className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg">Your Bonus Item 🎁</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-semibold">{bonusItem.title}</p>
            {bonusItem.description && (
              <p className="text-sm text-muted-foreground">{bonusItem.description}</p>
            )}
            {bonusItem.url && (
              <Button asChild variant="outline" className="gap-2 border-amber-300 dark:border-amber-700">
                <a href={bonusItem.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Access Bonus Item
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      <div className="text-center">
        <Button onClick={() => navigate({ to: '/' })} size="lg">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
