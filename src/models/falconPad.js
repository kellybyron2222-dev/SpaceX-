import * as THREE from "three";
import { createFalcon9 } from "./falcon9.js";
import { createMaterials, createPad, enableShadows, homeAndExplode, ids, tag } from "./helpers.js";

const PARTS = ids("falconpad", {
  strongback: {
    name: "Transporter-erector / strongback",
    blurb:
      "A hinged strongback raises Falcon 9 vertical and holds it at the pad. This lattice is a teaching stand-in for LC-39A / SLC-40 class ground support.",
  },
  caa: {
    name: "Crew access arm",
    blurb:
      "At LC-39A a crew access arm reaches a Dragon hatch. The arm here is a simple boom — not the flight-proven CAA mechanism.",
  },
  te: {
    name: "Hold-down / TE deck",
    blurb:
      "The transporter-erector deck and hold-down posts keep the vehicle until T-0. Block geometry only.",
  },
});

export function createFalconPad() {
  const mats = createMaterials();
  const g = new THREE.Group();

  const pad = createPad(mats, 22, { deluge: true, variant: "falcon" });
  pad.position.y = -0.55;
  g.add(pad);

  const trench = new THREE.Mesh(new THREE.BoxGeometry(14, 1.2, 36), mats.carbon);
  trench.position.set(0, -0.9, -16);
  g.add(trench);

  const te = new THREE.Group();
  const deck = new THREE.Mesh(new THREE.BoxGeometry(8, 1.1, 12), mats.darkSteel);
  deck.position.set(-7.5, 0.6, 0);
  const posts = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.2, 5.5), mats.stainlessDark);
  posts.position.set(0, 1.2, 0);
  te.add(deck, posts);
  tag(te, PARTS.te);
  g.add(te);

  const strong = new THREE.Group();
  const mast = new THREE.Mesh(new THREE.BoxGeometry(3.2, 62, 4.4), mats.darkSteel);
  mast.position.set(-9.2, 31, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 5.2), mats.stainless);
  head.position.set(-9.2, 63, 0);
  const clamp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.4, 3.6), mats.caution);
  clamp.position.set(-6.4, 48, 0);
  strong.add(mast, head, clamp);
  for (let i = 0; i < 6; i++) {
    const bay = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.25, 4.6), mats.stainlessDark);
    bay.position.set(-9.2, 8 + i * 9, 0);
    strong.add(bay);
  }
  homeAndExplode(strong, new THREE.Vector3(-8, 0, 0));
  tag(strong, PARTS.strongback);
  g.add(strong);

  const caa = new THREE.Group();
  const boom = new THREE.Mesh(new THREE.BoxGeometry(14, 1.1, 2.4), mats.whitePaint);
  boom.position.set(2, 22.5, 4.6);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.6, 2.8), mats.whitePaint);
  cab.position.set(8.2, 22.8, 4.6);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.6, 14), mats.caution);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(-5.2, 22.5, 4.6);
  caa.add(boom, cab, hinge);
  homeAndExplode(caa, new THREE.Vector3(0, 0, 5));
  tag(caa, PARTS.caa);
  g.add(caa);

  const vehicle = createFalcon9({ withPad: false });
  vehicle.position.set(0, 0, 0);
  vehicle.traverse((c) => {
    if (c.isMesh && c.material && !c.material.transparent) {
      const m = c.material.clone();
      m.transparent = true;
      m.opacity = 0.28;
      m.depthWrite = false;
      c.material = m;
    }
  });
  tag(vehicle, {
    id: "falconpad.vehicle",
    name: "Falcon 9 (ghost)",
    blurb: "Translucent vehicle shows how the strongback and crew arm meet a stacked Falcon 9.",
  });
  g.add(vehicle);

  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
