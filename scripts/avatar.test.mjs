import test from "node:test";
import assert from "node:assert/strict";
import {
  collections,
  getFaceOptions,
  getOutfitOptions,
  initialAvatar,
  resolveLook,
  selectBase,
  selectCollection,
  selectFace,
  selectOutfit,
  validAvatar,
} from "../engine/avatar.ts";

test("every illustrated face and wardrobe choice can be combined and saved", () => {
  let portraits = 0,
    garments = 0;
  for (const collection of collections) {
    for (const preset of ["Male", "Female"]) {
      const original = { ...initialAvatar, name: "Tamu" };
      const base = selectBase(selectCollection(original, collection), preset);
      const female = preset === "Female";
      const faces = getFaceOptions(collection, female);
      const outfits = getOutfitOptions(collection, female);
      portraits += faces.length;
      garments += outfits.length;
      for (const face of faces.keys()) {
        for (const outfit of outfits.keys()) {
          const result = selectOutfit(selectFace(base, face), outfit);
          assert.ok(validAvatar(JSON.parse(JSON.stringify(result))));
          const look = resolveLook(result);
          assert.deepEqual(
            [
              look.collection,
              look.female,
              look.faceIndex,
              look.outfitIndex,
              result.name,
            ],
            [collection, female, face, outfit, "Tamu"],
          );
        }
      }
    }
  }
  assert.deepEqual([portraits, garments], [61, 70]);
});

test("old saves retain name, cosmetics and a playable outfit", () => {
  const old = {
    preset: "Male",
    face: "toba",
    hair: "Crop",
    hairColor: "#77776f",
    skin: "#895c43",
    name: "Adi",
    outfit: "#41887c",
    garment: "T-shirt",
  };
  assert.ok(validAvatar(old));
  const look = resolveLook(old);
  assert.deepEqual(
    [look.hair, look.skin, look.hairColor, look.outfitIndex],
    [old.hair, old.skin, old.hairColor, 1],
  );
  assert.equal(selectCollection(old, "tiongkok").name, old.name);
});

test("switching sets resets incompatible indexes and validates untrusted saved cosmetics", () => {
  const seventh = selectFace(
    selectBase(selectCollection(initialAvatar, "afrika"), "Male"),
    6,
  );
  assert.equal(resolveLook(seventh).faceIndex, 6);
  assert.ok(validAvatar(selectBase(seventh, "Female")));
  assert.ok(validAvatar(selectCollection(seventh, "amerika")));
  for (const bad of [
    { collection: "absent" },
    { outfitIndex: 7 },
    { faceIndex: 1.5 },
    { faceIndex: -1 },
    { accessory: "constructor" },
    { accessory: { toString: 3 } },
    { hair: "absent" },
  ]) {
    assert.equal(validAvatar({ ...initialAvatar, ...bad }), false);
  }
});
