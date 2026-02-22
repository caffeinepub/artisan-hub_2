import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type OldProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Storage.ExternalBlob];
    inventoryCount : Nat;
  };

  type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  type OldActor = {
    brandingConfig : {
      siteName : Text;
      logo : ?Storage.ExternalBlob;
      favicon : ?Storage.ExternalBlob;
      primaryColor : ?Text;
      secondaryColor : ?Text;
      theme : ?Text;
    };
    userProfiles : Map.Map<Principal, { name : Text; email : Text; stripeAccountId : ?Text }>;
    products : Map.Map<Nat, OldProduct>;
    nextProductId : Nat;
    shoppingCarts : Map.Map<Principal, [OldCartItem]>;
    configuration : ?{ secretKey : Text; allowedCountries : [Text] };
  };

  type NewProduct = {
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
  };

  type NewCartItem = {
    product : NewProduct;
    quantity : Nat;
  };

  type NewActor = {
    brandingConfig : {
      siteName : Text;
      logo : ?Storage.ExternalBlob;
      favicon : ?Storage.ExternalBlob;
      primaryColor : ?Text;
      secondaryColor : ?Text;
      theme : ?Text;
    };
    userProfiles : Map.Map<Principal, { name : Text; email : Text; stripeAccountId : ?Text }>;
    products : Map.Map<Nat, NewProduct>;
    nextProductId : Nat;
    shoppingCarts : Map.Map<Principal, [NewCartItem]>;
    configuration : ?{
      secretKey : Text;
      allowedCountries : [Text];
    };
    shopDetails : ?{
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
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        { oldProduct with viewCount = 0; createdAt = Time.now() };
      }
    );

    // Explicit mapping of shoppingCarts to convert old cart items to new format
    let newShoppingCarts = old.shoppingCarts.map<Principal, [OldCartItem], [NewCartItem]>(
      func(_principal, oldCartItems) {
        oldCartItems.map<OldCartItem, NewCartItem>(
          func(oldCartItem) {
            // Map product to NewProduct if needed
            let newProduct = { oldCartItem.product with viewCount = 0; createdAt = Time.now() };
            { oldCartItem with product = newProduct };
          }
        );
      }
    );

    {
      old with
      products = newProducts;
      shoppingCarts = newShoppingCarts;
      shopDetails = null;
    };
  };
};

