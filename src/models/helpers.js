import * as THREE from "three";

/** Rounded public figures used only as teaching scale (meters). */
export const SCALE = {
  diameter: 9,
  boosterH: 71,
  shipH: 50,
  stackH: 121,
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
    if (!child.isMesh) return;
    if (child.userData.pickProxy) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (part && !child.userData.part) child.userData.part = part;
  });
  return object;
}

/** Invisible sphere used to make thin hardware easier to pick. */
export function addPickProxy(parent, position, radius, part) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 12, 10),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    }),
  );
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
  return g;
}

export function createPad(mats, radius = 18, { deluge = false } = {}) {
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
      blurb:
        "Pad water systems knock down acoustic energy and cool flame-deflector steel. Nozzle counts and flow rates here are symbolic.",
    });
    g.add(birds);
  }

  tag(g, {
    id: "pad.olm",
    name: "Launch mount / pad deck",
    blurb:
      "A simplified orbital launch mount: hold-down deck and ring markings. Not an OLM/OLP fabrication drawing.",
  });
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
