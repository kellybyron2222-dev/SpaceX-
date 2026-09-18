import * as THREE from "three";
import {
  SCALE,
  addWeldRings,
  createGridFin,
  createMaterials,
  createMiniRaptor,
  createPad,
  enableShadows,
  homeAndExplode,
  ids,
  tag,
  addPickProxy,
} from "./helpers.js";

const PARTS = ids("booster", {
  barrel: {
    name: "Stainless barrel / tanks",
    blurb:
      "Public descriptions put Super Heavy at about 9 m diameter and ~71 m tall, stacked from steel ring sections that form the methane and liquid-oxygen tanks.",
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
    pickPriority: 4,
    blurb:
      "Four grid fins near the top provide aerodynamic control during booster return. The waffle is a teaching lattice, not a production forging.",
  },
  engines: {
    name: "33-Raptor cluster",
    blurb:
      "Widely reported layout: 33 sea-level Raptors in three rings (3 + 10 + 20). Bells and spacing here are round-number approximations.",
  },
  octaweb: {
    name: "Aft engine mount",
    blurb:
      "The aft structure that carries the engine cluster (often nicknamed the octaweb in public commentary). Simplified as a dark thrust body and skirt.",
  },
  hardpoints: {
    name: "Catch hardpoints",
    pickPriority: 14,
    blurb:
      "Lift/catch pins near the top are the publicly shown interfaces for the tower arms. Blocky stand-ins only.",
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
  tag(barrel, PARTS.barrel);
  g.add(barrel);

  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 1.02, 3.2, 48), mats.soot);
  skirt.position.y = 1.7;
  tag(skirt, PARTS.octaweb);
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
  tag(staging, PARTS.staging);
  g.add(staging);

  const fins = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const fin = createGridFin(mats);
    fin.position.set(Math.cos(a) * (r + 0.35), h - 12, Math.sin(a) * (r + 0.35));
    fin.lookAt(new THREE.Vector3(Math.cos(a) * 20, h - 12, Math.sin(a) * 20));
    fin.rotateY(Math.PI);
    fins.add(fin);
  }
  tag(fins, PARTS.fins);
  g.add(fins);

  const race = new THREE.Mesh(new THREE.BoxGeometry(1.15, h * 0.72, 0.42), mats.stainlessDark);
  race.position.set(r + 0.15, h * 0.46, 0);
  tag(race, PARTS.raceway);
  g.add(race);

  const pins = new THREE.Group();
  for (const sign of [-1, 1]) {
    const pinY = h - 7.4;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 2.6, 16), mats.caution);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(0, pinY, sign * (r + 0.85));
    pins.add(pin);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.4), mats.darkSteel);
    pad.position.set(0, pinY, sign * (r + 0.18));
    pins.add(pad);
    addPickProxy(pins, new THREE.Vector3(0, pinY, sign * (r + 0.7)), 1.85, PARTS.hardpoints);
  }
  tag(pins, PARTS.hardpoints);
  g.add(pins);

  if (withPad && !forStack) {
    const pad = createPad(mats, 16, { deluge: true });
    pad.position.y = -0.55;
    g.add(pad);
  }

  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
