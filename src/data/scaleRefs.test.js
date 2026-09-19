import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { scaleRefOptions } from "./scaleRefs.js";

describe("scale ref options", () => {
  it("keeps Falcon in the vehicle camera box and skips the 1.8 m person", () => {
    const vehicle = scaleRefOptions();
    assert.equal(vehicle.includeFalcon, true);
    assert.equal(vehicle.personSkipFrame, true);
    assert.equal(vehicle.compactPerson, false);
    assert.equal(vehicle.personX, 11);
    assert.equal(vehicle.falconX, 22);
  });

  it("puts only a compact person in the engine camera box", () => {
    const engine = scaleRefOptions({ includeFalcon: false, personX: 2.25, personY: -1.22 });
    assert.equal(engine.includeFalcon, false);
    assert.equal(engine.personSkipFrame, false);
    assert.equal(engine.compactPerson, true);
    assert.equal(engine.personX, 2.25);
    assert.equal(engine.personY, -1.22);
    assert.equal(engine.personZ, 0.8);
  });
});
