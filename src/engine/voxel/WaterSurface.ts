import * as THREE from 'three';
import { OCEAN_Y, type VoxelWorld } from './VoxelWorld';

/**
 * Shallow water for the sea, the bay, and the channel.
 * Land blocks the flow. The edge of the grid is pinned to sea level,
 * which is the infinite ocean. A current runs out of the bay.
 * The texture is (height, vx, vz, wet).
 */
export class WaterSurface {
  private readonly n = 80;
  private readonly span = 70;
  private readonly origin = -35;
  private readonly h: Float32Array;
  private readonly vh: Float32Array;
  private readonly vx: Float32Array;
  private readonly vz: Float32Array;
  private readonly wet: Uint8Array;
  private readonly texData: Float32Array;
  private readonly tex: THREE.DataTexture;
  private masked = false;
  readonly time = { value: 0 };

  constructor(private world: VoxelWorld) {
    const n = this.n;
    const cells = n * n;
    this.h = new Float32Array(cells);
    this.vh = new Float32Array(cells);
    this.vx = new Float32Array(cells);
    this.vz = new Float32Array(cells);
    this.wet = new Uint8Array(cells);
    this.texData = new Float32Array(cells * 4);
    this.tex = new THREE.DataTexture(this.texData, n, n, THREE.RGBAFormat, THREE.FloatType);
    this.tex.magFilter = THREE.NearestFilter;
    this.tex.minFilter = THREE.NearestFilter;
    this.tex.generateMipmaps = false;
    this.tex.wrapS = THREE.ClampToEdgeWrapping;
    this.tex.wrapT = THREE.ClampToEdgeWrapping;
    this.tex.flipY = false;
    this.tex.colorSpace = THREE.NoColorSpace;
    this.tex.needsUpdate = true;

    const uniforms = world.waterUniforms;
    if (uniforms) {
      uniforms.uWave.value = this.tex;
      uniforms.uWaveOrigin.value.set(this.origin, this.origin);
      uniforms.uWaveSpan.value = this.span;
    }
  }

  /** Drop a ripple. mag is meters of upward kick. */
  wake(x: number, z: number, mag: number): void {
    this.ensureMask();
    const cx = this.toCell(x);
    const cz = this.toCell(z);
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        const w = 1 - Math.hypot(dx, dz) / 3;
        if (w <= 0) continue;
        const ix = cx + dx;
        const iz = cz + dz;
        if (ix < 1 || iz < 1 || ix >= this.n - 1 || iz >= this.n - 1) continue;
        const i = iz * this.n + ix;
        if (!this.wet[i]) continue;
        this.vh[i] += mag * w;
      }
    }
  }

  heightAt(x: number, z: number): number {
    const fx = ((x - this.origin) / this.span) * (this.n - 1);
    const fz = ((z - this.origin) / this.span) * (this.n - 1);
    const ix = Math.max(0, Math.min(this.n - 1, Math.floor(fx)));
    const iz = Math.max(0, Math.min(this.n - 1, Math.floor(fz)));
    return this.h[iz * this.n + ix] ?? 0;
  }

  update(dt: number): void {
    this.ensureMask();
    const step = Math.min(dt, 0.05);
    this.time.value += step;
    const uniforms = this.world.waterUniforms;
    if (uniforms) uniforms.uTime.value = this.time.value;

    const n = this.n;
    const h = this.h;
    const wet = this.wet;
    for (let z = 1; z < n - 1; z++) {
      for (let x = 1; x < n - 1; x++) {
        const i = z * n + x;
        if (!wet[i]) {
          h[i] = 0;
          this.vh[i] = 0;
          this.vx[i] = 0;
          this.vz[i] = 0;
          continue;
        }
        const left = wet[i - 1] ? h[i - 1] : h[i];
        const right = wet[i + 1] ? h[i + 1] : h[i];
        const down = wet[i - n] ? h[i - n] : h[i];
        const up = wet[i + n] ? h[i + n] : h[i];
        let sum = 0;
        let count = 0;
        if (wet[i - 1]) { sum += left; count++; }
        if (wet[i + 1]) { sum += right; count++; }
        if (wet[i - n]) { sum += down; count++; }
        if (wet[i + n]) { sum += up; count++; }
        const avg = count > 0 ? sum / count : 0;
        this.vh[i] = (this.vh[i] + (avg - h[i]) * 0.9) * 0.985;

        const wx = this.origin + (x / (n - 1)) * this.span;
        const wz = this.origin + (z / (n - 1)) * this.span;
        const bay = wx > 0.5 && Math.abs(wz) < 2.2 + Math.max(0, wx) * 0.16;
        // Pressure from the slope, plus the harbor current running out to sea.
        this.vx[i] = this.vx[i] * 0.94 + (left - right) * 1.4;
        this.vz[i] = this.vz[i] * 0.94 + (down - up) * 1.4;
        if (bay) {
          this.vx[i] += 1.6 * step;
          this.vh[i] += (0.05 * Math.max(0, 18 - wx) / 18 - h[i]) * 0.08;
        } else {
          this.vx[i] += -wz * 0.025 * step;
          this.vz[i] += wx * 0.025 * step;
        }
        this.vx[i] = Math.max(-0.85, Math.min(0.85, this.vx[i]));
        this.vz[i] = Math.max(-0.85, Math.min(0.85, this.vz[i]));
        const dhdx = this.vx[i] > 0 ? h[i] - left : right - h[i];
        const dhdz = this.vz[i] > 0 ? h[i] - down : up - h[i];
        h[i] = Math.max(
          -0.14,
          Math.min(0.18, h[i] + this.vh[i] - (this.vx[i] * dhdx + this.vz[i] * dhdz) * 0.35),
        );
      }
    }

    // The rim is the infinite ocean: flat sea level, still wet.
    for (let i = 0; i < n; i++) {
      const edge = [i, (n - 1) * n + i, i * n, i * n + (n - 1)];
      for (const e of edge) {
        h[e] = 0;
        wet[e] = 1;
        this.vx[e] *= 0.9;
        this.vz[e] *= 0.9;
      }
    }

    const data = this.texData;
    for (let i = 0; i < h.length; i++) {
      const o = i * 4;
      data[o] = h[i];
      data[o + 1] = this.vx[i];
      data[o + 2] = this.vz[i];
      data[o + 3] = wet[i];
    }
    this.tex.needsUpdate = true;
  }

  private ensureMask(): void {
    if (this.masked) return;
    this.masked = true;
    const n = this.n;
    for (let z = 0; z < n; z++) {
      for (let x = 0; x < n; x++) {
        const wx = this.origin + (x / (n - 1)) * this.span;
        const wz = this.origin + (z / (n - 1)) * this.span;
        const land = this.world.probe(wx, wz).landY;
        const i = z * n + x;
        const edge = x === 0 || z === 0 || x === n - 1 || z === n - 1;
        this.wet[i] = edge || land < OCEAN_Y - 0.02 ? 1 : 0;
      }
    }
  }

  private toCell(p: number): number {
    return Math.round(((p - this.origin) / this.span) * (this.n - 1));
  }
}
