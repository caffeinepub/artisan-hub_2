import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useIsCallerAdmin, useGetProducts, useGetProductCount, useIsStripeConfigured, useGetTotalInventoryValue } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import ProductManagementTable from '../components/ProductManagementTable';
import BulkProductUpload from '../components/BulkProductUpload';
import StripeSetup from '../components/StripeSetup';
import BrandingSettings from '../components/BrandingSettings';
import ShopDetailsSettings from '../components/ShopDetailsSettings';
import HomepageSettings from '../components/HomepageSettings';
import DescriptionTemplatesManager from '../components/DescriptionTemplatesManager';
import PaymentSettingsTab from '../components/PaymentSettingsTab';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: products = [] } = useGetProducts();
  const { data: productCount = BigInt(0) } = useGetProductCount();
  const { data: isStripeConfigured = false } = useIsStripeConfigured();
  const { data: totalInventoryValue = BigInt(0) } = useGetTotalInventoryValue();
  const [activeTab, setActiveTab] = useState('products');

  if (adminLoading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You don't have permission to access this page.</p>
        <button
          onClick={() => navigate({ to: '/' })}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(cents / 100);
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="font-serif text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage your products, settings, and store configuration</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount.toString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(totalInventoryValue))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + Number(p.viewCount), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stripe Status</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isStripeConfigured ? '✓' : '✗'}</div>
            <p className="text-xs text-muted-foreground">
              {isStripeConfigured ? 'Configured' : 'Not configured'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="payment-settings">Payment</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="shop-details">Shop</TabsTrigger>
          <TabsTrigger value="homepage">Homepage</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>View and manage all your products</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductManagementTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk-upload" className="mt-6">
          <BulkProductUpload onComplete={() => setActiveTab('products')} />
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <DescriptionTemplatesManager />
        </TabsContent>

        <TabsContent value="stripe" className="mt-6">
          <StripeSetup />
        </TabsContent>

        <TabsContent value="payment-settings" className="mt-6">
          <PaymentSettingsTab />
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="shop-details" className="mt-6">
          <ShopDetailsSettings />
        </TabsContent>

        <TabsContent value="homepage" className="mt-6">
          <HomepageSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
