import "./style.css";
import { Viewer } from "./viewer.js";
import { CATALOG, catalogById, findCatalogByPart, frameTargetForCatalog, searchCatalog } from "./data/catalog.js";
import { fillReferenceFigure, photoForCatalog } from "./data/referencePhotos.js";
import {
  formatUtc,
  loadLaunches,
  nextStarshipWindow,
  REFRESH_MS,
  statusTip,
  launchMatchesFilter,
  trackerCountdown,
  trackerWhenLine,
} from "./data/launches.js";
import { createLiveLaunch } from "./live.js";

const app = document.getElementById("app");
const canvas = document.getElementById("view");
const nav = document.getElementById("scene-nav");
const telHeight = document.getElementById("tel-height");
const telDia = document.getElementById("tel-dia");
const callout = document.getElementById("callout");
const calloutTitle = document.getElementById("callout-title");
const calloutBody = document.getElementById("callout-body");
const btnTeach = document.getElementById("btn-teach");
const help = document.getElementById("help");
const btnExplode = document.getElementById("btn-explode");
const btnIdle = document.getElementById("btn-idle");
const btnReset = document.getElementById("btn-reset");
const btnShot = document.getElementById("btn-shot");
const btnHelp = document.getElementById("btn-help");
const btnRefresh = document.getElementById("btn-refresh");
const launchList = document.getElementById("launch-list");
const trackerBanner = document.getElementById("tracker-banner");
const catalogNav = document.getElementById("catalog-nav");
const catalogSearch = document.getElementById("catalog-search");
const teachTitle = document.getElementById("teach-title");
const teachMeta = document.getElementById("teach-meta");
const teachBlurb = document.getElementById("teach-blurb");
const teachBody = document.getElementById("teach-body");
const btnPhysics = document.getElementById("btn-physics");
const tabPhysics = document.getElementById("tab-physics");
const teachRef = document.getElementById("teach-ref");
const teachRefImg = document.getElementById("teach-ref-img");
const teachRefCaption = document.getElementById("teach-ref-caption");
const teachRefCredit = document.getElementById("teach-ref-credit");
const liveRef = document.getElementById("live-ref");
const liveRefImg = document.getElementById("live-ref-img");
const liveRefCaption = document.getElementById("live-ref-caption");
const liveRefCredit = document.getElementById("live-ref-credit");

function syncReferencePhotos(entry) {
  const photo = photoForCatalog(entry?.id);
  fillReferenceFigure(
    teachRef,
    { img: teachRefImg, caption: teachRefCaption, credit: teachRefCredit },
    photo,
  );
  fillReferenceFigure(
    liveRef,
    { img: liveRefImg, caption: liveRefCaption, credit: liveRefCredit },
    state.mode === "live" ? photo : null,
  );
}

const viewer = new Viewer(canvas);

const live = createLiveLaunch({
  onSelect(catalogId) {
    selectCatalog(catalogId);
  },
});

const state = {
  mode: "explore",
  sceneId: "fullstack",
  catalogId: null,
  launchId: null,
  teachTab: "overview",
  physicsUnlocked: false,
  launches: null,
  launchFilter: "all",
  launchSource: "live",
  catalogFamily: "all",
  catalogQuery: "",
  pendingCatalog: null,
};

function catalogFrameTarget(entry) {
  if (
    entry.id === "grid-fins" &&
    (state.catalogFamily === "falcon" || viewer.sceneId === "falcon9" || viewer.sceneId === "falconheavy")
  ) {
    return { sceneId: "falcon9", partId: "falcon9.fins" };
  }
  return frameTargetForCatalog(entry, viewer.sceneId);
}

function frameCatalogIn3D(id) {
  const entry = catalogById(id);
  if (!entry) return;
  const { sceneId, partId } = catalogFrameTarget(entry);
  if (viewer.sceneId !== sceneId) selectScene(sceneId, { partId });
  viewer.highlightById(partId, { frame: true });
}

function setMode(mode) {
  const prev = state.mode;
  state.mode = mode;
  app.dataset.mode = mode;
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  if (mode !== "explore") hideCallout();
  if (mode === "live") {
    live.activate();
    viewer.setPaused(true);
    state.catalogId = null;
    live.clearSelection();
    showTeach(null);
  } else if (prev === "live") {
    live.deactivate();
    viewer.setPaused(false);
    // Hotspot picks skip 3D while Live is open; frame the tagged part when leaving.
    if (state.catalogId && mode === "explore") {
      frameCatalogIn3D(state.catalogId);
    }
  }
  if (mode === "learn") {
    renderCatalog();
    if (state.catalogId) {
      // Re-frame the highlighted row when arriving from Tracker / Explore / Live.
      if (prev !== "learn") selectCatalog(state.catalogId);
      else showTeach(catalogById(state.catalogId));
    } else {
      showTeach(null);
    }
  }
  if (mode === "tracker") frameTrackerLaunch();
}

function renderNav(activeId, relatedSceneIds = []) {
  nav.innerHTML = "";
  viewer.scenes().forEach((scene, index) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scene-btn";
    if (scene.id === activeId) btn.classList.add("active");
    if (relatedSceneIds.includes(scene.id)) btn.classList.add("related");
    btn.dataset.id = scene.id;
    const key = index < 9 ? String(index + 1) : index === 9 ? "0" : index === 10 ? "-" : "";
    btn.innerHTML = `${scene.name}<small>${key ? `${key} · ` : ""}${scene.summary}</small>`;
    if (scene.expand) btn.title = scene.expand;
    btn.addEventListener("click", () => selectScene(scene.id));
    nav.appendChild(btn);
  });
}

function applyExplodeButton(spec) {
  const allowed = Boolean(viewer.root?.userData.supportsExplode);
  btnExplode.disabled = !allowed;
  btnExplode.setAttribute("aria-pressed", "false");
  btnExplode.title = allowed ? `${spec.explodeHint} (E)` : "Explode not used on this scene";
}

function selectScene(id, { partId, framePart = true } = {}) {
  let spec;
  try {
    spec = viewer.load(id, { partId, framePart });
  } catch (err) {
    console.error("Failed to load scene", id, err);
    renderNav(id);
    return null;
  }
  state.sceneId = spec.id;
  renderNav(spec.id);
  telHeight.textContent = spec.height;
  telDia.textContent = spec.diameter;
  applyExplodeButton(spec);
  hideCallout();
  return spec;
}

function hideCallout() {
  callout.classList.add("hidden");
  btnTeach.classList.add("hidden");
  state.pendingCatalog = null;
}

function showCallout(part) {
  if (!part || state.mode !== "explore") {
    hideCallout();
    return;
  }
  calloutTitle.textContent = part.name;
  calloutBody.textContent = part.blurb;
  callout.classList.remove("hidden");
  const entry = findCatalogByPart(part);
  state.pendingCatalog = entry;
  btnTeach.classList.toggle("hidden", !entry);
}

function syncPhysicsTab() {
  const locked = !state.physicsUnlocked;
  tabPhysics.disabled = locked;
  tabPhysics.title = locked ? "Unlock with the link below" : "Physics notes";
  tabPhysics.setAttribute(
    "aria-label",
    locked ? "Physics (locked). Unlock with the link below." : "Physics notes",
  );
  btnPhysics.classList.toggle("hidden", !locked);
}

function showTeach(entry) {
  syncPhysicsTab();
  syncReferencePhotos(entry);
  if (!entry) {
    const liveMode = state.mode === "live";
    teachMeta.textContent = liveMode ? "Live Launch" : "Learn";
    teachTitle.textContent = liveMode ? "Select a tagged component" : "Select a component";
    teachBlurb.textContent = liveMode
      ? "Turn on Hotspots (toolbar or H) and click a tag on the stream, or pick a name in the list. Overview / History / Function / Sources / Physics use the same catalog as Learn."
      : "Pick an entry in the catalog. The 3D view will focus that part.";
    teachBody.innerHTML = "";
    return;
  }
  teachMeta.textContent = `${entry.family} · ${entry.category} · ${entry.domain}`;
  teachTitle.textContent = entry.name;
  teachBlurb.textContent = entry.blurb;
  const tab = state.teachTab === "physics" && !state.physicsUnlocked ? "overview" : state.teachTab;
  state.teachTab = tab;
  document.querySelectorAll(".tab").forEach((el) => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  if (tab === "sources") {
    const items = (entry.sources || [])
      .map(
        (s) =>
          `<li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label}</a></li>`,
      )
      .join("");
    teachBody.innerHTML = items
      ? `<p>Public architecture references — not drawings of flight hardware.</p><ul class="sources">${items}</ul>`
      : `<p>No public sources recorded for this entry.</p>`;
    return;
  }
  if (tab === "overview") {
    const extra = entry.expand ? ` — ${entry.expand}` : "";
    teachBody.innerHTML = `<p>At a glance: <strong>${entry.category}</strong> · ${entry.family} · ${entry.domain}${extra}.</p>
      <p>The lede above is the short briefing. Open <strong>History</strong> for the public timeline, <strong>Function</strong> for what the hardware does, and <strong>Sources</strong> for citations. Physics notes stay collapsed until you opt in.</p>`;
    return;
  }
  const text = tab === "history" ? entry.history : tab === "function" ? entry.function : entry.physics;
  teachBody.innerHTML = `<p>${text}</p>`;
}

function selectCatalog(id, { loadScene = true } = {}) {
  const entry = catalogById(id);
  if (!entry) return;
  state.catalogId = id;
  renderCatalog();
  if (state.mode !== "live") {
    const { sceneId, partId } = catalogFrameTarget(entry);
    if (loadScene) {
      if (viewer.sceneId !== sceneId) selectScene(sceneId, { partId });
      else viewer.highlightById(partId, { frame: true });
    } else {
      viewer.highlightById(partId, { frame: true });
    }
  }
  showTeach(entry);
}

function renderCatalog() {
  const rows = searchCatalog(state.catalogQuery, state.catalogFamily);
  catalogNav.innerHTML = "";
  if (!rows.length) {
    catalogNav.innerHTML = `<p class="hint">No matching components.</p>`;
    if (state.mode === "learn") showTeach(null);
    return;
  }
  if (state.mode === "learn") {
    const visible = rows.find((e) => e.id === state.catalogId);
    showTeach(visible || null);
  }
  for (const entry of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cat-btn${entry.id === state.catalogId ? " active" : ""}`;
    btn.innerHTML = `${entry.name}<small>${entry.expand || `${entry.family} · ${entry.category}`}</small>`;
    btn.title = entry.expand || `${entry.family} · ${entry.category}`;
    btn.addEventListener("click", () => {
      setMode("learn");
      selectCatalog(entry.id);
    });
    catalogNav.appendChild(btn);
  }
}

function renderLaunches() {
  const data = state.launches;
  launchList.innerHTML = "";
  if (!data) {
    launchList.innerHTML = `<p class="hint">Fetching Launch Library 2…</p>`;
    return;
  }
  const sections = [
    ["Upcoming", data.upcoming],
    ["Recent", data.recent],
  ];
  let shown = 0;
  for (const [label, list] of sections) {
    const filtered = list.filter((l) => launchMatchesFilter(l, state.launchFilter));
    if (!filtered.length) continue;
    const h = document.createElement("p");
    h.className = "section-label";
    h.textContent = label;
    launchList.appendChild(h);
    for (const launch of filtered) {
      shown += 1;
      const card = document.createElement("button");
      card.type = "button";
      card.className = `launch-card${launch.id === state.launchId ? " active" : ""}`;
      const when = trackerWhenLine(launch);
      const t = trackerCountdown(launch);
      const chips = launch.relatedIds
        .map((id) => {
          const e = catalogById(id);
          return e
            ? `<span class="mini-chip" data-cat="${e.id}" title="${e.expand || e.name}">${e.name}</span>`
            : "";
        })
        .join("");
      const tip = statusTip(launch.status, launch.statusLabel);
      const netTitle =
        "NET means No Earlier Than — the vehicle will not launch before this time.";
      card.innerHTML = `
        <div class="row"><strong>${launch.mission}</strong><span class="status ${launch.status}" title="${tip}" aria-label="${tip}">${launch.statusLabel}</span></div>
        <span class="meta">${launch.vehicle} · ${launch.pad}</span>
        <span class="meta">${launch.site}${t ? ` · ${t}` : ""}</span>
        <span class="meta" title="${netTitle}">${when}</span>
        <div class="related">${chips}</div>
      `;
      card.addEventListener("click", (ev) => {
        const chip = ev.target.closest("[data-cat]");
        if (chip) {
          ev.preventDefault();
          setMode("learn");
          selectCatalog(chip.dataset.cat);
          return;
        }
        selectLaunch(launch);
      });
      launchList.appendChild(card);
    }
  }
  if (!shown) launchList.innerHTML = `<p class="hint">No launches in this filter.</p>`;
}

function selectLaunch(launch) {
  state.launchId = launch.id;
  renderLaunches();
  const relatedScenes = [...new Set(launch.relatedIds.map((id) => catalogById(id)?.sceneId).filter(Boolean))];
  // Frame the whole vehicle / pad — never zoom into the first related engine mesh.
  selectScene(launch.sceneId);
  renderNav(launch.sceneId, relatedScenes);
}

function launchesInView() {
  const data = state.launches;
  if (!data) return [];
  const rows = [];
  for (const list of [data.upcoming, data.recent]) {
    for (const launch of list || []) {
      if (launchMatchesFilter(launch, state.launchFilter)) rows.push(launch);
    }
  }
  return rows;
}

function launchById(id) {
  if (!id || !state.launches) return null;
  return [...(state.launches.upcoming || []), ...(state.launches.recent || [])].find((l) => l.id === id) || null;
}

function frameTrackerLaunch({ preferFirst = false } = {}) {
  const rows = launchesInView();
  if (!rows.length) return;
  const current = preferFirst ? null : launchById(state.launchId);
  const pick = current && launchMatchesFilter(current, state.launchFilter) ? current : rows[0];
  if (pick) selectLaunch(pick);
}

function syncLiveSampleChips(source, prefer) {
  const liveBtn = document.querySelector('#tracker-source [data-source="live"]');
  const sampleBtn = document.querySelector('#tracker-source [data-source="sample"]');
  if (!liveBtn || !sampleBtn) return;
  liveBtn.classList.toggle("active", prefer === "live");
  sampleBtn.classList.toggle("active", prefer === "sample");
  const fallback = prefer === "live" && source !== "live";
  liveBtn.classList.toggle("is-fallback", fallback);
  if (fallback) {
    liveBtn.textContent = "Live (offline)";
    liveBtn.title =
      "Launch Library 2 was unreachable. Showing the sample teaching set — not live data. Tap Refresh to retry.";
  } else {
    liveBtn.textContent = "Live data";
    liveBtn.title =
      "Live upcoming and recent SpaceX launches from Launch Library 2 (The Space Devs) — not official SpaceX telemetry.";
  }
}

async function refreshLaunches({ preferFirst = false } = {}) {
  const prefer = state.launchSource === "sample" ? "sample" : "live";
  trackerBanner.textContent = prefer === "sample" ? "Loading sample missions…" : "Refreshing Launch Library 2…";
  trackerBanner.classList.remove("sample", "live");
  btnRefresh.disabled = true;
  try {
    const data = await loadLaunches({ prefer });
    state.launches = data;
    if (data.source === "live") {
      trackerBanner.textContent = `Live data · Launch Library 2 (The Space Devs). Updated ${formatUtc(data.fetchedAt)}. Not official SpaceX telemetry.`;
      trackerBanner.classList.add("live");
      trackerBanner.classList.remove("sample");
    } else if (prefer === "sample") {
      trackerBanner.textContent =
        "Sample · cached teaching missions (not live). Switch to Live data to query Launch Library 2.";
      trackerBanner.classList.add("sample");
    } else {
      trackerBanner.textContent =
        "Live data unavailable · showing the sample teaching set (network, CORS, or free-tier rate limit). Optional VITE_LL2_API_KEY raises the paid-tier rate limit.";
      trackerBanner.classList.add("sample");
    }
    syncLiveSampleChips(data.source, prefer);
    renderLaunches();
    live.setLaunchWindow(nextStarshipWindow(data), { source: data.source });
    if (preferFirst) frameTrackerLaunch({ preferFirst: true });
    else if (state.mode === "tracker") {
      const current = launchById(state.launchId);
      if (!current || !launchMatchesFilter(current, state.launchFilter)) {
        frameTrackerLaunch({ preferFirst: true });
      }
    }
  } finally {
    btnRefresh.disabled = false;
  }
}

viewer.onSelect = (part) => {
  if (state.mode === "learn") {
    const entry = findCatalogByPart(part);
    if (entry) {
      state.catalogId = entry.id;
      renderCatalog();
      showTeach(entry);
    } else if (part) {
      teachMeta.textContent = "Mesh pick";
      teachTitle.textContent = part.name;
      teachBlurb.textContent = part.blurb;
      teachBody.innerHTML = "";
    }
    return;
  }
  showCallout(part);
};

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

btnExplode.addEventListener("click", () => {
  const next = btnExplode.getAttribute("aria-pressed") !== "true";
  const { allowed } = viewer.setExplode(next);
  btnExplode.setAttribute("aria-pressed", allowed && next ? "true" : "false");
});

btnIdle.addEventListener("click", () => {
  const next = btnIdle.getAttribute("aria-pressed") !== "true";
  const on = viewer.setIdleRotate(next);
  btnIdle.setAttribute("aria-pressed", on ? "true" : "false");
});

function resetView() {
  viewer.resetCamera();
  btnExplode.setAttribute("aria-pressed", "false");
}
btnReset.addEventListener("click", () => resetView());
btnShot.addEventListener("click", () => viewer.screenshot());
btnHelp.addEventListener("click", () => help.classList.toggle("hidden"));
btnRefresh.addEventListener("click", () => refreshLaunches());
document.getElementById("help-close").addEventListener("click", () => help.classList.add("hidden"));
document.getElementById("callout-close").addEventListener("click", () => {
  viewer.clearSelection();
  hideCallout();
});
btnTeach.addEventListener("click", () => {
  if (!state.pendingCatalog) return;
  const id = state.pendingCatalog.id;
  setMode("learn");
  selectCatalog(id);
});

document.querySelectorAll("#tracker-source .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.launchSource = chip.dataset.source;
    document.querySelectorAll("#tracker-source .chip").forEach((c) => c.classList.toggle("active", c === chip));
    refreshLaunches({ preferFirst: true });
  });
});

document.querySelectorAll("#launch-filters .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.launchFilter = chip.dataset.filter;
    document.querySelectorAll("#launch-filters .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderLaunches();
    if (state.mode === "tracker") {
      const current = launchById(state.launchId);
      if (!current || !launchMatchesFilter(current, state.launchFilter)) {
        frameTrackerLaunch({ preferFirst: true });
      }
    }
  });
});

document.querySelectorAll("#catalog-filters .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.catalogFamily = chip.dataset.family;
    document.querySelectorAll("#catalog-filters .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderCatalog();
  });
});

catalogSearch.addEventListener("input", () => {
  state.catalogQuery = catalogSearch.value;
  renderCatalog();
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.dataset.tab === "physics" && !state.physicsUnlocked) return;
    state.teachTab = tab.dataset.tab;
    showTeach(catalogById(state.catalogId));
  });
});

btnPhysics.addEventListener("click", () => {
  state.physicsUnlocked = true;
  state.teachTab = "physics";
  showTeach(catalogById(state.catalogId));
});

window.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
  const key = event.key.toLowerCase();
  if (key === "t") setMode("tracker");
  if (key === "v") setMode("explore");
  if (key === "l") setMode("learn");
  if (key === "y") setMode("live");
  if (key === "?" || (event.shiftKey && key === "/")) help.classList.toggle("hidden");
  if (key === "escape") {
    help.classList.add("hidden");
    viewer.clearSelection();
    hideCallout();
    if (state.mode === "live") {
      live.clearSelection();
      state.catalogId = null;
      showTeach(null);
    }
  }
  if (key === "f") {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }
  if (state.mode === "live") {
    if (key === "h") live.toggleHotspots();
    return;
  }
  if (key === "r") resetView();
  if (key === "i") btnIdle.click();
  if (key === "s") {
    event.preventDefault();
    viewer.screenshot();
  }
  if (key === "e") btnExplode.click();
  if (key === "0") {
    const scene = viewer.scenes()[9];
    if (scene) selectScene(scene.id);
  }
  if (key === "-" || key === "_") {
    const scene = viewer.scenes()[10];
    if (scene) selectScene(scene.id);
  }
  if (key >= "1" && key <= "9") {
    const scene = viewer.scenes()[Number(key) - 1];
    if (scene) selectScene(scene.id);
  }
});

selectScene("fullstack");
renderCatalog();
refreshLaunches();
setInterval(refreshLaunches, REFRESH_MS);
