import overlayConfig from "./data/live/overlays.json";
import { catalogById } from "./data/catalog.js";
import {
  loadHotspotsVisible,
  parseYouTubeId,
  resolveDefaultVideoId,
  STORAGE_KEY,
  storeHotspotsVisible,
  storeVideoId,
} from "./data/live/youtube.js";

const YT_ERRORS = {
  2: "Invalid YouTube video ID.",
  5: "This stream cannot play in HTML5.",
  100: "Video not found or is private.",
  101: "Embedding is disabled for this video.",
  150: "Embedding is disabled for this video.",
};

function formatTime(s) {
  if (!Number.isFinite(s) || s < 0) return "—";
  const t = Math.floor(s);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* ignore */
      }
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube API ready without Player"));
    };
    if (!document.querySelector("script[data-yt-iframe-api]")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.dataset.ytIframeApi = "1";
      tag.onerror = () => reject(new Error("YouTube IFrame API failed to load"));
      document.head.appendChild(tag);
    }
    window.setTimeout(() => {
      if (window.YT?.Player) resolve(window.YT);
    }, 10000);
  });
}

function hotspotCentroid(hs) {
  if (hs.shape === "polygon" && hs.points?.length) {
    const xs = hs.points.map((p) => p[0]);
    const ys = hs.points.map((p) => p[1]);
    return {
      x: xs.reduce((a, b) => a + b, 0) / xs.length,
      y: ys.reduce((a, b) => a + b, 0) / ys.length,
    };
  }
  return { x: hs.x + hs.w / 2, y: hs.y + hs.h / 2 };
}

function svgEl(name, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function createLiveLaunch({ onSelect }) {
  const stage = document.getElementById("live-stage");
  const host = document.getElementById("live-player-host");
  const overlay = document.getElementById("live-overlay");
  const svg = document.getElementById("live-hotspots");
  const labels = document.getElementById("live-labels");
  const urlInput = document.getElementById("live-url");
  const btnLoad = document.getElementById("btn-live-load");
  const btnReset = document.getElementById("btn-live-default");
  const btnHotspots = document.getElementById("btn-hotspots");
  const presetNav = document.getElementById("live-presets");
  const chapterNav = document.getElementById("live-chapters");
  const hotspotNav = document.getElementById("live-hotspot-list");
  const clock = document.getElementById("live-clock");
  const errBox = document.getElementById("live-player-error");
  const banner = document.getElementById("live-banner");
  const openLink = document.getElementById("live-open-yt");
  const follow = document.getElementById("live-follow-chapters");
  const presetBlurb = document.getElementById("live-preset-blurb");

  const presets = overlayConfig.presets || [];
  const chapters = overlayConfig.chapters || [];
  const fallbackId = overlayConfig.defaultVideoId || "hI9HQfCAw64";

  const state = {
    active: false,
    videoId: resolveDefaultVideoId(fallbackId),
    presetId: presets[0]?.id || "stack-on-pad",
    catalogId: null,
    hotspotsOn: loadHotspotsVisible(true),
    followChapters: true,
    isLive: false,
    duration: 0,
    player: null,
    poll: 0,
    manualUntil: 0,
  };

  function showError(msg) {
    if (!msg) {
      errBox.classList.add("hidden");
      errBox.textContent = "";
      return;
    }
    errBox.textContent = msg;
    errBox.classList.remove("hidden");
  }

  function currentPreset() {
    return presets.find((p) => p.id === state.presetId) || presets[0] || null;
  }

  function youtubeWatchUrl(id) {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  function syncChrome() {
    urlInput.value = state.videoId;
    openLink.href = youtubeWatchUrl(state.videoId);
    btnHotspots.setAttribute("aria-pressed", state.hotspotsOn ? "true" : "false");
    overlay.classList.toggle("is-hidden", !state.hotspotsOn);
    overlay.classList.toggle("hotspots-off", !state.hotspotsOn);
    follow.checked = state.followChapters;
    follow.disabled = state.isLive;
    const preset = currentPreset();
    presetBlurb.textContent = preset?.blurb || "";
    banner.textContent = overlayConfig.defaultVideoNote;
  }

  function renderPresets() {
    presetNav.innerHTML = "";
    for (const preset of presets) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chip${preset.id === state.presetId ? " active" : ""}`;
      btn.textContent = preset.name;
      btn.addEventListener("click", () => selectPreset(preset.id, { manual: true }));
      presetNav.appendChild(btn);
    }
  }

  function renderChapters() {
    chapterNav.innerHTML = "";
    const usable = state.isLive
      ? []
      : chapters.filter((c) => !state.duration || c.t <= state.duration + 1);
    if (!usable.length) {
      chapterNav.innerHTML = `<p class="hint">${
        state.isLive ? "Live stream — pick a camera-angle preset." : "No VOD chapter markers for this video."
      }</p>`;
      return;
    }
    for (const ch of usable) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.dataset.t = String(ch.t);
      btn.textContent = `${formatTime(ch.t)} · ${ch.label}`;
      btn.addEventListener("click", () => {
        state.followChapters = true;
        follow.checked = true;
        seekTo(ch.t);
        selectPreset(ch.presetId, { manual: false });
      });
      chapterNav.appendChild(btn);
    }
  }

  function renderHotspots() {
    svg.replaceChildren();
    labels.replaceChildren();
    hotspotNav.innerHTML = "";
    const preset = currentPreset();
    if (!preset) return;

    const defs = svgEl("defs", {});
    svg.appendChild(defs);

    for (const hs of preset.hotspots) {
      const entry = catalogById(hs.catalogId);
      if (!entry) continue;
      const selected = state.catalogId === hs.catalogId;
      let shape;
      if (hs.shape === "polygon" && hs.points?.length) {
        shape = svgEl("polygon", {
          points: hs.points.map((p) => `${p[0]},${p[1]}`).join(" "),
        });
      } else {
        shape = svgEl("rect", {
          x: hs.x,
          y: hs.y,
          width: hs.w,
          height: hs.h,
          rx: 0.008,
        });
      }
      shape.classList.add("hotspot");
      if (selected) shape.classList.add("selected");
      shape.setAttribute("tabindex", "0");
      shape.setAttribute("role", "button");
      shape.setAttribute("aria-label", `${hs.label || entry.name}. Open Learn panel.`);
      shape.dataset.catalogId = hs.catalogId;
      const pick = () => selectHotspot(hs.catalogId);
      shape.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        pick();
      });
      shape.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          pick();
        }
      });
      svg.appendChild(shape);

      const c = hotspotCentroid(hs);
      const lab = document.createElement("span");
      lab.className = `hotspot-label${selected ? " selected" : ""}`;
      lab.textContent = hs.label || entry.name;
      lab.style.left = `${c.x * 100}%`;
      lab.style.top = `${c.y * 100}%`;
      labels.appendChild(lab);

      const row = document.createElement("button");
      row.type = "button";
      row.className = `cat-btn${selected ? " active" : ""}`;
      row.innerHTML = `${entry.name}<small>${hs.label || entry.category}</small>`;
      row.addEventListener("click", () => selectHotspot(hs.catalogId));
      hotspotNav.appendChild(row);
    }
  }

  function selectHotspot(catalogId) {
    state.catalogId = catalogId;
    renderHotspots();
    onSelect?.(catalogId);
  }

  function selectPreset(id, { manual = false } = {}) {
    if (!presets.some((p) => p.id === id)) return;
    state.presetId = id;
    if (manual) state.manualUntil = performance.now() + 12000;
    renderPresets();
    renderHotspots();
    syncChrome();
  }

  function seekTo(t) {
    try {
      state.player?.seekTo?.(t, true);
    } catch {
      /* player not ready */
    }
  }

  function applyChapterAt(t) {
    if (!state.followChapters || state.isLive) return;
    if (performance.now() < state.manualUntil) return;
    let match = chapters[0];
    for (const ch of chapters) {
      if (ch.t <= t) match = ch;
    }
    if (match && match.presetId !== state.presetId) {
      selectPreset(match.presetId, { manual: false });
    }
    chapterNav.querySelectorAll(".chip").forEach((btn) => {
      const start = Number(btn.dataset.t);
      const next = [...chapterNav.querySelectorAll(".chip")].find((b) => Number(b.dataset.t) > start);
      const end = next ? Number(next.dataset.t) : Infinity;
      btn.classList.toggle("active", t >= start && t < end);
    });
  }

  function pollTime() {
    if (!state.player || !state.active) return;
    try {
      const t = state.player.getCurrentTime?.() ?? 0;
      const d = state.player.getDuration?.() ?? 0;
      state.duration = d;
      clock.textContent = state.isLive
        ? `Live public stream · ${formatTime(t)}`
        : `VOD · ${formatTime(t)} / ${formatTime(d)}`;
      applyChapterAt(t);
    } catch {
      /* ignore */
    }
  }

  function detectLive() {
    try {
      const info = state.player?.playerInfo;
      if (info?.videoData?.isLive) return true;
      const url = state.player?.getVideoUrl?.() || "";
      if (/\/live(?:\?|$)/.test(url)) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function onPlayerReady() {
    showError("");
    try {
      state.duration = state.player.getDuration?.() ?? 0;
    } catch {
      state.duration = 0;
    }
    state.isLive = detectLive();
    syncChrome();
    renderChapters();
    resizePlayer();
  }

  function onPlayerError(ev) {
    const code = ev?.data;
    showError(YT_ERRORS[code] || `YouTube player error (${code ?? "?"}). Try another public URL.`);
  }

  function onPlayerState() {
    state.isLive = detectLive();
    syncChrome();
    renderChapters();
  }

  function resizePlayer() {
    const rect = host.getBoundingClientRect();
    const w = Math.max(16, Math.round(rect.width));
    const h = Math.max(9, Math.round(rect.height));
    try {
      state.player?.setSize?.(w, h);
    } catch {
      /* ignore */
    }
  }

  function mountIframeFallback(id) {
    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.id = "live-player";
    iframe.title = overlayConfig.defaultVideoTitle || "Public Starship stream";
    iframe.src = `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    host.appendChild(iframe);
  }

  async function createPlayer(id) {
    if (state.player) {
      try {
        state.player.destroy();
      } catch {
        /* ignore */
      }
      state.player = null;
    }
    host.innerHTML = "";
    const slot = document.createElement("div");
    slot.id = "live-player";
    host.appendChild(slot);
    showError("");
    try {
      const YT = await loadYouTubeApi();
      state.player = new YT.Player("live-player", {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          enablejsapi: 1,
        },
        events: {
          onReady: onPlayerReady,
          onError: onPlayerError,
          onStateChange: onPlayerState,
        },
      });
    } catch (err) {
      console.warn(err);
      mountIframeFallback(id);
      showError("YouTube API unavailable — using a basic embed. Chapter sync needs the IFrame API.");
    }
  }

  function loadVideo(raw, { persist = true } = {}) {
    const id = parseYouTubeId(raw);
    if (!id) {
      showError("Paste a YouTube URL or 11-character video ID.");
      return;
    }
    state.videoId = id;
    if (persist) storeVideoId(id);
    syncChrome();
    if (state.active) createPlayer(id);
  }

  function startPoll() {
    stopPoll();
    state.poll = window.setInterval(pollTime, 500);
  }

  function stopPoll() {
    if (state.poll) {
      window.clearInterval(state.poll);
      state.poll = 0;
    }
  }

  function activate() {
    state.active = true;
    stage.classList.remove("hidden");
    syncChrome();
    renderPresets();
    renderHotspots();
    renderChapters();
    if (!state.player && !host.querySelector("iframe")) createPlayer(state.videoId);
    else resizePlayer();
    startPoll();
  }

  function deactivate() {
    state.active = false;
    stopPoll();
    try {
      state.player?.pauseVideo?.();
    } catch {
      /* ignore */
    }
  }

  function toggleHotspots(force) {
    state.hotspotsOn = typeof force === "boolean" ? force : !state.hotspotsOn;
    storeHotspotsVisible(state.hotspotsOn);
    syncChrome();
  }

  function clearSelection() {
    state.catalogId = null;
    renderHotspots();
  }

  btnLoad.addEventListener("click", () => loadVideo(urlInput.value, { persist: true }));
  urlInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      loadVideo(urlInput.value, { persist: true });
    }
  });
  btnReset.addEventListener("click", () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    const id = parseYouTubeId(import.meta.env.VITE_YOUTUBE_VIDEO_ID || "") || fallbackId;
    loadVideo(id, { persist: false });
  });
  btnHotspots.addEventListener("click", () => toggleHotspots());
  follow.addEventListener("change", () => {
    state.followChapters = follow.checked;
  });
  window.addEventListener("resize", () => {
    if (state.active) resizePlayer();
  });
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => {
      if (state.active) resizePlayer();
    }).observe(host);
  }

  syncChrome();
  renderPresets();
  renderHotspots();
  renderChapters();

  return {
    activate,
    deactivate,
    toggleHotspots,
    clearSelection,
    setSelected(id) {
      state.catalogId = id;
      renderHotspots();
    },
    get selectedId() {
      return state.catalogId;
    },
  };
}
