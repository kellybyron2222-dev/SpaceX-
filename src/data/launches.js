import { SAMPLE_LAUNCHES } from "./sampleLaunches.js";
import { catalogById } from "./catalog.js";
import { normalizeVidUrl } from "./live/webcast.js";

export const REFRESH_MS = 10 * 60 * 1000;
const LL2 = "https://ll.thespacedevs.com/2.3.0";
const PROXY = "/ll2/2.3.0";

function mapStatus(status) {
  const abbrev = (status?.abbrev || "").toLowerCase();
  const name = (status?.name || "").toLowerCase();
  const blob = `${abbrev} ${name}`;
  if (blob.includes("scrub")) return { status: "scrub", statusLabel: status?.abbrev || "Scrub" };
  if (blob.includes("hold")) return { status: "hold", statusLabel: status?.abbrev || "Hold" };
  if (blob.includes("in flight") || abbrev === "in flight" || blob.includes("liftoff")) {
    return { status: "in-flight", statusLabel: status?.abbrev || "In flight" };
  }
  if (blob.includes("success")) return { status: "success", statusLabel: status?.abbrev || "Success" };
  if (blob.includes("fail") || blob.includes("partial")) {
    return { status: "failure", statusLabel: status?.abbrev || "Failure" };
  }
  if (abbrev === "go" || blob.includes("go for")) return { status: "go", statusLabel: status?.abbrev || "Go" };
  return { status: "scheduled", statusLabel: status?.abbrev || status?.name || "Scheduled" };
}

/** Crew Dragon / Commercial Crew — not Cargo Dragon / CRS. */
export function isCrewMission(vehicle, pad, site, mission = "") {
  const blob = `${vehicle} ${pad} ${site} ${mission}`.toLowerCase();
  return (
    /crew[-\s]?\d/.test(blob) ||
    blob.includes("commercial crew") ||
    blob.includes("crew dragon") ||
    blob.includes("dragon crew") ||
    blob.includes("crew rotation")
  );
}

export function relatedIdsForLaunch(vehicle, pad, site, mission = "") {
  const v = `${vehicle} ${pad} ${site}`.toLowerCase();
  const ids = [];
  const add = (id) => {
    if (!ids.includes(id) && catalogById(id)) ids.push(id);
  };
  if (v.includes("starship") || v.includes("super heavy") || v.includes("starbase") || v.includes("boca")) {
    add("raptor");
    add("chopsticks");
    add("catch-pins");
    add("grid-fins");
    add("mechazilla-tower");
    add("qd-arm");
    add("olm");
    add("hot-stage");
    add("deluge");
    add("tiles");
    add("flaps");
  }
  if (v.includes("falcon") || v.includes("merlin") || v.includes("dragon") || v.includes("starlink")) {
    add("merlin");
    add("fairing");
    add("landing-legs");
    add("grid-fins");
    add("strongback");
    add("asds");
  }
  if (isCrewMission(vehicle, pad, site, mission)) {
    add("crew-access");
    add("strongback");
    add("deluge");
  }
  if (v.includes("39a") || v.includes("kennedy")) {
    add("strongback");
    add("deluge");
    if (v.includes("starship")) add("olm");
  }
  if (v.includes("slc-40") || v.includes("complex 40") || v.includes("canaveral")) {
    add("strongback");
    add("asds");
    add("deluge");
  }
  if (v.includes("4e") || v.includes("vandenberg")) {
    add("strongback");
    add("asds");
  }
  return ids;
}

/** Falcon Heavy only — Super Heavy is a Starship booster, not this filter. */
export function isFalconHeavyText(text = "") {
  const b = String(text).toLowerCase();
  if (b.includes("super heavy")) return false;
  return b.includes("falcon heavy") || (b.includes("falcon") && b.includes("heavy"));
}

export function launchMatchesFilter(launch, filter) {
  if (filter === "all") return true;
  const blob = `${launch?.vehicle || ""} ${launch?.mission || ""}`.toLowerCase();
  if (filter === "starship") return blob.includes("starship") || blob.includes("super heavy");
  if (filter === "heavy") return isFalconHeavyText(blob);
  if (filter === "falcon9") return blob.includes("falcon 9") && !blob.includes("heavy");
  return true;
}

export function sceneForLaunch(vehicle, pad, site, mission = "") {
  const v = `${vehicle} ${pad} ${site}`.toLowerCase();
  if (
    v.includes("starship") ||
    v.includes("super heavy") ||
    v.includes("starbase") ||
    v.includes("boca") ||
    v.includes("orbital launch")
  ) {
    return "mechazilla";
  }
  if (isFalconHeavyText(v)) return "falcon-heavy";
  if (isCrewMission(vehicle, pad, site, mission) || v.includes("39a") || v.includes("kennedy")) {
    return "falcon-pad";
  }
  if (v.includes("droneship") || v.includes("asds")) return "asds";
  return "falcon9";
}

function launchWebcasts(raw) {
  const rows = raw.webcasts || raw.vid_urls || raw.vidURLs || [];
  return rows.map(normalizeVidUrl);
}

export function normalizeLaunch(raw) {
  if (raw.mission && raw.vehicle && raw.status && raw.pad && !raw.rocket) {
    return {
      ...raw,
      relatedIds: relatedIdsForLaunch(raw.vehicle, raw.pad, raw.site, raw.mission),
      sceneId: sceneForLaunch(raw.vehicle, raw.pad, raw.site, raw.mission),
      webcasts: launchWebcasts(raw),
      webcastLive: Boolean(raw.webcastLive || raw.webcast_live),
    };
  }
  const mapped = mapStatus(raw.status);
  const vehicle = raw.rocket?.configuration?.full_name || raw.rocket?.configuration?.name || "Vehicle";
  const pad = raw.pad?.name || "Pad TBD";
  const site = raw.pad?.location?.name || raw.pad?.country?.name || "";
  const mission = raw.mission?.name || (raw.name || "").split("|").slice(1).join("|").trim() || raw.name;
  return {
    id: raw.id,
    mission,
    vehicle,
    pad,
    site,
    net: raw.net,
    windowStart: raw.window_start,
    windowEnd: raw.window_end,
    status: mapped.status,
    statusLabel: mapped.statusLabel,
    description: raw.mission?.description || "",
    relatedIds: relatedIdsForLaunch(vehicle, pad, site, mission),
    sceneId: sceneForLaunch(vehicle, pad, site, mission),
    webcasts: launchWebcasts(raw),
    webcastLive: Boolean(raw.webcast_live),
  };
}

function headers() {
  const h = { Accept: "application/json" };
  const key = import.meta.env.VITE_LL2_API_KEY;
  if (key) h.Authorization = `Token ${key}`;
  return h;
}

async function getJson(url, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: headers(), signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function mergeLaunches(...lists) {
  const byId = new Map();
  for (const list of lists) {
    for (const launch of list || []) {
      if (launch?.id && !byId.has(launch.id)) byId.set(launch.id, launch);
    }
  }
  return [...byId.values()].sort((a, b) => new Date(b.net || 0) - new Date(a.net || 0));
}

async function fetchFromBase(base) {
  const q = "lsp__name=SpaceX&limit=12&mode=detailed";
  const [up, prev, prevStarship] = await Promise.all([
    getJson(`${base}/launches/upcoming/?${q}`),
    getJson(`${base}/launches/previous/?lsp__name=SpaceX&limit=8&mode=detailed`),
    getJson(`${base}/launches/previous/?search=Starship&limit=4&mode=detailed`).catch(() => ({ results: [] })),
  ]);
  if (!Array.isArray(up?.results) || !Array.isArray(prev?.results)) throw new Error("Unexpected LL2 shape");
  const starshipRecent = Array.isArray(prevStarship?.results) ? prevStarship.results.map(normalizeLaunch) : [];
  return {
    upcoming: up.results.map(normalizeLaunch),
    recent: mergeLaunches(starshipRecent, prev.results.map(normalizeLaunch)),
    source: "live",
    endpoint: base,
    fetchedAt: new Date().toISOString(),
  };
}

export function sampleBundle() {
  return {
    upcoming: SAMPLE_LAUNCHES.upcoming.map(normalizeLaunch),
    recent: SAMPLE_LAUNCHES.recent.map(normalizeLaunch),
    source: "sample",
    endpoint: null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function loadLaunches({ prefer = "live" } = {}) {
  if (prefer === "sample") return sampleBundle();
  const bases = [LL2, PROXY];
  for (const base of bases) {
    try {
      return await fetchFromBase(base);
    } catch {
      /* try next */
    }
  }
  return sampleBundle();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function utcParts(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: `${String(d.getUTCDate()).padStart(2, "0")} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
    monthYear: `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    midnight: d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0,
  };
}

export function formatUtc(iso) {
  const p = utcParts(iso);
  if (!p) return "NET TBD";
  return `${p.date} · ${p.time} UTC`;
}

export function isVagueSchedule(statusLabel = "") {
  const label = String(statusLabel).trim().toUpperCase();
  return (
    label === "TBD" ||
    label === "TBC" ||
    label.includes("TO BE DETERMINED") ||
    label.includes("TO BE CONFIRMED")
  );
}

/** TBD/TBC midnight UTC is a date floor, not a real T-0. */
export function isPlaceholderNet(launch) {
  if (!launch || !isVagueSchedule(launch.statusLabel)) return false;
  const p = utcParts(launch.net);
  return !p || p.midnight;
}

/** One Tracker meta line — no duplicated date, no lone wrapped `UTC`. */
export function trackerWhenLine(launch) {
  if (isPlaceholderNet(launch)) {
    const p = utcParts(launch.net);
    return p ? `NET ${p.monthYear}` : "NET TBD";
  }
  const net = utcParts(launch?.net);
  if (!net) return "NET TBD";
  const start = utcParts(launch.windowStart);
  const end = utcParts(launch.windowEnd);
  if (start && end && launch.windowStart !== launch.windowEnd) {
    return `${net.date} · Window ${start.time}–${end.time} UTC`;
  }
  return `${net.date} · ${net.time} UTC`;
}

export function trackerCountdown(launch) {
  if (!launch?.net) return "";
  if (launch.status === "success" || launch.status === "failure" || launch.status === "scrub") return "";
  if (isPlaceholderNet(launch)) return "";
  return countdown(launch.net);
}

const STATUS_TIPS = {
  go: "Go — launch is cleared to proceed at the listed time, range and weather permitting.",
  hold: "Hold — the countdown or launch flow is paused.",
  scrub: "Scrub — this attempt is called off.",
  success: "Success — mission completed, as reported by Launch Library 2 (not official SpaceX).",
  failure: "Failure — launch or mission failed, as reported by Launch Library 2.",
  "in-flight": "In flight — currently airborne, as reported.",
  scheduled: "Scheduled — on the public manifest.",
};

/** Plain-language tooltip for tracker status chips (GO / TBC / TBD / HOLD / NET / …). */
export function statusTip(status, statusLabel = "") {
  const label = String(statusLabel || "").trim().toUpperCase();
  if (label === "TBC" || label.includes("TO BE CONFIRMED")) {
    return "TBC (To Be Confirmed) — a launch slot is on the manifest, but the exact time is not confirmed. Not terms and conditions.";
  }
  if (label === "TBD" || label.includes("TO BE DETERMINED")) {
    return "TBD (To Be Determined) — the date or time has not been decided yet.";
  }
  if (label === "NET" || label.includes("NO EARLIER")) {
    return "NET (No Earlier Than) — the vehicle will not launch before this time; it is a floor, not a firm T-0.";
  }
  if (label === "GO") return STATUS_TIPS.go;
  if (label === "HOLD") return STATUS_TIPS.hold;
  return STATUS_TIPS[status] || STATUS_TIPS.scheduled;
}

export function countdown(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(t)) return "";
  const sign = t < 0 ? "+" : "−";
  const abs = Math.abs(t);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  if (d > 0) return `T${sign}${d}d ${h}h`;
  if (h > 0) return `T${sign}${h}h ${m}m`;
  const s = Math.floor((abs % 60000) / 1000);
  return `T${sign}${m}m ${s}s`;
}

/** Second-resolution T− / T+ for Live Launch. Public LL2 NET, not official range time. */
export function countdownClock(iso) {
  if (!iso) return "";
  const delta = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(delta)) return "";
  const sign = delta < 0 ? "+" : "−";
  const abs = Math.abs(delta);
  const d = Math.floor(abs / 86400000);
  const h = Math.floor((abs % 86400000) / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  if (d > 0) return `T${sign}${d}d ${hh}:${mm}:${ss}`;
  return `T${sign}${hh}:${mm}:${ss}`;
}

export function isStarshipLaunch(launch) {
  const blob = `${launch?.vehicle || ""} ${launch?.mission || ""} ${launch?.pad || ""} ${launch?.site || ""}`.toLowerCase();
  return /starship|super heavy|starbase|boca chica/.test(blob);
}

const STARSHIP_WINDOW_GRACE_MS = 8 * 60 * 60 * 1000;

/** Next public Starship / Super Heavy window from an LL2 (or sample) bundle. */
export function nextStarshipWindow(bundle) {
  if (!bundle) return null;
  const upcoming = (bundle.upcoming || []).filter(isStarshipLaunch);
  const recent = (bundle.recent || []).filter(isStarshipLaunch);
  const inflight = [...upcoming, ...recent].find((l) => l.status === "in-flight");
  if (inflight) return inflight;
  const now = Date.now();
  const sorted = [...upcoming].sort((a, b) => new Date(a.net) - new Date(b.net));
  const current = sorted.find((l) => {
    if (l.status === "success" || l.status === "failure" || l.status === "scrub") return false;
    const t = new Date(l.net).getTime();
    if (Number.isNaN(t)) return true;
    return t + STARSHIP_WINDOW_GRACE_MS >= now;
  });
  return current || sorted[0] || null;
}
