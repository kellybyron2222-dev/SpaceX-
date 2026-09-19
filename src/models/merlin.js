import * as THREE from "three";
import { createMaterials, enableShadows, homeAndExplode, ids, latheBell, pipe, tag } from "./helpers.js";

const PARTS = ids("merlin", {
  nozzle: {
    name: "Merlin nozzle",
    blurb:
      "A smaller bell than Raptor. Merlin is a gas-generator RP-1/LOX engine. Size here is a teaching guess, not a measured expansion ratio.",
  },
  chamber: {
    name: "Merlin chamber",
    blurb: "RP-1 and liquid oxygen burn here. Public Merlin 1D talks call this a gas-generator cycle — not full-flow.",
  },
  gasGen: {
    name: "Gas generator",
    blurb:
      "One can. Merlin burns a little propellant here to spin the turbopump, then dumps that gas. Raptor has two preburners instead — that is the cycle difference.",
  },
  pump: {
    name: "Turbopump",
    blurb: "One pump package for RP-1 and oxygen. Internals are omitted on purpose.",
  },
  gimbal: {
    name: "Gimbal / mount",
    blurb: "A stub so the engine can vector. Not actuator CAD.",
  },
  plumbing: {
    name: "Feed plumbing",
    blurb: "RP-1 (warmer tint) and oxygen (cooler tint). Bends are illustrative.",
  },
});

/** Textbook gas-generator Merlin — one gas generator, not two preburners. Not CAD. */
export function createMerlin() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const kero = new THREE.MeshPhysicalMaterial({
    color: 0xb8894a,
    metalness: 0.72,
    roughness: 0.32,
  });

  const nozzle = new THREE.Group();
  const outer = new THREE.Mesh(latheBell(0.46, 0.13, 0.92, 40), mats.merlinBell);
  const inner = new THREE.Mesh(latheBell(0.44, 0.12, 0.9, 40), mats.nozzleInner);
  nozzle.add(outer, inner);
  homeAndExplode(nozzle, new THREE.Vector3(0, -1.15, 0));
  tag(nozzle, PARTS.nozzle);
  g.add(nozzle);

  const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.42, 20), mats.darkSteel);
  chamber.position.y = 0.32;
  homeAndExplode(chamber, new THREE.Vector3(0, 0.45, 0));
  tag(chamber, PARTS.chamber);
  g.add(chamber);

  const gasGen = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.38, 14), kero);
  gasGen.rotation.z = Math.PI / 2;
  gasGen.position.set(0.48, 0.72, 0.08);
  homeAndExplode(gasGen, new THREE.Vector3(0.85, 0.7, 0.2));
  tag(gasGen, PARTS.gasGen);
  g.add(gasGen);

  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.4, 16), mats.stainlessDark);
  pump.rotation.z = Math.PI / 2;
  pump.position.set(-0.52, 0.62, -0.04);
  homeAndExplode(pump, new THREE.Vector3(-0.95, 0.45, -0.15));
  tag(pump, PARTS.pump);
  g.add(pump);

  const gimbal = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), mats.darkSteel);
  ball.position.y = 0.72;
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.42, 10), mats.darkSteel);
  fork.position.y = 0.98;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.1, 0.55), mats.stainlessDark);
  mount.position.y = 1.22;
  gimbal.add(ball, fork, mount);
  homeAndExplode(gimbal, new THREE.Vector3(0, 1.05, 0));
  tag(gimbal, PARTS.gimbal);
  g.add(gimbal);

  const plumbing = new THREE.Group();
  plumbing.add(
    pipe(
      [new THREE.Vector3(0.48, 0.72, 0.08), new THREE.Vector3(0.28, 0.55, 0.04), new THREE.Vector3(0.08, 0.38, 0)],
      0.04,
      kero,
    ),
    pipe(
      [new THREE.Vector3(-0.52, 0.62, -0.04), new THREE.Vector3(-0.28, 0.5, 0), new THREE.Vector3(-0.06, 0.36, 0)],
      0.045,
      mats.pipeOx,
    ),
  );
  homeAndExplode(plumbing, new THREE.Vector3(0, 0.25, 0.85));
  tag(plumbing, PARTS.plumbing);
  g.add(plumbing);

  enableShadows(g);
  tag(g, {
    id: "merlin.engine",
    name: "Merlin 1D",
    blurb:
      "RP-1 and liquid oxygen, gas-generator cycle. One gas generator — not Raptor’s two preburners. Teaching shapes, not CAD.",
  });
  g.userData.supportsExplode = true;
  return g;
}
