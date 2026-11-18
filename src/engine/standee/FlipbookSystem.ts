import * as THREE from 'three';

export const enum Direction {
  N = 0, NE = 1, E = 2, SE = 3,
  S = 4, SW = 5, W = 6, NW = 7,
}

export const enum AnimState {
  Idle = 0,
  Walk = 1,
  Attack = 2,
  Hurt = 3,
  Die = 4,
  Work = 5,
  Cast = 6,
  Cheer = 7,
  Transform = 8,
  Corrupt = 9,
}

export interface FlipbookConfig {
  columns: number;
  rows: number;
  frameCount: number;
  fps: number;
  directions: number;
  /** Per-state frame counts; falls back to frameCount. */
  stateFrames?: Partial<Record<AnimState, number>>;
  /** Per-state fps; falls back to fps. */
  stateFps?: Partial<Record<AnimState, number>>;
  /** States that should not loop (Attack, Hurt, Die, Cast…). */
  oneShot?: AnimState[];
}

const DEFAULT_FLIPBOOK: FlipbookConfig = {
  columns: 8,
  rows: 10,
  frameCount: 8,
  fps: 10,
  directions: 8,
  stateFrames: {
    [AnimState.Idle]: 6,
    [AnimState.Walk]: 8,
    [AnimState.Attack]: 6,
    [AnimState.Hurt]: 3,
    [AnimState.Die]: 6,
    [AnimState.Work]: 6,
    [AnimState.Cast]: 8,
    [AnimState.Cheer]: 4,
    [AnimState.Transform]: 8,
    [AnimState.Corrupt]: 6,
  },
  stateFps: {
    [AnimState.Idle]: 8,
    [AnimState.Walk]: 12,
    [AnimState.Attack]: 14,
    [AnimState.Hurt]: 12,
    [AnimState.Die]: 10,
    [AnimState.Work]: 10,
    [AnimState.Cast]: 12,
    [AnimState.Cheer]: 8,
    [AnimState.Transform]: 14,
    [AnimState.Corrupt]: 16,
  },
  oneShot: [AnimState.Attack, AnimState.Hurt, AnimState.Die, AnimState.Cast, AnimState.Cheer, AnimState.Transform],
};

export class FlipbookInstance {
  config: FlipbookConfig;
  direction: Direction = Direction.S;
  state: AnimState = AnimState.Idle;
  frame = 0;
  elapsed = 0;
  flipped = false;

  constructor(config: Partial<FlipbookConfig> = {}) {
    this.config = { ...DEFAULT_FLIPBOOK, ...config };
  }

  setState(state: AnimState): void {
    if (this.state === state) return;
    this.state = state;
    this.frame = 0;
    this.elapsed = 0;
  }

  update(dt: number): void {
    this.elapsed += dt;
    const fps = this.config.stateFps?.[this.state] ?? this.config.fps;
    const frameCount = this.config.stateFrames?.[this.state] ?? this.config.frameCount;
    const frameDuration = 1 / fps;
    if (this.elapsed < frameDuration) return;
    this.elapsed -= frameDuration;

    const oneShot = this.config.oneShot?.includes(this.state) ?? false;
    if (oneShot) {
      this.frame = Math.min(this.frame + 1, frameCount - 1);
    } else {
      this.frame = (this.frame + 1) % frameCount;
    }
  }

  get isOneShotDone(): boolean {
    const oneShot = this.config.oneShot?.includes(this.state) ?? false;
    if (!oneShot) return false;
    const frameCount = this.config.stateFrames?.[this.state] ?? this.config.frameCount;
    return this.frame >= frameCount - 1;
  }

  setDirection(dx: number, dz: number): void {
    const angle = Math.atan2(dx, dz);
    const index = Math.round(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
    this.direction = index as Direction;
    this.flipped = this.direction > Direction.S && this.direction <= Direction.NW;
  }

  getUVOffset(): { offsetX: number; offsetY: number; scaleX: number; scaleY: number } {
    const col = this.frame % this.config.columns;
    const row = this.state * (this.config.directions > 1 ? 1 : 0) + Math.floor(this.direction / (8 / Math.min(this.config.rows, 8)));

    const scaleX = 1 / this.config.columns;
    const scaleY = 1 / this.config.rows;

    return {
      offsetX: col * scaleX,
      offsetY: 1 - (row + 1) * scaleY,
      scaleX: this.flipped ? -scaleX : scaleX,
      scaleY,
    };
  }

  applyToMaterial(mat: THREE.MeshStandardMaterial, texture: THREE.Texture): void {
    const uv = this.getUVOffset();
    texture.offset.set(uv.offsetX, uv.offsetY);
    texture.repeat.set(Math.abs(uv.scaleX), uv.scaleY);
    mat.map = texture;
    mat.needsUpdate = true;
  }
}

export function directionFromVelocity(vx: number, vz: number): Direction {
  if (Math.abs(vx) < 0.01 && Math.abs(vz) < 0.01) return Direction.S;
  const angle = Math.atan2(vx, vz);
  const index = Math.round(((angle + Math.PI) / (2 * Math.PI)) * 8) % 8;
  return index as Direction;
}
