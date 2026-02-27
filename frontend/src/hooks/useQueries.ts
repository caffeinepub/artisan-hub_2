import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Product, UserProfile, ShoppingItem, StripeConfiguration, ExternalBlob, CartItem, BrandingConfig, ShopDetails, HomepageConfig, DescriptionTemplate, DiscountCode, PaymentSettings, BonusItemConfig } from '../backend';
import { Variant_percentage_fixedAmount } from '../backend';
import { toast } from 'sonner';

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

export function useGetProduct(productId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ['product', productId?.toString()],
    queryFn: async () => {
      if (!actor || !productId) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && productId !== null,
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

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      shape: string;
      price: bigint;
      stripeProductId: string;
      stripeProductDescription: string;
      images: ExternalBlob[];
      inventoryCount: bigint;
      category: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addProduct(
        params.name,
        params.shape,
        params.price,
        params.stripeProductId,
        params.stripeProductDescription,
        params.images,
        params.inventoryCount,
        params.category
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['productCount'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
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
      category?: string;
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
        params.inventoryCount ?? null,
        params.category ?? null
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
    },
  });
}

export function useBulkUpdateProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productIds: bigint[];
      updates: {
        name?: string;
        shape?: string;
        price?: bigint;
        stripeProductDescription?: string;
        inventoryCount?: bigint;
        category?: string;
      };
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      const results = await Promise.allSettled(
        params.productIds.map((productId) =>
          actor.updateProduct(
            productId,
            params.updates.name ?? null,
            params.updates.shape ?? null,
            params.updates.price ?? null,
            null,
            params.updates.stripeProductDescription ?? null,
            null,
            params.updates.inventoryCount ?? null,
            params.updates.category ?? null
          )
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.filter((r) => r.status === 'rejected').length;

      return { successCount, failedCount, results };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
      
      if (data.failedCount > 0) {
        toast.warning(`${data.successCount} products updated, ${data.failedCount} failed`);
      } else {
        toast.success(`${data.successCount} products updated successfully`);
      }
    },
    onError: (error) => {
      toast.error('Failed to update products');
      console.error(error);
    },
  });
}

export function useUpdateInventoryCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; inventoryCount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateInventoryCount(params.productId, params.inventoryCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
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
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
    },
  });
}

export function useDecrementInventory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      const product = await actor.getProduct(productId);
      if (!product) throw new Error('Product not found');
      const newCount = product.inventoryCount > BigInt(0) ? product.inventoryCount - BigInt(1) : BigInt(0);
      await actor.updateInventoryCount(productId, newCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
      queryClient.invalidateQueries({ queryKey: ['totalInventoryValue'] });
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
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useTrackProductView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.trackProductView(productId);
    },
  });
}

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

export function useGetCartItemCount() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['cart', 'count'],
    queryFn: async () => {
      if (!actor) return 0;
      const cart = await actor.getCart();
      return cart.reduce((sum, item) => sum + Number(item.quantity), 0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCartTotal() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['cart', 'total'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCartTotal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCartItem(params.productId, params.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to basket!');
    },
    onError: (error: any) => {
      if (error?.message?.includes('Unauthorized')) {
        toast.error('Please log in to add items to your basket');
      } else {
        toast.error('Failed to add to basket');
      }
      console.error(error);
    },
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; quantity: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCartItem(params.productId, BigInt(params.quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Added to basket!');
    },
    onError: (error: any) => {
      if (error?.message?.includes('Unauthorized')) {
        toast.error('Please log in to add items to your basket');
      } else {
        toast.error('Failed to add to basket');
      }
      console.error(error);
    },
  });
}

export function useUpdateCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; newQuantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCartItem(params.productId, params.newQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
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

export function useDeleteStripeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteStripeConfig();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
      toast.success('Stripe configuration deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete Stripe configuration');
      console.error(error);
    },
  });
}

export function useCreateCheckoutSession() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: {
      items: ShoppingItem[];
      successUrl: string;
      cancelUrl: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createNoShippingCheckoutSession(
        params.items,
        params.successUrl,
        params.cancelUrl
      );
      const session = JSON.parse(result) as { id: string; url: string };
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      return session;
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBrandingConfig() {
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

export function useGetShopDetails() {
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

export function useGetHomepageConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageConfig>({
    queryKey: ['homepageConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getHomepageConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateHomepageConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: HomepageConfig) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateHomepageConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageConfig'] });
    },
  });
}

export function useGetDescriptionTemplates() {
  const { actor, isFetching } = useActor();

  return useQuery<DescriptionTemplate[]>({
    queryKey: ['descriptionTemplates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDescriptionTemplates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createDescriptionTemplate(params.name, params.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptionTemplates'] });
    },
  });
}

export function useUpdateDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; name: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateDescriptionTemplate(params.id, params.name, params.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptionTemplates'] });
    },
  });
}

export function useDeleteDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteDescriptionTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descriptionTemplates'] });
    },
  });
}

export function useGetTotalInventoryValue() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalInventoryValue'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalInventoryValue();
    },
    enabled: !!actor && !isFetching,
  });
}

// ================== Discount Code Hooks ==================

export function useDiscountCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<DiscountCode[]>({
    queryKey: ['discountCodes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountCodes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      code: string;
      discountType: Variant_percentage_fixedAmount;
      value: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createDiscountCode(params.id, params.code, params.discountType, params.value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      toast.success('Discount code created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message?.includes('already exists') ? 'A code with this ID already exists' : 'Failed to create discount code');
      console.error(error);
    },
  });
}

export function useUpdateDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      code: string;
      discountType: Variant_percentage_fixedAmount;
      value: number;
      active: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateDiscountCode(params.id, params.code, params.discountType, params.value, params.active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      toast.success('Discount code updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update discount code');
      console.error(error);
    },
  });
}

export function useDeleteDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discountCodes'] });
      toast.success('Discount code deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete discount code');
      console.error(error);
    },
  });
}

export function useValidateDiscountCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string): Promise<DiscountCode | null> => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateDiscountCode(code);
    },
  });
}

// ================== Payment Settings Hooks ==================

export function usePaymentSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentSettings>({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getPaymentSettings();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePaymentSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      proOcarinaAppUrl: string;
      bonusItemConfig: BonusItemConfig;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePaymentSettings(params.proOcarinaAppUrl, params.bonusItemConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentSettings'] });
      toast.success('Payment settings saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save payment settings');
      console.error(error);
    },
  });
}
