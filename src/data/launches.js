import { SAMPLE_LAUNCHES } from "./sampleLaunches.js";
import { catalogById } from "./catalog.js";

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

export function relatedIdsForLaunch(vehicle, pad, site) {
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
  if (v.includes("39a") || v.includes("kennedy")) {
    add("crew-access");
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
  if (v.includes("heavy")) add("merlin");
  return ids;
}

export function sceneForLaunch(vehicle, pad, site) {
  const v = `${vehicle} ${pad} ${site}`.toLowerCase();
  if (v.includes("starship") || v.includes("starbase") || v.includes("boca") || v.includes("orbital launch")) {
    return "mechazilla";
  }
  if (v.includes("heavy")) return "falcon-heavy";
  if (v.includes("39a") || v.includes("kennedy")) return "falcon-pad";
  if (v.includes("droneship") || v.includes("asds")) return "asds";
  return "falcon9";
}

export function normalizeLaunch(raw) {
  if (raw.mission && raw.vehicle && raw.status && raw.pad && !raw.rocket) {
    return {
      ...raw,
      relatedIds: relatedIdsForLaunch(raw.vehicle, raw.pad, raw.site),
      sceneId: sceneForLaunch(raw.vehicle, raw.pad, raw.site),
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
    relatedIds: relatedIdsForLaunch(vehicle, pad, site),
    sceneId: sceneForLaunch(vehicle, pad, site),
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

async function fetchFromBase(base) {
  const q = "lsp__name=SpaceX&limit=12&mode=normal";
  const [up, prev] = await Promise.all([
    getJson(`${base}/launches/upcoming/?${q}`),
    getJson(`${base}/launches/previous/?lsp__name=SpaceX&limit=8&mode=normal`),
  ]);
  if (!Array.isArray(up?.results) || !Array.isArray(prev?.results)) throw new Error("Unexpected LL2 shape");
  return {
    upcoming: up.results.map(normalizeLaunch),
    recent: prev.results.map(normalizeLaunch),
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

export function formatUtc(iso) {
  if (!iso) return "NET TBD";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "NET TBD";
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} · ${hh}:${mm} UTC`;
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
  return `T${sign}${m}m`;
}
