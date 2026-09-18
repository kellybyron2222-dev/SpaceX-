import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createStarfield, disposeHierarchy } from "./models/helpers.js";
import { SCENES, sceneById } from "./models/index.js";

const tmpBox = new THREE.Box3();
const tmpSize = new THREE.Vector3();
const tmpCenter = new THREE.Vector3();
const tmpVec = new THREE.Vector3();

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
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b10);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 2000);
    this.camera.position.set(40, 55, 90);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 600;
    this.controls.target.set(0, 40, 0);

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

  _lights() {
    const hemi = new THREE.HemisphereLight(0xb9c9e0, 0x1a140f, 0.55);
    this.scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff2df, 2.35);
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

    const fill = new THREE.DirectionalLight(0x8fb7ff, 0.55);
    fill.position.set(-60, 30, -20);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd4a8, 0.7);
    rim.position.set(-10, 40, -70);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(220, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b0e13, metalness: 0.05, roughness: 1, transparent: true, opacity: 0.9 }),
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
    this._frame(true);
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
    this.camera.position.copy(this.defaultCam.position);
    this.controls.target.copy(this.defaultCam.target);
    this.controls.update();
  }

  findByPartId(id) {
    if (!this.root || !id) return null;
    let found = null;
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

  _frameObject(obj, storeDefault) {
    tmpBox.setFromObject(obj);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);
    const maxDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 1.2);
    const dist = Math.max(4.5, (maxDim / (2 * Math.tan((this.camera.fov * Math.PI) / 360))) * 1.7);
    this.camera.position.set(tmpCenter.x + dist * 0.7, tmpCenter.y + dist * 0.22, tmpCenter.z + dist * 0.85);
    this.controls.target.copy(tmpCenter);
    this.controls.update();
    if (storeDefault) {
      this.defaultCam.position.copy(this.camera.position);
      this.defaultCam.target.copy(this.controls.target);
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

  _frame(storeDefault) {
    if (!this.root) return;
    tmpBox.setFromObject(this.root);
    tmpBox.getSize(tmpSize);
    tmpBox.getCenter(tmpCenter);
    const maxDim = Math.max(tmpSize.x, tmpSize.y, tmpSize.z, 1);
    const dist = (maxDim / (2 * Math.tan((this.camera.fov * Math.PI) / 360))) * 1.35;
    this.camera.near = Math.max(0.05, dist / 140);
    this.camera.far = Math.max(400, dist * 40);
    this.camera.updateProjectionMatrix();
    this.camera.position.set(tmpCenter.x + dist * 0.62, tmpCenter.y + dist * 0.18, tmpCenter.z + dist * 0.82);
    this.controls.target.copy(tmpCenter);
    this.controls.minDistance = Math.max(1.2, maxDim * 0.12);
    this.controls.maxDistance = Math.max(80, maxDim * 8);
    this.controls.update();
    if (storeDefault) {
      this.defaultCam.position.copy(this.camera.position);
      this.defaultCam.target.copy(this.controls.target);
    }
  }

  _fitShadow() {
    if (!this.root) return;
    tmpBox.setFromObject(this.root);
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
    const hit = hits.find((h) => this._partOf(h.object));
    if (!hit) {
      this.clearSelection();
      this.onSelect?.(null);
      return;
    }
    const obj = this._partOf(hit.object);
    this._highlight(obj);
    this.onSelect?.(obj.userData.part, obj);
  }

  _partOf(obj) {
    let o = obj;
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
      if (!child.isMesh || !child.material) return;
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
    this.explodeT += (this.explodeTarget - this.explodeT) * Math.min(1, dt * 6);
    this._applyExplode();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
