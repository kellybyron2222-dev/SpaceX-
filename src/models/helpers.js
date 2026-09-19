import * as THREE from "three";
import { scaleRefOptions } from "../data/scaleRefs.js";

/** Rounded public figures used only as teaching scale (meters). SpaceX design page, 18 Sep 2026. */
export const SCALE = {
  diameter: 9,
  boosterH: 72,
  shipH: 52,
  stackH: 124,
  ring: 1.8,
};

function pbr(opts) {
  return new THREE.MeshPhysicalMaterial({
    envMapIntensity: 1,
    ...opts,
  });
}

export function createMaterials() {
  const stainless = pbr({
    color: 0xc5ccd4,
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.42,
    clearcoatRoughness: 0.22,
  });
  const stainlessDark = pbr({
    color: 0x8e969e,
    metalness: 0.9,
    roughness: 0.32,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
  });
  const soot = pbr({
    color: 0x5c6168,
    metalness: 0.72,
    roughness: 0.52,
  });
  const weld = pbr({
    color: 0x9aa3ab,
    metalness: 0.94,
    roughness: 0.16,
    clearcoat: 0.35,
    clearcoatRoughness: 0.18,
  });
  const darkSteel = pbr({
    color: 0x2a3038,
    metalness: 0.8,
    roughness: 0.4,
  });
  const tile = pbr({
    color: 0x1c1916,
    metalness: 0.06,
    roughness: 0.86,
  });
  const nozzle = pbr({
    color: 0xa8a198,
    metalness: 0.9,
    roughness: 0.22,
    clearcoat: 0.2,
    clearcoatRoughness: 0.35,
  });
  const nozzleInner = pbr({
    color: 0x4a3428,
    metalness: 0.74,
    roughness: 0.32,
    side: THREE.BackSide,
  });
  const copper = pbr({
    color: 0x8a5a3a,
    metalness: 0.9,
    roughness: 0.24,
  });
  const pipeFuel = pbr({
    color: 0xc4cdd6,
    metalness: 0.86,
    roughness: 0.22,
  });
  const pipeOx = pbr({
    color: 0x6a8aa0,
    metalness: 0.82,
    roughness: 0.26,
  });
  const caution = pbr({
    color: 0xd4a017,
    metalness: 0.28,
    roughness: 0.48,
    clearcoat: 0.15,
    clearcoatRoughness: 0.45,
  });
  const ghost = pbr({
    color: 0xb9c2cc,
    metalness: 0.74,
    roughness: 0.3,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const pad = pbr({
    color: 0x14181e,
    metalness: 0.18,
    roughness: 0.88,
  });
  const carbon = pbr({
    color: 0x171717,
    metalness: 0.18,
    roughness: 0.68,
  });
  const whitePaint = pbr({
    color: 0xe6eaee,
    metalness: 0.1,
    roughness: 0.44,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
  });
  const blackPaint = pbr({
    color: 0x141414,
    metalness: 0.16,
    roughness: 0.58,
  });
  const merlinBell = pbr({
    color: 0x6e675c,
    metalness: 0.78,
    roughness: 0.36,
  });
  const deck = pbr({
    color: 0x3a4148,
    metalness: 0.22,
    roughness: 0.82,
  });

  return {
    stainless,
    stainlessDark,
    soot,
    weld,
    darkSteel,
    tile,
    nozzle,
    nozzleInner,
    copper,
    pipeFuel,
    pipeOx,
    caution,
    ghost,
    pad,
    carbon,
    whitePaint,
    blackPaint,
    merlinBell,
    deck,
  };
}

export function ids(prefix, dict) {
  const out = {};
  for (const [key, value] of Object.entries(dict)) {
    out[key] = { id: `${prefix}.${key}`, ...value };
  }
  return out;
}

export function tag(object, part) {
  object.userData.part = part;
  object.traverse((child) => {
    if (part && !child.userData.part) child.userData.part = part;
    if (!child.isMesh) return;
    if (child.userData.pickProxy) return;
    child.castShadow = true;
    child.receiveShadow = true;
  });
  return object;
}

function pickProxyMaterial() {
  return new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
    side: THREE.DoubleSide,
  });
}

/** Invisible sphere used to make thin hardware easier to pick. */
export function addPickProxy(parent, position, radius, part) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), pickProxyMaterial());
  mesh.position.copy(position);
  mesh.userData.part = part;
  mesh.userData.pickProxy = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

export function homeAndExplode(object, offset) {
  object.userData.home = object.position.clone();
  object.userData.explodeOffset = offset.clone();
  return object;
}

/** Shell meshes clip in cutaway. Interiors stay whole. */
export function markCutawayShell(object) {
  object.traverse((child) => {
    if (!child.isMesh || child.userData.pickProxy || child.userData.cutawayInterior) return;
    child.userData.cutawayShell = true;
  });
  return object;
}

function tankVolumeMaterial(color) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.34,
    roughness: 0.5,
    transparent: true,
    opacity: 0.78,
    envMapIntensity: 0.65,
  });
}

/**
 * Methane above / LOX below a common dome — a public-diagram teaching split, not a tank map.
 * Volumes stay hidden until the viewer turns cutaway on.
 */
export function addTeachingTanks(parent, { radius, yBottom, yTop, splitY, mats, parts }) {
  const innerR = radius * 0.84;
  const ch4H = Math.max(1.2, yTop - splitY);
  const loxH = Math.max(1.2, splitY - yBottom);
  const ch4Mat = tankVolumeMaterial(0xc5cdd4);
  const loxMat = tankVolumeMaterial(0x5e87a0);

  const ch4 = new THREE.Mesh(new THREE.CylinderGeometry(innerR, innerR, ch4H * 0.9, 28), ch4Mat);
  ch4.position.y = splitY + ch4H * 0.5;
  ch4.userData.cutawayInterior = true;
  ch4.visible = false;
  homeAndExplode(ch4, new THREE.Vector3(0, Math.min(4.2, ch4H * 0.28), 0));
  tag(ch4, parts.ch4);
  parent.add(ch4);

  const lox = new THREE.Mesh(new THREE.CylinderGeometry(innerR, innerR, loxH * 0.9, 28), loxMat);
  lox.position.y = yBottom + loxH * 0.5;
  lox.userData.cutawayInterior = true;
  lox.visible = false;
  homeAndExplode(lox, new THREE.Vector3(0, -Math.min(3.6, loxH * 0.22), 0));
  tag(lox, parts.lox);
  parent.add(lox);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(innerR * 0.98, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    mats.stainlessDark,
  );
  dome.rotation.x = Math.PI;
  dome.position.y = splitY;
  dome.userData.cutawayInterior = true;
  dome.visible = false;
  tag(dome, parts.dome);
  parent.add(dome);

  return { ch4, lox, dome };
}

/** ~1.8 m teaching figure. Wide pad for 70 m vehicles; compact pad for ~3 m engines. */
export function createScalePerson(mats, { compact = false } = {}) {
  const g = new THREE.Group();
  const body = mats.caution;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.stainlessDark);
  head.position.y = 1.68;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.62, 10), body);
  torso.position.y = 1.22;
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.82, 10), body);
  legs.position.y = 0.5;
  const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.58, 8), body);
  armL.position.set(-0.22, 1.2, 0);
  const armR = armL.clone();
  armR.position.x = 0.22;
  const padR = compact ? 0.38 : 1.6;
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(padR, padR, compact ? 0.04 : 0.06, compact ? 16 : 24), mats.caution);
  disc.position.y = 0.03;
  g.add(head, torso, legs, armL, armR, disc);
  const blurb = compact
    ? "About 1.8 m tall. A sea-level Raptor is in the ~3 m class — about a person and a half. High-vis mark, not a crew portrait."
    : "About 1.8 m tall. Super Heavy is about 72 m — roughly forty people stacked. Starship alone is about 52 m. High-vis mark, not a crew portrait.";
  tag(g, {
    id: "scale.person",
    name: "Person (for scale)",
    blurb,
  });
  addPickProxy(g, new THREE.Vector3(0, 0.9, 0), compact ? 0.85 : 2.2, {
    id: "scale.person",
    name: "Person (for scale)",
    blurb,
  });
  return g;
}

/** ~70 × 3.7 m Falcon 9 silhouette so Super Heavy is not a grey tube in a void. */
export function createScaleFalcon(mats) {
  const g = new THREE.Group();
  const r = 3.7 / 2;
  const h = 70;
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h - 6, 20), mats.whitePaint);
  stack.position.y = (h - 6) / 2;
  const inter = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 2.2, 16), mats.blackPaint);
  inter.position.y = h - 7.2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(r, 6, 16), mats.whitePaint);
  nose.position.y = h - 3;
  g.add(stack, inter, nose);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, 0.9), mats.whitePaint);
    fin.position.set(Math.cos(a) * (r + 0.4), 18, Math.sin(a) * (r + 0.4));
    g.add(fin);
  }
  tag(g, {
    id: "scale.falcon",
    name: "Falcon 9 (for scale)",
    blurb:
      "About 70 m tall and 3.7 m across. Taller than Starship (~52 m), nearly as tall as Super Heavy, much thinner. A teaching stick, not a Falcon CAD model.",
  });
  return g;
}

/** Person + optional Falcon 9. Engine scenes omit Falcon and keep the person in frame. */
export function addScaleRefs(parent, mats, opts = {}) {
  const cfg = scaleRefOptions(opts);
  const group = new THREE.Group();
  group.userData.scaleRefs = true;
  const person = createScalePerson(mats, { compact: cfg.compactPerson });
  person.position.set(cfg.personX, cfg.personY, cfg.personZ);
  group.add(person);
  if (cfg.includeFalcon) {
    const falcon = createScaleFalcon(mats);
    falcon.position.set(cfg.falconX, 0, -10);
    group.add(falcon);
  }
  // Person is 1.8 m — skip on vehicles so it does not steal the box. Falcon is
  // ~70 m and taller than Starship, so it must stay in the camera frame.
  if (cfg.personSkipFrame) {
    person.traverse((child) => {
      child.userData.skipFrame = true;
    });
  }
  parent.add(group);
  parent.userData.supportsScale = true;
  return group;
}

export function enableShadows(root) {
  root.traverse((child) => {
    if (child.isMesh && !child.userData.pickProxy) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

export function pipe(points, radius, material, tubular = 24, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geom = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  return new THREE.Mesh(geom, material);
}

export function addWeldRings(parent, radius, y0, y1, spacing, material) {
  const count = Math.max(2, Math.round((y1 - y0) / spacing));
  const geom = new THREE.TorusGeometry(radius + 0.015, 0.028, 8, 64);
  for (let i = 0; i <= count; i++) {
    const ring = new THREE.Mesh(geom, material);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y0 + ((y1 - y0) * i) / count;
    ring.castShadow = true;
    parent.add(ring);
  }
}

export function latheBell(exitR, throatR, length, segments = 48) {
  const pts = [];
  const n = 20;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const r = throatR + (exitR - throatR) * Math.pow(t, 0.62);
    pts.push(new THREE.Vector2(r, -t * length));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/**
 * Compact engine used on vehicle meshes. Origin at gimbal; bell hangs -Y.
 */
export function createMiniRaptor(mats, { vacuum = false } = {}) {
  const g = new THREE.Group();
  const exitR = vacuum ? 0.92 : 0.52;
  const throatR = 0.16;
  const len = vacuum ? 1.85 : 1.08;
  const outer = new THREE.Mesh(latheBell(exitR, throatR, len, 28), mats.nozzle);
  const inner = new THREE.Mesh(latheBell(exitR * 0.96, throatR * 0.92, len * 0.99, 28), mats.nozzleInner);
  const chamber = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), mats.stainlessDark);
  chamber.position.y = 0.22;
  const stub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 12), mats.darkSteel);
  stub.position.y = 0.52;
  g.add(outer, inner, chamber, stub);
  return g;
}

export function placeRaptors(parent, mats, { count, radius, y, vacuum = false, startAngle = 0 }) {
  for (let i = 0; i < count; i++) {
    const a = startAngle + (i / count) * Math.PI * 2;
    const eng = createMiniRaptor(mats, { vacuum });
    eng.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
    parent.add(eng);
  }
}

export function createGridFin(mats, w = 3.2, h = 4.2, t = 0.22) {
  const g = new THREE.Group();
  const rail = mats.stainlessDark;
  const bar = 0.07;
  const edges = [
    [new THREE.BoxGeometry(bar, h, t), new THREE.Vector3(-w / 2, 0, 0)],
    [new THREE.BoxGeometry(bar, h, t), new THREE.Vector3(w / 2, 0, 0)],
    [new THREE.BoxGeometry(w, bar, t), new THREE.Vector3(0, h / 2, 0)],
    [new THREE.BoxGeometry(w, bar, t), new THREE.Vector3(0, -h / 2, 0)],
  ];
  for (const [geom, pos] of edges) {
    const m = new THREE.Mesh(geom, rail);
    m.position.copy(pos);
    g.add(m);
  }
  const cell = 0.38;
  for (let x = -w / 2 + cell; x < w / 2 - 0.05; x += cell) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.045, h - bar, t * 0.7), mats.weld);
    m.position.x = x;
    g.add(m);
  }
  for (let y = -h / 2 + cell; y < h / 2 - 0.05; y += cell) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - bar, 0.045, t * 0.7), mats.weld);
    m.position.y = y;
    g.add(m);
  }
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.35, 0.35, 0.5), mats.darkSteel);
  hinge.position.set(0, -h / 2 - 0.1, 0.1);
  g.add(hinge);
  // Solid invisible plate + sphere so waffle cells do not leak picks through to the tank.
  const proxyMat = pickProxyMaterial();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w * 1.12, h * 1.16, Math.max(1.8, t * 6)), proxyMat);
  plate.userData.pickProxy = true;
  plate.castShadow = false;
  plate.receiveShadow = false;
  g.add(plate);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(Math.max(w, h) * 0.42, 12, 10), proxyMat);
  ball.userData.pickProxy = true;
  ball.castShadow = false;
  ball.receiveShadow = false;
  g.add(ball);
  return g;
}

export function createFlap(mats, width, height, thick = 0.18) {
  const shape = new THREE.Shape();
  shape.moveTo(-width * 0.15, 0);
  shape.lineTo(width * 0.85, 0);
  shape.lineTo(width * 0.72, height);
  shape.lineTo(width * 0.05, height * 0.92);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false });
  geom.translate(0, 0, -thick / 2);
  const mesh = new THREE.Mesh(geom, mats.carbon);
  const hinge = new THREE.Mesh(new THREE.BoxGeometry(width * 0.28, 0.28, thick + 0.12), mats.darkSteel);
  hinge.position.set(width * 0.12, 0.05, 0);
  const g = new THREE.Group();
  g.add(mesh, hinge);
  // Thick invisible plate so a default-camera click on the silhouette hits the flap, not the barrel.
  const proxyMat = pickProxyMaterial();
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(width * 1.08, height * 1.12, Math.max(1.7, thick * 8)),
    proxyMat,
  );
  plate.position.set(width * 0.35, height * 0.48, 0);
  plate.userData.pickProxy = true;
  plate.castShadow = false;
  plate.receiveShadow = false;
  g.add(plate);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(Math.max(width, height) * 0.38, 12, 10), proxyMat);
  ball.position.set(width * 0.32, height * 0.45, 0);
  ball.userData.pickProxy = true;
  ball.castShadow = false;
  ball.receiveShadow = false;
  g.add(ball);
  return g;
}

export function createPad(mats, radius = 18, { deluge = false, variant = "starship" } = {}) {
  const g = new THREE.Group();
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.4, 64), mats.pad);
  disk.position.y = -0.2;
  disk.receiveShadow = true;
  disk.castShadow = false;
  g.add(disk);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.55, 0.08, 8, 64), mats.caution);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.02;
  g.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(Math.min(6.2, radius * 0.38), 0.1, 8, 48), mats.stainlessDark);
  inner.rotation.x = Math.PI / 2;
  inner.position.y = 0.05;
  g.add(inner);

  if (deluge) {
    const birds = new THREE.Group();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      const x = Math.cos(a) * radius * 0.72;
      const z = Math.sin(a) * radius * 0.72;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 2.1, 8), mats.stainlessDark);
      post.position.set(x, 1.05, z);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), mats.pipeOx);
      head.position.set(x, 2.2, z);
      birds.add(post, head);
    }
    tag(birds, {
      id: "pad.deluge",
      name: "Water deluge / rainbirds",
      frameTight: 1.12,
      frameBias: { x: 0.82, y: 0.28, z: 0.52 },
      blurb:
        "Pad water systems knock down acoustic energy and cool flame-deflector steel. Nozzle counts and flow rates here are symbolic.",
    });
    birds.userData.frameFocus = birds.children[0] || birds;
    g.add(birds);
  }

  if (variant === "falcon") {
    tag(g, {
      id: "pad.falconDeck",
      name: "Falcon pad deck",
      blurb:
        "Hold-down / TE deck at an LC-39A, SLC-40, or SLC-4E class Falcon pad. Ring markings only — not a Starship orbital launch mount (OLM).",
    });
  } else {
    tag(g, {
      id: "pad.olm",
      name: "Launch mount / pad deck",
      frameTight: 1.28,
      frameBias: { x: 0.22, y: 0.78, z: 0.58 },
      blurb:
        "A simplified orbital launch mount (OLM): hold-down deck and ring markings. Not an OLM/OLP fabrication drawing.",
    });
    g.userData.frameFocus = disk;
  }
  return g;
}

export function createStarfield(count = 1800) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 420 + Math.random() * 380;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xdce7f2,
    size: 0.9,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  const stars = new THREE.Points(geom, mat);
  stars.frustumCulled = false;
  return stars;
}

export function disposeHierarchy(root) {
  root.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    const mats = obj.material;
    if (!mats) return;
    const list = Array.isArray(mats) ? mats : [mats];
    for (const m of list) m.dispose();
  });
}
