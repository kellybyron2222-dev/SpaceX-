import overlayConfig from "./data/live/overlays.json";
import { catalogById } from "./data/catalog.js";
import { countdownClock, formatUtc } from "./data/launches.js";
import {
  fetchYouTubeOembed,
  loadHotspotsVisible,
  oembedMeansMissingVideo,
  parseYouTubeId,
  resolveDefaultVideoId,
  STORAGE_KEY,
  storeHotspotsVisible,
  storeVideoId,
  youtubeIdRejectReason,
  youtubeThumbCandidates,
  youtubeWatchUrl,
} from "./data/live/youtube.js";

const YT_ERRORS = {
  2: "Invalid YouTube video ID.",
  5: "This stream cannot play in HTML5.",
  100: "Video not found or is private.",
  101: "Embedding is disabled for this video.",
  150: "Embedding is disabled for this video.",
};

const EMBED_BLOCK_CODES = new Set([101, 150]);
const READY_TIMEOUT_MS = 9000;
const NUDGE_STEP = 0.015;
const NUDGE_LIMIT = 0.12;

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
    let settled = false;
    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      fn(arg);
    };
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      try {
        prev?.();
      } catch {
        /* ignore */
      }
      if (window.YT?.Player) finish(resolve, window.YT);
      else finish(reject, new Error("YouTube API ready without Player"));
    };
    if (!document.querySelector("script[data-yt-iframe-api]")) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      tag.dataset.ytIframeApi = "1";
      tag.onerror = () => finish(reject, new Error("YouTube IFrame API failed to load"));
      document.head.appendChild(tag);
    }
    window.setTimeout(() => {
      if (window.YT?.Player) finish(resolve, window.YT);
      else finish(reject, new Error("YouTube IFrame API timed out"));
    }, 8000);
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

export function createLiveLaunch({ onSelect } = {}) {
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
  const urlErr = document.getElementById("live-url-error");
  const banner = document.getElementById("live-banner");
  const openLink = document.getElementById("live-open-yt");
  const follow = document.getElementById("live-follow-chapters");
  const presetBlurb = document.getElementById("live-preset-blurb");
  const frame = stage?.querySelector(".live-frame");
  const fallback = document.getElementById("live-fallback");
  const fallbackThumb = document.getElementById("live-fallback-thumb");
  const fallbackTitle = document.getElementById("live-fallback-title");
  const fallbackCopy = document.getElementById("live-fallback-copy");
  const fallbackOpen = document.getElementById("live-fallback-open");
  const fallbackRetry = document.getElementById("live-fallback-retry");
  const btnEmbedHelp = document.getElementById("btn-embed-help");
  const frameOpen = document.getElementById("live-frame-yt");
  const fitNav = document.getElementById("live-fits");
  const fitBlurb = document.getElementById("live-fit-blurb");
  const countdownEl = document.getElementById("live-countdown");
  const countdownKicker = document.getElementById("live-countdown-kicker");
  const countdownMission = document.getElementById("live-countdown-mission");
  const countdownT = document.getElementById("live-countdown-t");
  const countdownMeta = document.getElementById("live-countdown-meta");
  const countdownStatus = document.getElementById("live-countdown-status");

  const presets = overlayConfig.presets || [];
  const chapters = overlayConfig.chapters || [];
  const pictureFits = overlayConfig.pictureFits || [
    { id: "recap", name: "Recap frames", inset: { top: 0, right: 0, bottom: 0, left: 0 } },
  ];
  const fallbackId = overlayConfig.defaultVideoId || "hI9HQfCAw64";

  const state = {
    active: false,
    videoId: resolveDefaultVideoId(fallbackId),
    presetId: presets[0]?.id || "stack-on-pad",
    catalogId: null,
    hotspotsOn: loadHotspotsVisible(false),
    followChapters: true,
    isLive: false,
    duration: 0,
    player: null,
    poll: 0,
    tick: 0,
    readyTimer: 0,
    manualUntil: 0,
    embedBlocked: false,
    embedBlockedManual: false,
    playerReady: false,
    triedNocookie: false,
    oembed: null,
    oembedGen: 0,
    fitId: pictureFits[0]?.id || "recap",
    fitManual: false,
    nudge: { x: 0, y: 0 },
    windowLaunch: null,
    windowSource: "live",
    pendingSeek: null,
    pendingPlay: false,
    seekUntil: 0,
    seekReload: false,
  };

  function showError(msg) {
    if (!msg) {
      errBox.classList.add("hidden");
      errBox.textContent = "";
      if (urlErr) {
        urlErr.hidden = true;
        urlErr.textContent = "";
      }
      return;
    }
    errBox.textContent = msg;
    errBox.classList.remove("hidden");
    if (urlErr) {
      urlErr.textContent = msg;
      urlErr.hidden = false;
    }
  }

  function currentPreset() {
    return presets.find((p) => p.id === state.presetId) || presets[0] || null;
  }

  function currentFit() {
    return pictureFits.find((f) => f.id === state.fitId) || pictureFits[0] || null;
  }

  function syncOpenLinks() {
    const href = youtubeWatchUrl(state.videoId);
    openLink.href = href;
    fallbackOpen.href = href;
    if (frameOpen) frameOpen.href = href;
  }

  function setFallbackThumb(preferred) {
    const urls = [preferred, ...youtubeThumbCandidates(state.videoId)].filter(Boolean);
    const unique = [...new Set(urls)];
    let i = 0;
    fallbackThumb.hidden = false;
    fallbackThumb.alt = `Thumbnail for ${state.oembed?.title || state.videoId}`;
    fallbackThumb.onerror = () => {
      i += 1;
      if (i < unique.length) fallbackThumb.src = unique[i];
      else fallbackThumb.hidden = true;
    };
    fallbackThumb.src = unique[0] || "";
  }

  function hideFallback({ force = false } = {}) {
    if (state.embedBlockedManual && !force) return;
    state.embedBlocked = false;
    state.embedBlockedManual = false;
    fallback.hidden = true;
    fallback.classList.add("hidden");
    frame?.classList.remove("is-blocked");
  }

  function showFallback({ title, detail, manual = false, thumb } = {}) {
    state.embedBlocked = true;
    state.embedBlockedManual = manual;
    const name = state.oembed?.title || overlayConfig.defaultVideoTitle || "this webcast";
    fallbackTitle.textContent = title || "Watch on YouTube";
    fallbackCopy.textContent =
      detail ||
      `The in-page player could not play this video. YouTube may show a sign-in / bot check, or the uploader may have disabled embedding (common on some SpaceX IDs). Open ${name} on YouTube instead.`;
    setFallbackThumb(thumb || state.oembed?.thumbnail);
    fallback.hidden = false;
    fallback.classList.remove("hidden");
    frame?.classList.add("is-blocked");
    overlay.classList.add("is-hidden");
    overlay.classList.add("hotspots-off");
  }

  function applyOverlayFit() {
    const fit = currentFit();
    const ins = fit?.inset || { top: 0, right: 0, bottom: 0, left: 0 };
    const top = Math.max(0, ins.top + state.nudge.y);
    const left = Math.max(0, ins.left + state.nudge.x);
    const right = Math.max(0, ins.right - state.nudge.x);
    const bottom = Math.max(0, ins.bottom - state.nudge.y);
    overlay.style.setProperty("--live-fit-top", `${top * 100}%`);
    overlay.style.setProperty("--live-fit-right", `${right * 100}%`);
    overlay.style.setProperty("--live-fit-left", `${left * 100}%`);
    overlay.style.setProperty("--live-fit-bottom", `${bottom * 100}%`);
  }

  function bannerText() {
    const launch = state.windowLaunch;
    if (launch?.status === "in-flight") {
      return `${launch.mission} is in flight on the public Launch Library 2 list — not official SpaceX. Paste a webcast ID if this recap is not the live stream.`;
    }
    if (launch) {
      return `Public Starship window on the manifest: ${launch.mission}. This tab still embeds a public YouTube recap until you paste a webcast ID — not official telemetry.`;
    }
    return overlayConfig.defaultVideoNote;
  }

  function renderCountdown() {
    const launch = state.windowLaunch;
    if (!countdownEl) return;
    if (!launch) {
      countdownEl.hidden = true;
      countdownEl.classList.add("hidden");
      return;
    }
    countdownEl.hidden = false;
    countdownEl.classList.remove("hidden");
    const t = countdownClock(launch.net);
    const when = formatUtc(launch.net);
    const inflight = launch.status === "in-flight";
    const netMs = new Date(launch.net).getTime();
    const past = Number.isFinite(netMs) && netMs < Date.now() && !inflight;
    if (countdownKicker) {
      countdownKicker.textContent = inflight
        ? "Public Starship test in flight"
        : past
          ? "Listed public Starship window"
          : "Next public Starship window";
    }
    if (countdownMission) countdownMission.textContent = launch.mission;
    if (countdownT) countdownT.textContent = inflight ? "In flight" : t || "NET TBD";
    if (countdownStatus) {
      countdownStatus.textContent = launch.statusLabel || launch.status;
      countdownStatus.className = `status ${launch.status || "scheduled"}`;
    }
    if (countdownMeta) {
      const src =
        state.windowSource === "live"
          ? "Launch Library 2 (The Space Devs)"
          : "sample teaching slot (not live LL2)";
      countdownMeta.textContent = `${launch.vehicle} · ${launch.pad} · ${when}. Public ${src} — not official SpaceX countdown, range status, or telemetry.`;
    }
  }

  function syncChrome() {
    urlInput.value = state.videoId;
    syncOpenLinks();
    btnHotspots.setAttribute("aria-pressed", state.hotspotsOn ? "true" : "false");
    const hideOverlay = !state.hotspotsOn || state.embedBlocked;
    overlay.classList.toggle("is-hidden", hideOverlay);
    overlay.classList.toggle("hotspots-off", hideOverlay);
    follow.checked = state.followChapters;
    follow.disabled = state.isLive;
    const preset = currentPreset();
    presetBlurb.textContent = preset?.blurb || "";
    const fit = currentFit();
    if (fitBlurb) {
      fitBlurb.textContent = fit?.blurb || "";
    }
    banner.textContent = bannerText();
    applyOverlayFit();
    renderCountdown();
  }

  function renderFits() {
    if (!fitNav) return;
    fitNav.innerHTML = "";
    for (const fit of pictureFits) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `chip${fit.id === state.fitId ? " active" : ""}`;
      btn.textContent = fit.name;
      btn.addEventListener("click", () => {
        state.fitId = fit.id;
        state.fitManual = true;
        renderFits();
        syncChrome();
      });
      fitNav.appendChild(btn);
    }
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

  function effectiveDuration() {
    if (Number.isFinite(state.duration) && state.duration > 1) return state.duration;
    if (state.videoId === fallbackId && overlayConfig.expectedDurationSeconds) {
      return overlayConfig.expectedDurationSeconds;
    }
    return 0;
  }

  function renderChapters() {
    chapterNav.innerHTML = "";
    const duration = effectiveDuration();
    const usable = state.isLive ? [] : chapters.filter((c) => !duration || c.t <= duration + 1);
    if (!usable.length) {
      chapterNav.innerHTML = `<p class="hint">${
        state.isLive ? "Live stream — pick a camera-angle preset and Live webcast overlay fit." : "No VOD chapter markers for this video."
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
        seekTo(ch.t, { play: ch.t > 0 });
        selectPreset(ch.presetId, { manual: false });
        highlightChapterAt(ch.t);
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
      lab.dataset.catalogId = hs.catalogId;
      lab.textContent = hs.label || entry.name;
      lab.style.left = `${c.x * 100}%`;
      lab.style.top = `${c.y * 100}%`;
      const setHover = (on) => lab.classList.toggle("is-hover", on);
      shape.addEventListener("pointerenter", () => setHover(true));
      shape.addEventListener("pointerleave", () => setHover(false));
      shape.addEventListener("focus", () => setHover(true));
      shape.addEventListener("blur", () => setHover(false));
      labels.appendChild(lab);

      const row = document.createElement("button");
      row.type = "button";
      row.className = `cat-btn live-hotspot-row${selected ? " active" : ""}`;
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

  function chapterForPreset(presetId) {
    return chapters.find((c) => c.presetId === presetId) || null;
  }

  function highlightChapterAt(t) {
    chapterNav.querySelectorAll(".chip").forEach((btn) => {
      const start = Number(btn.dataset.t);
      const next = [...chapterNav.querySelectorAll(".chip")].find((b) => Number(b.dataset.t) > start);
      const end = next ? Number(next.dataset.t) : Infinity;
      btn.classList.toggle("active", t >= start && t < end);
    });
  }

  function selectPreset(id, { manual = false } = {}) {
    if (!presets.some((p) => p.id === id)) return;
    state.presetId = id;
    if (manual) {
      state.followChapters = false;
      follow.checked = false;
      state.manualUntil = performance.now() + 12000;
      seekPresetChapter(id);
    }
    renderPresets();
    renderHotspots();
    syncChrome();
  }

  function seekPresetChapter(presetId) {
    if (state.isLive) return;
    const ch = chapterForPreset(presetId);
    if (!ch || !Number.isFinite(ch.t) || ch.t < 0) return;
    const duration = effectiveDuration();
    if (duration && ch.t > duration + 1) return;
    seekTo(ch.t, { play: ch.t > 0 });
    highlightChapterAt(ch.t);
  }

  function seekTo(t, { play = false } = {}) {
    if (!Number.isFinite(t) || t < 0) return;
    state.pendingSeek = t;
    state.pendingPlay = play;
    // Unplayed posters ignore seekTo. Reload the ID at t so Catch is not the pad poster.
    state.seekReload = play;
    state.seekUntil = performance.now() + 12000;
    applyJump();
  }

  function applyJump() {
    const t = state.pendingSeek;
    if (t == null) return;
    if (state.seekUntil && performance.now() > state.seekUntil) {
      clearPendingSeek();
      return;
    }
    try {
      if (state.seekReload && typeof state.player?.loadVideoById === "function") {
        state.seekReload = false;
        state.player.loadVideoById({ videoId: state.videoId, startSeconds: t });
        return;
      }
      if (typeof state.player?.seekTo === "function") {
        if (state.pendingPlay) state.player.playVideo?.();
        state.player.seekTo(t, true);
        return;
      }
    } catch {
      /* player not ready */
    }
    if (state.seekReload) {
      state.seekReload = false;
      mountIframeFallback(state.videoId, { startSeconds: t, autoplay: true });
    }
  }

  function clearPendingSeekIfClose(t) {
    if (state.pendingSeek == null || !Number.isFinite(t)) return;
    if (Math.abs(t - state.pendingSeek) <= 1.5) {
      clearPendingSeek();
    }
  }

  function clearPendingSeek() {
    state.pendingSeek = null;
    state.pendingPlay = false;
    state.seekUntil = 0;
    state.seekReload = false;
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
    highlightChapterAt(t);
  }

  function pollTime() {
    if (!state.player || !state.active) return;
    try {
      const t = state.player.getCurrentTime?.() ?? 0;
      const d = state.player.getDuration?.() ?? 0;
      const prev = state.duration;
      state.duration = d;
      clock.textContent = state.isLive
        ? `Live public stream · ${formatTime(t)}`
        : `VOD · ${formatTime(t)} / ${formatTime(effectiveDuration())}`;
      if (d && Math.abs(d - prev) > 1) renderChapters();
      clearPendingSeekIfClose(t);
      if (state.pendingSeek != null) applyJump();
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

  function applyLiveFitIfNeeded() {
    if (state.fitManual) return;
    const liveFit = pictureFits.find((f) => f.id === "live-wide");
    const recapFit = pictureFits.find((f) => f.id === "recap") || pictureFits[0];
    const next = state.isLive ? liveFit || recapFit : recapFit;
    if (next && next.id !== state.fitId) {
      state.fitId = next.id;
      renderFits();
    }
  }

  function clearReadyTimer() {
    if (state.readyTimer) {
      window.clearTimeout(state.readyTimer);
      state.readyTimer = 0;
    }
  }

  function onPlayerReady() {
    state.playerReady = true;
    clearReadyTimer();
    showError("");
    hideFallback();
    try {
      state.duration = state.player.getDuration?.() ?? 0;
    } catch {
      state.duration = 0;
    }
    state.isLive = detectLive();
    applyLiveFitIfNeeded();
    syncChrome();
    renderChapters();
    resizePlayer();
    applyJump();
    if (state.pendingSeek != null) highlightChapterAt(state.pendingSeek);
  }

  function onPlayerError(ev) {
    const code = ev?.data;
    const short = YT_ERRORS[code] || `YouTube player error (${code ?? "?"}).`;
    const blocked = EMBED_BLOCK_CODES.has(code);
    if (!blocked && !state.triedNocookie) {
      state.triedNocookie = true;
      createPlayer(state.videoId, { nocookie: true });
      return;
    }
    showFallback({
      title: "Open on YouTube",
      detail: blocked
        ? "Embedding is disabled for this video (player error 101/150). Some SpaceX webcast IDs block in-page play. Use Open on YouTube, or paste an ID that allows embedding."
        : `${short} YouTube may also show a sign-in / bot check inside the embed. Use Open on YouTube if the in-page player stays unavailable.`,
      thumb: state.oembed?.thumbnail,
    });
    clearPendingSeek();
    syncChrome();
  }

  function onPlayerState(ev) {
    state.isLive = detectLive();
    applyLiveFitIfNeeded();
    syncChrome();
    renderChapters();
    if (state.pendingSeek != null) highlightChapterAt(state.pendingSeek);
    const playing = ev?.data === 1 || ev?.data === 3;
    if (playing && state.pendingSeek != null) applyJump();
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

  function destroyPlayer() {
    clearReadyTimer();
    if (state.player) {
      try {
        state.player.destroy();
      } catch {
        /* ignore */
      }
      state.player = null;
    }
    state.playerReady = false;
    host.innerHTML = "";
  }

  function mountIframeFallback(id, { nocookie = false, startSeconds = 0, autoplay = false } = {}) {
    host.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.id = "live-player";
    iframe.title = overlayConfig.defaultVideoTitle || "Public Starship stream";
    const hostName = nocookie ? "www.youtube-nocookie.com" : "www.youtube.com";
    const params = new URLSearchParams({ rel: "0", modestbranding: "1", playsinline: "1" });
    const start = Math.max(0, Math.floor(startSeconds || 0));
    if (start > 0) params.set("start", String(start));
    if (autoplay || start > 0) params.set("autoplay", "1");
    iframe.src = `https://${hostName}/embed/${id}?${params}`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    host.appendChild(iframe);
  }

  function showMissingVideoFallback() {
    destroyPlayer();
    showError("YouTube has no public video with that ID (oEmbed 400/404).");
    showFallback({
      title: "Not a YouTube video",
      detail:
        "YouTube oEmbed returned 400/404. That is not a public video — made-up IDs, playlists, channels, and private clips fail. Paste a watch URL or a real 11-character video ID.",
      thumb: state.oembed?.thumbnail,
    });
    syncChrome();
  }

  async function createPlayer(id, { nocookie = false, persist = false } = {}) {
    const gen = ++state.oembedGen;
    const result = await fetchYouTubeOembed(id);
    if (gen !== state.oembedGen) return;
    state.oembed = result;
    if (oembedMeansMissingVideo(result)) {
      if (id === state.videoId && id !== fallbackId) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        state.videoId = fallbackId;
      }
      showMissingVideoFallback();
      return;
    }
    if (result.embeddable === false && !state.embedBlockedManual) {
      destroyPlayer();
      showFallback({
        title: result.title || "Open on YouTube",
        detail:
          "YouTube oEmbed returned unauthorized — this ID has embedding disabled (common on some SpaceX webcasts). Open it on YouTube instead, or paste an ID that allows embeds.",
        thumb: result.thumbnail,
      });
      syncChrome();
      return;
    }

    const start = Math.max(0, Math.floor(state.pendingSeek || 0));
    destroyPlayer();
    showError("");
    hideFallback({ force: true });
    state.videoId = id;
    state.triedNocookie = nocookie;
    state.isLive = false;
    if (persist) storeVideoId(id);
    if (!state.fitManual) state.fitId = pictureFits.find((f) => f.id === "recap")?.id || state.fitId;
    renderFits();
    syncChrome();
    try {
      const YT = await loadYouTubeApi();
      if (gen !== state.oembedGen) return;
      const slot = document.createElement("div");
      slot.id = "live-player";
      host.appendChild(slot);
      const playerVars = {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        origin: window.location.origin,
        enablejsapi: 1,
      };
      if (start > 0) {
        playerVars.start = start;
        playerVars.autoplay = 1;
        state.seekReload = false;
      }
      state.player = new YT.Player("live-player", {
        videoId: id,
        width: "100%",
        height: "100%",
        host: nocookie ? "https://www.youtube-nocookie.com" : "https://www.youtube.com",
        playerVars,
        events: {
          onReady: onPlayerReady,
          onError: onPlayerError,
          onStateChange: onPlayerState,
        },
      });
      state.readyTimer = window.setTimeout(() => {
        if (!state.playerReady && !state.embedBlocked) {
          showFallback({
            title: "Open on YouTube",
            detail:
              "The in-page player did not become ready. YouTube often shows a sign-in / bot check in embedded players. Open the webcast on YouTube, or tap Retry embed.",
            thumb: state.oembed?.thumbnail,
          });
          syncChrome();
        }
      }, READY_TIMEOUT_MS);
    } catch (err) {
      console.warn(err);
      mountIframeFallback(id, { nocookie: state.triedNocookie, startSeconds: start, autoplay: start > 0 });
      showError("YouTube API unavailable — using a basic embed. If you see a sign-in / bot check, Open on YouTube.");
    }
  }

  function loadVideo(raw, { persist = true } = {}) {
    const id = parseYouTubeId(raw);
    if (!id) {
      showError(youtubeIdRejectReason(raw));
      return;
    }
    clearPendingSeek();
    if (state.active) {
      createPlayer(id, { persist });
      return;
    }
    fetchYouTubeOembed(id).then((result) => {
      if (oembedMeansMissingVideo(result)) {
        state.oembed = result;
        showError("YouTube has no public video with that ID (oEmbed 400/404).");
        return;
      }
      state.videoId = id;
      state.oembed = result;
      if (persist) storeVideoId(id);
      syncChrome();
    });
  }

  function startPoll() {
    stopPoll();
    state.poll = window.setInterval(pollTime, 500);
    state.tick = window.setInterval(renderCountdown, 1000);
  }

  function stopPoll() {
    if (state.poll) {
      window.clearInterval(state.poll);
      state.poll = 0;
    }
    if (state.tick) {
      window.clearInterval(state.tick);
      state.tick = 0;
    }
  }

  function activate() {
    state.active = true;
    stage.classList.remove("hidden");
    syncChrome();
    renderPresets();
    renderFits();
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

  function nudge(dx, dy) {
    state.nudge.x = Math.max(-NUDGE_LIMIT, Math.min(NUDGE_LIMIT, state.nudge.x + dx));
    state.nudge.y = Math.max(-NUDGE_LIMIT, Math.min(NUDGE_LIMIT, state.nudge.y + dy));
    applyOverlayFit();
  }

  fallbackRetry.addEventListener("click", () => {
    hideFallback({ force: true });
    showError("");
    state.triedNocookie = false;
    if (state.active) createPlayer(state.videoId);
  });
  btnEmbedHelp.addEventListener("click", () => {
    showFallback({
      title: "Open on YouTube",
      detail:
        "If the player asks you to sign in, says the video is unavailable, or sits behind a bot check, YouTube is blocking the embed. That is common on datacenter and some SpaceX IDs. Open the webcast on YouTube instead.",
      manual: true,
      thumb: state.oembed?.thumbnail,
    });
    syncChrome();
  });
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
    state.fitManual = false;
    state.nudge = { x: 0, y: 0 };
    const id = parseYouTubeId(import.meta.env.VITE_YOUTUBE_VIDEO_ID || "") || fallbackId;
    loadVideo(id, { persist: false });
  });
  btnHotspots.addEventListener("click", () => toggleHotspots());
  follow.addEventListener("change", () => {
    state.followChapters = follow.checked;
  });
  document.getElementById("live-nudge-left")?.addEventListener("click", () => nudge(-NUDGE_STEP, 0));
  document.getElementById("live-nudge-right")?.addEventListener("click", () => nudge(NUDGE_STEP, 0));
  document.getElementById("live-nudge-up")?.addEventListener("click", () => nudge(0, -NUDGE_STEP));
  document.getElementById("live-nudge-down")?.addEventListener("click", () => nudge(0, NUDGE_STEP));
  document.getElementById("live-nudge-reset")?.addEventListener("click", () => {
    state.nudge = { x: 0, y: 0 };
    applyOverlayFit();
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
  renderFits();
  renderHotspots();
  renderChapters();

  return {
    activate,
    deactivate,
    toggleHotspots,
    clearSelection,
    setLaunchWindow(launch, { source } = {}) {
      state.windowLaunch = launch || null;
      state.windowSource = source || "live";
      if (state.active) syncChrome();
      else renderCountdown();
    },
    setSelected(id) {
      state.catalogId = id;
      renderHotspots();
    },
    get selectedId() {
      return state.catalogId;
    },
    get hotspotsOn() {
      return state.hotspotsOn;
    },
  };
}
