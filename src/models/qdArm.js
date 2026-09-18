import * as THREE from "three";
import { SCALE, createMaterials, enableShadows, homeAndExplode, ids, pipe, tag } from "./helpers.js";

const PARTS = ids("qd", {
  tower: {
    name: "Tower stub",
    blurb:
      "The QD lives on the same launch tower as the chopsticks. Only a short bay is shown so the arm remains readable.",
  },
  arm: {
    name: "Quick-disconnect swing arm",
    blurb:
      "A swing arm carries propellant and services out to the stacked vehicle. Hinge location and reach are layout guesses.",
  },
  plate: {
    name: "QD plate / umbilicals",
    blurb:
      "The interface plate is where ground lines meet ship/booster QD ports. Port counts and genders are not drawn.",
  },
  lines: {
    name: "Service lines",
    blurb:
      "Simple tubes stand in for methane, oxygen, and miscellaneous services. Colors are a teaching cue, not a P&ID.",
  },
  vehicle: {
    name: "Vehicle interface (ghost)",
    blurb:
      "A translucent 9 m barrel shows where the arm would meet a stacked Starship. No flight QD socket is implied.",
  },
});

export function createQdArm() {
  const mats = createMaterials();
  const g = new THREE.Group();
  const r = SCALE.diameter / 2;

  const tower = new THREE.Group();
  const column = new THREE.Mesh(new THREE.BoxGeometry(8, 52, 9), mats.darkSteel);
  column.position.set(0, 26, 0);
  const decks = [10, 22, 34, 46];
  tower.add(column);
  for (const y of decks) {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(11, 0.4, 12), mats.stainlessDark);
    deck.position.set(0, y, 0);
    tower.add(deck);
  }
  tag(tower, PARTS.tower);
  g.add(tower);

  const arm = new THREE.Group();
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.2, 20), mats.caution);
  hinge.rotation.x = Math.PI / 2;
  hinge.position.set(4.2, 28, 0);
  const boom = new THREE.Mesh(new THREE.BoxGeometry(18, 1.4, 2.2), mats.stainless);
  boom.position.set(13.2, 28, 0);
  const brace = new THREE.Mesh(new THREE.BoxGeometry(14, 0.35, 0.35), mats.stainlessDark);
  brace.position.set(12, 30.2, 0);
  brace.rotation.z = -0.16;
  arm.add(hinge, boom, brace);
  homeAndExplode(arm, new THREE.Vector3(0, 4.5, 0));
  tag(arm, PARTS.arm);
  g.add(arm);

  const plate = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.45, 4.4, 3.6), mats.darkSteel);
  face.position.set(22.4, 28, 0);
  plate.add(face);
  for (let i = 0; i < 6; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), i < 3 ? mats.pipeOx : mats.pipeFuel);
    port.rotation.z = Math.PI / 2;
    port.position.set(22.7, 26.7 + row * 1.1, -0.8 + col * 1.6);
    plate.add(port);
  }
  homeAndExplode(plate, new THREE.Vector3(1.8, 0, 0));
  tag(plate, PARTS.plate);
  g.add(plate);

  const lines = new THREE.Group();
  lines.add(
    pipe(
      [new THREE.Vector3(4.2, 24, 1.2), new THREE.Vector3(12, 26.5, 1.0), new THREE.Vector3(22.2, 27.2, 0.8)],
      0.09,
      mats.pipeOx,
      28,
    ),
    pipe(
      [new THREE.Vector3(4.2, 24, -1.2), new THREE.Vector3(12, 26.5, -1.0), new THREE.Vector3(22.2, 27.2, -0.8)],
      0.09,
      mats.pipeFuel,
      28,
    ),
    pipe(
      [new THREE.Vector3(4.2, 25.2, 0), new THREE.Vector3(13, 29.5, 0.2), new THREE.Vector3(22.2, 29.2, 0)],
      0.05,
      mats.caution,
      24,
    ),
  );
  tag(lines, PARTS.lines);
  g.add(lines);

  const vehicle = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 28, 40), mats.ghost);
  barrel.position.set(28.2, 26, 0);
  const weld = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.04, 8, 40), mats.ghost);
  weld.rotation.x = Math.PI / 2;
  weld.position.set(28.2, 26, 0);
  vehicle.add(barrel, weld);
  tag(vehicle, PARTS.vehicle);
  g.add(vehicle);

  const ground = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 0.4, 48), mats.pad);
  ground.position.y = -0.2;
  ground.receiveShadow = true;
  g.add(ground);

  enableShadows(g);
  g.userData.supportsExplode = true;
  return g;
}
