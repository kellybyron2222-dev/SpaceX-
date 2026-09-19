/**
 * Teaching pose that matches the Live Launch gulf-side pad view.
 * Tower left, vehicle just right of Mechazilla — from overlays.json notes.
 * Not a surveyed camera model. Not official telemetry.
 */

export const WEBCAST_CAMERA = {
  id: "gulf-side",
  sceneId: "mechazilla",
  position: { x: 16, y: 22, z: 198 },
  target: { x: 11, y: 54, z: 0 },
  blurb:
    "Gulf-side pad camera: Mechazilla on the left, the stack just right of the tower. Teaching pose, not a surveyed webcast model.",
};

export function webcastPose() {
  return WEBCAST_CAMERA;
}

export function sceneForWebcast() {
  return WEBCAST_CAMERA.sceneId;
}
