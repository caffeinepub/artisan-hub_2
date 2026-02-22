import Map "mo:core/Map";
import Storage "blob-storage/Storage";

module {
  type OldCategory = {
    id : Nat;
    name : Text;
    description : Text;
  };

  type OldProduct = {
    id : Nat;
    name : Text;
    shape : Text;
    category : OldCategory;
    price : Nat;
    stripeProductId : Text;
    stripeProductDescription : Text;
    images : [Storage.ExternalBlob];
  };

  type OldCartItem = {
    product : OldProduct;
    quantity : Nat;
  };

  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    shoppingCarts : Map.Map<Principal, [OldCartItem]>;
    categories : Map.Map<Nat, OldCategory>;
    nextCategoryId : Nat;
    predefinedCategories : [OldCategory];
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
        {
          oldProduct with
          inventoryCount = 0;
        };
      }
    );
    let newShoppingCarts = old.shoppingCarts.map<Principal, [OldCartItem], [NewCartItem]>(
      func(_principal, oldCartItems) {
        oldCartItems.map<OldCartItem, NewCartItem>(
          func(oldCartItem) {
            {
              product = {
                oldCartItem.product with
                inventoryCount = 0;
              };
              quantity = oldCartItem.quantity;
            };
          }
        );
      }
    );
    {
      products = newProducts;
      shoppingCarts = newShoppingCarts;
    };
  };
};
