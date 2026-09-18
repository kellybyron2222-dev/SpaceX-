/** Consume `public/broadcast/cues.json` (PR #33). Public educational beats — not official telemetry. */

export const CUES_PATH = "broadcast/cues.json";

export function cuesUrl(base = import.meta.env.BASE_URL || "/") {
  const root = String(base || "/").endsWith("/") ? base : `${base}/`;
  return `${root}${CUES_PATH}`;
}

function finiteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeBeat(raw = {}, index = 0) {
  const id = String(raw.id || raw.phase || `beat-${index}`);
  const phase = String(raw.phase || id);
  const clock = String(raw.clock || raw.tLabel || raw.typicalClock || "");
  const cue = String(raw.cue || raw.line || raw.text || "").trim();
  const recapSeconds = finiteNumber(raw.recapSeconds);
  const clockSeconds = finiteNumber(raw.clockSeconds ?? raw.t ?? raw.at ?? raw.seconds);
  const hotspotId = raw.hotspotId || raw.hotspot || null;
  const learnId = raw.learnId || raw.learn || raw.catalogId || null;
  const presetId = raw.overlayPresetId || raw.presetId || raw.preset || null;
  return {
    id,
    phase,
    clock,
    cue,
    recapSeconds,
    clockSeconds,
    t: recapSeconds ?? clockSeconds ?? 0,
    hotspotId: hotspotId ? String(hotspotId) : null,
    learnId: learnId ? String(learnId) : null,
    presetId: presetId ? String(presetId) : null,
    deepLink: raw.deepLink ? String(raw.deepLink) : null,
  };
}

export function normalizeSheet(raw = {}) {
  const beats = Array.isArray(raw.beats) ? raw.beats.map(normalizeBeat) : [];
  const videoId = raw.video?.youtubeId || raw.videoId || null;
  const aliases = [videoId, ...(raw.video?.aliases || raw.video?.youtubeIds || [])]
    .map((id) => String(id || ""))
    .filter(Boolean);
  return {
    id: String(raw.id || "sheet"),
    title: String(raw.title || raw.id || "Cue sheet"),
    videoId: videoId ? String(videoId) : null,
    videoIds: [...new Set(aliases)],
    t0OffsetSeconds: finiteNumber(raw.video?.t0OffsetSeconds ?? raw.t0OffsetSeconds),
    clockKind: String(raw.clockKind || ""),
    expectedDurationSeconds: finiteNumber(raw.expectedDurationSeconds || raw.video?.expectedDurationSeconds),
    note: String(raw.note || ""),
    beats,
  };
}

export function normalizePack(raw = {}) {
  const sheets = Array.isArray(raw.sheets) ? raw.sheets.map(normalizeSheet) : [];
  return {
    schema: String(raw.schema || ""),
    disclaimer: String(raw.disclaimer || ""),
    defaultSheet: String(raw.defaultSheet || sheets[0]?.id || ""),
    sheets,
  };
}

export function sheetById(pack, id) {
  return pack?.sheets?.find((s) => s.id === id) || null;
}

/** Known VOD sheet when the video matches; otherwise generic T+ phases. */
export function pickSheet(pack, videoId) {
  if (!pack?.sheets?.length) return null;
  const id = String(videoId || "");
  const matched = pack.sheets.find(
    (s) => (s.videoId && s.videoId === id) || (s.videoIds || []).includes(id),
  );
  if (matched) return matched;
  return (
    sheetById(pack, "generic-launch-test") ||
    sheetById(pack, "generic-starship") ||
    sheetById(pack, pack.defaultSheet) ||
    pack.sheets.find((s) => s.id !== "flight-5") ||
    pack.sheets[0]
  );
}

export function latestSheetVideoId(pack) {
  const latest =
    sheetById(pack, "flight-13") ||
    sheetById(pack, pack?.defaultSheet) ||
    pack?.sheets?.find((s) => s.id !== "generic-launch-test" && s.videoId);
  return latest?.videoId || null;
}

export function beatById(sheet, id) {
  if (!sheet?.beats?.length || id == null || id === "") return null;
  const key = String(id).toLowerCase();
  return (
    sheet.beats.find((b) => b.id.toLowerCase() === key) ||
    sheet.beats.find((b) => b.phase.toLowerCase() === key) ||
    null
  );
}

export function recapBeats(sheet) {
  return (sheet?.beats || []).filter((b) => b.recapSeconds != null);
}

export function missionBeats(sheet) {
  return (sheet?.beats || []).filter((b) => b.clockSeconds != null);
}

/** Latest beat whose clock field is at or before t. */
export function beatAtClock(beats, t, key = "t") {
  const usable = (beats || []).filter((b) => Number.isFinite(b[key]));
  if (!usable.length) return null;
  const time = Number(t);
  if (!Number.isFinite(time)) return usable[0];
  let match = usable[0];
  for (const beat of usable) {
    if (beat[key] <= time) match = beat;
  }
  return match;
}

/** Latest beat whose t is at or before playhead / mission elapsed. */
export function beatAtTime(beats, t) {
  return beatAtClock(beats, t, "t");
}

export async function fetchCuePack(url = cuesUrl()) {
  const res = await fetch(url, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Cue sheet HTTP ${res.status}`);
  return normalizePack(await res.json());
}
