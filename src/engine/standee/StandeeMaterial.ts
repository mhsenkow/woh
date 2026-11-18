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
): THREE.MeshPhysicalMaterial {
  const cfg = { ...DEFAULT_MAT_CONFIG, ...config };

  if (cfg.map) {
    cfg.map.magFilter = THREE.NearestFilter;
    cfg.map.minFilter = THREE.NearestFilter;
    cfg.map.generateMipmaps = false;
    cfg.map.needsUpdate = true;
  }

  const mat = new THREE.MeshPhysicalMaterial({
    color: cfg.map ? 0xffffff : cfg.baseColor,
    map: cfg.map ?? null,
    roughness: cfg.isElite ? 0.35 : 0.7,
    metalness: cfg.isElite ? 0.25 : 0.0,
    clearcoat: cfg.isElite ? 0.55 : 0.15,
    clearcoatRoughness: cfg.isElite ? 0.2 : 0.4,
    side: THREE.DoubleSide,
    transparent: true,
    alphaTest: 0.15,
    depthWrite: true,
    sheen: cfg.isElite ? 0.8 : 0.15,
    sheenColor: cfg.isElite ? new THREE.Color(0xffe8a0) : new THREE.Color(0xfff5e0),
    sheenRoughness: 0.35,
  });

  if (cfg.damageLevel > 0) {
    mat.roughness = Math.min(1.0, mat.roughness + cfg.damageLevel * 0.15);
  }

  return mat;
}

export const FACTION_COLORS = {
  hyruleRoyalGuard: 0x2266bb,
  ganonMaliceHorde: 0x991122,
  toadstoolCollective: 0xcc3333,
  koopaTroop: 0x44aa22,
  dreamLandStarGuard: 0xffaa22,
  nightmareDarkMatter: 0x6611aa,
} as const;
