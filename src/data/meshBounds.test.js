import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as THREE from "three";
import { copyMeshWorldBox } from "./meshBounds.js";

describe("mesh world bounds", () => {
  it("frames InstancedMesh from the instance spread, not one hex", () => {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial(), 2);
    const m = new THREE.Matrix4();
    m.setPosition(0, 0, 0);
    mesh.setMatrixAt(0, m);
    m.setPosition(0, 40, 0);
    mesh.setMatrixAt(1, m);
    mesh.instanceMatrix.needsUpdate = true;
    mesh.updateMatrixWorld(true);
    const box = new THREE.Box3();
    assert.equal(copyMeshWorldBox(mesh, box), true);
    const size = new THREE.Vector3();
    box.getSize(size);
    assert.ok(size.y > 30, `expected instance span, got ${size.y}`);
  });
});
