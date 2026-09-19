import * as THREE from "three";
import {
  SCALE,
  addPickProxy,
  addTeachingTanks,
  addWeldRings,
  createGridFin,
  createMaterials,
  createMiniRaptor,
  createPad,
  enableShadows,
  homeAndExplode,
  ids,
  markCutawayShell,
  tag,
} from "./helpers.js";

const PARTS = ids("booster", {
  barrel: {
    name: "Stainless barrel / tanks",
    blurb:
      "About 9 m across and ~72 m tall. Cutaway opens the steel so you can see a teaching methane tank above a liquid-oxygen tank — not a weld map.",
  },
  ch4: {
    name: "Booster methane tank",
    blurb:
      "The lighter volume is methane on this teaching cutaway. It sits above the common dome in the usual public diagram — not a measured tank.",
  },
  lox: {
    name: "Booster oxygen tank",
    blurb:
      "The cooler-tinted volume is liquid oxygen, nearer the engines. Height here is a teaching guess.",
  },
  dome: {
    name: "Booster common dome",
    blurb: "A simple dome stands in for the wall between the two propellants. Not a bulkhead drawing.",
  },
  raceway: {
    name: "Downcomer raceway",
    blurb:
      "A raised cable-and-propellant raceway runs the length of the booster. This is a simplified fairing, not a routing diagram.",
  },
  staging: {
    name: "Hot-staging ring",
    blurb:
      "A vented interstage lets the upper stage light while still stacked — the publicly discussed hot-staging method used on recent flight articles.",
  },
  fins: {
    name: "Grid fins",
    pickPriority: 8,
    blurb:
      "Grid fins near the top provide aerodynamic control during booster return. Public Starship V3 Super Heavy reporting is three fins (Falcon 9 still uses four). The waffle is a teaching lattice, not a production forging.",
  },
  engines: {
    name: "33-Raptor cluster",
    blurb:
      "Widely reported layout: 33 sea-level Raptors in three rings (3 + 10 + 20). Bells and spacing here are round-number approximations.",
  },
  octaweb: {
    name: "Aft engine mount",
    blurb:
      "The aft thrust puck / engine section that carries the 33-Raptor cluster. Octaweb is the Falcon 9 nine-engine nickname — not this Super Heavy part. Simplified as a dark thrust body and skirt.",
  },
  hardpoints: {
    name: "Catch hardpoints",
    pickPriority: 14,
    frameTight: 1.22,
    frameBias: { x: 0.95, y: 0.12, z: 0.35 },
    blurb:
      "Lift/catch pins near the top are the publicly shown interfaces for the tower arms. Gold lugs — not the grid-fin waffle.",
  },
});

export function createSuperHeavy({ withPad = true, forStack = false } = {}) {
  const mats = createMaterials();
  const g = new THREE.Group();
  const r = SCALE.diameter / 2;
  const h = SCALE.boosterH;

  const barrel = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h - 6, 64, 1), mats.stainless);
  body.position.y = 3 + (h - 6) / 2;
  barrel.add(body);
  addWeldRings(barrel, r, 4.2, h - 4.5, SCALE.ring, mats.weld);
  addTeachingTanks(barrel, {
    radius: r,
    yBottom: 5.2,
    yTop: h - 5.2,
    splitY: 38,
    mats,
    parts: PARTS,
  });
  tag(barrel, PARTS.barrel);
  markCutawayShell(barrel);
  g.add(barrel);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 1.02, 3.2, 48), mats.soot);
  skirt.position.y = 1.7;
  tag(skirt, PARTS.octaweb);
  markCutawayShell(skirt);
  g.add(skirt);

  const web = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, r * 0.95, 0.5, 48), mats.darkSteel);
  web.position.y = 0.35;
  tag(web, PARTS.octaweb);
  g.add(web);

  const engines = new THREE.Group();
  const rings = [
    { count: 3, radius: 1.15 },
    { count: 10, radius: 2.55 },
    { count: 20, radius: 3.72 },
  ];
  for (const ring of rings) {
    for (let i = 0; i < ring.count; i++) {
      const a = (i / ring.count) * Math.PI * 2 + ring.count * 0.01;
      const eng = createMiniRaptor(mats);
      eng.position.set(Math.cos(a) * ring.radius, 0.55, Math.sin(a) * ring.radius);
      homeAndExplode(eng, new THREE.Vector3(0, -2.4 - ring.radius * 0.15, 0));
      engines.add(eng);
    }
  }
  tag(engines, PARTS.engines);
  g.add(engines);

  const staging = new THREE.Group();
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 2.4, 48), mats.darkSteel);
  band.position.y = h - 1.1;
  staging.add(band);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const vent = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.3, 0.18), mats.carbon);
    vent.position.set(Math.cos(a) * (r + 0.12), h - 1.1, Math.sin(a) * (r + 0.12));
    vent.lookAt(0, h - 1.1, 0);
    staging.add(vent);
  }
  homeAndExplode(staging, new THREE.Vector3(0, 4.8, 0));
  tag(staging, PARTS.staging);
  g.add(staging);

  const fins = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = createGridFin(mats);
    fin.position.set(Math.cos(a) * (r + 0.35), h - 12, Math.sin(a) * (r + 0.35));
    fin.lookAt(new THREE.Vector3(Math.cos(a) * 20, h - 12, Math.sin(a) * 20));
    fin.rotateY(Math.PI);
    homeAndExplode(fin, new THREE.Vector3(Math.cos(a) * 5.4, 1.1, Math.sin(a) * 5.4));
    fins.add(fin);
  }
  tag(fins, PARTS.fins);
  g.add(fins);

  const race = new THREE.Mesh(new THREE.BoxGeometry(1.15, h * 0.72, 0.42), mats.stainlessDark);
  race.position.set(r + 0.15, h * 0.46, 0);
  homeAndExplode(race, new THREE.Vector3(2.8, 0, 0));
  tag(race, PARTS.raceway);
  g.add(race);

  const pins = new THREE.Group();
  let pinFocus = null;
  for (const sign of [-1, 1]) {
    const pinY = h - 7.4;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.62, 3.6, 20), mats.caution);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(0, pinY, sign * (r + 1.15));
    pins.add(pin);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.14, 8, 22), mats.caution);
    collar.position.set(0, pinY, sign * (r + 0.55));
    pins.add(collar);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.1, 0.55), mats.darkSteel);
    pad.position.set(0, pinY, sign * (r + 0.22));
    pins.add(pad);
    addPickProxy(pins, new THREE.Vector3(0, pinY, sign * (r + 0.9)), 2.15, PARTS.hardpoints);
    if (!pinFocus) pinFocus = pin;
  }
  homeAndExplode(pins, new THREE.Vector3(0, 2.4, 0));
  tag(pins, PARTS.hardpoints);
  pins.userData.frameFocus = pinFocus;
  g.add(pins);

  if (withPad && !forStack) {
    const pad = createPad(mats, 16, { deluge: true });
    pad.position.y = -0.55;
    g.add(pad);
  }

  enableShadows(g);
  g.userData.supportsExplode = true;
  g.userData.supportsCutaway = true;
  return g;
}
