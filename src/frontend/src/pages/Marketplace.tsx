import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Product } from "../backend";
import OcarinaCarousel from "../components/OcarinaCarousel";
import ProductCard from "../components/ProductCard";
import ProductDetailView from "../components/ProductDetailView";
import {
  useBestSellingProducts,
  useGetHomepageConfig,
  useGetProducts,
  useMostViewedProducts,
  useNewestProducts,
} from "../hooks/useQueries";

export default function Marketplace() {
  const { data: allProducts = [], isLoading: productsLoading } =
    useGetProducts();
  const { data: mostViewedProducts = [] } = useMostViewedProducts();
  const { data: bestSellingProducts = [] } = useBestSellingProducts();
  const { data: newestProducts = [] } = useNewestProducts();
  const { data: homepageConfig, isLoading: configLoading } =
    useGetHomepageConfig();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("all");
  const [shapeFilter, setShapeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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
      case "mostViewed":
        return mostViewedProducts;
      case "bestSelling":
        return bestSellingProducts;
      case "newest":
        return newestProducts;
      default:
        return allProducts;
    }
  };

  const products = getSortedProducts();

  // Get unique shapes and categories for filters
  const shapes = Array.from(
    new Set(allProducts.map((p) => p.shape).filter(Boolean)),
  );
  const categories = Array.from(
    new Set(allProducts.map((p) => p.category).filter(Boolean)),
  );

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesShape = shapeFilter === "all" || product.shape === shapeFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesShape && matchesCategory;
  });

  const heroMotto = homepageConfig?.heroMotto;
  const promotionalText = homepageConfig?.promotionalText;
  const heroImageUrl = homepageConfig?.heroImage?.getDirectURL();
  const heroBackgroundStyle = heroImageUrl
    ? {
        backgroundImage: `url(${heroImageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
      };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative py-20 px-4 text-center text-white"
        style={heroBackgroundStyle}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container">
          {configLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-14 w-2/3 max-w-xl bg-white/20 rounded-lg" />
              <Skeleton className="h-7 w-1/2 max-w-md bg-white/15 rounded-lg" />
            </div>
          ) : (
            <>
              <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6">
                {heroMotto || "Original Creations Market"}
              </h1>
              <p className="text-xl md:text-2xl max-w-2xl mx-auto">
                {promotionalText || "Discover unique original designs"}
              </p>
            </>
          )}
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
          <p className="text-sm font-medium mb-3 block">Filter by Shape</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={shapeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setShapeFilter("all")}
            >
              All Shapes
            </Button>
            {shapes.map((shape) => (
              <Button
                key={shape}
                variant={shapeFilter === shape ? "default" : "outline"}
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
          <p className="text-sm font-medium mb-3 block">Filter by Category</p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoryFilter("all")}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
                key={i}
                className="rounded-lg overflow-hidden border border-border"
              >
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <button
                type="button"
                key={product.id.toString()}
                onClick={() => handleOpenProduct(product)}
                className="cursor-pointer text-left w-full block"
              >
                <ProductCard product={product} />
              </button>
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
