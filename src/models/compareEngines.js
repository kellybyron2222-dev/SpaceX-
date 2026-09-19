import * as THREE from "three";
import { createMaterials, enableShadows, tag } from "./helpers.js";
import { createRaptor } from "./raptor.js";
import { createMerlin } from "./merlin.js";

/** Same camera, two cycles — methane full-flow next to RP-1 gas-generator. Not CAD. */
export function createCompareEngines() {
  const mats = createMaterials();
  const g = new THREE.Group();

  const raptor = createRaptor();
  raptor.position.x = -2.35;
  raptor.traverse((child) => {
    if (child.userData.part?.id === "raptor.engine") {
      child.userData.part = {
        ...child.userData.part,
        name: "Raptor (methane)",
        blurb:
          "Methane and liquid oxygen. Two preburners — full-flow. The left engine. Teaching sketch, not a bill of materials.",
      };
    }
    // Shared deck below; hide the solo Raptor stand so both engines share one floor.
    if (child.isMesh && child.parent === raptor && !child.userData.part) {
      child.visible = false;
    }
  });
  g.add(raptor);

  const merlin = createMerlin();
  merlin.position.set(2.35, -0.28, 0);
  g.add(merlin);

  const deck = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.8, 0.1, 48), mats.pad);
  deck.position.y = -1.32;
  deck.receiveShadow = true;
  tag(deck, {
    id: "compare.deck",
    name: "Compare stand",
    blurb: "Same camera, two engines. Left is Raptor. Right is Merlin. Not a test-stand drawing.",
  });
  g.add(deck);

  enableShadows(g);
  g.userData.supportsExplode = true;
  g.userData.frameTight = 1.18;
  g.userData.frameBias = { x: 0.15, y: 0.22, z: 1.15 };
  return g;
}
