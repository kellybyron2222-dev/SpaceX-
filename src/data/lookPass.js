/** Look pass (fade / highlight / clip). skipFrame is camera-only — scale refs still fade. */
export function meshTakesLook(child) {
  return Boolean(child?.isMesh && child.material && !child.userData?.pickProxy);
}

/** Black tiles stay black — gold wash contradicts “Black tiles on the belly”. */
export function selectKeepsHue(part) {
  return Boolean(part?.keepHue);
}
