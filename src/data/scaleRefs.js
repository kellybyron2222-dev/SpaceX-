/**
 * Person / Falcon placement. Falcon is ~70 m — never put it next to a 3 m engine.
 * Vehicle scenes skip the person in the camera box; engine scenes keep the person.
 */
export function scaleRefOptions(opts = {}) {
  const includeFalcon = opts.includeFalcon !== false;
  return {
    includeFalcon,
    personSkipFrame: opts.personSkipFrame ?? includeFalcon,
    compactPerson: opts.compactPerson ?? !includeFalcon,
    personX: opts.personX ?? (includeFalcon ? 11 : 2.2),
    falconX: opts.falconX ?? 22,
    personY: opts.personY ?? 0,
    personZ: opts.personZ ?? (includeFalcon ? 12 : 0.8),
  };
}
