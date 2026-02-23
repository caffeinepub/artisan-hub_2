import { useState, useMemo } from 'react';
import { useGetProducts, useMostViewedProducts, useBestSellingProducts, useNewestProducts, useHomepageConfig } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Sparkles, TrendingUp, ShoppingBag, Clock, X } from 'lucide-react';
import ProductDetailView from '../components/ProductDetailView';
import type { Product } from '../backend';

export default function Marketplace() {
  const { data: allProducts = [] } = useGetProducts();
  const { data: mostViewedProducts = [], isLoading: mostViewedLoading } = useMostViewedProducts();
  const { data: bestSellingProducts = [], isLoading: bestSellingLoading } = useBestSellingProducts();
  const { data: newestProducts = [], isLoading: newestLoading } = useNewestProducts();
  const { data: homepageConfig, isLoading: homepageLoading } = useHomepageConfig();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedShapes, setSelectedShapes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Extract unique shapes from all products
  const uniqueShapes = useMemo(() => {
    const shapes = new Set<string>();
    allProducts.forEach(product => {
      if (product.shape && product.shape.trim()) {
        shapes.add(product.shape.trim());
      }
    });
    return Array.from(shapes).sort();
  }, [allProducts]);

  // Extract unique categories from all products
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    allProducts.forEach(product => {
      if (product.category && product.category.trim()) {
        categories.add(product.category.trim());
      }
    });
    return Array.from(categories).sort();
  }, [allProducts]);

  // Filter products based on selected filters
  const filterProducts = (products: Product[]) => {
    if (selectedShapes.length === 0 && selectedCategories.length === 0) {
      return products;
    }

    return products.filter(product => {
      const matchesShape = selectedShapes.length === 0 || selectedShapes.includes(product.shape);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
      return matchesShape && matchesCategory;
    });
  };

  // Apply filters to all product lists
  const filteredFeaturedProducts = filterProducts(allProducts.slice(0, 6));
  const filteredMostViewedProducts = filterProducts(mostViewedProducts);
  const filteredBestSellingProducts = filterProducts(bestSellingProducts);
  const filteredNewestProducts = filterProducts(newestProducts);

  const toggleShape = (shape: string) => {
    setSelectedShapes(prev =>
      prev.includes(shape) ? prev.filter(s => s !== shape) : [...prev, shape]
    );
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSelectedShapes([]);
    setSelectedCategories([]);
  };

  const hasActiveFilters = selectedShapes.length > 0 || selectedCategories.length > 0;

  // Get hero configuration with fallbacks
  const heroMotto = homepageConfig?.heroMotto || 'Discover Original Creations';
  const promotionalText = homepageConfig?.promotionalText || 'Browse our collection of unique handcrafted items';
  
  // Use configured hero image or fallback to the ocarina background
  const heroBackgroundUrl = homepageConfig?.heroImage
    ? homepageConfig.heroImage.getDirectURL()
    : '/assets/generated/hero-ocarinas.dim_1920x800.png';

  const renderProductCard = (product: Product) => {
    const imageUrl = product.images && product.images.length > 0
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
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/assets/generated/product-placeholder.dim_400x400.png';
            }}
          />
        </div>
        <CardContent className="p-4">
          <h3 className="font-serif font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <span className="line-clamp-1">{product.shape}</span>
            <span>•</span>
            <span className="line-clamp-1">{product.category}</span>
          </div>
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

    if (products.length === 0 && hasActiveFilters) {
      return (
        <section className="py-12">
          <div className="container">
            <div className="flex items-center gap-3 mb-6">
              {icon}
              <h2 className="font-serif text-3xl font-bold">{title}</h2>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <p>No products match your selected filters.</p>
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
      {/* Hero Section with Custom Background */}
      <section
        className="relative h-[400px] md:h-[500px] flex items-center"
        style={{
          backgroundImage: `url(${heroBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
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

      {/* Filter Tabs Section */}
      {(uniqueShapes.length > 0 || uniqueCategories.length > 0) && (
        <section className="py-6 bg-muted/30 border-b">
          <div className="container">
            <div className="space-y-3">
              {/* Clear Filters / All Products */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Filters:</span>
                <Badge
                  variant={hasActiveFilters ? "outline" : "default"}
                  className="cursor-pointer hover:bg-primary/90 transition-colors"
                  onClick={clearFilters}
                >
                  {hasActiveFilters ? (
                    <>
                      <X className="h-3 w-3 mr-1" />
                      Clear All Filters
                    </>
                  ) : (
                    'All Products'
                  )}
                </Badge>
              </div>

              {/* Shape Filters */}
              {uniqueShapes.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Shape:</span>
                  {uniqueShapes.map(shape => (
                    <Badge
                      key={shape}
                      variant={selectedShapes.includes(shape) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => toggleShape(shape)}
                    >
                      {shape}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Category Filters */}
              {uniqueCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Category:</span>
                  {uniqueCategories.map(category => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {filteredFeaturedProducts.length > 0 && (
        <section className="py-12 bg-muted/30">
          <div className="container">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
              <h2 className="font-serif text-3xl font-bold">Featured Creations</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFeaturedProducts.map(renderProductCard)}
            </div>
          </div>
        </section>
      )}

      {/* Most Viewed Products */}
      {renderProductSection(
        'Most Viewed',
        filteredMostViewedProducts,
        mostViewedLoading,
        <TrendingUp className="h-8 w-8 text-primary" />
      )}

      {/* Best Sellers */}
      {renderProductSection(
        'Best Sellers',
        filteredBestSellingProducts,
        bestSellingLoading,
        <ShoppingBag className="h-8 w-8 text-primary" />
      )}

      {/* Newest Designs */}
      {renderProductSection(
        'Newest Designs',
        filteredNewestProducts,
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
          <Button size="lg" variant="outline" className="gap-2" onClick={clearFilters}>
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
