import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useSetStripeConfiguration } from '../hooks/useQueries';
import { toast } from 'sonner';
import { CreditCard } from 'lucide-react';

interface StripeSetupProps {
  onComplete?: () => void;
}

export default function StripeSetup({ onComplete }: StripeSetupProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');
  const setConfig = useSetStripeConfiguration();

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
      onComplete?.();
    } catch (error) {
      toast.error('Failed to configure Stripe');
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

            <Button type="submit" className="w-full" disabled={setConfig.isPending}>
              {setConfig.isPending ? 'Configuring...' : 'Configure Stripe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
