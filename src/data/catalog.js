/** Teaching catalog — public-architecture notes only, not official SpaceX infrastructure. */

const SRC = {
  starship: { label: "SpaceX Starship", url: "https://www.spacex.com/vehicles/starship/" },
  falcon9: { label: "SpaceX Falcon 9", url: "https://www.spacex.com/vehicles/falcon-9/" },
  updates: { label: "SpaceX updates", url: "https://www.spacex.com/updates" },
  f9guide: {
    label: "Falcon Payload User’s Guide",
    url: "https://www.spacex.com/assets/media/falcon-users-guide-2025-05-09.pdf",
  },
  nasaCct: {
    label: "NASA Commercial Crew",
    url: "https://www.nasa.gov/humans-in-space/commercial-space/commercial-crew-program/",
  },
  faa: {
    label: "FAA Starship environmental reviews",
    url: "https://www.faa.gov/space/stakeholder_engagement/spacex_starship",
  },
  ll2: { label: "Launch Library 2 (The Space Devs)", url: "https://ll.thespacedevs.com/" },
};

export const CATALOG = [
  {
    id: "raptor",
    name: "Raptor",
    family: "starship",
    category: "Engine",
    domain: "vehicle",
    sceneId: "raptor",
    partId: "raptor.engine",
    matchIds: [
      "raptor.engine",
      "raptor.nozzle",
      "raptor.chamber",
      "raptor.gimbal",
      "raptor.oxPre",
      "raptor.fuelPre",
      "raptor.injector",
      "raptor.oxPump",
      "raptor.fuelPump",
      "raptor.plumbing",
      "raptor.tvc",
      "starship.sl",
    ],
    blurb: "Methane and liquid oxygen. Powers Super Heavy and Starship. This 3D is a teaching sketch, not CAD.",
    overview:
      "Raptor burns liquid methane with liquid oxygen. Super Heavy and Starship both use it. Public talks call the cycle full-flow staged combustion and quote chamber pressure in the hundreds of bar. This mesh is a teaching model — not a bill of materials.",
    history:
      "SpaceX has shown Raptor prototypes since the mid-2010s — photos, talks, hops, then orbital tests. They distinguish sea-level and vacuum versions. Chamber-pressure goals in the hundreds of bar are public. Injector layout, alloys, and as-flown thrust are not released as drawings. This viewer does not invent them.",
    function:
      "Each Raptor burns liquid methane with liquid oxygen. Super Heavy uses a sea-level cluster (publicly 33). Starship mixes gimbaling sea-level engines with larger-bell vacuum engines. Full-flow means each turbopump runs on gas of its own propellant — a cycle SpaceX talks about in public. On the pad, start-up loads hit the launch mount.",
    physics:
      "Order-of-magnitude teaching notes, not a datasheet. Public Raptor remarks put chamber pressure in the hundreds of bar — much higher than gas-generator RP-1 engines such as Merlin. Higher Pc shrinks throat area for a given thrust and helps specific impulse, at the cost of turbomachinery power and heat flux. A round vehicle diameter of ~9 m sets the cluster packing problem: 33 sea-level bells must fit under Super Heavy with gimbal clearance. Regenerative cooling moves heat into the methane jacket before it reaches the wall’s structural limit; the rings on the 3D bell only hint at that jacket. Treat any numeric thrust or Isp you see in press as approximate and era-specific.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
  },
  {
    id: "vacuum-raptor",
    name: "Vacuum Raptor",
    family: "starship",
    category: "Engine",
    domain: "vehicle",
    sceneId: "starship",
    partId: "starship.vac",
    matchIds: ["starship.vac"],
    blurb: "The big-bell Raptors on Starship. Three sit around the sea-level trio. Bell size here is a teaching guess.",
    overview:
      "Vacuum Raptors have much larger nozzles than the sea-level engines on the same ship. They do most of their work in thin air. The 3D bells are scale cartoons, not production hardware.",
    history:
      "Stacking and static-fire photos show the two families side by side. Nozzle hardware has changed flight to flight. This mesh is not a production bell.",
    function:
      "A large expansion ratio raises specific impulse once the air is gone. These engines usually gimbal less than the center sea-level set used for landing. Learn frames the aft bay here, not the Raptor close-up.",
    physics:
      "Ideal-rocket expansion: a larger exit area ratio better matches a near-zero ambient pressure, reducing underexpansion losses. The sea-level engines would overexpand (and risk flow separation) with the same bell on the pad. Treat the 3D bells as scale cartoons — expansion ratio is not measured from this model.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "booster-cluster",
    name: "33-Raptor cluster",
    family: "starship",
    category: "Engine",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.engines",
    matchIds: ["booster.engines", "booster.octaweb"],
    blurb: "Super Heavy: 33 sea-level Raptors in three rings (3 + 10 + 20). Bells and spacing are round-number guesses.",
    overview:
      "Thirty-three sea-level Raptors sit under Super Heavy in three rings. Public photos count them. The 3D packing is a round-number teaching guess — not a thrust-structure drawing.",
    history:
      "Webcasts and booster photos show a 33-engine sea-level cluster. SpaceX talks about inner, middle, and outer rings and engine-out at a high level. The aft structure is a thrust puck / engine section in public comments — octaweb is the Falcon 9 nine-engine nickname, not a Super Heavy drawing. Count and shielding have changed across flight articles.",
    function:
      "This cluster is the booster’s only propulsion: liftoff, boostback when used, then landing or catch burn. Inner engines gimbal. Outer engines fill the ~9 m aft bay. Explode view drops the three rings so you can count them.",
    physics:
      "Packing 33 ~1 m-class bells under a 9 m cylinder is a geometry constraint as much as a thrust one. Engine-out means the remaining set must still provide the required Δv and control. Acoustic and thermal load on the launch mount scales with the whole cluster, which is why deluge and a water-cooled deck showed up in public pad upgrades after early integrated tests.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
  },
  {
    id: "merlin",
    name: "Merlin 1D",
    family: "falcon",
    category: "Engine",
    domain: "vehicle",
    sceneId: "falcon9",
    partId: "falcon9.engines",
    matchIds: ["falcon9.engines", "falcon9.octaweb"],
    blurb: "RP-1 and liquid oxygen, gas-generator cycle. Nine on Falcon 9, 27 on Heavy. Simple bells, public counts.",
    overview:
      "Merlin 1D is the kerosene engine on Falcon. Nine on Falcon 9, twenty-seven on Heavy. Public user’s guides publish thrust-class numbers that changed with Block upgrades. These bells are teaching shapes.",
    history:
      "Merlin started on Falcon 1 and became the 1D on Falcon 9 and Heavy. User’s guides and FAA filings quote thrust and mixture-ratio class numbers that moved across Blocks. Octaweb is the public name for the nine-engine thrust structure. Landing, boostback, and reentry burns use a subset of engines — you can see that on recovery livestreams.",
    function:
      "The first-stage cluster lifts Falcon off the pad, then relights for boostback (when used), reentry, and landing. The center engine usually does the last landing burn. The second stage is a single Merlin Vacuum. RP-1 is refined kerosene. Restarts and deep throttle are shown in flight. Controller gains and injector design stay unpublished.",
    physics:
      "Public Block 5-era figures put a Merlin 1D in the roughly 800–900 kN sea-level thrust class per engine (check the vintage of any source). Nine engines therefore provide on the order of 7–8 MN at liftoff before throttling — enough, with a ~3.7 m vehicle, for the well-known Falcon 9 thrust-to-weight that allows RTLS or ASDS recovery after downrange missions. Gas-generator cycles dump turbine exhaust overboard, so they give up some Isp versus staged combustion; they are mechanically simpler. These are back-of-envelope relationships for a classroom, not performance guarantees.",
    sources: [SRC.falcon9, SRC.f9guide, SRC.updates],
  },
  {
    id: "merlin-vac",
    name: "Merlin Vacuum",
    expand: "MVac — Falcon second stage vacuum engine",
    family: "falcon",
    category: "Engine",
    domain: "vehicle",
    sceneId: "falcon9",
    partId: "falcon9.second",
    matchIds: ["falcon9.second", "falcon9.interstage"],
    blurb: "One Merlin Vacuum on Falcon’s second stage. Bigger bell than the 1D cluster. Size here is a teaching guess.",
    overview:
      "After staging, one Merlin Vacuum pushes the Falcon upper stage. Its bell is larger than the nine sea-level engines. This size is a teaching guess, not a measured expansion ratio.",
    history:
      "Public flights show a single upper-stage Merlin with a bigger nozzle. Payload User’s Guides call it a restartable RP-1/LOX engine for LEO, GTO, and disposal burns. The black band on the model is the composite interstage — a staging joint, not a Merlin 1D.",
    function:
      "MVac circularizes after staging and restarts when the mission needs it. The first-stage cluster does not go to orbit. Pick the upper-stage tank or vacuum bell for this card; pick the octaweb bells for Merlin 1D.",
    physics:
      "A larger exit area ratio better matches vacuum, raising specific impulse versus the sea-level 1D at the cost of a bigger, thinner bell that would separate on the pad. Restart in zero-g needs settling or ullage — shown on webcasts, not modeled here. Treat guide Isp figures as vintage-specific teaching numbers.",
    sources: [SRC.falcon9, SRC.f9guide, SRC.updates],
  },
  {
    id: "starship-tanks",
    name: "Starship / Super Heavy tanks",
    family: "starship",
    category: "Tanks",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.barrel",
    matchIds: ["booster.barrel", "starship.barrel"],
    blurb: "Stainless rings, about 9 m across, stacked into methane and LOX tanks on both stages.",
    overview:
      "Both Starship and Super Heavy are mostly tank. Stacked stainless rings, about 9 m across, hold methane and liquid oxygen. That is the airframe. Exact alloy temper and weld maps are not public drawings.",
    history:
      "Factory tours and stacking photos show cylindrical rings with girth welds — not Falcon’s aluminum-lithium barrel-and-dome stack. Elon Musk and SpaceX have talked about 300-series stainless as a cryogenic, heat-shield-friendly choice. Header tanks in the nose show up on flight articles. Temper, weld schedule, and minimum gauge are not released as drawings.",
    function:
      "Tanks store cryogenic CH4 and LOX, feed the engines, and are the primary airframe. Common domes and downcomers (the raceway on the model) move propellant. In flight they take compression, bending, and pressure. On reentry the windward skin is tiled; the leeward side is mostly bare stainless in public photos.",
    physics:
      "A 9 m cylinder ~72 m tall (booster) or ~52 m (ship) is a thin-walled pressure vessel plus column. Hydrostatic head of LOX is non-trivial over tens of meters, so tank pressure and baffles matter. Stainless has lower specific stiffness than the Falcon aluminum stack, which is one public rationale for the large diameter. Cryo shrinkage, buckling under thrust, and slosh during flip maneuvers are the usual textbook issues — none of which we size here. Ring spacing on the model (~1.8 m) matches the commonly photographed barrel-section height, used only as visual scale.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
  },
  {
    id: "falcon-tanks",
    name: "Falcon tanks",
    expand: "Falcon 9 / Heavy RP-1 and LOX barrels, about 3.7 m",
    family: "falcon",
    category: "Tanks",
    domain: "vehicle",
    sceneId: "falcon9",
    partId: "falcon9.tanks",
    matchIds: ["falcon9.tanks", "falconheavy.center", "falconheavy.side"],
    blurb: "White aluminum-lithium barrels, about 3.7 m across, hold RP-1 and LOX on Falcon 9 and Heavy.",
    overview:
      "Falcon tanks are painted aluminum-lithium barrels, about 3.7 m across. They hold RP-1 and liquid oxygen and they are the airframe. Not Starship’s stainless rings.",
    history:
      "These are the public aluminum-lithium barrel-and-dome tanks, not Starship’s stainless rings. User’s guides and factory photos are the source. Weld maps and minimum gauge are not released. Falcon Heavy’s side boosters are extra Falcon-class cores — teaching stand-ins, not unique Heavy CAD.",
    function:
      "Tanks are the airframe: they store propellant, take thrust from the octaweb, and carry the interstage and legs. Click a Falcon 9 barrel, a Heavy center core, or a Heavy side booster to open this card — not Merlin 1D.",
    physics:
      "A ~3.7 m thin-walled column plus hydrostatic head of LOX over tens of meters is the usual tank-sizing story. Common bulkheads and tank pressure are real design drivers; we draw painted cylinders. Ring spacing is a visual cue, not a production weld schedule.",
    sources: [SRC.falcon9, SRC.f9guide, SRC.updates],
  },
  {
    id: "raceway",
    name: "Downcomer raceway",
    family: "starship",
    category: "Tanks",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.raceway",
    matchIds: ["booster.raceway", "starship.raceway"],
    blurb: "A raised trunk for cables and propellant lines down the booster and ship. A simple fairing, not a routing diagram.",
    overview:
      "That raised strip down the side is the raceway. Pressurant, avionics, and transfer lines live there. Photos are the source. Line IDs are not published.",
    history:
      "Rollout photos show a long raceway on Super Heavy and Starship, different from Falcon’s cable trays. SpaceX has talked about downcomers that move propellant between tanks. Insulation and line IDs are not published.",
    function:
      "The raceway is the external trunk for lines that cannot live only inside the tanks. Click it in 3D to open this card, not the barrel tanks.",
    physics:
      "A downcomer over tens of meters sees hydrostatic head, two-phase flow during fill, and thermal contraction. We draw a box. Fill-rate sizing is not in this viewer.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "payload-bay",
    name: "Nosecone / payload bay",
    family: "starship",
    category: "Payload",
    domain: "vehicle",
    sceneId: "starship",
    partId: "starship.nose",
    matchIds: ["starship.nose"],
    blurb: "Ogive nose on the ~52 m upper stage. Public write-ups put payload volume and landing header tanks up here.",
    overview:
      "The nose closes the stack and can hold cargo or crew volume. Public flight-article photos put both landing header tanks here — LOX at the tip, methane just below. This ogive is a scale stand-in, not a dispenser CAD model.",
    history:
      "Starship does not use a Falcon-style clamshell fairing for most cargo. SpaceX has shown PEZ-style dispensers, cargo-door ideas, and crew interiors as public renderings or test hardware. Header tanks in the nose appear on flight articles. This ogive is a scale stand-in.",
    function:
      "The nose is the aero cap. It can house payload or crew volume. Public flight-article photos put the landing header tanks here — LOX at the nose tip, methane stacked just below. That is not a CH4-forward / LOX-aft split, and not a CAD tank map.",
    physics:
      "An ogive is a low-drag nose for the boost phase; reentry heating on the nose is managed by tiles plus attitude. Public photos and encyclopedia summaries of those photos put both landing headers in the nose: the LOX header forming the tip and the methane header under it — not a CH4-forward / LOX-aft split, and not a CAD tank map. Forward header mass is a CG story for belly-flop entry. None of that is simulated.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "flaps",
    name: "Starship flaps",
    family: "starship",
    category: "Aero",
    domain: "vehicle",
    sceneId: "starship",
    partId: "starship.aftFlaps",
    matchIds: ["starship.aftFlaps", "starship.fwdFlaps"],
    blurb: "Four body flaps — two forward, two aft — steer the belly-flop and the landing flip. Plates, not actuator CAD.",
    overview:
      "Four flaps: two small ones up front, two bigger ones aft. They keep the tiled belly into the wind on the way down, then help set up the landing flip. These plates have no hinge motors.",
    history:
      "Every public Starship since the high-altitude hops has flown large flaps. Livestreams show them moving on the way down. Some flights damaged or lost flap hardware — SpaceX said so after the fact. Actuation is electric in public comments. Hinge locations and seals stay approximate from the outside.",
    function:
      "On the way down the ship flies belly-first. Forward flaps and the bigger aft flaps trim pitch and roll so the heat shield stays into the wind. Near the pad they help set up the flip; then engines take over. They take heat and load, not just aero.",
    physics:
      "At high alpha, lift and drag are dominated by the barrel plus flap deflection, not a slender-rocket formula. Hinge moment scales with dynamic pressure × area × chord; aft flaps are larger because they sit farther from the center of mass and see a different local flow. Public videos of flap flutter or peeling are reminders that unsteady loads and heating at the hinge line are design drivers. The 3D plates here have no hinge-moment model.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "grid-fins",
    name: "Grid fins",
    family: "shared",
    category: "Aero",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.fins",
    matchIds: ["booster.fins", "falcon9.fins"],
    blurb:
      "Lattice fins that steer a returning booster. Falcon 9: four. Public Super Heavy V3 reporting (Ars, May 2026): three.",
    overview:
      "Grid fins steer the booster after the entry burn so it can hit a droneship or the chopsticks. Falcon 9 flies four. Public Super Heavy V3 reporting (Ars, May 2026) is three. They are not the catch pins.",
    history:
      "Falcon 9 fins started aluminum and later went titanium after heating and stiction on early recoveries — SpaceX said so. Super Heavy flew four large fins on earlier articles; public V3 booster reporting describes three. Lattice thickness, latches, and hydraulic vs electric drive differ and are not specified here.",
    function:
      "After the entry burn, grid fins give roll, pitch, and yaw so the booster can hit a droneship or the chopsticks. They fold for ascent. On Super Heavy they sit near the catch-arm keep-out, but they are not the catch pins. Pick the waffle lattice here; pick the gold pins for Catch hardpoints. Falcon filter frames the Falcon 9 fins; All / Starship open the Super Heavy V3 three-fin scene.",
    physics:
      "A grid fin is a lattice of small lifting surfaces that stalls more gently and packs against a cylinder better than a planar fin of equal control power. Hinge moment still grows with q-bar. Titanium’s melting point and stiffness are the usual public explanation for the Falcon upgrade. Super Heavy’s ~9 m body means fin area must grow roughly with the moment of inertia and aero lever arm — the model fins are scaled for look, not a CFD-derived area.",
    sources: [SRC.starship, SRC.falcon9, SRC.updates],
  },
  {
    id: "catch-pins",
    name: "Catch hardpoints",
    family: "starship",
    category: "Recovery",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.hardpoints",
    matchIds: ["booster.hardpoints"],
    blurb: "Lift and catch pins near the top of Super Heavy — where the chopsticks grab. Not the grid fins.",
    overview:
      "Those pins near the top of Super Heavy are what the tower arms close on. Grid fins steer. Pins carry the load. This card exists so a click on a pin does not open Grid fins.",
    history:
      "Public Super Heavy photos show pins near grid-fin height. The 2024 catch webcast made the load path obvious: arms to pins, not to the waffle fins. Shape has changed; these cylinders are stand-ins.",
    function:
      "Pins take stack and catch loads into the barrel and into the chopsticks. Grid fins steer; pins carry. Click a pin for this card. Click a lattice for Grid fins.",
    physics:
      "A caught booster is a concentrated load at two (or more) lugs high on a thin cylinder. Even a small lateral offset is a large moment at the tower root and a local bearing stress in the pin. We do not quote margins. Invisible pick proxies sit on the pins so the thin hardware wins against the nearby fin lattice in the raycaster.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "tiles",
    name: "Heat-shield tiles",
    family: "starship",
    category: "TPS",
    domain: "vehicle",
    sceneId: "tiles",
    partId: "tiles.tiles",
    matchIds: ["tiles.tiles", "tiles.carrier", "tiles.felt", "starship.tiles"],
    blurb: "Black tiles on the belly that take reentry heat. This hex grid is a teaching stand-in, not a flight map.",
    overview:
      "The windward side — the belly — wears thousands of black ceramic tiles so the stainless tank does not cook on the way down. The back is mostly bare metal. Hex and a few rectangular edge tiles show up in close-up photos. This grid is a teaching stand-in, not a flight map or a glue spec.",
    history:
      "Public photos show thousands of black tiles on the belly and mostly bare stainless on the back. SpaceX has talked about missing tiles, catch-and-replace work, and a secondary ablative layer in flight updates. Hex vs rectangular edge tiles appear in close-ups. Serials and adhesive specs are not published.",
    function:
      "Tiles keep reentry heat off the steel so the tank stays below structural limits. Gaps, felt, and a carrier handle expansion. Flaps keep the hottest flow on the tiled face.",
    physics:
      "Leeside vs windward heating at high alpha is a classic blunt-body result: stagnation and acreage heat flux on the belly, much lower on the back. Ceramic tiles work by low conductivity and high emissivity; the metal behind them is a heat sink. A round 9 m radius sets the curvature the tile grid must follow — the explode view lifts tiles along surface normals to show that packing. Bond-line temperature and gap-heating are real issues; we do not compute them.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
  },
  {
    id: "hot-stage",
    name: "Hot-stage / interstage",
    family: "starship",
    category: "Staging",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.staging",
    matchIds: ["booster.staging", "fullstack.ship", "fullstack.booster"],
    blurb:
      "Starship lights while still stacked. This ring is a generic vented band, not a mechanism. Falcon’s black interstage is a different card.",
    overview:
      "Hot staging means the ship fires while it is still on the booster. Exhaust vents through a ring instead of waiting for a clean gap. This band is generic. Falcon’s composite interstage is the black band on the Falcon 9 scene — not this card.",
    history:
      "Falcon 9 stages with a composite interstage and pneumatic pushers — visible on every webcast. Starship’s public test flights added a vented hot-staging ring around 2023–2024. SpaceX noted that some Soviet vehicles did this too. Hardware has changed between flights; this ring is generic.",
    function:
      "Staging has to split two pressurized vehicles without a recontact, while the upper stage lights. Hot staging vents ship exhaust through a ring. Falcon’s interstage also hides the second-stage Merlin at ignition.",
    physics:
      "Hot staging trades a plume-in-the-interstage problem for a shorter unpowered gap and residual booster thrust. Loads on the ring are acoustic, thermal, and compressive. Falcon’s cold-ish staging still has ullage and pusher-force requirements. Neither is sized here; the explode view on Full stack simply lifts the ship to show the interface.",
    sources: [SRC.starship, SRC.falcon9, SRC.updates],
  },
  {
    id: "fairing",
    name: "Payload fairing",
    family: "falcon",
    category: "Payload",
    domain: "vehicle",
    sceneId: "falcon9",
    partId: "falcon9.fairing",
    matchIds: ["falcon9.fairing"],
    blurb: "Two composite halves that cover a Falcon payload through max-q, then split and get recovered when the mission allows.",
    overview:
      "Falcon uses a clamshell fairing. It keeps air and noise off the payload, then splits once the air is thin. Starship’s nose is part of the ship — most cargo does not get a Falcon-style fairing. Sizes here follow the user’s guide class, not a drawing.",
    history:
      "Falcon fairings are composite halves. SpaceX chased recovery with parachutes, boat nets (Mr. Steven / Ms. Tree), then catch-and-fish — they talk about reuse in launch updates. Starship does not use this fairing for most cargo. User’s guide length and diameter class are the only scale used here.",
    function:
      "Fairings keep acoustic and aero loads off the payload until the air is thin enough. They jettison on a public, mission-specific timeline. Blankets and dispenser hardware are omitted.",
    physics:
      "Fairing volume is set by payload dynamic envelope, not rocket aesthetics. Jettison happens when dynamic pressure × heating is low enough that the exposed payload survives. Half-shells in explode view separate laterally — the real hinge/piston kinematics are more specific and not modeled.",
    sources: [SRC.falcon9, SRC.f9guide, SRC.updates],
  },
  {
    id: "chopsticks",
    name: "Chopsticks / catch arms",
    expand: "Mechazilla tower arms that stack stages and catch Super Heavy",
    family: "starship",
    category: "Recovery",
    domain: "ground",
    sceneId: "mechazilla",
    partId: "mechazilla.arms",
    matchIds: ["mechazilla.arms", "mechazilla.pads", "mechazilla.carriage"],
    blurb: "Tower arms on the pad — they stack the rocket and can catch Super Heavy. Not part of the vehicle.",
    overview:
      "Chopsticks are the two big tower arms on the launch pad, not on the rocket. They stack Starship and, as shown in public, catch a returning Super Heavy. The 2024 catch was public. Arm speed and fail-safes are not published. Vehicle pins are a separate card.",
    history:
      "The arms stacked Starship first, then caught Super Heavy on a public 2024 test flight — a first for an orbital-class booster. SpaceX has talked about catch vs landing-leg mass. Arm speed, compliance, and fail-safes are not published. Kennedy’s Starship pad is a separate public construction story.",
    function:
      "Arms open around a ~9 m vehicle, close on hardpoints, and ride a carriage up the tower to stack or after a catch. In the current public architecture they replace landing legs on the booster. The model has a ghost booster so the catch bay is readable. Vehicle-side pins are Catch hardpoints.",
    physics:
      "Catch is a relative-navigation and energy-absorption problem: a ~72 m, 9 m-diameter booster arrives with residual vertical rate that the arms and pins must take as a load path into the tower. Even a small lateral offset becomes a large moment at the tower root. Public videos are the right intuition; we do not quote structural margins. Exploded view opens the arms so the keep-out cylinder is obvious.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "landing-legs",
    name: "Landing legs (Falcon)",
    family: "falcon",
    category: "Recovery",
    domain: "vehicle",
    sceneId: "falcon9",
    partId: "falcon9.legs",
    matchIds: ["falcon9.legs"],
    blurb: "Four folding legs that put a Falcon first stage on a droneship or landing zone. Super Heavy’s public path uses chopsticks instead.",
    overview:
      "Falcon first stages land on four folding legs. Super Heavy’s public catch path uses chopsticks instead. Deploy shows up on livestreams just before touchdown.",
    history:
      "Legs showed up on early Falcon 9 recovery tries and became routine on Block vehicles. Livestreams show deploy just before landing. Materials and crush-core details were only discussed at a high level. Super Heavy test articles have generally not flown operational legs in the chopsticks era.",
    function:
      "Legs eat leftover vertical speed, keep the bells off the deck, and stop a tip-over in wind or sea state. They stow along the tank on the way up.",
    physics:
      "Touchdown energy is ½mv² plus any tip-over moment from deck tilt (ASDS) or engine-out. Four outriggers increase the support polygon. Deployed length is a trade against engine-bell clearance and mass. The explode view kicks the legs outward so the polygon is visible; stroke and honeycomb ratings are not shown.",
    sources: [SRC.falcon9, SRC.updates],
  },
  {
    id: "olm",
    name: "OLM / launch mount",
    expand: "Orbital Launch Mount — Starship pad deck at Starbase",
    family: "starship",
    category: "Pad",
    domain: "ground",
    sceneId: "fullstack",
    partId: "pad.olm",
    matchIds: ["pad.olm"],
    blurb: "The deck Super Heavy sits on — hold-down and a path for the flame. Simplified rings, not OLM steel details.",
    overview:
      "The orbital launch mount is the deck under Super Heavy. It holds the stack, dumps the plume, and lets go at T-0. This mesh is a generic mount, not the water-cooled steel after IFT-1.",
    history:
      "Starbase’s mount and tower went up in public view. The first integrated flight test chewed up the pad; SpaceX and local reporting described a water-cooled deck and deluge afterward. LC-39A is being prepared for Starship in public NASA/SpaceX materials. This mesh is a generic mount.",
    function:
      "The mount holds the vehicle, routes flame away from the tank, and supports QD and tower interfaces. Hold-down releases at T-0. It is the interface between a 33-engine plume and the ground.",
    physics:
      "Acoustic load and convective heat from a 33-Raptor cluster are the reason for steel decks, water, and trenches. Overpressure scales poorly if you just “add engines” without a flame deflector — IFT-1 made that public. We draw a disk and ring, not a deflector CFD.",
    sources: [SRC.starship, SRC.faa, SRC.updates],
  },
  {
    id: "qd-arm",
    name: "Quick-disconnect arm",
    expand: "QD — pad swing arm that loads propellant and services until late in the count",
    family: "starship",
    category: "Services",
    domain: "ground",
    sceneId: "qd",
    partId: "qd.arm",
    matchIds: ["qd.arm", "qd.plate", "qd.lines", "qd.tower", "qd.vehicle"],
    blurb: "A swing arm that loads propellant and services until late in the count, then gets out of the way.",
    overview:
      "The quick-disconnect arm feeds methane, oxygen, and ground services into the stack. It swings away before liftoff. Connector details are not public drawings.",
    history:
      "Pad photos show QD arms on Falcon strongbacks and the Starship tower. The Starship QD plate is often a large interface on the vehicle. Retract timing is called on webcasts. Connector gender, flow area, and purge design are not public drawings.",
    function:
      "Load CH4 and LOX, provide vents, power, and other ground services, then disconnect and swing clear. A stuck QD is a scrub. A late disconnect is a pad hazard. The ghost barrel shows reach to a ~9 m vehicle.",
    physics:
      "Cryogenic QD design is about alignment, ice, seals, and the force to break away with residual pressure. Line diameter sets fill time for tanks of tens of meters height. The teaching pipes are not sized for fill rate.",
    sources: [SRC.starship, SRC.updates],
  },
  {
    id: "deluge",
    name: "Water deluge / rainbirds",
    family: "shared",
    category: "Pad",
    domain: "ground",
    sceneId: "fullstack",
    partId: "pad.deluge",
    matchIds: ["pad.deluge"],
    blurb: "Pad water that knocks down sound and keeps the steel from cooking under the plume.",
    overview:
      "Water cannons and a deck deluge fire around T-0. They soak up sound and cool the steel. Nozzle count on this model is symbolic.",
    history:
      "NASA flame trenches used water. SpaceX added a large deluge at Starbase after IFT-1 pad damage. LC-39A already had Shuttle / Falcon deluge heritage. “Rainbirds” is pad slang for the elevated nozzles. Environmental paperwork quotes gallons-per-minute as order-of-magnitude figures, not a schematic for this model.",
    function:
      "Water eats acoustic energy, protects concrete and steel, and cuts hot-gas recirculation onto the vehicle. Nozzles fire in the seconds around T-0.",
    physics:
      "Sound suppression is largely about putting mass (water) into the shear layer of the plume so acoustic sources weaken before they reach the vehicle and ground systems. Cooling is convective: steel that would otherwise see a methane/LOX exhaust environment. Nozzle count on the model is symbolic.",
    sources: [SRC.faa, SRC.nasaCct, SRC.updates],
  },
  {
    id: "crew-access",
    name: "Crew access arm",
    family: "falcon",
    category: "Services",
    domain: "ground",
    sceneId: "falcon-pad",
    partId: "falconpad.caa",
    matchIds: ["falconpad.caa"],
    blurb: "At LC-39A this arm reaches a Dragon hatch. Not used on Super Heavy catch flights.",
    overview:
      "The crew access arm at LC-39A walks people into Dragon late in the count, then swings away. Super Heavy catch flights do not use it. Starbase crew access, when it exists, will look different.",
    history:
      "NASA and SpaceX rebuilt LC-39A with a Crew Access Arm for Commercial Crew. Photos show the white boom and white room. Emergency egress and rotate-away timing show up in NASA status reports. This model is the Falcon/Dragon 39A idea, not a future Starship crew tower.",
    function:
      "Get crew into Dragon (or a future cabin) late in the count, then swing away. It must not hit a lifting vehicle and must support abort egress timelines.",
    physics:
      "The boom is a moving mass on a tower: slew time vs wind vs clearance envelope. Docking of the white room to a pressurized spacecraft is an alignment-and-seal problem. We model a boom and cab only.",
    sources: [SRC.nasaCct, SRC.falcon9],
  },
  {
    id: "asds",
    name: "ASDS droneship",
    expand: "Autonomous spaceport drone ship — Falcon landing barge",
    family: "falcon",
    category: "Recovery",
    domain: "ground",
    sceneId: "asds",
    partId: "asds.deck",
    matchIds: ["asds.deck", "asds.hull", "asds.house", "asds.octagon"],
    blurb: "A ~90 m-class barge that catches Falcon boosters at sea. Super Heavy is not part of this program.",
    overview:
      "An autonomous spaceport drone ship is a barge that station-keeps so a Falcon booster can land on it. Named ships are public. Super Heavy’s chopsticks path is not the ASDS program. This mesh is a teaching box, not a hull plan.",
    history:
      "Just Read the Instructions, Of Course I Still Love You, A Shortfall of Gravitas, and others are public names. SpaceX posts landing photos from these decks. Super Heavy is not part of the ASDS program in the chopsticks architecture. Public decks sit in the ~90×50 m class (AIS hulls ~92×46 m); this mesh is a round teaching box, not a lines plan.",
    function:
      "Station-keep in the landing zone, offer a marked deck, and bring the booster home. Thrusters fight sea state so the octaweb lands inside the painted target.",
    physics:
      "Landing on a barge is a moving-target problem: heave, roll, and yaw of the deck plus booster residual rates. The painted octagon is about the size of the engine cluster, giving a visual tolerance. We do not simulate waves.",
    sources: [SRC.falcon9, SRC.updates],
  },
  {
    id: "mechazilla-tower",
    name: "Mechazilla tower",
    expand: "Starship launch-and-catch tower next to the orbital mount",
    family: "starship",
    category: "Pad",
    domain: "ground",
    sceneId: "mechazilla",
    partId: "mechazilla.tower",
    matchIds: ["mechazilla.tower", "mechazilla.carriage"],
    blurb: "The launch-and-catch tower beside the orbital mount. Public height quotes sit in the ~146 m class at Starbase.",
    overview:
      "The tower next to the mount carries the chopsticks, the QD, and stacking gear. Public height quotes sit around 146 m at Starbase. This lattice is stacked boxes, not a steel-erection drawing.",
    history:
      "Built in public view at Boca Chica. It carries chopsticks, QD, and stacking cranes. SpaceX and local media have quoted heights in the mid-140 m range. A second tower at LC-39A is a public construction project. This lattice is bay-stacked boxes, not a steel-erection drawing.",
    function:
      "The tower is the vertical rail for the arm carriage, the attach point for QD, and the load path for a caught booster. It also holds work platforms for stacking.",
    physics:
      "A caught Super Heavy applies a large, slightly off-axis load at carriage height. Tower bending stiffness and foundation design dominate; adding height for stacking clearance increases moment arm. Round 146 m is scale only.",
    sources: [SRC.starship, SRC.faa, SRC.updates],
  },
  {
    id: "strongback",
    name: "Strongback / TE",
    expand: "Transporter-erector — the mast that tilts Falcon vertical on the pad",
    family: "falcon",
    category: "Pad",
    domain: "ground",
    sceneId: "falcon-pad",
    partId: "falconpad.strongback",
    matchIds: ["falconpad.strongback", "falconpad.te", "falconpad.vehicle", "pad.falconDeck"],
    blurb: "The mast that rolls Falcon out horizontal, tilts it vertical, and holds it on the pad.",
    overview:
      "Falcon rolls out on its side and this transporter-erector stands it up. Starship at Starbase stacks with chopsticks instead. The strongback eases back at liftoff.",
    history:
      "Unlike Starship’s chopsticks stack, Falcon rolls out horizontal and erects on the pad — you see it on webcasts. The strongback retracts a bit at liftoff. Vandenberg, Cape, and Kennedy each have public variants. Starship does not use this TE style at Starbase.",
    function:
      "Transport, erect, hold the vehicle, route some umbilicals, then get out of the plume. Hold-down is on the TE deck / mount.",
    physics:
      "A ~70 m vehicle on a hinge is a crane problem: wind, stiffness, and a controlled rotate. At T-0 the strongback must clear a rapidly rising stack. The explode view pulls the mast back to show that clearance.",
    sources: [SRC.falcon9, SRC.nasaCct, SRC.f9guide],
  },
];

if (CATALOG.length !== 24) {
  console.warn(`Expected 24 catalog entries, found ${CATALOG.length}`);
}

export function catalogById(id) {
  return CATALOG.find((e) => e.id === id) ?? null;
}

export function findCatalogByPart(part) {
  if (!part) return null;
  if (part.id) {
    const exact = CATALOG.find((e) => e.partId === part.id);
    if (exact) return exact;
    const hit = CATALOG.find((e) => e.matchIds?.includes(part.id));
    if (hit) return hit;
  }
  if (part.name) {
    const n = part.name.toLowerCase();
    return CATALOG.find((e) => n.includes(e.name.toLowerCase()) || e.name.toLowerCase().includes(n)) ?? null;
  }
  return null;
}

function catalogFamilyOk(entry, family) {
  if (family === "starship" || family === "falcon") {
    return entry.family === family || entry.family === "shared";
  }
  if (family === "vehicle" || family === "ground") {
    return entry.domain === family;
  }
  return true;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Hyphenated compounds stay one token, so "catch" misses "catch-and-replace". */
function hasToken(haystack, token) {
  const re = new RegExp(`(?:^|[^a-z0-9-])${escapeRegExp(token)}(?:[^a-z0-9-]|$)`);
  return re.test(haystack);
}

const FALCON_PAD_SCENES = new Set(["falcon9", "falconheavy", "falcon-pad"]);

/** Keep Falcon rainbirds on the Falcon pad/vehicle instead of jumping to the Starship stack. */
export function frameTargetForCatalog(entry, currentSceneId) {
  if (!entry) return null;
  if (entry.id === "deluge" && FALCON_PAD_SCENES.has(currentSceneId)) {
    return { sceneId: currentSceneId, partId: entry.partId || "pad.deluge" };
  }
  return { sceneId: entry.sceneId, partId: entry.partId };
}

export function searchCatalog(query, family = "all") {
  const toks = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return CATALOG.filter((e) => {
    if (!catalogFamilyOk(e, family)) return false;
    if (!toks.length) return true;
    const src = (e.sources || []).map((s) => s.label).join(" ");
    const primary = [e.name, e.family, e.category, e.id.replace(/-/g, " "), e.expand || ""].join(" ").toLowerCase();
    const blob = `${primary} ${e.blurb} ${e.overview || ""} ${e.history} ${e.function || ""} ${e.physics || ""} ${src}`.toLowerCase();
    return toks.every((t) => hasToken(t.length <= 2 ? primary : blob, t));
  });
}
