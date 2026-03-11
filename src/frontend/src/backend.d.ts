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
export interface Product {
    id: bigint;
    displayOrder: bigint;
    name: string;
    createdAt: Time;
    stripeProductId: string;
    shape: string;
    viewCount: bigint;
    stripeProductDescription: string;
    category: string;
    inventoryCount: bigint;
    price: bigint;
    images: Array<ExternalBlob>;
}
export interface DescriptionTemplate {
    id: bigint;
    content: string;
    name: string;
    createdAt: Time;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface OcarinaFingeringMap {
    note0: Array<boolean>;
    note1: Array<boolean>;
    note2: Array<boolean>;
    note3: Array<boolean>;
    note4: Array<boolean>;
    note5: Array<boolean>;
    note6: Array<boolean>;
    note7: Array<boolean>;
}
export interface OcarinaProfile {
    id: bigint;
    scaleName: string;
    fingeringMap: OcarinaFingeringMap;
    iconMappings?: Array<string>;
    noteDegreeMappings: OcarinaNoteDegrees;
    noteAudioBlobs?: Array<ExternalBlob>;
}
export interface DiscountCode {
    id: string;
    active: boolean;
    value: number;
    code: string;
    createdAt: bigint;
    discountType: Variant_percentage_fixedAmount;
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
export interface BrandingConfig {
    theme?: string;
    primaryColor?: string;
    logo?: ExternalBlob;
    siteName: string;
    favicon?: ExternalBlob;
    secondaryColor?: string;
}
export interface PaymentSettings {
    bonusItemConfig: BonusItemConfig;
    proOcarinaAppUrl: string;
}
export interface HomepageConfig {
    heroImage?: ExternalBlob;
    promotionalText: string;
    heroMotto: string;
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
export interface ShopDetails {
    address: {
        street: string;
        country: string;
        city: string;
        zipcode: string;
    };
    openingHours: {
        tuesday?: string;
        wednesday?: string;
        saturday?: string;
        thursday?: string;
        sunday?: string;
        friday?: string;
        monday?: string;
    };
    shopName: string;
    companyDetails: {
        taxId: string;
        vatId: string;
    };
    contactDetails: {
        email: string;
        phone: string;
    };
}
export interface BonusItemConfig {
    url: string;
    title: string;
    description: string;
    enabled: boolean;
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
export type OcarinaNoteDegrees = Array<bigint>;
export interface CartItem {
    quantity: bigint;
    product: Product;
}
export interface UserProfile {
    stripeAccountId?: string;
    name: string;
    email: string;
}
export enum SortingOrder {
    bestSelling = "bestSelling",
    newest = "newest",
    mostViewed = "mostViewed"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_percentage_fixedAmount {
    percentage = "percentage",
    fixedAmount = "fixedAmount"
}
export interface backendInterface {
    addCartItem(productId: bigint, quantity: bigint): Promise<void>;
    addOrUpdateProductImage(productId: bigint, image: ExternalBlob): Promise<void>;
    addProduct(name: string, shape: string, price: bigint, stripeProductId: string, stripeProductDescription: string, images: Array<ExternalBlob>, inventoryCount: bigint, category: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkoutCartItems(successUrl: string, cancelUrl: string): Promise<string | null>;
    clearAllCarts(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createDescriptionTemplate(name: string, content: string): Promise<bigint>;
    createDiscountCode(id: string, code: string, discountType: Variant_percentage_fixedAmount, value: number): Promise<void>;
    createNoShippingCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteDescriptionTemplate(id: bigint): Promise<void>;
    deleteDiscountCode(id: string): Promise<void>;
    deleteOcarinaProfile(productId: bigint): Promise<void>;
    deleteStripeConfig(): Promise<void>;
    emptyCart(): Promise<void>;
    getBestSellingProducts(): Promise<Array<Product>>;
    getBonusItemConfig(): Promise<BonusItemConfig>;
    getBrandingConfig(): Promise<BrandingConfig>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCart(): Promise<Array<CartItem>>;
    getCartTotal(): Promise<bigint>;
    getDescriptionTemplates(): Promise<Array<DescriptionTemplate>>;
    getDiscountCodes(): Promise<Array<DiscountCode>>;
    getFeaturedProducts(): Promise<Array<Product>>;
    getFingeringMap(productId: bigint): Promise<OcarinaFingeringMap>;
    getHomepageConfig(): Promise<HomepageConfig>;
    getMostViewedProducts(): Promise<Array<Product>>;
    getNewestProducts(): Promise<Array<Product>>;
    getNoteAudio(productId: bigint, noteIndex: bigint): Promise<ExternalBlob>;
    getNoteIcon(productId: bigint, noteIndex: bigint): Promise<string>;
    getOcarinaProfile(productId: bigint): Promise<OcarinaProfile | null>;
    getOcarinaProfiles(): Promise<Array<OcarinaProfile>>;
    getPaymentSettings(): Promise<PaymentSettings>;
    getProduct(productId: bigint): Promise<Product | null>;
    getProductCount(): Promise<bigint>;
    getProducts(): Promise<Array<Product>>;
    getProductsBySorting(sortType: SortingOrder): Promise<Array<Product>>;
    getShopDetails(): Promise<ShopDetails | null>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTotalInventoryValue(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isAdmin(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    removeAllCartItems(): Promise<void>;
    removeCartItem(productId: bigint): Promise<void>;
    replaceProductImage(productId: bigint, imageIndex: bigint, newImage: ExternalBlob): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveNoteAudio(productId: bigint, noteIndex: bigint, audioBlob: ExternalBlob): Promise<void>;
    saveNoteIcon(productId: bigint, noteIndex: bigint, iconId: string): Promise<void>;
    saveOcarinaProfile(profile: OcarinaProfile): Promise<void>;
    scanSheetMusic(url: string): Promise<Array<bigint>>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    trackProductView(productId: bigint): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateBonusItemConfig(bonusItemConfig: BonusItemConfig): Promise<void>;
    updateBrandingConfig(config: BrandingConfig): Promise<void>;
    updateCartItem(productId: bigint, newQuantity: bigint): Promise<void>;
    updateDescriptionTemplate(id: bigint, name: string, content: string): Promise<void>;
    updateDiscountCode(id: string, code: string, discountType: Variant_percentage_fixedAmount, value: number, active: boolean): Promise<void>;
    updateHomepageConfig(config: HomepageConfig): Promise<void>;
    updateInventoryCount(productId: bigint, inventoryCount: bigint): Promise<void>;
    updatePaymentSettings(proOcarinaAppUrl: string, bonusItemConfig: BonusItemConfig): Promise<void>;
    updateProduct(productId: bigint, name: string | null, shape: string | null, price: bigint | null, stripeProductId: string | null, stripeProductDescription: string | null, images: Array<ExternalBlob> | null, inventoryCount: bigint | null, category: string | null): Promise<void>;
    updateProductDisplayOrder(productIds: Array<bigint>): Promise<void>;
    updateShopDetails(details: ShopDetails): Promise<void>;
    validateDiscountCode(code: string): Promise<DiscountCode | null>;
}
