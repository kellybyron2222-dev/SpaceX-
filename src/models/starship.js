import * as THREE from "three";
import {
  SCALE,
  addWeldRings,
  createFlap,
  createMaterials,
  createMiniRaptor,
  createPad,
  enableShadows,
  homeAndExplode,
  ids,
  tag,
} from "./helpers.js";

const PARTS = ids("starship", {
  nose: {
    name: "Nosecone / payload bay",
    blurb:
      "An ogive nose closes the ~52 m upper stage. Public articles describe a forward payload volume and nose header tanks — shown here as simple volumes.",
  },
  barrel: {
    name: "Ship barrel / tanks",
    blurb:
      "Same ~9 m stainless barrel language as the booster, split into methane and liquid-oxygen tanks with visible ring welds.",
  },
  tiles: {
    name: "Windward heat shield",
    blurb:
      "The windward side is tiled for reentry heating. This is a coarse hex grid on half the cylinder — not a production tile map or bond pattern.",
  },
  fwdFlaps: {
    name: "Forward flaps",
    pickPriority: 8,
    blurb:
      "Two forward flaps (canards) help control pitch and roll during the high-altitude belly-flop, as shown on flight vehicles.",
  },
  aftFlaps: {
    name: "Aft flaps",
    pickPriority: 8,
    blurb:
      "Larger aft flaps provide most of the aerodynamic lever arm during descent before the landing flip.",
  },
  sl: {
    name: "Sea-level Raptors",
    blurb:
      "Public engine counts put three gimbaling sea-level Raptors at the center of the aft bay.",
  },
  vac: {
    name: "Vacuum Raptors",
    frameTight: 1.12,
    frameBias: { x: 0.48, y: -0.12, z: 0.88 },
    blurb:
      "Three vacuum Raptors with larger expansion bells sit around the sea-level trio. Bell size here is a round teaching guess.",
  },
  raceway: {
    name: "Ship raceway",
    blurb:
      "A longitudinal raceway carries lines and cable trays. Geometry is a raised strip only.",
  },
});

function noseLathe(radius, height) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const y = t * height;
    const r = radius * Math.sqrt(Math.max(0, 1 - t * t));
    pts.push(new THREE.Vector2(r, y));
  }
  return new THREE.LatheGeometry(pts, 48);
}

export function createStarship({ withPad = true, forStack = false } = {}) {
  const mats = createMaterials();
  const g = new THREE.Group();
  const r = SCALE.diameter / 2;
  const barrelH = 38;
  const noseH = 14;
  const total = barrelH + noseH;

  const barrel = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, barrelH, 64), mats.stainless);
  body.position.y = barrelH / 2 + 2.2;
  barrel.add(body);
  addWeldRings(barrel, r, 3.4, barrelH + 1.4, SCALE.ring, mats.weld);
  tag(barrel, PARTS.barrel);
  g.add(barrel);

  const nose = new THREE.Group();
  const cone = new THREE.Mesh(noseLathe(r, noseH), mats.stainless);
  cone.position.y = barrelH + 2.2;
  nose.add(cone);
  const header = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 16), mats.stainlessDark);
  header.position.set(0, barrelH + noseH + 0.4, 0.2);
  nose.add(header);
  tag(nose, PARTS.nose);
  g.add(nose);

  const tiles = new THREE.Group();
  const hex = new THREE.CylinderGeometry(0.2, 0.2, 0.045, 6);
  hex.rotateX(Math.PI / 2);
  const tileMat = mats.tile.clone();
  tileMat.vertexColors = true;
  const tileMesh = new THREE.InstancedMesh(hex, tileMat, 2200);
  tileMesh.castShadow = true;
  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  let n = 0;
  const y0 = 3.6;
  const y1 = barrelH + noseH * 0.55;
  for (let y = y0; y < y1; y += 0.38) {
    const row = Math.round((y - y0) / 0.38);
    const localR = y > barrelH + 2.2 ? r * Math.sqrt(Math.max(0.12, 1 - ((y - barrelH - 2.2) / noseH) ** 2)) : r;
    for (let a = -Math.PI * 0.52; a <= Math.PI * 0.52; a += 0.092) {
      const aa = a + (row % 2) * 0.046;
      dummy.position.set(Math.sin(aa) * (localR + 0.04), y, Math.cos(aa) * (localR + 0.04));
      dummy.lookAt(dummy.position.clone().multiplyScalar(2).setY(y));
      dummy.updateMatrix();
      tileMesh.setMatrixAt(n, dummy.matrix);
      color.setHSL(0.06, 0.08, 0.1 + Math.random() * 0.07);
      tileMesh.setColorAt(n, color);
      n += 1;
      if (n >= tileMesh.count) break;
    }
    if (n >= tileMesh.count) break;
  }
  tileMesh.count = n;
  if (tileMesh.instanceColor) tileMesh.instanceColor.needsUpdate = true;
  tileMesh.instanceMatrix.needsUpdate = true;
  tiles.add(tileMesh);
  tag(tiles, PARTS.tiles);
  g.add(tiles);

  const fwd = new THREE.Group();
  for (const sign of [-1, 1]) {
    const flap = createFlap(mats, 3.4, 4.6, 0.16);
    flap.position.set(sign * (r + 0.05), barrelH + 1.2, 0.4);
    flap.rotation.y = sign * 0.12;
    flap.rotation.z = sign * -0.08;
    homeAndExplode(flap, new THREE.Vector3(sign * 3.2, 1.4, 0));
    fwd.add(flap);
  }
  tag(fwd, PARTS.fwdFlaps);
  g.add(fwd);

  const aft = new THREE.Group();
  for (const sign of [-1, 1]) {
    const flap = createFlap(mats, 5.4, 8.2, 0.2);
    flap.position.set(sign * (r - 0.2), 8.5, 1.1);
    flap.rotation.y = sign * -0.35;
    flap.rotation.z = sign * 0.55;
    homeAndExplode(flap, new THREE.Vector3(sign * 4.5, 0.6, 2.2));
    aft.add(flap);
  }
  tag(aft, PARTS.aftFlaps);
  g.add(aft);

  const sl = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const eng = createMiniRaptor(mats);
    eng.position.set(Math.cos(a) * 1.15, 1.05, Math.sin(a) * 1.15);
    homeAndExplode(eng, new THREE.Vector3(0, -2.2, 0));
    sl.add(eng);
  }
  tag(sl, PARTS.sl);
  g.add(sl);

  const vac = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + Math.PI / 3;
    const eng = createMiniRaptor(mats, { vacuum: true });
    eng.position.set(Math.cos(a) * 2.7, 1.45, Math.sin(a) * 2.7);
    homeAndExplode(eng, new THREE.Vector3(0, -2.8, 0));
    vac.add(eng);
  }
  tag(vac, PARTS.vac);
  vac.userData.frameFocus = vac.children[0] || vac;
  g.add(vac);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r, 2.4, 48), mats.soot);
  skirt.position.y = 1.2;
  tag(skirt, PARTS.barrel);
  g.add(skirt);

  const race = new THREE.Mesh(new THREE.BoxGeometry(0.95, barrelH * 0.78, 0.32), mats.stainlessDark);
  race.position.set(-(r + 0.12), barrelH * 0.52, -1.4);
  tag(race, PARTS.raceway);
  g.add(race);

  if (withPad && !forStack) {
    const pad = createPad(mats, 14, { deluge: true });
    pad.position.y = -0.4;
    g.add(pad);
  }

  enableShadows(g);
  g.userData.supportsExplode = true;
  g.userData.approxHeight = total + 2.2;
  return g;
}

export function shipHeight() {
  return 38 + 14 + 2.2;
}
