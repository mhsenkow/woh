export const CHUNK_SIZE = 32;
export const VOXEL_SCALE = 0.25;

export const enum VoxelType {
  Air = 0,
  Grass = 1,
  Stone = 2,
  Dirt = 3,
  Water = 4,
  Wood = 5,
  Sand = 6,
  Snow = 7,
  CastleStone = 8,
  MushroomBrick = 9,
  DreamBlock = 10,
  Malice = 11,
  Void = 12,
}

export class VoxelChunk {
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  readonly data: Uint8Array;
  dirty = true;

  constructor(cx: number, cy: number, cz: number) {
    this.cx = cx;
    this.cy = cy;
    this.cz = cz;
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE);
  }

  index(x: number, y: number, z: number): number {
    return x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE;
  }

  get(x: number, y: number, z: number): VoxelType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE)
      return VoxelType.Air;
    return this.data[this.index(x, y, z)] as VoxelType;
  }

  set(x: number, y: number, z: number, type: VoxelType): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) return;
    this.data[this.index(x, y, z)] = type;
    this.dirty = true;
  }

  fillLayer(y: number, type: VoxelType): void {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        this.set(x, y, z, type);
      }
    }
  }

  carve(cx: number, cy: number, cz: number, radius: number): void {
    const r2 = radius * radius;
    for (let z = -radius; z <= radius; z++) {
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x * x + y * y + z * z <= r2) {
            this.set(cx + x, cy + y, cz + z, VoxelType.Air);
          }
        }
      }
    }
  }

  static generateTerrain(cx: number, cy: number, cz: number): VoxelChunk {
    const chunk = new VoxelChunk(cx, cy, cz);

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const wx = cx * CHUNK_SIZE + x;
        const wz = cz * CHUNK_SIZE + z;

        const height = Math.floor(
          8 +
            Math.sin(wx * 0.05) * 3 +
            Math.cos(wz * 0.07) * 2 +
            Math.sin((wx + wz) * 0.03) * 4,
        );

        for (let y = 0; y < CHUNK_SIZE; y++) {
          const wy = cy * CHUNK_SIZE + y;
          if (wy > height) {
            if (wy <= 5) {
              chunk.set(x, y, z, VoxelType.Water);
            }
          } else if (wy === height) {
            if (wy <= 5) chunk.set(x, y, z, VoxelType.Sand);
            else if (wy > 14) chunk.set(x, y, z, VoxelType.Snow);
            else chunk.set(x, y, z, VoxelType.Grass);
          } else if (wy > height - 2) {
            // Thin dirt under top only — keep the bulk one type so cliff sides
            // greedy-merge into solid faces (no hollow layer stripes).
            chunk.set(x, y, z, VoxelType.Dirt);
          } else {
            chunk.set(x, y, z, VoxelType.Stone);
          }
        }
      }
    }
    return chunk;
  }
}
