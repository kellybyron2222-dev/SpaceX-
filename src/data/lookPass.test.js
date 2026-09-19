import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { meshTakesLook } from "./lookPass.js";

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
});
