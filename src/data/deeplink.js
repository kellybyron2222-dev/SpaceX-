/**
 * Shareable companion deep links (Grok Bot + copy/paste).
 * Query or hash, e.g. ?mode=learn&id=raptor — stays under GitHub Pages /SpaceX-/
 * (no extra path segments). In-app nav replaceState's the query.
 */

export const MODES = ["tracker", "explore", "learn", "live"];

function paramsFrom(search, hash) {
  const query = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const hashStr = String(hash || "")
    .replace(/^#/, "")
    .replace(/^\?/, "");
  const fromHash = hashStr.includes("=") || hashStr.includes("&") ? new URLSearchParams(hashStr) : new URLSearchParams();
  const get = (key) => {
    const q = query.get(key);
    if (q != null && q !== "") return q;
    const h = fromHash.get(key);
    return h != null && h !== "" ? h : "";
  };
  return { get };
}

function flag(raw) {
  const v = String(raw || "").toLowerCase();
  if (v === "1" || v === "true" || v === "on") return true;
  if (v === "0" || v === "false" || v === "off") return false;
  return null;
}

/** Parse `?mode=learn&id=raptor` and/or `#mode=learn&id=raptor`. Query wins per key. */
export function parseDeepLink(search = "", hash = "") {
  const { get } = paramsFrom(search, hash);
  const modeRaw = get("mode").toLowerCase();
  const id = get("id") || get("hotspot");
  return {
    mode: MODES.includes(modeRaw) ? modeRaw : "",
    id,
    hotspot: get("hotspot"),
    scene: get("scene"),
    preset: get("preset"),
    video: get("video"),
    hotspots: flag(get("hotspots")),
  };
}

export function hasDeepLink(link) {
  if (!link) return false;
  return Boolean(link.mode || link.id || link.hotspot || link.scene || link.preset || link.video);
}

/** Infer tab when the bot omits `mode` but sends a scene / catalog id / Live preset. */
export function inferredMode(link) {
  if (link?.mode) return link.mode;
  if (link?.preset || link?.video) return "live";
  if (link?.scene) return "explore";
  if (link?.id || link?.hotspot) return "learn";
  return "";
}

/** Canonical query (no leading `?`). Empty string = default Explore / Full stack. */
export function serializeDeepLink({
  mode = "explore",
  id = "",
  scene = "",
  preset = "",
  video = "",
  hotspots = false,
} = {}) {
  const tab = MODES.includes(mode) ? mode : "explore";
  const catalogId = id || "";
  const sceneId = scene || "";
  const presetId = preset || "";
  const videoId = video || "";
  const cleanExplore = tab === "explore" && (!sceneId || sceneId === "fullstack") && !catalogId;
  if (tab === "explore" && cleanExplore) return "";

  const p = new URLSearchParams();
  p.set("mode", tab);
  if (tab === "explore" && sceneId) p.set("scene", sceneId);
  if ((tab === "learn" || tab === "live") && catalogId) p.set("id", catalogId);
  if (tab === "live") {
    if (presetId) p.set("preset", presetId);
    if (videoId) p.set("video", videoId);
    if (hotspots) p.set("hotspots", "1");
  }
  return p.toString();
}

/** replaceState onto the current pathname (keeps /SpaceX-/). Drops hash after canonicalize. */
export function replaceShareUrl(search, loc, hist) {
  if (!loc || !hist?.replaceState) return "";
  const path = loc.pathname || "/";
  const next = search ? `${path}?${search}` : path;
  const cur = `${loc.pathname || ""}${loc.search || ""}`;
  if (cur === next && !loc.hash) return next;
  hist.replaceState(null, "", next);
  return next;
}
