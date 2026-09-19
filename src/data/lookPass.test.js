import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isolateFadesPart, meshTakesLook, selectKeepsHue } from "./lookPass.js";

describe("isolate look pass", () => {
  it("still fades skipFrame scale meshes", () => {
    const falcon = { isMesh: true, material: {}, userData: { skipFrame: true, part: { id: "scale.falcon" } } };
    const person = { isMesh: true, material: {}, userData: { skipFrame: true, part: { id: "scale.person" } } };
    assert.equal(meshTakesLook(falcon), true);
    assert.equal(meshTakesLook(person), true);
  });

  it("skips pick proxies and empty nodes", () => {
    assert.equal(meshTakesLook({ isMesh: true, material: {}, userData: { pickProxy: true } }), false);
    assert.equal(meshTakesLook({ isMesh: false, material: {}, userData: {} }), false);
    assert.equal(meshTakesLook(null), false);
  });

  it("does not gold-wash heat-shield tiles", () => {
    assert.equal(selectKeepsHue({ keepHue: true, id: "starship.tiles" }), true);
    assert.equal(selectKeepsHue({ id: "booster.engines" }), false);
  });

  it("keeps the ghost booster visible when isolating chopsticks", () => {
    assert.equal(isolateFadesPart("mechazilla.ghost", "mechazilla.arms", ["mechazilla.ghost"]), false);
    assert.equal(isolateFadesPart("mechazilla.tower", "mechazilla.arms", ["mechazilla.ghost"]), true);
  });
});
