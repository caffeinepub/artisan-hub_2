import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  // Old product type without category field
  type OldProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Blob]; // Adjusted for Blob compatibility
    inventoryCount : Nat;
    viewCount : Nat;
    createdAt : Time.Time;
  };

  type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    shoppingCarts : Map.Map<Principal, [OldCartItem]>;
  };

  // New product type with category field
  type NewProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Blob]; // Adjusted for Blob compatibility
    inventoryCount : Nat;
    viewCount : Nat;
    createdAt : Time.Time;
    category : Text;
  };

  type NewCartItem = {
    product : NewProduct;
    quantity : Nat;
  };

  type NewActor = {
    products : Map.Map<Nat, NewProduct>;
    shoppingCarts : Map.Map<Principal, [NewCartItem]>;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        { oldProduct with category = "Uncategorized" };
      }
    );

    let newShoppingCarts = old.shoppingCarts.map<Principal, [OldCartItem], [NewCartItem]>(
      func(_principal, oldCartItems) {
        oldCartItems.map(
          func(oldCartItem) {
            {
              oldCartItem with
              product = { oldCartItem.product with category = "Uncategorized" };
            };
          }
        );
      }
    );

    { products = newProducts; shoppingCarts = newShoppingCarts };
  };
};
