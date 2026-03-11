import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Loader2, Music, Music2, Play, ShoppingBag } from "lucide-react";
import { useState } from "react";
import type { Product } from "../backend";
import OcarinaPanel from "../components/OcarinaPanel";
import ProductTickerBar from "../components/ProductTickerBar";
import SheetMusicMiniPlayer from "../components/SheetMusicMiniPlayer";
import SheetMusicScanner from "../components/SheetMusicScanner";
import { useGetProducts } from "../hooks/useQueries";
import {
  type OcarinaScale,
  SCALE_LABELS,
  getScaleFromProduct,
  playDemo,
} from "../utils/ocarinaSynth";

// Scale badge colour tokens — studio dark palette
const SCALE_BADGE: Record<
  OcarinaScale,
  { pill: string; glow: string; label: string }
> = {
  "bass-low": {
    pill: "bg-purple-900/40 text-purple-200 border-purple-600/50",
    glow: "shadow-purple-900/50",
    label: "text-purple-300",
  },
  bass: {
    pill: "bg-blue-900/40 text-blue-200 border-blue-600/50",
    glow: "shadow-blue-900/50",
    label: "text-blue-300",
  },
  alto: {
    pill: "bg-teal-900/40 text-teal-200 border-teal-600/50",
    glow: "shadow-teal-900/50",
    label: "text-teal-300",
  },
  soprano: {
    pill: "bg-amber-900/40 text-amber-200 border-amber-600/50",
    glow: "shadow-amber-900/50",
    label: "text-amber-300",
  },
};

// ─── Decorative background holes SVG ───────────────────────────────────────────────

function DecorativeHoles() {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Large glowing hole clusters */}
      {[
        { x: "8%", y: "15%", r: 32, opacity: 0.06 },
        { x: "15%", y: "28%", r: 18, opacity: 0.04 },
        { x: "22%", y: "60%", r: 44, opacity: 0.05 },
        { x: "6%", y: "75%", r: 22, opacity: 0.04 },
        { x: "85%", y: "12%", r: 38, opacity: 0.06 },
        { x: "92%", y: "35%", r: 20, opacity: 0.04 },
        { x: "78%", y: "65%", r: 50, opacity: 0.05 },
        { x: "90%", y: "80%", r: 25, opacity: 0.04 },
        { x: "50%", y: "5%", r: 15, opacity: 0.03 },
        { x: "48%", y: "90%", r: 28, opacity: 0.04 },
      ].map((dot, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static decorative positions
          key={`dot-${i}`}
          className="absolute rounded-full border-2"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.r * 2,
            height: dot.r * 2,
            transform: "translate(-50%, -50%)",
            borderColor: `rgba(251, 191, 36, ${dot.opacity * 3})`,
            background: `radial-gradient(circle, rgba(251, 191, 36, ${dot.opacity}) 0%, transparent 70%)`,
            boxShadow: `0 0 ${dot.r}px rgba(251, 191, 36, ${dot.opacity * 2})`,
          }}
        />
      ))}
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(251,191,36,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}

// ─── Product Studio Card ───────────────────────────────────────────────────────────

function ProductStudioCard({ product }: { product: Product }) {
  const [playingDemo, setPlayingDemo] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const scale = getScaleFromProduct(product.shape, product.category);
  const badge = SCALE_BADGE[scale];
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
    <article
      className="flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-900/20"
      data-ocid="studio.card"
    >
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-black/30">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "/assets/generated/product-placeholder.dim_400x400.png";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-sm ${
              badge.pill
            }`}
          >
            <Music className="h-2.5 w-2.5" />
            {SCALE_LABELS[scale]}
          </span>
        </div>
        <div className="absolute bottom-2.5 left-2.5 right-2.5">
          <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
            {product.name}
          </h3>
          {product.shape && (
            <p className="text-white/50 text-[10px] mt-0.5 capitalize">
              {product.shape}
              {product.category ? ` · ${product.category}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-amber-300 font-bold text-base">
            A${priceAUD}
          </span>
          <Link to="/" search={{ productId: product.id.toString() }}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] gap-1 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
              data-ocid="studio.primary_button"
            >
              <ShoppingBag className="h-3 w-3" /> Buy
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayDemo}
            disabled={playingDemo}
            className="h-8 text-[11px] gap-1 border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            data-ocid="studio.secondary_button"
          >
            {playingDemo ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {playingDemo ? "Playing…" : "Demo"}
          </Button>

          <Button
            size="sm"
            variant={panelOpen ? "default" : "outline"}
            onClick={() => setPanelOpen((p) => !p)}
            className={`h-8 text-[11px] gap-1 ${
              panelOpen
                ? "bg-amber-600 hover:bg-amber-500 text-black border-amber-500"
                : "border-white/15 bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
            }`}
            data-ocid="studio.button"
          >
            <Music2 className="h-3 w-3" />
            {panelOpen ? "Close" : "Play"}
          </Button>
        </div>
      </div>

      {/* Inline ocarina panel */}
      {panelOpen && (
        <div className="px-3 pb-3">
          <OcarinaPanel
            scale={scale}
            productName={product.name}
            productId={product.id}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </article>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders
          key={i}
          className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
        >
          <Skeleton className="aspect-square w-full bg-white/10" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-white/10" />
            <div className="grid grid-cols-2 gap-1.5">
              <Skeleton className="h-8 w-full bg-white/10" />
              <Skeleton className="h-8 w-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────

export default function OcarinaStudio() {
  const { data: products = [], isLoading, isError } = useGetProducts();

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: "oklch(10% 0.02 240)",
        color: "oklch(90% 0.01 240)",
      }}
    >
      <DecorativeHoles />

      {/* Product Ticker Bar */}
      <ProductTickerBar products={products} />

      {/* Studio Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-xs font-bold uppercase tracking-[0.2em]">
                  Live Studio
                </span>
              </div>
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight"
                style={{ color: "oklch(95% 0.03 240)" }}
              >
                Ocarina Music Studio
              </h1>
              <p className="text-white/50 mt-2 text-sm md:text-base max-w-xl">
                Play any ocarina in your browser. Select a scale, tap the notes,
                and explore melodies — each instrument sounds uniquely alive.
              </p>
            </div>

            {/* Scale legend */}
            <div className="flex flex-wrap gap-2">
              {(["bass-low", "bass", "alto", "soprano"] as OcarinaScale[]).map(
                (s) => (
                  <span
                    key={s}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border backdrop-blur-sm ${
                      SCALE_BADGE[s].pill
                    }`}
                  >
                    <Music className="h-2.5 w-2.5" />
                    {SCALE_LABELS[s]}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="relative z-10 container max-w-7xl mx-auto px-4 py-10 pb-40">
        {isLoading ? (
          <LoadingSkeleton />
        ) : isError ? (
          <div
            className="text-center py-20 text-white/40"
            data-ocid="studio.error_state"
          >
            <Music className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">Unable to load instruments</p>
          </div>
        ) : products.length === 0 ? (
          <div
            className="text-center py-20 text-white/40"
            data-ocid="studio.empty_state"
          >
            <Music className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No instruments yet</p>
            <Link to="/">
              <Button
                variant="outline"
                className="mt-4 border-white/20 text-white/60 hover:text-white"
              >
                Browse Marketplace
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white/90">
                  {products.length} Instrument{products.length !== 1 ? "s" : ""}
                </h2>
                <p className="text-white/40 text-xs mt-0.5">
                  Click any card to open the interactive player
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              data-ocid="studio.list"
            >
              {products.map((product, i) => (
                <div
                  key={product.id.toString()}
                  data-ocid={`studio.item.${i + 1}`}
                >
                  <ProductStudioCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Sheet Music Scanner */}
        <section className="mt-16 max-w-2xl mx-auto">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-bold text-white/90">
              Sheet Music Scanner
            </h2>
            <p className="text-white/40 text-sm mt-1">
              Upload a photo of sheet music to detect the note sequence
            </p>
          </div>
          <SheetMusicScanner scale="alto" />
        </section>
      </main>
      <SheetMusicMiniPlayer />
    </div>
  );
}
