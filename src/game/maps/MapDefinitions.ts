import { VoxelType } from '../../engine/voxel/VoxelChunk';
import { ResourceType } from '../../sim/ecs/components';

/** Realm-tied surface palette used by the mesher / minimap. */
export type BiomeId =
  | 'hyrule-field'
  | 'death-mountain'
  | 'zora-river'
  | 'mushroom-plains'
  | 'koopa-lava'
  | 'dream-meadow'
  | 'void-star';

export type MapFeatureKind =
  | 'ridge'          // high ground (+25% range / LoS block)
  | 'river'          // water voxels — Zora / ice-bridge flanking
  | 'bridge'         // wooden voxels — fire-vulnerable
  | 'softDirt'       // Bob-omb tunnelable
  | 'creepSeed'      // starting Malice / Void patch
  | 'pipeMouth'      // Toadstool warp network endpoint
  | 'castleWall'     // fortification prefab
  | 'resourceRing';  // dense harvest pocket

export interface MapFeature {
  kind: MapFeatureKind;
  x: number;
  z: number;
  /** Radius in world meters (micro-voxel grid). */
  radius: number;
  /** Optional axis for elongated features (rivers / ridges). */
  axis?: 'x' | 'z';
  length?: number;
  voxelOverride?: VoxelType;
}

export interface SpawnPoint {
  faction: number;
  x: number;
  z: number;
  /** Facing yaw in radians for opening camera / rally. */
  facing?: number;
}

export interface ResourceNode {
  type: ResourceType;
  x: number;
  z: number;
  amount: number;
}

export interface MapDef {
  id: string;
  name: string;
  /** One-line strategic pitch shown in map select. */
  blurb: string;
  realm: 'Hyrule' | 'Mushroom' | 'Popstar' | 'Neutral';
  biome: BiomeId;
  /** Chunk X/Z half-extent loaded around origin. */
  chunkRadius: number;
  /** Vertical chunk count (usually 1–2). */
  heightChunks: number;
  /** Recommended player count (spawnPoints.length). */
  players: number;
  spawnPoints: SpawnPoint[];
  resourceNodes: ResourceNode[];
  features: MapFeature[];
  /** Surface voxel preferred by biome generator. */
  surfaceVoxel: VoxelType;
  /** Accent fill used for ridges / walls. */
  accentVoxel: VoxelType;
  /** Whether Malice/Void creep is legal on this map. */
  allowsCreep: boolean;
  /** Whether Warp Pipe underground transit is legal. */
  allowsPipes: boolean;
  /** Minimap tint (hex). */
  minimapTint: number;
}

export const MAP_DB: Record<string, MapDef> = {
  'triforce-clash': {
    id: 'triforce-clash',
    name: 'Triforce Clash',
    blurb: 'Hyrule Island. The keep holds the southwest shore. Malice and Dream Land have landed. Their homes are the islets out at sea.',
    realm: 'Neutral',
    biome: 'hyrule-field',
    chunkRadius: 4,
    heightChunks: 1,
    players: 3,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.CastleStone,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0x5a8a6a,
    spawnPoints: [
      { faction: 0, x: -18, z: -16, facing: Math.PI * 0.25 },  // Hyrule Royal Guard (SW)
      { faction: 1, x: 18, z: 16, facing: -Math.PI * 0.75 },   // Ganon Malice (NE)
      { faction: 4, x: -18, z: 16, facing: -Math.PI * 0.25 },  // Dream Land Star Guard (NW)
    ],
    resourceNodes: [
      { type: ResourceType.Rupees, x: -12, z: -10, amount: 1400 },
      { type: ResourceType.Rupees, x: 12, z: 10, amount: 1400 },
      { type: ResourceType.StarBits, x: -12, z: 10, amount: 1400 },
      { type: ResourceType.Rupees, x: 0, z: 0, amount: 900 },
      { type: ResourceType.Rupees, x: 8, z: -8, amount: 700 },
      { type: ResourceType.StarBits, x: -8, z: 4, amount: 700 },
    ],
    features: [
      { kind: 'ridge', x: 0, z: 0, radius: 4, length: 12, axis: 'x', voxelOverride: VoxelType.Stone },
      { kind: 'river', x: 2, z: 0, radius: 1.5, length: 24, axis: 'z', voxelOverride: VoxelType.Water },
      { kind: 'bridge', x: 2, z: -6, radius: 1, length: 5, axis: 'x', voxelOverride: VoxelType.Wood },
      { kind: 'bridge', x: 2, z: 6, radius: 1, length: 5, axis: 'x', voxelOverride: VoxelType.Wood },
      { kind: 'creepSeed', x: 14, z: 12, radius: 4, voxelOverride: VoxelType.Malice },
      { kind: 'creepSeed', x: 10, z: 14, radius: 2.5, voxelOverride: VoxelType.Malice },
      { kind: 'castleWall', x: -16, z: -14, radius: 1.5, length: 8, axis: 'x', voxelOverride: VoxelType.CastleStone },
      { kind: 'ridge', x: -14, z: 12, radius: 2.5, voxelOverride: VoxelType.DreamBlock },
      { kind: 'softDirt', x: 6, z: -4, radius: 3 },
      { kind: 'resourceRing', x: 0, z: 0, radius: 2.5 },
    ],
  },

  'hyrule-field': {
    id: 'hyrule-field',
    name: 'Hyrule Field',
    blurb: 'Open plains with central ridge — classic 1v1 positional fight.',
    realm: 'Hyrule',
    biome: 'hyrule-field',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.CastleStone,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0x4a8a3a,
    spawnPoints: [
      { faction: 0, x: -18, z: -14, facing: Math.PI * 0.25 },
      { faction: 1, x: 18, z: 14, facing: -Math.PI * 0.75 },
    ],
    resourceNodes: [
      { type: ResourceType.Rupees, x: -10, z: -6, amount: 1500 },
      { type: ResourceType.Rupees, x: 10, z: 6, amount: 1500 },
      { type: ResourceType.Rupees, x: 0, z: -12, amount: 800 },
      { type: ResourceType.Rupees, x: 0, z: 12, amount: 800 },
      { type: ResourceType.Rupees, x: -6, z: 8, amount: 600 },
      { type: ResourceType.Rupees, x: 6, z: -8, amount: 600 },
    ],
    features: [
      { kind: 'ridge', x: 0, z: 0, radius: 4, length: 14, axis: 'x', voxelOverride: VoxelType.Stone },
      { kind: 'softDirt', x: -4, z: 4, radius: 3 },
      { kind: 'softDirt', x: 4, z: -4, radius: 3 },
      { kind: 'bridge', x: 0, z: -8, radius: 1, length: 6, axis: 'z', voxelOverride: VoxelType.Wood },
      { kind: 'resourceRing', x: 0, z: 0, radius: 2 },
    ],
  },

  'death-mountain-pass': {
    id: 'death-mountain-pass',
    name: 'Death Mountain Pass',
    blurb: 'Narrow volcanic choke — Goron siege thrives, air paths punish turtles.',
    realm: 'Hyrule',
    biome: 'death-mountain',
    chunkRadius: 2,
    heightChunks: 2,
    players: 2,
    surfaceVoxel: VoxelType.Stone,
    accentVoxel: VoxelType.Dirt,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0x8a4030,
    spawnPoints: [
      { faction: 0, x: -20, z: 0, facing: 0 },
      { faction: 1, x: 20, z: 0, facing: Math.PI },
    ],
    resourceNodes: [
      { type: ResourceType.Rupees, x: -12, z: -4, amount: 1200 },
      { type: ResourceType.Rupees, x: 12, z: 4, amount: 1200 },
      { type: ResourceType.Rupees, x: 0, z: -10, amount: 900 },
      { type: ResourceType.Rupees, x: 0, z: 10, amount: 900 },
    ],
    features: [
      { kind: 'ridge', x: 0, z: 0, radius: 3, length: 20, axis: 'z', voxelOverride: VoxelType.Stone },
      { kind: 'ridge', x: -8, z: -6, radius: 2.5, voxelOverride: VoxelType.Stone },
      { kind: 'ridge', x: 8, z: 6, radius: 2.5, voxelOverride: VoxelType.Stone },
      { kind: 'softDirt', x: 0, z: -2, radius: 2 },
      { kind: 'creepSeed', x: 14, z: 0, radius: 2, voxelOverride: VoxelType.Malice },
    ],
  },

  'zora-riverlands': {
    id: 'zora-riverlands',
    name: 'Zora Riverlands',
    blurb: 'Braided water channels — freeze for bridges or drown trenches.',
    realm: 'Hyrule',
    biome: 'zora-river',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.Sand,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0x3a90c0,
    spawnPoints: [
      { faction: 0, x: -16, z: -16, facing: Math.PI * 0.25 },
      { faction: 1, x: 16, z: 16, facing: -Math.PI * 0.75 },
    ],
    resourceNodes: [
      { type: ResourceType.Rupees, x: -8, z: -10, amount: 1100 },
      { type: ResourceType.Rupees, x: 8, z: 10, amount: 1100 },
      { type: ResourceType.Rupees, x: -12, z: 4, amount: 700 },
      { type: ResourceType.Rupees, x: 12, z: -4, amount: 700 },
    ],
    features: [
      { kind: 'river', x: 0, z: 0, radius: 2, length: 28, axis: 'x', voxelOverride: VoxelType.Water },
      { kind: 'river', x: 4, z: 0, radius: 1.5, length: 22, axis: 'z', voxelOverride: VoxelType.Water },
      { kind: 'bridge', x: -6, z: 0, radius: 1, length: 5, axis: 'z', voxelOverride: VoxelType.Wood },
      { kind: 'bridge', x: 6, z: 0, radius: 1, length: 5, axis: 'z', voxelOverride: VoxelType.Wood },
      { kind: 'ridge', x: -10, z: 8, radius: 3, voxelOverride: VoxelType.Stone },
    ],
  },

  'mushroom-plains': {
    id: 'mushroom-plains',
    name: 'Mushroom Plains',
    blurb: 'Pipe-friendly grassland — bunker up and rotate through warp mouths.',
    realm: 'Mushroom',
    biome: 'mushroom-plains',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.MushroomBrick,
    allowsCreep: false,
    allowsPipes: true,
    minimapTint: 0xd05050,
    spawnPoints: [
      { faction: 2, x: -18, z: 0, facing: 0 },
      { faction: 3, x: 18, z: 0, facing: Math.PI },
    ],
    resourceNodes: [
      { type: ResourceType.Coins, x: -10, z: -6, amount: 1400 },
      { type: ResourceType.Coins, x: 10, z: 6, amount: 1400 },
      { type: ResourceType.Coins, x: 0, z: -10, amount: 900 },
      { type: ResourceType.Coins, x: 0, z: 10, amount: 900 },
      { type: ResourceType.Coins, x: -4, z: 0, amount: 500 },
      { type: ResourceType.Coins, x: 4, z: 0, amount: 500 },
    ],
    features: [
      { kind: 'pipeMouth', x: -8, z: -4, radius: 1.5, voxelOverride: VoxelType.MushroomBrick },
      { kind: 'pipeMouth', x: 8, z: 4, radius: 1.5, voxelOverride: VoxelType.MushroomBrick },
      { kind: 'pipeMouth', x: 0, z: 0, radius: 1.5, voxelOverride: VoxelType.MushroomBrick },
      { kind: 'castleWall', x: -14, z: 0, radius: 2, length: 8, axis: 'z', voxelOverride: VoxelType.MushroomBrick },
      { kind: 'softDirt', x: 0, z: 6, radius: 3 },
      { kind: 'bridge', x: 0, z: -6, radius: 1, length: 8, axis: 'x', voxelOverride: VoxelType.Wood },
    ],
  },

  'bowser-courtyard': {
    id: 'bowser-courtyard',
    name: "Bowser's Courtyard",
    blurb: 'Lava moat + thick walls — armored siege and shell ricochets.',
    realm: 'Mushroom',
    biome: 'koopa-lava',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.Stone,
    accentVoxel: VoxelType.MushroomBrick,
    allowsCreep: false,
    allowsPipes: true,
    minimapTint: 0xc06010,
    spawnPoints: [
      { faction: 2, x: -16, z: -12, facing: Math.PI * 0.3 },
      { faction: 3, x: 16, z: 12, facing: -Math.PI * 0.7 },
    ],
    resourceNodes: [
      { type: ResourceType.Coins, x: -8, z: -4, amount: 1300 },
      { type: ResourceType.Coins, x: 8, z: 4, amount: 1300 },
      { type: ResourceType.Coins, x: 0, z: 0, amount: 1000 },
    ],
    features: [
      { kind: 'river', x: 0, z: 0, radius: 3, length: 24, axis: 'x', voxelOverride: VoxelType.Water },
      { kind: 'castleWall', x: 12, z: 8, radius: 2, length: 10, axis: 'x', voxelOverride: VoxelType.MushroomBrick },
      { kind: 'castleWall', x: -12, z: -8, radius: 2, length: 10, axis: 'x', voxelOverride: VoxelType.MushroomBrick },
      { kind: 'bridge', x: 0, z: 0, radius: 1.2, length: 8, axis: 'z', voxelOverride: VoxelType.Wood },
      { kind: 'ridge', x: 6, z: -8, radius: 2.5, voxelOverride: VoxelType.Stone },
    ],
  },

  'dream-meadows': {
    id: 'dream-meadows',
    name: 'Dream Land Meadows',
    blurb: 'Soft hills + star bit pockets — elite Star Guard vs parasitic swarm.',
    realm: 'Popstar',
    biome: 'dream-meadow',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.DreamBlock,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0xf0a0c0,
    spawnPoints: [
      { faction: 4, x: -17, z: -10, facing: Math.PI * 0.2 },
      { faction: 5, x: 17, z: 10, facing: -Math.PI * 0.8 },
    ],
    resourceNodes: [
      { type: ResourceType.StarBits, x: -9, z: -5, amount: 1200 },
      { type: ResourceType.StarBits, x: 9, z: 5, amount: 1200 },
      { type: ResourceType.StarBits, x: 0, z: -11, amount: 800 },
      { type: ResourceType.StarBits, x: 0, z: 11, amount: 800 },
      { type: ResourceType.StarBits, x: -5, z: 7, amount: 500 },
      { type: ResourceType.StarBits, x: 5, z: -7, amount: 500 },
    ],
    features: [
      { kind: 'ridge', x: 0, z: 0, radius: 3.5, voxelOverride: VoxelType.DreamBlock },
      { kind: 'creepSeed', x: 12, z: 6, radius: 2.5, voxelOverride: VoxelType.Void },
      { kind: 'resourceRing', x: 0, z: 0, radius: 2.5 },
      { kind: 'softDirt', x: -6, z: 4, radius: 2.5 },
    ],
  },

  'void-star-arena': {
    id: 'void-star-arena',
    name: 'Void Star Arena',
    blurb: 'Circular void rim — shields drain on dark tiles, Copy-Essence shines.',
    realm: 'Popstar',
    biome: 'void-star',
    chunkRadius: 2,
    heightChunks: 1,
    players: 2,
    surfaceVoxel: VoxelType.DreamBlock,
    accentVoxel: VoxelType.Void,
    allowsCreep: true,
    allowsPipes: false,
    minimapTint: 0x502080,
    spawnPoints: [
      { faction: 4, x: -15, z: 0, facing: 0 },
      { faction: 5, x: 15, z: 0, facing: Math.PI },
    ],
    resourceNodes: [
      { type: ResourceType.StarBits, x: 0, z: -10, amount: 1000 },
      { type: ResourceType.StarBits, x: 0, z: 10, amount: 1000 },
      { type: ResourceType.StarBits, x: -8, z: -6, amount: 700 },
      { type: ResourceType.StarBits, x: 8, z: 6, amount: 700 },
    ],
    features: [
      { kind: 'creepSeed', x: 0, z: 0, radius: 5, voxelOverride: VoxelType.Void },
      { kind: 'ridge', x: -10, z: 8, radius: 2, voxelOverride: VoxelType.DreamBlock },
      { kind: 'ridge', x: 10, z: -8, radius: 2, voxelOverride: VoxelType.DreamBlock },
      { kind: 'resourceRing', x: 0, z: 0, radius: 3 },
    ],
  },

  'cross-realm-clash': {
    id: 'cross-realm-clash',
    name: 'Cross-Realm Clash',
    blurb: '4-player free-for-all stitching all three realms into one diorama.',
    realm: 'Neutral',
    biome: 'hyrule-field',
    chunkRadius: 3,
    heightChunks: 1,
    players: 4,
    surfaceVoxel: VoxelType.Grass,
    accentVoxel: VoxelType.CastleStone,
    allowsCreep: true,
    allowsPipes: true,
    minimapTint: 0x708090,
    spawnPoints: [
      { faction: 0, x: -22, z: -22, facing: Math.PI * 0.25 },
      { faction: 1, x: 22, z: -22, facing: Math.PI * 0.75 },
      { faction: 2, x: -22, z: 22, facing: -Math.PI * 0.25 },
      { faction: 3, x: 22, z: 22, facing: -Math.PI * 0.75 },
    ],
    resourceNodes: [
      { type: ResourceType.Rupees, x: -12, z: -12, amount: 1000 },
      { type: ResourceType.Rupees, x: 12, z: -12, amount: 1000 },
      { type: ResourceType.Coins, x: -12, z: 12, amount: 1000 },
      { type: ResourceType.Coins, x: 12, z: 12, amount: 1000 },
      { type: ResourceType.StarBits, x: 0, z: 0, amount: 1500 },
      { type: ResourceType.Rupees, x: 0, z: -16, amount: 600 },
      { type: ResourceType.Coins, x: 0, z: 16, amount: 600 },
    ],
    features: [
      { kind: 'ridge', x: 0, z: 0, radius: 4, voxelOverride: VoxelType.Stone },
      { kind: 'river', x: 0, z: -8, radius: 1.5, length: 30, axis: 'x', voxelOverride: VoxelType.Water },
      { kind: 'pipeMouth', x: -10, z: 10, radius: 1.5, voxelOverride: VoxelType.MushroomBrick },
      { kind: 'pipeMouth', x: 10, z: -10, radius: 1.5, voxelOverride: VoxelType.MushroomBrick },
      { kind: 'creepSeed', x: 14, z: 14, radius: 3, voxelOverride: VoxelType.Malice },
      { kind: 'creepSeed', x: -14, z: -14, radius: 2, voxelOverride: VoxelType.Void },
      { kind: 'castleWall', x: -18, z: -18, radius: 2, length: 6, axis: 'x', voxelOverride: VoxelType.CastleStone },
    ],
  },
};

export const DEFAULT_MAP_ID = 'triforce-clash';

export function getMap(id: string): MapDef {
  return MAP_DB[id] ?? MAP_DB[DEFAULT_MAP_ID];
}

export function listMaps(): MapDef[] {
  return Object.values(MAP_DB);
}

export function mapsForRealm(realm: MapDef['realm']): MapDef[] {
  return listMaps().filter((m) => m.realm === realm || m.realm === 'Neutral');
}
