import * as THREE from "three";
import { createMaterials, enableShadows, ids, tag } from "./helpers.js";

const PARTS = ids("tiles", {
  carrier: {
    name: "Carrier panel",
    blurb:
      "A curved stainless substrate stands in for the ship barrel under the tiles. Real attachment structure is not shown.",
  },
  tiles: {
    name: "Thermal-protection tiles",
    keepHue: true,
    frameTight: 1.22,
    frameBias: { x: 0.32, y: 0.12, z: 1.05 },
    blurb:
      "Hexagonal (and a few rectangular edge) tiles in a public heat-shield style. Gaps, thickness, and numbering are educational, not a flight map.",
  },
  felt: {
    name: "Tile gaps",
    blurb:
      "Dark gaps between tiles recall felt/gap fillers seen on public close-ups. Materials and stack-up are not specified.",
  },
});

export function createTilePanel() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const radius = 4.5;
  const spanA = Math.PI * 0.42;
  const y0 = -3.4;
  const y1 = 3.4;

  const carrier = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, y1 - y0 + 0.6, 48, 1, true, -spanA / 2, spanA),
    mats.stainless,
  );
  carrier.material.side = THREE.DoubleSide;
  tag(carrier, PARTS.carrier);
  g.add(carrier);

  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 0.012, radius + 0.012, y1 - y0 + 0.4, 48, 1, true, -spanA / 2, spanA),
    mats.carbon,
  );
  felt.material.side = THREE.DoubleSide;
  tag(felt, PARTS.felt);
  g.add(felt);

  const hexR = 0.22;
  const hex = new THREE.CylinderGeometry(hexR * 0.92, hexR * 0.92, 0.07, 6);
  hex.rotateX(Math.PI / 2);
  const rect = new THREE.BoxGeometry(hexR * 1.6, hexR * 1.15, 0.07);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const dy = hexR * 1.5;
  let row = 0;
  const instances = [];

  for (let y = y0 + 0.3; y <= y1 - 0.3; y += dy, row += 1) {
    let col = 0;
    for (let a = -spanA / 2 + 0.08; a <= spanA / 2 - 0.08; a += 0.105, col += 1) {
      const aa = a + (row % 2) * 0.052;
      const useRect = row === 0 || y > y1 - 0.55;
      instances.push({ y, a: aa, useRect, row, col });
    }
  }

  const tileMat = mats.tile.clone();
  tileMat.vertexColors = true;
  const hexMesh = new THREE.InstancedMesh(hex, tileMat, instances.filter((t) => !t.useRect).length);
  const rectMesh = new THREE.InstancedMesh(rect, tileMat.clone(), instances.filter((t) => t.useRect).length);
  hexMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(hexMesh.count * 3), 3);
  rectMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(rectMesh.count * 3), 3);

  let hi = 0;
  let ri = 0;
  const tileMeta = [];

  const place = (mesh, index, inst) => {
    const outward = radius + 0.055;
    dummy.position.set(Math.sin(inst.a) * outward, inst.y, Math.cos(inst.a) * outward);
    dummy.lookAt(new THREE.Vector3(Math.sin(inst.a) * 20, inst.y, Math.cos(inst.a) * 20));
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    color.setHSL(0.055, 0.1, 0.09 + ((inst.row * 17 + inst.col * 13) % 7) * 0.018);
    mesh.setColorAt(index, color);
    const normal = new THREE.Vector3(Math.sin(inst.a), 0, Math.cos(inst.a));
    tileMeta.push({ mesh, index, home: dummy.matrix.clone(), normal, a: inst.a, y: inst.y });
  };

  for (const inst of instances) {
    if (inst.useRect) {
      place(rectMesh, ri, inst);
      ri += 1;
    } else {
      place(hexMesh, hi, inst);
      hi += 1;
    }
  }

  hexMesh.castShadow = true;
  rectMesh.castShadow = true;
  if (hexMesh.instanceColor) hexMesh.instanceColor.needsUpdate = true;
  if (rectMesh.instanceColor) rectMesh.instanceColor.needsUpdate = true;
  hexMesh.instanceMatrix.needsUpdate = true;
  rectMesh.instanceMatrix.needsUpdate = true;
  tag(hexMesh, PARTS.tiles);
  tag(rectMesh, PARTS.tiles);
  const tileGroup = new THREE.Group();
  tileGroup.add(hexMesh, rectMesh);
  tag(tileGroup, PARTS.tiles);
  // InstancedMesh geometry bbox is one hex at the origin; frame the carrier instead.
  tileGroup.userData.frameFocus = carrier;
  g.add(tileGroup);

  g.userData.tileMeta = tileMeta;
  g.userData.supportsExplode = true;
  g.userData.setExplode = (t) => {
    const dummy2 = new THREE.Object3D();
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    for (const tile of tileMeta) {
      tile.home.decompose(pos, quat, scl);
      pos.addScaledVector(tile.normal, t * 1.15);
      dummy2.position.copy(pos);
      dummy2.quaternion.copy(quat);
      dummy2.scale.copy(scl);
      dummy2.updateMatrix();
      tile.mesh.setMatrixAt(tile.index, dummy2.matrix);
    }
    hexMesh.instanceMatrix.needsUpdate = true;
    rectMesh.instanceMatrix.needsUpdate = true;
  };

  const stand = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.2, 2.2), mats.pad);
  stand.position.set(0, y0 - 0.5, radius * 0.2);
  g.add(stand);

  enableShadows(g);
  return g;
}
