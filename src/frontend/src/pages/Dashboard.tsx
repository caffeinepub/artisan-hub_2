import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin, useGetProducts, useGetProductCount, useIsStripeConfigured } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Upload, Settings, TrendingUp, Edit, Palette, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProductManagementTable from '../components/ProductManagementTable';
import BulkProductUpload from '../components/BulkProductUpload';
import StripeSetup from '../components/StripeSetup';
import BrandingSettings from '../components/BrandingSettings';
import ShopDetailsSettings from '../components/ShopDetailsSettings';

export default function Dashboard() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const { data: productCount = BigInt(0), isLoading: countLoading } = useGetProductCount();
  const { data: isStripeConfigured, isLoading: stripeLoading } = useIsStripeConfigured();
  const [showStripeSetup, setShowStripeSetup] = useState(false);

  useEffect(() => {
    if (!stripeLoading && isStripeConfigured === false) {
      setShowStripeSetup(true);
    }
  }, [isStripeConfigured, stripeLoading]);

  if (!identity) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">Please log in to access the dashboard.</p>
      </div>
    );
  }

  if (isAdminLoading) {
    return (
      <div className="container py-16">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  if (showStripeSetup && !isStripeConfigured) {
    return (
      <div className="container py-16 max-w-2xl">
        <h1 className="font-serif text-3xl font-bold mb-2">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Before you can start selling, please configure your Stripe payment settings.
        </p>
        <StripeSetup onComplete={() => setShowStripeSetup(false)} />
      </div>
    );
  }

  const totalRevenue = products.reduce((sum, product) => {
    return sum + Number(product.price) * (Number(product.inventoryCount) > 0 ? 1 : 0);
  }, 0);

  const totalInventory = products.reduce((sum, product) => {
    return sum + Number(product.inventoryCount);
  }, 0);

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your products, settings, and store configuration</p>
        </div>
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
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{totalInventory}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estimated Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="bulk-upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Stripe</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="shop-details" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Shop Details</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <ProductManagementTable />
        </TabsContent>

        <TabsContent value="bulk-upload">
          <BulkProductUpload />
        </TabsContent>

        <TabsContent value="stripe">
          <StripeSetup />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="shop-details">
          <ShopDetailsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
