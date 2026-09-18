import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createStarfield, disposeHierarchy } from "./models/helpers.js";
import { SCENES, sceneById } from "./models/index.js";

const tmpBox = new THREE.Box3();
const tmpSize = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();
const tmpGeomBox = new THREE.Box3();
const IDLE_RESUME_S = 5.5;

/** Bounding box that skips decorative ground / sea meshes (userData.skipFrame). */
function boxFromObjectFiltered(object, target) {
  target.makeEmpty();
  object.updateWorldMatrix(true, true);
  object.traverse((node) => {
    if (node.userData.skipFrame || !node.isMesh || !node.geometry) return;
    const geom = node.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    tmpGeomBox.copy(geom.boundingBox).applyMatrix4(node.matrixWorld);
    target.union(tmpGeomBox);
  });
  if (target.isEmpty()) target.setFromObject(object);
  return target;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export class Viewer {
  constructor(canvas) {
    this.canvas = canvas;
    this.sceneId = "fullstack";
    this.root = null;
    this.explodeTarget = 0;
    this.explodeT = 0;
    this.selected = null;
    this.baseEmissive = new WeakMap();
    this.clock = new THREE.Clock();
    this.defaultCam = { position: new THREE.Vector3(), target: new THREE.Vector3() };
    this._camTween = null;
    this._firstLoad = true;
    this.idleRotateEnabled = true;
    this._userInteracting = false;
    this._lastInteract = 0;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b10);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    pmrem.compileEquirectangularShader();
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.62;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    this.camera.position.set(40, 55, 90);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 600;
    this.controls.target.set(0, 40, 0);
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.42;
    this.controls.addEventListener("start", () => {
      this._userInteracting = true;
      this.controls.autoRotate = false;
      this._camTween = null;
    });
    this.controls.addEventListener("end", () => {
      this._userInteracting = false;
      this._lastInteract = this.clock.getElapsedTime();
    });

    this._lights();
    this.scene.add(createStarfield());

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._ptrDown = null;

    this._resize = this._resize.bind(this);
    this._loop = this._loop.bind(this);
    window.addEventListener("resize", this._resize);
    if (typeof ResizeObserver !== "undefined") {
      this._ro = new ResizeObserver(() => this._resize());
      this._ro.observe(this.canvas);
    }
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      this._ptrDown = { x: e.clientX, y: e.clientY };
    });
    el.addEventListener("pointerup", (e) => {
      if (e.button !== 0 || !this._ptrDown) return;
      const dx = e.clientX - this._ptrDown.x;
      const dy = e.clientY - this._ptrDown.y;
      this._ptrDown = null;
      if (dx * dx + dy * dy > 16) return;
      this._onPointer(e);
    });
    this._resize();
    this.renderer.setAnimationLoop(this._loop);
  }

  setIdleRotate(on) {
    this.idleRotateEnabled = Boolean(on);
    if (!this.idleRotateEnabled) this.controls.autoRotate = false;
    else if (!this._userInteracting && !this._camTween) this.controls.autoRotate = true;
    return this.idleRotateEnabled;
  }

  setPaused(paused) {
    this._paused = Boolean(paused);
    if (this._paused) {
      this.controls.autoRotate = false;
      this.renderer.setAnimationLoop(null);
    } else {
      this.clock.getDelta();
      this.renderer.setAnimationLoop(this._loop);
    }
  }

  _lights() {
    const hemi = new THREE.HemisphereLight(0xb9c9e0, 0x1a140f, 0.38);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff2df, 1.85);
    key.position.set(48, 90, 40);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 320;
    key.shadow.camera.left = -80;
    key.shadow.camera.right = 80;
    key.shadow.camera.top = 120;
    key.shadow.camera.bottom = -40;
    key.shadow.bias = -0.00015;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight(0x8fb7ff, 0.42);
    fill.position.set(-60, 30, -20);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd4a8, 0.55);
    rim.position.set(-10, 40, -70);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(220, 48),
      new THREE.MeshPhysicalMaterial({
        color: 0x0b0e13,
        metalness: 0.08,
        roughness: 0.95,
        envMapIntensity: 0.35,
        transparent: true,
        opacity: 0.9,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.8;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  load(id) {
    const spec = sceneById(id);
    this.sceneId = spec.id;
    this.clearSelection();
    this.explodeTarget = 0;
    this.explodeT = 0;

    if (this.root) {
      this.scene.remove(this.root);
      disposeHierarchy(this.root);
      this.root = null;
    }

    this.root = spec.build();
    this.scene.add(this.root);
    this._frame({ storeDefault: true, instant: this._firstLoad });
    this._firstLoad = false;
    this._fitShadow();
    return spec;
  }

  setExplode(on) {
    const spec = sceneById(this.sceneId);
    const allowed = Boolean(this.root?.userData.supportsExplode);
    this.explodeTarget = on && allowed ? 1 : 0;
    return { allowed, hint: spec.explodeHint };
  }

  resetCamera() {
    this.explodeTarget = 0;
    this._tweenTo(this.defaultCam.position, this.defaultCam.target, 0.85);
  }

  findByPartId(id) {
    if (!this.root || !id) return null;
    let found = null;
    this.root.traverse((o) => {
      if (!found && o.userData?.part?.id === id && !o.userData.pickProxy) found = o;
    });
    if (found) return found;
    this.root.traverse((o) => {
      if (!found && o.userData?.part?.id === id) found = o;
    });
    return found;
  }

  highlightById(id, { frame = true } = {}) {
    const obj = this.findByPartId(id);
    if (!obj) {
      this.clearSelection();
      this.onSelect?.(null);
      return false;
    }
    this._highlight(obj);
    if (frame) this._frameObject(obj, false);
    this.onSelect?.(obj.userData.part, obj);
    return true;
  }

  _tweenTo(position, target, duration = 0.8) {
    this.controls.autoRotate = false;
    this._camTween = {
      t: 0,
      duration,
      fromPos: this.camera.position.clone(),
      toPos: position.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: target.clone(),
    };
  }

  _frameObject(obj, storeDefault) {
    const focus = obj.userData.frameFocus || obj;
    boxFromObjectFiltered(focus, tmpBox);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);
    const part = obj.userData.part || focus.userData.part;
    const maxDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 1.2);
    const tight = part?.frameTight ?? 1.7;
    const dist = Math.max(4.5, (maxDim / (2 * Math.tan((this.camera.fov * Math.PI) / 360))) * tight);
    const bias = part?.frameBias ?? { x: 0.7, y: 0.22, z: 0.85 };
    const pos = new THREE.Vector3(
      tmpCenter.x + dist * bias.x,
      tmpCenter.y + dist * bias.y,
      tmpCenter.z + dist * bias.z,
    );
    this._tweenTo(pos, tmpCenter, 0.7);
    if (storeDefault) {
      this.defaultCam.position.copy(pos);
      this.defaultCam.target.copy(tmpCenter);
    }
  }

  screenshot() {
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `starship-${this.sceneId}.png`;
    a.click();
  }

  scenes() {
    return SCENES;
  }

  _frame({ storeDefault = false, instant = false } = {}) {
    if (!this.root) return;
    boxFromObjectFiltered(this.root, tmpBox);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);
    const maxDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 1);
    const tight = this.root.userData.frameTight ?? 1.35;
    const dist = (maxDim / (2 * Math.tan((this.camera.fov * Math.PI) / 360))) * tight;
    this.camera.near = Math.max(0.05, dist / 140);
    this.camera.far = Math.max(400, dist * 40);
    this.camera.updateProjectionMatrix();
    const bias = this.root.userData.frameBias ?? { x: 0.62, y: 0.18, z: 0.82 };
    const pos = new THREE.Vector3(
      tmpCenter.x + dist * bias.x,
      tmpCenter.y + dist * bias.y,
      tmpCenter.z + dist * bias.z,
    );
    this.controls.minDistance = Math.max(1.2, maxDim * 0.12);
    this.controls.maxDistance = Math.max(80, maxDim * 8);
    if (instant) {
      this.camera.position.copy(pos);
      this.controls.target.copy(tmpCenter);
      this.controls.update();
      this._camTween = null;
    } else {
      this._tweenTo(pos, tmpCenter, 0.9);
    }
    if (storeDefault) {
      this.defaultCam.position.copy(pos);
      this.defaultCam.target.copy(tmpCenter);
    }
  }

  _fitShadow() {
    if (!this.root) return;
    boxFromObjectFiltered(this.root, tmpBox);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);
    const extent = Math.max(tmpSize.x, tmpSize.z, tmpSize.y * 0.4) * 0.7 + 8;
    const cam = this.keyLight.shadow.camera;
    cam.left = -extent;
    cam.right = extent;
    cam.top = extent * 1.3;
    cam.bottom = -extent * 0.6;
    this.keyLight.position.set(tmpCenter.x + extent, tmpCenter.y + extent * 1.4, tmpCenter.z + extent * 0.7);
    cam.updateProjectionMatrix();
  }

  _resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (w < 8 || h < 8) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  _onPointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (!this.root) return;
    const hits = this.raycaster.intersectObject(this.root, true);
    const obj = this._pickBest(hits);
    if (!obj) {
      this.clearSelection();
      this.onSelect?.(null);
      return;
    }
    this._highlight(obj);
    this.onSelect?.(obj.userData.part, obj);
  }

  /**
   * Prefer catch pins / small hardware over nearby grid-fin lattice hits.
   * Among hits close to the nearest surface, score pickPriority then smaller bounds.
   */
  _pickBest(hits) {
    if (!hits.length) return null;
    const nearest = hits[0].distance;
    let best = null;
    let bestScore = -Infinity;
    const seen = new Set();
    for (const hit of hits) {
      if (hit.distance - nearest > 6.5) break;
      const obj = this._partOf(hit.object);
      if (!obj?.userData?.part) continue;
      const key = obj.userData.part.id;
      if (seen.has(key)) continue;
      seen.add(key);
      tmpBox.setFromObject(obj);
      tmpBox.getSize(tmpSize);
      const size = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 0.2);
      const prio = obj.userData.part.pickPriority ?? 0;
      const proxy = hit.object.userData.pickProxy || obj.userData.pickProxy ? 6 : 0;
      const score = prio * 6 + proxy - size * 0.18 - hit.distance * 0.35;
      if (score > bestScore) {
        bestScore = score;
        best = obj;
      }
    }
    return best;
  }

  _partOf(obj) {
    let o = obj;
    while (o) {
      if (o.userData?.part && !o.userData.pickProxy) return o;
      o = o.parent;
    }
    o = obj;
    while (o) {
      if (o.userData?.part) return o;
      o = o.parent;
    }
    return null;
  }

  _highlight(obj) {
    this.clearSelection();
    this.selected = obj;
    obj.traverse((child) => {
      if (!child.isMesh || !child.material || child.userData.pickProxy) return;
      const orig = child.material;
      this.baseEmissive.set(child, orig);
      const mat = orig.clone();
      if (mat.emissive) {
        mat.emissive.setHex(0xf5c16c);
        mat.emissiveIntensity = 0.38;
      }
      child.material = mat;
      child.userData._highlightMat = mat;
    });
  }

  clearSelection() {
    if (!this.selected) return;
    this.selected.traverse((child) => {
      const orig = this.baseEmissive.get(child);
      if (!orig) return;
      if (child.userData._highlightMat) {
        child.userData._highlightMat.dispose();
        child.userData._highlightMat = null;
      }
      child.material = orig;
    });
    this.selected = null;
  }

  _applyExplode() {
    if (!this.root) return;
    this.root.traverse((obj) => {
      if (!obj.userData.explodeOffset || !obj.userData.home) return;
      obj.position.copy(obj.userData.home).addScaledVector(obj.userData.explodeOffset, this.explodeT);
    });
    this.root.userData.setExplode?.(this.explodeT);
  }

  _loop() {
    const dt = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();
    this.explodeT += (this.explodeTarget - this.explodeT) * Math.min(1, dt * 6);
    this._applyExplode();

    if (this._camTween) {
      this._camTween.t += dt;
      const u = easeInOutCubic(Math.min(1, this._camTween.t / this._camTween.duration));
      this.camera.position.lerpVectors(this._camTween.fromPos, this._camTween.toPos, u);
      this.controls.target.lerpVectors(this._camTween.fromTarget, this._camTween.toTarget, u);
      if (u >= 1) {
        this._camTween = null;
        this._lastInteract = elapsed;
      }
    } else if (
      this.idleRotateEnabled &&
      !this._userInteracting &&
      elapsed - this._lastInteract > IDLE_RESUME_S
    ) {
      this.controls.autoRotate = true;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
