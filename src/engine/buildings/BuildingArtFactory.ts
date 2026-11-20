import * as THREE from 'three';
import type { BuildingVisual } from '../../game/buildings/BuildingDefinitions';
import { PixelCanvas, RAMPS, type Hex, type ShadeRamp } from '../art/PixelKit';

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
  buildingTypeId = 0,
): THREE.CanvasTexture {
  const px = new PixelCanvas(W, H);
  px.clear();
  px.contactShadow(40, 90, 22, 4);

  const trim = FACTION_TRIM[factionId] ?? RAMPS.blueArmor;

  // Malice Horde — unique Zelda-evil silhouette per structure
  if (factionId === 1 && paintMaliceBuilding(px, buildingTypeId, visual, trim)) {
    // painted
  } else {
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

/**
 * Route every Malice building id to a distinct Zelda-evil silhouette.
 * Returns true if handled.
 */
function paintMaliceBuilding(
  px: PixelCanvas,
  buildingTypeId: number,
  visual: BuildingVisual,
  trim: ShadeRamp,
): boolean {
  switch (buildingTypeId) {
    case 210: paintCalamityCitadel(px); return true;
    case 211: paintMalicePit(px); return true;
    case 212: paintMoblinWarCamp(px); return true;
    case 213: paintBloodMoonAltar(px); return true;
    case 214: paintGuardianNest(px); return true;
    case 215: paintMaliceVein(px); return true;
    case 216: paintGloomTumor(px); return true;
    case 217: paintSpineBloom(px); return true;
    case 218: paintBlightNest(px); return true;
    case 219: paintGanonCocoon(px); return true;
    default:
      // Fallback by visual category
      if (visual === 'hive') { paintCalamityCitadel(px); return true; }
      if (visual === 'pit') { paintMalicePit(px); return true; }
      if (visual === 'altar') { paintBloodMoonAltar(px); return true; }
      if (visual === 'nest') { paintMoblinWarCamp(px); return true; }
      if (visual === 'vein') { paintMaliceVein(px); return true; }
      void trim;
      return false;
  }
}

/** 210 — Calamity Citadel: Ganon's Castle / Hyrule Castle calamity HQ. */
function paintCalamityCitadel(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  const stone = RAMPS.darkArmor;
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };

  // Twisted fortress base (Ganon's Castle DNA)
  px.bodyBox(12, 50, 56, 32, stone, 2);
  brickHatch(px, 14, 52, 52, 28, stone);
  px.grit(14, 52, 52, 28, malice.dark, 0.12);
  // Malice vein cracks up the walls
  for (const [x, y] of [[20, 56], [21, 60], [22, 64], [58, 54], [57, 58], [56, 62]] as const) {
    px.set(x, y, malice.light);
  }

  // Twin twisted towers with malice flame tips
  for (const x of [8, 58]) {
    px.bodyBox(x, 24, 16, 58, stone, 1);
    brickHatch(px, x + 1, 28, 14, 40, stone);
    for (let i = 0; i < 18; i++) {
      const half = 8 - Math.floor(i / 3);
      for (let dx = -half; dx <= half; dx++) {
        px.set(x + 8 + dx, 24 - i, i < 2 ? malice.outline : (Math.abs(dx) > half - 2 ? malice.dark : malice.mid));
      }
    }
    // Arrow-slit windows with malice glow
    px.rect(x + 6, 36, 4, 10, '#100808');
    px.set(x + 7, 38, malice.hilite);
    px.rect(x + 6, 52, 4, 8, '#100808');
    px.set(x + 7, 54, malice.light);
  }

  // Central Calamity cocoon / hog-beast (BOTW Blight HQ tell)
  blob(px, 40, 46, 18, malice);
  blob(px, 40, 38, 12, gloom);
  blob(px, 40, 42, 8, stone);
  // Glowing eye of Calamity
  px.circle(40, 40, 7, malice.mid);
  px.circle(40, 40, 4, malice.hilite);
  px.set(40, 39, '#ffffff');
  px.set(38, 38, '#ff4060');

  // Spire of gloom piercing sky
  for (let i = 0; i < 32; i++) {
    const half = 6 - Math.floor(i / 6);
    for (let x = -half; x <= half; x++) {
      px.set(40 + x, 32 - i, x === 0 ? malice.hilite : (Math.abs(x) === half ? malice.outline : malice.light));
    }
  }
  px.circle(40, 2, 3, '#ffe0e8');

  // Gate maw (beast mouth entrance)
  px.ellipseFill(40, 72, 14, 12, '#100808');
  px.ellipseFill(40, 70, 10, 8, malice.dark);
  px.ellipseFill(40, 68, 6, 4, gloom.mid);
  // Fang teeth
  for (const x of [32, 36, 44, 48]) px.set(x, 66, '#e8d8b0');
  // Malice drips from battlements
  for (let i = 0; i < 10; i++) {
    px.set(24 + i * 4, 80 + (i % 4), i % 2 ? malice.light : malice.mid);
  }
}

/** 211 — Malice Pit: Zerg spawning pool / BOTW malice puddle bowl. */
function paintMalicePit(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  // Outer gloom stain
  px.ellipseFill(40, 80, 34, 12, '#0c0408');
  px.ellipseFill(40, 78, 30, 10, '#140810');
  px.ellipseFill(40, 74, 26, 9, malice.dark);
  px.ellipseFill(40, 72, 20, 7, malice.mid);
  px.ellipseFill(40, 70, 14, 5, malice.hilite);
  px.ellipseFill(40, 69, 8, 3, '#ff90a0');
  px.set(40, 68, '#ffffff');

  // Bubbling Bokoblin / Gloom larva orbs
  px.circle(26, 56, 8, malice.mid);
  px.circle(26, 54, 4, malice.hilite);
  px.set(26, 52, '#ffffff');
  px.circle(50, 52, 9, malice.light);
  px.circle(50, 50, 4, '#ffb0b8');
  px.set(50, 48, '#ffffff');
  px.circle(40, 46, 7, malice.mid);
  px.circle(40, 44, 3, malice.hilite);
  // Tiny bat-ear hints on larva
  px.set(22, 50, malice.light);
  px.set(30, 50, malice.light);

  // Bone / skull rim (Moblin camp aesthetic)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bx = 40 + Math.round(Math.cos(a) * 28);
    const by = 74 + Math.round(Math.sin(a) * 8);
    px.circle(bx, by, 3, RAMPS.paper.mid);
    if (i % 3 === 0) {
      px.set(bx - 1, by - 1, '#101018');
      px.set(bx + 1, by - 1, '#101018');
    }
  }
  // Rising steam / malice vapor
  for (let i = 0; i < 6; i++) {
    px.set(30 + i * 4, 38 - i * 2, malice.light);
  }
}

/** 212 — Moblin War Camp: classic LoZ Moblin fortress / BOTW bokoblin hideout. */
function paintMoblinWarCamp(px: PixelCanvas) {
  const wood = RAMPS.wood;
  const skin: ShadeRamp = { outline: '#1c2410', dark: '#486030', mid: '#688048', light: '#90a860', hilite: '#b0c880' };
  const malice = RAMPS.redMalice;

  // Palisade stake wall
  for (let i = 0; i < 14; i++) {
    const x = 8 + i * 5;
    const h = 32 + (i % 3) * 4;
    px.rect(x, 82 - h, 4, h, wood.mid);
    px.rect(x, 82 - h, 1, h, wood.dark);
    px.rect(x + 1, 80 - h, 2, 5, wood.light); // sharpened tip
  }
  // Rope lashing
  px.rect(10, 60, 60, 2, wood.dark);
  px.rect(10, 70, 60, 2, wood.dark);

  // Hide tent / bone hut
  px.bodyBox(22, 50, 36, 28, wood, 2);
  for (let i = 0; i < 16; i++) {
    const half = 20 - Math.floor(i * 1.15);
    for (let x = 40 - half; x <= 40 + half; x++) {
      px.set(x, 50 - i, i < 2 ? skin.outline : (x < 40 ? skin.dark : skin.mid));
    }
  }
  // Hide folds
  px.grit(24, 38, 32, 20, skin.dark, 0.1);

  // Tall skull totem pole
  px.rect(36, 22, 5, 26, wood.dark);
  px.circle(38, 20, 9, RAMPS.paper.mid);
  px.circle(38, 20, 7, RAMPS.paper.light);
  px.set(34, 18, '#101018');
  px.set(42, 18, '#101018');
  px.rect(34, 24, 8, 2, '#101018');
  // Horns on totem skull
  px.set(30, 14, RAMPS.paper.mid);
  px.set(46, 14, RAMPS.paper.mid);

  // Malice war banner
  px.rect(58, 24, 3, 36, malice.mid);
  px.rect(61, 24, 14, 12, malice.light);
  px.rect(61, 24, 14, 2, malice.hilite);
  px.circle(68, 30, 3, RAMPS.paper.hilite); // skull mark
  px.set(67, 29, '#101018');
  px.set(69, 29, '#101018');

  // Gate door
  px.rect(32, 64, 16, 16, '#1a1008');
  px.rect(34, 66, 12, 2, wood.mid);
  px.set(38, 72, RAMPS.gold.mid);
  // Watch fire
  px.circle(16, 44, 4, '#ff8040');
  px.circle(16, 42, 2, '#ffe040');
}

/** 213 — Blood Moon Altar: BOTW/TotK Blood Moon ritual circle. */
function paintBloodMoonAltar(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  // Stone dais with steps
  px.bodyBox(12, 72, 56, 12, RAMPS.darkArmor, 1);
  brickHatch(px, 14, 74, 52, 8, RAMPS.darkArmor);
  px.bodyBox(18, 66, 44, 8, RAMPS.stone, 1);

  // Twin ritual pillars with malice caps
  for (const x of [14, 56]) {
    px.bodyBox(x, 30, 12, 42, RAMPS.stone, 1);
    brickHatch(px, x + 1, 34, 10, 30, RAMPS.stone);
    px.rect(x + 2, 28, 8, 6, malice.mid);
    px.rect(x + 3, 26, 6, 3, malice.hilite);
    // Glowing rune slits
    px.set(x + 5, 40, malice.light);
    px.set(x + 5, 50, malice.light);
  }

  // Massive Blood Moon (the defining silhouette)
  px.circle(40, 28, 18, '#400818');
  px.circle(40, 28, 15, malice.dark);
  px.circle(40, 28, 12, malice.mid);
  px.circle(40, 28, 8, malice.light);
  px.circle(34, 22, 5, malice.hilite);
  px.circle(36, 20, 2, '#ffe0e8');
  px.circleOutline(40, 28, 19, '#ff4050');
  px.circleOutline(40, 28, 21, '#801028');

  // Ritual rune circle on floor
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    px.set(40 + Math.round(Math.cos(a) * 16), 76 + Math.round(Math.sin(a) * 5), malice.hilite);
    if (i % 3 === 0) px.set(40 + Math.round(Math.cos(a) * 12), 76 + Math.round(Math.sin(a) * 4), '#ffe040');
  }
  // Offering bowl with gloom
  px.ellipseFill(40, 62, 10, 5, '#100808');
  px.ellipseFill(40, 61, 7, 3, malice.light);
  px.set(40, 60, '#ffffff');
}

/** 214 — Corrupted Guardian Nest: Sheikah tech hatchery + Calamity corruption. */
function paintGuardianNest(px: PixelCanvas) {
  const shell: ShadeRamp = { outline: '#1a2820', dark: '#3a5850', mid: '#588078', light: '#80a8a0', hilite: '#b0d0c8' };
  const ancient = '#48e0b0';
  const malice = RAMPS.redMalice;

  // Ancient Sheikah pedestal / docking bay
  px.bodyBox(18, 62, 44, 22, shell, 2);
  brickHatch(px, 20, 64, 40, 18, shell);
  px.grit(20, 64, 40, 18, shell.dark, 0.12);
  // Malice pooled at base
  px.ellipseFill(40, 82, 24, 6, malice.dark);
  px.ellipseFill(40, 80, 16, 4, malice.mid);

  // Corrupted Guardian dish docked on nest
  for (let j = -16; j <= 12; j++) {
    const half = 18 - Math.floor(Math.abs(j) * 0.5);
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || j === -16;
      const ring = Math.hypot(i, j);
      let hex: Hex = i < 0 ? shell.dark : shell.mid;
      if (edge) hex = shell.outline;
      else if (ring < 6) hex = shell.light;
      px.set(40 + i, 46 + j, hex);
    }
  }
  px.circleOutline(40, 46, 12, ancient);
  px.circleOutline(40, 46, 8, '#28a080');
  px.circleOutline(40, 46, 5, malice.mid);
  // Malice cracks on dish
  for (const [x, y] of [[32, 40], [34, 44], [48, 42], [46, 48]] as const) {
    px.set(x, y, malice.light);
  }

  // Eye stalk upright, charging
  px.rect(37, 14, 6, 30, shell.mid);
  px.rect(38, 14, 4, 30, shell.light);
  px.rect(37, 24, 6, 1, ancient);
  px.sphere(40, 12, 10, shell);
  px.circle(40, 12, 7, malice.mid);
  px.circle(40, 12, 4, malice.hilite);
  px.set(40, 11, '#ffffff');
  px.rect(39, 2, 2, 5, '#ff4060');

  // Legs folded around nest (docked stalker)
  for (const [x, y] of [[14, 56], [26, 72], [54, 72], [66, 56], [16, 40], [64, 40]] as const) {
    px.limb(40, 48, x, y, 1, shell);
    px.circle(x, y, 3, shell.dark);
    px.set(x, y - 1, ancient);
  }
}

/** 215 — Malice Vein: creep extractor / gloom siphon crystal. */
function paintMaliceVein(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };

  // Rooted gloom base
  blob(px, 40, 74, 16, gloom);
  blob(px, 30, 68, 9, RAMPS.darkArmor);
  blob(px, 50, 70, 8, malice);
  px.ellipseFill(40, 82, 18, 5, '#0c0408');

  // Triple siphon crystals (extractor tell)
  for (const [x, h, lean] of [[32, 36, -0.15], [40, 46, 0], [50, 32, 0.18]] as const) {
    for (let i = 0; i < h; i++) {
      const lx = x + Math.round(i * lean);
      const w = i < 4 ? 2 : (i % 5 === 0 ? 2 : 1);
      for (let dx = -w; dx <= w; dx++) {
        px.set(lx + dx, 70 - i, i < 3 ? malice.outline : (dx === 0 ? malice.hilite : (dx < 0 ? malice.dark : malice.light)));
      }
    }
  }
  // Harvest glow at tips
  px.circle(40, 24, 5, malice.hilite);
  px.set(40, 22, '#ffffff');
  px.circle(28, 34, 3, malice.light);
  px.circle(54, 38, 3, malice.light);
  // Drip veins
  for (let i = 0; i < 6; i++) px.set(36 + i, 78 + (i % 2), malice.mid);
}

/** 216 — Gloom Tumor: TotK gloom root node / forward creep tumor. */
function paintGloomTumor(px: PixelCanvas) {
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };
  const malice = RAMPS.redMalice;

  // Bulging tumor mass
  blob(px, 40, 60, 18, gloom);
  blob(px, 26, 68, 10, RAMPS.darkArmor);
  blob(px, 54, 66, 10, gloom);
  blob(px, 40, 70, 12, malice);
  px.grit(24, 50, 32, 28, '#080010', 0.2);

  // Eye cluster (gloom watching)
  px.circle(40, 56, 6, malice.mid);
  px.circle(40, 56, 3, malice.hilite);
  px.set(40, 55, '#ffffff');
  px.circle(30, 62, 4, malice.light);
  px.set(30, 61, '#ffffff');
  px.circle(50, 60, 4, malice.hilite);
  px.set(50, 59, '#ffffff');
  px.circle(36, 68, 2, malice.mid);
  px.circle(44, 66, 2, malice.light);

  // Root tendrils spreading creep
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    for (let d = 0; d < 16; d++) {
      px.set(
        40 + Math.round(Math.cos(ang) * (10 + d)),
        72 + Math.round(Math.sin(ang) * (5 + d * 0.45)),
        d < 3 ? gloom.hilite : (d % 2 ? gloom.mid : gloom.light),
      );
    }
  }
}

/** 217 — Spine Bloom: Zerg spine crawler / malice thorn turret. */
function paintSpineBloom(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  // Creep base pad
  px.ellipseFill(40, 80, 26, 8, '#140810');
  blob(px, 40, 72, 14, malice);
  blob(px, 32, 76, 7, RAMPS.darkArmor);
  blob(px, 48, 76, 7, RAMPS.darkArmor);

  // Segmented vertical spine shaft
  for (let i = 0; i < 44; i++) {
    const half = 4 + (i % 7 === 0 ? 3 : 0);
    for (let x = -half; x <= half; x++) {
      px.set(40 + x, 68 - i, Math.abs(x) === half ? malice.outline : (x < 0 ? malice.dark : malice.mid));
    }
    if (i % 7 === 0) {
      px.set(40 - half - 1, 68 - i, malice.hilite);
      px.set(40 + half + 1, 68 - i, malice.hilite);
    }
  }

  // Thorn petal crown (firing bloom)
  for (let a = 0; a < 7; a++) {
    const ang = -Math.PI / 2 + (a - 3) * 0.4;
    for (let d = 0; d < 18; d++) {
      const x = 40 + Math.round(Math.cos(ang) * d);
      const y = 28 + Math.round(Math.sin(ang) * d);
      px.set(x, y, d < 3 ? malice.hilite : (d % 2 ? malice.light : malice.mid));
      if (d === 17) px.set(x, y, '#ffe0e8');
    }
  }
  px.circle(40, 26, 5, '#ffe0e8');
  px.set(40, 24, '#ffffff');
}

/** 218 — Blight Nest: satellite hatchery / Divine Beast Blight shrine. */
function paintBlightNest(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };

  // Organic blight mass
  blob(px, 40, 64, 22, malice);
  blob(px, 22, 54, 12, RAMPS.darkArmor);
  blob(px, 58, 56, 12, RAMPS.darkArmor);
  blob(px, 40, 48, 10, gloom);
  px.grit(20, 48, 40, 30, gloom.dark, 0.14);

  // Blight Ganon mask face (Waterblight / Fireblight DNA)
  px.ellipseFill(40, 50, 14, 16, RAMPS.darkArmor.mid);
  px.ellipseFill(40, 50, 10, 12, RAMPS.darkArmor.dark);
  // Glowing blight eyes
  px.circle(32, 46, 4, malice.hilite);
  px.circle(48, 46, 4, malice.hilite);
  px.set(32, 45, '#ffffff');
  px.set(48, 45, '#ffffff');
  // Maw
  px.rect(32, 56, 16, 4, '#100808');
  px.rect(34, 57, 12, 1, malice.light);
  // Curved blight horns
  for (let i = 0; i < 14; i++) {
    px.set(26 - i, 38 - Math.floor(i * 0.7), malice.mid);
    px.set(27 - i, 38 - Math.floor(i * 0.7), malice.light);
    px.set(54 + i, 38 - Math.floor(i * 0.7), malice.mid);
    px.set(53 + i, 38 - Math.floor(i * 0.7), malice.light);
  }
  // Creep skirt drips
  for (let i = 0; i < 12; i++) {
    px.set(22 + i * 3, 76 + (i % 5), i % 2 ? malice.light : malice.mid);
  }
  // Mini larva buds
  px.circle(24, 68, 4, malice.mid);
  px.circle(56, 70, 4, malice.light);
}

/** 219 — Ganon's Cocoon: morph chamber / Calamity chrysalis. */
function paintGanonCocoon(px: PixelCanvas) {
  const malice = RAMPS.redMalice;
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };

  // Chrysalis oval membrane
  for (let j = -30; j <= 28; j++) {
    const half = Math.floor(20 * Math.sqrt(Math.max(0, 1 - (j / 32) ** 2)));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || Math.abs(j) === 30;
      const vein = (i + j * 2) % 6 === 0;
      let hex: Hex = malice.mid;
      if (edge) hex = malice.outline;
      else if (vein) hex = malice.hilite;
      else if (i < -5) hex = malice.dark;
      else if (i > 6) hex = malice.light;
      else if (Math.abs(j) > 18) hex = gloom.mid;
      px.set(40 + i, 48 + j, hex);
    }
  }
  // Beast / Calamity silhouette within (boar-king morph)
  px.ellipseFill(40, 52, 10, 16, '#1a0810');
  px.circle(40, 38, 7, '#2a1018');
  // Horn hints inside membrane
  px.set(32, 30, '#1a0810');
  px.set(48, 30, '#1a0810');
  // Glowing eye through membrane
  px.circle(40, 40, 4, '#ffe040');
  px.circle(40, 40, 2, '#ffffff');
  px.set(38, 38, malice.hilite);
  // Membrane stress cracks
  for (const [x, y] of [[30, 44], [31, 48], [50, 46], [49, 52]] as const) {
    px.set(x, y, gloom.hilite);
  }
  // Base roots / morph cradle
  blob(px, 40, 80, 18, RAMPS.darkArmor);
  blob(px, 28, 78, 8, gloom);
  blob(px, 52, 78, 8, gloom);
  for (let i = 0; i < 6; i++) {
    px.set(28 + i * 4, 82, malice.mid);
  }
}

function paintHive(px: PixelCanvas, trim: ShadeRamp) {
  // Generic organic hive (non-Malice callers); Malice uses paintCalamityCitadel
  blob(px, 40, 60, 24, trim);
  blob(px, 24, 46, 13, RAMPS.darkArmor);
  blob(px, 56, 48, 12, RAMPS.darkArmor);
  blob(px, 40, 42, 10, trim);
  px.grit(20, 40, 40, 40, trim.dark, 0.12);
  for (let i = 0; i < 30; i++) {
    const half = 6 - Math.floor(i / 6);
    for (let x = -half; x <= half; x++) {
      px.set(40 + x, 38 - i, x === 0 ? trim.hilite : trim.light);
    }
  }
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
  if (factionId === 5) {
    px.bodyBox(20, 70, 40, 12, RAMPS.darkArmor, 1);
    for (const x of [22, 52]) px.bodyBox(x, 40, 8, 32, trim, 1);
    px.circle(40, 34, 12, RAMPS.void.mid);
    px.circle(40, 34, 7, RAMPS.void.hilite);
    px.circle(40, 34, 3, '#ffffff');
    star(px, 40, 18, 6, RAMPS.void);
  } else {
    px.bodyBox(20, 70, 40, 12, RAMPS.darkArmor, 1);
    for (const x of [22, 52]) px.bodyBox(x, 40, 8, 32, trim, 1);
    px.circle(40, 34, 12, trim.mid);
    px.circle(40, 34, 8, trim.light);
    px.circle(36, 30, 3, trim.hilite);
    px.circleOutline(40, 34, 15, '#ff6870');
  }
}

function paintNest(px: PixelCanvas, trim: ShadeRamp) {
  // Void / generic nest (Scarfy etc.) — Malice uses dedicated camp/guardian painters
  blob(px, 40, 62, 18, RAMPS.wood);
  blob(px, 40, 54, 10, trim);
  for (const x of [28, 40, 52]) {
    for (let i = 0; i < 18; i++) px.set(x + (i % 3) - 1, 55 - i, trim.mid);
  }
  px.circle(40, 58, 4, trim.hilite);
  px.set(40, 57, '#ffffff');
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
