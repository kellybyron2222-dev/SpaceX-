import * as THREE from "three";
import { SCALE, createMaterials, createMiniRaptor, enableShadows, homeAndExplode, ids, tag } from "./helpers.js";

const PARTS = ids("mechazilla", {
  tower: {
    name: "Launch-and-catch tower",
    blurb:
      "A steel tower next to the pad carries the arms, elevators, and QD equipment. Height is a round public figure (~146 m class at Starbase), simplified to a box lattice.",
  },
  arms: {
    name: "Chopstick catch arms",
    blurb:
      "Two large mechanical arms (publicly nicknamed chopsticks) open around the vehicle to stack stages and catch returning boosters.",
  },
  pads: {
    name: "Inner catch pads",
    blurb:
      "The inner faces present pads toward the booster hardpoints. Shape and compliance layers are not modeled.",
  },
  carriage: {
    name: "Arm carriage",
    blurb:
      "A traveling carriage raises and lowers the arm pair on the tower. This is a block-and-rail stand-in.",
  },
  ghost: {
    name: "Ghost booster (context)",
    blurb:
      "A translucent 9 m-class cylinder shows where a Super Heavy would sit between the arms. Not a separate flight article.",
  },
});

function latticeBay(mats, w, d, h) {
  const g = new THREE.Group();
  const col = new THREE.BoxGeometry(0.7, h, 0.7);
  const corners = [
    [-w / 2, 0, -d / 2],
    [w / 2, 0, -d / 2],
    [-w / 2, 0, d / 2],
    [w / 2, 0, d / 2],
  ];
  for (const [x, , z] of corners) {
    const m = new THREE.Mesh(col, mats.darkSteel);
    m.position.set(x, h / 2, z);
    g.add(m);
  }
  const deck = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.35, d + 0.4), mats.stainlessDark);
  deck.position.y = h;
  g.add(deck);
  return g;
}

function makeArm(mats, side) {
  const arm = new THREE.Group();
  const beam = new THREE.Mesh(new THREE.BoxGeometry(22, 2.4, 3.6), mats.stainlessDark);
  beam.position.set(side * 11, 0, 0);
  arm.add(beam);
  const taper = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.6, 2.4), mats.stainless);
  taper.position.set(side * 20.2, -0.2, 0);
  arm.add(taper);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(8, 2.8, 0.45), mats.caution);
  pad.position.set(side * 14, 0, side * -1.9);
  tag(pad, PARTS.pads);
  arm.add(pad);
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.6, 0.48), mats.carbon);
    stripe.position.set(side * (10.5 + i * 1.8), 0, side * -1.9);
    arm.add(stripe);
  }
  const finger = new THREE.Mesh(new THREE.BoxGeometry(1.1, 4.4, 1.1), mats.darkSteel);
  finger.position.set(side * 22.4, -0.6, 0);
  arm.add(finger);
  return arm;
}

export function createMechazilla() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const towerH = 140;

  const tower = new THREE.Group();
  const w = 10;
  const d = 12;
  for (let i = 0; i < 7; i++) {
    const bay = latticeBay(mats, w, d, 18);
    bay.position.y = i * 18;
    tower.add(bay);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 14), mats.stainless);
  cap.position.y = towerH + 2;
  tower.add(cap);
  const peak = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.8, 8, 8), mats.caution);
  peak.position.y = towerH + 8;
  tower.add(peak);
  tag(tower, PARTS.tower);
  g.add(tower);

  const carriage = new THREE.Mesh(new THREE.BoxGeometry(14, 6, 16), mats.stainless);
  carriage.position.set(4.5, 78, 0);
  tag(carriage, PARTS.carriage);
  g.add(carriage);

  const arms = new THREE.Group();
  const left = makeArm(mats, -1);
  const right = makeArm(mats, 1);
  left.position.set(16, 78, 0);
  right.position.set(16, 78, 0);
  left.rotation.y = 0.08;
  right.rotation.y = -0.08;
  homeAndExplode(left, new THREE.Vector3(0, 0, -7));
  homeAndExplode(right, new THREE.Vector3(0, 0, 7));
  arms.add(left, right);
  tag(arms, PARTS.arms);
  g.add(arms);

  const ghost = new THREE.Group();
  const r = SCALE.diameter / 2;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 48, 40), mats.ghost);
  body.position.set(30, 52, 0);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r, 3, 32), mats.ghost);
  skirt.position.set(30, 26.5, 0);
  ghost.add(body, skirt);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const eng = createMiniRaptor(mats);
    eng.traverse((c) => {
      if (c.isMesh) c.material = mats.ghost;
    });
    eng.position.set(30 + Math.cos(a) * 3.4, 27.2, Math.sin(a) * 3.4);
    ghost.add(eng);
  }
  tag(ghost, PARTS.ghost);
  g.add(ghost);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(36, 36, 0.5, 48), mats.pad);
  ground.position.y = -0.25;
  ground.receiveShadow = true;
  g.add(ground);

  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
