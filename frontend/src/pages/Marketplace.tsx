import { useState } from 'react';
import { useGetProducts, useMostViewedProducts, useBestSellingProducts, useNewestProducts, useGetHomepageConfig } from '../hooks/useQueries';
import ProductCard from '../components/ProductCard';
import ProductDetailView from '../components/ProductDetailView';
import OcarinaCarousel from '../components/OcarinaCarousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Product } from '../backend';

export default function Marketplace() {
  const { data: allProducts = [] } = useGetProducts();
  const { data: mostViewedProducts = [] } = useMostViewedProducts();
  const { data: bestSellingProducts = [] } = useBestSellingProducts();
  const { data: newestProducts = [] } = useNewestProducts();
  const { data: homepageConfig } = useGetHomepageConfig();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>('all');
  const [shapeFilter, setShapeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) setSelectedProduct(null);
  };

  // Get products based on sort selection
  const getSortedProducts = () => {
    switch (sortBy) {
      case 'mostViewed':
        return mostViewedProducts;
      case 'bestSelling':
        return bestSellingProducts;
      case 'newest':
        return newestProducts;
      default:
        return allProducts;
    }
  };

  const products = getSortedProducts();

  // Get unique shapes and categories for filters
  const shapes = Array.from(new Set(allProducts.map(p => p.shape).filter(Boolean)));
  const categories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)));

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesShape = shapeFilter === 'all' || product.shape === shapeFilter;
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesShape && matchesCategory;
  });

  const heroMotto = homepageConfig?.heroMotto || 'Welcome to Original Creations Market';
  const promotionalText = homepageConfig?.promotionalText || 'Discover unique, handcrafted treasures';
  const heroImageUrl = homepageConfig?.heroImage?.getDirectURL();
  const heroBackgroundStyle = heroImageUrl
    ? { backgroundImage: `url(${heroImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)' };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative py-20 px-4 text-center text-white"
        style={heroBackgroundStyle}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container">
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
            {heroMotto}
          </h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            {promotionalText}
          </p>
        </div>
      </section>

      {/* Ocarina Carousel — replaces search bar */}
      <section className="container py-8">
        <OcarinaCarousel onBuyNow={handleOpenProduct} />
      </section>

      {/* Filters */}
      <section className="container pb-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-start md:items-center">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="mostViewed">Most Viewed</SelectItem>
              <SelectItem value="bestSelling">Best Selling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shape Filter Buttons */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-3 block">Filter by Shape</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={shapeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShapeFilter('all')}
            >
              All Shapes
            </Button>
            {shapes.map((shape) => (
              <Button
                key={shape}
                variant={shapeFilter === shape ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShapeFilter(shape)}
              >
                {shape}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter Buttons */}
        <div className="mb-8">
          <label className="text-sm font-medium mb-3 block">Filter by Category</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoryFilter('all')}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id.toString()} onClick={() => handleOpenProduct(product)} className="cursor-pointer">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Detail Modal */}
      <ProductDetailView
        product={selectedProduct}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
      />
    </div>
  );
}
