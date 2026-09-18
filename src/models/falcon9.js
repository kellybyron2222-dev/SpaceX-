import * as THREE from "three";
import {
  addWeldRings,
  createGridFin,
  createMaterials,
  createPad,
  enableShadows,
  homeAndExplode,
  ids,
  latheBell,
  tag,
} from "./helpers.js";

const PARTS = ids("falcon9", {
  tanks: {
    name: "Falcon 9 tanks",
    frameTight: 1.45,
    frameBias: { x: 0.82, y: 0.12, z: 0.55 },
    blurb:
      "White-painted ~3.7 m barrels hold RP-1 and liquid oxygen. Ring spacing is a teaching cue, not a production weld map.",
  },
  engines: {
    name: "Merlin cluster",
    blurb:
      "Nine Merlin 1D engines in an octaweb: one center engine plus eight around it. A public Falcon 9 first-stage layout.",
  },
  legs: {
    name: "Landing legs",
    blurb:
      "Four folding legs deploy for drone-ship or landing-zone return. Geometry is a simple strut-and-foot stand-in.",
  },
  fins: {
    name: "Grid fins",
    pickPriority: 8,
    blurb:
      "Titanium grid fins steer the first stage through the atmosphere on the way back. Falcon 9 uses four; lattice is simplified.",
  },
  interstage: {
    name: "Interstage",
    frameTight: 1.25,
    frameBias: { x: 0.7, y: 0.08, z: 0.72 },
    blurb:
      "A composite interstage joins first and second stages and carries the public push-out / pneumatic staging hardware as a black band only.",
  },
  second: {
    name: "Second stage",
    frameTight: 1.42,
    frameBias: { x: 0.78, y: 0.1, z: 0.55 },
    blurb:
      "A single Merlin Vacuum engine and a shorter tank set. No RCS thruster detail.",
  },
  fairing: {
    name: "Payload fairing",
    blurb:
      "Two clamshell halves protect the payload. Public recovery program catches or fishes fairings — not modeled here.",
  },
  octaweb: {
    name: "Octaweb",
    blurb:
      "The thrust structure that carries nine Merlins. Name is the public nickname; this is a dark cylinder, not a forging.",
  },
});

const HEAVY = ids("falconheavy", {
  side: {
    name: "Side booster",
    pickPriority: 5,
    frameTight: 1.4,
    frameBias: { x: 0.9, y: 0.1, z: 0.45 },
    blurb:
      "Falcon Heavy flies two extra Falcon-class cores as side boosters. They separate and land separately from the center core. Teaching stand-ins, not unique Heavy CAD.",
  },
  center: {
    name: "Center core tanks",
    frameTight: 1.45,
    frameBias: { x: 0.82, y: 0.12, z: 0.55 },
    blurb:
      "The center core of a Falcon Heavy stack uses the same ~3.7 m RP-1/LOX barrels as Falcon 9 — this is not a solo Falcon 9.",
  },
});

function miniMerlin(mats, { vacuum = false } = {}) {
  const g = new THREE.Group();
  const exitR = vacuum ? 0.78 : 0.4;
  const len = vacuum ? 1.45 : 0.82;
  const outer = new THREE.Mesh(latheBell(exitR, 0.11, len, 22), mats.merlinBell);
  const inner = new THREE.Mesh(latheBell(exitR * 0.95, 0.1, len * 0.98, 22), mats.nozzleInner);
  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.35, 12), mats.darkSteel);
  chamber.position.y = 0.22;
  g.add(outer, inner, chamber);
  return g;
}

function stageBody(mats, radius, height, y0, part) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 48), mats.whitePaint);
  body.position.y = y0 + height / 2;
  g.add(body);
  addWeldRings(g, radius, y0 + 1.2, y0 + height - 0.8, 2.4, mats.weld);
  tag(g, part);
  return g;
}

function addLegs(parent, mats, radius, yAttach) {
  const legs = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = new THREE.Group();
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 12.5, 8), mats.whitePaint);
    strut.position.set(0, 6.2, 0);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 0.18, 16), mats.darkSteel);
    foot.position.set(0, 0.12, 0);
    const hip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), mats.darkSteel);
    hip.position.set(0, 12.4, 0);
    leg.add(strut, foot, hip);
    leg.position.set(Math.cos(a) * (radius + 0.15), yAttach, Math.sin(a) * (radius + 0.15));
    leg.rotation.z = Math.cos(a) * 0.18;
    leg.rotation.x = -Math.sin(a) * 0.18;
    homeAndExplode(leg, new THREE.Vector3(Math.cos(a) * 4.5, -1.2, Math.sin(a) * 4.5));
    legs.add(leg);
  }
  tag(legs, PARTS.legs);
  parent.add(legs);
}

function addFins(parent, mats, radius, y) {
  const fins = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const fin = createGridFin(mats, 2.2, 2.8, 0.16);
    fin.scale.setScalar(0.72);
    fin.position.set(Math.cos(a) * (radius + 0.28), y, Math.sin(a) * (radius + 0.28));
    fin.lookAt(new THREE.Vector3(Math.cos(a) * 20, y, Math.sin(a) * 20));
    fin.rotateY(Math.PI);
    fins.add(fin);
  }
  tag(fins, PARTS.fins);
  parent.add(fins);
}

function addFairing(parent, mats, radius, y0) {
  const fairing = new THREE.Group();
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    pts.push(new THREE.Vector2(radius * (t < 0.55 ? 1 : Math.cos(((t - 0.55) / 0.45) * Math.PI * 0.5)), t * 13.2));
  }
  const left = new THREE.Mesh(new THREE.LatheGeometry(pts, 22, 0, Math.PI), mats.whitePaint);
  const right = new THREE.Mesh(new THREE.LatheGeometry(pts, 22, Math.PI, Math.PI), mats.whitePaint);
  left.position.y = y0;
  right.position.y = y0;
  homeAndExplode(left, new THREE.Vector3(-3.4, 1.2, 0));
  homeAndExplode(right, new THREE.Vector3(3.4, 1.2, 0));
  fairing.add(left, right);
  tag(fairing, PARTS.fairing);
  parent.add(fairing);
}

function buildCore(mats, { sideBooster = false, tankPart = PARTS.tanks } = {}) {
  const g = new THREE.Group();
  const r = 3.66 / 2;

  const octa = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.05, 1.6, 32), mats.darkSteel);
  octa.position.y = 0.9;
  tag(octa, PARTS.octaweb);
  g.add(octa);

  const engines = new THREE.Group();
  const merlin = miniMerlin(mats);
  merlin.position.y = 0.45;
  engines.add(merlin);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const e = miniMerlin(mats);
    e.position.set(Math.cos(a) * 1.22, 0.45, Math.sin(a) * 1.22);
    engines.add(e);
  }
  tag(engines, PARTS.engines);
  g.add(engines);

  g.add(stageBody(mats, r, 38.5, 1.7, tankPart));
  addLegs(g, mats, r, 2.1);
  addFins(g, mats, r, 37.5);

  if (sideBooster) {
    const nose = new THREE.Mesh(new THREE.ConeGeometry(r, 4.4, 32), mats.blackPaint);
    nose.position.y = 42.4;
    g.add(nose);
    tag(g, HEAVY.side);
    const capH = 40.2;
    g.userData.coreHeight = capH;
    enableShadows(g);
    g.userData.supportsExplode = true;
    return g;
  }

  const inter = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 3.6, 40), mats.carbon);
  inter.position.y = 42.1;
  tag(inter, PARTS.interstage);
  g.add(inter);

  const second = new THREE.Group();
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 12.5, 40), mats.whitePaint);
  tank.position.y = 50.2;
  const vac = miniMerlin(mats, { vacuum: true });
  vac.position.y = 43.6;
  second.add(tank, vac);
  tag(second, PARTS.second);
  // Vac bell sits inside the carbon interstage; frame the white S2 tank instead of a black wall.
  second.userData.frameFocus = tank;
  g.add(second);

  addFairing(g, mats, r * 1.02, 56.4);
  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}

export function createFalcon9({ withPad = true } = {}) {
  const mats = createMaterials();
  const g = buildCore(mats);
  if (withPad) {
    const pad = createPad(mats, 12, { deluge: true, variant: "falcon" });
    pad.position.y = -0.55;
    g.add(pad);
  }
  return g;
}

export function createFalconHeavy() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const pitch = 3.72;
  const center = buildCore(mats, { tankPart: HEAVY.center });
  const left = buildCore(mats, { sideBooster: true, tankPart: HEAVY.side });
  const right = buildCore(mats, { sideBooster: true, tankPart: HEAVY.side });
  left.position.x = -pitch;
  right.position.x = pitch;
  homeAndExplode(left, new THREE.Vector3(-6.5, 0, 0));
  homeAndExplode(right, new THREE.Vector3(6.5, 0, 0));
  g.add(center, left, right);

  const pad = createPad(mats, 16, { deluge: true, variant: "falcon" });
  pad.position.y = -0.55;
  g.add(pad);
  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
