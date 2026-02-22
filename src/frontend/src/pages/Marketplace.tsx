import { useState } from 'react';
import { useGetProducts } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ProductDetailView from '../components/ProductDetailView';
import type { Product } from '../backend';

export default function Marketplace() {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] overflow-hidden">
        <img
          src="/assets/generated/hero-banner.dim_1200x400.png"
          alt="Artisan crafts"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50 flex items-center">
          <div className="container">
            <h1 className="font-serif text-5xl md:text-6xl font-bold text-foreground mb-4 max-w-2xl">
              Handcrafted with Love
            </h1>
            <p className="text-xl text-foreground/80 max-w-xl">
              Discover unique artisan treasures, each piece telling its own story
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold mb-2">Our Collection</h2>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
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
            })}
          </div>
        )}
      </section>

      <ProductDetailView
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      />
    </div>
  );
}
