import * as THREE from 'three';
import { VoxelChunk, CHUNK_SIZE, VOXEL_SCALE, VoxelType } from './VoxelChunk';
import { meshChunk, meshWater } from './VoxelMesher';
import { createInkTerrainMaterial, createInkWaterMaterial, type InkWaterUniforms } from '../art/InkTerrainMaterial';
import { valueNoise } from '../math/valueNoise';

/** Water plane height. Land below this is sea, bay, or channel. */
export const OCEAN_Y = 1.08;

function writeColumn(chunk: VoxelChunk, x: number, z: number, topCell: number, cap: VoxelType): void {
  const top = Math.max(0, Math.min(CHUNK_SIZE - 1, topCell));
  for (let y = 0; y < CHUNK_SIZE; y++) {
    if (y < top) chunk.set(x, y, z, y < top - 1 ? VoxelType.Stone : VoxelType.Dirt);
    else if (y === top) chunk.set(x, y, z, cap);
    else chunk.set(x, y, z, VoxelType.Air);
  }
}

function gauss(x: number, z: number, cx: number, cz: number, sigma: number): number {
  const dx = x - cx;
  const dz = z - cz;
  return Math.exp(-(dx * dx + dz * dz) / (2 * sigma * sigma));
}

/**
 * Implicit coast. Positive is land.
 * Three gaussian lobes (the three camps sit on them) added to a round core,
 * then domain-warped. Negative gaussians scoop a harbor to the east and
 * coves to the south and north, so the zero contour is a rounded triangle
 * rather than a circle. A 6m disk around each camp stays above the beach.
 */
function coastField(wx: number, wz: number, half: number): number {
  const s = half >= 120 ? 1 : half / 128;
  const freq = 0.015 / Math.max(s, 0.35);
  const warp = 6 * s;
  const x = wx + (valueNoise(wx * freq, wz * freq) - 0.5) * 2 * warp;
  const z = wz + (valueNoise(wx * freq + 19.2, wz * freq + 7.7) - 0.5) * 2 * warp;
  const span = 78 * s;
  const core = 1 - (x * x + z * z) / (span * span);
  let field = core * 0.42;
  field += gauss(x, z, -86 * s, -76 * s, 36 * s) * 0.85;
  field += gauss(x, z, 82 * s, 72 * s, 36 * s) * 0.85;
  field += gauss(x, z, -82 * s, 78 * s, 36 * s) * 0.85;
  field -= gauss(wx, wz, 108 * s, -4 * s, 22 * s) * 0.7;
  field -= gauss(wx, wz, 16 * s, -108 * s, 20 * s) * 0.42;
  field -= gauss(wx, wz, 28 * s, 112 * s, 18 * s) * 0.28;
  return field;
}

/** Two low terraces inland. The lobes stay meadows; the middle rises a little. */
function domeTop(field: number, wx: number, wz: number): number {
  const t = Math.min(1, Math.max(0, (field - 0.45) / 0.4));
  const smooth = t * t * (3 - 2 * t);
  const roll = 0.65 + 0.35 * valueNoise(wx * 0.01 + 2, wz * 0.01);
  return 6 + Math.round(smooth * roll * 2);
}

export class VoxelWorld {
  readonly group = new THREE.Group();
  private chunks = new Map<string, VoxelChunk>();
  private meshes = new Map<string, THREE.Mesh>();
  private waterMeshes = new Map<string, THREE.Mesh>();
  private terrainMaterial: THREE.Material;
  private waterMaterial: THREE.Material;

  constructor() {
    this.terrainMaterial = createInkTerrainMaterial();
    this.waterMaterial = createInkWaterMaterial();
  }

  private key(cx: number, cy: number, cz: number): string {
    return `${cx},${cy},${cz}`;
  }

  getChunk(cx: number, cy: number, cz: number): VoxelChunk | undefined {
    return this.chunks.get(this.key(cx, cy, cz));
  }

  /** Iterate loaded chunks (biome painting / map tools). */
  forEachChunk(fn: (chunk: VoxelChunk) => void): void {
    for (const chunk of this.chunks.values()) fn(chunk);
  }

  /** World-voxel lookup (cross-chunk). Missing chunk = Air so outer rims stay sealed. */
  sampleVoxel = (wx: number, wy: number, wz: number): VoxelType => {
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cy = Math.floor(wy / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const chunk = this.getChunk(cx, cy, cz);
    if (!chunk) return VoxelType.Air;
    const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const ly = ((wy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    return chunk.get(lx, ly, lz);
  };

  addChunk(chunk: VoxelChunk): void {
    const k = this.key(chunk.cx, chunk.cy, chunk.cz);
    this.chunks.set(k, chunk);
    // Defer meshing until neighbors exist — mark dirty for a sealed rebuild pass
    chunk.dirty = true;
  }

  rebuildMesh(k: string, chunk: VoxelChunk): void {
    const existing = this.meshes.get(k);
    if (existing) {
      this.group.remove(existing);
      existing.geometry.dispose();
      this.meshes.delete(k);
    }
    const existingWater = this.waterMeshes.get(k);
    if (existingWater) {
      this.group.remove(existingWater);
      existingWater.geometry.dispose();
      this.waterMeshes.delete(k);
    }

    const worldOffset = new THREE.Vector3(
      chunk.cx * CHUNK_SIZE * VOXEL_SCALE,
      chunk.cy * CHUNK_SIZE * VOXEL_SCALE,
      chunk.cz * CHUNK_SIZE * VOXEL_SCALE,
    );

    const geo = meshChunk(chunk, this.sampleVoxel);
    if (geo) {
      const mesh = new THREE.Mesh(geo, this.terrainMaterial);
      mesh.position.copy(worldOffset);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
      this.meshes.set(k, mesh);
    }

    const waterGeo = meshWater(chunk, this.sampleVoxel);
    if (waterGeo) {
      const waterMesh = new THREE.Mesh(waterGeo, this.waterMaterial);
      waterMesh.position.copy(worldOffset);
      waterMesh.receiveShadow = true;
      this.group.add(waterMesh);
      this.waterMeshes.set(k, waterMesh);
    }

    chunk.dirty = false;
  }

  rebuildDirty(): void {
    // Border edits must remesh neighbors too, or sealed faces stay missing / hollow
    const seeds = [...this.chunks.values()].filter((c) => c.dirty);
    for (const c of seeds) {
      for (const [dx, dy, dz] of [
        [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
      ] as const) {
        const n = this.getChunk(c.cx + dx, c.cy + dy, c.cz + dz);
        if (n) n.dirty = true;
      }
    }

    for (const [k, chunk] of this.chunks) {
      if (chunk.dirty) this.rebuildMesh(k, chunk);
    }
  }

  generateRadius(radius: number): void {
    for (let cz = -radius; cz <= radius; cz++) {
      for (let cx = -radius; cx <= radius; cx++) {
        const chunk = VoxelChunk.generateTerrain(cx, 0, cz);
        this.addChunk(chunk);
      }
    }
    this.applyIslandEdges(radius);
  }

  /**
   * Land is the positive side of coastField. Sea columns are air, so the
   * ocean plane is the only water surface and the chunk square never shows.
   */
  applyIslandEdges(chunkRadius: number): void {
    const half = chunkRadius * CHUNK_SIZE;
    const islets: { x: number; z: number; r: number; cap: VoxelType }[] = half >= 120
      ? [
          { x: 120, z: 10, r: 5, cap: VoxelType.Malice },
          { x: -120, z: 72, r: 4.5, cap: VoxelType.DreamBlock },
          { x: 18, z: -120, r: 4.5, cap: VoxelType.MushroomBrick },
        ]
      : [];

    for (const chunk of this.chunks.values()) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const wx = chunk.cx * CHUNK_SIZE + x + 0.5;
          const wz = chunk.cz * CHUNK_SIZE + z + 0.5;
          const field = coastField(wx, wz, half);
          const islet = field <= 0
            ? islets.find((item) => Math.hypot(wx - item.x, wz - item.z) < item.r)
            : undefined;

          if (islet) {
            const edge = Math.hypot(wx - islet.x, wz - islet.z) / islet.r;
            const top = edge > 0.62 ? 4 : 5;
            writeColumn(chunk, x, z, top, edge > 0.62 ? VoxelType.Sand : islet.cap);
            continue;
          }

          if (field <= 0) {
            for (let y = 0; y < CHUNK_SIZE; y++) chunk.set(x, y, z, VoxelType.Air);
            continue;
          }

          if (field < 0.085) {
            const top = field < 0.04 ? 4 : 5;
            writeColumn(chunk, x, z, top, VoxelType.Sand);
            continue;
          }

          writeColumn(chunk, x, z, domeTop(field, wx, wz), VoxelType.Grass);
        }
      }
      chunk.dirty = true;
    }
    this.rebuildDirty();
  }

  /** Flat sea that continues under the fog. The bay is a hole in the island, so it is this same water. */
  createOcean(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(720, 720, 220, 220);
    geo.rotateX(-Math.PI / 2);
    const shore = new Float32Array(geo.attributes.position.count);
    geo.setAttribute('aShore', new THREE.BufferAttribute(shore, 1));
    const mesh = new THREE.Mesh(geo, this.waterMaterial);
    mesh.position.y = OCEAN_Y;
    mesh.receiveShadow = false;
    mesh.frustumCulled = false;
    return mesh;
  }

  /** Water shader uniforms (time + wave height texture). */
  get waterUniforms(): InkWaterUniforms | undefined {
    return (this.waterMaterial as THREE.MeshLambertMaterial).userData.waterUniforms as InkWaterUniforms | undefined;
  }

  /**
   * Top of the column. Water sitting on a stone shelf reports top = Water
   * and landY as the bed underneath.
   */
  probe(worldX: number, worldZ: number): { landY: number; waterY: number | null; top: VoxelType } {
    const vx = Math.floor(worldX / VOXEL_SCALE);
    const vz = Math.floor(worldZ / VOXEL_SCALE);
    const cx = Math.floor(vx / CHUNK_SIZE);
    const cz = Math.floor(vz / CHUNK_SIZE);
    const lx = ((vx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((vz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    let landY = 0;
    let waterY: number | null = null;
    let top = VoxelType.Air;

    for (let cy = 1; cy >= 0; cy--) {
      const chunk = this.getChunk(cx, cy, cz);
      if (!chunk) continue;
      for (let ly = CHUNK_SIZE - 1; ly >= 0; ly--) {
        const v = chunk.get(lx, ly, lz);
        if (v === VoxelType.Air) continue;
        if (top === VoxelType.Air) top = v;
        if (v === VoxelType.Water) {
          if (waterY === null) waterY = (cy * CHUNK_SIZE + ly + 0.85) * VOXEL_SCALE;
          continue;
        }
        landY = (cy * CHUNK_SIZE + ly + 1) * VOXEL_SCALE;
        return { landY, waterY, top };
      }
    }
    return { landY, waterY, top };
  }

  surfaceType(worldX: number, worldZ: number): VoxelType {
    return this.probe(worldX, worldZ).top;
  }

  isWater(worldX: number, worldZ: number): boolean {
    const p = this.probe(worldX, worldZ);
    if (p.top === VoxelType.Water) return true;
    return p.landY < OCEAN_Y - 0.02;
  }

  /** Feet height. Land units wade; swimmers sit on the surface. */
  walkHeight(worldX: number, worldZ: number, aquatic: boolean): number {
    const p = this.probe(worldX, worldZ);
    if (p.top === VoxelType.Water || p.landY < OCEAN_Y - 0.02) {
      return aquatic ? OCEAN_Y + 0.02 : OCEAN_Y - 0.2;
    }
    return p.landY;
  }

  /** World-space Y of the top solid voxel surface at (worldX, worldZ). */
  getSurfaceHeight(worldX: number, worldZ: number): number {
    const vx = Math.floor(worldX / VOXEL_SCALE);
    const vz = Math.floor(worldZ / VOXEL_SCALE);
    const cx = Math.floor(vx / CHUNK_SIZE);
    const cz = Math.floor(vz / CHUNK_SIZE);
    const lx = ((vx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((vz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;

    for (let cy = 1; cy >= 0; cy--) {
      const chunk = this.getChunk(cx, cy, cz);
      if (!chunk) continue;
      for (let ly = CHUNK_SIZE - 1; ly >= 0; ly--) {
        const v = chunk.get(lx, ly, lz);
        if (v !== VoxelType.Air && v !== VoxelType.Water) {
          return (cy * CHUNK_SIZE + ly + 1) * VOXEL_SCALE;
        }
      }
    }
    return 0;
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
    }
    for (const mesh of this.waterMeshes.values()) {
      mesh.geometry.dispose();
    }
    this.terrainMaterial.dispose();
    this.waterMaterial.dispose();
  }
}
