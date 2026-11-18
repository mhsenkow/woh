import * as THREE from 'three';
import { readMoveAxes, type InputManager } from './InputManager';

/**
 * Hero Commander Lock (PD §4.1) — WASD / arrows drive the hero while the
 * isometric camera soft-follows. Camera orbit / zoom stay available.
 */
export class HeroLockController {
  private isLocked = false;
  private heroPosition = new THREE.Vector3();
  private moveSpeed = 5.5;
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();

  constructor(private input: InputManager) {}

  get locked(): boolean {
    return this.isLocked;
  }

  toggle(): void {
    this.isLocked = !this.isLocked;
  }

  setLocked(locked: boolean): void {
    this.isLocked = locked;
  }

  setHeroPosition(pos: THREE.Vector3 | number, y?: number, z?: number): void {
    if (typeof pos === 'number') {
      this.heroPosition.set(pos, y ?? 0, z ?? 0);
    } else {
      this.heroPosition.copy(pos);
    }
  }

  getHeroPosition(out = new THREE.Vector3()): THREE.Vector3 {
    return out.copy(this.heroPosition);
  }

  /**
   * @param cameraYaw Current camera yaw so movement is screen-relative.
   */
  update(dt: number, cameraYaw = Math.PI / 4): { dx: number; dz: number } | null {
    if (!this.isLocked) return null;

    const { x: mx, y: mz } = readMoveAxes(this.input.state.keys);
    if (mx === 0 && mz === 0) return null;

    this._forward.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw));
    this._right.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw));

    const speed = this.moveSpeed * dt;
    const dx = (this._right.x * mx + this._forward.x * mz) * speed;
    const dz = (this._right.z * mx + this._forward.z * mz) * speed;

    this.heroPosition.x += dx;
    this.heroPosition.z += dz;

    return { dx, dz };
  }
}
