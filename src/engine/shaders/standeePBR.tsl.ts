/**
 * Standee PBR material layers for the 2.5D cutout entities.
 * Defines the material stack: cardstock base, holographic foil, embossed gold leaf.
 */

export interface StandeePBRLayer {
  name: string;
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  sheen: number;
  sheenColor: [number, number, number];
  emissive: [number, number, number];
  emissiveIntensity: number;
}

export const STANDEE_LAYERS: Record<string, StandeePBRLayer> = {
  cardstock: {
    name: 'Matte Cardstock',
    roughness: 0.78,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    sheen: 0.0,
    sheenColor: [0, 0, 0],
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
  holoFoil: {
    name: 'Holographic Foil',
    roughness: 0.15,
    metalness: 0.6,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
    sheen: 1.0,
    sheenColor: [0.6, 0.8, 1.0],
    emissive: [0.1, 0.15, 0.2],
    emissiveIntensity: 0.4,
  },
  goldLeaf: {
    name: 'Embossed Gold Leaf',
    roughness: 0.25,
    metalness: 0.85,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2,
    sheen: 0.6,
    sheenColor: [1.0, 0.85, 0.4],
    emissive: [0.15, 0.1, 0.02],
    emissiveIntensity: 0.2,
  },
  damaged: {
    name: 'Battle-Worn',
    roughness: 0.92,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    sheen: 0.0,
    sheenColor: [0, 0, 0],
    emissive: [0, 0, 0],
    emissiveIntensity: 0,
  },
};
