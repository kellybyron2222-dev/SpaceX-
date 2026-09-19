import "./style.css";
import { Viewer } from "./viewer.js";
import { CATALOG, catalogById, findCatalogByPart, frameTargetForCatalog, searchCatalog } from "./data/catalog.js";
import { fillReferenceFigure, photoForCatalog } from "./data/referencePhotos.js";
import {
  formatUtc,
  loadLaunches,
  nextStarshipWindow,
  isStarshipLaunch,
  REFRESH_MS,
  statusTip,
  launchMatchesFilter,
  trackerCountdown,
  trackerWhenLine,
} from "./data/launches.js";
import { createLiveLaunch } from "./live.js";
import {
  hasDeepLink,
  inferredMode,
  parseDeepLink,
  replaceShareUrl,
  serializeDeepLink,
} from "./data/deeplink.js";
import { calloutKicker, peelBusy, peelHintFor, teachLabel, whyShapeFor } from "./data/teachingPeel.js";
import { sceneForWebcast, webcastPose } from "./data/webcastCamera.js";

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
const btnCutaway = document.getElementById("btn-cutaway");
const btnScale = document.getElementById("btn-scale");
const btnWhy = document.getElementById("btn-why");
const btnWebcast = document.getElementById("btn-webcast");
const btnLiveMatch = document.getElementById("btn-live-match");
const whyShape = document.getElementById("why-shape");
const whyShapeList = document.getElementById("why-shape-list");
const btnReassemble = document.getElementById("btn-reassemble");
const btnCalloutTogether = document.getElementById("btn-callout-together");
const calloutKickerEl = document.getElementById("callout-kicker");
const calloutHint = document.getElementById("callout-hint");
const peelHint = document.getElementById("peel-hint");
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

let shareReady = false;

const live = createLiveLaunch({
  onSelect(catalogId) {
    selectCatalog(catalogId);
  },
  onShareChange() {
    syncShareUrl();
  },
  onLearn(catalogId) {
    setMode("learn");
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
  whyOn: false,
};

function shareQuery() {
  const snap = live.shareSnapshot();
  const catalogId = state.mode === "live" ? snap.catalogId : state.catalogId;
  return serializeDeepLink({
    mode: state.mode,
    id: catalogId || "",
    scene: state.sceneId,
    preset: state.mode === "live" ? snap.presetId : "",
    video: state.mode === "live" ? snap.videoId : "",
    hotspots: state.mode === "live" ? snap.hotspotsOn : false,
    commentary: state.mode === "live" ? snap.commentaryOn : false,
    phase: state.mode === "live" && snap.commentaryOn ? snap.beatId : "",
  });
}

function syncShareUrl() {
  if (!shareReady) return;
  replaceShareUrl(shareQuery(), window.location, window.history);
}

function applyDeepLink(link) {
  const catalogId = link.id || link.hotspot;
  const mode = inferredMode(link) || state.mode;

  if (mode === "live") {
    live.applyShareLink({
      videoId: link.video || undefined,
      hotspots: link.hotspots,
    });
    setMode("live");
    live.applyShareLink({
      presetId: link.preset || undefined,
      hotspotId: catalogId || undefined,
      hotspots: link.hotspots,
      commentary: link.commentary || undefined,
      phase: link.phase || undefined,
    });
    return;
  }

  if (mode === "learn") {
    setMode("learn");
    if (catalogId && catalogById(catalogId)) selectCatalog(catalogId);
    return;
  }

  if (mode === "explore") {
    if (link.scene && viewer.scenes().some((s) => s.id === link.scene)) {
      selectScene(link.scene);
    }
    setMode("explore");
    if (catalogId && catalogById(catalogId)) frameCatalogIn3D(catalogId);
    return;
  }

  if (mode === "tracker") setMode("tracker");
}

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
  syncShareUrl();
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
    const key =
      index < 9 ? String(index + 1) : index === 9 ? "0" : index === 10 ? "-" : index === 11 ? "=" : "";
    btn.innerHTML = `${scene.name}<small>${key ? `${key} · ` : ""}${scene.summary}</small>`;
    if (scene.expand) btn.title = scene.expand;
    btn.addEventListener("click", () => selectScene(scene.id));
    nav.appendChild(btn);
  });
}

function syncPeelChrome() {
  const peel = viewer.peelState();
  const spec = viewer.scenes().find((s) => s.id === viewer.sceneId);
  btnExplode.disabled = !peel.supportsExplode;
  btnExplode.setAttribute("aria-pressed", peel.explode ? "true" : "false");
  btnExplode.title = peel.supportsExplode
    ? `${spec?.explodeHint || "Float the parts apart"} (E)`
    : "Explode not used on this scene";
  btnCutaway.disabled = !peel.supportsCutaway;
  btnCutaway.setAttribute("aria-pressed", peel.cutaway ? "true" : "false");
  btnCutaway.title = peel.supportsCutaway ? "Open the tank shells (X)" : "Cutaway is for tank scenes";
  btnScale.disabled = !peel.supportsScale;
  btnScale.setAttribute("aria-pressed", peel.scale ? "true" : "false");
  btnScale.title = peel.supportsScale
    ? "Person (~1.8 m) and Falcon 9 (~70 × 3.7 m) beside Super Heavy"
    : "Scale figures are on the Super Heavy scenes";
  const busy = peelBusy(peel);
  btnReassemble.disabled = !busy;
  btnCalloutTogether.classList.toggle("hidden", !busy);
  if (peelHint) peelHint.textContent = peelHintFor(viewer.sceneId);
  const whyRows = whyShapeFor(viewer.sceneId);
  btnWhy.disabled = !whyRows.length;
  btnWhy.setAttribute("aria-pressed", state.whyOn && whyRows.length ? "true" : "false");
  btnWhy.title = whyRows.length ? "Why this shape" : "Why this shape is for the stack scenes";
  renderWhyShape();
}

function renderWhyShape() {
  const rows = whyShapeFor(viewer.sceneId);
  const show = state.whyOn && rows.length && state.mode === "explore";
  app.dataset.why = show ? "1" : "0";
  whyShape.classList.toggle("hidden", !show);
  if (!show) {
    whyShapeList.innerHTML = "";
    return;
  }
  const isolated = viewer.peelState().isolateId;
  whyShapeList.innerHTML = "";
  for (const row of rows) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `why-row${row.partId === isolated ? " active" : ""}`;
    btn.innerHTML = `<strong>${row.title}</strong><span>${row.body}</span>`;
    btn.addEventListener("click", () => {
      viewer.highlightById(row.partId, { frame: true });
      const part = viewer.findByPartId(row.partId)?.userData?.part;
      if (state.mode === "explore") showCallout(part);
      syncPeelChrome();
    });
    whyShapeList.appendChild(btn);
  }
}

function applyExplodeButton() {
  syncPeelChrome();
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
  syncShareUrl();
  return spec;
}

function hideCallout() {
  callout.classList.add("hidden");
  btnTeach.classList.add("hidden");
  btnCalloutTogether.classList.add("hidden");
  state.pendingCatalog = null;
  syncPeelChrome();
}

function showCallout(part) {
  if (!part || state.mode !== "explore") {
    hideCallout();
    return;
  }
  calloutTitle.textContent = teachLabel(part);
  calloutBody.textContent = part.blurb;
  const peel = viewer.peelState();
  calloutKickerEl.textContent = calloutKicker(peel);
  if (peel.isolateId) {
    calloutHint.textContent = "The rest of the stack faded. Click this piece again, or Put back together.";
  } else if (peel.explode) {
    calloutHint.textContent = "Pieces are floated apart. Click one to isolate it.";
  } else {
    calloutHint.textContent = "Click another piece to isolate it. Explode floats the whole system apart.";
  }
  callout.classList.remove("hidden");
  const entry = findCatalogByPart(part);
  state.pendingCatalog = entry;
  btnTeach.classList.toggle("hidden", !entry);
  syncPeelChrome();
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
      ? "Start commentary (C) for play-by-play, Copy share link for a bot URL, or Hotspots (H) then pick a tag. YouTube ads cannot be stripped. Same Learn catalog."
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
      ? `<p>These are public pages. Not SpaceX drawings, and not flight-hardware specs.</p><ul class="sources">${items}</ul>`
      : `<p>No public source list on this card yet.</p>`;
    return;
  }
  if (tab === "overview") {
    teachBody.innerHTML = `<p>${entry.overview || entry.blurb}</p>`;
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
  syncShareUrl();
  syncPeelChrome();
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
      const liveChip = isStarshipLaunch(launch)
        ? `<span class="mini-chip" data-live="1" title="Open Live Launch Commentator on the playable Starship VOD">Live Launch</span>`
        : "";
      const tip = statusTip(launch.status, launch.statusLabel);
      const netTitle =
        "NET means No Earlier Than — the vehicle will not launch before this time.";
      card.innerHTML = `
        <div class="row"><strong>${launch.mission}</strong><span class="status ${launch.status}" title="${tip}" aria-label="${tip}">${launch.statusLabel}</span></div>
        <span class="meta">${launch.vehicle} · ${launch.pad}</span>
        <span class="meta">${launch.site}${t ? ` · ${t}` : ""}</span>
        <span class="meta" title="${netTitle}">${when}</span>
        <div class="related">${liveChip}${chips}</div>
      `;
      card.addEventListener("click", (ev) => {
        const liveGo = ev.target.closest("[data-live]");
        if (liveGo) {
          ev.preventDefault();
          setMode("live");
          live.applyShareLink({ commentary: true });
          return;
        }
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
    live.setLaunchWindow(nextStarshipWindow(data), { source: data.source, bundle: data });
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
      teachTitle.textContent = teachLabel(part);
      teachBlurb.textContent = part.blurb;
      teachBody.innerHTML = "";
    }
    syncPeelChrome();
    return;
  }
  showCallout(part);
};

document.querySelectorAll(".mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

btnExplode.addEventListener("click", () => {
  const next = btnExplode.getAttribute("aria-pressed") !== "true";
  viewer.setExplode(next);
  syncPeelChrome();
});

btnCutaway.addEventListener("click", () => {
  const next = btnCutaway.getAttribute("aria-pressed") !== "true";
  viewer.setCutaway(next);
  syncPeelChrome();
});

btnScale.addEventListener("click", () => {
  const next = btnScale.getAttribute("aria-pressed") !== "true";
  viewer.setScale(next);
  syncPeelChrome();
});

btnWhy.addEventListener("click", () => {
  if (btnWhy.disabled) return;
  state.whyOn = btnWhy.getAttribute("aria-pressed") !== "true";
  syncPeelChrome();
});

function matchWebcastCamera() {
  const pose = webcastPose();
  const sceneId = sceneForWebcast();
  setMode("explore");
  if (viewer.sceneId !== sceneId) selectScene(sceneId);
  viewer.applyPose(pose);
  const idleOff = viewer.setIdleRotate(false);
  btnIdle.setAttribute("aria-pressed", idleOff ? "true" : "false");
}

btnWebcast.addEventListener("click", () => matchWebcastCamera());
btnLiveMatch.addEventListener("click", () => matchWebcastCamera());

function putBackTogether() {
  viewer.reassemble();
  viewer.clearSelection();
  hideCallout();
  syncPeelChrome();
}

btnReassemble.addEventListener("click", () => putBackTogether());
btnCalloutTogether.addEventListener("click", () => putBackTogether());

btnIdle.addEventListener("click", () => {
  const next = btnIdle.getAttribute("aria-pressed") !== "true";
  const on = viewer.setIdleRotate(next);
  btnIdle.setAttribute("aria-pressed", on ? "true" : "false");
});

function resetView() {
  viewer.resetCamera();
  hideCallout();
  syncPeelChrome();
}
btnReset.addEventListener("click", () => resetView());
btnShot.addEventListener("click", () => viewer.screenshot());
btnHelp.addEventListener("click", () => help.classList.toggle("hidden"));
btnRefresh.addEventListener("click", () => refreshLaunches());
document.getElementById("help-close").addEventListener("click", () => help.classList.add("hidden"));
document.getElementById("callout-close").addEventListener("click", () => {
  viewer.isolateById(null);
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
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    event.target instanceof HTMLSelectElement
  ) {
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "t") setMode("tracker");
  if (key === "v") setMode("explore");
  if (key === "l") setMode("learn");
  if (key === "y") setMode("live");
  if (key === "?" || (event.shiftKey && key === "/")) help.classList.toggle("hidden");
  if (key === "escape") {
    help.classList.add("hidden");
    viewer.isolateById(null);
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
    if (key === "c") live.toggleCommentary();
    if (key === "w") matchWebcastCamera();
    return;
  }
  if (key === "r") resetView();
  if (key === "i") btnIdle.click();
  if (key === "s") {
    event.preventDefault();
    viewer.screenshot();
  }
  if (key === "e") btnExplode.click();
  if (key === "x") btnCutaway.click();
  if (key === "b") putBackTogether();
  if (key === "w") matchWebcastCamera();
  if (key === "0") {
    const scene = viewer.scenes()[9];
    if (scene) selectScene(scene.id);
  }
  if (key === "-" || key === "_") {
    const scene = viewer.scenes()[10];
    if (scene) selectScene(scene.id);
  }
  if (key === "=" || key === "+") {
    const scene = viewer.scenes()[11];
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

const incoming = parseDeepLink(window.location.search, window.location.hash);
if (hasDeepLink(incoming)) applyDeepLink(incoming);
shareReady = true;
if (hasDeepLink(incoming)) syncShareUrl();
