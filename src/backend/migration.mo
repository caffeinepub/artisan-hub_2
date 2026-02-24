import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Int "mo:core/Int";

module {
  type OldProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Blob];
    inventoryCount : Nat;
    viewCount : Nat;
    createdAt : Int;
    category : Text;
  };

  type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    shoppingCarts : Map.Map<Principal, [OldCartItem]>;
  };

  type NewProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Blob];
    inventoryCount : Nat;
    viewCount : Nat;
    createdAt : Int;
    category : Text;
    displayOrder : Nat;
  };

  type NewCartItem = {
    product : NewProduct;
    quantity : Nat;
  };

  type NewActor = {
    products : Map.Map<Nat, NewProduct>;
    shoppingCarts : Map.Map<Principal, [NewCartItem]>;
  };

  func migrateCartItems(items : [OldCartItem]) : [NewCartItem] {
    items.map(
      func(oldCartItem) {
        {
          oldCartItem with
          product = { oldCartItem.product with displayOrder = oldCartItem.product.id };
        };
      }
    );
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Nat, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        { oldProduct with displayOrder = oldProduct.id };
      }
    );

    let newShoppingCarts = old.shoppingCarts.map<Principal, [OldCartItem], [NewCartItem]>(
      func(_id, oldItems) {
        migrateCartItems(oldItems);
      }
    );

    {
      products = newProducts;
      shoppingCarts = newShoppingCarts;
    };
  };
};
