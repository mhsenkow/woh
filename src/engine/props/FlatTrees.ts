import * as THREE from 'three';
import { PixelCanvas, RAMPS, type Hex, type ShadeRamp } from '../art/PixelKit';
import type { BiomeId } from '../../game/maps/MapDefinitions';
import { valueNoise } from '../math/valueNoise';

export type FloraTheme =
  | 'hyrule'
  | 'malice'
  | 'mushroom'
  | 'koopa'
  | 'dream'
  | 'void'
  | 'mixed';

interface FloraSpec {
  make: () => THREE.CanvasTexture;
  /** Relative height scale (applied on top of random variance). */
  hScale: number;
  /** Width / height ratio — Mario trees are squat, pines are tall. */
  aspect: number;
}

/**
 * Realm flora cutouts — classic Nintendo silhouettes as cardboard props.
 * Hyrule → ALTTP / OoT Field & Deku · Mushroom → SMB lollipop trees & shrooms
 * Popstar → soft Kirby cotton · Chaos → Malice / Bowser / Void corruption
 */
export class FlatTrees {
  readonly group = new THREE.Group();
  private readonly texCache = new Map<() => THREE.CanvasTexture, THREE.Texture>();
  private readonly matCache = new Map<THREE.Texture, THREE.Material>();
  private readonly theme: FloraTheme;

  constructor(count = 52, spread = 24, theme: FloraTheme = 'mixed') {
    this.theme = theme;
    const makers = floraForTheme(theme);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * spread;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.abs(x) < 5.5 && Math.abs(z) < 5.5) continue;

      let spec: FloraSpec;
      if (theme === 'mixed') {
        const sectorMakers = floraForTheme(sectorTheme(x, z));
        spec = sectorMakers[i % sectorMakers.length]!;
      } else {
        spec = makers[i % makers.length]!;
      }

      const h = (1.7 + Math.random() * 2.2) * spec.hScale;
      this.addPlant(spec, x, z, h);
    }
  }

  /**
   * Groves follow a domain-warped noise field: tall stands where the field
   * is high, bushes on the contour, open meadow where it is low.
   * Reeds clump on the sand instead of ringing the island.
   */
  plantGroves(opts: {
    isGrass: (x: number, z: number) => boolean;
    isShore: (x: number, z: number) => boolean;
    height: (x: number, z: number) => number;
  }): void {
    const { isGrass, isShore, height } = opts;
    const reach = 27;
    const step = 1.7;

    for (let gz = -reach; gz <= reach; gz += step) {
      for (let gx = -reach; gx <= reach; gx += step) {
        const x = gx + (valueNoise(gx * 1.3, gz * 1.3) - 0.5) * step;
        const z = gz + (valueNoise(gx * 1.3 + 5.1, gz * 1.3 + 2.4) - 0.5) * step;
        if (Math.hypot(x + 18, z + 16) < 5.2) continue;
        if (Math.hypot(x, z) < 3.2) continue;
        if (!isGrass(x, z)) continue;

        const woods = groveField(x, z);
        const theme = this.theme === 'mixed' ? sectorTheme(x, z) : this.theme;
        const specs = floraForTheme(theme);
        const trees = specs.filter((s) => s.hScale >= 0.95);
        const bushes = specs.filter((s) => s.hScale < 0.95);
        const treeSpecs = trees.length > 0 ? trees : specs;
        const bushSpecs = bushes.length > 0 ? bushes : specs;
        const stand = Math.floor(
          valueNoise(Math.floor(x / 3.4) * 0.31, Math.floor(z / 3.4) * 0.31) * 17,
        );

        if (woods > 0.58) {
          const spec = treeSpecs[stand % treeSpecs.length]!;
          const heart = Math.min(1, (woods - 0.58) / 0.22);
          const flutter = valueNoise(x * 1.7, z * 1.7);
          const h = (1.15 + heart * 1.35 + flutter * 0.35) * spec.hScale;
          this.addPlant(spec, x, z, h, height(x, z));
        } else if (woods > 0.51) {
          const spec = bushSpecs[stand % bushSpecs.length]!;
          const h = (0.5 + valueNoise(x * 2.2, z * 2.2) * 0.35) * Math.max(0.8, spec.hScale);
          this.addPlant(spec, x, z, h, height(x, z));
        } else if (valueNoise(x * 0.41 + 9, z * 0.41) > 0.955) {
          const spec = treeSpecs[stand % treeSpecs.length]!;
          this.addPlant(spec, x, z, 1.7 * spec.hScale, height(x, z));
        }
      }
    }

    const reedStep = 1.15;
    for (let gz = -reach; gz <= reach; gz += reedStep) {
      for (let gx = -reach; gx <= reach; gx += reedStep) {
        if (Math.hypot(gx, gz) < 16) continue;
        const x = gx + (valueNoise(gx * 0.8 + 2, gz * 0.8) - 0.5) * 0.7;
        const z = gz + (valueNoise(gx * 0.8, gz * 0.8 + 6) - 0.5) * 0.7;
        if (!isShore(x, z)) continue;
        if (valueNoise(x * 0.62, z * 0.62) < 0.74) continue;
        const theme = this.theme === 'mixed' ? sectorTheme(x, z) : this.theme;
        const specs = floraForTheme(theme);
        const bushes = specs.filter((s) => s.hScale < 0.95);
        const pool = bushes.length > 0 ? bushes : specs;
        const spec = pool[Math.floor(valueNoise(x * 3, z * 3) * pool.length) % pool.length]!;
        const h = 0.65 + valueNoise(x * 4.1, z * 4.1) * 0.4;
        this.addPlant(spec, x, z, h, height(x, z));
      }
    }
  }

  private addPlant(spec: FloraSpec, x: number, z: number, h: number, groundY?: number): void {
    let tex = this.texCache.get(spec.make);
    if (!tex) {
      tex = spec.make();
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      this.texCache.set(spec.make, tex);
    }
    let mat = this.matCache.get(tex);
    if (!mat) {
      mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      });
      this.matCache.set(tex, mat);
    }
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(h * spec.aspect, h), mat);
    const y = groundY ?? 0;
    mesh.position.set(x, y + h / 2, z);
    mesh.rotation.y = Math.PI / 4;
    mesh.castShadow = true;
    mesh.userData.treeHeight = h;
    this.group.add(mesh);
  }

  faceCamera(yaw: number): void {
    for (const child of this.group.children) {
      if (child instanceof THREE.Mesh) child.rotation.y = yaw;
    }
  }

  seatOnTerrain(getHeight: (x: number, z: number) => number): void {
    for (const child of this.group.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      const y = getHeight(child.position.x, child.position.z);
      const h = (child.userData.treeHeight as number) ?? 2;
      child.position.y = y + h / 2;
    }
  }
}

export function floraThemeFromBiome(biome: BiomeId): FloraTheme {
  switch (biome) {
    case 'hyrule-field':
    case 'zora-river':
    case 'death-mountain':
      return 'hyrule';
    case 'mushroom-plains':
      return 'mushroom';
    case 'koopa-lava':
      return 'koopa';
    case 'dream-meadow':
      return 'dream';
    case 'void-star':
      return 'void';
    default:
      return 'mixed';
  }
}

/** Domain-warped density. High values are grove hearts, low values are meadow. */
function groveField(x: number, z: number): number {
  const ox = x + (valueNoise(x * 0.09, z * 0.09) - 0.5) * 7;
  const oz = z + (valueNoise(x * 0.09 + 8, z * 0.09 + 3) - 0.5) * 7;
  const broad = valueNoise(ox * 0.23, oz * 0.23);
  const fine = valueNoise(ox * 0.47 + 2.2, oz * 0.47);
  const slow = valueNoise(x * 0.08 + 1, z * 0.08);
  return broad * 0.55 + fine * 0.3 + slow * 0.15;
}

function sectorTheme(x: number, z: number): FloraTheme {
  if (x < 0 && z < 0) return 'hyrule';
  if (x >= 0 && z >= 0) return 'malice';
  if (x < 0 && z >= 0) return 'dream';
  return 'mushroom';
}

function floraForTheme(theme: FloraTheme): FloraSpec[] {
  switch (theme) {
    case 'hyrule':
      return [
        { make: makeDekuTree, hScale: 1.35, aspect: 0.72 },
        { make: makeHyruleOak, hScale: 1.15, aspect: 0.72 },
        { make: makeHyruleOak, hScale: 1.05, aspect: 0.68 },
        { make: makeLonLonTree, hScale: 1.1, aspect: 0.55 },
        { make: makeDeathPine, hScale: 1.3, aspect: 0.48 },
        { make: makeAlttpBush, hScale: 0.7, aspect: 1.0 },
        { make: makeKorokBush, hScale: 0.72, aspect: 0.95 },
      ];
    case 'malice':
      return [
        { make: makeGloomTree, hScale: 1.15, aspect: 0.62 },
        { make: makeDeadMalice, hScale: 1.2, aspect: 0.55 },
        { make: makeSkullBush, hScale: 0.7, aspect: 0.95 },
        { make: makeWitheredDeku, hScale: 1.2, aspect: 0.68 },
        { make: makeGloomRoot, hScale: 0.85, aspect: 0.8 },
      ];
    case 'mushroom':
      return [
        { make: makeMarioTree, hScale: 1.1, aspect: 0.88 },
        { make: makeMarioTree, hScale: 1.0, aspect: 0.82 },
        { make: makeMarioTreeTall, hScale: 1.25, aspect: 0.7 },
        { make: makeSuperShroom, hScale: 1.0, aspect: 0.8 },
        { make: makeOneUpShroom, hScale: 0.95, aspect: 0.8 },
        { make: makeFireFlower, hScale: 0.8, aspect: 0.72 },
        { make: makePipeSprout, hScale: 1.0, aspect: 0.75 },
        { make: makeBeanstalk, hScale: 1.4, aspect: 0.42 },
      ];
    case 'koopa':
      return [
        { make: makeThornTree, hScale: 1.1, aspect: 0.65 },
        { make: makeLavaPalm, hScale: 1.15, aspect: 0.7 },
        { make: makeBurntMarioTree, hScale: 1.0, aspect: 0.8 },
        { make: makeSpikedBush, hScale: 0.7, aspect: 0.95 },
        { make: makeDryBonesTree, hScale: 1.15, aspect: 0.5 },
      ];
    case 'dream':
      return [
        { make: makeCottonTree, hScale: 1.15, aspect: 0.88 },
        { make: makeCottonTree, hScale: 1.05, aspect: 0.82 },
        { make: makeCandyTree, hScale: 1.1, aspect: 0.82 },
        { make: makeStarBush, hScale: 0.85, aspect: 0.9 },
        { make: makeCloudShrub, hScale: 0.75, aspect: 1.1 },
        { make: makePopFlower, hScale: 0.8, aspect: 0.75 },
        { make: makeMaximTomatoPlant, hScale: 0.85, aspect: 0.72 },
      ];
    case 'void':
      return [
        { make: makeVoidSpire, hScale: 1.25, aspect: 0.45 },
        { make: makeDarkMatterBush, hScale: 0.75, aspect: 0.95 },
        { make: makeWitheredDeku, hScale: 1.1, aspect: 0.65 },
        { make: makeVoidTendril, hScale: 1.15, aspect: 0.5 },
      ];
    case 'mixed':
    default:
      return [
        { make: makeHyruleOak, hScale: 1.1, aspect: 0.7 },
        { make: makeMarioTree, hScale: 1.05, aspect: 0.85 },
        { make: makeCottonTree, hScale: 1.1, aspect: 0.85 },
        { make: makeDekuTree, hScale: 1.3, aspect: 0.72 },
        { make: makeSuperShroom, hScale: 0.95, aspect: 0.78 },
      ];
  }
}

// ─── Canvas helpers ─────────────────────────────────────────────────────────

const FW = 64;
const FH = 80;

function canvas(): PixelCanvas {
  const px = new PixelCanvas(FW, FH);
  px.clear();
  return px;
}

function finish(px: PixelCanvas, _border = '#1a120c'): THREE.CanvasTexture {
  // Ink outline, not a white sticker rim — trees belong to the pixel ground.
  // Characters keep the light die-cut in StandeeArtFactory.
  px.dieCut('#1a120c');
  return px.toTexture(6);
}

function trunk(
  px: PixelCanvas,
  x: number, y0: number, y1: number,
  w = 6,
  ramp: ShadeRamp = RAMPS.wood,
  rings = true,
): void {
  px.rect(x, y0, w, y1 - y0, ramp.mid);
  px.rect(x, y0, Math.max(1, Math.floor(w * 0.3)), y1 - y0, ramp.dark);
  px.rect(x + w - 1, y0, 1, y1 - y0, ramp.light);
  px.rect(x, y0, w, 1, ramp.outline);
  px.rect(x, y1 - 1, w, 1, ramp.outline);
  px.rect(x, y0, 1, y1 - y0, ramp.outline);
  px.rect(x + w - 1, y0, 1, y1 - y0, ramp.outline);
  if (rings) {
    for (let y = y0 + 4; y < y1 - 2; y += 5) {
      px.rect(x + 1, y, w - 2, 1, ramp.dark);
    }
  }
  px.grit(x, y0, w, y1 - y0, ramp.outline, 0.1);
}

/** Soft shaded leaf mound with ink rim. */
function leafBlob(
  px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp,
): void {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r) continue;
      const edge = i * i + j * j > (r - 1.2) * (r - 1.2);
      const dither = ((i * 3 + j * 5) & 1) === 0;
      let hex: Hex = ramp.mid;
      if (edge) hex = ramp.outline;
      else if (i + j < -r * 0.25) hex = ramp.dark;
      else if (i + j > r * 0.35) hex = dither ? ramp.light : ramp.hilite;
      px.set(cx + i, cy + j, hex);
    }
  }
}

/** Classic SMB canopy: near-perfect circle with scalloped underside. */
function smbCanopy(
  px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp,
): void {
  // Main globe
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r) continue;
      const edge = i * i + j * j > (r - 1.4) * (r - 1.4);
      let hex: Hex = ramp.mid;
      if (edge) hex = ramp.outline;
      else if (i < -r * 0.25) hex = ramp.dark;
      else if (i > r * 0.3 && j < 0) hex = ramp.hilite;
      else if (j < -r * 0.35) hex = ramp.light;
      px.set(cx + i, cy + j, hex);
    }
  }
  // Scalloped bottom lobes (SMB trademark)
  for (let k = -3; k <= 3; k++) {
    const lx = cx + k * Math.floor(r * 0.28);
    const ly = cy + Math.floor(r * 0.72);
    const lr = Math.max(3, Math.floor(r * 0.28));
    for (let j = -lr; j <= lr; j++) {
      for (let i = -lr; i <= lr; i++) {
        if (i * i + j * j > lr * lr) continue;
        const edge = i * i + j * j > (lr - 1) * (lr - 1);
        px.set(lx + i, ly + j, edge ? ramp.outline : (i < 0 ? ramp.dark : ramp.mid));
      }
    }
  }
  // Specular highlight patch
  px.circle(cx - Math.floor(r * 0.3), cy - Math.floor(r * 0.35), Math.max(2, Math.floor(r * 0.18)), ramp.hilite);
}

function pineWedges(px: PixelCanvas, leaf: ShadeRamp, cx = 32): void {
  for (const [y, half] of [
    [62, 18], [50, 16], [38, 13], [28, 10], [18, 7], [10, 4],
  ] as const) {
    for (let j = 0; j < half; j++) {
      const w = half - Math.floor(j * 0.72);
      for (let i = -w; i <= w; i++) {
        const edge = Math.abs(i) === w || j === 0;
        let hex: Hex = leaf.mid;
        if (edge) hex = leaf.outline;
        else if (i < -2) hex = leaf.dark;
        else if (i > 3) hex = ((i + j) & 1) === 0 ? leaf.light : leaf.hilite;
        else if (j < 2) hex = leaf.light;
        px.set(cx + i, y - j, hex);
      }
    }
  }
}

function paintStar(
  px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp,
): void {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const ang = Math.atan2(j, i);
      const dist = Math.hypot(i, j);
      const point = (Math.cos(ang * 5) + 1) * 0.5;
      const maxR = r * (0.4 + point * 0.6);
      if (dist <= maxR) {
        const edge = dist > maxR - 1.1;
        px.set(
          cx + i, cy + j,
          edge ? ramp.outline : dist < r * 0.28 ? ramp.hilite : i + j < 0 ? ramp.light : ramp.mid,
        );
      }
    }
  }
}

// ─── Hyrule (ALTTP / OoT / BOTW Field) ──────────────────────────────────────

function makeDekuTree(): THREE.CanvasTexture {
  const px = canvas();
  // Massive bark trunk
  trunk(px, 24, 42, 76, 16, RAMPS.wood, true);
  // Face hollow — classic Great Deku Tree
  px.ellipseFill(32, 56, 8, 10, '#1a1008');
  px.ellipseFill(32, 55, 6, 8, '#2a1810');
  // Eyes
  px.circle(28, 52, 2, RAMPS.gold.mid);
  px.circle(36, 52, 2, RAMPS.gold.mid);
  px.set(28, 51, RAMPS.gold.hilite);
  px.set(36, 51, RAMPS.gold.hilite);
  // Nose ridge + mouth
  px.rect(31, 56, 3, 4, RAMPS.wood.light);
  px.ellipseFill(32, 62, 4, 2, '#100808');
  // Mossy layered canopy
  leafBlob(px, 32, 28, 18, RAMPS.deku);
  leafBlob(px, 18, 34, 11, RAMPS.deku);
  leafBlob(px, 46, 32, 12, RAMPS.leaf);
  leafBlob(px, 32, 16, 11, RAMPS.deku);
  leafBlob(px, 24, 22, 8, RAMPS.leaf);
  // Glow tips
  px.set(22, 14, RAMPS.deku.hilite);
  px.set(40, 12, RAMPS.deku.hilite);
  px.set(32, 8, '#c8ffe0');
  return finish(px, '#e8fff4');
}

function makeHyruleOak(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 28, 48, 76, 8);
  // ALTTP-style irregular bushy canopy (not a perfect circle)
  leafBlob(px, 32, 32, 16, RAMPS.leaf);
  leafBlob(px, 20, 38, 11, RAMPS.leaf);
  leafBlob(px, 44, 36, 12, RAMPS.leaf);
  leafBlob(px, 32, 20, 10, RAMPS.leaf);
  leafBlob(px, 26, 28, 8, RAMPS.leafDark);
  leafBlob(px, 38, 26, 7, RAMPS.leaf);
  // Tiny fruit accents
  px.circle(22, 30, 2, RAMPS.shroomRed.mid);
  px.circle(42, 24, 2, RAMPS.shroomRed.light);
  return finish(px);
}

function makeLonLonTree(): THREE.CanvasTexture {
  const px = canvas();
  // Slim ranch windbreak — taller, narrower
  trunk(px, 30, 40, 76, 4);
  leafBlob(px, 32, 26, 12, RAMPS.leaf);
  leafBlob(px, 24, 32, 8, RAMPS.leaf);
  leafBlob(px, 40, 30, 8, RAMPS.leaf);
  leafBlob(px, 32, 16, 7, RAMPS.leaf);
  return finish(px);
}

function makeKorokBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 14, RAMPS.leaf);
  leafBlob(px, 22, 60, 9, RAMPS.leafDark);
  leafBlob(px, 42, 58, 10, RAMPS.leaf);
  leafBlob(px, 32, 48, 8, RAMPS.leaf);
  // Korok seed sparkle
  px.circle(32, 50, 4, RAMPS.wood.mid);
  px.circle(32, 48, 2, RAMPS.gold.hilite);
  px.set(30, 46, '#ffffff');
  px.set(34, 46, '#ffffff');
  px.set(32, 44, RAMPS.gold.light);
  return finish(px, '#f0ffe0');
}

function makeAlttpBush(): THREE.CanvasTexture {
  const px = canvas();
  // Classic ALTTP overworld bush — dense round green with flower
  leafBlob(px, 32, 54, 16, RAMPS.leaf);
  leafBlob(px, 22, 58, 9, RAMPS.leafDark);
  leafBlob(px, 42, 56, 10, RAMPS.leaf);
  // Pink flower on top
  for (let a = 0; a < 5; a++) {
    const ang = (a / 5) * Math.PI * 2 - 0.3;
    px.circle(32 + Math.round(Math.cos(ang) * 5), 42 + Math.round(Math.sin(ang) * 4), 3, RAMPS.pink.mid);
  }
  px.circle(32, 42, 2, RAMPS.gold.hilite);
  return finish(px, '#e8ffe0');
}

function makeDeathPine(): THREE.CanvasTexture {
  const px = canvas();
  const bark: ShadeRamp = {
    outline: '#201010', dark: '#403028', mid: '#584838', light: '#786858', hilite: '#988878',
  };
  trunk(px, 28, 52, 76, 8, bark);
  pineWedges(px, RAMPS.leafDark);
  px.grit(14, 8, 36, 50, '#a09080', 0.07);
  return finish(px, '#e8e0d0');
}

// ─── Malice / Gloom ─────────────────────────────────────────────────────────

function makeGloomTree(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 28; y < 76; y++) {
    const wobble = Math.round(Math.sin(y * 0.32) * 2.5);
    const tw = 5;
    for (let i = 0; i < tw; i++) {
      px.set(30 + wobble + i, y, i === 0 ? RAMPS.darkArmor.mid : i === tw - 1 ? RAMPS.wood.mid : RAMPS.wood.dark);
    }
    if (y % 4 === 0) px.set(32 + wobble, y, RAMPS.redMalice.mid);
  }
  leafBlob(px, 32, 28, 13, RAMPS.darkArmor);
  leafBlob(px, 20, 34, 9, RAMPS.redMalice);
  leafBlob(px, 44, 30, 10, RAMPS.darkArmor);
  leafBlob(px, 32, 16, 8, RAMPS.darkArmor);
  // Gloom drips
  for (let i = 0; i < 10; i++) {
    px.set(20 + i * 2, 40 + (i % 4), RAMPS.redMalice.light);
    px.set(20 + i * 2, 41 + (i % 4), RAMPS.redMalice.mid);
  }
  return finish(px, '#f0d0d0');
}

function makeDeadMalice(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 24; y < 76; y++) {
    const wobble = Math.round(Math.sin(y * 0.38) * 2);
    px.set(32 + wobble, y, RAMPS.wood.mid);
    px.set(31 + wobble, y, RAMPS.wood.dark);
    px.set(33 + wobble, y, RAMPS.wood.light);
  }
  // Twisted bare branches
  for (let i = 0; i < 16; i++) {
    px.set(32 - i, 32 - Math.floor(i * 0.55), RAMPS.wood.mid);
    px.set(31 - i, 32 - Math.floor(i * 0.55), RAMPS.wood.dark);
    px.set(32 + i, 36 - Math.floor(i * 0.5), RAMPS.wood.dark);
    px.set(33 + i, 36 - Math.floor(i * 0.5), RAMPS.wood.mid);
    if (i % 3 === 0) px.set(32 - i, 31 - Math.floor(i * 0.55), RAMPS.redMalice.mid);
  }
  // Upper fork
  for (let i = 0; i < 10; i++) {
    px.set(32 - Math.floor(i * 0.4), 28 - i, RAMPS.wood.mid);
    px.set(32 + Math.floor(i * 0.5), 26 - i, RAMPS.wood.dark);
  }
  return finish(px, '#f0e0e0');
}

function makeSkullBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 12, RAMPS.darkArmor);
  leafBlob(px, 22, 60, 8, RAMPS.redMalice);
  leafBlob(px, 42, 58, 8, RAMPS.darkArmor);
  // Bokoblin skull
  px.circle(32, 52, 7, RAMPS.paper.mid);
  px.circle(32, 52, 6, RAMPS.paper.light);
  px.set(29, 50, '#101018');
  px.set(35, 50, '#101018');
  px.rect(29, 55, 7, 2, '#101018');
  px.set(30, 55, RAMPS.paper.hilite);
  px.set(34, 55, RAMPS.paper.hilite);
  return finish(px, '#f0d8d8');
}

function makeWitheredDeku(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 26, 44, 76, 12, RAMPS.darkArmor);
  leafBlob(px, 32, 30, 12, RAMPS.leafDark);
  leafBlob(px, 18, 36, 8, RAMPS.darkArmor);
  leafBlob(px, 44, 34, 7, RAMPS.leafDark);
  px.ellipseFill(32, 56, 6, 8, '#100808');
  px.set(32, 52, RAMPS.redMalice.hilite);
  px.set(30, 54, RAMPS.redMalice.mid);
  px.set(34, 54, RAMPS.redMalice.mid);
  return finish(px, '#e8d0d0');
}

function makeGloomRoot(): THREE.CanvasTexture {
  const px = canvas();
  // Low sprawling gloom roots
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    for (let d = 0; d < 18; d++) {
      const x = 32 + Math.round(Math.cos(ang) * d);
      const y = 58 + Math.round(Math.sin(ang) * d * 0.45);
      px.set(x, y, d < 3 ? RAMPS.redMalice.hilite : RAMPS.darkArmor.mid);
      px.set(x, y + 1, RAMPS.redMalice.dark);
    }
  }
  px.circle(32, 56, 6, RAMPS.redMalice.mid);
  px.circle(32, 56, 3, RAMPS.redMalice.hilite);
  return finish(px, '#f0d0d8');
}

// ─── Mushroom Kingdom (classic SMB / SMW) ───────────────────────────────────

function makeMarioTree(): THREE.CanvasTexture {
  const px = canvas();
  // Thick striped trunk — SMB overworld tree
  trunk(px, 28, 48, 76, 8, RAMPS.wood, true);
  for (let y = 50; y < 74; y += 5) {
    px.rect(29, y, 6, 2, RAMPS.wood.dark);
  }
  // The iconic lollipop canopy
  smbCanopy(px, 32, 30, 20, RAMPS.leaf);
  return finish(px, '#ffffff');
}

function makeMarioTreeTall(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 29, 44, 76, 6, RAMPS.wood, true);
  smbCanopy(px, 32, 26, 16, RAMPS.leaf);
  // Secondary upper puff (SMW tall tree read)
  leafBlob(px, 32, 12, 8, RAMPS.leaf);
  return finish(px, '#ffffff');
}

function makeSuperShroom(): THREE.CanvasTexture {
  const px = canvas();
  // Cream stalk
  px.rect(27, 50, 10, 24, RAMPS.paper.mid);
  px.rect(27, 50, 3, 24, RAMPS.paper.dark);
  px.rect(34, 50, 2, 24, RAMPS.paper.light);
  px.rectOutline(27, 50, 10, 24, RAMPS.paper.outline);
  px.rect(28, 56, 8, 2, '#e8d0b0');
  // Classic red cap with white spots
  for (let j = -16; j <= 4; j++) {
    const half = Math.floor(18 * Math.sqrt(Math.max(0, 1 - ((j + 4) / 18) ** 2)));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || j === -16;
      const spot =
        Math.hypot(i + 8, j + 4) < 4.5 ||
        Math.hypot(i - 8, j + 2) < 4 ||
        Math.hypot(i, j - 6) < 3.5 ||
        Math.hypot(i + 3, j + 10) < 3;
      let hex: Hex = RAMPS.shroomRed.mid;
      if (edge) hex = RAMPS.shroomRed.outline;
      else if (spot) hex = '#fff8f0';
      else if (i < -4) hex = RAMPS.shroomRed.dark;
      else if (i > 5) hex = RAMPS.shroomRed.light;
      else if (j < -8) hex = RAMPS.shroomRed.light;
      px.set(32 + i, 40 + j, hex);
    }
  }
  px.ellipseFill(32, 48, 16, 4, RAMPS.paper.mid);
  px.ellipseFill(32, 47, 13, 3, RAMPS.paper.light);
  return finish(px, '#fff0f0');
}

function makeOneUpShroom(): THREE.CanvasTexture {
  const px = canvas();
  px.rect(27, 50, 10, 24, RAMPS.paper.mid);
  px.rect(27, 50, 3, 24, RAMPS.paper.dark);
  px.rectOutline(27, 50, 10, 24, RAMPS.paper.outline);
  // Green 1-Up cap
  for (let j = -16; j <= 4; j++) {
    const half = Math.floor(18 * Math.sqrt(Math.max(0, 1 - ((j + 4) / 18) ** 2)));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || j === -16;
      const spot =
        Math.hypot(i + 7, j + 3) < 4 ||
        Math.hypot(i - 7, j + 1) < 3.5 ||
        Math.hypot(i, j - 5) < 3;
      let hex: Hex = RAMPS.pipeGreen.mid;
      if (edge) hex = RAMPS.pipeGreen.outline;
      else if (spot) hex = '#fff8f0';
      else if (i < -4) hex = RAMPS.pipeGreen.dark;
      else if (i > 5) hex = RAMPS.pipeGreen.light;
      px.set(32 + i, 40 + j, hex);
    }
  }
  px.ellipseFill(32, 48, 16, 4, RAMPS.paper.mid);
  return finish(px, '#e8ffe8');
}

function makeFireFlower(): THREE.CanvasTexture {
  const px = canvas();
  // Stem + leaves
  px.rect(30, 52, 4, 22, RAMPS.pipeGreen.mid);
  px.rect(30, 52, 1, 22, RAMPS.pipeGreen.dark);
  leafBlob(px, 24, 60, 5, RAMPS.leaf);
  leafBlob(px, 40, 58, 5, RAMPS.leaf);
  // Classic Fire Flower face
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const col = a % 2 ? RAMPS.shroomRed.mid : RAMPS.gold.mid;
    px.circle(32 + Math.round(Math.cos(ang) * 10), 40 + Math.round(Math.sin(ang) * 9), 5, col);
  }
  px.circle(32, 40, 7, RAMPS.gold.hilite);
  px.circle(32, 40, 6, '#ffe8a0');
  // Eyes
  px.rect(28, 37, 3, 5, '#101018');
  px.rect(34, 37, 3, 5, '#101018');
  px.set(28, 37, '#ffffff');
  px.set(34, 37, '#ffffff');
  // Smile
  for (let i = -2; i <= 2; i++) px.set(32 + i, 44 + (Math.abs(i) === 2 ? 0 : 1), '#101018');
  return finish(px, '#fff8e0');
}

function makePipeSprout(): THREE.CanvasTexture {
  const px = canvas();
  // Classic green Warp Pipe
  px.bodyBox(20, 44, 24, 30, RAMPS.pipeGreen, 2);
  px.rect(16, 40, 32, 8, RAMPS.pipeGreen.light);
  px.rect(16, 40, 32, 2, RAMPS.pipeGreen.hilite);
  px.rect(16, 46, 32, 2, RAMPS.pipeGreen.dark);
  px.rect(24, 50, 16, 20, '#082018');
  px.rect(26, 52, 12, 6, '#104028');
  for (const x of [20, 28, 36, 44]) px.set(x, 42, RAMPS.silver.hilite);
  // Leaf sprouting out
  leafBlob(px, 32, 30, 7, RAMPS.leaf);
  px.rect(30, 34, 3, 8, RAMPS.pipeGreen.mid);
  return finish(px, '#e0ffe0');
}

function makeBeanstalk(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 6; y < 76; y++) {
    const wobble = Math.round(Math.sin(y * 0.45) * 2.5);
    px.set(32 + wobble, y, RAMPS.pipeGreen.mid);
    px.set(31 + wobble, y, RAMPS.pipeGreen.dark);
    px.set(33 + wobble, y, RAMPS.pipeGreen.light);
    px.set(30 + wobble, y, RAMPS.pipeGreen.outline);
    px.set(34 + wobble, y, RAMPS.pipeGreen.outline);
    if (y % 8 === 0) {
      leafBlob(px, 32 + wobble - 8, y, 5, RAMPS.leaf);
      leafBlob(px, 32 + wobble + 8, y, 5, RAMPS.leaf);
    }
  }
  // Top bloom
  leafBlob(px, 32, 10, 6, RAMPS.leaf);
  px.circle(32, 8, 3, RAMPS.gold.hilite);
  return finish(px, '#e8ffe8');
}

// ─── Koopa / Bowser land ────────────────────────────────────────────────────

function makeThornTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 28, 48, 76, 8, RAMPS.darkArmor);
  leafBlob(px, 32, 32, 14, RAMPS.leafDark);
  leafBlob(px, 20, 38, 9, RAMPS.lava);
  leafBlob(px, 44, 36, 8, RAMPS.leafDark);
  // Spikes around canopy
  for (let i = -12; i <= 12; i += 4) {
    for (let j = 0; j < 6; j++) {
      px.set(32 + i, 20 - j, j < 2 ? RAMPS.paper.hilite : RAMPS.silver.mid);
    }
  }
  return finish(px, '#ffe8d0');
}

function makeLavaPalm(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 36; y < 76; y++) {
    px.set(32, y, RAMPS.wood.dark);
    px.set(31, y, RAMPS.darkArmor.mid);
    px.set(33, y, RAMPS.wood.mid);
    px.set(30, y, RAMPS.wood.outline);
    px.set(34, y, RAMPS.wood.outline);
    if (y % 5 === 0) px.rect(30, y, 5, 1, RAMPS.darkArmor.light);
  }
  // Fronds — scorched palm
  for (let a = 0; a < 9; a++) {
    const ang = (a / 9) * Math.PI * 2;
    for (let d = 0; d < 16; d++) {
      const x = 32 + Math.round(Math.cos(ang) * d);
      const y = 32 + Math.round(Math.sin(ang) * d * 0.6 - d * 0.12);
      const col = d < 2 ? RAMPS.lava.outline : (d % 2 ? RAMPS.lava.mid : RAMPS.leafDark.mid);
      px.set(x, y, col);
      if (d % 3 === 0) px.set(x + 1, y, RAMPS.lava.light);
    }
  }
  return finish(px, '#ffe0c0');
}

function makeBurntMarioTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 28, 48, 76, 8, RAMPS.darkArmor, true);
  smbCanopy(px, 32, 30, 18, RAMPS.darkArmor);
  // Ember glow patches
  leafBlob(px, 32, 18, 7, RAMPS.lava);
  px.grit(14, 14, 36, 40, RAMPS.lava.mid, 0.1);
  px.set(24, 22, RAMPS.lava.hilite);
  px.set(40, 28, RAMPS.lava.light);
  return finish(px, '#f0d8c8');
}

function makeSpikedBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 13, RAMPS.leafDark);
  leafBlob(px, 22, 60, 8, RAMPS.darkArmor);
  leafBlob(px, 42, 58, 8, RAMPS.leafDark);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 32 + Math.round(Math.cos(a) * 14);
    const y = 56 + Math.round(Math.sin(a) * 10);
    px.set(x, y, RAMPS.silver.light);
    px.set(x, y - 1, RAMPS.paper.hilite);
  }
  return finish(px, '#e8e0d0');
}

function makeDryBonesTree(): THREE.CanvasTexture {
  const px = canvas();
  // Bone-white dead trunk
  const bone: ShadeRamp = {
    outline: '#403828', dark: '#a09078', mid: '#d0c8b0', light: '#e8e0d0', hilite: '#fff8f0',
  };
  trunk(px, 29, 40, 76, 6, bone, false);
  for (let i = 0; i < 14; i++) {
    px.set(32 - i, 36 - Math.floor(i * 0.5), bone.mid);
    px.set(32 + i, 40 - Math.floor(i * 0.4), bone.dark);
  }
  for (let i = 0; i < 10; i++) {
    px.set(32 - Math.floor(i * 0.3), 30 - i, bone.light);
    px.set(32 + Math.floor(i * 0.4), 28 - i, bone.mid);
  }
  // Skull nest
  px.circle(32, 24, 5, bone.hilite);
  px.set(30, 23, '#101018');
  px.set(34, 23, '#101018');
  return finish(px, '#f0e8d8');
}

// ─── Dream Land (classic Kirby) ─────────────────────────────────────────────

function makeCottonTree(): THREE.CanvasTexture {
  const px = canvas();
  const softWood: ShadeRamp = {
    outline: '#403028', dark: '#a08060', mid: '#c8a878', light: '#e0c898', hilite: '#f0e0b0',
  };
  trunk(px, 28, 50, 76, 8, softWood, false);
  // Soft cotton-ball canopy — Kirby tree signature
  leafBlob(px, 32, 32, 15, RAMPS.dreamLeaf);
  leafBlob(px, 18, 38, 11, RAMPS.pink);
  leafBlob(px, 46, 36, 11, RAMPS.dreamLeaf);
  leafBlob(px, 32, 18, 11, RAMPS.cloud);
  leafBlob(px, 24, 26, 8, RAMPS.pink);
  px.set(24, 14, '#ffffff');
  px.set(38, 12, RAMPS.gold.hilite);
  px.set(32, 10, '#ffffff');
  return finish(px, '#fff4d0');
}

function makeStarBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 12, RAMPS.dreamLeaf);
  leafBlob(px, 22, 60, 7, RAMPS.dreamLeaf);
  leafBlob(px, 42, 58, 7, RAMPS.cloud);
  paintStar(px, 32, 40, 12, RAMPS.gold);
  px.set(28, 36, '#ffffff');
  return finish(px, '#fff8d0');
}

function makeCandyTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 28, 48, 76, 8, RAMPS.pink, false);
  leafBlob(px, 32, 30, 16, RAMPS.pink);
  leafBlob(px, 18, 36, 10, RAMPS.cloud);
  leafBlob(px, 46, 34, 10, RAMPS.gold);
  leafBlob(px, 32, 16, 9, RAMPS.pink);
  // Sprinkle dots
  for (const [x, y, c] of [
    [20, 24, '#ffffff'], [40, 20, RAMPS.gold.hilite], [28, 34, '#ffffff'],
    [38, 30, RAMPS.dreamLeaf.hilite], [24, 18, RAMPS.gold.light],
  ] as const) {
    px.set(x, y, c);
    px.set(x + 1, y, c);
  }
  return finish(px, '#fff0f8');
}

function makeCloudShrub(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 12, RAMPS.cloud);
  leafBlob(px, 20, 58, 9, RAMPS.cloud);
  leafBlob(px, 44, 58, 9, RAMPS.cloud);
  leafBlob(px, 32, 46, 8, RAMPS.cloud);
  px.circle(26, 50, 4, '#ffffff');
  px.circle(38, 48, 3, '#ffffff');
  px.circle(32, 52, 3, RAMPS.cloud.hilite);
  px.set(30, 44, RAMPS.gold.light);
  return finish(px, '#f0f8ff');
}

function makePopFlower(): THREE.CanvasTexture {
  const px = canvas();
  px.rect(30, 54, 4, 20, RAMPS.dreamLeaf.mid);
  px.rect(30, 54, 1, 20, RAMPS.dreamLeaf.dark);
  leafBlob(px, 24, 64, 4, RAMPS.dreamLeaf);
  leafBlob(px, 40, 62, 4, RAMPS.dreamLeaf);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    px.circle(
      32 + Math.round(Math.cos(ang) * 9),
      42 + Math.round(Math.sin(ang) * 8),
      5,
      a % 2 ? RAMPS.pink.mid : RAMPS.gold.mid,
    );
  }
  px.circle(32, 42, 5, RAMPS.orange.hilite);
  px.set(32, 40, '#ffffff');
  return finish(px, '#fff8e8');
}

function makeMaximTomatoPlant(): THREE.CanvasTexture {
  const px = canvas();
  // Kirby Maxim Tomato prop plant
  px.rect(30, 52, 4, 22, RAMPS.dreamLeaf.mid);
  leafBlob(px, 24, 58, 5, RAMPS.dreamLeaf);
  leafBlob(px, 40, 56, 5, RAMPS.dreamLeaf);
  px.circle(32, 42, 12, RAMPS.shroomRed.mid);
  px.circle(32, 42, 10, RAMPS.shroomRed.light);
  // Leaf on top of tomato
  leafBlob(px, 32, 30, 5, RAMPS.dreamLeaf);
  px.set(28, 38, '#ffffff');
  px.set(36, 40, RAMPS.shroomRed.hilite);
  return finish(px, '#ffe8e8');
}

// ─── Void / NightMare ───────────────────────────────────────────────────────

function makeVoidSpire(): THREE.CanvasTexture {
  const px = canvas();
  for (let i = 0; i < 48; i++) {
    const half = 7 - Math.floor(i / 9);
    for (let x = -half; x <= half; x++) {
      px.set(
        32 + x, 70 - i,
        x === 0 ? RAMPS.void.hilite : x < 0 ? RAMPS.void.dark : RAMPS.void.mid,
      );
    }
  }
  px.circle(32, 20, 8, RAMPS.void.light);
  px.circle(32, 20, 5, RAMPS.redMalice.mid);
  px.circle(32, 20, 2, '#ffffff');
  // Orbiting motes
  px.set(20, 28, RAMPS.void.hilite);
  px.set(44, 24, RAMPS.void.light);
  px.set(28, 12, '#ffffff');
  return finish(px, '#e8d0ff');
}

function makeDarkMatterBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 32, 56, 14, RAMPS.void);
  leafBlob(px, 20, 60, 9, RAMPS.darkArmor);
  leafBlob(px, 44, 58, 9, RAMPS.void);
  // Classic Dark Matter eye
  px.circle(32, 52, 6, RAMPS.orange.mid);
  px.circle(32, 52, 3, RAMPS.orange.hilite);
  px.set(32, 50, '#ffffff');
  return finish(px, '#e0d0f0');
}

function makeVoidTendril(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 20; y < 76; y++) {
    const wobble = Math.round(Math.sin(y * 0.5) * 3);
    const w = 3 + (y % 7 === 0 ? 2 : 0);
    for (let i = 0; i < w; i++) {
      px.set(31 + wobble + i, y, i === 0 ? RAMPS.void.dark : RAMPS.void.mid);
    }
    if (y % 6 === 0) {
      px.set(31 + wobble - 3, y, RAMPS.void.light);
      px.set(31 + wobble + w + 2, y, RAMPS.redMalice.mid);
    }
  }
  px.circle(32, 18, 5, RAMPS.void.hilite);
  px.circle(32, 18, 2, RAMPS.redMalice.hilite);
  return finish(px, '#e0d0f8');
}
