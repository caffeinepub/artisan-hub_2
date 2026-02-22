import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import OutCall "http-outcalls/outcall";
import Nat "mo:core/Nat";
import Migration "migration";

(with migration = Migration.run)
actor {
  include MixinStorage();

  // Initialize the access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Branding configuration types
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

  // Admin only - update branding configuration
  public shared ({ caller }) func updateBrandingConfig(config : BrandingConfig) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update branding configuration");
    };
    brandingConfig := config;
  };

  // Public query - get current branding configuration
  public query func getBrandingConfig() : async BrandingConfig {
    brandingConfig;
  };

  // User profile type
  public type UserProfile = {
    name : Text;
    email : Text;
    stripeAccountId : ?Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management
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

  // Product types
  public type Product = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Storage.ExternalBlob];
    inventoryCount : Nat;
  };

  let products = Map.empty<Nat, Product>();
  var nextProductId = 1;

  // Shopping Cart Types
  public type CartItem = {
    product : Product;
    quantity : Nat;
  };

  public type ShoppingCart = {
    items : [CartItem];
    total : Nat;
  };

  let shoppingCarts = Map.empty<Principal, [CartItem]>();

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  // Admin only - product management
  public shared ({ caller }) func addProduct(
    name : Text,
    shape : Text,
    price : Nat,
    stripeProductId : Text,
    stripeProductDescription : Text,
    images : [Storage.ExternalBlob],
    inventoryCount : Nat,
  ) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add products");
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
    };

    products.add(nextProductId, product);
    nextProductId += 1;
  };

  // Update product function - Admin only
  public shared ({ caller }) func updateProduct(
    productId : Nat,
    name : ?Text,
    shape : ?Text,
    price : ?Nat,
    stripeProductId : ?Text,
    stripeProductDescription : ?Text,
    images : ?[Storage.ExternalBlob],
    inventoryCount : ?Nat,
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
    };

    products.add(productId, updatedProduct);
  };

  // Separate inventory count update - Admin only
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

  // Public query - anyone can view products
  public query func getProducts() : async [Product] {
    products.values().toArray();
  };

  // Public query to get single product by id
  public query func getProduct(productId : Nat) : async ?Product {
    products.get(productId);
  };

  // New function to get the total product count - Admin only
  public query ({ caller }) func getProductCount() : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view product count");
    };
    products.size();
  };

  // Shopping Cart Functions

  // Get a user's cart items - Users only
  public query ({ caller }) func getCart() : async [CartItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access shopping cart");
    };
    switch (shoppingCarts.get(caller)) {
      case (null) { [] };
      case (?items) { items };
    };
  };

  // Add product to cart (creates cart if not exists) - Users only
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
        let updatedCart = cart.map(func(item) { if (item.product.id == productId) { found := true } });
        if (found) {
          Runtime.trap("Product already in cart, use update quantity function");
        } else {
          shoppingCarts.add(caller, cart.concat([{ product; quantity }]));
        };
      };
    };
  };

  // Update quantity of a cart item - Users only
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

  // Remove one item from cart (by product id) - Users only
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

  // Remove all items from cart - Users only
  public shared ({ caller }) func removeAllCartItems() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can clear their cart");
    };
    shoppingCarts.remove(caller);
  };

  // Get total (subtotals for now) - will later adjust for discounts, etc. - Users only
  public query ({ caller }) func getCartTotal() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cart total");
    };

    var total = 0;
    switch (shoppingCarts.get(caller)) {
      case (null) { return 0 };
      case (?cart) { for (item in cart.values()) { total += item.product.price * item.quantity } };
    };
    total;
  };

  // Public query - anyone can check if Stripe is configured
  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  // Admin only - sensitive configuration
  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can configure Stripe");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  // Public function - anyone (including guests) can check session status
  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  // Public function - anyone (including guests) can create checkout session
  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // Public query - required for HTTP outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Add/Update product images
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

  // Replace specific image at index
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

  // Checkout Function (create session from carts) - Users only
  public shared ({ caller }) func checkoutCartItems(successUrl : Text, cancelUrl : Text) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can checkout");
    };

    let items = switch (shoppingCarts.get(caller)) {
      case (null) { Runtime.trap("Cart is empty or does not exist") };
      case (?items) { items };
    };

    if (items.size() == 0) {
      Runtime.trap("Cart is empty");
    };
    // Transform cart items to shopping items
    let shoppingItems = items.map<CartItem, Stripe.ShoppingItem>(
      func(cartItem) {
        {
          cartItem with
          currency = "eur";
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

  // Empty the cart without checkout - Users only
  public shared ({ caller }) func emptyCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can empty their cart");
    };
    shoppingCarts.remove(caller);
  };

  // Test function to clear all carts (admin only)
  public shared ({ caller }) func clearAllCarts() : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can clear all carts");
    };
    shoppingCarts.clear();
  };
};
