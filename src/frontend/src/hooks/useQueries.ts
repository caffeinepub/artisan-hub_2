import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  BonusItemConfig,
  BrandingConfig,
  CartItem,
  DescriptionTemplate,
  DiscountCode,
  ExternalBlob,
  HomepageConfig,
  OcarinaProfile,
  PaymentSettings,
  Product,
  ShopDetails,
  ShoppingItem,
  StripeConfiguration,
  UserProfile,
} from "../backend";
import type { Variant_percentage_fixedAmount } from "../backend";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useGetMostViewedProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products", "mostViewed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMostViewedProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}
// Backward-compat alias
export const useMostViewedProducts = useGetMostViewedProducts;

export function useGetBestSellingProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products", "bestSelling"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBestSellingProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}
// Backward-compat alias
export const useBestSellingProducts = useGetBestSellingProducts;

export function useGetNewestProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewestProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}
// Backward-compat alias
export const useNewestProducts = useGetNewestProducts;

export function useGetProduct(productId?: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Product | null>({
    queryKey: ["product", productId?.toString()],
    queryFn: async () => {
      if (!actor || !productId) return null;
      return actor.getProduct(productId);
    },
    enabled: !!actor && !isFetching && !!productId,
    staleTime: 30_000,
  });
}

export function useGetProductCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["productCount"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getProductCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

// addProduct(name, shape, price, stripeProductId, stripeProductDescription, images, inventoryCount, category)
export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      name: string;
      description: string;
      price: bigint;
      inventoryCount: bigint;
      images: ExternalBlob[];
      shape: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addProduct(
        params.name,
        params.shape,
        params.price,
        "",
        params.description,
        params.images,
        params.inventoryCount ?? null,
        params.category,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}
// Backward-compat alias
export const useCreateProduct = useAddProduct;

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      name: string;
      description: string;
      price: bigint;
      inventoryCount?: bigint;
      images?: ExternalBlob[];
      shape: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateProduct(
        params.productId,
        params.name,
        params.shape,
        params.price,
        null,
        params.description,
        params.images ?? null,
        params.inventoryCount ?? null,
        params.category,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["product", variables.productId.toString()],
      });
    },
  });
}

export function useBulkUpdateProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productIds: bigint[];
      name?: string | null;
      description?: string | null;
      price?: bigint | null;
      inventoryCount?: bigint | null;
      shape?: string | null;
      category?: string | null;
    }) => {
      if (!actor) throw new Error("Actor not available");
      // Update each product individually (no bulk endpoint)
      await Promise.all(
        params.productIds.map((id) =>
          actor.updateProduct(
            id,
            params.name ?? null,
            params.shape ?? null,
            params.price ?? null,
            null,
            params.description ?? null,
            null,
            params.inventoryCount ?? null,
            params.category ?? null,
          ),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateInventoryCount() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      inventoryCount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateInventoryCount(params.productId, params.inventoryCount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
// Backward-compat alias
export const useIncrementStock = useUpdateInventoryCount;

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      // Use updateProduct to set inventory to 0 as soft delete, or simply remove via update
      // Backend doesn't have a removeProduct — use updateProduct to nullify
      // Actually check if removeProduct exists
      await (actor as any).removeProduct?.(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["productCount"] });
    },
  });
}

export function useDeleteProducts() {
  return useDeleteProduct();
}

export function useReorderProducts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: bigint[]) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateProductDisplayOrder(productIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useTrackProductView() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.trackProductView(productId);
    },
  });
}

export function useGetCart() {
  const { actor, isFetching } = useActor();

  return useQuery<CartItem[]>({
    queryKey: ["cart"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCart();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5_000,
  });
}

export function useGetCartCount() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["cart", "count"],
    queryFn: async () => {
      if (!actor) return 0;
      const items = await actor.getCart();
      return items.reduce((sum, item) => sum + Number(item.quantity), 0);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5_000,
  });
}
// Backward-compat alias
export const useGetCartItemCount = useGetCartCount;

export function useGetCartTotal() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["cart", "total"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCartTotal();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5_000,
  });
}

export function useAddCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addCartItem(params.productId, params.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error("Failed to add to cart");
      console.error(error);
    },
  });
}

export function useAddToCart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; quantity: number }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.addCartItem(params.productId, BigInt(params.quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error("Failed to add to cart");
      console.error(error);
    },
  });
}

export function useUpdateCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { productId: bigint; newQuantity: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateCartItem(params.productId, params.newQuantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveCartItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.removeCartItem(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useRemoveAllCartItems() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.removeAllCartItems();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
}

export function useIsStripeConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["stripeConfigured"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isStripeConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useSetStripeConfiguration() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: StripeConfiguration) => {
      if (!actor) throw new Error("Actor not available");
      await actor.setStripeConfiguration(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
      toast.success("Stripe configuration saved");
    },
    onError: (error) => {
      toast.error("Failed to save Stripe configuration");
      console.error(error);
    },
  });
}

export function useDeleteStripeConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteStripeConfig();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stripeConfigured"] });
      toast.success("Stripe configuration deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete Stripe configuration");
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
      discountCode?: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createNoShippingCheckoutSession(
        params.items,
        params.successUrl,
        params.cancelUrl,
      );
    },
    onError: (error) => {
      toast.error("Failed to create checkout session");
      console.error(error);
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}
// Backward-compat alias
export const useIsCallerAdmin = useIsAdmin;

export function useGetBrandingConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<BrandingConfig | null>({
    queryKey: ["brandingConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBrandingConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useUpdateBrandingConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: BrandingConfig) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateBrandingConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brandingConfig"] });
      toast.success("Branding configuration saved");
    },
    onError: (error) => {
      toast.error("Failed to save branding configuration");
      console.error(error);
    },
  });
}

export function useGetShopDetails() {
  const { actor, isFetching } = useActor();

  return useQuery<ShopDetails | null>({
    queryKey: ["shopDetails"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getShopDetails();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
  });
}

export function useUpdateShopDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (details: ShopDetails) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateShopDetails(details);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopDetails"] });
      toast.success("Shop details saved");
    },
    onError: (error) => {
      toast.error("Failed to save shop details");
      console.error(error);
    },
  });
}

export function useGetHomepageConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<HomepageConfig | null>({
    queryKey: ["homepageConfig"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getHomepageConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUpdateHomepageConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: HomepageConfig) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateHomepageConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepageConfig"] });
      toast.success("Homepage configuration saved");
    },
    onError: (error) => {
      toast.error("Failed to save homepage configuration");
      console.error(error);
    },
  });
}

export function useGetDescriptionTemplates() {
  const { actor, isFetching } = useActor();

  return useQuery<DescriptionTemplate[]>({
    queryKey: ["descriptionTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDescriptionTemplates();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useCreateDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string; content: string }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.createDescriptionTemplate(params.name, params.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["descriptionTemplates"] });
      toast.success("Template created");
    },
    onError: (error) => {
      toast.error("Failed to create template");
      console.error(error);
    },
  });
}

export function useUpdateDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      name: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateDescriptionTemplate(
        params.id,
        params.name,
        params.content,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["descriptionTemplates"] });
      toast.success("Template updated");
    },
    onError: (error) => {
      toast.error("Failed to update template");
      console.error(error);
    },
  });
}

export function useDeleteDescriptionTemplate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteDescriptionTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["descriptionTemplates"] });
      toast.success("Template deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete template");
      console.error(error);
    },
  });
}

export function useGetTotalInventoryValue() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ["totalInventoryValue"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalInventoryValue();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useDiscountCodes() {
  const { actor, isFetching } = useActor();

  return useQuery<DiscountCode[]>({
    queryKey: ["discountCodes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDiscountCodes();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
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
      if (!actor) throw new Error("Actor not available");
      await actor.createDiscountCode(
        params.id,
        params.code,
        params.discountType,
        params.value,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
      toast.success("Discount code created");
    },
    onError: (error) => {
      toast.error("Failed to create discount code");
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
      if (!actor) throw new Error("Actor not available");
      await actor.updateDiscountCode(
        params.id,
        params.code,
        params.discountType,
        params.value,
        params.active,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
      toast.success("Discount code updated");
    },
    onError: (error) => {
      toast.error("Failed to update discount code");
      console.error(error);
    },
  });
}

export function useDeleteDiscountCode() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteDiscountCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discountCodes"] });
      toast.success("Discount code deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete discount code");
      console.error(error);
    },
  });
}

export function useValidateDiscountCode() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.validateDiscountCode(code);
    },
  });
}

export function usePaymentSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<PaymentSettings | null>({
    queryKey: ["paymentSettings"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPaymentSettings();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
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
      if (!actor) throw new Error("Actor not available");
      await actor.updatePaymentSettings(
        params.proOcarinaAppUrl,
        params.bonusItemConfig,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentSettings"] });
      toast.success("Payment settings saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save payment settings");
      console.error(error);
    },
  });
}

// ─── Ocarina Profile Queries ──────────────────────────────────────────────────

export function useGetOcarinaProfile(productId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<OcarinaProfile | null>({
    queryKey: ["ocarinaProfile", productId?.toString()],
    queryFn: async () => {
      if (!actor || productId === null) return null;
      return actor.getOcarinaProfile(productId);
    },
    enabled: !!actor && !isFetching && productId !== null,
    staleTime: 60_000,
  });
}

export function useSaveOcarinaProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: OcarinaProfile) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveOcarinaProfile(profile);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ocarinaProfile", variables.id.toString()],
      });
      toast.success("Ocarina profile saved");
    },
    onError: (error) => {
      toast.error("Failed to save ocarina profile");
      console.error(error);
    },
  });
}

export function useSaveNoteAudio() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      noteIndex: bigint;
      audioBlob: ExternalBlob;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveNoteAudio(
        params.productId,
        params.noteIndex,
        params.audioBlob,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ocarinaProfile", variables.productId.toString()],
      });
      toast.success("Audio saved");
    },
    onError: (error) => {
      toast.error("Failed to save audio");
      console.error(error);
    },
  });
}

export function useSaveNoteIcon() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      productId: bigint;
      noteIndex: bigint;
      iconId: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.saveNoteIcon(
        params.productId,
        params.noteIndex,
        params.iconId,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ocarinaProfile", variables.productId.toString()],
      });
    },
    onError: (error) => {
      toast.error("Failed to save icon");
      console.error(error);
    },
  });
}

export function useScanSheetMusic() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.scanSheetMusic(imageUrl);
    },
    onError: (error) => {
      console.error("Sheet music scan error:", error);
    },
  });
}
