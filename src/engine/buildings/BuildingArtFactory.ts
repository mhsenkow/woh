import * as THREE from 'three';
import type { BuildingVisual } from '../../game/buildings/BuildingDefinitions';
import { PixelCanvas, RAMPS, type ShadeRamp } from '../art/PixelKit';

const W = 80;
const H = 96;
const SCALE = 8;

const FACTION_TRIM: Record<number, ShadeRamp> = {
  0: RAMPS.blueArmor,
  1: RAMPS.redMalice,
  2: RAMPS.shroomRed,
  3: RAMPS.pipeGreen,
  4: RAMPS.gold,
  5: RAMPS.void,
};

/**
 * Realm architecture cutouts — Hyrule stone, Mushroom brick/pipes,
 * Dream Land soft shrines, Malice/Void organic chaos.
 */
export function createBuildingArtTexture(
  visual: BuildingVisual,
  factionId: number,
  name: string,
  _size = 768,
): THREE.CanvasTexture {
  const px = new PixelCanvas(W, H);
  px.clear();
  px.contactShadow(40, 90, 22, 4);

  const trim = FACTION_TRIM[factionId] ?? RAMPS.blueArmor;

  switch (visual) {
    case 'keep':
      if (factionId === 2) paintPeachCastle(px);
      else if (factionId === 3) paintBowserKeep(px);
      else paintKeep(px, trim);
      break;
    case 'barracks':
      if (factionId === 2) paintToadHouse(px);
      else paintBarracks(px, trim);
      break;
    case 'forge':
      if (factionId === 3) paintBillBlasterFactory(px);
      else paintForge(px, trim);
      break;
    case 'tower': paintTower(px, trim, factionId); break;
    case 'temple': paintTemple(px, trim); break;
    case 'mine':
      if (factionId === 2) paintWarpPipe(px);
      else paintMine(px, trim);
      break;
    case 'wall': paintWall(px, trim); break;
    case 'hive': paintHive(px, trim); break;
    case 'pit': paintPit(px, trim); break;
    case 'altar': paintAltar(px, trim, factionId); break;
    case 'nest': paintNest(px, trim); break;
    case 'vein': paintVein(px, trim); break;
    case 'nexus': paintNexus(px, trim); break;
    case 'shrine': paintShrine(px, trim); break;
    case 'matrix': paintMatrix(px, trim); break;
    case 'platform':
      if (factionId === 3) paintAirshipDock(px);
      else paintPlatform(px, trim, factionId);
      break;
    case 'crystal': paintCrystal(px, trim); break;
    case 'dojo': paintDojo(px, trim); break;
    default: paintBarracks(px, trim);
  }

  paintPlaque(px, name);

  const border =
    factionId === 1 || factionId === 5 ? '#f0e0e0' :
    factionId === 4 ? '#fff4d0' :
    factionId === 2 ? '#ffe8e0' :
    factionId === 3 ? '#e8ffe0' :
    '#ffffff';
  px.dieCut(border);
  return px.toTexture(SCALE);
}

function paintPlaque(px: PixelCanvas, name: string) {
  const label = name.length > 12 ? name.slice(0, 11) + '.' : name;
  // We can't do real fonts at 1px — draw a decorative bar instead of illegible text
  px.rect(18, 88, 44, 5, RAMPS.paper.mid);
  px.rectOutline(18, 88, 44, 5, RAMPS.paper.outline);
  px.rect(20, 89, Math.min(40, label.length * 3), 2, RAMPS.paper.dark);
  void label;
}

function paintKeep(px: PixelCanvas, trim: ShadeRamp) {
  const stone = RAMPS.stone;
  // Main keep
  px.bodyBox(18, 40, 44, 42, stone, 1);
  brickHatch(px, 20, 42, 40, 38, stone);
  px.grit(20, 42, 40, 38, stone.dark, 0.08);
  // Corner towers with merlons + windows
  for (const x of [14, 54]) {
    px.bodyBox(x, 26, 14, 56, stone, 1);
    brickHatch(px, x + 1, 28, 12, 50, stone);
    for (let i = 0; i < 4; i++) px.rect(x + 1 + i * 3, 22, 3, 6, stone.mid);
    // Arrow slits
    px.rect(x + 5, 40, 3, 6, '#101018');
    px.rect(x + 5, 56, 3, 6, '#101018');
    px.set(x + 6, 41, '#d0e8ff');
    px.set(x + 6, 57, '#d0e8ff');
  }
  // Banner with fold
  px.rect(38, 28, 4, 24, trim.mid);
  px.rect(38, 28, 1, 24, trim.dark);
  px.rect(42, 28, 12, 10, trim.light);
  px.rect(42, 30, 12, 1, trim.dark);
  px.rect(50, 28, 2, 10, trim.mid);
  // Gate with iron bands
  px.bodyBox(32, 58, 16, 24, RAMPS.wood, 2);
  px.rect(34, 62, 12, 1, RAMPS.silver.dark);
  px.rect(34, 70, 12, 1, RAMPS.silver.dark);
  px.rect(38, 68, 3, 5, RAMPS.gold.mid);
  px.set(39, 69, RAMPS.gold.hilite);
  // Triforce above gate
  for (const [dx, dy] of [[0, 0], [-1, 1], [1, 1], [-2, 2], [0, 2], [2, 2]] as const) {
    px.set(40 + dx, 48 + dy, dy === 0 ? RAMPS.gold.hilite : RAMPS.gold.mid);
  }
  // Roof tiles on center
  for (let i = 0; i < 8; i++) {
    px.rect(22 + i * 5, 40, 4, 2, i % 2 ? stone.dark : stone.mid);
  }
}


function paintPeachCastle(px: PixelCanvas) {
  const stone = RAMPS.paper;
  const roof = RAMPS.shroomRed;
  px.bodyBox(16, 48, 48, 34, stone, 2);
  brickHatch(px, 18, 50, 44, 30, { ...stone, dark: '#c8b898' });
  for (const x of [12, 56]) {
    px.bodyBox(x, 30, 14, 52, stone, 1);
    for (let i = 0; i < 12; i++) {
      const half = 7 - Math.floor(i / 2);
      for (let dx = -half; dx <= half; dx++) px.set(x + 7 + dx, 30 - i, roof.mid);
    }
  }
  for (let i = 0; i < 16; i++) {
    const half = 22 - Math.floor(i * 1.1);
    for (let x = 40 - half; x <= 40 + half; x++) {
      px.set(x, 48 - i, i < 2 ? roof.outline : (x < 40 ? roof.dark : roof.light));
    }
  }
  px.rect(38, 28, 4, 8, RAMPS.gold.mid);
  px.circle(40, 26, 3, RAMPS.gold.hilite);
  px.bodyBox(34, 64, 12, 18, RAMPS.wood, 1);
  px.rect(22, 56, 8, 12, '#4060c8');
  px.rect(50, 56, 8, 12, '#4060c8');
  px.set(24, 58, '#88b0ff');
  px.set(52, 58, '#88b0ff');
  px.rect(30, 80, 20, 4, RAMPS.shroomRed.mid);
}

function paintToadHouse(px: PixelCanvas) {
  px.bodyBox(18, 52, 44, 30, RAMPS.wood, 2);
  for (let j = -18; j <= 4; j++) {
    const half = Math.floor(26 * Math.sqrt(Math.max(0, 1 - ((j + 4) / 22) ** 2)));
    for (let i = -half; i <= half; i++) {
      const spot =
        Math.hypot(i + 10, j + 2) < 5 ||
        Math.hypot(i - 8, j - 4) < 4 ||
        Math.hypot(i, j + 8) < 4;
      px.set(40 + i, 42 + j, spot ? '#fff8f0' : RAMPS.shroomRed.mid);
    }
  }
  px.rect(34, 66, 12, 16, RAMPS.wood.dark);
  px.rect(38, 72, 3, 4, RAMPS.gold.mid);
  px.rect(22, 60, 8, 10, '#88d0ff');
  px.rect(50, 60, 8, 10, '#88d0ff');
}

function paintWarpPipe(px: PixelCanvas) {
  px.bodyBox(24, 36, 32, 46, RAMPS.pipeGreen, 2);
  px.rect(20, 32, 40, 10, RAMPS.pipeGreen.light);
  px.rect(20, 32, 40, 3, RAMPS.pipeGreen.hilite);
  px.rect(20, 40, 40, 2, RAMPS.pipeGreen.dark);
  px.rect(28, 44, 24, 30, '#082018');
  px.rect(30, 46, 20, 8, '#104028');
  for (const x of [24, 36, 48, 56]) px.set(x, 36, RAMPS.silver.hilite);
  px.circle(40, 56, 3, RAMPS.gold.hilite);
}

function paintBowserKeep(px: PixelCanvas) {
  const stone = RAMPS.darkArmor;
  px.bodyBox(14, 42, 52, 40, stone, 1);
  brickHatch(px, 16, 44, 48, 36, stone);
  for (const x of [10, 58]) {
    px.bodyBox(x, 24, 14, 58, stone, 1);
    for (let i = 0; i < 4; i++) px.rect(x + 2 + i * 3, 20, 2, 6, stone.mid);
  }
  px.bodyBox(32, 58, 16, 24, RAMPS.lava, 2);
  px.rect(34, 62, 12, 14, RAMPS.lava.hilite);
  px.circle(40, 48, 6, RAMPS.paper.mid);
  px.set(38, 47, '#101018');
  px.set(42, 47, '#101018');
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 6; j++) px.set(18 + i * 5, 40 - j, RAMPS.silver.light);
  }
}

function paintBillBlasterFactory(px: PixelCanvas) {
  px.bodyBox(16, 50, 48, 32, RAMPS.darkArmor, 1);
  px.bodyBox(22, 36, 36, 22, RAMPS.darkArmor, 2);
  px.rect(18, 40, 10, 14, '#080808');
  px.rect(20, 42, 6, 10, '#202028');
  smoke(px, 56, 30);
  px.rect(48, 70, 14, 6, RAMPS.lava.mid);
}

function paintAirshipDock(px: PixelCanvas) {
  px.ellipseFill(40, 78, 30, 8, RAMPS.wood.dark);
  px.bodyBox(20, 50, 40, 24, RAMPS.wood, 1);
  px.rect(36, 28, 3, 28, RAMPS.wood.mid);
  px.rect(40, 30, 18, 14, RAMPS.shroomRed.mid);
  px.rect(14, 58, 12, 6, RAMPS.darkArmor.mid);
  px.rect(54, 58, 12, 6, RAMPS.darkArmor.mid);
}

function paintBarracks(px: PixelCanvas, trim: ShadeRamp) {
  px.bodyBox(14, 48, 52, 34, trim, 2);
  px.grit(16, 50, 48, 30, trim.dark, 0.07);
  // Shingled roof
  for (let i = 0; i < 26; i++) {
    const y = 48 - i;
    const half = 28 - Math.floor(i * 0.9);
    for (let x = 40 - half; x <= 40 + half; x++) {
      const tile = ((x + i * 2) % 4 === 0);
      px.set(x, y, i < 2 ? RAMPS.wood.outline : (tile ? RAMPS.wood.dark : RAMPS.wood.mid));
    }
  }
  // Ridge cap
  px.rect(36, 22, 8, 2, RAMPS.wood.light);
  // Windows with panes + sill
  for (const x of [20, 36, 52]) {
    px.rect(x, 54, 9, 12, '#101828');
    px.rect(x + 1, 55, 7, 10, '#d0e8ff');
    px.rect(x + 4, 55, 1, 10, trim.outline);
    px.rect(x + 1, 59, 7, 1, trim.outline);
    px.rect(x, 66, 9, 2, RAMPS.wood.mid);
    px.set(x + 2, 56, '#ffffff');
  }
  // Door + steps
  px.bodyBox(34, 66, 12, 16, RAMPS.wood, 1);
  px.rect(38, 72, 2, 4, RAMPS.gold.mid);
  px.rect(32, 80, 16, 2, RAMPS.stone.mid);
  px.rect(34, 82, 12, 2, RAMPS.stone.dark);
}

function paintForge(px: PixelCanvas, _trim: ShadeRamp) {
  px.bodyBox(16, 50, 48, 32, RAMPS.wood, 1);
  // Chimneys
  px.bodyBox(24, 28, 10, 24, RAMPS.stone, 1);
  px.bodyBox(46, 32, 8, 20, RAMPS.stone, 1);
  smoke(px, 29, 24);
  smoke(px, 50, 28);
  // Forge glow
  px.rect(32, 62, 16, 12, '#ff6020');
  px.rect(34, 64, 12, 8, '#ffe080');
  px.rect(36, 66, 8, 4, '#ffffff');
  // Anvil
  px.rect(54, 72, 12, 4, RAMPS.silver.dark);
  px.rect(56, 70, 8, 2, RAMPS.silver.mid);
}

function paintTower(px: PixelCanvas, trim: ShadeRamp, factionId = 0) {
  px.bodyBox(28, 18, 24, 64, trim, 2);
  px.bandShade(30, 20, 20, 58, trim);
  // Sheikah rings + glyphs
  for (const y of [26, 38, 50, 62]) {
    px.rect(24, y, 32, 2, trim.light);
    px.rect(26, y + 1, 28, 1, trim.dark);
  }
  for (let i = 0; i < 6; i++) {
    px.set(32 + (i % 3) * 4, 44 + Math.floor(i / 3) * 6, '#66ffcc');
  }
  // Eye / lens — Sheikah teal, Popstar gold, Void crimson
  const lens = factionId === 5 ? RAMPS.redMalice.hilite : factionId === 4 ? RAMPS.gold.hilite : '#66ffcc';
  px.circle(40, 32, 9, '#101828');
  px.circle(40, 32, 7, factionId === 4 ? '#fff0f8' : '#e8f0ff');
  px.circle(40, 32, 5, trim.mid);
  px.circle(40, 32, 2, trim.hilite);
  px.set(40, 31, '#ffffff');
  px.set(38, 30, lens);
  // Antenna
  px.rect(39, 8, 2, 12, RAMPS.silver.mid);
  px.circle(40, 8, 3, trim.light);
  px.set(40, 7, '#ffffff');
  px.bodyBox(22, 78, 36, 6, RAMPS.stone, 1);
  brickHatch(px, 24, 78, 32, 6, RAMPS.stone);
}

function paintTemple(px: PixelCanvas, trim: ShadeRamp) {
  const sand: ShadeRamp = { outline: '#403020', dark: '#a08858', mid: '#c8b078', light: '#e0d0a0', hilite: '#f0e8c0' };
  px.bodyBox(10, 68, 60, 14, sand, 1);
  px.bodyBox(18, 54, 44, 14, sand, 1);
  px.bodyBox(26, 36, 28, 18, trim, 2);
  // Spire
  for (let i = 0; i < 16; i++) {
    const half = 10 - Math.floor(i / 2);
    for (let x = 40 - half; x <= 40 + half; x++) px.set(x, 36 - i, i < 2 ? RAMPS.gold.outline : RAMPS.gold.mid);
  }
  px.circle(40, 44, 4, RAMPS.gold.hilite);
}

function paintMine(px: PixelCanvas, _trim: ShadeRamp) {
  px.bodyBox(20, 58, 40, 24, RAMPS.leaf, 2);
  // Giant rupee
  for (let j = -14; j <= 14; j++) {
    const half = 10 - Math.floor(Math.abs(j) * 0.55);
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || Math.abs(j) === 14;
      px.set(40 + i, 48 + j, edge ? '#186028' : (i < 0 ? '#28a048' : '#48d068'));
    }
  }
  px.set(38, 42, '#a0ffb0');
}

function paintWall(px: PixelCanvas, trim: ShadeRamp) {
  px.bodyBox(6, 48, 68, 34, RAMPS.stone, 1);
  brickHatch(px, 8, 50, 64, 30, RAMPS.stone);
  px.bodyBox(28, 58, 24, 24, RAMPS.wood, 2);
  for (const x of [8, 62]) {
    px.bodyBox(x, 30, 12, 52, trim, 1);
    for (let i = 0; i < 3; i++) px.rect(x + 1 + i * 3, 26, 3, 5, trim.mid);
  }
}

function paintHive(px: PixelCanvas, trim: ShadeRamp) {
  blob(px, 40, 60, 24, trim);
  blob(px, 24, 46, 13, RAMPS.darkArmor);
  blob(px, 56, 48, 12, RAMPS.darkArmor);
  blob(px, 40, 42, 10, trim);
  px.grit(20, 40, 40, 40, trim.dark, 0.12);
  // Spire with malice drip
  for (let i = 0; i < 30; i++) {
    const half = 6 - Math.floor(i / 6);
    for (let x = -half; x <= half; x++) {
      px.set(40 + x, 38 - i, x === 0 ? trim.hilite : trim.light);
    }
  }
  for (let i = 0; i < 8; i++) {
    px.set(36 + (i % 3), 58 + i, trim.hilite);
    px.set(44 - (i % 2), 50 + i, trim.mid);
  }
  // Eye sockets
  px.circle(32, 52, 4, '#101018');
  px.circle(48, 52, 4, '#101018');
  px.set(32, 52, trim.hilite);
  px.set(48, 52, trim.hilite);
}

function paintPit(px: PixelCanvas, trim: ShadeRamp) {
  px.ellipseFill(40, 72, 28, 10, '#2a1018');
  px.ellipseFill(40, 70, 20, 7, trim.mid);
  px.ellipseFill(40, 69, 12, 4, trim.hilite);
  px.circle(32, 58, 5, trim.mid);
  px.circle(44, 52, 6, trim.light);
  px.circle(38, 44, 4, trim.hilite);
}

function paintAltar(px: PixelCanvas, trim: ShadeRamp, factionId = 0) {
  px.bodyBox(20, 70, 40, 12, RAMPS.darkArmor, 1);
  for (const x of [22, 52]) px.bodyBox(x, 40, 8, 32, trim, 1);
  if (factionId === 5) {
    // Dark Star Rod altar
    px.circle(40, 34, 12, RAMPS.void.mid);
    px.circle(40, 34, 7, RAMPS.void.hilite);
    px.circle(40, 34, 3, '#ffffff');
    star(px, 40, 18, 6, RAMPS.void);
  } else {
    px.circle(40, 34, 12, trim.mid);
    px.circle(40, 34, 8, trim.light);
    px.circle(36, 30, 3, trim.hilite);
    px.circleOutline(40, 34, 15, '#ff6870');
  }
}

function paintNest(px: PixelCanvas, trim: ShadeRamp) {
  blob(px, 40, 62, 18, RAMPS.wood);
  for (const x of [28, 40, 52]) {
    for (let i = 0; i < 18; i++) px.set(x + (i % 3) - 1, 55 - i, trim.mid);
  }
}

function paintVein(px: PixelCanvas, trim: ShadeRamp) {
  blob(px, 40, 68, 12, trim);
  for (const [x, h] of [[34, 28], [40, 36], [48, 24]] as const) {
    for (let i = 0; i < h; i++) {
      px.set(x, 68 - i, i < 2 ? trim.outline : trim.light);
      px.set(x - 1, 68 - i, trim.dark);
    }
  }
}

function paintNexus(px: PixelCanvas, trim: ShadeRamp) {
  // Tiered fountain basin
  px.ellipseFill(40, 78, 32, 8, trim.dark);
  px.ellipseFill(40, 74, 28, 8, trim.mid);
  px.ellipseFill(40, 70, 22, 6, '#ffe8f0');
  px.ellipseFill(40, 68, 14, 4, '#fff8f0');
  // Water shimmer
  for (let i = 0; i < 10; i++) {
    px.set(30 + i * 2, 70, i % 2 ? '#ffffff' : '#ffd0e8');
  }
  // Core orb
  px.circle(40, 46, 16, '#fff0f8');
  px.circle(40, 46, 12, '#ffe0f0');
  px.circleOutline(40, 46, 16, trim.outline);
  px.circleOutline(40, 46, 12, trim.light);
  star(px, 40, 46, 10, trim);
  px.set(36, 40, '#ffffff');
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - 0.3;
    star(px, 40 + Math.cos(a) * 24, 46 + Math.sin(a) * 11, 4, RAMPS.gold);
  }
  // Pillars
  for (const x of [18, 62]) {
    px.rect(x, 50, 4, 24, trim.mid);
    px.rect(x + 1, 50, 2, 24, trim.light);
  }
}

function paintShrine(px: PixelCanvas, trim: ShadeRamp) {
  // Soft Dream Land pavilion — rounded roof, star finial
  px.ellipseFill(40, 78, 28, 8, trim.dark);
  px.bodyBox(20, 52, 40, 24, RAMPS.cloud, 3);
  for (let i = 0; i < 14; i++) {
    const half = 22 - Math.floor(i * 1.2);
    for (let x = 40 - half; x <= 40 + half; x++) {
      px.set(x, 52 - i, i < 2 ? RAMPS.pink.outline : (x < 40 ? RAMPS.pink.mid : RAMPS.pink.light));
    }
  }
  px.bodyBox(34, 28, 12, 26, RAMPS.pink, 2);
  star(px, 40, 22, 8, RAMPS.gold);
  px.set(36, 56, '#ffffff');
  px.set(44, 58, RAMPS.gold.hilite);
}

function paintMatrix(px: PixelCanvas, trim: ShadeRamp) {
  px.bodyBox(16, 70, 48, 12, trim, 1);
  px.bodyBox(26, 38, 28, 34, { outline: '#101828', dark: '#182848', mid: '#284068', light: '#406090', hilite: '#68a0c8' }, 2);
  // Circuits
  for (let i = 0; i < 5; i++) {
    px.rectOutline(30, 44 + i * 5, 20, 4, '#66ffcc');
  }
  star(px, 40, 32, 6, { outline: '#084038', dark: '#208868', mid: '#40c8a0', light: '#68ffcc', hilite: '#b0ffe8' });
}

function paintPlatform(px: PixelCanvas, trim: ShadeRamp, factionId = 0) {
  px.ellipseFill(40, 74, 28, 8, trim.mid);
  px.bodyBox(34, 40, 12, 34, trim, 1);
  star(px, 40, 34, 10, RAMPS.gold);
  px.ellipseFill(40, 78, 12, 3, '#ffc050');
}

function paintCrystal(px: PixelCanvas, trim: ShadeRamp) {
  crystal(px, 40, 48, 14, trim);
  crystal(px, 26, 60, 8, RAMPS.pink);
  crystal(px, 54, 58, 9, RAMPS.gold);
}

function paintDojo(px: PixelCanvas, trim: ShadeRamp) {
  px.bodyBox(16, 52, 48, 30, RAMPS.darkArmor, 1);
  for (const [y, half] of [[52, 30], [40, 26], [28, 20]] as const) {
    for (let i = 0; i < 8; i++) {
      for (let x = 40 - half + i; x <= 40 + half - i; x++) {
        px.set(x, y - i, i < 1 ? trim.outline : trim.mid);
      }
    }
  }
  px.circle(40, 62, 6, trim.light);
  px.rect(37, 60, 2, 4, '#1a1520');
  px.rect(41, 60, 2, 4, '#1a1520');
}

function brickHatch(px: PixelCanvas, x: number, y: number, w: number, h: number, ramp: ShadeRamp) {
  for (let j = 0; j < h; j += 4) {
    for (let i = 0; i < w; i++) {
      if ((i + (j % 8 === 0 ? 0 : 4)) % 8 === 0) px.set(x + i, y + j, ramp.dark);
    }
    for (let i = 0; i < w; i += 8) {
      const ox = (j / 4) % 2 === 0 ? 0 : 4;
      px.set(x + i + ox, y + j + 1, ramp.dark);
      px.set(x + i + ox, y + j + 2, ramp.dark);
    }
  }
}

function blob(px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp) {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const wobble = 1 + 0.15 * Math.sin(i * 0.8) * Math.cos(j * 0.7);
      const d = (i * i + j * j) / (r * r * wobble * wobble);
      if (d > 1) continue;
      const edge = d > 0.82;
      px.set(cx + i, cy + j, edge ? ramp.outline : (i < -2 ? ramp.dark : (i > 3 ? ramp.light : ramp.mid)));
    }
  }
}

function star(px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp) {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const ang = Math.atan2(j, i);
      const dist = Math.hypot(i, j);
      const point = (Math.cos(ang * 5) + 1) * 0.5;
      const maxR = r * (0.4 + point * 0.6);
      if (dist <= maxR) {
        const edge = dist > maxR - 1;
        px.set(cx + i, cy + j, edge ? ramp.outline : (dist < r * 0.3 ? ramp.hilite : ramp.mid));
      }
    }
  }
}

function crystal(px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp) {
  for (let j = -r; j <= r; j++) {
    const half = Math.max(1, Math.floor(r * (1 - Math.abs(j) / r) * 0.7));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || Math.abs(j) === r;
      px.set(cx + i, cy + j, edge ? ramp.outline : (i < 0 ? ramp.light : ramp.dark));
    }
  }
  px.set(cx - 1, cy - Math.floor(r * 0.4), ramp.hilite);
}

function smoke(px: PixelCanvas, cx: number, cy: number) {
  px.circle(cx, cy, 3, '#b0b0b8');
  px.circle(cx - 3, cy - 4, 3, '#c0c0c8');
  px.circle(cx + 2, cy - 7, 2, '#d0d0d8');
}
