import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Migration "migration";
import Text "mo:core/Text";

(with migration = Migration.run)
actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type BrandingConfig = {
    siteName : Text;
    logo : ?Storage.ExternalBlob;
    favicon : ?Storage.ExternalBlob;
    primaryColor : ?Text;
    secondaryColor : ?Text;
    theme : ?Text;
  };

  var brandingConfig : BrandingConfig = {
    siteName = "Default Store Name";
    logo = null;
    favicon = null;
    primaryColor = null;
    secondaryColor = null;
    theme = null;
  };

  public type HomepageConfig = {
    heroMotto : Text;
    heroImage : ?Storage.ExternalBlob;
    promotionalText : Text;
  };

  var homepageConfig : HomepageConfig = {
    heroMotto = "Welcome to Sweet Treats!";
    heroImage = null;
    promotionalText = "Taste the best handmade pralines and chocolates!";
  };

  public shared ({ caller }) func updateHomepageConfig(config : HomepageConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update homepage configuration");
    };
    homepageConfig := config;
  };

  public query func getHomepageConfig() : async HomepageConfig {
    homepageConfig;
  };

  public shared ({ caller }) func updateBrandingConfig(config : BrandingConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update branding configuration");
    };
    brandingConfig := config;
  };

  public query func getBrandingConfig() : async BrandingConfig {
    brandingConfig;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    stripeAccountId : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type Product = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Storage.ExternalBlob];
    inventoryCount : Nat;
    viewCount : Nat;
    createdAt : Time.Time;
    category : Text;
    displayOrder : Nat;
  };

  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;

  public type CartItem = {
    product : Product;
    quantity : Nat;
  };

  public type ShoppingCart = {
    items : [CartItem];
    total : Nat;
  };

  let shoppingCarts = Map.empty<Principal, [CartItem]>();

  // Extended pointer to ShopDetails for migration compatibility
  type ShopDetails = {
    shopName : Text;
    address : {
      street : Text;
      city : Text;
      zipcode : Text;
      country : Text;
    };
    contactDetails : {
      phone : Text;
      email : Text;
    };
    openingHours : {
      monday : ?Text;
      tuesday : ?Text;
      wednesday : ?Text;
      thursday : ?Text;
      friday : ?Text;
      saturday : ?Text;
      sunday : ?Text;
    };
    companyDetails : {
      vatId : Text;
      taxId : Text;
    };
  };

  var shopDetails : ?ShopDetails = null;

  public shared ({ caller }) func updateShopDetails(details : ShopDetails) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update shop details");
    };
    shopDetails := ?details;
  };

  public query func getShopDetails() : async ?ShopDetails {
    shopDetails;
  };

  public shared func trackProductView(productId : Nat) : async () {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        let updatedProduct : Product = {
          product with
          viewCount = product.viewCount + 1;
        };
        products.add(productId, updatedProduct);
      };
    };
  };

  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    configuration := ?config;
  };

  public shared ({ caller }) func deleteStripeConfig() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete Stripe config");
    };
    configuration := null;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func addProduct(
    name : Text,
    shape : Text,
    price : Nat,
    stripeProductId : Text,
    stripeProductDescription : Text,
    images : [Storage.ExternalBlob],
    inventoryCount : Nat,
    category : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    var maxOrder = 0;
    for (_product in products.values()) {
      maxOrder += 1;
    };

    let product : Product = {
      id = nextProductId;
      name;
      shape;
      price;
      stripeProductId;
      stripeProductDescription;
      images;
      inventoryCount;
      createdAt = Time.now();
      viewCount = 0;
      category;
      displayOrder = maxOrder;
    };

    products.add(nextProductId, product);
    nextProductId += 1;
  };

  public shared ({ caller }) func updateProduct(
    productId : Nat,
    name : ?Text,
    shape : ?Text,
    price : ?Nat,
    stripeProductId : ?Text,
    stripeProductDescription : ?Text,
    images : ?[Storage.ExternalBlob],
    inventoryCount : ?Nat,
    category : ?Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    let existingProduct = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };

    let updatedProduct : Product = {
      existingProduct with
      name = switch (name) { case (null) { existingProduct.name }; case (?n) { n } };
      shape = switch (shape) { case (null) { existingProduct.shape }; case (?s) { s } };
      price = switch (price) { case (null) { existingProduct.price }; case (?p) { p } };
      stripeProductId = switch (stripeProductId) {
        case (null) { existingProduct.stripeProductId };
        case (?id) { id };
      };
      stripeProductDescription = switch (stripeProductDescription) {
        case (null) { existingProduct.stripeProductDescription };
        case (?desc) { desc };
      };
      images = switch (images) { case (null) { existingProduct.images }; case (?i) { i } };
      inventoryCount = switch (inventoryCount) {
        case (null) { existingProduct.inventoryCount };
        case (?count) { count };
      };
      category = switch (category) { case (null) { existingProduct.category }; case (?c) { c } };
    };

    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func updateInventoryCount(productId : Nat, inventoryCount : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update inventory count");
    };

    let existingProduct = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };

    let updatedProduct : Product = {
      existingProduct with inventoryCount;
    };

    products.add(productId, updatedProduct);
  };

  module ProductOrdering {
    public func compareByDisplayOrder(a : Product, b : Product) : Order.Order {
      Nat.compare(a.displayOrder, b.displayOrder);
    };

    public func compareByViewCountDescending(a : Product, b : Product) : Order.Order {
      Nat.compare(b.viewCount, a.viewCount);
    };

    public func compareByCreatedAtDescending(a : Product, b : Product) : Order.Order {
      Int.compare(b.createdAt, a.createdAt);
    };
  };

  public query func getProducts() : async [Product] {
    itemsFromIter(products.values()).sort(ProductOrdering.compareByDisplayOrder);
  };

  public query func getProduct(productId : Nat) : async ?Product {
    products.get(productId);
  };

  public shared ({ caller }) func updateProductDisplayOrder(productIds : [Nat]) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update product order");
    };

    var i = 0;
    for (productId in productIds.values()) {
      let currentProduct = switch (products.get(productId)) {
        case (null) { Runtime.trap("Product not found") };
        case (?product) { product };
      };
      let updatedProduct : Product = {
        currentProduct with displayOrder = i;
      };
      products.add(productId, updatedProduct);
      i += 1;
    };
  };

  public query ({ caller }) func getProductCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view product count");
    };
    products.size();
  };

  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their cart");
    };
    switch (shoppingCarts.get(caller)) {
      case (null) { [] };
      case (?items) { items };
    };
  };

  public shared ({ caller }) func addCartItem(productId : Nat, quantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
    };

    if (quantity == 0) {
      Runtime.trap("Invalid quantity");
    };

    let product = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?p) { p };
    };

    switch (shoppingCarts.get(caller)) {
      case (null) {
        shoppingCarts.add(caller, [{ product; quantity }]);
      };
      case (?cart) {
        var found = false;
        for (item in cart.values()) {
          if (item.product.id == productId) { found := true };
        };
        if (found) {
          Runtime.trap("Product already in cart, use update quantity function");
        } else {
          shoppingCarts.add(caller, cart.concat([{ product; quantity }]));
        };
      };
    };
  };

  public shared ({ caller }) func updateCartItem(productId : Nat, newQuantity : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update cart items");
    };

    if (newQuantity == 0) {
      Runtime.trap("Invalid quantity");
    };

    let cart = switch (shoppingCarts.get(caller)) {
      case (null) { Runtime.trap("Cart does not exist") };
      case (?items) { items };
    };

    var found = false;
    let updatedCart = cart.map(
      func(item) {
        if (item.product.id == productId) {
          found := true;
          { item with quantity = newQuantity };
        } else {
          item;
        };
      }
    );

    if (not found) {
      Runtime.trap("Product not found in cart");
    };

    shoppingCarts.add(caller, updatedCart);
  };

  public shared ({ caller }) func removeCartItem(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove cart items");
    };

    let cart = switch (shoppingCarts.get(caller)) {
      case (null) { Runtime.trap("Cart does not exist") };
      case (?items) { items };
    };

    let filteredCart = cart.filter(func(item) { item.product.id != productId });

    if (filteredCart.size() == cart.size()) {
      Runtime.trap("Product not found in cart");
    };

    switch (filteredCart.size()) {
      case (0) {
        shoppingCarts.remove(caller);
      };
      case (_) {
        shoppingCarts.add(caller, filteredCart);
      };
    };
  };

  public shared ({ caller }) func removeAllCartItems() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their cart");
    };
    shoppingCarts.remove(caller);
  };

  public query ({ caller }) func getCartTotal() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view cart total");
    };

    var total = 0;
    switch (shoppingCarts.get(caller)) {
      case (null) { return 0 };
      case (?cart) { for (item in cart.values()) { total += item.product.price * item.quantity } };
    };
    total;
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    let audItems = items.map(
      func(item) {
        { item with currency = "aud" };
      }
    );
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, audItems, successUrl, cancelUrl, transform);
  };

  public shared ({ caller }) func createNoShippingCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    let audItems = items.map(
      func(item) {
        { item with currency = "aud" };
      }
    );
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, audItems, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func addOrUpdateProductImage(productId : Nat, image : Storage.ExternalBlob) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add/update product images");
    };

    let existingProduct = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };

    let updatedImages = existingProduct.images.concat([image]);

    let updatedProduct : Product = {
      existingProduct with
      images = updatedImages;
    };

    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func replaceProductImage(productId : Nat, imageIndex : Nat, newImage : Storage.ExternalBlob) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can replace product images");
    };

    let existingProduct = switch (products.get(productId)) {
      case (null) { Runtime.trap("Product does not exist") };
      case (?product) { product };
    };

    if (imageIndex >= existingProduct.images.size()) {
      Runtime.trap("Image index out of bounds");
    };

    let updatedImages = Array.tabulate(
      existingProduct.images.size(),
      func(i) {
        if (i == imageIndex) { newImage } else { existingProduct.images[i] };
      },
    );

    let updatedProduct : Product = {
      existingProduct with
      images = updatedImages;
    };

    products.add(productId, updatedProduct);
  };

  public shared ({ caller }) func checkoutCartItems(successUrl : Text, cancelUrl : Text) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can checkout");
    };

    let items = switch (shoppingCarts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty or does not exist") };
      case (?items) { items };
    };

    if (items.size() == 0) {
      Runtime.trap("Cart is empty");
    };
    let shoppingItems = items.map<CartItem, Stripe.ShoppingItem>(
      func(cartItem) {
        {
          cartItem with
          currency = "aud";
          productName = cartItem.product.name;
          productDescription = cartItem.product.stripeProductDescription;
          priceInCents = cartItem.product.price;
          quantity = cartItem.quantity;
        };
      }
    );

    let sessionId = await createCheckoutSession(shoppingItems, successUrl, cancelUrl);
    shoppingCarts.remove(caller);
    ?sessionId;
  };

  public shared ({ caller }) func emptyCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can empty their cart");
    };
    shoppingCarts.remove(caller);
  };

  public shared ({ caller }) func clearAllCarts() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear all carts");
    };
    shoppingCarts.clear();
  };

  public type SortingOrder = {
    #mostViewed;
    #bestSelling;
    #newest;
  };

  public query func getFeaturedProducts() : async [Product] {
    let allProducts = products.values().toArray();
    allProducts.sort(ProductOrdering.compareByDisplayOrder);
  };

  public query func getMostViewedProducts() : async [Product] {
    let allProducts = products.values().toArray();
    allProducts.sort(ProductOrdering.compareByViewCountDescending);
  };

  public query func getNewestProducts() : async [Product] {
    let allProducts = products.values().toArray();
    allProducts.sort(ProductOrdering.compareByCreatedAtDescending);
  };

  public query func getBestSellingProducts() : async [Product] {
    let allProducts = products.values().toArray();
    allProducts.sort(ProductOrdering.compareByViewCountDescending);
  };

  public query func getProductsBySorting(sortType : SortingOrder) : async [Product] {
    let allProducts = products.values().toArray();

    switch (sortType) {
      case (#mostViewed) {
        allProducts.sort(ProductOrdering.compareByViewCountDescending);
      };
      case (#newest) {
        allProducts.sort(ProductOrdering.compareByCreatedAtDescending);
      };
      case (#bestSelling) {
        allProducts.sort(ProductOrdering.compareByViewCountDescending);
      };
    };
  };

  public query ({ caller }) func getTotalInventoryValue() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view total inventory value");
    };

    var totalValue = 0;
    for (product in products.values()) {
      totalValue += product.price * product.inventoryCount;
    };
    totalValue;
  };

  // ================== Discount Management ==================

  public type DiscountCode = {
    id : Text;
    code : Text;
    discountType : { #percentage; #fixedAmount };
    value : Float;
    active : Bool;
    createdAt : Int;
  };

  let discountCodes = Map.empty<Text, DiscountCode>();

  public shared ({ caller }) func createDiscountCode(
    id : Text,
    code : Text,
    discountType : { #percentage; #fixedAmount },
    value : Float,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create discount codes");
    };

    if (discountCodes.containsKey(id)) {
      Runtime.trap("Discount code with given id already exists");
    };

    let discount : DiscountCode = {
      id;
      code;
      discountType;
      value;
      active = true;
      createdAt = Time.now();
    };

    discountCodes.add(code, discount);
  };

  public shared ({ caller }) func updateDiscountCode(
    id : Text,
    code : Text,
    discountType : { #percentage; #fixedAmount },
    value : Float,
    active : Bool,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update discount codes");
    };

    let existingDiscount = switch (discountCodes.get(code)) {
      case (null) { Runtime.trap("Discount does not exist") };
      case (?discount) { discount };
    };

    let updatedDiscount : DiscountCode = {
      id;
      code;
      discountType;
      value;
      active;
      createdAt = existingDiscount.createdAt;
    };

    discountCodes.add(code, updatedDiscount);
  };

  public shared ({ caller }) func deleteDiscountCode(id : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete discount codes");
    };

    if (not discountCodes.containsKey(id)) {
      Runtime.trap("Discount code does not exist");
    };

    discountCodes.remove(id);
  };

  public query ({ caller }) func getDiscountCodes() : async [DiscountCode] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get discount codes");
    };

    discountCodes.values().toArray();
  };

  public query func validateDiscountCode(code : Text) : async ?DiscountCode {
    switch (discountCodes.get(code)) {
      case (null) { null };
      case (?discount) {
        if (discount.active) { ?discount } else { null };
      };
    };
  };

  // ================== Bonus Item Management ==================

  public type BonusItemConfig = {
    title : Text;
    description : Text;
    url : Text;
    enabled : Bool;
  };

  public type PaymentSettings = {
    proOcarinaAppUrl : Text;
    bonusItemConfig : BonusItemConfig;
  };

  var paymentSettings : PaymentSettings = {
    proOcarinaAppUrl = "";
    bonusItemConfig = {
      title = "";
      description = "";
      url = "";
      enabled = false;
    };
  };

  public query ({ caller }) func getPaymentSettings() : async PaymentSettings {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get payment settings");
    };

    paymentSettings;
  };

  public shared ({ caller }) func updatePaymentSettings(
    proOcarinaAppUrl : Text,
    bonusItemConfig : BonusItemConfig,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update payment settings");
    };

    paymentSettings := {
      proOcarinaAppUrl;
      bonusItemConfig;
    };
  };

  public query ({ caller }) func getBonusItemConfig() : async BonusItemConfig {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can get bonus item config");
    };

    paymentSettings.bonusItemConfig;
  };

  public shared ({ caller }) func updateBonusItemConfig(bonusItemConfig : BonusItemConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update bonus items");
    };

    paymentSettings := {
      paymentSettings with
      bonusItemConfig;
    };
  };

  // ================== Description Template Management ==================

  public type DescriptionTemplate = {
    id : Nat;
    name : Text;
    content : Text;
    createdAt : Time.Time;
  };

  let descriptionTemplates = Map.empty<Nat, DescriptionTemplate>();
  var nextTemplateId = 2; // Start from 2 since we have a default template

  public query ({ caller }) func getDescriptionTemplates() : async [DescriptionTemplate] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view description templates");
    };
    descriptionTemplates.values().toArray();
  };

  public shared ({ caller }) func createDescriptionTemplate(
    name : Text,
    content : Text,
  ) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create description templates");
    };

    let template : DescriptionTemplate = {
      id = nextTemplateId;
      name;
      content;
      createdAt = Time.now();
    };

    descriptionTemplates.add(nextTemplateId, template);
    nextTemplateId += 1;
    template.id;
  };

  public shared ({ caller }) func updateDescriptionTemplate(
    id : Nat,
    name : Text,
    content : Text,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update description templates");
    };

    let existingTemplate = switch (descriptionTemplates.get(id)) {
      case (null) { Runtime.trap("Template does not exist") };
      case (?template) { template };
    };

    let updatedTemplate : DescriptionTemplate = {
      id;
      name;
      content;
      createdAt = existingTemplate.createdAt;
    };

    descriptionTemplates.add(id, updatedTemplate);
  };

  public shared ({ caller }) func deleteDescriptionTemplate(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete description templates");
    };

    switch (descriptionTemplates.get(id)) {
      case (null) { Runtime.trap("Template does not exist") };
      case (?_) {
        descriptionTemplates.remove(id);
      };
    };
  };

  public query ({ caller }) func isAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  // Helper function to convert Iter to array
  func itemsFromIter<A>(iter : Iter.Iter<A>) : [A] {
    iter.toArray();
  };
};
