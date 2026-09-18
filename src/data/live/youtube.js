/** Public YouTube helpers for Live Launch. Not official SpaceX video rights. */

export const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
export const STORAGE_KEY = "scv-live-youtube-id";
export const HOTSPOT_STORAGE_KEY = "scv-live-hotspots";

export function parseYouTubeId(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (YT_ID_RE.test(s)) return s;
  const withProto = s.includes("://") ? s : `https://${s}`;
  try {
    const u = new URL(withProto);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0] || "";
      return YT_ID_RE.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && YT_ID_RE.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const key = parts.findIndex((p) => ["embed", "live", "shorts", "v", "watch"].includes(p));
      if (key >= 0 && parts[key + 1] && YT_ID_RE.test(parts[key + 1])) return parts[key + 1];
    }
  } catch {
    /* fall through */
  }
  const m = s.match(/[a-zA-Z0-9_-]{11}/);
  return m && YT_ID_RE.test(m[0]) ? m[0] : null;
}

export function loadStoredVideoId() {
  try {
    return parseYouTubeId(localStorage.getItem(STORAGE_KEY) || "");
  } catch {
    return null;
  }
}

export function storeVideoId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}

export function loadHotspotsVisible(fallback = true) {
  try {
    const v = localStorage.getItem(HOTSPOT_STORAGE_KEY);
    if (v === "0") return false;
    if (v === "1") return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function storeHotspotsVisible(on) {
  try {
    localStorage.setItem(HOTSPOT_STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function resolveDefaultVideoId(jsonId) {
  const stored = loadStoredVideoId();
  if (stored) return stored;
  const fromEnv = parseYouTubeId(import.meta.env.VITE_YOUTUBE_VIDEO_ID || "");
  if (fromEnv) return fromEnv;
  return parseYouTubeId(jsonId) || "hI9HQfCAw64";
}
