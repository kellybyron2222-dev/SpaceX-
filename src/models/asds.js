import * as THREE from "three";
import { createMaterials, enableShadows, ids, tag } from "./helpers.js";

const PARTS = ids("asds", {
  hull: {
    name: "Droneship hull",
    blurb:
      "Autonomous spaceport drone ships are converted deck barges, publicly in the ~90 m class. This hull is a rounded box, not a lines plan.",
  },
  deck: {
    name: "Landing deck",
    blurb:
      "A marked landing zone receives Falcon first stages. Circle and octagon are teaching marks, not a certified target drawing.",
  },
  house: {
    name: "Deckhouse / systems",
    blurb:
      "The house end holds station-keeping, power, and recovery gear. Interior systems are omitted.",
  },
  octagon: {
    name: "Octaweb target",
    blurb:
      "Public droneship decks show a painted octagon where the booster octaweb should settle. Paint only.",
  },
});

export function createAsds() {
  const mats = createMaterials();
  const g = new THREE.Group();

  const hull = new THREE.Mesh(new THREE.BoxGeometry(90, 6.2, 40), mats.darkSteel);
  hull.position.y = 3.1;
  tag(hull, PARTS.hull);
  g.add(hull);

  const belt = new THREE.Mesh(new THREE.BoxGeometry(90.4, 1.1, 40.4), mats.caution);
  belt.position.y = 6.0;
  g.add(belt);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(88, 0.25, 38), mats.deck);
  deck.position.y = 6.35;
  tag(deck, PARTS.deck);
  g.add(deck);

  const circle = new THREE.Mesh(new THREE.TorusGeometry(9.5, 0.12, 8, 48), mats.whitePaint);
  circle.rotation.x = Math.PI / 2;
  circle.position.set(-8, 6.5, 0);
  g.add(circle);

  const oct = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.2, 0.08, 8), mats.caution);
  oct.position.set(-8, 6.48, 0);
  tag(oct, PARTS.octagon);
  g.add(oct);

  const house = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(18, 8.5, 16), mats.whitePaint);
  block.position.set(32, 10.5, 0);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.4, 16.4), mats.darkSteel);
  roof.position.set(32, 14.8, 0);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 12, 8), mats.stainlessDark);
  mast.position.set(38, 20, 4);
  house.add(block, roof, mast);
  tag(house, PARTS.house);
  g.add(house);

  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(160, 48),
    new THREE.MeshStandardMaterial({ color: 0x0b1c28, metalness: 0.35, roughness: 0.45 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = 0.02;
  sea.receiveShadow = true;
  g.add(sea);

  enableShadows(g);
  g.userData.supportsExplode = false;
  return g;
}
