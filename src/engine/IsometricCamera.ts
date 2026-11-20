import * as THREE from 'three';
import { isKeyDown, readMoveAxes } from '../input/InputManager';

/**
 * Ink-studio isometric: high pitch, narrow FOV, so the overworld reads as a
 * tilted pixel map and the standees stay upright cutouts on it.
 */
const DEFAULT_PITCH = (52 * Math.PI) / 180;
const DEFAULT_YAW = (45 * Math.PI) / 180;
/** Narrow FOV keeps the playfield close to orthographic without a frustum zoom rewrite. */
const DEFAULT_FOV = 32;

const MIN_ZOOM = 8;
const MAX_ZOOM = 160;
/** God-game band: low enough to read cliffs, not so low you hug the horizon. */
const MIN_PITCH = (28 * Math.PI) / 180;
const MAX_PITCH = (58 * Math.PI) / 180;

const ZOOM_LERP = 0.14;
const PAN_LERP = 0.18;
const ANGLE_LERP = 0.16;
const FOLLOW_LERP = 0.12;

const REF_ZOOM = 38;
const KEYBOARD_PAN_SPEED = 22; // world units / sec at REF_ZOOM
const EDGE_SCROLL_SPEED = 18;
const EDGE_MARGIN_PX = 28;
const ORBIT_KEY_SPEED = 1.4; // rad / sec
const PITCH_KEY_SPEED = 0.9;
const ORBIT_DRAG_SENS = 0.005;
const PITCH_DRAG_SENS = 0.004;
const PAN_DRAG_SENS = 0.028;
const ZOOM_WHEEL_SENS = 0.022;
/** macOS pinch arrives as ctrl/meta + wheel with small pixel deltas. */
const ZOOM_PINCH_SENS = 0.055;
const ZOOM_MAX_STEP = 4.5;
const TRACKPAD_PAN_SENS = 0.55;
const ZOOM_KEY_STEP = 2.2;

export interface CameraBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CameraFrameInput {
  dt: number;
  /** Arrows (and optionally WASD) pan when true. Disable while hero-locked. */
  allowKeyboardPan: boolean;
  /** When false, only arrow keys pan — frees WASD for unit orders. */
  allowWasdPan?: boolean;
  keys: ReadonlySet<string>;
  mouseX: number;
  mouseY: number;
  /** Must be true before edge-scroll runs (avoids 0,0 corner pin). */
  mouseInView?: boolean;
  /** Soft-follow a world point (hero lock). */
  follow?: THREE.Vector3 | null;
}

/**
 * Dual-scale diorama camera: perspective Populous-TB macro with free orbit / pitch / zoom.
 * `zoom` drives camera distance (dolly), not ortho frustum size.
 *
 * Controls
 * --------
 * Pan:          WASD / arrows · middle-mouse drag · screen-edge scroll
 *               · trackpad two-finger horizontal · Shift + scroll
 * Zoom:         wheel / two-finger vertical · pinch (ctrl+wheel) · =/+ · -/_
 * Orbit yaw:    Q / E · Alt+left-drag horizontal
 * Pitch:        Z / X · Alt+left-drag vertical
 * Reset angle:  Home · Numpad 5
 * Zoom reset:   0 (zero)
 * Note: right-click is reserved for RTS move/attack orders.
 */
export class IsometricCamera {
  readonly camera: THREE.PerspectiveCamera;

  private target = new THREE.Vector3(0, 0, 0);
  private desiredTarget = new THREE.Vector3(0, 0, 0);

  private zoom = 38;
  private targetZoom = 38;

  private yaw = DEFAULT_YAW;
  private targetYaw = DEFAULT_YAW;
  private pitch = DEFAULT_PITCH;
  private targetPitch = DEFAULT_PITCH;

  private bounds: CameraBounds | null = null;

  private mode: 'none' | 'pan' | 'orbit' = 'none';
  private pointerId: number | null = null;
  private lastPointer = new THREE.Vector2();

  private domElement: HTMLElement | null = null;
  private aspect = 1;

  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _ndc = new THREE.Vector2();
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly _hit = new THREE.Vector3();
  private readonly _hitBefore = new THREE.Vector3();

  constructor(width: number, height: number) {
    this.aspect = width / Math.max(1, height);
    this.camera = new THREE.PerspectiveCamera(DEFAULT_FOV, this.aspect, 0.5, 600);
    this.applyProjection();
    this.snapCameraPose();
  }

  // ── Public API ──────────────────────────────────────────────────────────

  setZoom(zoom: number): void {
    this.targetZoom = THREE.MathUtils.clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    this.zoom = this.targetZoom;
    this.applyProjection();
  }

  getZoom(): number {
    return this.zoom;
  }

  getYaw(): number {
    return this.yaw;
  }

  getPitch(): number {
    return this.pitch;
  }

  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
    this.desiredTarget.copy(this.target);
    this.snapCameraPose();
  }

  getTarget(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.target);
  }

  setYaw(yaw: number): void {
    this.targetYaw = yaw;
    this.yaw = yaw;
    this.snapCameraPose();
  }

  setPitch(pitch: number): void {
    this.targetPitch = THREE.MathUtils.clamp(pitch, MIN_PITCH, MAX_PITCH);
    this.pitch = this.targetPitch;
    this.snapCameraPose();
  }

  /** Soft bounds so the player can't scroll into empty void. */
  setBounds(bounds: CameraBounds | null): void {
    this.bounds = bounds;
  }

  /** Populous TB / 42° · 45° perspective reset. */
  resetView(keepTarget = true): void {
    this.targetYaw = DEFAULT_YAW;
    this.targetPitch = DEFAULT_PITCH;
    if (!keepTarget) {
      this.desiredTarget.set(0, 0, 0);
    }
  }

  resetZoom(): void {
    this.targetZoom = 38;
  }

  /** World-space distance from camera to look-at (for DOF focus). */
  getFocusDistance(): number {
    return this.zoom;
  }

  attach(el: HTMLElement): void {
    this.domElement = el;
    // Capture on window so a HUD overlay can't eat trackpad pinch/scroll.
    window.addEventListener('wheel', this.onWheel, { passive: false, capture: true });
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('blur', this.onBlur);
  }

  detach(): void {
    window.removeEventListener('wheel', this.onWheel, { capture: true } as EventListenerOptions);
    if (!this.domElement) return;
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('pointercancel', this.onPointerUp);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('blur', this.onBlur);
    this.domElement = null;
  }

  resize(width: number, height: number): void {
    this.aspect = width / Math.max(1, height);
    this.applyProjection();
  }

  /**
   * Per-frame update. Call once from the render loop with keyboard / follow state.
   * Pointer orbit/pan is handled by event listeners.
   */
  update(input?: CameraFrameInput): void {
    if (this.domElement) {
      this.resize(this.domElement.clientWidth, this.domElement.clientHeight);
    }

    const dt = input?.dt ?? 1 / 60;

    if (input) {
      this.applyKeyboard(input, dt);
      if (input.allowKeyboardPan) {
        this.applyEdgeScroll(input, dt);
      }
      if (input.follow) {
        this.desiredTarget.lerp(input.follow, 1 - Math.pow(1 - FOLLOW_LERP, dt * 60));
      }
    }

    this.clampDesiredTarget();

    const panT = 1 - Math.pow(1 - PAN_LERP, dt * 60);
    const zoomT = 1 - Math.pow(1 - ZOOM_LERP, dt * 60);
    const angleT = 1 - Math.pow(1 - ANGLE_LERP, dt * 60);

    this.target.lerp(this.desiredTarget, panT);
    this.zoom = THREE.MathUtils.lerp(this.zoom, this.targetZoom, zoomT);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, angleT);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, angleT);

    this.applyProjection();
    this.snapCameraPose();
  }

  // ── Internals ───────────────────────────────────────────────────────────

  private applyProjection(): void {
    this.camera.fov = DEFAULT_FOV;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  private snapCameraPose(): void {
    const distance = this.zoom;
    const cosPitch = Math.cos(this.pitch);
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * cosPitch * distance,
      Math.sin(this.pitch) * distance,
      Math.cos(this.yaw) * cosPitch * distance,
    );
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  private groundAxes(): void {
    // Screen-forward on XZ plane (away from camera, flattened)
    this._forward.set(
      -Math.sin(this.yaw),
      0,
      -Math.cos(this.yaw),
    ).normalize();
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw)).normalize();
  }

  private panScreen(dxPx: number, dyPx: number): void {
    this.groundAxes();
    const scale = (this.zoom / REF_ZOOM) * PAN_DRAG_SENS;
    // Dragging right moves the world right under the cursor → target moves left along camera-right
    this.desiredTarget.addScaledVector(this._right, -dxPx * scale);
    this.desiredTarget.addScaledVector(this._forward, dyPx * scale);
    this.clampDesiredTarget();
  }

  private panWorld(dx: number, dz: number): void {
    this.desiredTarget.x += dx;
    this.desiredTarget.z += dz;
    this.clampDesiredTarget();
  }

  private clampDesiredTarget(): void {
    if (!this.bounds) return;
    this.desiredTarget.x = THREE.MathUtils.clamp(
      this.desiredTarget.x,
      this.bounds.minX,
      this.bounds.maxX,
    );
    this.desiredTarget.z = THREE.MathUtils.clamp(
      this.desiredTarget.z,
      this.bounds.minZ,
      this.bounds.maxZ,
    );
  }

  private applyKeyboard(input: CameraFrameInput, dt: number): void {
    const keys = input.keys;

    // Zoom keys (held)
    if (isKeyDown(keys, '=', '+', 'equal', 'numpadadd')) {
      this.targetZoom = THREE.MathUtils.clamp(
        this.targetZoom - ZOOM_KEY_STEP * dt * 8,
        MIN_ZOOM,
        MAX_ZOOM,
      );
    }
    if (isKeyDown(keys, '-', '_', 'minus', 'numpadsubtract')) {
      this.targetZoom = THREE.MathUtils.clamp(
        this.targetZoom + ZOOM_KEY_STEP * dt * 8,
        MIN_ZOOM,
        MAX_ZOOM,
      );
    }

    // Orbit / pitch
    if (isKeyDown(keys, 'q', 'keyq')) this.targetYaw += ORBIT_KEY_SPEED * dt;
    if (isKeyDown(keys, 'e', 'keye')) this.targetYaw -= ORBIT_KEY_SPEED * dt;
    if (isKeyDown(keys, 'z', 'keyz')) {
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch + PITCH_KEY_SPEED * dt,
        MIN_PITCH,
        MAX_PITCH,
      );
    }
    if (isKeyDown(keys, 'x', 'keyx')) {
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch - PITCH_KEY_SPEED * dt,
        MIN_PITCH,
        MAX_PITCH,
      );
    }

    if (!input.allowKeyboardPan) return;

    this.groundAxes();
    const allowWasd = input.allowWasdPan !== false;
    let mx = 0;
    let mz = 0;
    if (isKeyDown(keys, 'arrowup')) mz += 1;
    if (isKeyDown(keys, 'arrowdown')) mz -= 1;
    if (isKeyDown(keys, 'arrowleft')) mx -= 1;
    if (isKeyDown(keys, 'arrowright')) mx += 1;
    if (allowWasd && mx === 0 && mz === 0) {
      const wasd = readMoveAxes(keys);
      mx = wasd.x;
      mz = wasd.y;
    }
    if (mx !== 0 || mz !== 0) {
      const len = Math.hypot(mx, mz) || 1;
      mx /= len;
      mz /= len;
      const speed = KEYBOARD_PAN_SPEED * (this.zoom / REF_ZOOM) * dt;
      this.panWorld(
        this._right.x * mx * speed + this._forward.x * mz * speed,
        this._right.z * mx * speed + this._forward.z * mz * speed,
      );
    }
  }

  private applyEdgeScroll(input: CameraFrameInput, dt: number): void {
    if (!this.domElement || this.mode !== 'none') return;
    if (input.mouseInView === false) return;
    if (!Number.isFinite(input.mouseX) || !Number.isFinite(input.mouseY)) return;

    // Don't fight the keyboard — edge scroll only when no pan keys are held
    const { x: kx, y: ky } = readMoveAxes(input.keys);
    if (kx !== 0 || ky !== 0) return;

    const rect = this.domElement.getBoundingClientRect();
    const x = input.mouseX - rect.left;
    const y = input.mouseY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

    let sx = 0;
    let sy = 0;
    if (x < EDGE_MARGIN_PX) sx = -1;
    else if (x > rect.width - EDGE_MARGIN_PX) sx = 1;
    if (y < EDGE_MARGIN_PX) sy = -1;
    else if (y > rect.height - EDGE_MARGIN_PX) sy = 1;
    if (sx === 0 && sy === 0) return;

    this.groundAxes();
    const speed = EDGE_SCROLL_SPEED * (this.zoom / REF_ZOOM) * dt;
    this.panWorld(
      this._right.x * sx * speed - this._forward.x * sy * speed,
      this._right.z * sx * speed - this._forward.z * sy * speed,
    );
  }

  private screenToGround(clientX: number, clientY: number, out: THREE.Vector3): boolean {
    if (!this.domElement) return false;
    const rect = this.domElement.getBoundingClientRect();
    this._ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this._ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._ndc, this.camera);
    return this._raycaster.ray.intersectPlane(this._ground, out) !== null;
  }

  private zoomAtCursor(clientX: number, clientY: number, nextZoom: number): void {
    const hasBefore = this.screenToGround(clientX, clientY, this._hitBefore);
    this.targetZoom = THREE.MathUtils.clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);

    // Approximate zoom-to-cursor by applying projection at target zoom for hit test
    const prevZoom = this.zoom;
    this.zoom = this.targetZoom;
    this.applyProjection();
    this.snapCameraPose();

    if (hasBefore && this.screenToGround(clientX, clientY, this._hit)) {
      this.desiredTarget.x += this._hitBefore.x - this._hit.x;
      this.desiredTarget.z += this._hitBefore.z - this._hit.z;
      this.clampDesiredTarget();
      this.target.x += this._hitBefore.x - this._hit.x;
      this.target.z += this._hitBefore.z - this._hit.z;
      this.clampDesiredTarget();
      this.target.x = this.desiredTarget.x;
      this.target.z = this.desiredTarget.z;
    }

    this.zoom = prevZoom;
    this.applyProjection();
    this.snapCameraPose();
  }

  // ── Pointer events ──────────────────────────────────────────────────────

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private onBlur = (): void => {
    this.mode = 'none';
    this.pointerId = null;
  };

  private onWheel = (e: WheelEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target?.closest?.('input, textarea, select, [data-scrollable]')) return;

    e.preventDefault();

    let dx = e.deltaX;
    let dy = e.deltaY;
    if (e.deltaMode === 1) {
      dx *= 16;
      dy *= 16;
    } else if (e.deltaMode === 2) {
      dx *= this.domElement?.clientHeight ?? 400;
      dy *= this.domElement?.clientHeight ?? 400;
    }

    // macOS / Chrome pinch-to-zoom
    const pinch = e.ctrlKey || e.metaKey;
    if (pinch) {
      const step = THREE.MathUtils.clamp(dy * ZOOM_PINCH_SENS, -ZOOM_MAX_STEP, ZOOM_MAX_STEP);
      this.zoomAtCursor(e.clientX, e.clientY, this.targetZoom + step);
      return;
    }

    // Shift+scroll or mostly-horizontal two-finger → pan the diorama
    if (e.shiftKey || Math.abs(dx) > Math.abs(dy) * 1.15) {
      this.panScreen(dx * TRACKPAD_PAN_SENS, dy * TRACKPAD_PAN_SENS);
      this.target.copy(this.desiredTarget);
      return;
    }

    // Mouse wheel / two-finger vertical → zoom toward cursor
    const step = THREE.MathUtils.clamp(dy * ZOOM_WHEEL_SENS, -ZOOM_MAX_STEP, ZOOM_MAX_STEP);
    this.zoomAtCursor(e.clientX, e.clientY, this.targetZoom + step);
  };

  private onPointerDown = (e: PointerEvent): void => {
    // Middle mouse → pan
    // Alt + left → orbit / pitch
    // Shift + left → pan
    // Right mouse is reserved for unit orders (SelectionController)
    const orbit = e.button === 0 && e.altKey;
    const pan = e.button === 1 || (e.button === 0 && e.shiftKey);

    if (!orbit && !pan) return;

    this.mode = orbit ? 'orbit' : 'pan';
    this.pointerId = e.pointerId;
    this.lastPointer.set(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.mode === 'none' || e.pointerId !== this.pointerId) return;

    const dx = e.clientX - this.lastPointer.x;
    const dy = e.clientY - this.lastPointer.y;
    this.lastPointer.set(e.clientX, e.clientY);

    if (this.mode === 'pan') {
      this.panScreen(dx, dy);
      // Keep target snappy while dragging
      this.target.copy(this.desiredTarget);
    } else if (this.mode === 'orbit') {
      this.targetYaw -= dx * ORBIT_DRAG_SENS;
      this.targetPitch = THREE.MathUtils.clamp(
        this.targetPitch + dy * PITCH_DRAG_SENS,
        MIN_PITCH,
        MAX_PITCH,
      );
      // Snappy orbit while dragging
      this.yaw = this.targetYaw;
      this.pitch = this.targetPitch;
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    this.mode = 'none';
    this.pointerId = null;
  };
}
