/** Pick a public YouTube webcast from Launch Library 2. Not official SpaceX video rights. */

import { parseYouTubeId } from "./youtube.js";

const STARSHIP_RE = /starship|super heavy|starbase|boca chica/;
const FALCON_RE = /falcon/;
const COMPLETED = new Set(["success", "failure"]);

export function isStarshipWebcastLaunch(launch) {
  const blob = `${launch?.vehicle || ""} ${launch?.mission || ""} ${launch?.pad || ""} ${launch?.site || ""}`.toLowerCase();
  return STARSHIP_RE.test(blob);
}

export function isFalconWebcastLaunch(launch) {
  const blob = `${launch?.vehicle || ""} ${launch?.mission || ""}`.toLowerCase();
  return FALCON_RE.test(blob) && !STARSHIP_RE.test(blob);
}

export function isWebcastVehicle(launch) {
  return isStarshipWebcastLaunch(launch) || isFalconWebcastLaunch(launch);
}

export function normalizeVidUrl(raw = {}) {
  const url = typeof raw === "string" ? raw : raw.url || "";
  const youtubeId = parseYouTubeId(url);
  const type = String(raw.type?.name || raw.type || "");
  const publisher = String(raw.publisher || "");
  const source = String(raw.source || "");
  const title = String(raw.title || "");
  return {
    url: String(url),
    youtubeId,
    title,
    publisher,
    source,
    type,
    live: Boolean(raw.live),
    startTime: raw.start_time || raw.startTime || null,
    endTime: raw.end_time || raw.endTime || null,
    official: /official/i.test(type) || /^spacex$/i.test(publisher),
  };
}

export function youtubeClips(launch) {
  const raw = launch?.webcasts || launch?.vid_urls || launch?.vidURLs || [];
  return raw.map(normalizeVidUrl).filter((clip) => clip.youtubeId);
}

/** Higher is closer to an official-style SpaceX / Starship webcast. */
export function officialStyleScore(clip = {}) {
  const title = String(clip.title || "").toLowerCase();
  const type = String(clip.type || "").toLowerCase();
  const publisher = String(clip.publisher || "").toLowerCase();
  let score = 0;
  if (clip.live) score += 100;
  if (type.includes("official webcast") || type.includes("official recap")) score += 80;
  else if (type.includes("official")) score += 60;
  if (publisher === "spacex") score += 50;
  if (clip.youtubeId) score += 30;
  if (type.includes("unofficial webcast")) score += 16;
  if (type.includes("re-stream") || type.includes("restream")) score -= 12;
  if (/spacex/.test(title) && /starship|flight|falcon/.test(title)) score += 12;
  if (/stakeout|what happened|reaction|highlights reel/.test(title)) score -= 20;
  if (!clip.youtubeId) score -= 40;
  return score;
}

export function pickLaunchWebcast(launch, { liveOnly = false } = {}) {
  const clips = youtubeClips(launch).filter((clip) => (liveOnly ? clip.live : true));
  if (!clips.length) return null;
  return [...clips].sort((a, b) => officialStyleScore(b) - officialStyleScore(a) || (a.priority || 0) - (b.priority || 0))[0];
}

export function t0OffsetSeconds(clip, launch) {
  const startAt = clip?.startTime || clip?.start_time;
  if (!startAt || !launch?.net) return null;
  const start = new Date(startAt).getTime();
  const net = new Date(launch.net).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(net)) return null;
  const offset = Math.round((net - start) / 1000);
  // Recap/rehost uploaded after NET has a negative offset — treat as T-0 at 0:00.
  if (offset < 0 || offset > 12 * 3600) return 0;
  return offset;
}

function bundleLaunches(bundle) {
  return [...(bundle?.upcoming || []), ...(bundle?.recent || [])];
}

export function findLiveWebcast(bundle) {
  const launches = bundleLaunches(bundle).filter(isWebcastVehicle);
  const liveRows = launches.filter(
    (launch) =>
      launch.webcastLive ||
      launch.status === "in-flight" ||
      youtubeClips(launch).some((clip) => clip.live),
  );
  const starship = liveRows.find(isStarshipWebcastLaunch);
  const row = starship || liveRows.find(isFalconWebcastLaunch);
  if (!row) return null;
  const clip = pickLaunchWebcast(row, { liveOnly: youtubeClips(row).some((c) => c.live) }) || pickLaunchWebcast(row);
  if (!clip?.youtubeId) return null;
  return packPick(row, clip, { reason: "live" });
}

function completed(launch) {
  return COMPLETED.has(launch?.status);
}

export function findLatestCompletedWebcast(bundle, { vehicle = "starship" } = {}) {
  const rows = bundleLaunches(bundle)
    .filter(isWebcastVehicle)
    .filter(completed)
    .filter((launch) => youtubeClips(launch).length)
    .sort((a, b) => new Date(b.net || 0) - new Date(a.net || 0));
  const row =
    vehicle === "falcon"
      ? rows.find(isFalconWebcastLaunch)
      : rows.find(isStarshipWebcastLaunch) || (vehicle === "any" ? rows.find(isFalconWebcastLaunch) : null);
  if (!row) return null;
  const clip = pickLaunchWebcast(row);
  if (!clip?.youtubeId) return null;
  return packPick(row, clip, { reason: "latest-completed" });
}

function packPick(launch, clip, { reason }) {
  return {
    youtubeId: clip.youtubeId,
    title: clip.title || launch.mission || "Public webcast",
    mission: launch.mission || "",
    vehicle: launch.vehicle || "",
    net: launch.net || "",
    live: Boolean(clip.live || launch.webcastLive || launch.status === "in-flight"),
    t0Offset: t0OffsetSeconds(clip, launch),
    publisher: clip.publisher,
    type: clip.type,
    reason,
    launchId: launch.id || "",
  };
}

/**
 * Prefer a pasted / query ID, then a live Starship (or Falcon) webcast,
 * then the most recent completed official-style YouTube VOD.
 */
export function resolveAutoWebcast({
  bundle = null,
  queryId = "",
  storedId = "",
  fallbackId = "",
  latestSheetVideoId = "",
} = {}) {
  const query = parseYouTubeId(queryId);
  if (query) {
    return { youtubeId: query, reason: "query", live: false, t0Offset: null, title: "", mission: "" };
  }
  const stored = parseYouTubeId(storedId);
  if (stored) {
    return { youtubeId: stored, reason: "paste", live: false, t0Offset: null, title: "", mission: "" };
  }
  const live = findLiveWebcast(bundle);
  if (live) return live;
  const latestStarship = findLatestCompletedWebcast(bundle, { vehicle: "starship" });
  if (latestStarship) return latestStarship;
  const sheet = parseYouTubeId(latestSheetVideoId);
  if (sheet) {
    return { youtubeId: sheet, reason: "cue-sheet", live: false, t0Offset: null, title: "", mission: "" };
  }
  const latestFalcon = findLatestCompletedWebcast(bundle, { vehicle: "falcon" });
  if (latestFalcon) return latestFalcon;
  const fallback = parseYouTubeId(fallbackId);
  if (fallback) {
    return { youtubeId: fallback, reason: "fallback", live: false, t0Offset: null, title: "", mission: "" };
  }
  return null;
}

export function isStaleDefaultId(id, fallbackId) {
  const parsed = parseYouTubeId(id);
  const fallback = parseYouTubeId(fallbackId);
  return Boolean(parsed && fallback && parsed === fallback);
}
