import * as THREE from "three";
import { createMaterials, enableShadows, homeAndExplode, ids, latheBell, pipe, tag } from "./helpers.js";

const PARTS = ids("raptor", {
  nozzle: {
    name: "Regeneratively cooled nozzle",
    blurb:
      "A high-expansion bell dumps chamber exhaust. Public Raptor talks describe regenerative cooling in the jacket — shown as stacked manifold rings, not channel CAD.",
  },
  chamber: {
    name: "Main combustion chamber",
    blurb:
      "Methane and oxygen burn here after the preburners. Raptor is publicly described as a full-flow staged-combustion methane/LOX engine.",
  },
  injector: {
    name: "Injector face",
    blurb:
      "A flat teaching stand-in for the injector. Orifice patterns and element counts are not modeled.",
  },
  oxPre: {
    name: "Oxygen preburner",
    blurb:
      "One of two preburners in the public full-flow cycle: oxidizer-rich gas drives the ox turbopump.",
  },
  fuelPre: {
    name: "Fuel preburner",
    blurb:
      "Fuel-rich preburner on the methane side. Both turbines see a single gas species — the usual public explanation of full-flow.",
  },
  oxPump: {
    name: "Ox turbopump",
    blurb:
      "Approximate pump/turbine body on the liquid-oxygen circuit. Internal impellers are omitted on purpose.",
  },
  fuelPump: {
    name: "Fuel turbopump",
    blurb:
      "Approximate methane turbopump. Size and placement are layout guesses for a close-up demo.",
  },
  gimbal: {
    name: "Gimbal / mount stub",
    blurb:
      "A cardan-style stub lets the engine vector thrust. Actuator length and bearing design are not flight hardware.",
  },
  plumbing: {
    name: "Feed plumbing",
    blurb:
      "Simple pipes for methane (lighter) and oxygen (cooler tint). Diameters and bends are illustrative only.",
  },
  tvc: {
    name: "Thrust-vector actuators",
    blurb:
      "Two linear jacks stand in for TVC rams between the vehicle mount and the engine.",
  },
});

/** Textbook FFSC teaching layout (regen rings, two preburners, pumps, gimbal) — not a factory-floor look-alike. */
export function createRaptor() {
  const mats = createMaterials();
  const g = new THREE.Group();

  const nozzle = new THREE.Group();
  const outer = new THREE.Mesh(latheBell(0.68, 0.17, 1.22, 56), mats.nozzle);
  const inner = new THREE.Mesh(latheBell(0.65, 0.155, 1.2, 56), mats.nozzleInner);
  nozzle.add(outer, inner);
  for (let i = 0; i < 7; i++) {
    const t = (i + 1) / 8;
    const y = -t * 1.15;
    const rad = 0.17 + (0.68 - 0.17) * Math.pow(t, 0.62);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad + 0.012, 0.012, 8, 40), mats.copper);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    nozzle.add(ring);
  }
  const manifold = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 10, 32), mats.pipeFuel);
  manifold.rotation.x = Math.PI / 2;
  manifold.position.y = 0.02;
  nozzle.add(manifold);
  homeAndExplode(nozzle, new THREE.Vector3(0, -1.35, 0));
  tag(nozzle, PARTS.nozzle);
  g.add(nozzle);

  const chamber = new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 20), mats.copper);
  chamber.scale.set(1, 1.15, 1);
  chamber.position.y = 0.38;
  homeAndExplode(chamber, new THREE.Vector3(0, 0.55, 0));
  tag(chamber, PARTS.chamber);
  g.add(chamber);

  const injector = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 32), mats.darkSteel);
  injector.position.y = 0.72;
  homeAndExplode(injector, new THREE.Vector3(0, 0.85, 0));
  tag(injector, PARTS.injector);
  g.add(injector);

  const oxPre = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mats.pipeOx);
  oxPre.position.set(0.42, 1.05, 0.12);
  homeAndExplode(oxPre, new THREE.Vector3(0.55, 1.1, 0.15));
  tag(oxPre, PARTS.oxPre);
  g.add(oxPre);

  const fuelPre = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), mats.stainlessDark);
  fuelPre.position.set(-0.42, 1.05, 0.12);
  homeAndExplode(fuelPre, new THREE.Vector3(-0.55, 1.1, 0.15));
  tag(fuelPre, PARTS.fuelPre);
  g.add(fuelPre);

  const oxPump = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20), mats.pipeOx);
  oxPump.rotation.z = Math.PI / 2;
  oxPump.position.set(0.72, 0.78, -0.05);
  homeAndExplode(oxPump, new THREE.Vector3(1.15, 0.55, -0.2));
  tag(oxPump, PARTS.oxPump);
  g.add(oxPump);

  const fuelPump = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.42, 20), mats.stainless);
  fuelPump.rotation.z = Math.PI / 2;
  fuelPump.position.set(-0.72, 0.78, -0.05);
  homeAndExplode(fuelPump, new THREE.Vector3(-1.15, 0.55, -0.2));
  tag(fuelPump, PARTS.fuelPump);
  g.add(fuelPump);

  const gimbal = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mats.darkSteel);
  ball.position.y = 0.95;
  const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.55, 12), mats.darkSteel);
  fork.position.y = 1.28;
  const mount = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.7), mats.stainlessDark);
  mount.position.y = 1.58;
  gimbal.add(ball, fork, mount);
  homeAndExplode(gimbal, new THREE.Vector3(0, 1.35, 0));
  tag(gimbal, PARTS.gimbal);
  g.add(gimbal);

  const plumbing = new THREE.Group();
  plumbing.add(
    pipe(
      [new THREE.Vector3(0.72, 0.78, -0.05), new THREE.Vector3(0.55, 0.9, 0.05), new THREE.Vector3(0.42, 1.05, 0.12)],
      0.045,
      mats.pipeOx,
    ),
    pipe(
      [new THREE.Vector3(-0.72, 0.78, -0.05), new THREE.Vector3(-0.55, 0.9, 0.05), new THREE.Vector3(-0.42, 1.05, 0.12)],
      0.045,
      mats.pipeFuel,
    ),
    pipe(
      [new THREE.Vector3(0.42, 1.05, 0.12), new THREE.Vector3(0.22, 0.88, 0.08), new THREE.Vector3(0.08, 0.7, 0)],
      0.055,
      mats.pipeOx,
    ),
    pipe(
      [new THREE.Vector3(-0.42, 1.05, 0.12), new THREE.Vector3(-0.22, 0.88, 0.08), new THREE.Vector3(-0.08, 0.7, 0)],
      0.055,
      mats.pipeFuel,
    ),
    pipe(
      [new THREE.Vector3(0.9, 0.78, -0.05), new THREE.Vector3(1.05, 1.35, -0.05), new THREE.Vector3(0.2, 1.7, 0)],
      0.04,
      mats.pipeOx,
      20,
    ),
    pipe(
      [new THREE.Vector3(-0.9, 0.78, -0.05), new THREE.Vector3(-1.05, 1.35, -0.05), new THREE.Vector3(-0.2, 1.7, 0)],
      0.04,
      mats.pipeFuel,
      20,
    ),
  );
  homeAndExplode(plumbing, new THREE.Vector3(0, 0.4, 1.1));
  tag(plumbing, PARTS.plumbing);
  g.add(plumbing);

  const tvc = new THREE.Group();
  for (const sign of [-1, 1]) {
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 10), mats.caution);
    ram.position.set(sign * 0.38, 1.22, 0.28);
    ram.rotation.z = sign * -0.45;
    tvc.add(ram);
    const clevis = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), mats.darkSteel);
    clevis.position.set(sign * 0.18, 0.88, 0.18);
    tvc.add(clevis);
  }
  homeAndExplode(tvc, new THREE.Vector3(0, 0.7, 0.9));
  tag(tvc, PARTS.tvc);
  g.add(tvc);

  const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.08, 48), mats.pad);
  stand.position.y = -1.26;
  stand.receiveShadow = true;
  g.add(stand);

  enableShadows(g);
  tag(g, {
    id: "raptor.engine",
    name: "Raptor engine",
    blurb:
      "Methane/LOX full-flow staged-combustion engine. This assembly is a teaching approximation of nozzle, chamber, gimbal, and feed plumbing.",
  });
  g.userData.supportsExplode = true;
  return g;
}
