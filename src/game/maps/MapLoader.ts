import { VoxelWorld } from '../../engine/voxel/VoxelWorld';
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
): void {
  const r = Math.max(1, Math.ceil(radius / VOXEL_SCALE));
  for (let dz = -r; dz <= r; dz++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r) continue;
      const wx = x + dx * VOXEL_SCALE;
      const wz = z + dz * VOXEL_SCALE;
      const surfaceY = world.getSurfaceHeight(wx, wz);
      const { cx, cz, lx, lz } = worldToLocal(wx, wz);
      const chunk = world.getChunk(cx, 0, cz);
      if (!chunk) continue;
      const vy = Math.floor(surfaceY / VOXEL_SCALE) + yOffset;
      const ly = ((vy % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
      if (voxel === VoxelType.Water || voxel === VoxelType.Malice || voxel === VoxelType.Void) {
        chunk.set(lx, ly, lz, voxel);
      } else if (voxel === VoxelType.Air) {
        chunk.set(lx, ly, lz, VoxelType.Air);
      } else {
        // Raise / replace surface
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
): void {
  const length = feature.length ?? feature.radius * 2;
  const half = length / 2;
  const steps = Math.ceil(length / VOXEL_SCALE);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ox = feature.axis === 'x' ? -half + t * length : 0;
    const oz = feature.axis === 'z' ? -half + t * length : 0;
    stampDisk(world, feature.x + ox, feature.z + oz, feature.radius, voxel);
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
    case 'bridge':
      if (feature.axis && feature.length) {
        stampAxisStrip(world, feature, VoxelType.Wood);
      } else {
        stampDisk(world, feature.x, feature.z, feature.radius, VoxelType.Wood, 1);
      }
      break;
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
        if (biome === 'mushroom-plains' && top > 1 && ((wx + wz) & 7) === 0) {
          chunk.set(x, top, z, VoxelType.MushroomBrick);
          chunk.dirty = true;
        }
        if (biome === 'dream-meadow' && top > 1 && ((wx * 3 + wz * 5) & 15) === 0) {
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
        if (biome === 'death-mountain' && surface === VoxelType.Grass) {
          chunk.set(x, top, z, VoxelType.Stone);
          chunk.dirty = true;
        }
        // Malice NE speckles on Neutral maps
        if (
          map.realm === 'Neutral' &&
          worldX > 4 &&
          worldZ > 4 &&
          surface === VoxelType.Grass &&
          ((wx * 7 + wz * 3) & 15) === 0
        ) {
          chunk.set(x, top, z, VoxelType.Malice);
          chunk.dirty = true;
        }
      }
    }
  });
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

  // Preferred surface voxel for single-realm maps (Mushroom brick HQ pads, etc.)
  if (map.realm !== 'Neutral' && map.surfaceVoxel !== VoxelType.Grass) {
    applySurfacePreference(world, map);
  }

  world.rebuildDirty();

  return map;
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
