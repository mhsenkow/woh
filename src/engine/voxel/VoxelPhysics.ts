import { CHUNK_SIZE, VOXEL_SCALE, VoxelType } from './VoxelChunk';
import { VoxelWorld } from './VoxelWorld';

export interface VoxelImpact {
  /** World-space meters. */
  worldX: number;
  worldY: number;
  worldZ: number;
  /** Radius in world meters. */
  radius: number;
  type: 'explosion' | 'fire' | 'ice' | 'tunnel';
}

/**
 * Destructible micro-voxel physics — low-poly landscape that can explode.
 * Impacts convert world meters → voxel indices, carve/ignite/freeze, then remesh.
 */
export class VoxelPhysics {
  private world: VoxelWorld;

  constructor(world: VoxelWorld) {
    this.world = world;
  }

  applyImpact(impact: VoxelImpact): void {
    const vx = Math.floor(impact.worldX / VOXEL_SCALE);
    const vy = Math.floor(impact.worldY / VOXEL_SCALE);
    const vz = Math.floor(impact.worldZ / VOXEL_SCALE);
    const radiusVox = Math.max(1, Math.ceil(impact.radius / VOXEL_SCALE));

    // Affect all chunks the sphere might touch
    const minCx = Math.floor((vx - radiusVox) / CHUNK_SIZE);
    const maxCx = Math.floor((vx + radiusVox) / CHUNK_SIZE);
    const minCz = Math.floor((vz - radiusVox) / CHUNK_SIZE);
    const maxCz = Math.floor((vz + radiusVox) / CHUNK_SIZE);

    for (let cz = minCz; cz <= maxCz; cz++) {
      for (let cx = minCx; cx <= maxCx; cx++) {
        for (let cy = 0; cy <= 1; cy++) {
          const chunk = this.world.getChunk(cx, cy, cz);
          if (!chunk) continue;

          const localX = vx - cx * CHUNK_SIZE;
          const localY = vy - cy * CHUNK_SIZE;
          const localZ = vz - cz * CHUNK_SIZE;

          switch (impact.type) {
            case 'explosion':
              chunk.carve(localX, localY, localZ, radiusVox);
              break;
            case 'fire':
              this.igniteArea(chunk, localX, localY, localZ, radiusVox);
              break;
            case 'ice':
              this.freezeArea(chunk, localX, localY, localZ, radiusVox);
              break;
            case 'tunnel':
              this.digTunnel(chunk, localX, localY, localZ, radiusVox);
              break;
          }
        }
      }
    }

    this.world.rebuildDirty();
  }

  private igniteArea(chunk: { get: Function; set: Function }, cx: number, cy: number, cz: number, r: number): void {
    const ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) {
      for (let dy = -ri; dy <= ri; dy++) {
        for (let dx = -ri; dx <= ri; dx++) {
          if (dx * dx + dy * dy + dz * dz > r * r) continue;
          const v = chunk.get(cx + dx, cy + dy, cz + dz);
          if (v === VoxelType.Wood || v === VoxelType.Grass) {
            chunk.set(cx + dx, cy + dy, cz + dz, VoxelType.Air);
          }
        }
      }
    }
  }

  private freezeArea(chunk: { get: Function; set: Function }, cx: number, cy: number, cz: number, r: number): void {
    const ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) {
      for (let dy = -ri; dy <= ri; dy++) {
        for (let dx = -ri; dx <= ri; dx++) {
          if (dx * dx + dy * dy + dz * dz > r * r) continue;
          if (chunk.get(cx + dx, cy + dy, cz + dz) === VoxelType.Water) {
            chunk.set(cx + dx, cy + dy, cz + dz, VoxelType.Snow);
          }
        }
      }
    }
  }

  private digTunnel(chunk: { get: Function; set: Function }, cx: number, cy: number, cz: number, r: number): void {
    const ri = Math.ceil(r);
    for (let dz = -ri; dz <= ri; dz++) {
      for (let dx = -ri; dx <= ri; dx++) {
        if (dx * dx + dz * dz > r * r) continue;
        const v = chunk.get(cx + dx, cy, cz + dz);
        if (v === VoxelType.Dirt || v === VoxelType.Sand) {
          chunk.set(cx + dx, cy, cz + dz, VoxelType.Air);
        }
      }
    }
  }
}
