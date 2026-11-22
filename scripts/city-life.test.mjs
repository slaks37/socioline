import test from "node:test";
import assert from "node:assert/strict";
import { freshLife, act, validLife } from "../engine/city-life.ts";
import {
  validAvatar,
  initialAvatar,
  measure,
  selectCollection,
} from "../engine/avatar.ts";
test("old looks remain valid and custom proportions survive collection changes", () => {
  assert.equal(measure(initialAvatar, "height"), 1);
  const tall = { ...initialAvatar, shape: { height: 198, eyes: 120 } };
  assert(validAvatar(tall));
  assert.equal(selectCollection(tall, "afrika").shape.height, 198);
  assert(!validAvatar({ ...tall, shape: { height: 201 } }));
  assert(!validAvatar({ ...tall, shape: { nose: "long" } }));
});
test("work, deliveries, business, friendship and rest use earned resources", () => {
  let state = { ...freshLife };
  const perform = (key) => {
    state = act(state, key).state;
    assert(validLife(state));
  };
  perform("sell");
  assert.deepEqual(state, freshLife);
  perform("shift");
  perform("shift");
  assert.equal(state.energy, 3);
  perform("deliver");
  perform("deliver");
  assert.equal(state.coins, 12);
  perform("craft");
  perform("gift");
  assert.equal(state.friendship, 1);
  perform("buy");
  perform("craft");
  perform("sell");
  assert.equal(state.coins, 15);
  perform("rest");
  assert.equal(state.energy, 5);
  perform("decorate");
  assert.equal(state.decor, 1);
});
test("timed crops, livestock and business upgrades work with an earlier save", () => {
  let s = { ...freshLife };
  const use = (key, now = 1000) => {
    s = act(s, key, now).state;
    assert(validLife(s));
  };
  use("sow");
  use("harvest");
  assert.equal(s.supplies, 1);
  use("harvest", 31000);
  assert.equal(s.supplies, 4);
  use("herd");
  use("feed");
  use("milk");
  assert.equal(s.stock, 0);
  use("milk", 21000);
  assert.equal(s.stock, 2);
  use("milk", 21000);
  assert.equal(s.stock, 2);
  use("craft");
  use("wholesale");
  assert.equal(s.coins, 19);
  assert.equal(s.stock, 0);
  use("expand");
  use("craft");
  assert.equal(s.stock, 2);
});
