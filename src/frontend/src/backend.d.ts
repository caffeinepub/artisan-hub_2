import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface UserProfile {
    stripeAccountId?: string;
    name: string;
    email: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface BrandingConfig {
    theme?: string;
    primaryColor?: string;
    logo?: ExternalBlob;
    siteName: string;
    favicon?: ExternalBlob;
    secondaryColor?: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CartItem {
    quantity: bigint;
    product: Product;
}
export interface Product {
    id: bigint;
    name: string;
    stripeProductId: string;
    shape: string;
    stripeProductDescription: string;
    inventoryCount: bigint;
    price: bigint;
    images: Array<ExternalBlob>;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCartItem(productId: bigint, quantity: bigint): Promise<void>;
    addOrUpdateProductImage(productId: bigint, image: ExternalBlob): Promise<void>;
    addProduct(name: string, shape: string, price: bigint, stripeProductId: string, stripeProductDescription: string, images: Array<ExternalBlob>, inventoryCount: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkoutCartItems(successUrl: string, cancelUrl: string): Promise<string | null>;
    clearAllCarts(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    emptyCart(): Promise<void>;
    getBrandingConfig(): Promise<BrandingConfig>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getCartTotal(): Promise<bigint>;
    getProduct(productId: bigint): Promise<Product | null>;
    getProductCount(): Promise<bigint>;
    getProducts(): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    removeAllCartItems(): Promise<void>;
    removeCartItem(productId: bigint): Promise<void>;
    replaceProductImage(productId: bigint, imageIndex: bigint, newImage: ExternalBlob): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBrandingConfig(config: BrandingConfig): Promise<void>;
    updateCartItem(productId: bigint, newQuantity: bigint): Promise<void>;
    updateInventoryCount(productId: bigint, inventoryCount: bigint): Promise<void>;
    updateProduct(productId: bigint, name: string | null, shape: string | null, price: bigint | null, stripeProductId: string | null, stripeProductDescription: string | null, images: Array<ExternalBlob> | null, inventoryCount: bigint | null): Promise<void>;
}
