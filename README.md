# Starship Component Viewer

GitHub repository: **[SpaceX-](https://github.com/kellybyron2222-dev/SpaceX-)**.

**Live site (open in a normal browser):** [https://kellybyron2222-dev.github.io/SpaceX-/](https://kellybyron2222-dev.github.io/SpaceX-/)

This Pages app is the **Starship Component Viewer**. The related Grok bot is **Starship Render Lab** (public template + X quote-tweet later, ~Sep 29). Contest **not submitted**.

**Snapshot:** [STATUS.md](STATUS.md)

Bot / share links stay on `/SpaceX-/` as query (or hash): `?mode=learn&id=raptor`, `?mode=explore&scene=raptor`, `?mode=live&commentary=1&phase=catch`. In-app nav rewrites the URL so you can copy it.

Interactive Three.js mesh viewer of **approximate, publicly described** Starship / Super Heavy / Falcon / launch-pad componentry, plus a live launch tracker, a searchable teaching catalog, and **Live Launch** (public YouTube embed with clickable component hotspots). Parametric teaching models, not proprietary SpaceX CAD. The 3D view uses **PBR materials** with **image-based lighting** (RoomEnvironment / PMREM), **camera tweens** when framing parts, and optional **idle rotate**.

> Approximate educational model — not SpaceX CAD or flight hardware drawings.

## Contest demo script (2 minutes)

Booth walkthrough (~120s) — keep the footer disclaimer on screen the whole time. Laptop path; phone is backup only.

1. **Explore (25s).** Open on Full stack. Let idle rotate show the PBR/IBL lighting, then orbit the ~124 m vehicle. Hit **Explode** to lift the ship, then **Reset camera** (tween; also collapses explode). Skip the grid-fin vs catch-pin click if it is fiddly at booth distance — they are distinct Learn catalog picks.
2. **Tracker (20s).** Switch to **Tracker**. Point at Live data vs Sample and the “not official SpaceX telemetry” banner. Click a Starship Flight 14 row if listed, otherwise a Falcon 9 card. Use one related chip to jump into Learn.
3. **Learn + physics (30s).** Select **Raptor**. Flip Overview → **Sources**, then opt in to physics notes. Search **`ASDS`** or **`catch hardpoints`** — not bare `catch` (that substring is noisy).
4. **Falcon 9 (15s).** Explore → **Falcon 9**. Call out 9 Merlins, legs, fairing. Skip Mechazilla if time is tight (or swap this beat for Mechazilla, not both).
5. **Live Launch (30s).** Public-stream disclaimer + **T−** card (LL2, not official). If the newest Flight 13 clip blocks the iframe (101/150): **Watch on YouTube**, in-page plays the next Starship VOD. Hit **Start commentary**, then **Copy share link** (`?mode=live&commentary=1&video=` under `/SpaceX-/`). Ads cannot be stripped. Leave **Hotspots** off unless you pick one tagged name. Do not paste junk IDs.

If LL2 or YouTube fails: Sample banner + 3D path; keep talking.

## Grok Bot wrap (~Sep 29, Byron submits)

Contest **not submitted**. The shareable entry is a Grok Bot that **opens** this companion’s Commentator. Play-by-play is in-app.

1. On Live Launch, **Start commentary**, then **Copy share link**.
2. Paste that Pages URL (`https://kellybyron2222-dev.github.io/SpaceX-/?mode=live&commentary=1&video=…`) into the bot template so a tap opens Commentator on the **in-page playable** Starship VOD.
3. If Flight 13 NSF/SFN returns IFrame 101/150, the companion already skipped to the next Starship clip — Watch on YouTube for the blocked newest. Ads cannot be stripped.
4. Do not wrap a Falcon VOD. Do not claim CAD or official telemetry.

Byron submits via Grok Bot chat ~Sep 29. Do not submit from this repo.

## Deploy (GitHub Pages)

Pushes to `main` run `npm ci` → `npm run build` and publish `dist/` with GitHub Actions. Vite `base` is `/SpaceX-/` so asset URLs match this project-pages path.

**First-time enable (one click, if the site 404s):**

1. Open [Settings → Pages](https://github.com/kellybyron2222-dev/SpaceX-/settings/pages)
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Save. Then either wait for the next push to `main`, or open **Actions** → **Deploy GitHub Pages** → **Run workflow**

After that, the URL above is the public app.

### Alternate: Vercel (if Pages is blocked)

One-click import: [Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/kellybyron2222-dev/SpaceX-).

Or: [vercel.com/new](https://vercel.com/new) → Import `kellybyron2222-dev/SpaceX-` → Deploy. `vercel.json` builds with `VITE_BASE=/` so the app is served from the Vercel domain root instead of `/SpaceX-/`.

## Run

```bash
npm install
npm run dev
```

Then open the printed local URL, or [http://127.0.0.1:47321/SpaceX-/](http://127.0.0.1:47321/SpaceX-/) (Vite `base` is `/SpaceX-/`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the production build |

Production `vite.config.js` defaults `base` to **`/SpaceX-/`** for GitHub Pages (`https://kellybyron2222-dev.github.io/SpaceX-/`). Override with `VITE_BASE=/` for a root host (the Pages workflow and `vercel.json` already do this where needed).

Dependencies stay minimal: `three` and `vite`.

## App sections

| Tab | What you get |
| --- | --- |
| **Tracker** | Upcoming and recent SpaceX launches. Toggle **Live data** vs **Sample**. Click a mission to frame related pad/vehicle meshes. Related chips jump into Learn. |
| **Explore 3D** | Orbitable component viewer with PBR/IBL lighting. Click a mesh for a callout; **Open in Learn** deep-links the catalog. Idle rotate resumes after a few seconds. |
| **Learn** | Searchable **24-entry** catalog with Overview / History / Function / **Sources**. Physics notes stay collapsed until you opt in. |
| **Live Launch** | Public YouTube embed of the newest **playable Starship** webcast (skip Flight 13 101/150). **Commentator** play-by-play, Copy share link, Hotspots → Learn. Not official SpaceX telemetry. Ads cannot be stripped. |

## Launch tracker API (Launch Library 2)

Launches come from **[Launch Library 2](https://ll.thespacedevs.com/)** by [The Space Devs](https://thespacedevs.com/llapi) — a **public third-party** database, **not** official SpaceX telemetry, countdown, or range status.

- Endpoints: `GET /2.3.0/launches/upcoming/` and `/launches/previous/`
- Filter: `lsp__name=SpaceX` (agency id 121)
- Mode: `normal` (includes pad, rocket, mission, window, status)
- Refresh: every **10 minutes**, plus a manual **Refresh** button
- Source toggle: **Live data** (query Launch Library 2) vs **Sample** (cached teaching missions). If live is selected but the API is unreachable, the tracker falls back to sample, labels the chip **Live (offline)**, and says so.

### Keys and rate limits

The **free tier does not require a key** (about **15 requests/hour/IP**). This app makes two requests per refresh, so the default interval stays inside that budget.

For a higher rate limit (Patreon / The Space Devs paid tiers):

1. Copy `.env.example` to `.env`
2. Set `VITE_LL2_API_KEY=your_token`
3. Restart Vite

The key is sent as `Authorization: Token <key>` as documented by The Space Devs. **Never commit `.env`.**

If the live API is unreachable (network, CORS, or throttle), the tracker **falls back to cached sample missions** and labels the list as sample data — or you can pick **Sample** yourself. In local `npm run dev`, Vite also proxies `/ll2` → `https://ll.thespacedevs.com` as a CORS backup.

## Live Launch

**Live Launch** plays a **public YouTube embed** of Starship coverage and lets you click tagged components on the picture. Each hotspot maps to a catalog id (chopsticks, Raptor cluster, tiles, QD arm, flaps, OLM, …) and opens the same Learn detail panel: Overview / History / Function / Sources / Physics.

This is **not** official SpaceX telemetry, range video, or an internal camera product. The UI labels it as a public stream embed.

**Commentator** (toolbar or **C**) is the in-app sports-style play-by-play. It stays **off until Start** and sits **beside** the 16:9 frame so the video stays clear. Beats come from the bot-readable cue sheet at [`public/broadcast/cues.json`](public/broadcast/cues.json) (Flight 5 catch + Flight 13 T+ + generic phases). Each beat can highlight a hotspot and open Learn. Phase picker, mute, and pause auto-advance are on the panel. When nothing is live, the player prefills the latest completed official-style webcast from Launch Library 2 and syncs beats to that VOD clock (`t0Offset` + T+). Paste still wins (`?mode=live&commentary=1&phase=catch&video=hI9HQfCAw64`). Public educational beats only.

### Embeds can fail (use Open on YouTube)

YouTube often **blocks in-page playback**: a sign-in / “confirm you’re not a bot” wall, or player errors **101 / 150** when the uploader disabled embedding. **Some SpaceX video IDs cannot play in an embed even though the watch page works.** The default recap (`hI9HQfCAw64`) is oEmbed-allowed, but a datacenter or logged-out embed can still fail.

When the in-page player is blocked, Live Launch **does not leave a broken iframe plus hotspots as the only UI**. It shows a fallback card: thumbnail (max-res when available), a short explanation, and a large **Open on YouTube** button. A compact **Open on YouTube** chip also sits on the player so a bot-check wall still has an exit. **Can't play here?** in the sidebar forces the same fallback (bot wall with no error code). The app probes YouTube oEmbed: a **401** means embedding is disabled and skips the broken player. If the IFrame API never becomes ready, the fallback appears after a few seconds. Prefer IDs that allow embedding when changing the default.

### Set the YouTube ID

When Launch Library 2 / YouTube has no live Starship or Falcon webcast, Live Launch auto-selects the **most recent completed** official-style YouTube VOD (as of 2026-09-18 that is Starship Flight 13) and prefills the embed at T-0 when the stream start time is known. The Flight 5 recap (`hI9HQfCAw64`) stays the last-resort teaching VOD and the catch cue sheet. Prefer IDs that allow embedding.

1. In the Live Launch sidebar, paste a YouTube **watch** URL or 11-character **video** ID and click **Load** (remembered in `localStorage`). Playlist, channel, and `@handle` links are rejected — the parser will not scrape an 11-character token out of them. The ID field is monospace and stays on one line so `hI9HQfCAw64` is not read as `h19HQ/CAw64`.
2. Or copy `.env.example` to `.env`, set `VITE_YOUTUBE_VIDEO_ID=your_id`, and restart Vite. Env is the deploy-time default when the user has not pasted an ID.
3. **Reset to latest webcast** clears the saved ID and re-runs the LL2 live-or-latest picker (Flight 5 recap only if nothing newer is listed).
4. **Open on YouTube** is the primary action next to Load — use it whenever the embed is blocked.

### Overlay presets (JSON)

Hotspot boxes live in [`src/data/live/overlays.json`](src/data/live/overlays.json) so you can retune them **without changing app code**. Coordinates are normalized **0–1**, origin at the **top-left** of the 16:9 player. Shipped boxes are aligned to the **default Flight 5 recap frames** (gulf-side Starbase camera: **tower left, vehicle to the right of the tower** — not a centered pad plate).

**Picture fit** is a separate inset so the same boxes can sit on a **live webcast** (YouTube chrome + lower-thirds) without rewriting coordinates. Recap frames stay the default on the Flight 5 VOD; a detected live stream switches to **Live webcast**. Arrow **nudge** (session-only, ±12%) is for booth alignment when the camera is not the recap shot. Fit and nudge **do not turn Hotspots on**.

| Shape | Fields |
| --- | --- |
| `rect` | `x`, `y`, `w`, `h` |
| `polygon` | `points: [[x, y], …]` |

Each hotspot needs a `catalogId` that exists in `src/data/catalog.js`. Shipped presets:

- **Stack on pad** — recap pad/liftoff: stack, tower, chopsticks, QD, OLM, deluge, flaps, tiles, grid fins, Raptor cluster.
- **Catch / chopsticks** — recap catch (~1:40): arms, catch pins, grid fins, booster tanks, cluster. Picking this preset **seeks to ~1:40** (and starts playback) so the overlay is not sitting on the unplayed pad poster.

`chapters` in the same file are VOD markers (`t` in seconds → `presetId`). Times are **recap timestamps**, not mission elapsed time. The Flight 5 recap is ~3:28 (`expectedDurationSeconds`); booster catch at mission **T+6:54** is about **1:40** in this upload, not `t=420`. On a **live** stream the app shows the static preset selector and disables chapter follow. For a VOD, enable **Follow chapters** to swap presets as the playhead crosses markers. Edit the JSON to match another video. The ID field accepts a watch / youtu.be / embed URL or an exact 11-character **video** ID — playlists, channels, and handles are rejected.

Entering **Live Launch** clears leftover Learn/Tracker teach selection so a Merlin panel cannot sit beside a Starship VOD. Pick a tagged component (list or hotspot) to fill Overview / Sources again. Leaving Live Launch for **Explore 3D** or **Learn** frames that tagged part in 3D (grid fins, catch pins, chopsticks, …) instead of keeping the leftover Full stack camera.

Overlays start **off** so the webcast is watchable. Toggle them with the **Hotspots** toolbar button or **H**. When they are on, boxes stay dim (transparent fill, faint outline) until hover or keyboard focus; click still opens Learn. **On phones / coarse pointers, overlay boxes are visual only** (they do not steal the YouTube play control). Use the **Tagged components** list — rows are at least **44px** tall. The selected hotspot stays highlighted. Names in the sidebar work even when overlays are hidden.

### Starship countdown (public LL2)

If Launch Library 2 (or the sample teaching set) lists a Starship / Super Heavy / Starbase window, Live Launch shows a **T− / T+** card: mission, status, pad, and NET. That clock is a **public educational approximation** from [The Space Devs](https://thespacedevs.com/llapi) — **not** official SpaceX countdown, range status, or telemetry. In-flight public reports are labeled as such. The embed follows a live YouTube webcast when LL2 lists one; otherwise it prefills the latest completed VOD.

### Phase 2 (not in this MVP)

- Real-time computer-vision detection/tracking of parts on the live pixels
- Official SpaceX API / internal camera feeds


## What each 3D scene represents

All sizes are **rounded public figures** used only as rough scale (1 scene unit = 1 meter). Geometry is deliberately simple.

| Scene | Public-architecture notes |
| --- | --- |
| **Full stack** | Super Heavy + Starship, about **124 m** tall and **9 m** diameter. Exploded view lifts the ship. Includes rainbird stand-ins on the mount. |
| **Super Heavy** | First-stage booster, about **72 m**. Ring-stack barrel, raceway, three grid fins (V3 public layout; Falcon 9 still uses four), catch hardpoints, vented hot-staging ring, **33-Raptor** cluster (3 + 10 + 20). |
| **Starship** | Upper stage, about **52 m**. Ogive nose, barrel tanks, windward hex tiles, forward/aft flaps, three sea-level and three vacuum Raptors. |
| **Raptor engine** | Close-up methane/LOX **full-flow staged combustion** textbook teaching model: nozzle, chamber, gimbal, two preburners, pumps, pipes. Learn / Live show a licensed photo of real hardware beside the mesh. |
| **Mechazilla** | Launch-and-catch tower with chopsticks and a ghost booster. Tower height is a **~146 m-class** round figure. |
| **QD arm** | Quick-disconnect swing arm from a tower stub to a ghost 9 m barrel. |
| **Heat-shield panel** | Curved hex/rect tile grid. Explode lifts tiles along normals. |
| **Falcon 9** | ~**70 m** × **3.7 m** white stack: 9 Merlins, landing legs, grid fins, interstage, second stage, clamshell fairing. |
| **Falcon Heavy** | Triple core; explode separates side boosters. |
| **Falcon pad** | Strongback / TE, crew access arm, deluge, ghost Falcon 9 — LC-39A-class teaching GSE, not a site survey. |
| **ASDS droneship** | ~**90 × 50 m**-class barge with landing circle and octagon. |

Click any labeled mesh for a 1–2 sentence explainer. Nothing here is a drawing of flight hardware, orifices, weld schedules, or classified dimensions.

## Teaching catalog

Learn mode includes **24** entries spanning Starship and Falcon 9/Heavy. Each entry has public **Sources**. The Raptor card (and Live Raptor-cluster hotspot) also shows a **licensed Wikimedia still** of a real sea-level engine; the 3D stays a textbook teaching model. Public educational approximations — not official SpaceX infrastructure drawings.

**Vehicle:** Raptor, Vacuum Raptor, 33-Raptor cluster, Merlin 1D, **Merlin Vacuum**, Starship tanks, **Falcon tanks**, downcomer raceway, nosecone / payload bay, flaps, grid fins, **catch hardpoints**, heat-shield tiles, hot-stage / interstage, payload fairing, landing legs.

**Ground:** chopsticks / catch arms, OLM / launch mount, QD arm, water deluge / rainbirds, crew access arm, ASDS, Mechazilla tower, strongback / TE.

Grid fins and catch pins are separate picks: the waffle lattice opens **Grid fins**; the gold pins open **Catch hardpoints**. Raycasting prefers the smaller, higher-priority pin proxies so a nearby fin lattice does not steal the click.

Each entry stores family (Starship / Falcon / shared), category, a short blurb, history, function, optional physics notes, public sources, and a link to the 3D scene + mesh id that should highlight.

Physics copy uses **order-of-magnitude public figures** (9 m diameter, 124 / 72 / 52 m stack, 33 engines, Merlin-class kN, ~146 m tower). It is not a performance datasheet.

## Controls

- **T** Tracker · **V** Explore · **L** Learn · **Y** Live Launch
- **H** toggle Live Launch hotspots
- **Orbit** one-finger / left-drag · **pan** two-finger / right-drag · **zoom** pinch / wheel
- **R** reset camera and explode (tweened) · **I** idle rotate · **S** screenshot PNG · **E** exploded view
- **1–9** and **0** switch 3D scenes · **-** ASDS droneship · **F** fullscreen · **?** help · **Esc** clear selection

## Contest / demo notes

- Suitable for a booth laptop: low-poly primitives, instanced tiles, no texture downloads.
- Screenshot writes the WebGL canvas (`preserveDrawingBuffer`).
- Camera moves between scenes and catalog picks are tweened; idle rotate pauses while you orbit.
- Launch status mapping is from LL2 abbreviations (Go, TBD/TBC, Hold, Scrub, In Flight, Success, Failure) onto the tracker chips.
- Clicking a launch highlights related catalog hardware (e.g. Starbase → chopsticks / OLM / QD; LC-39A → strongback / crew arm; SLC-40 / SLC-4E → Falcon 9 + ASDS).
- Keep the footer disclaimer if you extend the models.
