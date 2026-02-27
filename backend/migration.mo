import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type OldActor = {
    products : Map.Map<Nat, OldProduct>;
    // Other fields intentionally omitted for partial migration
  };

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
    createdAt : Time.Time;
    category : Text;
    displayOrder : Nat;
  };

  type NewActor = {
    products : Map.Map<Nat, OldProduct>;
  };

  public func run(old : OldActor) : NewActor {
    { products = old.products };
  };
};
