import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CUTAWAY_SCENES,
  TEACH_LABELS,
  calloutKicker,
  peelBusy,
  peelHintFor,
  reducePeel,
  sceneSupportsCutaway,
  teachLabel,
} from "./teachingPeel.js";

describe("teaching peel", () => {
  it("names stack pieces in spoken English", () => {
    assert.equal(teachLabel({ id: "booster.engines" }), "The 33 engines");
    assert.equal(teachLabel({ id: "starship.tiles" }), "Heat-shield tiles");
    assert.equal(teachLabel({ id: "starship.loxHeader" }), "Oxygen header tank");
    assert.equal(teachLabel({ id: "mechazilla.arms" }), "Chopsticks — tower arms");
    assert.equal(teachLabel({ id: "scale.person" }), "A person — about 1.8 m");
    assert.equal(teachLabel({ id: "scale.falcon" }), "Falcon 9 — for scale");
    assert.equal(teachLabel({ id: "unknown.part", name: "Fallback" }), "Fallback");
    assert.equal(/lede|at a glance|delve/i.test(Object.values(TEACH_LABELS).join(" ")), false);
  });

  it("enables tank cutaway on the stack scenes only", () => {
    assert.equal(sceneSupportsCutaway("fullstack"), true);
    assert.equal(sceneSupportsCutaway("booster"), true);
    assert.equal(sceneSupportsCutaway("starship"), true);
    assert.equal(sceneSupportsCutaway("raptor"), false);
    assert.equal(sceneSupportsCutaway("mechazilla"), false);
    assert.deepEqual([...CUTAWAY_SCENES].sort(), ["booster", "fullstack", "starship"]);
  });

  it("explains peel without a new URL scheme", () => {
    assert.match(peelHintFor("fullstack"), /Cutaway opens the tank shells/);
    assert.match(peelHintFor("fullstack"), /Falcon 9/);
    assert.match(peelHintFor("fullstack"), /Click a piece/);
    assert.equal(peelHintFor("fullstack").includes("?mode="), false);
  });

  it("toggles isolate and reassembles without clearing cutaway", () => {
    let s = reducePeel(undefined, { type: "cutaway", on: true });
    s = reducePeel(s, { type: "explode", on: true });
    s = reducePeel(s, { type: "isolate", id: "booster.engines" });
    assert.equal(peelBusy(s), true);
    assert.equal(calloutKicker(s), "Isolated — others faded");
    s = reducePeel(s, { type: "toggle-isolate", id: "booster.engines" });
    assert.equal(s.isolateId, null);
    assert.equal(s.explode, true);
    s = reducePeel(s, { type: "reassemble" });
    assert.deepEqual(s, { explode: false, isolateId: null, cutaway: true });
    s = reducePeel(s, { type: "reset" });
    assert.deepEqual(s, { explode: false, isolateId: null, cutaway: false });
  });
});
