import * as THREE from 'three';

export interface StandeeMaterialConfig {
  baseColor: THREE.ColorRepresentation;
  factionColor: THREE.ColorRepresentation;
  isElite: boolean;
  damageLevel: number;
  map?: THREE.Texture | null;
}

const DEFAULT_MAT_CONFIG: StandeeMaterialConfig = {
  baseColor: 0xffffff,
  factionColor: 0x2266bb,
  isElite: false,
  damageLevel: 0,
  map: null,
};

export function createStandeeMaterial(
  config: Partial<StandeeMaterialConfig> = {},
): THREE.Material {
  const cfg = { ...DEFAULT_MAT_CONFIG, ...config };

  if (cfg.map) {
    cfg.map.magFilter = THREE.NearestFilter;
    cfg.map.minFilter = THREE.NearestFilter;
    cfg.map.generateMipmaps = false;
    cfg.map.needsUpdate = true;
    cfg.map.colorSpace = THREE.SRGBColorSpace;
  }

  // Unlit nearest-neighbor so the SNES pixels stay the authored cutout,
  // sitting on the stippled landscape instead of being relit like a mesh.
  if (cfg.map) {
    return new THREE.MeshBasicMaterial({
      map: cfg.map,
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: true,
    });
  }

  return new THREE.MeshLambertMaterial({
    color: cfg.baseColor,
    side: THREE.DoubleSide,
  });
}

export const FACTION_COLORS = {
  hyruleRoyalGuard: 0x2266bb,
  ganonMaliceHorde: 0x991122,
  toadstoolCollective: 0xcc3333,
  koopaTroop: 0x44aa22,
  dreamLandStarGuard: 0xffaa22,
  nightmareDarkMatter: 0x6611aa,
} as const;
