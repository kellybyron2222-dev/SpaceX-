import "./style.css";
import { Viewer } from "./viewer.js";
import { CATALOG, catalogById, findCatalogByPart, searchCatalog } from "./data/catalog.js";
import { countdown, formatUtc, loadLaunches, REFRESH_MS } from "./data/launches.js";
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
    live.setSelected(state.catalogId);
    showTeach(state.catalogId ? catalogById(state.catalogId) : null);
  } else if (prev === "live") {
    live.deactivate();
    viewer.setPaused(false);
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
    const key = index < 9 ? String(index + 1) : index === 9 ? "0" : "";
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

function showTeach(entry) {
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
  tabPhysics.disabled = !state.physicsUnlocked;
  btnPhysics.classList.toggle("hidden", state.physicsUnlocked);
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
  const text =
    tab === "history" ? entry.history : tab === "function" ? entry.function : tab === "physics" ? entry.physics : entry.blurb;
  teachBody.innerHTML = `<p>${text}</p>`;
}

function selectCatalog(id, { loadScene = true } = {}) {
  const entry = catalogById(id);
  if (!entry) return;
  state.catalogId = id;
  renderCatalog();
  if (state.mode !== "live") {
    if (loadScene) {
      if (viewer.sceneId !== entry.sceneId) selectScene(entry.sceneId, { partId: entry.partId });
      else viewer.highlightById(entry.partId, { frame: true });
    } else {
      viewer.highlightById(entry.partId, { frame: true });
    }
  }
  showTeach(entry);
}

function renderCatalog() {
  const rows = searchCatalog(state.catalogQuery, state.catalogFamily);
  catalogNav.innerHTML = "";
  if (!rows.length) {
    catalogNav.innerHTML = `<p class="hint">No matching components.</p>`;
    return;
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

function launchMatchesFilter(launch, filter) {
  if (filter === "all") return true;
  const blob = `${launch.vehicle} ${launch.mission}`.toLowerCase();
  if (filter === "starship") return blob.includes("starship") || blob.includes("super heavy");
  if (filter === "heavy") return blob.includes("heavy");
  if (filter === "falcon9") return blob.includes("falcon 9") && !blob.includes("heavy");
  return true;
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
      const when = formatUtc(launch.net);
      const t = launch.status === "success" || launch.status === "failure" || launch.status === "scrub" ? "" : countdown(launch.net);
      const window =
        launch.windowStart && launch.windowEnd && launch.windowStart !== launch.windowEnd
          ? `Window ${formatUtc(launch.windowStart)} → ${formatUtc(launch.windowEnd).split("·").pop().trim()}`
          : "T-0 / NET as reported";
      const chips = launch.relatedIds
        .map((id) => {
          const e = catalogById(id);
          return e
            ? `<span class="mini-chip" data-cat="${e.id}" title="${e.expand || e.name}">${e.name}</span>`
            : "";
        })
        .join("");
      card.innerHTML = `
        <div class="row"><strong>${launch.mission}</strong><span class="status ${launch.status}">${launch.statusLabel}</span></div>
        <span class="meta">${launch.vehicle} · ${launch.pad}</span>
        <span class="meta">${launch.site}${t ? ` · ${t}` : ""}</span>
        <span class="meta">${when} · ${window}</span>
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

async function refreshLaunches() {
  const prefer = state.launchSource === "sample" ? "sample" : "live";
  trackerBanner.textContent = prefer === "sample" ? "Loading sample missions…" : "Refreshing Launch Library 2…";
  trackerBanner.classList.remove("sample", "live");
  btnRefresh.disabled = true;
  try {
    const data = await loadLaunches({ prefer });
    state.launches = data;
    if (data.source === "live") {
      trackerBanner.textContent = `Live LL2 · public data from Launch Library 2 (The Space Devs). Updated ${formatUtc(data.fetchedAt)}. Not official SpaceX telemetry.`;
      trackerBanner.classList.add("live");
      trackerBanner.classList.remove("sample");
    } else if (prefer === "sample") {
      trackerBanner.textContent =
        "Sample · cached teaching missions (not live). Switch to Live LL2 to query Launch Library 2.";
      trackerBanner.classList.add("sample");
    } else {
      trackerBanner.textContent =
        "Sample fallback · live Launch Library 2 was unavailable (network, CORS, or free-tier rate limit). Optional VITE_LL2_API_KEY raises the paid-tier rate limit.";
      trackerBanner.classList.add("sample");
    }
    renderLaunches();
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
    refreshLaunches();
  });
});

document.querySelectorAll("#launch-filters .chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    state.launchFilter = chip.dataset.filter;
    document.querySelectorAll("#launch-filters .chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderLaunches();
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
  if (key >= "1" && key <= "9") {
    const scene = viewer.scenes()[Number(key) - 1];
    if (scene) selectScene(scene.id);
  }
});

selectScene("fullstack");
renderCatalog();
refreshLaunches();
setInterval(refreshLaunches, REFRESH_MS);
