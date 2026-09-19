import * as THREE from "three";
import { createMaterials, enableShadows, homeAndExplode, ids, tag } from "./helpers.js";
import { createSuperHeavy } from "./superHeavy.js";

const PARTS = ids("mechazilla", {
  tower: {
    name: "Launch-and-catch tower",
    frameTight: 1.42,
    frameBias: { x: 0.72, y: 0.08, z: 0.88 },
    blurb:
      "A steel tower next to the pad carries the arms, elevators, and QD equipment. Height is a round public figure (~146 m class at Starbase), simplified to a box lattice.",
  },
  arms: {
    name: "Chopstick catch arms",
    pickPriority: 8,
    frameTight: 1.85,
    frameBias: { x: 0.55, y: 0.42, z: 1.05 },
    blurb:
      "Two large mechanical arms (publicly nicknamed chopsticks) open around the vehicle to stack stages and catch returning boosters.",
  },
  pads: {
    name: "Inner catch pads",
    pickPriority: 10,
    frameTight: 1.15,
    frameBias: { x: 0.7, y: 0.2, z: 0.55 },
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
    frameTight: 1.5,
    frameBias: { x: 0.85, y: 0.12, z: 0.7 },
    blurb:
      "A translucent Super Heavy stand-in (~72 m × 9 m, 33 Raptors / 3 fins) sits between the arms. Not a separate flight article.",
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

/** One chopstick: beam along +X, inner catch pad faces the vehicle (z = 0). */
function makeArm(mats, side) {
  const arm = new THREE.Group();
  const beamLen = 26;
  const beam = new THREE.Mesh(new THREE.BoxGeometry(beamLen, 2.6, 3.2), mats.stainlessDark);
  beam.position.set(beamLen / 2, 0, 0);
  arm.add(beam);
  const taper = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.7, 2.2), mats.stainless);
  taper.position.set(beamLen - 2.4, -0.2, 0);
  arm.add(taper);
  const pad = new THREE.Mesh(new THREE.BoxGeometry(9, 3.0, 0.5), mats.caution);
  pad.position.set(16.5, 0, side * -1.85);
  tag(pad, PARTS.pads);
  arm.add(pad);
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.35, 2.8, 0.52), mats.carbon);
    stripe.position.set(12.2 + i * 2.1, 0, side * -1.85);
    arm.add(stripe);
  }
  const finger = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4.6, 1.2), mats.darkSteel);
  finger.position.set(beamLen + 0.4, -0.5, 0);
  arm.add(finger);
  return arm;
}

function ghostSuperHeavy(mats, x) {
  const ghost = createSuperHeavy({ withPad: false, forStack: true });
  ghost.position.x = x;
  ghost.traverse((child) => {
    delete child.userData.explodeOffset;
    delete child.userData.home;
    child.userData.part = PARTS.ghost;
    if (child.isMesh && child.material && !child.userData.pickProxy) {
      child.material = mats.ghost;
    }
  });
  tag(ghost, PARTS.ghost);
  return ghost;
}

export function createMechazilla() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const towerH = 146;
  const bayH = 18;
  const bays = 8;
  const vehicleX = 22;
  const catchY = 65;
  const armZ = 7.2;

  const tower = new THREE.Group();
  const w = 10;
  const d = 12;
  for (let i = 0; i < bays; i++) {
    const bay = latticeBay(mats, w, d, bayH);
    bay.position.y = i * bayH;
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

  const carriage = new THREE.Mesh(new THREE.BoxGeometry(7, 6.5, 16), mats.stainless);
  carriage.position.set(4.2, catchY, 0);
  tag(carriage, PARTS.carriage);
  g.add(carriage);

  const arms = new THREE.Group();
  const left = makeArm(mats, -1);
  const right = makeArm(mats, 1);
  left.position.set(5.5, catchY, -armZ);
  right.position.set(5.5, catchY, armZ);
  homeAndExplode(left, new THREE.Vector3(0, 0, -6));
  homeAndExplode(right, new THREE.Vector3(0, 0, 6));
  arms.add(left, right);
  tag(arms, PARTS.arms);
  g.add(arms);

  g.add(ghostSuperHeavy(mats, vehicleX));

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(42, 42, 0.5, 48), mats.pad);
  ground.position.y = -0.25;
  ground.receiveShadow = true;
  g.add(ground);

  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
