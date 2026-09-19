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
  whyFramesPart,
  whyShapeFor,
} from "./teachingPeel.js";

describe("teaching peel", () => {
  it("names stack pieces in spoken English", () => {
    assert.equal(teachLabel({ id: "booster.engines" }), "The 33 engines");
    assert.equal(teachLabel({ id: "starship.tiles" }), "Heat-shield tiles");
    assert.equal(teachLabel({ id: "tiles.carrier" }), "The barrel under the tiles");
    assert.equal(teachLabel({ id: "tiles.felt" }), "Tile gaps");
    assert.equal(teachLabel({ id: "starship.loxHeader" }), "Oxygen header tank");
    assert.equal(teachLabel({ id: "mechazilla.arms" }), "Chopsticks — tower arms");
    assert.equal(teachLabel({ id: "scale.person" }), "A person — about 1.8 m");
    assert.equal(teachLabel({ id: "scale.falcon" }), "Falcon 9 — for scale");
    assert.match(TEACH_LABELS["scale.person"], /1\.8 m/);
    assert.equal(teachLabel({ id: "merlin.gasGen" }), "Gas generator — one can");
    assert.equal(teachLabel({ id: "merlin.engine" }), "Merlin 1D — the right engine");
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
    assert.match(peelHintFor("starship"), /Falcon 9/);
    assert.match(peelHintFor("starship"), /taller/i);
    assert.equal(peelHintFor("fullstack").includes("?mode="), false);
    assert.match(peelHintFor("compare-engines"), /two preburners/i);
    assert.match(peelHintFor("compare-engines"), /gas generator/i);
    assert.match(peelHintFor("compare-engines"), /person/i);
    assert.equal(peelHintFor("compare-engines").includes("?mode="), false);
    assert.match(peelHintFor("raptor"), /person/i);
    assert.match(peelHintFor("tiles"), /hex|curve|Why/i);
    assert.match(peelHintFor("mechazilla"), /gulf-side/i);
    assert.match(peelHintFor("mechazilla"), /tower left/i);
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

  it("ties the heat-shield panel to heat, curve, and gaps", () => {
    const rows = whyShapeFor("tiles");
    assert.equal(rows.length, 3);
    assert.equal(rows[0].partId, "tiles.tiles");
    assert.match(rows[0].body, /heat|tank/i);
    assert.equal(rows[1].partId, "tiles.carrier");
    assert.match(rows[1].body, /9 m|barrel|curve/i);
    assert.equal(rows[2].partId, "tiles.felt");
    assert.match(rows[2].body, /felt|gap/i);
    assert.equal(/delve|at a glance|robust /i.test(rows.map((r) => `${r.title} ${r.body}`).join(" ")), false);
  });

  it("ties tiles, steel, and flaps to a job", () => {
    const rows = whyShapeFor("fullstack");
    assert.equal(rows.length, 3);
    assert.match(rows[0].body, /belly|heat|tank/i);
    assert.match(rows[1].title, /steel is the tank/i);
    assert.match(rows[2].body, /belly-first|tiled side/i);
    assert.equal(/delve|at a glance|robust /i.test(rows.map((r) => `${r.title} ${r.body}`).join(" ")), false);
  });

  it("ties Raptor preburners and Mechazilla arms to a job", () => {
    const raptor = whyShapeFor("raptor");
    assert.equal(raptor[0].partId, "raptor.oxPre");
    assert.match(raptor[0].body, /full-flow|preburner|methane/i);
    const tower = whyShapeFor("mechazilla");
    assert.equal(tower[1].partId, "mechazilla.arms");
    assert.deepEqual(tower[1].keepIds, ["mechazilla.ghost"]);
    assert.match(tower[1].body, /pins|9 m/i);
    assert.equal(/delve|at a glance|robust /i.test([...raptor, ...tower].map((r) => `${r.title} ${r.body}`).join(" ")), false);
  });

  it("contrasts two preburners with one gas generator", () => {
    const rows = whyShapeFor("compare-engines");
    assert.equal(rows.length, 3);
    assert.equal(rows[0].partId, "raptor.oxPre");
    assert.match(rows[0].title, /two preburners/i);
    assert.equal(rows[1].partId, "merlin.gasGen");
    assert.match(rows[1].body, /gas generator|one can/i);
    assert.match(rows[2].body, /methane/i);
    assert.equal(/delve|at a glance|robust /i.test(rows.map((r) => `${r.title} ${r.body}`).join(" ")), false);
  });

  it("does not zoom Why parts on a phone viewport", () => {
    assert.equal(whyFramesPart(390), false);
    assert.equal(whyFramesPart(861), true);
  });
});
