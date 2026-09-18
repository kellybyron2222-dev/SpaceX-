# Starship Component Viewer

GitHub repository: **[SpaceX-](https://github.com/kellybyron2222-dev/SpaceX-)**.

**Live site (open in a normal browser):** [https://kellybyron2222-dev.github.io/SpaceX-/](https://kellybyron2222-dev.github.io/SpaceX-/)

Interactive Three.js mesh viewer of **approximate, publicly described** Starship / Super Heavy / Falcon / launch-pad componentry, plus a live launch tracker and a searchable teaching catalog. Built as a Grok Bot contest showcase: parametric models, not proprietary SpaceX CAD.

> Approximate educational model — not SpaceX CAD or flight hardware drawings.

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

Then open the printed local URL (default [http://127.0.0.1:47321](http://127.0.0.1:47321)).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production bundle in `dist/` |
| `npm run preview` | Serve the production build |

Dependencies stay minimal: `three` and `vite`.

## App sections

| Tab | What you get |
| --- | --- |
| **Tracker** | Upcoming and recent SpaceX launches (Starship, Falcon 9, Falcon Heavy). Click a mission to frame related pad/vehicle meshes. Related chips jump into Learn. |
| **Explore 3D** | Original orbitable component viewer. Click a mesh for a short callout; **Open in Learn** deep-links the catalog. |
| **Learn** | Searchable critical-infrastructure catalog. Selecting an entry drives the 3D scene and opens Overview / History / Function. Physics notes stay collapsed until you opt in. |

## Launch tracker API (Launch Library 2)

Launches come from **[Launch Library 2](https://ll.thespacedevs.com/)** by [The Space Devs](https://thespacedevs.com/llapi) — a **public third-party** database, **not** official SpaceX telemetry, countdown, or range status.

- Endpoints: `GET /2.3.0/launches/upcoming/` and `/launches/previous/`
- Filter: `lsp__name=SpaceX` (agency id 121)
- Mode: `normal` (includes pad, rocket, mission, window, status)
- Refresh: every **10 minutes**, plus a manual **Refresh** button

### Keys and rate limits

The **free tier does not require a key** (about **15 requests/hour/IP**). This app makes two requests per refresh, so the default interval stays inside that budget.

For a higher rate limit (Patreon / The Space Devs paid tiers):

1. Copy `.env.example` to `.env`
2. Set `VITE_LL2_API_KEY=your_token`
3. Restart Vite

The key is sent as `Authorization: Token <key>` as documented by The Space Devs. **Never commit `.env`.**

If the live API is unreachable (network, CORS, or throttle), the tracker **falls back to cached sample missions** and labels the list as sample data. In local `npm run dev`, Vite also proxies `/ll2` → `https://ll.thespacedevs.com` as a CORS backup.

## What each 3D scene represents

All sizes are **rounded public figures** used only as rough scale (1 scene unit = 1 meter). Geometry is deliberately simple.

| Scene | Public-architecture notes |
| --- | --- |
| **Full stack** | Super Heavy + Starship, about **121 m** tall and **9 m** diameter. Exploded view lifts the ship. Includes rainbird stand-ins on the mount. |
| **Super Heavy** | First-stage booster, about **71 m**. Ring-stack barrel, raceway, four grid fins, catch hardpoints, vented hot-staging ring, **33-Raptor** cluster (3 + 10 + 20). |
| **Starship** | Upper stage, about **50 m**. Ogive nose, barrel tanks, windward hex tiles, forward/aft flaps, three sea-level and three vacuum Raptors. |
| **Raptor engine** | Close-up methane/LOX **full-flow staged combustion** teaching model: nozzle, chamber, gimbal, preburners, pumps, pipes. |
| **Mechazilla** | Launch-and-catch tower with chopsticks and a ghost booster. Tower height is a **~146 m-class** round figure. |
| **QD arm** | Quick-disconnect swing arm from a tower stub to a ghost 9 m barrel. |
| **Heat-shield panel** | Curved hex/rect tile grid. Explode lifts tiles along normals. |
| **Falcon 9** | ~**70 m** × **3.7 m** white stack: 9 Merlins, landing legs, grid fins, interstage, second stage, clamshell fairing. |
| **Falcon Heavy** | Triple core; explode separates side boosters. |
| **Falcon pad** | Strongback / TE, crew access arm, deluge, ghost Falcon 9 — LC-39A-class teaching GSE, not a site survey. |
| **ASDS droneship** | ~**90 × 40 m** barge with landing circle and octagon. |

Click any labeled mesh for a 1–2 sentence explainer. Nothing here is a drawing of flight hardware, orifices, weld schedules, or classified dimensions.

## Critical infrastructure catalog

Learn mode includes **17** entries spanning Starship and Falcon 9/Heavy:

**Vehicle:** Raptor, Merlin 1D, tanks, flaps, grid fins, heat-shield tiles, hot-stage / interstage, payload fairing, chopsticks, landing legs.

**Ground:** OLM / launch mount, QD arm, water deluge / rainbirds, crew access arm, ASDS, Mechazilla tower, strongback / TE.

Each entry stores family (Starship / Falcon / shared), category, a short blurb, history, function, optional physics notes, and a link to the 3D scene + mesh id that should highlight.

Physics copy uses **order-of-magnitude public figures** (9 m diameter, 33 engines, Merlin-class kN, ~146 m tower). It is not a performance datasheet.

## Controls

- **T** Tracker · **V** Explore · **L** Learn
- **Orbit** left-drag · **pan** right-drag · **zoom** wheel / pinch
- **R** reset camera · **S** screenshot PNG · **E** exploded view
- **1–9** and **0** switch 3D scenes · **F** fullscreen · **?** help · **Esc** clear selection

## Contest demo script (2 minutes)

Booth walkthrough — keep the footer disclaimer on screen the whole time.

1. **Explore (20s).** Open on Full stack. Orbit the ~121 m vehicle, click the engine cluster and a grid fin so callouts appear. Hit **Explode** to lift the ship, then **Reset camera**.
2. **Tracker (25s).** Switch to **Tracker**. Point at the “Launch Library 2 / not official SpaceX telemetry” banner. Click a Falcon 9 card (pad lights up in 3D) or a Starbase/Starship row if one is listed. Use a related chip (Merlin, chopsticks, ASDS) to jump into Learn.
3. **Learn + physics (30s).** Stay in **Learn**, select **Raptor**. Flip Overview → History → Function. Click **I’m interested in the physics notes** and read the order-of-magnitude Pc / cluster packing note. Search “deluge” or “ASDS” to show Falcon ground gear.
4. **Falcon 9 (20s).** Explore → **Falcon 9**. Call out 9 Merlins, legs, fairing. Explode opens the clamshell and kicks the legs out.
5. **Catch hardware (15s).** Open **Mechazilla**. Explode spreads the chopsticks around the ghost booster. Screenshot (S) if judges want a still.

If live launches fail, the sample-data banner is expected — keep talking; the 3D path is the demo.

## Contest / demo notes

- Suitable for a booth laptop: low-poly primitives, instanced tiles, no texture downloads.
- Screenshot writes the WebGL canvas (`preserveDrawingBuffer`).
- Launch status mapping is from LL2 abbreviations (Go, TBD/TBC, Hold, Scrub, In Flight, Success, Failure) onto the tracker chips.
- Clicking a launch highlights related catalog hardware (e.g. Starbase → chopsticks / OLM / QD; LC-39A → strongback / crew arm; SLC-40 / SLC-4E → Falcon 9 + ASDS).
- Keep the footer disclaimer if you extend the models.
