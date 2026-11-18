import * as THREE from 'three';
import { PixelCanvas, RAMPS, type Hex, type ShadeRamp } from '../art/PixelKit';
import type { BiomeId } from '../../game/maps/MapDefinitions';

export type FloraTheme =
  | 'hyrule'
  | 'malice'
  | 'mushroom'
  | 'koopa'
  | 'dream'
  | 'void'
  | 'mixed';

/**
 * Realm flora — classic Nintendo silhouettes as cardboard cutout props.
 * Hyrule → Deku / Field oaks · Mushroom → Super Mario Bros trees & shrooms
 * Popstar → soft cotton Dream Land · Chaos variants for Malice / Koopa / Void
 */
export class FlatTrees {
  readonly group = new THREE.Group();

  constructor(count = 52, spread = 24, theme: FloraTheme = 'mixed') {
    const makers = floraForTheme(theme);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * spread;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      if (Math.abs(x) < 5.5 && Math.abs(z) < 5.5) continue;

      // Mixed / Neutral maps: pick flora by map quadrant so each sector reads as its universe
      let tex: THREE.CanvasTexture;
      if (theme === 'mixed') {
        const sector = sectorTheme(x, z);
        const sectorMakers = floraForTheme(sector);
        tex = sectorMakers[i % sectorMakers.length]!();
      } else {
        tex = makers[i % makers.length]!();
      }

      const h = 1.6 + Math.random() * 2.6;
      const w = h * (0.48 + Math.random() * 0.28);

      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.35,
        side: THREE.DoubleSide,
        roughness: 0.95,
        metalness: 0,
      });
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;

      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(x, h / 2, z);
      mesh.rotation.y = Math.PI / 4;
      mesh.castShadow = true;
      mesh.userData.treeHeight = h;
      this.group.add(mesh);
    }
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

/** Triforce Clash layout: SW Hyrule, NE Malice, NW Dream, SE leans Mushroom accents. */
function sectorTheme(x: number, z: number): FloraTheme {
  if (x < 0 && z < 0) return 'hyrule';
  if (x >= 0 && z >= 0) return 'malice';
  if (x < 0 && z >= 0) return 'dream';
  return 'mushroom';
}

type Maker = () => THREE.CanvasTexture;

function floraForTheme(theme: FloraTheme): Maker[] {
  switch (theme) {
    case 'hyrule':
      return [makeDekuTree, makeHyruleOak, makeLonLonTree, makeKorokBush, makeDeathPine];
    case 'malice':
      return [makeGloomTree, makeDeadMalice, makeSkullBush, makeWitheredDeku];
    case 'mushroom':
      return [makeMarioTree, makeSuperShroom, makeFlowerBush, makePipeSprout, makeBeanstalk];
    case 'koopa':
      return [makeThornTree, makeLavaPalm, makeBurntMarioTree, makeSpikedBush];
    case 'dream':
      return [makeCottonTree, makeStarBush, makeCandyTree, makeCloudShrub, makePopFlower];
    case 'void':
      return [makeVoidSpire, makeDarkMatterBush, makeWitheredDeku, makeGloomTree];
    case 'mixed':
    default:
      return [makeHyruleOak, makeMarioTree, makeCottonTree, makeDekuTree, makeSuperShroom];
  }
}

// ─── Shared helpers ─────────────────────────────────────────────────────────

function canvas(): PixelCanvas {
  const px = new PixelCanvas(48, 64);
  px.clear();
  return px;
}

function finish(px: PixelCanvas, border = '#ffffff'): THREE.CanvasTexture {
  px.dieCut(border);
  return px.toTexture(6);
}

function trunk(px: PixelCanvas, x: number, y0: number, y1: number, w = 5, ramp: ShadeRamp = RAMPS.wood): void {
  px.rect(x, y0, w, y1 - y0, ramp.mid);
  px.rect(x, y0, Math.max(1, Math.floor(w * 0.35)), y1 - y0, ramp.dark);
  px.rect(x + w - 1, y0, 1, y1 - y0, ramp.light);
  px.grit(x, y0, w, y1 - y0, ramp.outline, 0.12);
}

function leafBlob(
  px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp,
): void {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      if (i * i + j * j > r * r) continue;
      const edge = i * i + j * j > (r - 1) * (r - 1);
      const dither = ((i * 3 + j * 5) & 1) === 0;
      let hex: Hex = ramp.mid;
      if (edge) hex = ramp.outline;
      else if (i + j < -2) hex = ramp.dark;
      else if (i + j > 3) hex = dither ? ramp.light : ramp.hilite;
      px.set(cx + i, cy + j, hex);
    }
  }
}

function pineWedges(px: PixelCanvas, leaf: ShadeRamp): void {
  for (const [y, half] of [[50, 16], [40, 14], [30, 11], [20, 8], [12, 5], [6, 3]] as const) {
    for (let j = 0; j < half; j++) {
      const w = half - Math.floor(j * 0.75);
      for (let i = -w; i <= w; i++) {
        const edge = Math.abs(i) === w || j === 0;
        let hex: Hex = leaf.mid;
        if (edge) hex = leaf.outline;
        else if (i < -3) hex = leaf.dark;
        else if (i > 3) hex = ((i + j) & 1) === 0 ? leaf.light : leaf.hilite;
        else if (j < 2) hex = leaf.light;
        px.set(24 + i, y - j, hex);
      }
    }
  }
}

// ─── Hyrule (classic Zelda Field / Lost Woods) ──────────────────────────────

function makeDekuTree(): THREE.CanvasTexture {
  const px = canvas();
  // Thick Deku trunk with face hollow
  trunk(px, 20, 36, 62, 9, RAMPS.wood);
  px.ellipseFill(24, 48, 5, 6, '#201008');
  px.set(22, 46, RAMPS.gold.mid);
  px.set(26, 46, RAMPS.gold.mid);
  px.set(24, 50, RAMPS.wood.light);
  // Layered teal canopy — Lost Woods vibe
  leafBlob(px, 24, 26, 14, RAMPS.deku);
  leafBlob(px, 14, 30, 9, RAMPS.deku);
  leafBlob(px, 34, 28, 10, RAMPS.leaf);
  leafBlob(px, 24, 16, 8, RAMPS.deku);
  // Soft glow leaf tips
  px.set(18, 18, RAMPS.deku.hilite);
  px.set(30, 14, RAMPS.deku.hilite);
  return finish(px, '#e8fff4');
}

function makeHyruleOak(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 40, 62, 5);
  leafBlob(px, 24, 28, 14, RAMPS.leaf);
  leafBlob(px, 16, 32, 9, RAMPS.leaf);
  leafBlob(px, 32, 30, 10, RAMPS.leaf);
  leafBlob(px, 24, 18, 8, RAMPS.leaf);
  leafBlob(px, 28, 24, 7, RAMPS.leafDark);
  return finish(px);
}

function makeLonLonTree(): THREE.CanvasTexture {
  const px = canvas();
  // Slim ranch windbreak tree
  trunk(px, 23, 34, 62, 3);
  for (const [cx, cy, r] of [[24, 22, 11], [18, 26, 7], [30, 24, 7], [24, 14, 6]] as const) {
    leafBlob(px, cx, cy, r, RAMPS.leaf);
  }
  return finish(px);
}

function makeKorokBush(): THREE.CanvasTexture {
  const px = canvas();
  // Low Korok-style leafy mound with seed sparkle
  leafBlob(px, 24, 48, 12, RAMPS.leaf);
  leafBlob(px, 16, 52, 7, RAMPS.leafDark);
  leafBlob(px, 32, 50, 8, RAMPS.leaf);
  px.circle(24, 44, 3, RAMPS.wood.mid);
  px.set(24, 42, RAMPS.gold.hilite);
  px.set(22, 40, '#ffffff');
  px.set(26, 40, '#ffffff');
  return finish(px, '#f0ffe0');
}

function makeDeathPine(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 44, 62, 5, { outline: '#201010', dark: '#403028', mid: '#584838', light: '#786858', hilite: '#988878' });
  pineWedges(px, RAMPS.leafDark);
  // Ash speckles
  px.grit(10, 8, 28, 40, '#a09080', 0.06);
  return finish(px, '#e8e0d0');
}

// ─── Malice / Gloom (BOTW / TotK chaos) ─────────────────────────────────────

function makeGloomTree(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 22; y < 62; y++) {
    const wobble = Math.round(Math.sin(y * 0.35) * 2);
    px.set(24 + wobble, y, RAMPS.wood.dark);
    px.set(23 + wobble, y, RAMPS.darkArmor.mid);
    px.set(25 + wobble, y, RAMPS.wood.mid);
    if (y % 5 === 0) px.set(24 + wobble, y, RAMPS.redMalice.mid);
  }
  leafBlob(px, 24, 24, 11, RAMPS.darkArmor);
  leafBlob(px, 16, 28, 7, RAMPS.redMalice);
  leafBlob(px, 32, 26, 8, RAMPS.darkArmor);
  // Gloom drips
  for (let i = 0; i < 8; i++) {
    px.set(18 + i * 2, 34 + (i % 3), RAMPS.redMalice.light);
  }
  return finish(px, '#f0d0d0');
}

function makeDeadMalice(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 20; y < 62; y++) {
    const wobble = Math.round(Math.sin(y * 0.4) * 1.5);
    px.set(24 + wobble, y, RAMPS.wood.mid);
    px.set(23 + wobble, y, RAMPS.wood.dark);
    px.set(25 + wobble, y, RAMPS.wood.light);
  }
  for (let i = 0; i < 14; i++) {
    px.set(24 - i, 28 - Math.floor(i * 0.55), RAMPS.wood.mid);
    px.set(24 + i, 32 - Math.floor(i * 0.45), RAMPS.wood.dark);
    if (i % 3 === 0) {
      px.set(24 - i, 27 - Math.floor(i * 0.55), RAMPS.redMalice.mid);
    }
  }
  return finish(px, '#f0e0e0');
}

function makeSkullBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 24, 50, 10, RAMPS.darkArmor);
  leafBlob(px, 18, 54, 6, RAMPS.redMalice);
  px.circle(24, 48, 5, RAMPS.paper.mid);
  px.set(22, 47, '#101018');
  px.set(26, 47, '#101018');
  px.rect(22, 50, 5, 1, '#101018');
  return finish(px, '#f0d8d8');
}

function makeWitheredDeku(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 21, 38, 62, 7, RAMPS.darkArmor);
  leafBlob(px, 24, 28, 10, RAMPS.leafDark);
  leafBlob(px, 14, 32, 6, RAMPS.darkArmor);
  px.ellipseFill(24, 48, 4, 5, '#100808');
  px.set(24, 46, RAMPS.redMalice.hilite);
  return finish(px, '#e8d0d0');
}

// ─── Mushroom Kingdom (classic SMB / SMW) ───────────────────────────────────

function makeMarioTree(): THREE.CanvasTexture {
  const px = canvas();
  // Classic Super Mario Bros rounded canopy + striped trunk
  trunk(px, 22, 38, 62, 5);
  for (let y = 40; y < 60; y += 4) px.rect(22, y, 5, 1, RAMPS.wood.dark);
  // Big round SMB canopy
  leafBlob(px, 24, 26, 16, RAMPS.leaf);
  leafBlob(px, 24, 18, 10, RAMPS.leaf);
  // Highlight scallop edge (SMB tree read)
  for (let i = -14; i <= 14; i += 4) {
    px.circle(24 + i, 36, 3, RAMPS.leaf.dark);
  }
  return finish(px, '#ffffff');
}

function makeSuperShroom(): THREE.CanvasTexture {
  const px = canvas();
  // Classic 1-Up / Super Mushroom prop
  px.rect(21, 44, 7, 18, RAMPS.paper.mid);
  px.rect(21, 44, 2, 18, RAMPS.paper.dark);
  px.rect(22, 48, 5, 2, '#e8d0b0');
  // Cap dome
  for (let j = -12; j <= 4; j++) {
    const half = Math.floor(14 * Math.sqrt(Math.max(0, 1 - ((j + 2) / 14) ** 2)));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || j === -12;
      const spot = (Math.abs(i) > 4 && Math.abs(i) < 9 && j > -8 && j < 0);
      let hex: Hex = RAMPS.shroomRed.mid;
      if (edge) hex = RAMPS.shroomRed.outline;
      else if (spot) hex = RAMPS.paper.hilite;
      else if (i < -2) hex = RAMPS.shroomRed.dark;
      else if (i > 4) hex = RAMPS.shroomRed.light;
      else if (j < -6) hex = RAMPS.shroomRed.light;
      px.set(24 + i, 36 + j, hex);
    }
  }
  // Underside ring
  px.ellipseFill(24, 42, 12, 3, RAMPS.paper.mid);
  px.ellipseFill(24, 41, 10, 2, RAMPS.paper.light);
  return finish(px, '#fff0f0');
}

function makeFlowerBush(): THREE.CanvasTexture {
  const px = canvas();
  // Fire Flower / SMB flower cluster
  for (const [cx, cy, petal] of [
    [18, 42, RAMPS.shroomRed],
    [30, 40, RAMPS.gold],
    [24, 34, RAMPS.orange],
    [36, 46, RAMPS.pink],
  ] as const) {
    for (let a = 0; a < 6; a++) {
      const ang = (a / 6) * Math.PI * 2;
      px.circle(cx + Math.round(Math.cos(ang) * 4), cy + Math.round(Math.sin(ang) * 3), 3, petal.mid);
    }
    px.circle(cx, cy, 2, RAMPS.gold.hilite);
  }
  // Stems
  for (const x of [18, 24, 30, 36]) {
    px.rect(x, 48, 2, 14, RAMPS.pipeGreen.mid);
  }
  return finish(px, '#fff8e0');
}

function makePipeSprout(): THREE.CanvasTexture {
  const px = canvas();
  // Mini warp-pipe with sprout
  px.bodyBox(16, 40, 16, 22, RAMPS.pipeGreen, 2);
  px.rect(14, 38, 20, 6, RAMPS.pipeGreen.light);
  px.rect(14, 38, 20, 2, RAMPS.pipeGreen.hilite);
  px.rect(18, 44, 12, 14, '#082018');
  px.rect(20, 46, 8, 4, '#104028');
  // Leaf sprout
  leafBlob(px, 24, 28, 6, RAMPS.leaf);
  px.rect(23, 32, 2, 8, RAMPS.pipeGreen.mid);
  return finish(px, '#e0ffe0');
}

function makeBeanstalk(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 8; y < 62; y++) {
    const wobble = Math.round(Math.sin(y * 0.5) * 2);
    px.set(24 + wobble, y, RAMPS.pipeGreen.mid);
    px.set(23 + wobble, y, RAMPS.pipeGreen.dark);
    px.set(25 + wobble, y, RAMPS.pipeGreen.light);
    if (y % 7 === 0) {
      leafBlob(px, 24 + wobble - 6, y, 4, RAMPS.leaf);
      leafBlob(px, 24 + wobble + 6, y, 4, RAMPS.leaf);
    }
  }
  return finish(px, '#e8ffe8');
}

// ─── Koopa / Bowser land ────────────────────────────────────────────────────

function makeThornTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 40, 62, 5, RAMPS.darkArmor);
  leafBlob(px, 24, 28, 12, RAMPS.leafDark);
  leafBlob(px, 16, 32, 7, RAMPS.lava);
  // Spikes
  for (let i = -10; i <= 10; i += 4) {
    for (let j = 0; j < 5; j++) {
      px.set(24 + i, 20 - j, RAMPS.silver.mid);
      px.set(24 + i, 19 - j, RAMPS.paper.hilite);
    }
  }
  return finish(px, '#ffe8d0');
}

function makeLavaPalm(): THREE.CanvasTexture {
  const px = canvas();
  for (let y = 28; y < 62; y++) {
    px.set(24, y, RAMPS.wood.dark);
    px.set(23, y, RAMPS.darkArmor.mid);
    px.set(25, y, RAMPS.wood.mid);
  }
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    for (let d = 0; d < 14; d++) {
      const x = 24 + Math.round(Math.cos(ang) * d);
      const y = 26 + Math.round(Math.sin(ang) * d * 0.65 - d * 0.12);
      px.set(x, y, d < 2 ? RAMPS.lava.outline : (d % 2 ? RAMPS.lava.mid : RAMPS.leafDark.mid));
    }
  }
  return finish(px, '#ffe0c0');
}

function makeBurntMarioTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 38, 62, 5, RAMPS.darkArmor);
  leafBlob(px, 24, 26, 14, RAMPS.darkArmor);
  leafBlob(px, 24, 18, 8, RAMPS.lava);
  px.grit(10, 12, 28, 40, RAMPS.lava.mid, 0.08);
  return finish(px, '#f0d8c8');
}

function makeSpikedBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 24, 48, 11, RAMPS.leafDark);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    px.set(24 + Math.round(Math.cos(a) * 12), 48 + Math.round(Math.sin(a) * 8), RAMPS.silver.light);
  }
  return finish(px, '#e8e0d0');
}

// ─── Dream Land (classic Kirby) ─────────────────────────────────────────────

function makeCottonTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 42, 62, 5, { outline: '#403028', dark: '#a08060', mid: '#c8a878', light: '#e0c898', hilite: '#f0e0b0' });
  // Soft cotton-ball canopy — Kirby tree read
  leafBlob(px, 24, 28, 13, RAMPS.dreamLeaf);
  leafBlob(px, 14, 32, 9, RAMPS.pink);
  leafBlob(px, 34, 30, 9, RAMPS.dreamLeaf);
  leafBlob(px, 24, 16, 9, RAMPS.cloud);
  px.set(20, 14, '#ffffff');
  px.set(28, 12, RAMPS.gold.hilite);
  return finish(px, '#fff4d0');
}

function makeStarBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 24, 48, 10, RAMPS.dreamLeaf);
  // Classic Warp Star silhouette
  for (let j = -8; j <= 8; j++) {
    for (let i = -8; i <= 8; i++) {
      const ang = Math.atan2(j, i);
      const dist = Math.hypot(i, j);
      const point = (Math.cos(ang * 5) + 1) * 0.5;
      const maxR = 8 * (0.4 + point * 0.6);
      if (dist <= maxR) {
        px.set(24 + i, 36 + j, dist > maxR - 1 ? RAMPS.gold.outline : (dist < 2 ? RAMPS.gold.hilite : RAMPS.gold.mid));
      }
    }
  }
  return finish(px, '#fff8d0');
}

function makeCandyTree(): THREE.CanvasTexture {
  const px = canvas();
  trunk(px, 22, 40, 62, 5, RAMPS.pink);
  leafBlob(px, 24, 26, 14, RAMPS.pink);
  leafBlob(px, 16, 30, 8, RAMPS.cloud);
  leafBlob(px, 32, 28, 8, RAMPS.gold);
  leafBlob(px, 24, 16, 7, RAMPS.pink);
  // Sprinkle dots
  for (const [x, y] of [[18, 22], [28, 18], [22, 30], [30, 26]] as const) {
    px.set(x, y, '#ffffff');
  }
  return finish(px, '#fff0f8');
}

function makeCloudShrub(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 24, 48, 10, RAMPS.cloud);
  leafBlob(px, 16, 50, 7, RAMPS.cloud);
  leafBlob(px, 32, 50, 7, RAMPS.cloud);
  leafBlob(px, 24, 40, 6, RAMPS.cloud);
  px.set(20, 44, '#ffffff');
  px.set(28, 42, RAMPS.gold.light);
  return finish(px, '#f0f8ff');
}

function makePopFlower(): THREE.CanvasTexture {
  const px = canvas();
  px.rect(23, 48, 3, 14, RAMPS.dreamLeaf.mid);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    px.circle(24 + Math.round(Math.cos(ang) * 7), 42 + Math.round(Math.sin(ang) * 6), 4, a % 2 ? RAMPS.pink.mid : RAMPS.gold.mid);
  }
  px.circle(24, 42, 4, RAMPS.orange.hilite);
  px.set(24, 41, '#ffffff');
  return finish(px, '#fff8e8');
}

// ─── Void / NightMare ───────────────────────────────────────────────────────

function makeVoidSpire(): THREE.CanvasTexture {
  const px = canvas();
  for (let i = 0; i < 40; i++) {
    const half = 6 - Math.floor(i / 8);
    for (let x = -half; x <= half; x++) {
      px.set(24 + x, 58 - i, x === 0 ? RAMPS.void.hilite : (x < 0 ? RAMPS.void.dark : RAMPS.void.mid));
    }
  }
  px.circle(24, 18, 6, RAMPS.void.light);
  px.circle(24, 18, 3, RAMPS.redMalice.hilite);
  px.set(24, 17, '#ffffff');
  return finish(px, '#e8d0ff');
}

function makeDarkMatterBush(): THREE.CanvasTexture {
  const px = canvas();
  leafBlob(px, 24, 48, 12, RAMPS.void);
  leafBlob(px, 16, 52, 7, RAMPS.darkArmor);
  leafBlob(px, 32, 50, 7, RAMPS.void);
  px.circle(24, 46, 4, RAMPS.redMalice.mid);
  px.circle(24, 46, 2, '#ffffff');
  return finish(px, '#e0d0f0');
}
