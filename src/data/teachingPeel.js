/** Teaching peel — Explore isolate / explode / cutaway. Not CAD, not a parts catalog. */

export const TEACH_LABELS = {
  "fullstack.ship": "Starship — the upper stage",
  "fullstack.booster": "Super Heavy — the booster",
  "booster.barrel": "Booster tanks",
  "booster.ch4": "Methane tank",
  "booster.lox": "Oxygen tank",
  "booster.dome": "Common dome",
  "booster.engines": "The 33 engines",
  "booster.octaweb": "Engine skirt",
  "booster.fins": "Grid fins",
  "booster.staging": "Hot-staging ring",
  "booster.hardpoints": "Catch pins",
  "booster.raceway": "Downcomer raceway",
  "starship.barrel": "Ship tanks",
  "starship.ch4": "Ship methane tank",
  "starship.lox": "Ship oxygen tank",
  "starship.dome": "Ship common dome",
  "starship.ch4Header": "Methane header tank",
  "starship.loxHeader": "Oxygen header tank",
  "starship.nose": "Nose and payload bay",
  "starship.tiles": "Heat-shield tiles",
  "starship.fwdFlaps": "Front flaps",
  "starship.aftFlaps": "Back flaps",
  "starship.sl": "Sea-level engines",
  "starship.vac": "Vacuum engines",
  "starship.raceway": "Ship raceway",
  "mechazilla.arms": "Chopsticks — tower arms",
  "mechazilla.tower": "The catch tower",
  "mechazilla.pads": "Catch pads",
  "mechazilla.carriage": "Arm carriage",
  "mechazilla.ghost": "Booster (for scale)",
  "raptor.engine": "Raptor engine",
  "raptor.nozzle": "Nozzle",
  "raptor.chamber": "Combustion chamber",
  "raptor.injector": "Injector face",
  "raptor.oxPre": "Oxygen preburner",
  "raptor.fuelPre": "Fuel preburner",
  "raptor.oxPump": "Oxygen pump",
  "raptor.fuelPump": "Fuel pump",
  "raptor.gimbal": "Gimbal",
  "raptor.plumbing": "Feed pipes",
  "raptor.tvc": "Steering rams",
  "pad.olm": "Launch mount",
  "pad.deluge": "Water deluge",
  "scale.person": "A person — about 1.8 m",
  "scale.falcon": "Falcon 9 — for scale",
};

export const CUTAWAY_SCENES = new Set(["fullstack", "booster", "starship"]);

export const PEEL_HINTS = {
  fullstack:
    "Explode floats ship, tanks, engines, and flaps apart. Click a piece to fade the rest. Cutaway opens the tank shells. Scale puts a person and a Falcon 9 beside the stack.",
  booster: "Explode drops the engine cluster and spreads the fins. Click a piece to isolate it. Cutaway opens the tanks. Scale puts a person and a Falcon 9 beside the booster.",
  starship: "Explode spreads flaps and engines. Click a piece to isolate it. Cutaway opens the tanks and header tanks.",
  mechazilla: "Explode opens the chopsticks away from the booster. Click the arms or the vehicle to isolate one.",
  raptor: "Explode floats nozzle, pumps, and gimbal apart. Click one piece to fade the rest.",
};

const DEFAULT_HINT = "Click a piece to isolate it. Explode floats parts apart when this scene supports it.";

export function teachLabel(part) {
  if (!part) return "";
  return TEACH_LABELS[part.id] || part.teachName || part.name || "";
}

export function sceneSupportsCutaway(sceneId) {
  return CUTAWAY_SCENES.has(sceneId);
}

export function peelHintFor(sceneId) {
  return PEEL_HINTS[sceneId] || DEFAULT_HINT;
}

export function peelBusy(state) {
  return Boolean(state?.explode || state?.isolateId);
}

export function calloutKicker(state) {
  if (state?.isolateId) return "Isolated — others faded";
  if (state?.explode) return "Floated apart";
  return "Selected part";
}

/** Pure state for explode / isolate / cutaway. Viewer applies the result. */
export function reducePeel(state, action) {
  const next = {
    explode: Boolean(state?.explode),
    isolateId: state?.isolateId || null,
    cutaway: Boolean(state?.cutaway),
  };
  switch (action?.type) {
    case "explode":
      next.explode = Boolean(action.on);
      break;
    case "cutaway":
      next.cutaway = Boolean(action.on);
      break;
    case "isolate":
      next.isolateId = action.id || null;
      break;
    case "toggle-isolate":
      next.isolateId = next.isolateId === action.id ? null : action.id || null;
      break;
    case "reassemble":
      next.explode = false;
      next.isolateId = null;
      break;
    case "reset":
      next.explode = false;
      next.isolateId = null;
      next.cutaway = false;
      break;
    default:
      break;
  }
  return next;
}
