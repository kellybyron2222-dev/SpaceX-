import overlayConfig from "./data/live/overlays.json";
import { catalogById } from "./data/catalog.js";
import { countdownClock, formatUtc } from "./data/launches.js";
import {
  beatAtClock,
  beatById,
  beatTitle,
  fetchCuePack,
  latestSheetVideoId,
  missionBeats,
  pickSheet,
  recapBeats,
  resolveT0Offset,
} from "./data/live/cues.js";
import { isStaleDefaultId, resolveAutoWebcast } from "./data/live/webcast.js";
import {
  fetchYouTubeOembed,
  loadHotspotsVisible,
  loadStoredVideoId,
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

function formatMissionClock(seconds) {
  if (!Number.isFinite(seconds)) return "";
  const sign = seconds < 0 ? "T−" : "T+";
  const abs = Math.abs(Math.round(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const sec = abs % 60;
  if (h) return `${sign}${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${sign}${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
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

export function createLiveLaunch({ onSelect, onShareChange, onLearn } = {}) {
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
  const commentator = document.getElementById("commentator");
  const commClock = document.getElementById("comm-clock");
  const commPhase = document.getElementById("comm-phase");
  const commCue = document.getElementById("comm-cue");
  const commTags = document.getElementById("comm-tags");
  const commBeats = document.getElementById("comm-beats");
  const commPick = document.getElementById("comm-phase-pick");
  const commPause = document.getElementById("comm-pause");
  const commMute = document.getElementById("comm-mute");
  const btnCommStart = document.getElementById("btn-comm-start");
  const btnCommLearn = document.getElementById("btn-comm-learn");
  const btnCommentary = document.getElementById("btn-commentary");

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
    launchBundle: null,
    webcastPick: null,
    t0Offset: null,
    pendingSeek: null,
    pendingPlay: false,
    seekUntil: 0,
    seekReload: false,
    cuePack: null,
    cueLoad: null,
    sheet: null,
    commentaryOn: false,
    pauseAdvance: false,
    muted: false,
    beatId: null,
    pendingPhase: null,
    fromQueryYoutube: false,
    beatHotspotIds: [],
    beatLearnIds: [],
  };

  function learnIdForBeat(beat) {
    if (beat?.learnId) return beat.learnId;
    if (beat?.learnIds?.length) return beat.learnIds[0];
    if (!beat?.hotspotId) return null;
    for (const preset of presets) {
      const hs = preset.hotspots?.find((h) => h.id === beat.hotspotId);
      if (hs?.catalogId) return hs.catalogId;
    }
    return null;
  }

  function catalogIdsForBeat(beat) {
    if (!beat) return [];
    if (beat.learnIds?.length) return [...beat.learnIds];
    const ids = [];
    const primary = learnIdForBeat(beat);
    if (primary) ids.push(primary);
    for (const hid of beat.hotspotIds || []) {
      for (const preset of presets) {
        const hs = preset.hotspots?.find((h) => h.id === hid);
        if (hs?.catalogId && !ids.includes(hs.catalogId)) ids.push(hs.catalogId);
      }
    }
    return ids;
  }

  function currentBeat() {
    return beatById(state.sheet, state.beatId);
  }

  function stopSpeech() {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  }

  function speakCue(text) {
    if (state.muted || !state.commentaryOn || !text) return;
    stopSpeech();
    try {
      if (!window.speechSynthesis) return;
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.04;
      utter.pitch = 1;
      utter.lang = "en-US";
      window.speechSynthesis.speak(utter);
    } catch {
      /* ignore */
    }
  }

  async function ensureCues() {
    if (state.cuePack) return state.cuePack;
    if (!state.cueLoad) {
      state.cueLoad = fetchCuePack()
        .then((pack) => {
          state.cuePack = pack;
          bindSheet();
          return pack;
        })
        .catch((err) => {
          console.warn(err);
          state.cuePack = { schema: "spacex-companion-cues/v1", disclaimer: "", defaultSheet: "", sheets: [] };
          state.cueLoad = null;
          return state.cuePack;
        });
    }
    return state.cueLoad;
  }

  function bindSheet() {
    state.sheet = pickSheet(state.cuePack, state.videoId);
    state.t0Offset = resolveT0Offset(state.sheet, {
      webcastPick: state.webcastPick,
      videoId: state.videoId,
    });
    renderPhasePicker();
    if (state.commentaryOn) renderCommentator();
  }

  function vodMissionSeconds() {
    if (state.t0Offset == null) return null;
    return playerSeconds() - state.t0Offset;
  }

  function beatSeekSeconds(beat) {
    if (!beat || state.isLive) return null;
    if (beat.recapSeconds != null) return Math.max(0, beat.recapSeconds);
    if (beat.clockSeconds != null && state.t0Offset != null) {
      return Math.max(0, state.t0Offset + beat.clockSeconds);
    }
    return null;
  }

  function startOriginSeconds() {
    const recap = recapFollowBeats();
    if (recap.length) return recap[0].recapSeconds || 0;
    if (state.t0Offset != null) return state.t0Offset;
    return 0;
  }

  function playerSeconds() {
    try {
      return state.player?.getCurrentTime?.() ?? 0;
    } catch {
      return 0;
    }
  }

  function missionElapsedSeconds() {
    const launch = state.windowLaunch;
    if (!launch?.net) return null;
    if (!(state.isLive || launch.status === "in-flight")) return null;
    const elapsed = (Date.now() - new Date(launch.net).getTime()) / 1000;
    return Number.isFinite(elapsed) ? elapsed : null;
  }

  function recapFollowBeats() {
    if (state.isLive) return [];
    return recapBeats(state.sheet);
  }

  function followBeatAtClock() {
    const recap = recapFollowBeats();
    if (recap.length) return beatAtClock(recap, playerSeconds(), "recapSeconds");
    const vodMission = vodMissionSeconds();
    if (vodMission != null) return beatAtClock(missionBeats(state.sheet), vodMission, "clockSeconds");
    const elapsed = missionElapsedSeconds();
    if (elapsed == null) return null;
    return beatAtClock(missionBeats(state.sheet), elapsed, "clockSeconds");
  }

  function autoAdvanceEnabled() {
    if (!state.commentaryOn || state.pauseAdvance || !state.sheet) return false;
    if (recapFollowBeats().length) return true;
    if (state.t0Offset != null && missionBeats(state.sheet).length > 0) return true;
    return missionElapsedSeconds() != null && missionBeats(state.sheet).length > 0;
  }

  function followCommentary() {
    if (!autoAdvanceEnabled()) return;
    const beat = followBeatAtClock();
    if (beat && beat.id !== state.beatId) applyBeat(beat, { seek: false, speak: true });
  }

  function syncShareQuery() {
    onShareChange?.();
  }

  function applyBeat(beat, { seek = false, speak = true } = {}) {
    if (!beat) return;
    const same = state.beatId === beat.id;
    state.beatId = beat.id;
    state.beatHotspotIds = beat.hotspotIds || (beat.hotspotId ? [beat.hotspotId] : []);
    state.beatLearnIds = catalogIdsForBeat(beat);
    if (beat.presetId) selectPreset(beat.presetId, { manual: false });
    const learnId = learnIdForBeat(beat);
    if (learnId) selectHotspot(learnId);
    else renderHotspots();
    const jump = beatSeekSeconds(beat);
    if (seek && jump != null) {
      seekTo(jump, { play: jump > 0 || state.commentaryOn });
    }
    renderCommentator({ pulse: !same });
    if (speak && !same) speakCue(beat.cue);
    syncShareQuery();
  }

  function renderPhasePicker() {
    if (!commPick) return;
    const beats = state.sheet?.beats || [];
    commPick.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = beats.length ? "Pick a phase" : "No cue sheet";
    commPick.appendChild(placeholder);
    for (const beat of beats) {
      const opt = document.createElement("option");
      opt.value = beat.id;
      opt.textContent = `${beat.clock || beat.phase} · ${beatTitle(beat)}`;
      commPick.appendChild(opt);
    }
    commPick.value = state.beatId || "";
  }

  function renderCommentator({ pulse = false } = {}) {
    if (!commentator) return;
    commentator.classList.toggle("is-idle", !state.commentaryOn);
    stage?.classList.toggle("is-commentating", state.commentaryOn);
    btnCommentary?.setAttribute("aria-pressed", state.commentaryOn ? "true" : "false");
    if (btnCommStart) {
      btnCommStart.textContent = state.commentaryOn ? "Stop commentary" : "Start commentary";
    }
    const canUse = Boolean(state.sheet?.beats?.length);
    if (commPick) commPick.disabled = !state.commentaryOn || !canUse;
    if (commPause) {
      commPause.disabled = !state.commentaryOn;
      commPause.checked = state.pauseAdvance;
    }
    if (commMute) {
      commMute.disabled = !state.commentaryOn;
      commMute.checked = state.muted;
    }
    const beat = currentBeat();
    const entry = catalogById(learnIdForBeat(beat));
    if (!state.commentaryOn) {
      if (commClock) commClock.textContent = idleCommentatorClock();
      if (commPhase) commPhase.textContent = "Public play-by-play";
      if (commCue) {
        commCue.textContent =
          "Start commentary to follow the latest Starship webcast from T-0 (that long YouTube hold is the countdown, not a broken player). Beats sit beside the stream — hot stage, flaps, catch. Educational approximation — not official telemetry.";
      }
      if (commTags) {
        commTags.hidden = true;
        commTags.replaceChildren();
      }
      if (commBeats) commBeats.hidden = true;
      btnCommLearn?.classList.add("hidden");
      return;
    }
    if (commClock) commClock.textContent = commentatorClockText(beat);
    if (commPhase) commPhase.textContent = beatTitle(beat) || "Waiting for a beat";
    if (commCue) commCue.textContent = beat?.cue || state.sheet?.note || packDisclaimer();
    if (pulse && commCue) {
      commCue.classList.remove("is-pulse");
      void commCue.offsetWidth;
      commCue.classList.add("is-pulse");
    }
    if (commTags) {
      const tagIds = catalogIdsForBeat(beat);
      commTags.replaceChildren();
      commTags.hidden = !tagIds.length;
      for (const id of tagIds) {
        const entry = catalogById(id);
        if (!entry) continue;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `comm-tag${id === state.catalogId ? " active" : ""}`;
        btn.textContent = entry.name;
        btn.addEventListener("click", () => {
          selectHotspot(id);
          onLearn?.(id);
        });
        commTags.appendChild(btn);
      }
    }
    if (commPick && beat) commPick.value = beat.id;
    if (btnCommLearn) {
      btnCommLearn.classList.toggle("hidden", !entry);
      if (entry) btnCommLearn.textContent = `Open in Learn · ${entry.name}`;
    }
    if (commBeats) {
      commBeats.hidden = false;
      commBeats.replaceChildren();
      for (const row of state.sheet?.beats || []) {
        const item = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `commentator-beat${row.id === state.beatId ? " active" : ""}`;
        btn.innerHTML = `<span class="commentator-beat-clock">${row.clock} · ${beatTitle(row)}</span><span>${row.cue}</span>`;
        btn.addEventListener("click", () => pickPhase(row.id, { seek: true }));
        item.appendChild(btn);
        commBeats.appendChild(item);
      }
    }
  }

  function packDisclaimer() {
    return state.cuePack?.disclaimer || "Public educational beats — not official telemetry.";
  }

  function idleCommentatorClock() {
    const sheet = state.sheet?.title;
    return sheet ? `Off until Start · ${sheet}` : "Off until Start";
  }

  function commentatorClockText(beat) {
    const sheet = state.sheet?.title || "Cue sheet";
    const vod = formatTime(playerSeconds());
    if (recapFollowBeats().length) {
      const recap = beat?.clock ? `${vod} recap · ${beat.clock}` : `${vod} recap`;
      return `${sheet} · ${recap}`;
    }
    const mission = vodMissionSeconds();
    if (mission != null) {
      return `${sheet} · VOD ${vod} · ${formatMissionClock(mission)}`;
    }
    return beat?.clock ? `${sheet} · ${beat.clock}` : sheet;
  }

  async function setCommentaryOn(on, { beat, seek = false } = {}) {
    await ensureCues();
    bindSheet();
    state.commentaryOn = Boolean(on);
    if (!state.commentaryOn) {
      stopSpeech();
      renderCommentator();
      renderHotspots();
      syncShareQuery();
      return;
    }
    let next = beat || currentBeat();
    if (!next && state.pendingPhase) next = beatById(state.sheet, state.pendingPhase);
    if (!state.isLive) {
      const origin = startOriginSeconds();
      const t = playerSeconds();
      if (t < origin - 2) {
        seekTo(origin, { play: true });
        if (!next) {
          next =
            beatAtClock(missionBeats(state.sheet), 0, "clockSeconds") ||
            beatById(state.sheet, "liftoff") ||
            recapFollowBeats()[0] ||
            null;
        }
        state.pendingPhase = null;
        renderCommentator();
        if (next) applyBeat(next, { seek: false, speak: true });
        else syncShareQuery();
        return;
      }
      try {
        state.player?.playVideo?.();
      } catch {
        /* ignore */
      }
    }
    if (!next && autoAdvanceEnabled()) next = followBeatAtClock();
    if (!next) next = state.sheet?.beats?.[0] || null;
    state.pendingPhase = null;
    renderCommentator();
    if (next) applyBeat(next, { seek, speak: true });
    else syncShareQuery();
  }

  function pickPhase(id, { seek = true } = {}) {
    const beat = beatById(state.sheet, id);
    if (!beat) return;
    applyBeat(beat, { seek, speak: true });
  }

  function toggleCommentary(force) {
    const on = typeof force === "boolean" ? force : !state.commentaryOn;
    setCommentaryOn(on, { seek: false });
  }

  async function applyQuery({ commentary, phase, youtube } = {}) {
    if (youtube) {
      state.fromQueryYoutube = true;
      loadVideo(youtube, { persist: false });
    }
    await ensureCues();
    bindSheet();
    if (phase) state.pendingPhase = phase;
    if (commentary) {
      const beat = beatById(state.sheet, phase);
      await setCommentaryOn(true, { beat, seek: Boolean(beat) });
    } else if (phase) {
      renderPhasePicker();
    }
  }

  function applyShareLink({ videoId, presetId, hotspotId, hotspots, commentary, phase } = {}) {
    if (typeof hotspots === "boolean") toggleHotspots(hotspots, { share: false });
    if (videoId) {
      const id = parseYouTubeId(videoId);
      if (id) {
        state.fromQueryYoutube = true;
        if (state.active) {
          if (id !== state.videoId) loadVideo(id, { persist: false });
        } else {
          state.videoId = id;
          syncChrome();
        }
      }
    }
    if (presetId) selectPreset(presetId, { manual: true });
    if (hotspotId && catalogById(hotspotId)) {
      selectHotspot(hotspotId);
      if (typeof hotspots !== "boolean") toggleHotspots(true, { share: false });
    }
    if (commentary || phase) {
      applyQuery({ commentary: Boolean(commentary), phase: phase || undefined });
    }
  }

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
    const pick = state.webcastPick;
    if (pick?.reason === "live") {
      return `${pick.mission || pick.title} looks live on Launch Library 2. Prefilling that public YouTube webcast — not official telemetry. Paste another ID if this is the wrong stream.`;
    }
    if (pick?.reason === "latest-completed") {
      return `Nothing live on Launch Library 2 / YouTube. Prefilling the latest completed public webcast: ${pick.mission || pick.title}. Educational embed — not official telemetry.`;
    }
    const launch = state.windowLaunch;
    if (launch?.status === "in-flight") {
      return `${launch.mission} is in flight on the public Launch Library 2 list — not official SpaceX. Paste a webcast ID if this recap is not the live stream.`;
    }
    if (launch) {
      return `Public Starship window on the manifest: ${launch.mission}. Showing a public YouTube VOD until a live webcast appears — not official telemetry.`;
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
      btn.addEventListener("click", () => {
        selectPreset(preset.id, { manual: true });
        onShareChange?.();
      });
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

  function recapChapters() {
    if (state.sheet?.id === "flight-5" || state.videoId === fallbackId) return chapters;
    return [];
  }

  function renderChapters() {
    chapterNav.innerHTML = "";
    const duration = effectiveDuration();
    const list = recapChapters();
    const usable = state.isLive ? [] : list.filter((c) => !duration || c.t <= duration + 1);
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
        onShareChange?.();
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

    const beat = currentBeat();
    const featuredIds = new Set();
    if (state.commentaryOn) {
      for (const id of catalogIdsForBeat(beat)) featuredIds.add(id);
      for (const hid of beat?.hotspotIds || []) {
        const hs = preset.hotspots?.find((h) => h.id === hid);
        if (hs?.catalogId) featuredIds.add(hs.catalogId);
      }
    }
    const hotspotRows = featuredIds.size
      ? preset.hotspots.filter((hs) => featuredIds.has(hs.catalogId))
      : preset.hotspots;

    const defs = svgEl("defs", {});
    svg.appendChild(defs);

    for (const hs of hotspotRows) {
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
      if (featuredIds.has(hs.catalogId)) shape.classList.add("featured");
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
      row.className = `cat-btn live-hotspot-row${selected ? " active" : ""}${featuredIds.has(hs.catalogId) ? " tagged" : ""}`;
      row.innerHTML = `${entry.name}<small>${hs.label || entry.category}</small>`;
      row.addEventListener("click", () => selectHotspot(hs.catalogId));
      hotspotNav.appendChild(row);
    }
  }

  function selectHotspot(catalogId) {
    state.catalogId = catalogId;
    renderHotspots();
    onSelect?.(catalogId);
    onShareChange?.();
  }

  function chapterForPreset(presetId) {
    return recapChapters().find((c) => c.presetId === presetId) || null;
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
    if (!state.followChapters || state.isLive || !recapChapters().length) return;
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
      if (state.commentaryOn && commClock) commClock.textContent = commentatorClockText(currentBeat());
      if (d && Math.abs(d - prev) > 1) renderChapters();
      clearPendingSeekIfClose(t);
      if (state.pendingSeek != null) applyJump();
      applyChapterAt(t);
      followCommentary();
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
    bindSheet();
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

  function queueStartSeconds(startSeconds) {
    if (!Number.isFinite(startSeconds) || startSeconds <= 0) return;
    state.pendingSeek = startSeconds;
    state.pendingPlay = false;
    state.seekReload = false;
    state.seekUntil = performance.now() + 12000;
  }

  function loadVideo(raw, { persist = true, startSeconds } = {}) {
    const id = parseYouTubeId(raw);
    if (!id) {
      showError(youtubeIdRejectReason(raw));
      return;
    }
    clearPendingSeek();
    queueStartSeconds(startSeconds);
    if (persist) state.webcastPick = null;
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
      bindSheet();
      syncChrome();
    });
  }

  async function applyAutoWebcast(bundle, { force = false } = {}) {
    if (bundle) state.launchBundle = bundle;
    if (state.fromQueryYoutube && !force) return;
    const stored = loadStoredVideoId();
    if (stored && !isStaleDefaultId(stored, fallbackId) && !force) return;
    await ensureCues();
    const pick = resolveAutoWebcast({
      bundle: state.launchBundle,
      fallbackId,
      latestSheetVideoId: latestSheetVideoId(state.cuePack),
    });
    if (!pick?.youtubeId) return;
    state.webcastPick = pick;
    bindSheet();
    const start = state.t0Offset > 0 ? state.t0Offset : undefined;
    if (pick.youtubeId !== state.videoId) {
      loadVideo(pick.youtubeId, { persist: false, startSeconds: start });
    } else {
      queueStartSeconds(start);
      if (state.active && state.playerReady) applyJump();
      bindSheet();
      syncChrome();
    }
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
    ensureCues().then(() => {
      bindSheet();
      renderCommentator();
    });
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
    stopSpeech();
  }

  function toggleHotspots(force, { share = true } = {}) {
    state.hotspotsOn = typeof force === "boolean" ? force : !state.hotspotsOn;
    storeHotspotsVisible(state.hotspotsOn);
    syncChrome();
    if (share) onShareChange?.();
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
  btnLoad.addEventListener("click", () => {
    loadVideo(urlInput.value, { persist: true });
    onShareChange?.();
  });
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
    state.fromQueryYoutube = false;
    state.webcastPick = null;
    applyAutoWebcast(state.launchBundle, { force: true });
    onShareChange?.();
  });
  btnHotspots.addEventListener("click", () => toggleHotspots());
  btnCommentary?.addEventListener("click", () => toggleCommentary());
  btnCommStart?.addEventListener("click", () => toggleCommentary());
  commPause?.addEventListener("change", () => {
    state.pauseAdvance = commPause.checked;
  });
  commMute?.addEventListener("change", () => {
    state.muted = commMute.checked;
    if (state.muted) stopSpeech();
  });
  commPick?.addEventListener("change", () => {
    if (commPick.value) pickPhase(commPick.value, { seek: true });
  });
  btnCommLearn?.addEventListener("click", () => {
    const id = learnIdForBeat(currentBeat()) || state.catalogId;
    if (id) onLearn?.(id);
  });
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
  renderCommentator();

  return {
    activate,
    deactivate,
    toggleHotspots,
    toggleCommentary,
    applyQuery,
    applyShareLink,
    shareSnapshot() {
      return {
        presetId: state.presetId,
        videoId: state.videoId === fallbackId ? "" : state.videoId,
        catalogId: state.catalogId,
        hotspotsOn: state.hotspotsOn,
        commentaryOn: state.commentaryOn,
        beatId: state.beatId,
      };
    },
    clearSelection,
    applyAutoWebcast,
    setLaunchWindow(launch, { source, bundle } = {}) {
      state.windowLaunch = launch || null;
      state.windowSource = source || "live";
      if (bundle) applyAutoWebcast(bundle);
      if (state.active) {
        syncChrome();
        followCommentary();
      } else renderCountdown();
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
