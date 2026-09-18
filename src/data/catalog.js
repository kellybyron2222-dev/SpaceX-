/** Critical infrastructure catalog — public-architecture teaching notes only. */

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
      "starship.sl",
    ],
    blurb:
      "Methane/LOX full-flow staged-combustion engine that powers Super Heavy and Starship. Geometry in this app is a parametric teaching model.",
    history:
      "SpaceX has publicly described Raptor as a full-flow staged-combustion methane engine since the mid-2010s, with iterative prototypes shown in photos, talks, and flight campaigns from suborbital hoppers through orbital test flights. Public comments distinguish sea-level and vacuum variants and have quoted chamber-pressure goals in the hundreds of bar. None of that is a bill of materials: injector layout, alloy specs, and as-flown thrust are not published as engineering drawings, and this viewer does not reconstruct them.",
    function:
      "Each Raptor burns liquid methane with liquid oxygen to produce thrust. Super Heavy uses a large sea-level cluster (publicly 33 engines). Starship uses a mixed set of gimbaling sea-level engines and larger-bell vacuum engines. Full-flow means both turbopumps are driven by preburner gas of their own propellant species, a cycle discussed openly in propulsion textbooks and SpaceX talks. On the pad, engines also provide the hold-down / start transient the launch mount must survive.",
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
    blurb:
      "Larger-expansion vacuum Raptors on Starship. Three sit around the sea-level trio; bell size here is a round teaching guess.",
    history:
      "SpaceX has shown vacuum Raptors with much larger nozzles than the sea-level engines on the same ship. Public stacking and static-fire photos distinguish the two families. Expansion ratio and flight-by-flight nozzle hardware have changed; this mesh is not a production bell.",
    function:
      "Vacuum engines make most of their thrust in thin air or vacuum, where a large expansion ratio raises specific impulse. They are typically less gimbaled than the center sea-level engines used for landing. The 3D scene keeps them tagged separately from the Raptor close-up so Learn can frame the aft bay.",
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
    blurb:
      "Widely reported Super Heavy layout: 33 sea-level Raptors in three rings (3 + 10 + 20). Bells and spacing are round-number approximations.",
    history:
      "Public booster photos and webcasts count a 33-engine sea-level cluster. SpaceX has discussed center, middle, and outer rings and engine-out capability at a high level. The aft “octaweb” nickname is commentary, not a released drawing. Cluster count and shielding have been iterative across flight articles.",
    function:
      "The cluster is the booster’s only propulsion: liftoff, boostback (when used), landing / catch burn. Inner engines gimbal for TVC; outer engines pack the 9 m aft bay. The teaching model drops the cluster in explode view so the three rings are readable.",
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
    blurb:
      "RP-1/LOX gas-generator engine. Nine Merlins on Falcon 9; 27 on Falcon Heavy. The cluster here uses round public counts and simple bells.",
    history:
      "Merlin flew on Falcon 1 and evolved through 1A/1B/1C into the 1D used on Falcon 9 and Heavy. SpaceX payload user's guides and FAA environmental filings have published thrust and mixture-ratio class numbers that changed across Block upgrades. Octaweb is the public nickname for the thrust structure that carries nine engines. Landing burns, boostback, and reentry burns are flown on a subset of engines — a concept demonstrated on dozens of public recovery livestreams.",
    function:
      "The first-stage cluster lifts Falcon off the pad, then later relights for boostback (when used), reentry, and landing. The center engine is the one typically used for the final landing burn. The second stage uses a single Merlin Vacuum with a larger expansion bell. RP-1 is a refined kerosene; deep throttling and restart capability are operational facts shown in flight, while controller gains and injector design stay unpublished.",
    physics:
      "Public Block 5-era figures put a Merlin 1D in the roughly 800–900 kN sea-level thrust class per engine (check the vintage of any source). Nine engines therefore provide on the order of 7–8 MN at liftoff before throttling — enough, with a ~3.7 m vehicle, for the well-known Falcon 9 thrust-to-weight that allows RTLS or ASDS recovery after downrange missions. Gas-generator cycles dump turbine exhaust overboard, so they give up some Isp versus staged combustion; they are mechanically simpler. These are back-of-envelope relationships for a classroom, not performance guarantees.",
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
    blurb:
      "Stainless ring-stack barrels, about 9 m diameter, form methane and liquid-oxygen tanks on both stages.",
    history:
      "Public factory tours and stacking photos show Starship tanks built from stacked cylindrical rings with visible girth welds, rather than the aluminum-lithium barrel-and-dome construction used on Falcon. Elon Musk and SpaceX have discussed 300-series stainless in talks and social posts as a cryogenic and heat-shield-compatible choice. Header tanks in the nose have been shown on flight articles. Exact alloy temper, weld schedule, and minimum gauge are not released as drawings.",
    function:
      "Tanks store cryogenic CH4 and LOX, feed the engines, and are the primary airframe. Common domes and downcomers (the raceway on the model) move propellant. During flight the tanks are structural: they carry axial compression, bending from aero and TVC, and internal pressure. On reentry the windward skin is tiled; the leeward side is mostly bare stainless in public photos.",
    physics:
      "A 9 m cylinder ~71 m tall (booster) or ~50 m (ship) is a thin-walled pressure vessel plus column. Hydrostatic head of LOX is non-trivial over tens of meters, so tank pressure and baffles matter. Stainless has lower specific stiffness than the Falcon aluminum stack, which is one public rationale for the large diameter. Cryo shrinkage, buckling under thrust, and slosh during flip maneuvers are the usual textbook issues — none of which we size here. Ring spacing on the model (~1.8 m) matches the commonly photographed barrel-section height, used only as visual scale.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
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
    blurb:
      "A raised cable-and-propellant raceway runs the length of the booster and ship. Simplified fairing, not a routing diagram.",
    history:
      "Public rollouts show a longitudinal raceway on Super Heavy and Starship, distinct from Falcon’s cable trays. SpaceX has discussed downcomers that carry propellant between tanks. Photographs are the source; line IDs and insulation are not published.",
    function:
      "The raceway is the external trunk for pressurant, avionics, and transfer lines that cannot live only inside the tanks. Clicking it in 3D should select this entry, not the barrel tanks.",
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
    blurb:
      "Ogive nose on the ~50 m upper stage. Public articles describe a forward payload volume and a nose header tank — simple volumes here.",
    history:
      "Starship does not use a Falcon-style clamshell fairing for most cargo. SpaceX has shown PEZ-style dispensers, cargo-door concepts, and crew interiors only as public renderings or test hardware. Header tanks in the nose appear in flight-article photos. This ogive is a scale stand-in.",
    function:
      "The nose closes the stack aerodynamically, can house payload or crew volume, and includes a header tank used during landing burns in public descriptions. It is not a Starlink dispenser CAD model.",
    physics:
      "An ogive is a low-drag nose for the boost phase; reentry heating on the nose is managed by tiles plus attitude. Header-tank location near the nose is a CG / settling story during the flip. None of that is simulated.",
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
    blurb:
      "Four body flaps — two forward, two aft — control the belly-flop and landing flip. Simple plates, not actuator CAD.",
    history:
      "Every public Starship flight article since the high-altitude hops has carried large flaps. Livestreams show them articulating during descent, and several test flights have damaged or lost flap hardware, which SpaceX discussed in post-flight remarks. Actuation is electric in public comments. Hinge locations and seal details remain approximate in any outside model.",
    function:
      "During hypersonic and supersonic descent the vehicle flies at high angle of attack. Forward flaps (canards) and larger aft flaps trim pitch and roll so the heat shield stays windward. Near the pad the flaps help set up the landing flip, after which engines take over. They are thermal and structural parts as much as aero surfaces.",
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
      "Lattice fins steer returning boosters. Super Heavy and Falcon 9 both use four fins; this scene shows the Starship-scale set.",
    history:
      "Falcon 9 grid fins were originally aluminum and later titanium — a change SpaceX announced after heating and stiction issues on early recovery flights. Super Heavy uses much larger fins, shown folding against the tank in stacking footage. Both systems are public, but lattice thickness, latch design, and hydraulic vs electric drive differ and are not specified here.",
    function:
      "After entry burn, grid fins provide roll, pitch, and yaw so the booster can hit a droneship or chopsticks with engine residual. They fold or stow for ascent. On Super Heavy they also interact with the catch-arm keep-out zone — but they are not the catch pins. Pick the waffle lattice for this entry; pick the gold pins for Catch hardpoints.",
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
    blurb:
      "Lift/catch pins near the top of Super Heavy — the publicly shown interfaces for Mechazilla’s arms. Not the grid fins.",
    history:
      "Public Super Heavy articles show prominent pins / hardpoints near the grid-fin elevation that the tower arms close on during catch and stack. SpaceX webcasts of the 2024 catch made the load path obvious: arms to pins, not to the waffle fins. Hardware shape has iterated; these cylinders are stand-ins.",
    function:
      "Pins take stacking and catch loads into the barrel and into the chopsticks. Grid fins steer; pins carry. This catalog split exists so a click on a pin does not open Grid fins, and a click on a lattice does not open Catch hardpoints.",
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
    blurb:
      "Windward thermal protection as a hex/rect grid on a curved carrier. Not a production tile map or bond pattern.",
    history:
      "Public Starship articles show thousands of black ceramic tiles on the windward side, with stainless left mostly bare leeward. SpaceX has discussed missing-tile problems, catch-and-replace operations, and secondary ablative layers in flight updates. Hexagonal vs rectangular edge tiles appear in close-up photos. Individual serials and adhesive specs are not published.",
    function:
      "Tiles reject or absorb reentry heat so the stainless tank stays below structural limits. Gaps, felt, and a carrier structure manage thermal expansion. The ship relies on this TPS plus attitude control (flaps) to keep the hottest flow on the tiled face.",
    physics:
      "Leeside vs windward heating at high alpha is a classic blunt-body result: stagnation and acreage heat flux on the belly, much lower on the back. Ceramic tiles work by low conductivity and high emissivity; the metal behind them is a heat sink. A round 9 m radius sets the curvature the tile grid must follow — the explode view lifts tiles along surface normals to show that packing. Bond-line temperature and gap-heating are real issues; we do not compute them.",
    sources: [SRC.starship, SRC.updates, SRC.faa],
  },
  {
    id: "hot-stage",
    name: "Hot-stage / interstage",
    family: "shared",
    category: "Staging",
    domain: "vehicle",
    sceneId: "booster",
    partId: "booster.staging",
    matchIds: ["booster.staging", "falcon9.interstage", "fullstack.ship", "fullstack.booster"],
    blurb:
      "Starship lights the upper stage while still stacked (hot staging). Falcon uses a more conventional interstage. Both are shown as bands, not mechanisms.",
    history:
      "Falcon 9 stages with a composite interstage and pneumatic pushers — visible on every launch webcast. Starship’s public test flights introduced a vented hot-staging ring so the ship can fire Raptors while still on Super Heavy, a practice used historically on some Soviet vehicles and discussed by SpaceX around the 2023–2024 flight series. Hardware has changed between flights; this ring is generic.",
    function:
      "Staging must separate two pressurized vehicles without recontact, while starting the upper-stage engines. Hot staging vents ship exhaust through a ring instead of waiting for a clean physical gap. Falcon’s interstage also hides the second-stage Merlin at ignition.",
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
    matchIds: ["falcon9.fairing", "falcon9.second"],
    blurb:
      "Clamshell fairing that protects Falcon payloads through max-q, then splits and is recovered when the mission allows.",
    history:
      "Falcon fairings are composite halves. SpaceX publicly pursued recovery with parachutes, Mr. Steven / Ms. Tree nets, and later catch-and-fish operations, discussing reuse in launch updates. Starship does not use a Falcon-style fairing for most cargo; its nose is integral. Dimensions in user’s guides (length/diameter class) are the only scale used here.",
    function:
      "Fairings keep acoustic and aero loads off the payload until the atmosphere is thin enough. They jettison on a public, mission-specific timeline. Inner acoustic blankets and dispenser hardware are omitted.",
    physics:
      "Fairing volume is set by payload dynamic envelope, not rocket aesthetics. Jettison happens when dynamic pressure × heating is low enough that the exposed payload survives. Half-shells in explode view separate laterally — the real hinge/piston kinematics are more specific and not modeled.",
    sources: [SRC.falcon9, SRC.f9guide, SRC.updates],
  },
  {
    id: "chopsticks",
    name: "Chopsticks / catch arms",
    family: "starship",
    category: "Recovery",
    domain: "vehicle",
    sceneId: "mechazilla",
    partId: "mechazilla.arms",
    matchIds: ["mechazilla.arms", "mechazilla.pads", "mechazilla.carriage"],
    blurb:
      "Mechanical arms on the launch tower that stack stages and, as publicly demonstrated, catch returning Super Heavy boosters.",
    history:
      "The Starbase tower arms — nicknamed chopsticks — were shown stacking Starship and later catching Super Heavy on a public test flight in 2024, a first for an orbital-class booster. SpaceX has discussed catch vs landing-leg mass. Arm speed, compliance, and fail-safes are not published. Kennedy’s Starship pad is a separate public construction story.",
    function:
      "Arms open around a 9 m vehicle, close on hardpoints, and ride a carriage up the tower to stack or after catch. They replace landing legs on the booster in the current public architecture. The model includes a ghost booster so the catch bay is readable. Vehicle-side pins are a separate catalog entry (Catch hardpoints).",
    physics:
      "Catch is a relative-navigation and energy-absorption problem: a ~71 m, 9 m-diameter booster arrives with residual vertical rate that the arms and pins must take as a load path into the tower. Even a small lateral offset becomes a large moment at the tower root. Public videos are the right intuition; we do not quote structural margins. Exploded view opens the arms so the keep-out cylinder is obvious.",
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
    blurb:
      "Four folding legs that put Falcon first stages on a droneship or landing zone. Starship’s public booster path uses chopsticks instead.",
    history:
      "Landing legs appeared on early Falcon 9 recovery attempts and became routine on Block vehicles. SpaceX livestreams show deploy just before landing. Materials and crush-core details have been discussed only at a high level. Super Heavy test articles have generally not flown operational landing legs in the chopsticks era.",
    function:
      "Legs absorb residual vertical kinetic energy, keep engines off the deck, and provide tip-over stability in wind and sea state. They stow along the tank during ascent.",
    physics:
      "Touchdown energy is ½mv² plus any tip-over moment from deck tilt (ASDS) or engine-out. Four outriggers increase the support polygon. Deployed length is a trade against engine-bell clearance and mass. The explode view kicks the legs outward so the polygon is visible; stroke and honeycomb ratings are not shown.",
    sources: [SRC.falcon9, SRC.updates],
  },
  {
    id: "olm",
    name: "OLM / launch mount",
    family: "starship",
    category: "Pad",
    domain: "ground",
    sceneId: "fullstack",
    partId: "pad.olm",
    matchIds: ["pad.olm"],
    blurb:
      "Orbital launch mount — the deck Super Heavy sits on, with hold-down and flame path. Simplified rings, not OLM steel details.",
    history:
      "Starbase’s orbital launch mount and the later orbital launch pad / tower complex have been built in public view, including the well-known pad damage after the first integrated flight test and the subsequent water-cooled deck and deluge upgrades SpaceX and local reporting described. LC-39A is separately being prepared for Starship in public NASA/SpaceX materials. This mesh is a generic mount.",
    function:
      "The mount holds the vehicle, routes flame away from the tank, and supports QD and tower interfaces. Hold-down releases at T-0. It is the structural interface between a 33-engine plume and Texas (or Florida) soil.",
    physics:
      "Acoustic load and convective heat from a 33-Raptor cluster are the reason for steel decks, water, and trenches. Overpressure scales poorly if you just “add engines” without a flame deflector — IFT-1 made that public. We draw a disk and ring, not a deflector CFD.",
    sources: [SRC.starship, SRC.faa, SRC.updates],
  },
  {
    id: "qd-arm",
    name: "Quick-disconnect arm",
    family: "starship",
    category: "Services",
    domain: "ground",
    sceneId: "qd",
    partId: "qd.arm",
    matchIds: ["qd.arm", "qd.plate", "qd.lines", "qd.tower", "qd.vehicle"],
    blurb:
      "A swing arm that carries propellant and services to the stacked vehicle until late in the count.",
    history:
      "SpaceX pad imagery shows QD arms on both Falcon strongbacks and the Starship tower. The Starship QD plate is often visible as a large interface on the vehicle. Retract timing is called on webcasts. Connector gender, flow area, and purge design are not public drawings.",
    function:
      "Load CH4 and LOX, provide vents, electrical, and other ground services, then disconnect and swing clear before liftoff. A stuck QD is a scrub; a late disconnect is a pad hazard. The ghost barrel shows reach to a 9 m vehicle.",
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
    blurb:
      "Pad water cannons and deck deluge that suppress sound and cool steel under a large plume.",
    history:
      "NASA’s historic flame deflectors used water; SpaceX added a large deluge system at Starbase after public pad damage on IFT-1, and LC-39A already had a deluge heritage from Shuttle / Falcon. “Rainbirds” is common pad slang for the elevated nozzles. Flow rates in gallons per minute appear in environmental paperwork as order-of-magnitude figures, not as a schematic for this model.",
    function:
      "Water absorbs acoustic energy, protects concrete and steel, and reduces recirculation of hot gas onto the vehicle. Nozzles fire in the seconds around T-0.",
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
    blurb:
      "At LC-39A the crew access arm reaches a Dragon hatch. Not used on Super Heavy catch flights.",
    history:
      "NASA and SpaceX publicly rebuilt LC-39A with a Crew Access Arm for Commercial Crew. Photos show the white boom and white room. Emergency egress and rotate-away timing are discussed in NASA status reports. Starbase Starship crew access, when it exists operationally, will be a different public design; this model is the Falcon/Dragon 39A idea.",
    function:
      "Get crew into Dragon (or a future cabin) late in the count, then swing away. It must not recontact a lifting vehicle and must support abort egress timelines.",
    physics:
      "The boom is a moving mass on a tower: slew time vs wind vs clearance envelope. Docking of the white room to a pressurized spacecraft is an alignment-and-seal problem. We model a boom and cab only.",
    sources: [SRC.nasaCct, SRC.falcon9],
  },
  {
    id: "asds",
    name: "ASDS droneship",
    family: "falcon",
    category: "Recovery",
    domain: "ground",
    sceneId: "asds",
    partId: "asds.deck",
    matchIds: ["asds.deck", "asds.hull", "asds.house", "asds.octagon"],
    blurb:
      "Autonomous spaceport drone ship — a ~90 m-class barge that catches Falcon boosters at sea.",
    history:
      "Named vessels (Just Read the Instructions, Of Course I Still Love You, A Shortfall of Gravitas, and others) are public. SpaceX posts landing photos from these decks. Starship Super Heavy is not part of the ASDS program in the chopsticks architecture. Barge dimensions are visible in AIS and photos; this mesh uses a round 90×40 m teaching box.",
    function:
      "Station-keep in the landing zone, provide a marked deck, and return the booster to port. Thrusters fight sea state so the octaweb lands inside the painted target.",
    physics:
      "Landing on a barge is a moving-target problem: heave, roll, and yaw of the deck plus booster residual rates. The painted octagon is about the size of the engine cluster, giving a visual tolerance. We do not simulate waves.",
    sources: [SRC.falcon9, SRC.updates],
  },
  {
    id: "mechazilla-tower",
    name: "Mechazilla tower",
    family: "starship",
    category: "Pad",
    domain: "ground",
    sceneId: "mechazilla",
    partId: "mechazilla.tower",
    matchIds: ["mechazilla.tower", "mechazilla.carriage"],
    blurb:
      "Launch-and-catch tower next to the orbital mount, publicly in the ~146 m class at Starbase.",
    history:
      "Built in public view at Boca Chica, the tower carries chopsticks, QD, and stacking cranes. SpaceX and local media have quoted heights in the mid-140 m range. A second tower at LC-39A is a public construction project. This lattice is bay-stacked boxes, not a steel-erection drawing.",
    function:
      "The tower is the vertical rail for the arm carriage, the attach point for QD, and the load path for a caught booster. It also supports work platforms for stacking.",
    physics:
      "A caught Super Heavy applies a large, slightly off-axis load at carriage height. Tower bending stiffness and foundation design dominate; adding height for stacking clearance increases moment arm. Round 146 m is scale only.",
    sources: [SRC.starship, SRC.faa, SRC.updates],
  },
  {
    id: "strongback",
    name: "Strongback / TE",
    family: "falcon",
    category: "Pad",
    domain: "ground",
    sceneId: "falcon-pad",
    partId: "falconpad.strongback",
    matchIds: ["falconpad.strongback", "falconpad.te", "falconpad.vehicle"],
    blurb:
      "Transporter-erector strongback that tilts Falcon 9 vertical and supports it at SLC-40, LC-39A, and SLC-4E.",
    history:
      "Unlike Starship’s chopsticks stack, Falcon rolls out horizontally and erects on the pad — a sequence shown on countless webcasts. The strongback retracts slightly at liftoff. Vandenberg, Cape, and Kennedy each have public variants. Starship does not use this TE style at Starbase.",
    function:
      "Transport, erect, hold the vehicle, route some umbilicals, then get out of the plume. Hold-down is on the TE deck / mount.",
    physics:
      "A ~70 m vehicle on a hinge is a crane problem: wind, stiffness, and a controlled rotate. At T-0 the strongback must clear a rapidly rising stack. The explode view pulls the mast back to show that clearance.",
    sources: [SRC.falcon9, SRC.nasaCct, SRC.f9guide],
  },
];

if (CATALOG.length !== 22) {
  console.warn(`Expected 22 catalog entries, found ${CATALOG.length}`);
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

export function searchCatalog(query, family = "all") {
  const q = query.trim().toLowerCase();
  return CATALOG.filter((e) => {
    if (family === "starship" || family === "falcon") {
      if (e.family !== family && e.family !== "shared") return false;
    } else if (family === "vehicle" || family === "ground") {
      if (e.domain !== family) return false;
    }
    if (!q) return true;
    const src = (e.sources || []).map((s) => s.label).join(" ");
    const blob = `${e.name} ${e.family} ${e.category} ${e.blurb} ${e.history} ${src}`.toLowerCase();
    return blob.includes(q);
  });
}
