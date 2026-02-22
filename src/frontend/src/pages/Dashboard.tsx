import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetProducts, useGetProductCount, useIsStripeConfigured } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Upload, Settings, TrendingUp, Edit, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductManagementTable from '../components/ProductManagementTable';
import BulkProductUpload from '../components/BulkProductUpload';
import StripeSetup from '../components/StripeSetup';
import BrandingSettings from '../components/BrandingSettings';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: productCount = BigInt(0), isLoading: countLoading } = useGetProductCount();
  const { data: stripeConfigured = false, isLoading: stripeLoading } = useIsStripeConfigured();
  const [showStripeSetup, setShowStripeSetup] = useState(false);

  useEffect(() => {
    if (!stripeLoading && !stripeConfigured) {
      setShowStripeSetup(true);
    }
  }, [stripeConfigured, stripeLoading]);

  if (!identity) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to access the dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You do not have permission to access this page</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showStripeSetup && !stripeConfigured) {
    return (
      <div className="container py-12">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Setup Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Before you can start managing products, please configure Stripe for payment processing.
            </p>
            <StripeSetup onComplete={() => setShowStripeSetup(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRevenue = products.reduce((sum, product) => sum + Number(product.price), 0) / 100;

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your products and store settings</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {countLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{productCount.toString()}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stripeLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{stripeConfigured ? 'Active' : 'Inactive'}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="products" className="gap-2">
            <Edit className="h-4 w-4" />
            Manage Products
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagementTable />
        </TabsContent>

        <TabsContent value="upload">
          <BulkProductUpload />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <StripeSetup onComplete={() => {}} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
