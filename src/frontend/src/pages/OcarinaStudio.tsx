import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Loader2, Music, Music2, Play, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "../backend";
import OcarinaPanel from "../components/OcarinaPanel";
import ProductTickerBar from "../components/ProductTickerBar";
import { useGetProducts } from "../hooks/useQueries";
import {
  type OcarinaScale,
  SCALE_LABELS,
  getScaleFromProduct,
  playDemo,
} from "../utils/ocarinaSynth";

// Scale badge color variants
const SCALE_BADGE_STYLES: Record<OcarinaScale, string> = {
  "bass-low": "bg-amber-900/20 text-amber-300 border-amber-700/40",
  bass: "bg-orange-900/20 text-orange-300 border-orange-700/40",
  alto: "bg-emerald-900/20 text-emerald-300 border-emerald-700/40",
  soprano: "bg-sky-900/20 text-sky-300 border-sky-700/40",
};

function ProductStudioCard({ product }: { product: Product }) {
  const [playingDemo, setPlayingDemo] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const scale = getScaleFromProduct(product.shape, product.category);
  const imageUrl =
    product.images.length > 0
      ? product.images[0].getDirectURL()
      : "/assets/generated/product-placeholder.dim_400x400.png";

  const handlePlayDemo = async () => {
    if (playingDemo) return;
    setPlayingDemo(true);
    try {
      await playDemo(scale);
    } finally {
      setPlayingDemo(false);
    }
  };

  const handlePlayOcarina = () => {
    setPanelOpen((prev) => !prev);
  };

  const priceAUD = (Number(product.price) / 100).toFixed(2);

  return (
    <article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/generated/product-placeholder.dim_400x400.png";
          }}
        />
        {/* Scale badge overlay */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${SCALE_BADGE_STYLES[scale]}`}
          >
            <Music className="h-3 w-3" />
            {SCALE_LABELS[scale]}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>
          {product.shape && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {product.shape} · {product.category}
            </p>
          )}
          {product.stripeProductDescription && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {product.stripeProductDescription}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="font-semibold text-primary text-lg">
            A${priceAUD}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayDemo}
            disabled={playingDemo}
            className="flex items-center gap-1.5 text-xs"
          >
            {playingDemo ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Playing…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Play Demo
              </>
            )}
          </Button>

          <Button
            variant={panelOpen ? "default" : "secondary"}
            size="sm"
            onClick={handlePlayOcarina}
            className="flex items-center gap-1.5 text-xs"
          >
            <Music2 className="h-3.5 w-3.5" />
            {panelOpen ? "Close" : "Play Ocarina"}
          </Button>
        </div>

        {/* Buy Now Link */}
        <Link
          to="/"
          search={{ productId: product.id.toString() }}
          className="w-full"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full flex items-center gap-1.5 text-xs border border-border/50"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Buy Now
          </Button>
        </Link>
      </div>

      {/* Interactive Ocarina Panel */}
      {panelOpen && (
        <div className="px-4 pb-4">
          <OcarinaPanel
            scale={scale}
            productName={product.name}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable IDs
          key={i}
          className="bg-card border border-border rounded-2xl overflow-hidden"
        >
          <Skeleton className="aspect-square w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OcarinaStudio() {
  const { data: products = [], isLoading, isError } = useGetProducts();

  return (
    <div className="min-h-screen">
      {/* Product Ticker Bar */}
      <ProductTickerBar products={products} />

      {/* Hero Section */}
      <section
        className="relative py-20 px-4 text-center text-white overflow-hidden"
        style={{
          backgroundImage:
            "url(/assets/generated/hero-ocarinas.dim_1920x800.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="relative z-10 container max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="h-8 w-8 text-amber-300" />
            <span className="text-amber-300 font-semibold tracking-widest uppercase text-sm">
              Interactive Experience
            </span>
            <Music className="h-8 w-8 text-amber-300" />
          </div>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Ocarina Music Studio
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mb-8">
            Explore our ocarina collection and play each instrument right in
            your browser — no downloads needed.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/70">
            {(["bass-low", "bass", "alto", "soprano"] as OcarinaScale[]).map(
              (scale) => (
                <span
                  key={scale}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-sm ${SCALE_BADGE_STYLES[scale]}`}
                >
                  <Music className="h-3 w-3" />
                  {SCALE_LABELS[scale]}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 border-b border-border py-10 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Play Demo</h3>
              <p className="text-xs text-muted-foreground">
                Hear a sample melody in the ocarina's pitch range
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Music2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Play Ocarina</h3>
              <p className="text-xs text-muted-foreground">
                Open the interactive keyboard and play individual notes
              </p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm">Buy Now</h3>
              <p className="text-xs text-muted-foreground">
                Love the sound? Head to the store to purchase
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container py-12 px-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div className="text-center py-20">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              Unable to load products. Please try again later.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              No products available yet.
            </p>
            <Link to="/">
              <Button variant="outline" className="mt-4">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                Our Ocarina Collection
              </h2>
              <p className="text-muted-foreground">
                {products.length} instrument{products.length !== 1 ? "s" : ""}{" "}
                available — each tuned to its own pitch range
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductStudioCard
                  key={product.id.toString()}
                  product={product}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 border-t border-border py-16 px-4 text-center">
        <div className="container max-w-2xl mx-auto">
          <Music className="h-10 w-10 text-primary mx-auto mb-4" />
          <h2 className="font-serif text-3xl font-bold mb-3">
            Ready to Own Your Ocarina?
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse our full collection and find the perfect ocarina for your
            musical journey.
          </p>
          <Link to="/">
            <Button size="lg" className="gap-2">
              <ShoppingBag className="h-5 w-5" />
              Shop the Collection
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
