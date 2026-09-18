/** Public YouTube helpers for Live Launch. Not official SpaceX video rights. */

export const YT_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
export const STORAGE_KEY = "scv-live-youtube-id";
export const HOTSPOT_STORAGE_KEY = "scv-live-hotspots";

export function youtubeWatchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** oEmbed 400/404 means this is not a public YouTube video (junk IDs, private, etc.). */
export function oembedMeansMissingVideo(result) {
  const status = result?.status;
  return status === 400 || status === 404;
}

export function youtubeThumbCandidates(id) {
  return [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  ];
}

/**
 * Public oEmbed probe. 401 usually means the uploader disabled embedding.
 * Success does not guarantee the IFrame player will play (bot-check walls).
 */
export async function fetchYouTubeOembed(id, timeoutMs = 6000) {
  const parsed = parseYouTubeId(id);
  if (!parsed) return { ok: false, embeddable: null, status: 0 };
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeWatchUrl(parsed))}&format=json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (res.status === 401) return { ok: false, embeddable: false, status: 401 };
    if (!res.ok) return { ok: false, embeddable: null, status: res.status };
    const data = await res.json();
    return {
      ok: true,
      embeddable: true,
      status: res.status,
      title: data.title || "",
      author: data.author_name || "",
      thumbnail: data.thumbnail_url || "",
    };
  } catch {
    return { ok: false, embeddable: null, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}

const YT_HOSTS = new Set(["youtu.be", "youtube.com", "m.youtube.com", "youtube-nocookie.com"]);
const YT_VIDEO_PATHS = new Set(["embed", "live", "shorts", "v", "watch"]);
const YT_NON_VIDEO_PATHS = new Set(["playlist", "channel", "c", "user", "feed", "results", "hashtag", "podcasts"]);
const YT_URL_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be|youtube-nocookie\.com)\/[^\s]*/i;

export function isYouTubeVideoId(id) {
  return YT_ID_RE.test(String(id || ""));
}

function youtubeHost(hostname) {
  return String(hostname || "")
    .replace(/^www\./, "")
    .toLowerCase();
}

function idFromYouTubeUrl(rawUrl) {
  const withProto = /:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  let u;
  try {
    u = new URL(withProto);
  } catch {
    return null;
  }
  const host = youtubeHost(u.hostname);
  if (!YT_HOSTS.has(host)) return null;

  const parts = u.pathname.split("/").filter(Boolean);
  const head = parts[0] || "";
  if (head.startsWith("@") || YT_NON_VIDEO_PATHS.has(head)) return null;

  if (host === "youtu.be") {
    return isYouTubeVideoId(head) ? head : null;
  }

  const v = u.searchParams.get("v");
  if (isYouTubeVideoId(v)) return v;

  const key = parts.findIndex((p) => YT_VIDEO_PATHS.has(p));
  if (key >= 0 && isYouTubeVideoId(parts[key + 1])) return parts[key + 1];
  return null;
}

/** Why a paste was rejected, or null if it looks like a video ID. */
export function youtubeIdRejectReason(raw) {
  const s = String(raw || "").trim();
  if (!s) return "Paste a YouTube watch URL or 11-character video ID.";
  if (parseYouTubeId(s)) return null;
  if (YT_URL_RE.test(s) || /(?:^|\s)(?:youtube\.com|youtu\.be)\b/i.test(s)) {
    return "That YouTube link is not a video. Paste a watch / youtu.be / embed URL, not a playlist, channel, or handle.";
  }
  return "Paste a YouTube watch URL or 11-character video ID — not a playlist, channel, or scraped token.";
}

export function parseYouTubeId(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (isYouTubeVideoId(s)) return s;

  const urlMatch = s.match(YT_URL_RE);
  if (urlMatch) return idFromYouTubeUrl(urlMatch[0]);

  if (/^(?:youtube\.com|youtu\.be|m\.youtube\.com|youtube-nocookie\.com)\b/i.test(s)) {
    return idFromYouTubeUrl(s);
  }

  return null;
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

export function loadHotspotsVisible(fallback = false) {
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
