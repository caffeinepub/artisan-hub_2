import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Music,
  Music2,
  Play,
  ShoppingBag,
} from "lucide-react";
import { useRef, useState } from "react";
import type { Product } from "../backend";
import { useGetProducts } from "../hooks/useQueries";
import {
  type OcarinaScale,
  SCALE_LABELS,
  getScaleFromProduct,
  playDemo,
} from "../utils/ocarinaSynth";
import OcarinaPanel from "./OcarinaPanel";

const SCALE_BADGE_STYLES: Record<OcarinaScale, string> = {
  "bass-low": "bg-amber-900/20 text-amber-700 border-amber-700/40",
  bass: "bg-orange-900/20 text-orange-700 border-orange-700/40",
  alto: "bg-emerald-900/20 text-emerald-700 border-emerald-700/40",
  soprano: "bg-sky-900/20 text-sky-700 border-sky-700/40",
};

interface CarouselCardProps {
  product: Product;
  onBuyNow: (product: Product) => void;
}

function CarouselCard({ product, onBuyNow }: CarouselCardProps) {
  const [playingDemo, setPlayingDemo] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

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

  const priceAUD = (Number(product.price) / 100).toFixed(2);

  return (
    <article className="flex-none w-72 bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/generated/product-placeholder.dim_400x400.png";
            setImgLoaded(true);
          }}
        />
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm bg-white/80 ${SCALE_BADGE_STYLES[scale]}`}
          >
            <Music className="h-3 w-3" />
            {SCALE_LABELS[scale]}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <h3 className="font-serif text-base font-semibold leading-tight text-foreground line-clamp-2">
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
          <span className="font-semibold text-primary text-base">
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
            onClick={() => setPanelOpen((prev) => !prev)}
            className="flex items-center gap-1.5 text-xs"
          >
            <Music2 className="h-3.5 w-3.5" />
            {panelOpen ? "Close" : "Play Ocarina"}
          </Button>
        </div>

        {/* Buy Now Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center gap-1.5 text-xs border border-border/50"
          onClick={() => onBuyNow(product)}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Buy Now
        </Button>
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

interface OcarinaCarouselProps {
  onBuyNow: (product: Product) => void;
}

export default function OcarinaCarousel({ onBuyNow }: OcarinaCarouselProps) {
  const { data: products = [], isLoading, isError } = useGetProducts();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 300;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-hidden py-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders have no stable IDs
            key={i}
            className="flex-none w-72 bg-card border border-border rounded-2xl overflow-hidden"
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

  if (isError || products.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          <h2 className="font-serif text-xl font-bold text-foreground">
            Try Before You Buy
          </h2>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            — play any ocarina right in your browser
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Cards */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth"
        style={{ scrollbarWidth: "thin" }}
      >
        {products.map((product) => (
          <CarouselCard
            key={product.id.toString()}
            product={product}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>
    </div>
  );
}
