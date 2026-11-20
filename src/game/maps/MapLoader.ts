import { OCEAN_Y, VoxelWorld } from '../../engine/voxel/VoxelWorld';
import { valueNoise } from '../../engine/math/valueNoise';
import { VoxelType, VOXEL_SCALE, CHUNK_SIZE } from '../../engine/voxel/VoxelChunk';
import {
  DEFAULT_MAP_ID,
  getMap,
  type MapDef,
  type MapFeature,
} from './MapDefinitions';

export type { MapDef } from './MapDefinitions';
export { DEFAULT_MAP_ID, getMap, listMaps, mapsForRealm, MAP_DB } from './MapDefinitions';

/** @deprecated Prefer getMap(DEFAULT_MAP_ID) — kept for main.ts boot. */
export const DEFAULT_MAP: MapDef = getMap(DEFAULT_MAP_ID);

function worldToLocal(
  worldX: number,
  worldZ: number,
): { cx: number; cz: number; lx: number; lz: number } {
  const vx = Math.floor(worldX / VOXEL_SCALE);
  const vz = Math.floor(worldZ / VOXEL_SCALE);
  const cx = Math.floor(vx / CHUNK_SIZE);
  const cz = Math.floor(vz / CHUNK_SIZE);
  const lx = ((vx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((vz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return { cx, cz, lx, lz };
}

function stampDisk(
  world: VoxelWorld,
  x: number,
  z: number,
  radius: number,
  voxel: VoxelType,
  yOffset = 0,
  deckY?: number,
): void {
  const r = Math.max(1, Math.ceil(radius / VOXEL_SCALE));
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r) continue;
      const wx = x + dx * VOXEL_SCALE;
      const wz = z + dz * VOXEL_SCALE;
      const { cx, cz, lx, lz } = worldToLocal(wx, wz);
      const chunk = world.getChunk(cx, 0, cz);
      if (!chunk) continue;

      if (voxel === VoxelType.Water) {
        const surfaceY = world.getSurfaceHeight(wx, wz);
        // A hill stays a hill. Only ground already near the sea is opened to the ocean.
        if (surfaceY > OCEAN_Y + 0.35) continue;
        for (let y = 0; y < CHUNK_SIZE; y++) {
          if (y <= 2) {
            if (chunk.get(lx, y, lz) === VoxelType.Air) {
              chunk.set(lx, y, lz, y === 0 ? VoxelType.Stone : VoxelType.Sand);
            }
          } else {
            chunk.set(lx, y, lz, VoxelType.Air);
          }
        }
        chunk.dirty = true;
        continue;
      }

      const surfaceY = deckY ?? world.getSurfaceHeight(wx, wz);
      const vy = Math.floor(surfaceY / VOXEL_SCALE) + yOffset;
      const ly = ((vy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      if (voxel === VoxelType.Malice || voxel === VoxelType.Void) {
        chunk.set(lx, ly, lz, voxel);
      } else if (voxel === VoxelType.Air) {
        chunk.set(lx, ly, lz, VoxelType.Air);
      } else {
        chunk.set(lx, Math.min(CHUNK_SIZE - 1, ly + 1), lz, voxel);
      }
      chunk.dirty = true;
    }
  }
}

function stampAxisStrip(
  world: VoxelWorld,
  feature: MapFeature,
  voxel: VoxelType,
  deckY?: number,
): void {
  const length = feature.length ?? feature.radius * 2;
  const half = length / 2;
  const steps = Math.ceil(length / VOXEL_SCALE);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ox = feature.axis === 'x' ? -half + t * length : 0;
    const oz = feature.axis === 'z' ? -half + t * length : 0;
    stampDisk(world, feature.x + ox, feature.z + oz, feature.radius, voxel, 0, deckY);
  }
}

function applyFeature(world: VoxelWorld, feature: MapFeature, map: MapDef): void {
  const voxel = feature.voxelOverride ?? map.accentVoxel;

  switch (feature.kind) {
    case 'ridge':
    case 'castleWall':
      if (feature.axis && feature.length) stampAxisStrip(world, feature, voxel);
      else stampDisk(world, feature.x, feature.z, feature.radius, voxel, 1);
      break;
    case 'river':
      if (feature.axis && feature.length) {
        stampAxisStrip(world, { ...feature, voxelOverride: VoxelType.Water }, VoxelType.Water);
      } else {
        stampDisk(world, feature.x, feature.z, feature.radius, VoxelType.Water);
      }
      break;
    case 'bridge': {
      const bed = world.getSurfaceHeight(feature.x, feature.z);
      const deck = bed < OCEAN_Y + 0.2 ? OCEAN_Y + 0.7 : undefined;
      if (feature.axis && feature.length) {
        stampAxisStrip(world, feature, VoxelType.Wood, deck);
      } else {
        stampDisk(world, feature.x, feature.z, feature.radius, VoxelType.Wood, 0, deck);
      }
      break;
    }
    case 'softDirt':
      stampDisk(world, feature.x, feature.z, feature.radius, VoxelType.Dirt);
      break;
    case 'creepSeed':
      stampDisk(
        world,
        feature.x,
        feature.z,
        feature.radius,
        feature.voxelOverride ?? VoxelType.Malice,
      );
      break;
    case 'pipeMouth':
      stampDisk(world, feature.x, feature.z, feature.radius, VoxelType.MushroomBrick, 1);
      break;
    case 'resourceRing':
      // Visual marker only — nodes already in map.resourceNodes
      stampDisk(world, feature.x, feature.z, feature.radius * 0.4, map.accentVoxel);
      break;
  }
}

/**
 * Paint surface voxels so each sector reads as its game universe.
 * Single-biome maps recolor wholesale; Neutral / triforce maps paint by quadrant.
 */
function paintBiomeLand(world: VoxelWorld, map: MapDef): void {
  world.forEachChunk((chunk) => {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        // Find surface
        let top = -1;
        for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
          const v = chunk.get(x, y, z);
          if (v !== VoxelType.Air && v !== VoxelType.Water) {
            top = y;
            break;
          }
        }
        if (top < 0) continue;

        const wx = chunk.cx * CHUNK_SIZE + x;
        const wz = chunk.cz * CHUNK_SIZE + z;
        const worldX = wx * VOXEL_SCALE;
        const worldZ = wz * VOXEL_SCALE;
        const surface = chunk.get(x, top, z);

        // Only rewrite natural surfaces so stamped features stay intact
        if (
          surface !== VoxelType.Grass &&
          surface !== VoxelType.Dirt &&
          surface !== VoxelType.Sand &&
          surface !== VoxelType.Stone &&
          surface !== VoxelType.Snow
        ) {
          continue;
        }

        const biome = sectorBiome(map, worldX, worldZ);
        const next = surfaceForBiome(biome, surface, wx, wz, top);
        if (next !== surface) {
          chunk.set(x, top, z, next);
          chunk.dirty = true;
        }

        // Soft dirt underlayer accents for mushroom checker / dream glitter
        if (biome === 'mushroom-plains' && top > 1 && mushroomPatch(map, wx, wz)) {
          chunk.set(x, top, z, VoxelType.MushroomBrick);
          chunk.dirty = true;
        }
        if (biome === 'dream-meadow' && top > 1 && dreamPatch(map, wx, wz)) {
          chunk.set(x, top, z, VoxelType.DreamBlock);
          chunk.dirty = true;
        }
        if (biome === 'koopa-lava' && surface === VoxelType.Grass) {
          chunk.set(x, top, z, VoxelType.Stone);
          chunk.dirty = true;
        }
        if (biome === 'void-star' && ((wx + wz) & 3) === 0) {
          chunk.set(x, top, z, VoxelType.Void);
          chunk.dirty = true;
        }
        if ((biome === 'hyrule-field' || biome === 'zora-river') && surface === VoxelType.Grass) {
          // Prefer map surface voxel (usually Grass) — leave; castle stone near ridges already stamped
        }
        if (biome === 'death-mountain' && surface === VoxelType.Grass && stoneOutcrop(map, wx, wz)) {
          chunk.set(x, top, z, VoxelType.Stone);
          chunk.dirty = true;
        }
        // Gloom patches on the northeast of a shared island. Blotches, not a ruled grid.
        if (
          map.realm === 'Neutral' &&
          worldX > 4 &&
          worldZ > 4 &&
          surface === VoxelType.Grass &&
          valueNoise(wx * 0.16, wz * 0.16) > 0.7 &&
          valueNoise(wx * 0.05 + 3.2, wz * 0.05) > 0.42
        ) {
          chunk.set(x, top, z, VoxelType.Malice);
          chunk.dirty = true;
        }
      }
    }
  });
}

/** Shared islands get noise blotches. A realm's own map keeps its regular scatter. */
function mushroomPatch(map: MapDef, wx: number, wz: number): boolean {
  if (map.realm !== 'Neutral') return ((wx + wz) & 7) === 0;
  return valueNoise(wx * 0.14, wz * 0.14) > 0.66 && valueNoise(wx * 0.05 + 2, wz * 0.05) > 0.38;
}

function dreamPatch(map: MapDef, wx: number, wz: number): boolean {
  if (map.realm !== 'Neutral') return ((wx * 3 + wz * 5) & 15) === 0;
  return valueNoise(wx * 0.15 + 4, wz * 0.15) > 0.67 && valueNoise(wx * 0.06, wz * 0.06 + 1) > 0.4;
}

function stoneOutcrop(map: MapDef, wx: number, wz: number): boolean {
  if (map.realm !== 'Neutral') return true;
  return valueNoise(wx * 0.07, wz * 0.07) > 0.76;
}

function sectorBiome(map: MapDef, worldX: number, worldZ: number): MapDef['biome'] {
  if (map.realm !== 'Neutral') return map.biome;
  // Triforce / cross-realm: SW Hyrule, NE Malice field, NW Dream, SE Mushroom
  if (worldX < 0 && worldZ < 0) return 'hyrule-field';
  if (worldX >= 0 && worldZ >= 0) return 'death-mountain'; // scorched / gloom-adjacent NE
  if (worldX < 0 && worldZ >= 0) return 'dream-meadow';
  return 'mushroom-plains';
}

function surfaceForBiome(
  biome: MapDef['biome'],
  current: VoxelType,
  wx: number,
  wz: number,
  top: number,
): VoxelType {
  switch (biome) {
    case 'mushroom-plains':
      // Brighter "overworld" — keep grass, sprinkle later
      return current === VoxelType.Stone && top < 10 ? VoxelType.Grass : current;
    case 'dream-meadow':
      return current === VoxelType.Snow ? VoxelType.DreamBlock : current;
    case 'koopa-lava':
      return current === VoxelType.Grass ? VoxelType.Stone : current;
    case 'void-star':
      return current === VoxelType.Grass ? VoxelType.DreamBlock : current;
    case 'death-mountain':
      return current === VoxelType.Grass ? VoxelType.Stone : current;
    case 'zora-river':
      return current === VoxelType.Dirt && ((wx + wz) & 5) === 0 ? VoxelType.Sand : current;
    default:
      return current;
  }
}

/**
 * Generate terrain chunks, then stamp map features (ridges, rivers, creep seeds…).
 * Returns the resolved MapDef for spawn / resource wiring.
 */
export function loadMap(world: VoxelWorld, mapDef: MapDef | string = DEFAULT_MAP): MapDef {
  const map = typeof mapDef === 'string' ? getMap(mapDef) : mapDef;
  world.generateRadius(map.chunkRadius);

  // Recolor land to match realm before stamping authored features
  paintBiomeLand(world, map);

  for (const feature of map.features) {
    applyFeature(world, feature, map);
  }

  // Sand only hugs the water. Inland dirt and beach interiors become meadow.
  capCentralHill(world);
  growMeadows(world);

  // Preferred surface voxel for single-realm maps (Mushroom brick HQ pads, etc.)
  if (map.realm !== 'Neutral' && map.surfaceVoxel !== VoxelType.Grass) {
    applySurfacePreference(world, map);
  }

  world.rebuildDirty();

  return map;
}

function cellHash(x: number, z: number): number {
  let a = Math.imul(x | 0, 374761393) ^ Math.imul(z | 0, 668265263);
  a = Math.imul(a ^ (a >>> 13), 1274126177);
  return ((a ^ (a >>> 16)) >>> 0) / 4294967296;
}

/** The center ridge is high ground, not the castle. Grass the top so it reads as a hill. */
function capCentralHill(world: VoxelWorld): void {
  for (let z = -5; z <= 5; z += VOXEL_SCALE) {
    for (let x = -10; x <= 10; x += VOXEL_SCALE) {
      const probed = world.probe(x, z);
      if (probed.landY < OCEAN_Y + 0.5) continue;
      if (probed.top !== VoxelType.Stone && probed.top !== VoxelType.Dirt && probed.top !== VoxelType.Snow) continue;
      const { cx, cz, lx, lz } = worldToLocal(x, z);
      const chunk = world.getChunk(cx, 0, cz);
      if (!chunk) continue;
      const ly = Math.floor(probed.landY / VOXEL_SCALE) - 1;
      if (ly < 1 || ly >= CHUNK_SIZE) continue;
      chunk.set(lx, ly, lz, VoxelType.Grass);
      if (chunk.get(lx, ly - 1, lz) === VoxelType.Stone) chunk.set(lx, ly - 1, lz, VoxelType.Dirt);
      chunk.dirty = true;
    }
  }
}

/** Keep a thin sandy shore and turn everything else that can grow into grass. */
function growMeadows(world: VoxelWorld): void {
  world.forEachChunk((chunk) => {
    let changed = false;
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        let top = -1;
        for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
          const v = chunk.get(x, y, z);
          if (v !== VoxelType.Air && v !== VoxelType.Water) {
            top = y;
            break;
          }
        }
        if (top < 0) continue;
        const surface = chunk.get(x, top, z);
        if (surface !== VoxelType.Grass && surface !== VoxelType.Dirt && surface !== VoxelType.Sand) continue;

        const landY = (top + 1) * VOXEL_SCALE;
        if (landY < OCEAN_Y) continue;

        const h = cellHash(chunk.cx * CHUNK_SIZE + x, chunk.cz * CHUNK_SIZE + z);
        let next = surface;
        if (landY < OCEAN_Y + 0.45) next = h > 0.9 ? VoxelType.Grass : VoxelType.Sand;
        else if (surface === VoxelType.Sand || surface === VoxelType.Dirt) {
          next = h > 0.94 ? VoxelType.Dirt : VoxelType.Grass;
        }
        if (next !== surface) {
          chunk.set(x, top, z, next);
          changed = true;
        }
      }
    }
    if (changed) chunk.dirty = true;
  });
}

function applySurfacePreference(world: VoxelWorld, map: MapDef): void {
  world.forEachChunk((chunk) => {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        for (let y = CHUNK_SIZE - 1; y >= 0; y--) {
          const v = chunk.get(x, y, z);
          if (v === VoxelType.Air || v === VoxelType.Water) continue;
          if (v === VoxelType.Grass && map.biome === 'dream-meadow' && ((x + z) & 9) === 0) {
            chunk.set(x, y, z, VoxelType.DreamBlock);
            chunk.dirty = true;
          }
          if (v === VoxelType.Grass && map.biome === 'koopa-lava') {
            chunk.set(x, y, z, map.surfaceVoxel);
            chunk.dirty = true;
          }
          break;
        }
      }
    }
  });
}
