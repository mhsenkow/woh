import * as THREE from 'three';
import { VoxelChunk, CHUNK_SIZE, VOXEL_SCALE, VoxelType } from './VoxelChunk';

/** Realm-readable surface palette — Zelda field green, SMB brick red, Kirby pastel. */
const VOXEL_COLORS: Record<number, [number, number, number]> = {
  [VoxelType.Grass]: [0.42, 0.78, 0.36],
  [VoxelType.Stone]: [0.58, 0.54, 0.5],
  [VoxelType.Dirt]: [0.62, 0.42, 0.26],
  [VoxelType.Water]: [0.2, 0.58, 0.92],
  [VoxelType.Wood]: [0.72, 0.46, 0.24],
  [VoxelType.Sand]: [0.94, 0.86, 0.58],
  [VoxelType.Snow]: [0.96, 0.97, 1.0],
  [VoxelType.CastleStone]: [0.82, 0.78, 0.72],
  [VoxelType.MushroomBrick]: [0.9, 0.28, 0.22],
  [VoxelType.DreamBlock]: [0.9, 0.72, 0.96],
  [VoxelType.Malice]: [0.78, 0.06, 0.16],
  [VoxelType.Void]: [0.16, 0.04, 0.3],
};

const SIDE_SHADE = 0.9;
const BOTTOM_SHADE = 0.82;
/** Outset seals micro-cracks; never inset (that opened hollow corners). */
const OUT = 0.0015;

export type VoxelSampler = (wx: number, wy: number, wz: number) => VoxelType;

function isEmpty(v: VoxelType): boolean {
  return v === VoxelType.Air || v === VoxelType.Water;
}

function shadeFor(ny: number): number {
  if (ny > 0.5) return 1;
  if (ny < -0.5) return BOTTOM_SHADE;
  return SIDE_SHADE;
}

/**
 * Greedy-ish mesher: vertical side faces merge into one tall quad so cliffs
 * don't show a black "plank line" between every voxel layer.
 */
export function meshChunk(
  chunk: VoxelChunk,
  sample: VoxelSampler = (x, y, z) => chunk.get(x, y, z),
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertCount = 0;

  const ox = chunk.cx * CHUNK_SIZE;
  const oy = chunk.cy * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  const visited = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_SIZE * 4);

  const sideAxes: { axis: 0 | 2; dir: 1 | -1; mask: number }[] = [
    { axis: 0, dir: 1, mask: 0 },
    { axis: 0, dir: -1, mask: 1 },
    { axis: 2, dir: 1, mask: 2 },
    { axis: 2, dir: -1, mask: 3 },
  ];

  const pushQuad = (
    corners: [number, number, number][],
    normal: [number, number, number],
    color: [number, number, number],
  ) => {
    const s = shadeFor(normal[1]);
    const r = color[0] * s;
    const g = color[1] * s;
    const b = color[2] * s;
    for (const c of corners) {
      positions.push(
        (c[0] + normal[0] * OUT) * VOXEL_SCALE,
        (c[1] + normal[1] * OUT) * VOXEL_SCALE,
        (c[2] + normal[2] * OUT) * VOXEL_SCALE,
      );
      normals.push(normal[0], normal[1], normal[2]);
      colors.push(r, g, b);
    }
    indices.push(vertCount, vertCount + 1, vertCount + 2);
    indices.push(vertCount, vertCount + 2, vertCount + 3);
    vertCount += 4;
  };

  // ── Top + bottom faces (per voxel) ─────────────────────────────────────
  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let y = 0; y < CHUNK_SIZE; y++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const voxel = chunk.get(x, y, z);
        if (isEmpty(voxel)) continue;
        const color = VOXEL_COLORS[voxel] ?? [1, 0, 1];

        // Top
        if (isEmpty(sample(ox + x, oy + y + 1, oz + z))) {
          pushQuad(
            [
              [x, y + 1, z],
              [x, y + 1, z + 1],
              [x + 1, y + 1, z + 1],
              [x + 1, y + 1, z],
            ],
            [0, 1, 0],
            color,
          );
        }

        // Bottom — only when truly exposed (no solid below)
        if (isEmpty(sample(ox + x, oy + y - 1, oz + z))) {
          pushQuad(
            [
              [x + 1, y, z],
              [x + 1, y, z + 1],
              [x, y, z + 1],
              [x, y, z],
            ],
            [0, -1, 0],
            color,
          );
        }
      }
    }
  }

  // ── Side faces — greedy merge along +Y ─────────────────────────────────
  for (const { axis, dir, mask } of sideAxes) {
    const normal: [number, number, number] =
      axis === 0 ? [dir, 0, 0] : [0, 0, dir];

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = 0; y < CHUNK_SIZE; y++) {
          const vi = (x + y * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE) * 4 + mask;
          if (visited[vi]) continue;

          const voxel = chunk.get(x, y, z);
          if (isEmpty(voxel)) continue;

          const nx = axis === 0 ? x + dir : x;
          const nz = axis === 2 ? z + dir : z;
          if (!isEmpty(sample(ox + nx, oy + y, oz + nz))) continue;

          // Grow upward while same type + same exposed side
          let h = 1;
          while (y + h < CHUNK_SIZE) {
            const vi2 = (x + (y + h) * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE) * 4 + mask;
            if (visited[vi2]) break;
            if (chunk.get(x, y + h, z) !== voxel) break;
            if (!isEmpty(sample(ox + nx, oy + y + h, oz + nz))) break;
            h++;
          }

          for (let dy = 0; dy < h; dy++) {
            visited[(x + (y + dy) * CHUNK_SIZE + z * CHUNK_SIZE * CHUNK_SIZE) * 4 + mask] = 1;
          }

          const color = VOXEL_COLORS[voxel] ?? [1, 0, 1];
          const y0 = y;
          const y1 = y + h;

          if (axis === 0 && dir === 1) {
            pushQuad(
              [
                [x + 1, y0, z],
                [x + 1, y1, z],
                [x + 1, y1, z + 1],
                [x + 1, y0, z + 1],
              ],
              normal,
              color,
            );
          } else if (axis === 0 && dir === -1) {
            pushQuad(
              [
                [x, y0, z + 1],
                [x, y1, z + 1],
                [x, y1, z],
                [x, y0, z],
              ],
              normal,
              color,
            );
          } else if (axis === 2 && dir === 1) {
            pushQuad(
              [
                [x, y0, z + 1],
                [x + 1, y0, z + 1],
                [x + 1, y1, z + 1],
                [x, y1, z + 1],
              ],
              normal,
              color,
            );
          } else {
            pushQuad(
              [
                [x + 1, y0, z],
                [x, y0, z],
                [x, y1, z],
                [x + 1, y1, z],
              ],
              normal,
              color,
            );
          }
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  return geo;
}

export function meshWater(
  chunk: VoxelChunk,
  sample: VoxelSampler = (x, y, z) => chunk.get(x, y, z),
): THREE.BufferGeometry | null {
  const positions: number[] = [];
  const indices: number[] = [];
  let vertCount = 0;
  const ox = chunk.cx * CHUNK_SIZE;
  const oy = chunk.cy * CHUNK_SIZE;
  const oz = chunk.cz * CHUNK_SIZE;

  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let y = 0; y < CHUNK_SIZE; y++) {
        if (chunk.get(x, y, z) !== VoxelType.Water) continue;
        const above = sample(ox + x, oy + y + 1, oz + z);
        if (above === VoxelType.Air || y === CHUNK_SIZE - 1) {
          const waterY = (y + 0.85) * VOXEL_SCALE;
          positions.push(
            x * VOXEL_SCALE, waterY, z * VOXEL_SCALE,
            x * VOXEL_SCALE, waterY, (z + 1) * VOXEL_SCALE,
            (x + 1) * VOXEL_SCALE, waterY, (z + 1) * VOXEL_SCALE,
            (x + 1) * VOXEL_SCALE, waterY, z * VOXEL_SCALE,
          );
          indices.push(vertCount, vertCount + 1, vertCount + 2);
          indices.push(vertCount, vertCount + 2, vertCount + 3);
          vertCount += 4;
        }
      }
    }
  }

  if (positions.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
