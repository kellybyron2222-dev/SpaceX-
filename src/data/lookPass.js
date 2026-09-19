/** Look pass (fade / highlight / clip). skipFrame is camera-only — scale refs still fade. */
export function meshTakesLook(child) {
  return Boolean(child?.isMesh && child.material && !child.userData?.pickProxy);
}
