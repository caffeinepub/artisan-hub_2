import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useSetStripeConfiguration, useIsStripeConfigured, useDeleteStripeConfig } from '../hooks/useQueries';
import { toast } from 'sonner';
import { CreditCard, Check, Trash2 } from 'lucide-react';

interface StripeSetupProps {
  onComplete?: () => void;
}

export default function StripeSetup({ onComplete }: StripeSetupProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');
  const setConfig = useSetStripeConfiguration();
  const deleteConfig = useDeleteStripeConfig();
  const { data: isConfigured, isLoading: isCheckingConfig } = useIsStripeConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const countryList = countries
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length === 2);

    if (countryList.length === 0) {
      toast.error('Please enter at least one valid country code');
      return;
    }

    try {
      await setConfig.mutateAsync({
        secretKey: secretKey.trim(),
        allowedCountries: countryList,
      });
      toast.success('Stripe configured successfully!');
      setSecretKey('');
      onComplete?.();
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteConfig.mutateAsync();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-serif text-3xl">Setup Stripe Payments</CardTitle>
          <CardDescription>
            Configure your Stripe account to start accepting payments for your artisan products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isCheckingConfig && isConfigured && (
            <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4 flex items-center gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Stripe Configured</p>
                <p className="text-xs text-green-700 mt-0.5">
                  Your Stripe payment integration is active and ready to accept payments
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="secretKey">Stripe Secret Key</Label>
              <Input
                id="secretKey"
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_..."
                required
              />
              <p className="text-xs text-muted-foreground">
                Find this in your Stripe Dashboard under Developers → API keys
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="countries">Allowed Countries</Label>
              <Input
                id="countries"
                value={countries}
                onChange={(e) => setCountries(e.target.value)}
                placeholder="US,CA,GB"
                required
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of 2-letter country codes (e.g., US, CA, GB)
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={setConfig.isPending}>
                {setConfig.isPending ? 'Configuring...' : isConfigured ? 'Update Stripe Configuration' : 'Configure Stripe'}
              </Button>

              {!isCheckingConfig && isConfigured && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleteConfig.isPending}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Stripe Configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your Stripe API key and disable payment processing. You will need to reconfigure Stripe to accept payments again. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Configuration
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
