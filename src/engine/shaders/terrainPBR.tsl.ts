/**
 * Terrain PBR configuration for the Diorama Engine.
 * Defines material properties per voxel type for the stepped micro-voxel terrain.
 * When Three.js TSL node materials are used, these params feed the node graph.
 */

export interface TerrainMaterialParams {
  color: [number, number, number];
  roughness: number;
  metalness: number;
  emissive: [number, number, number];
  emissiveIntensity: number;
}

export const TERRAIN_MATERIALS: Record<string, TerrainMaterialParams> = {
  grass: {
    color: [0.28, 0.63, 0.21],
    roughness: 0.88,
    metalness: 0.0,
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  stone: {
    color: [0.55, 0.54, 0.52],
    roughness: 0.92,
    metalness: 0.02,
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  dirt: {
    color: [0.45, 0.32, 0.18],
    roughness: 0.95,
    metalness: 0.0,
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  water: {
    color: [0.15, 0.45, 0.75],
    roughness: 0.05,
    metalness: 0.0,
    emissive: [0.02, 0.06, 0.12],
    emissiveIntensity: 0.3,
  },
  wood: {
    color: [0.55, 0.35, 0.15],
    roughness: 0.8,
    metalness: 0.0,
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  sand: {
    color: [0.82, 0.75, 0.52],
    roughness: 0.95,
    metalness: 0.0,
    emissive: [0.02, 0.02, 0.01],
    emissiveIntensity: 0.05,
  },
  snow: {
    color: [0.92, 0.93, 0.96],
    roughness: 0.6,
    metalness: 0.0,
    emissive: [0.05, 0.05, 0.08],
    emissiveIntensity: 0.1,
  },
  castleStone: {
    color: [0.65, 0.62, 0.58],
    roughness: 0.85,
    metalness: 0.05,
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  mushroomBrick: {
    color: [0.85, 0.25, 0.18],
    roughness: 0.7,
    metalness: 0.0,
    emissive: [0.05, 0.01, 0.0],
    emissiveIntensity: 0.05,
  },
  dreamBlock: {
    color: [0.75, 0.55, 0.90],
    roughness: 0.5,
    metalness: 0.1,
    emissive: [0.1, 0.05, 0.15],
    emissiveIntensity: 0.2,
  },
  malice: {
    color: [0.60, 0.05, 0.15],
    roughness: 0.4,
    metalness: 0.2,
    emissive: [0.4, 0.02, 0.08],
    emissiveIntensity: 0.8,
  },
  void: {
    color: [0.12, 0.02, 0.22],
    roughness: 0.3,
    metalness: 0.4,
    emissive: [0.08, 0.0, 0.15],
    emissiveIntensity: 1.0,
  },
};
