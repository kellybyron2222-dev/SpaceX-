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

function uniqueStrings(...groups) {
  const out = [];
  for (const group of groups) {
    const items = Array.isArray(group) ? group : group == null || group === "" ? [] : [group];
    for (const item of items) {
      const s = String(item || "").trim();
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

export function normalizeBeat(raw = {}, index = 0) {
  const id = String(raw.id || raw.phase || `beat-${index}`);
  const phase = String(raw.phase || id);
  const clock = String(raw.clock || raw.tLabel || raw.typicalClock || "");
  const cue = String(raw.cue || raw.line || raw.text || "").trim();
  const event = String(raw.event || raw.title || raw.name || "").trim();
  const recapSeconds = finiteNumber(raw.recapSeconds);
  const clockSeconds = finiteNumber(raw.clockSeconds ?? raw.t ?? raw.at ?? raw.seconds);
  const hotspotIds = uniqueStrings(raw.hotspotIds, raw.hotspots, raw.hotspotId, raw.hotspot);
  const learnIds = uniqueStrings(raw.learnIds, raw.learns, raw.learnId, raw.learn, raw.catalogId);
  const presetId = raw.overlayPresetId || raw.presetId || raw.preset || null;
  return {
    id,
    phase,
    event,
    clock,
    cue,
    recapSeconds,
    clockSeconds,
    t: recapSeconds ?? clockSeconds ?? 0,
    hotspotId: hotspotIds[0] || null,
    learnId: learnIds[0] || null,
    hotspotIds,
    learnIds,
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
    iframeBlocked: Boolean(raw.video?.iframeBlocked || raw.iframeBlocked),
    iframeBlockedIds: uniqueStrings(raw.video?.iframeBlockedIds, raw.iframeBlockedIds),
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

/** YouTube ids whose IFrame embed is known-blocked (101/150) even when oEmbed is 200. */
export function iframeBlockedIds(pack) {
  const ids = [];
  for (const sheet of pack?.sheets || []) {
    const listed = [
      ...(sheet.iframeBlockedIds || []),
      ...(sheet.iframeBlocked ? sheet.videoIds || [] : []),
    ];
    for (const id of listed) {
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** Latest cue-sheet VOD that is allowed to play in-page (Flight 5 recap today). */
export function latestEmbeddableSheetVideoId(pack) {
  const f5 = sheetById(pack, "flight-5");
  if (f5?.videoId && !f5.iframeBlocked) return f5.videoId;
  const latest = (pack?.sheets || []).find((s) => s.videoId && !s.iframeBlocked && s.id !== "generic-launch-test");
  return latest?.videoId || null;
}

/**
 * VOD T-0 from a surveyed cue-sheet offset wins over LL2 start vs NET.
 * Recap sheets (Flight 5) have no T-0; they follow recapSeconds.
 */
export function resolveT0Offset(sheet, { webcastPick, videoId } = {}) {
  if (recapBeats(sheet).length) return null;
  if (sheet?.t0OffsetSeconds != null) return sheet.t0OffsetSeconds;
  if (webcastPick?.youtubeId && webcastPick.youtubeId === String(videoId || "") && Number.isFinite(webcastPick.t0Offset)) {
    return webcastPick.t0Offset;
  }
  return 0;
}

/** YouTube video clock (seconds) minus surveyed T-0. */
export function missionSecondsAtVideoClock(videoSeconds, t0OffsetSeconds) {
  const t = Number(videoSeconds);
  const t0 = Number(t0OffsetSeconds);
  if (!Number.isFinite(t) || !Number.isFinite(t0)) return null;
  return t - t0;
}

/** Spoken heading for the overlay: encyclopedia `event`, else the phase key. */
export function beatTitle(beat) {
  if (!beat) return "";
  const event = String(beat.event || "").trim();
  if (event) return event;
  return String(beat.phase || beat.id || "").replace(/-/g, " ");
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
