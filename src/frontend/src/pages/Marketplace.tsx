import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Package, Printer, Truck } from "lucide-react";
import { useState } from "react";
import type { Product } from "../backend";
import OcarinaCarousel from "../components/OcarinaCarousel";
import ProductCard from "../components/ProductCard";
import ProductDetailView from "../components/ProductDetailView";
import ProductTickerBar from "../components/ProductTickerBar";
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

  const shapes = Array.from(
    new Set(allProducts.map((p) => p.shape).filter(Boolean)),
  );
  const categories = Array.from(
    new Set(allProducts.map((p) => p.category).filter(Boolean)),
  );

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
          "linear-gradient(160deg, #0d0d1a 0%, #1a120a 60%, #0d0d1a 100%)",
      };

  const features = [
    {
      icon: <Printer className="w-5 h-5 text-amber-400" />,
      title: "3D Printed",
      desc: "Original CAD designs, precision printed",
    },
    {
      icon: <Music className="w-5 h-5 text-amber-400" />,
      title: "Diatonic Tuned",
      desc: "Professionally tuned for every scale",
    },
    {
      icon: <Package className="w-5 h-5 text-amber-400" />,
      title: "Music Studio",
      desc: "Interactive learning platform included",
    },
    {
      icon: <Truck className="w-5 h-5 text-amber-400" />,
      title: "Free Shipping",
      desc: "Complimentary Australia-wide delivery",
    },
  ];

  return (
    <div>
      {/* Product Ticker Bar */}
      <ProductTickerBar
        products={allProducts}
        onProductClick={handleOpenProduct}
      />

      {/* Hero Section */}
      <section
        id="hero"
        className="relative overflow-hidden text-white"
        style={heroBackgroundStyle}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Amber glow orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 container py-24 md:py-36 px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-300 text-xs font-semibold tracking-widest uppercase mb-8">
              <Printer className="w-3 h-3" />
              3D Modelled &amp; Printed · Original Designs
            </div>

            {configLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-16 w-3/4 max-w-2xl bg-white/10 rounded-lg" />
                <Skeleton className="h-7 w-1/2 max-w-md bg-white/10 rounded-lg" />
                <Skeleton className="h-7 w-2/3 max-w-lg bg-white/8 rounded-lg" />
              </div>
            ) : (
              <>
                <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
                  {heroMotto || "Original 3D-Printed Ocarinas"}
                </h1>
                <p className="text-lg md:text-xl text-white/65 max-w-2xl mx-auto mb-4 leading-relaxed">
                  {promotionalText ||
                    "Precision engineered from original 3D designs — tuned for exceptional playability"}
                </p>
                <p className="text-sm text-white/40 max-w-xl mx-auto mb-10">
                  Each ocarina is designed in CAD, 3D printed in-house, and
                  tuned to a diatonic scale — available in Turtle, Dolphin,
                  Frog, Whale and more. Every purchase includes access to the
                  interactive Ocarina Music Studio.
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 shadow-lg shadow-amber-900/30"
                onClick={() => {
                  document
                    .getElementById("collection")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                data-ocid="hero.primary_button"
              >
                Shop Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 text-white hover:bg-white/8 px-8"
                onClick={() => {
                  window.location.href = "/ocarina-studio";
                }}
                data-ocid="hero.secondary_button"
              >
                <Music className="w-4 h-4 mr-2" />
                Open Music Studio
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip */}
      <section
        className="border-b"
        style={{ background: "#0f0f1a", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="container py-5 px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="flex items-start gap-3 p-3 rounded-lg"
                data-ocid={`feature.card.${i + 1}` as string}
              >
                <div className="mt-0.5 flex-shrink-0">{feat.icon}</div>
                <div>
                  <p className="text-white text-sm font-semibold">
                    {feat.title}
                  </p>
                  <p className="text-white/35 text-xs mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ocarina Carousel */}
      <section className="container py-8">
        <OcarinaCarousel onBuyNow={handleOpenProduct} />
      </section>

      {/* Collection & Filters */}
      <section id="collection" className="container pb-4 pt-4">
        <div className="mb-8">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
            Our Collection
          </h2>
          <p className="text-muted-foreground text-sm">
            Original shapes — Turtle, Dolphin, Frog, Whale and more — each
            precision-printed and diatonic-tuned.
          </p>
        </div>

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
              data-ocid="marketplace.shape.tab"
            >
              All Shapes
            </Button>
            {shapes.map((shape) => (
              <Button
                key={shape}
                variant={shapeFilter === shape ? "default" : "outline"}
                size="sm"
                onClick={() => setShapeFilter(shape)}
                data-ocid="marketplace.shape.tab"
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
              data-ocid="marketplace.category.tab"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={categoryFilter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(category)}
                data-ocid="marketplace.category.tab"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {productsLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            data-ocid="marketplace.loading_state"
          >
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
          <div
            className="text-center py-16"
            data-ocid="marketplace.empty_state"
          >
            <p className="text-muted-foreground text-lg">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, idx) => (
              <button
                type="button"
                key={product.id.toString()}
                onClick={() => handleOpenProduct(product)}
                className="cursor-pointer text-left w-full block"
                data-ocid={`marketplace.item.${idx + 1}` as string}
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
