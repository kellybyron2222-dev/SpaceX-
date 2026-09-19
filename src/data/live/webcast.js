/** Pick a public YouTube webcast from Launch Library 2. Not official SpaceX video rights. */

import { parseYouTubeId } from "./youtube.js";

const STARSHIP_RE = /starship|super heavy|starbase|boca chica/;
const FALCON_RE = /falcon/;
const COMPLETED = new Set(["success", "failure"]);

/** Uploader disabled embedding (IFrame 101/150). oEmbed may still be 200. */
export const DEFAULT_IFRAME_BLOCKED_IDS = ["lC3RDO7tdLc", "Ew0Xu1RT8oc"];

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

/** Completed Starship / Super Heavy rows, newest first. */
export function completedStarshipRows(bundle) {
  return bundleLaunches(bundle)
    .filter(isStarshipWebcastLaunch)
    .filter(completed)
    .filter((launch) => youtubeClips(launch).length)
    .sort((a, b) => new Date(b.net || 0) - new Date(a.net || 0));
}

function rankedClips(launch) {
  return [...youtubeClips(launch)].sort(
    (a, b) => officialStyleScore(b) - officialStyleScore(a) || (a.priority || 0) - (b.priority || 0),
  );
}

/**
 * Newest completed Starship webcast that is not iframe-blocked (101/150).
 * Walks older Starship flights — never a Falcon — when the newest ids cannot play in-page.
 * `blockedLatest` is the newest id we skipped (Watch on YouTube).
 */
export function pickPlayableStarshipWebcast(bundle, iframeBlockedIds = []) {
  const blocked = blockedSet([...DEFAULT_IFRAME_BLOCKED_IDS, ...iframeBlockedIds]);
  const rows = completedStarshipRows(bundle);
  let blockedLatest = null;
  let pick = null;
  for (const row of rows) {
    for (const clip of rankedClips(row)) {
      if (!clip.youtubeId) continue;
      if (isIframeBlocked(clip.youtubeId, blocked)) {
        if (!blockedLatest) blockedLatest = packPick(row, clip, { reason: "iframe-blocked" });
        continue;
      }
      if (!pick) pick = packPick(row, clip, { reason: "latest-completed" });
    }
    if (pick) break;
  }
  if (pick) pick.blockedLatest = blockedLatest;
  return { pick, blockedLatest };
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
 * then an in-page-playable completed YouTube VOD.
 */
function blockedSet(ids) {
  return new Set(
    (ids || [])
      .map((id) => parseYouTubeId(id))
      .filter(Boolean),
  );
}

function isIframeBlocked(id, blocked) {
  const parsed = parseYouTubeId(id);
  return Boolean(parsed && blocked.has(parsed));
}

function embedFallback(fallbackId, blockedLatest) {
  const fallback = parseYouTubeId(fallbackId);
  if (!fallback) return null;
  return {
    youtubeId: fallback,
    reason: "embed-fallback",
    live: false,
    t0Offset: null,
    title: "",
    mission: blockedLatest?.mission || "",
    blockedLatest: blockedLatest || null,
  };
}

/**
 * Prefer a pasted / query ID, then a live Starship (or Falcon) webcast,
 * then the most recent completed official-style YouTube VOD that can play in-page.
 * `iframeBlockedIds` are known 101/150 uploads (oEmbed may still be 200).
 */
export function resolveAutoWebcast({
  bundle = null,
  queryId = "",
  storedId = "",
  fallbackId = "",
  latestSheetVideoId = "",
  iframeBlockedIds = [],
} = {}) {
  const blocked = blockedSet([...DEFAULT_IFRAME_BLOCKED_IDS, ...iframeBlockedIds]);
  const query = parseYouTubeId(queryId);
  if (query) {
    return { youtubeId: query, reason: "query", live: false, t0Offset: null, title: "", mission: "" };
  }
  const stored = parseYouTubeId(storedId);
  if (stored && !isIframeBlocked(stored, blocked)) {
    return { youtubeId: stored, reason: "paste", live: false, t0Offset: null, title: "", mission: "" };
  }
  const live = findLiveWebcast(bundle);
  if (live && !isIframeBlocked(live.youtubeId, blocked)) return live;

  const { pick: starship, blockedLatest: skippedStarship } = pickPlayableStarshipWebcast(bundle, [
    ...DEFAULT_IFRAME_BLOCKED_IDS,
    ...iframeBlockedIds,
  ]);
  if (starship?.youtubeId) return starship;

  const sheet = parseYouTubeId(latestSheetVideoId);
  const blockedLatest =
    skippedStarship ||
    (sheet && isIframeBlocked(sheet, blocked) ? { youtubeId: sheet, mission: "Starship webcast", title: "" } : null);

  // Last-resort embeddable Starship recap — not Falcon — when newer Starship ids are 101/150.
  if (blockedLatest) {
    const recap = embedFallback(fallbackId, blockedLatest);
    if (recap && !isIframeBlocked(recap.youtubeId, blocked)) return recap;
  }

  const latestFalcon = findLatestCompletedWebcast(bundle, { vehicle: "falcon" });
  if (latestFalcon && !isIframeBlocked(latestFalcon.youtubeId, blocked) && !blockedLatest) return latestFalcon;

  const fallback = parseYouTubeId(fallbackId);
  if (fallback && !isIframeBlocked(fallback, blocked)) {
    return { youtubeId: fallback, reason: "fallback", live: false, t0Offset: null, title: "", mission: "" };
  }
  return null;
}

export function isStaleDefaultId(id, fallbackId, extraStale = []) {
  const parsed = parseYouTubeId(id);
  if (!parsed) return false;
  const fallback = parseYouTubeId(fallbackId);
  if (fallback && parsed === fallback) return true;
  return extraStale.some((item) => parseYouTubeId(item) === parsed);
}
