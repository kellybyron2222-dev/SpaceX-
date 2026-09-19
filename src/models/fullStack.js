import * as THREE from "three";
import { createStarship, shipHeight } from "./starship.js";
import { createSuperHeavy } from "./superHeavy.js";
import { SCALE, createMaterials, createPad, enableShadows, homeAndExplode, tag } from "./helpers.js";

export function createFullStack() {
  const mats = createMaterials();
  const g = new THREE.Group();

  const booster = createSuperHeavy({ withPad: false, forStack: true });
  tag(booster, {
    id: "fullstack.booster",
    name: "Super Heavy (first stage)",
    blurb:
      "The booster makes up most of the ~124 m stack height. Catch hardpoints and grid fins sit near the top; 33 engines sit on the pad.",
  });
  g.add(booster);

  const ship = createStarship({ withPad: false, forStack: true });
  ship.position.y = SCALE.boosterH - 0.4;
  homeAndExplode(ship, new THREE.Vector3(0, 26, 0));
  tag(ship, {
    id: "fullstack.ship",
    name: "Starship (upper stage)",
    blurb:
      "Upper stage stacked for hot staging. Exploded view lifts the ship off the booster the way a staging event separates the vehicles.",
  });
  g.add(ship);

  const pad = createPad(mats, 18, { deluge: true });
  pad.position.y = -0.55;
  g.add(pad);

  enableShadows(g);
  g.userData.supportsExplode = true;
  g.userData.supportsCutaway = true;
  g.userData.approxHeight = SCALE.boosterH - 0.4 + shipHeight();
  return g;
}
