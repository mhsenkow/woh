import * as THREE from 'three';
import { VoxelChunk, CHUNK_SIZE, VOXEL_SCALE, VoxelType } from './VoxelChunk';
import { meshChunk, meshWater } from './VoxelMesher';

export class VoxelWorld {
  readonly group = new THREE.Group();
  private chunks = new Map<string, VoxelChunk>();
  private meshes = new Map<string, THREE.Mesh>();
  private waterMeshes = new Map<string, THREE.Mesh>();
  private terrainMaterial: THREE.Material;
  private waterMaterial: THREE.Material;

  constructor() {
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.02,
      flatShading: true,
      envMapIntensity: 0.45,
      side: THREE.FrontSide,
    });

    this.waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x3aa0e0,
      transparent: true,
      opacity: 0.62,
      roughness: 0.08,
      metalness: 0.05,
      transmission: 0.55,
      thickness: 0.6,
      ior: 1.33,
      flatShading: false,
      emissive: 0x0a3048,
      emissiveIntensity: 0.15,
    });
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
   * Populous-style land silhouette: inland → beach → cliff face → water moat → void.
   * Without this the map is a flat square slab with no readable rim.
   */
  applyIslandEdges(chunkRadius: number): void {
    const half = chunkRadius * CHUNK_SIZE + CHUNK_SIZE * 0.5;
    // Squircle distance so square chunk grids still get soft rounded corners
    const beachStart = half * 0.62;
    const cliffStart = half * 0.78;
    const waterStart = half * 0.9;
    const voidStart = half * 1.02;
    const waterLevel = 4;

    for (const chunk of this.chunks.values()) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        for (let x = 0; x < CHUNK_SIZE; x++) {
          const wx = chunk.cx * CHUNK_SIZE + x + 0.5;
          const wz = chunk.cz * CHUNK_SIZE + z + 0.5;
          const ax = Math.abs(wx);
          const az = Math.abs(wz);
          const dist = Math.max(ax, az) + 0.42 * Math.min(ax, az);

          if (dist < beachStart) continue;

          // Find current solid top
          let top = -1;
          for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
            const v = chunk.get(x, y, z);
            if (v !== VoxelType.Air && v !== VoxelType.Water) {
              top = y;
              break;
            }
          }

          if (dist >= voidStart) {
            // Beyond the diorama — clear column so silhouette ends cleanly
            for (let y = 0; y < CHUNK_SIZE; y++) chunk.set(x, y, z, VoxelType.Air);
            continue;
          }

          if (dist >= waterStart) {
            // Water moat around the island
            for (let y = 0; y < CHUNK_SIZE; y++) {
              if (y <= waterLevel) chunk.set(x, y, z, VoxelType.Water);
              else chunk.set(x, y, z, VoxelType.Air);
            }
            // Thin stone shelf under water so cliffs have a foot
            if (top >= 0) chunk.set(x, Math.min(2, waterLevel - 1), z, VoxelType.Stone);
            continue;
          }

          if (dist >= cliffStart) {
            // Sheer cliff — one solid stone column (no dirt/stone stripes that
            // reopen hollow “plank” lines between layers).
            const t = (dist - cliffStart) / (waterStart - cliffStart);
            const cliffTop = Math.max(2, Math.floor(THREE.MathUtils.lerp(Math.max(top, 6), 3, t)));
            for (let y = 0; y < CHUNK_SIZE; y++) {
              if (y <= cliffTop) chunk.set(x, y, z, VoxelType.Stone);
              else if (y <= waterLevel) chunk.set(x, y, z, VoxelType.Water);
              else chunk.set(x, y, z, VoxelType.Air);
            }
            continue;
          }

          // Beach taper — sand cap over solid fill (continuous column for greedy sides)
          const t = (dist - beachStart) / (cliffStart - beachStart);
          const targetTop = Math.max(
            waterLevel + 1,
            Math.floor(THREE.MathUtils.lerp(Math.max(top, waterLevel + 2), waterLevel + 2, t * 0.85)),
          );
          for (let y = 0; y < CHUNK_SIZE; y++) {
            if (y < targetTop) chunk.set(x, y, z, VoxelType.Dirt);
            else if (y === targetTop) chunk.set(x, y, z, VoxelType.Sand);
            else if (y <= waterLevel) chunk.set(x, y, z, VoxelType.Water);
            else chunk.set(x, y, z, VoxelType.Air);
          }
        }
      }
      chunk.dirty = true;
    }
    this.rebuildDirty();
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
    (this.terrainMaterial as THREE.MeshStandardMaterial).dispose();
    (this.waterMaterial as THREE.MeshPhysicalMaterial).dispose();
  }
}
