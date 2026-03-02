import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";

module {
  type OldActor = {
    descriptionTemplates : Map.Map<Nat, DescriptionTemplate>;
    nextTemplateId : Nat;
  };

  type NewActor = {
    descriptionTemplates : Map.Map<Nat, DescriptionTemplate>;
    nextTemplateId : Nat;
  };

  public type DescriptionTemplate = {
    id : Nat;
    name : Text;
    content : Text;
    createdAt : Time.Time;
  };

  public func run(old : OldActor) : NewActor {
    let updatedTemplates = if (old.descriptionTemplates.isEmpty()) {
      Map.fromIter<Nat, DescriptionTemplate>(
        [
          (
            1,
            {
              id = 1;
              name = "Default";
              content = "Experience clear, rich sound and precise tuning with this unique, original ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊";
              createdAt = Time.now();
            },
          ),
          (
            2,
            {
              id = 2;
              name = "Turtle";
              content = "Like the turtle's steady journey through calm waters, this ocarina sings a melody that is patient, rich, and full of depth. Experience clear, rich sound and precise tuning with this unique, original Turtle ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊";
              createdAt = Time.now();
            },
          ),
          (
            3,
            {
              id = 3;
              name = "Dolphin";
              content = "Inspired by the dolphin's playful leaps and joyful calls, this ocarina carries a bright, flowing melody that dances through the air. Experience clear, rich sound and precise tuning with this unique, original Dolphin ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊";
              createdAt = Time.now();
            },
          ),
          (
            4,
            {
              id = 4;
              name = "Frog";
              content = "Like the frog's cheerful evening chorus rising from the pond, this ocarina rings out with a warm, lively melody that fills any space with charm. Experience clear, rich sound and precise tuning with this unique, original Frog ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊";
              createdAt = Time.now();
            },
          ),
          (
            5,
            {
              id = 5;
              name = "Whale";
              content = "Echoing the whale's deep, haunting song across open oceans, this ocarina delivers a resonant, soulful melody that moves the heart. Experience clear, rich sound and precise tuning with this unique, original Whale ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊";
              createdAt = Time.now();
            },
          ),
        ].values(),
      );
    } else {
      let existingTemplates = old.descriptionTemplates.map<Nat, DescriptionTemplate, DescriptionTemplate>(
        func(id, template) {
          switch (id) {
            case (1) {
              { template with content = "Experience clear, rich sound and precise tuning with this unique, original ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊" };
            };
            case (2) {
              { template with content = "Like the turtle's steady journey through calm waters, this ocarina sings a melody that is patient, rich, and full of depth. Experience clear, rich sound and precise tuning with this unique, original Turtle ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊" };
            };
            case (3) {
              { template with content = "Inspired by the dolphin's playful leaps and joyful calls, this ocarina carries a bright, flowing melody that dances through the air. Experience clear, rich sound and precise tuning with this unique, original Dolphin ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊" };
            };
            case (4) {
              { template with content = "Like the frog's cheerful evening chorus rising from the pond, this ocarina rings out with a warm, lively melody that fills any space with charm. Experience clear, rich sound and precise tuning with this unique, original Frog ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊" };
            };
            case (5) {
              { template with content = "Echoing the whale's deep, haunting song across open oceans, this ocarina delivers a resonant, soulful melody that moves the heart. Experience clear, rich sound and precise tuning with this unique, original Whale ocarina. Get instant access to our Pro Learning App, a digital ocarina to jam with, and free postage – a perfect blend of tradition and tech 😊" };
            };
            case (_) { template };
          };
        }
      );
      existingTemplates;
    };

    {
      old with
      descriptionTemplates = updatedTemplates;
      nextTemplateId = 6;
    };
  };
};
