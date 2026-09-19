import { createFullStack } from "./fullStack.js";
import { createSuperHeavy } from "./superHeavy.js";
import { createStarship } from "./starship.js";
import { createRaptor } from "./raptor.js";
import { createMechazilla } from "./mechazilla.js";
import { createQdArm } from "./qdArm.js";
import { createTilePanel } from "./tilePanel.js";
import { createFalcon9, createFalconHeavy } from "./falcon9.js";
import { createFalconPad } from "./falconPad.js";
import { createAsds } from "./asds.js";
import { createCompareEngines } from "./compareEngines.js";
import { SCALE } from "./helpers.js";

export const SCENES = [
  {
    id: "fullstack",
    name: "Full stack",
    summary: "Booster + ship, ~124 m",
    height: "~124 m",
    diameter: "~9 m",
    explodeHint: "Floats ship, tanks, engines, and flaps apart",
    family: "starship",
    build: createFullStack,
  },
  {
    id: "booster",
    name: "Super Heavy",
    summary: "33-Raptor booster",
    height: "~72 m",
    diameter: "~9 m",
    explodeHint: "Drops the engines and spreads the fins",
    family: "starship",
    build: () => createSuperHeavy(),
  },
  {
    id: "starship",
    name: "Starship",
    summary: "Upper stage + flaps",
    height: "~52 m",
    diameter: "~9 m",
    explodeHint: "Spreads flaps, engines, and tank volumes",
    family: "starship",
    build: () => createStarship(),
  },
  {
    id: "raptor",
    name: "Raptor engine",
    summary: "Nozzle, gimbal, plumbing",
    height: "~3 m class",
    diameter: "~1.3 m exit (SL)",
    explodeHint: "Explodes engine subsystems",
    family: "starship",
    build: createRaptor,
  },
  {
    id: "mechazilla",
    name: "Mechazilla",
    summary: "Tower + catch arms",
    expand: "Starship launch-and-catch tower (Mechazilla) with chopsticks",
    height: "~146 m class tower",
    diameter: "9 m vehicle bay",
    explodeHint: "Opens the chopsticks",
    family: "starship",
    build: createMechazilla,
  },
  {
    id: "qd",
    name: "QD arm",
    summary: "Quick-disconnect swing arm",
    expand: "Quick-disconnect (QD) swing arm — pad propellant and services",
    height: "tower bay",
    diameter: "~9 m vehicle",
    explodeHint: "Lifts the swing arm",
    family: "starship",
    build: createQdArm,
  },
  {
    id: "tiles",
    name: "Heat-shield panel",
    summary: "Curved tile grid",
    height: "panel section",
    diameter: `${SCALE.diameter} m barrel`,
    explodeHint: "Lifts tiles off the carrier",
    family: "starship",
    build: createTilePanel,
  },
  {
    id: "falcon9",
    name: "Falcon 9",
    summary: "Merlin-9 + legs + fairing",
    height: "~70 m",
    diameter: "~3.7 m",
    explodeHint: "Opens fairing and legs",
    family: "falcon",
    build: () => createFalcon9(),
  },
  {
    id: "falcon-heavy",
    name: "Falcon Heavy",
    summary: "Triple-core Falcon",
    height: "~70 m",
    diameter: "~12 m stack",
    explodeHint: "Spreads side boosters",
    family: "falcon",
    build: createFalconHeavy,
  },
  {
    id: "falcon-pad",
    name: "Falcon pad",
    summary: "Strongback, CAA, deluge",
    height: "pad GSE",
    diameter: "LC-39A class",
    explodeHint: "Pulls strongback and CAA",
    family: "falcon",
    build: createFalconPad,
  },
  {
    id: "asds",
    name: "ASDS droneship",
    summary: "Autonomous landing barge",
    expand: "Autonomous spaceport drone ship — Falcon first-stage landing barge",
    height: "deck ~6 m",
    diameter: "~90 × 50 m",
    explodeHint: "No explode on this scene",
    family: "falcon",
    build: createAsds,
  },
  {
    id: "compare-engines",
    name: "Raptor vs Merlin",
    summary: "Same camera, two cycles",
    expand: "Raptor (methane, full-flow) beside Merlin (RP-1, gas-generator). Teaching sketch, not CAD.",
    height: "~3 m class",
    diameter: "two bells, one view",
    explodeHint: "Floats both engines’ pumps and bells apart",
    family: "starship",
    build: createCompareEngines,
  },
];

export function sceneById(id) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
