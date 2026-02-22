import { useState } from 'react';
import { useGetProducts, useMostViewedProducts, useBestSellingProducts, useNewestProducts, useHomepageConfig } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, TrendingUp, ShoppingBag, Clock } from 'lucide-react';
import ProductDetailView from '../components/ProductDetailView';
import type { Product } from '../backend';

export default function Marketplace() {
  const { data: allProducts = [] } = useGetProducts();
  const { data: mostViewedProducts = [], isLoading: mostViewedLoading } = useMostViewedProducts();
  const { data: bestSellingProducts = [], isLoading: bestSellingLoading } = useBestSellingProducts();
  const { data: newestProducts = [], isLoading: newestLoading } = useNewestProducts();
  const { data: homepageConfig, isLoading: homepageLoading } = useHomepageConfig();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Featured products: first 6 from all products
  const featuredProducts = allProducts.slice(0, 6);

  // Get hero configuration with fallbacks
  const heroMotto = homepageConfig?.heroMotto || 'Discover Original Creations';
  const promotionalText = homepageConfig?.promotionalText || 'Browse our collection of unique handcrafted items';
  const heroBackgroundUrl = homepageConfig?.heroImage
    ? homepageConfig.heroImage.getDirectURL()
    : '/assets/generated/hero-background.dim_1920x600.png';

  const renderProductCard = (product: Product) => {
    const imageUrl = product.images.length > 0
      ? product.images[0].getDirectURL()
      : '/assets/generated/product-placeholder.dim_400x400.png';

    return (
      <Card
        key={product.id.toString()}
        className="group cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
        onClick={() => setSelectedProduct(product)}
      >
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{product.shape}</p>
          <p className="font-semibold text-lg">${(Number(product.price) / 100).toFixed(2)}</p>
        </CardContent>
      </Card>
    );
  };

  const renderProductSection = (
    title: string,
    products: Product[],
    isLoading: boolean,
    icon: React.ReactNode
  ) => {
    if (isLoading) {
      return (
        <section className="py-12">
          <div className="container">
            <div className="flex items-center gap-3 mb-6">
              {icon}
              <h2 className="font-serif text-3xl font-bold">{title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-64 w-full rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (products.length === 0) {
      return null;
    }

    return (
      <section className="py-12">
        <div className="container">
          <div className="flex items-center gap-3 mb-6">
            {icon}
            <h2 className="font-serif text-3xl font-bold">{title}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 8).map(renderProductCard)}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative h-[400px] md:h-[500px] bg-cover bg-center flex items-center"
        style={{ backgroundImage: `url(${heroBackgroundUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            {homepageLoading ? (
              <>
                <Skeleton className="h-12 w-3/4 mb-4" />
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-6 w-5/6 mb-6" />
              </>
            ) : (
              <>
                <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 text-foreground">
                  {heroMotto}
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground mb-6">
                  {promotionalText}
                </p>
              </>
            )}
            <Button size="lg" className="gap-2">
              Shop Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-3xl font-bold">Featured Creations</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProducts.map(renderProductCard)}
            </div>
          </div>
        </section>
      )}

      {/* Most Viewed Products */}
      {renderProductSection(
        'Most Viewed',
        mostViewedProducts,
        mostViewedLoading,
        <TrendingUp className="h-8 w-8 text-primary" />
      )}

      {/* Best Sellers */}
      {renderProductSection(
        'Best Sellers',
        bestSellingProducts,
        bestSellingLoading,
        <ShoppingBag className="h-8 w-8 text-primary" />
      )}

      {/* Newest Designs */}
      {renderProductSection(
        'Newest Designs',
        newestProducts,
        newestLoading,
        <Clock className="h-8 w-8 text-primary" />
      )}

      {/* Call to Action */}
      <section className="py-16 bg-primary/5">
        <div className="container text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Start Your Collection Today
          </h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Every piece tells a story. Find the perfect original creation that speaks to you.
          </p>
          <Button size="lg" variant="outline" className="gap-2">
            Browse All Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Product Detail Modal */}
      <ProductDetailView
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
