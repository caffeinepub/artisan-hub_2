import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product, UserProfile, ShoppingItem, StripeConfiguration, ExternalBlob, CartItem, BrandingConfig, ShopDetails } from '../backend';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMostViewedProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', 'mostViewed'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMostViewedProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBestSellingProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', 'bestSelling'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBestSellingProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useNewestProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products', 'newest'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewestProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProductCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['productCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getProductCount();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProduct() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProduct(productId);
    },
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      name: string;
      shape: string;
      price: bigint;
      stripeProductId: string;
      stripeProductDescription: string;
      images: ExternalBlob[];
      inventoryCount: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addProduct(
        product.name,
        product.shape,
        product.price,
        product.stripeProductId,
        product.stripeProductDescription,
        product.images,
        product.inventoryCount
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCount'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      name?: string;
      shape?: string;
      price?: bigint;
      stripeProductId?: string;
      stripeProductDescription?: string;
      images?: ExternalBlob[];
      inventoryCount?: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateProduct(
        params.productId,
        params.name ?? null,
        params.shape ?? null,
        params.price ?? null,
        params.stripeProductId ?? null,
        params.stripeProductDescription ?? null,
        params.images ?? null,
        params.inventoryCount ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useIncrementInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const product = await actor.getProduct(productId);
      if (!product) throw new Error('Product not found');
      const newCount = product.inventoryCount + BigInt(1);
      await actor.updateInventoryCount(productId, newCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useReplaceProductImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      imageIndex: bigint;
      newImage: ExternalBlob;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.replaceProductImage(params.productId, params.imageIndex, params.newImage);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['stripeConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (items: ShoppingItem[]) => {
      if (!actor) throw new Error('Actor not available');
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;
      const result = await actor.createNoShippingCheckoutSession(items, successUrl, cancelUrl);
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useGetStripeSessionStatus() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStripeSessionStatus(sessionId);
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Shopping Cart Hooks
export function useGetCart() {
  const { actor, isFetching } = useActor();

  return useQuery<CartItem[]>({
    queryKey: ['cart'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: bigint; quantity?: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCartItem(productId, BigInt(quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      queryClient.invalidateQueries({ queryKey: ['cartTotal'] });
    },
  });
}

export function useUpdateCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: bigint; quantity: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCartItem(productId, BigInt(quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cartTotal'] });
    },
  });
}

export function useRemoveCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.removeCartItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      queryClient.invalidateQueries({ queryKey: ['cartTotal'] });
    },
  });
}

export function useRemoveAllCartItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.removeAllCartItems();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['cartCount'] });
      queryClient.invalidateQueries({ queryKey: ['cartTotal'] });
    },
  });
}

export function useGetCartItemCount() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['cartCount'],
    queryFn: async () => {
      if (!actor) return 0;
      const cart = await actor.getCart();
      return cart.length;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCartTotal() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['cartTotal'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCartTotal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBrandingConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<BrandingConfig>({
    queryKey: ['brandingConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBrandingConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBrandingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BrandingConfig) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateBrandingConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brandingConfig'] });
    },
  });
}

export function useShopDetails() {
  const { actor, isFetching } = useActor();

  return useQuery<ShopDetails | null>({
    queryKey: ['shopDetails'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getShopDetails();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateShopDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: ShopDetails) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateShopDetails(details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopDetails'] });
    },
  });
}
