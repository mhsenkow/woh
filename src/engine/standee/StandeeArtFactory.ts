import * as THREE from 'three';
import { PixelCanvas, RAMPS, paintEyes, paintGlowEyes, type ShadeRamp } from '../art/PixelKit';

export type StandeeArtKind =
  | 'hero-hyrule'
  | 'soldier-hyrule'
  | 'siege-hyrule'
  | 'healer-hyrule'
  | 'swimmer-hyrule'
  | 'hero-malice'
  | 'bokoblin-malice'
  | 'moblin-malice'
  | 'lizalfos-malice'
  | 'guardian-malice'
  | 'hero-mushroom'
  | 'toad-mushroom'
  | 'guard-mushroom'
  | 'hammerbro-mushroom'
  | 'lakitu-mushroom'
  | 'chomp-mushroom'
  | 'hero-koopa'
  | 'troopa-koopa'
  | 'bill-koopa'
  | 'magikoopa-koopa'
  | 'airship-koopa'
  | 'hero-dreamland'
  | 'waddle-dreamland'
  | 'metaknight-dreamland'
  | 'warpstar-dreamland'
  | 'hero-nightmare'
  | 'doo-nightmare'
  | 'darkmatter-nightmare'
  | 'scarfy-nightmare'
  | 'zero-nightmare'
  | 'default';

const W = 64;
const H = 96;
const SCALE = 8;

/**
 * Chrono Trigger–tier pixel standees.
 * Drawn at 64×96 native SNES-like resolution, nearest-upscaled ×8.
 */
export function createStandeeArtTexture(kind: StandeeArtKind, _size = 512): THREE.CanvasTexture {
  const px = new PixelCanvas(W, H);
  px.clear();
  px.contactShadow(32, 90, 14, 4);

  switch (kind) {
    case 'hero-hyrule': paintLink(px); break;
    case 'soldier-hyrule': paintSoldier(px); break;
    case 'siege-hyrule': paintGoron(px); break;
    case 'healer-hyrule': paintFairy(px); break;
    case 'swimmer-hyrule': paintZora(px); break;
    case 'hero-malice': paintGanon(px); break;
    case 'bokoblin-malice': paintBokoblin(px); break;
    case 'moblin-malice': paintMoblin(px); break;
    case 'lizalfos-malice': paintLizalfos(px); break;
    case 'guardian-malice': paintGuardian(px); break;
    case 'hero-mushroom': paintMario(px); break;
    case 'toad-mushroom': paintToad(px); break;
    case 'guard-mushroom': paintMushroomGuard(px); break;
    case 'hammerbro-mushroom': paintHammerBro(px); break;
    case 'lakitu-mushroom': paintLakitu(px); break;
    case 'chomp-mushroom': paintChainChomp(px); break;
    case 'hero-koopa': paintBowser(px); break;
    case 'troopa-koopa': paintKoopaTroopa(px); break;
    case 'bill-koopa': paintBulletBill(px); break;
    case 'magikoopa-koopa': paintMagikoopa(px); break;
    case 'airship-koopa': paintAirship(px); break;
    case 'hero-dreamland': paintKirby(px); break;
    case 'waddle-dreamland': paintWaddle(px); break;
    case 'metaknight-dreamland': paintMeta(px); break;
    case 'warpstar-dreamland': paintWarpStar(px); break;
    case 'hero-nightmare': paintMarx(px); break;
    case 'doo-nightmare': paintWaddleDoo(px); break;
    case 'darkmatter-nightmare': paintDarkMatter(px); break;
    case 'scarfy-nightmare': paintScarfy(px); break;
    case 'zero-nightmare': paintZeroEye(px); break;
    default: paintSoldier(px);
  }

  const border =
    kind.includes('malice') || kind.includes('nightmare') ? '#f0e0e0' :
    kind.includes('dream') ? '#fff4d0' :
    kind.includes('mushroom') ? '#ffe8e0' :
    kind.includes('koopa') ? '#e8ffe0' :
    '#ffffff';
  px.dieCut(border);

  return px.toTexture(SCALE);
}

export function artKindForUnit(unitTypeId: number, isElite: boolean, factionId: number): StandeeArtKind {
  if (isElite) {
    if (factionId === 0) return 'hero-hyrule';
    if (factionId === 1) return 'hero-malice';
    if (factionId === 2) return 'hero-mushroom';
    if (factionId === 3) return 'hero-koopa';
    if (factionId === 4) return 'hero-dreamland';
    if (factionId === 5) return 'hero-nightmare';
    return 'hero-hyrule';
  }
  switch (unitTypeId) {
    case 100: return 'soldier-hyrule';
    case 101: return 'siege-hyrule';
    case 102: return 'swimmer-hyrule';
    case 104: return 'healer-hyrule';
    case 110: case 114: return 'bokoblin-malice';
    case 111: return 'moblin-malice';
    case 112: return 'lizalfos-malice';
    case 113: return 'guardian-malice';
    case 120: return 'toad-mushroom';
    case 121: return 'guard-mushroom';
    case 122: return 'hammerbro-mushroom';
    case 123: return 'lakitu-mushroom';
    case 124: return 'chomp-mushroom';
    case 130: return 'troopa-koopa';
    case 131: return 'bill-koopa';
    case 132: return 'magikoopa-koopa';
    case 133: return 'hammerbro-mushroom';
    case 134: return 'airship-koopa';
    case 140: case 144: return 'waddle-dreamland';
    case 141: case 142: return 'metaknight-dreamland';
    case 143: return 'warpstar-dreamland';
    case 150: return 'doo-nightmare';
    case 151: return 'darkmatter-nightmare';
    case 152: return 'scarfy-nightmare';
    case 153: case 154: return 'zero-nightmare';
    default:
      if (factionId === 0) return 'soldier-hyrule';
      if (factionId === 1) return 'bokoblin-malice';
      if (factionId === 2) return 'toad-mushroom';
      if (factionId === 3) return 'troopa-koopa';
      if (factionId === 4) return 'waddle-dreamland';
      if (factionId === 5) return 'doo-nightmare';
      return 'soldier-hyrule';
  }
}

// ─── Character painters (feet ~y=88, head ~y=20) ────────────────────────────

function paintLink(px: PixelCanvas) {
  const tunic = RAMPS.greenCloth;
  const skin = RAMPS.skin;
  const gold = RAMPS.gold;
  const steel = RAMPS.silver;
  const boot: ShadeRamp = { outline: '#201008', dark: '#3a2410', mid: '#5a3820', light: '#7a5030', hilite: '#9a6840' };

  // Legs with fold shading
  px.limb(27, 88, 26, 66, 2, tunic);
  px.limb(37, 88, 38, 66, 2, tunic);
  px.bandShade(24, 70, 6, 10, tunic);
  px.bandShade(35, 70, 6, 10, tunic);
  // Boots with sole
  px.bodyBox(22, 84, 8, 6, boot, 1);
  px.bodyBox(35, 84, 8, 6, boot, 1);
  px.rect(22, 89, 8, 1, boot.outline);
  px.rect(35, 89, 8, 1, boot.outline);

  // Tunic body — layered CT cloth
  px.bodyBox(23, 46, 18, 24, tunic, 2);
  px.bandShade(25, 48, 14, 18, tunic);
  px.grit(25, 48, 14, 18, tunic.dark, 0.08);
  // Collar / neckline
  px.rect(28, 46, 8, 2, tunic.light);
  // Belt + buckle
  px.rect(23, 64, 18, 3, gold.mid);
  px.rect(23, 64, 18, 1, gold.light);
  px.rect(30, 64, 4, 3, gold.hilite);
  px.set(31, 65, '#fff8c0');
  // Pouches
  px.rect(24, 67, 4, 4, boot.mid);
  px.rect(37, 67, 4, 4, boot.mid);

  // Arms
  px.limb(23, 50, 14, 62, 2, tunic);
  px.limb(41, 50, 50, 62, 2, tunic);
  px.circle(13, 64, 3, skin.mid);
  px.circle(51, 64, 3, skin.mid);
  px.set(12, 63, skin.light);
  px.set(52, 63, skin.light);

  // Hylian shield — layered emblem
  px.bodyBox(6, 52, 11, 14, gold, 2);
  px.rect(8, 54, 7, 10, gold.light);
  px.rect(9, 56, 5, 6, tunic.mid);
  px.set(11, 58, gold.hilite);
  px.set(11, 60, '#2868b0');
  px.rectOutline(6, 52, 11, 14, gold.outline);

  // Master Sword
  px.rect(52, 26, 2, 40, steel.light);
  px.rect(53, 26, 1, 40, steel.hilite);
  px.rect(51, 28, 1, 6, steel.mid); // fuller
  px.rect(50, 62, 6, 3, gold.mid);
  px.rect(51, 61, 4, 1, gold.hilite);
  px.rect(52, 65, 2, 6, boot.mid); // grip
  px.set(53, 24, steel.hilite); // tip glint

  // Head
  px.sphere(32, 36, 8, skin);
  // Cap (long pointed)
  const cap = tunic;
  for (let i = -8; i <= 14; i++) {
    const yOff = Math.floor(Math.abs(Math.min(i, 8)) * 0.3) + (i > 8 ? Math.floor((i - 8) * 0.8) : 0);
    const y = 28 - yOff;
    px.set(32 + i, y, i < 4 ? cap.light : cap.mid);
    px.set(32 + i, y + 1, cap.mid);
    px.set(32 + i, y - 1, cap.outline);
  }
  px.rect(25, 27, 14, 3, cap.outline);
  // Blonde fringe
  px.hairCap(32, 32, 7, 4, { outline: '#604010', dark: '#c09028', mid: '#e0b848', light: '#f0d070', hilite: '#fff0a0' });
  paintEyes(px, 28, 36, 36, 36);
  // Nose + smile
  px.set(32, 39, skin.dark);
  px.set(30, 41, skin.dark);
  px.set(31, 42, skin.dark);
  px.set(32, 42, skin.dark);
  px.set(33, 42, skin.dark);
  px.set(34, 41, skin.dark);
}

function paintSoldier(px: PixelCanvas) {
  const armor = RAMPS.blueArmor;
  const skin = RAMPS.skin;
  const steel = RAMPS.silver;
  const pants: ShadeRamp = { outline: '#101820', dark: '#1a2838', mid: '#2a3a50', light: '#3a4a60', hilite: '#586878' };

  px.limb(27, 88, 26, 68, 2, pants);
  px.limb(37, 88, 38, 68, 2, pants);
  px.bodyBox(23, 84, 7, 5, RAMPS.darkArmor, 1);
  px.bodyBox(35, 84, 7, 5, RAMPS.darkArmor, 1);

  // Cuirass with plate lines
  px.bodyBox(22, 48, 20, 24, armor, 2);
  px.rect(26, 52, 12, 14, armor.light);
  px.rect(28, 54, 8, 10, armor.hilite);
  px.rect(30, 56, 4, 2, '#ffe8a0'); // crest gem
  // Rivets
  for (const [x, y] of [[24, 50], [39, 50], [24, 66], [39, 66]] as const) {
    px.set(x, y, steel.hilite);
  }
  px.grit(24, 50, 16, 18, armor.dark, 0.1);

  px.limb(22, 52, 14, 66, 2, armor);
  px.limb(42, 52, 50, 66, 2, armor);
  px.circle(13, 68, 2, skin.mid);
  px.circle(51, 68, 2, skin.mid);

  // Spear with tip detail
  px.rect(52, 16, 2, 58, RAMPS.wood.mid);
  px.rect(53, 16, 1, 58, RAMPS.wood.light);
  px.rect(50, 14, 6, 6, steel.light);
  px.set(53, 12, steel.hilite);
  px.rect(51, 18, 4, 1, steel.mid);

  // Helmet
  px.sphere(32, 38, 7, skin);
  px.bodyBox(23, 28, 18, 12, steel, 2);
  px.rect(25, 30, 14, 8, steel.light);
  px.rect(30, 24, 4, 8, steel.mid); // crest
  px.rect(31, 22, 2, 4, steel.hilite);
  // Visor slit
  px.rect(26, 34, 12, 2, '#101018');
  paintEyes(px, 28, 38, 36, 38);
}

function paintGoron(px: PixelCanvas) {
  const rock: ShadeRamp = { outline: '#2a1810', dark: '#705040', mid: '#987058', light: '#b89070', hilite: '#d8b090' };
  const stone: ShadeRamp = { outline: '#282018', dark: '#585040', mid: '#787060', light: '#989080', hilite: '#b8b0a0' };

  px.sphere(24, 80, 7, rock);
  px.sphere(40, 80, 7, rock);
  px.sphere(32, 58, 20, rock);
  px.grit(16, 42, 32, 36, rock.dark, 0.14);
  px.sphere(32, 40, 13, rock);
  px.sphere(12, 56, 8, rock);
  px.sphere(52, 56, 8, rock);

  // Belly plate cracks
  px.dither(24, 54, 16, 12, rock.mid, rock.light);
  px.rect(18, 56, 28, 5, RAMPS.orange.mid);
  px.rect(18, 57, 28, 2, RAMPS.orange.light);
  px.rect(28, 55, 8, 7, RAMPS.orange.hilite);

  paintEyes(px, 26, 38, 38, 38);
  // Broad smile + teeth
  for (let i = -4; i <= 4; i++) px.set(32 + i, 46 + (Math.abs(i) > 2 ? 1 : 0), rock.outline);
  px.rect(29, 47, 2, 2, '#fff8f0');
  px.rect(33, 47, 2, 2, '#fff8f0');

  // Boulder weapon
  px.sphere(54, 38, 10, stone);
  px.grit(46, 30, 16, 16, stone.dark, 0.2);
  px.set(50, 34, stone.hilite);
}

function paintFairy(px: PixelCanvas) {
  // Soft aura rings
  for (let r = 20; r > 11; r -= 2) {
    px.circleOutline(32, 50, r, r % 4 === 0 ? '#ffe0f0' : '#fff0f8');
  }
  // Wings — translucent panes
  for (const [cx, cy] of [[16, 42], [48, 42], [14, 52], [50, 52]] as const) {
    px.circle(cx, cy, 7, '#c8e0ff');
    px.circle(cx - 1, cy - 1, 3, '#e8f4ff');
    px.circleOutline(cx, cy, 7, '#88b0e0');
  }
  px.sphere(32, 52, 11, { outline: '#e8b0c8', dark: '#f0c0d8', mid: '#ffe0f0', light: '#fff0f8', hilite: '#ffffff' });
  paintEyes(px, 28, 50, 36, 50);
  px.set(30, 56, '#e090b0');
  px.set(31, 57, '#e090b0');
  px.set(32, 57, '#e090b0');
  px.set(33, 57, '#e090b0');
  px.set(34, 56, '#e090b0');
  paintStar(px, 32, 28, 6, RAMPS.gold);
  // Sparkles
  for (const [x, y] of [[18, 30], [46, 28], [22, 68], [44, 70], [32, 18]] as const) {
    px.set(x, y, '#ffffff');
    px.set(x + 1, y, '#ffe080');
  }
}

function paintZora(px: PixelCanvas) {
  const zora: ShadeRamp = { outline: '#082838', dark: '#187898', mid: '#38a8c8', light: '#68c8e0', hilite: '#a0e8f8' };

  // Tail with scale dither
  for (let i = 0; i < 14; i++) {
    const r = 5 - Math.floor(i / 4);
    px.circle(26 - i, 78 + Math.floor(i * 0.45), r, i % 2 ? zora.mid : zora.light);
  }
  px.bodyBox(23, 46, 18, 30, zora, 4);
  px.dither(25, 50, 14, 20, zora.mid, zora.light);
  px.rect(23, 60, 18, 4, RAMPS.blueArmor.mid);
  px.rect(23, 61, 18, 1, RAMPS.blueArmor.light);

  px.sphere(32, 38, 9, zora);
  // Head crest
  for (let i = 0; i < 12; i++) {
    px.set(32, 28 - i, RAMPS.gold.mid);
    px.set(31, 28 - i, RAMPS.gold.dark);
    px.set(33, 28 - i, RAMPS.gold.light);
    if (i % 3 === 0) px.set(32, 28 - i, RAMPS.gold.hilite);
  }
  // Side fins
  px.circle(20, 40, 4, zora.light);
  px.circle(44, 40, 4, zora.light);
  paintEyes(px, 28, 38, 36, 38);
  // Silver spear
  px.rect(50, 24, 2, 48, zora.light);
  px.rect(49, 22, 4, 5, RAMPS.silver.hilite);
}

function paintGanon(px: PixelCanvas) {
  const armor = RAMPS.darkArmor;
  const skin = RAMPS.skin;
  const malice = RAMPS.redMalice;

  px.limb(25, 88, 23, 66, 3, armor);
  px.limb(39, 88, 41, 66, 3, armor);
  px.bodyBox(18, 42, 28, 30, armor, 2);
  px.bandShade(20, 44, 24, 24, armor);
  // Malice veins
  for (const [x, y] of [[26, 48], [27, 50], [28, 53], [29, 56], [38, 46], [39, 49], [40, 52]] as const) {
    px.set(x, y, malice.light);
    px.set(x + 1, y + 1, malice.mid);
  }
  // Cape layers
  for (let j = 0; j < 34; j++) {
    for (let i = -18; i <= 18; i++) {
      if (Math.abs(i) > 11 + j / 2.8) continue;
      const edge = Math.abs(i) > 9 + j / 3;
      px.set(32 + i, 46 + j, edge ? malice.outline : (i < -5 ? '#2a0810' : '#4a1020'));
    }
  }
  px.grit(16, 48, 32, 28, malice.dark, 0.1);

  // Greatsword
  px.rect(52, 18, 3, 52, RAMPS.silver.dark);
  px.rect(53, 18, 1, 52, RAMPS.silver.mid);
  px.rect(50, 66, 8, 4, malice.mid);
  px.rect(51, 65, 6, 1, malice.hilite);

  px.sphere(32, 32, 10, skin);
  // Wild red mane
  px.hairCap(32, 28, 12, 16, malice, true);
  for (let i = -12; i <= 12; i++) {
    if (Math.abs(i) % 4 === 0) {
      for (let j = 0; j < 6; j++) px.set(32 + i + (j % 2), 12 + j, malice.light);
    }
  }
  paintGlowEyes(px, 27, 31, 36, 31, malice.hilite);
  // Snarl
  px.rect(28, 38, 8, 2, skin.dark);
  px.set(29, 39, '#fff0e0');
  px.set(33, 39, '#fff0e0');
}

function paintBokoblin(px: PixelCanvas) {
  // Classic BOTW pig-snout Bokoblin — round belly, bat ears, bone club
  const skin: ShadeRamp = { outline: '#183018', dark: '#3a7840', mid: '#58a060', light: '#78c078', hilite: '#a0e0a0' };

  px.limb(26, 88, 25, 72, 2, skin);
  px.limb(38, 88, 39, 72, 2, skin);
  px.sphere(32, 64, 16, skin);
  px.grit(18, 50, 28, 28, skin.dark, 0.12);
  px.rect(22, 68, 20, 5, RAMPS.wood.mid);
  px.rect(22, 69, 20, 1, RAMPS.wood.light);
  px.sphere(14, 62, 6, skin);
  px.sphere(50, 62, 6, skin);

  // Bone club
  px.rect(48, 36, 6, 30, RAMPS.paper.mid);
  px.rect(49, 36, 2, 30, RAMPS.paper.light);
  px.circle(51, 34, 5, RAMPS.paper.hilite);
  px.set(49, 32, RAMPS.paper.dark);
  px.set(53, 32, RAMPS.paper.dark);

  px.sphere(32, 40, 13, skin);
  // Big pig snout
  px.ellipseFill(32, 46, 8, 5, '#489050');
  px.set(29, 46, skin.outline);
  px.set(35, 46, skin.outline);
  // Bat ears
  for (let i = 0; i < 8; i++) {
    px.set(18 - i, 34 - Math.floor(i * 0.5), skin.mid);
    px.set(46 + i, 34 - Math.floor(i * 0.5), skin.mid);
    px.set(18 - i, 33 - Math.floor(i * 0.5), skin.light);
  }
  px.set(24, 26, RAMPS.orange.mid);
  px.set(40, 26, RAMPS.orange.mid);
  paintEyes(px, 25, 36, 39, 36);
  // Toothy grin
  px.rect(27, 52, 10, 2, skin.outline);
  px.set(28, 52, '#fff8f0');
  px.set(32, 52, '#fff8f0');
  px.set(36, 52, '#fff8f0');
}

function paintMoblin(px: PixelCanvas) {
  const skin: ShadeRamp = { outline: '#202818', dark: '#506038', mid: '#708050', light: '#90a068', hilite: '#b0c088' };

  px.limb(25, 88, 23, 64, 3, skin);
  px.limb(39, 88, 41, 64, 3, skin);
  px.bodyBox(16, 40, 32, 30, skin, 3);
  px.bandShade(18, 42, 28, 24, skin);
  px.rect(20, 54, 24, 8, RAMPS.wood.dark);
  px.rect(20, 55, 24, 2, RAMPS.wood.mid);
  px.sphere(10, 50, 7, skin);
  px.sphere(54, 50, 7, skin);

  // Pike
  px.rect(55, 14, 3, 52, RAMPS.wood.mid);
  px.rect(54, 12, 5, 6, RAMPS.silver.light);
  px.set(57, 10, RAMPS.silver.hilite);

  px.sphere(32, 30, 11, skin);
  // Curved horns
  for (let i = 0; i < 10; i++) {
    px.set(20 - i, 24 - Math.floor(i * 0.9), RAMPS.orange.mid);
    px.set(21 - i, 24 - Math.floor(i * 0.9), RAMPS.orange.light);
    px.set(44 + i, 24 - Math.floor(i * 0.9), RAMPS.orange.mid);
    px.set(43 + i, 24 - Math.floor(i * 0.9), RAMPS.orange.dark);
  }
  px.bodyBox(25, 32, 14, 7, { ...skin, mid: '#607040' }, 2);
  paintEyes(px, 26, 28, 38, 28);
}

function paintLizalfos(px: PixelCanvas) {
  const skin: ShadeRamp = { outline: '#082818', dark: '#208050', mid: '#38a868', light: '#58c888', hilite: '#88e8b0' };

  px.limb(27, 88, 20, 68, 2, skin);
  px.limb(37, 88, 44, 68, 2, skin);
  px.bodyBox(23, 46, 18, 26, skin, 3);
  px.dither(25, 48, 14, 20, skin.mid, skin.light);
  // Tail
  for (let i = 0; i < 18; i++) {
    px.circle(42 + i, 72 - Math.floor(i * 0.35), 4 - Math.floor(i / 6), i % 2 ? skin.mid : skin.light);
  }
  px.sphere(32, 38, 8, skin);
  for (let i = 0; i < 10; i++) {
    px.set(32, 30 - i, RAMPS.gold.mid);
    px.set(31, 30 - i, RAMPS.gold.dark);
  }
  paintEyes(px, 28, 38, 36, 38);
  // Boomerang
  px.rect(10, 48, 12, 3, RAMPS.silver.mid);
  px.rect(10, 47, 3, 5, RAMPS.silver.light);
  px.rect(19, 47, 3, 5, RAMPS.silver.light);
}

function paintGuardian(px: PixelCanvas) {
  const shell = RAMPS.stone;
  px.sphere(32, 56, 17, shell);
  px.grit(18, 42, 28, 28, shell.dark, 0.18);
  // Ancient markings
  px.circleOutline(32, 56, 10, '#48c8a0');
  px.circleOutline(32, 56, 6, '#28a080');
  for (const [x, y] of [[12, 72], [20, 80], [44, 80], [52, 72], [14, 48], [50, 48]] as const) {
    px.limb(32, 56, x, y, 1, shell);
    px.circle(x, y, 3, shell.dark);
    px.set(x, y - 1, '#48c8a0');
  }
  // Eye stalk
  px.rect(30, 26, 4, 20, shell.mid);
  px.rect(31, 26, 2, 20, shell.light);
  px.sphere(32, 24, 9, shell);
  px.circle(32, 24, 6, RAMPS.redMalice.mid);
  px.circle(32, 24, 3, RAMPS.redMalice.hilite);
  px.set(32, 23, '#ffffff');
  px.set(31, 24, '#ff2040');
}

function paintKirby(px: PixelCanvas) {
  const pink = RAMPS.pink;
  // Classic Kirby feet — oval red shoes
  px.ellipseFill(20, 82, 10, 5, '#c02840');
  px.ellipseFill(44, 82, 10, 5, '#c02840');
  px.ellipseFill(20, 81, 8, 3, '#e04058');
  px.ellipseFill(44, 81, 8, 3, '#e04058');

  px.sphere(32, 52, 22, pink);
  // Arms
  px.sphere(10, 56, 8, pink);
  px.sphere(54, 56, 8, pink);
  // Classic blush cheeks
  px.circle(16, 58, 5, '#ff7090');
  px.circle(48, 58, 5, '#ff7090');
  // Tall oval eyes (Dream Land signature)
  px.rect(23, 40, 6, 14, '#101828');
  px.rect(35, 40, 6, 14, '#101828');
  px.rect(24, 41, 4, 5, '#ffffff');
  px.rect(36, 41, 4, 5, '#ffffff');
  px.rect(25, 48, 3, 3, '#2858a0');
  px.rect(37, 48, 3, 3, '#2858a0');
  // Tiny smile
  for (let i = -2; i <= 2; i++) px.set(32 + i, 64 + (Math.abs(i) === 2 ? 0 : 1), pink.dark);
  paintStar(px, 32, 20, 7, RAMPS.gold);
}

function paintWaddle(px: PixelCanvas) {
  const body = RAMPS.orange;
  px.ellipseFill(20, 84, 8, 4, '#903818');
  px.ellipseFill(44, 84, 8, 4, '#903818');
  px.sphere(32, 56, 18, body);
  px.grit(16, 42, 32, 30, body.dark, 0.07);
  // Bandana Dee signature wrap + trailing knot
  px.rect(14, 38, 36, 8, RAMPS.blueArmor.mid);
  px.rect(14, 39, 36, 3, RAMPS.blueArmor.light);
  px.rect(14, 44, 36, 1, RAMPS.blueArmor.dark);
  px.rect(48, 40, 12, 5, RAMPS.blueArmor.dark);
  px.rect(52, 41, 6, 3, RAMPS.blueArmor.mid);
  paintEyes(px, 24, 52, 40, 52);
  // Smile
  for (let i = -2; i <= 2; i++) px.set(32 + i, 62, body.outline);
  // Spear
  px.rect(52, 22, 2, 46, RAMPS.wood.mid);
  px.rect(51, 20, 4, 6, RAMPS.silver.light);
  px.set(53, 18, RAMPS.silver.hilite);
}

function paintMeta(px: PixelCanvas) {
  const cape = RAMPS.redMalice;
  const body: ShadeRamp = { outline: '#101828', dark: '#203060', mid: '#304890', light: '#5070c0', hilite: '#88a0e0' };

  for (let j = 0; j < 42; j++) {
    for (let i = -22; i <= 22; i++) {
      if (Math.abs(i) > 10 + j / 2.1) continue;
      px.set(32 + i, 46 + j, i < 0 ? cape.dark : cape.mid);
    }
  }
  px.grit(12, 48, 40, 34, cape.outline, 0.06);

  px.sphere(32, 50, 16, body);
  // Bat-wing mask
  px.bodyBox(18, 34, 28, 16, RAMPS.darkArmor, 3);
  px.rect(20, 36, 24, 12, '#14101c');
  // Ear tips on mask
  for (let i = 0; i < 6; i++) {
    px.set(20 - i, 34 - i, RAMPS.darkArmor.mid);
    px.set(44 + i, 34 - i, RAMPS.darkArmor.mid);
  }
  px.rect(23, 40, 6, 7, '#ffe080');
  px.rect(35, 40, 6, 7, '#ffe080');
  px.set(24, 41, '#ffffff');
  px.set(36, 41, '#ffffff');
  px.sphere(12, 46, 7, RAMPS.silver);
  px.sphere(52, 46, 7, RAMPS.silver);
  // Galaxia
  px.rect(54, 16, 3, 50, RAMPS.silver.light);
  px.rect(55, 16, 1, 50, '#ffffff');
  px.rect(52, 60, 8, 3, RAMPS.gold.mid);
  for (let i = 0; i < 10; i++) {
    px.set(8 - i, 38 - i, cape.light);
    px.set(56 + i, 38 - i, cape.light);
  }
}

function paintWarpStar(px: PixelCanvas) {
  paintStar(px, 32, 52, 24, RAMPS.gold);
  for (const [x, y] of [[12, 40], [50, 64], [18, 68], [48, 36], [8, 56]] as const) {
    px.set(x, y, RAMPS.gold.hilite);
    px.set(x + 1, y, '#ffffff');
  }
  px.sphere(32, 46, 8, RAMPS.pink);
  px.rect(28, 42, 3, 5, '#1a2040');
  px.rect(34, 42, 3, 5, '#1a2040');
  px.set(29, 43, '#ffffff');
  px.set(35, 43, '#ffffff');
}

// ─── Mushroom Kingdom (classic Mario) ───────────────────────────────────────

function paintMario(px: PixelCanvas) {
  const blue: ShadeRamp = { outline: '#081828', dark: '#183868', mid: '#2858a0', light: '#4878c8', hilite: '#78a8f0' };
  const red = RAMPS.shroomRed;
  const skin = RAMPS.skin;

  // Overalls legs + boots
  px.limb(26, 88, 25, 68, 3, blue);
  px.limb(38, 88, 39, 68, 3, blue);
  px.bodyBox(22, 84, 8, 5, RAMPS.darkArmor, 1);
  px.bodyBox(35, 84, 8, 5, RAMPS.darkArmor, 1);
  // Torso overalls
  px.bodyBox(22, 48, 20, 24, blue, 2);
  px.rect(26, 50, 12, 14, blue.light);
  // Red shirt sleeves
  px.limb(22, 50, 12, 64, 3, red);
  px.limb(42, 50, 52, 64, 3, red);
  px.circle(11, 66, 3, skin.mid);
  px.circle(53, 66, 3, skin.mid);
  // Overall straps + buttons
  px.rect(26, 48, 3, 12, blue.dark);
  px.rect(36, 48, 3, 12, blue.dark);
  px.set(27, 56, RAMPS.gold.hilite);
  px.set(37, 56, RAMPS.gold.hilite);
  // Head
  px.sphere(32, 36, 10, skin);
  // Classic mustache
  px.ellipseFill(32, 42, 8, 3, '#301808');
  px.rect(28, 41, 3, 2, '#201000');
  px.rect(34, 41, 3, 2, '#201000');
  paintEyes(px, 27, 34, 37, 34);
  // Cap with M disc
  px.bodyBox(20, 24, 24, 10, red, 3);
  px.ellipseFill(32, 24, 12, 5, red.mid);
  px.circle(32, 26, 4, RAMPS.paper.hilite);
  px.rect(30, 25, 4, 3, red.mid);
  px.set(31, 26, red.dark);
  px.set(32, 26, red.dark);
  // Sideburns / hair
  px.rect(22, 32, 3, 6, '#301808');
  px.rect(40, 32, 3, 6, '#301808');
}

function paintToad(px: PixelCanvas) {
  const skin = RAMPS.skin;
  // Vest + legs
  px.limb(27, 88, 26, 72, 2, RAMPS.blueArmor);
  px.limb(37, 88, 38, 72, 2, RAMPS.blueArmor);
  px.bodyBox(24, 58, 16, 18, RAMPS.blueArmor, 2);
  px.rect(28, 60, 8, 10, RAMPS.blueArmor.light);
  px.sphere(18, 64, 4, skin);
  px.sphere(46, 64, 4, skin);
  // Head
  px.sphere(32, 48, 10, skin);
  paintEyes(px, 27, 48, 37, 48);
  // Spotted mushroom cap — classic Toad
  for (let j = -14; j <= 2; j++) {
    const half = Math.floor(16 * Math.sqrt(Math.max(0, 1 - ((j + 4) / 16) ** 2)));
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || j === -14;
      const spot =
        (Math.hypot(i + 6, j + 4) < 4) ||
        (Math.hypot(i - 6, j + 2) < 3.5) ||
        (Math.hypot(i, j - 4) < 3);
      let hex: Hex = RAMPS.shroomRed.mid;
      if (edge) hex = RAMPS.shroomRed.outline;
      else if (spot) hex = '#fff8f0';
      else if (i < -3) hex = RAMPS.shroomRed.dark;
      else if (i > 4) hex = RAMPS.shroomRed.light;
      px.set(32 + i, 34 + j, hex);
    }
  }
  px.ellipseFill(32, 40, 12, 3, '#fff0e8');
}

function paintMushroomGuard(px: PixelCanvas) {
  paintToad(px);
  // Helmet crest + spear for guard variant
  px.rect(28, 18, 8, 4, RAMPS.silver.mid);
  px.rect(30, 14, 4, 6, RAMPS.gold.mid);
  px.rect(50, 30, 2, 40, RAMPS.wood.mid);
  px.rect(49, 28, 4, 5, RAMPS.silver.light);
}

function paintHammerBro(px: PixelCanvas) {
  const shell: ShadeRamp = { outline: '#082018', dark: '#186028', mid: '#28a040', light: '#48c858', hilite: '#78e880' };
  px.limb(26, 88, 24, 70, 2, shell);
  px.limb(38, 88, 40, 70, 2, shell);
  px.bodyBox(20, 48, 24, 26, shell, 3);
  px.rect(24, 52, 16, 14, shell.light);
  // Turtle shell spikes
  for (const [x, y] of [[24, 50], [32, 46], [40, 50], [28, 58], [36, 58]] as const) {
    px.circle(x, y, 3, shell.dark);
    px.set(x, y - 2, RAMPS.silver.light);
  }
  px.sphere(32, 40, 9, RAMPS.skin);
  // Helmet
  px.bodyBox(22, 28, 20, 12, RAMPS.shroomRed, 2);
  px.rect(24, 30, 16, 8, RAMPS.shroomRed.light);
  paintEyes(px, 27, 38, 37, 38);
  // Hammers
  px.rect(8, 44, 10, 4, RAMPS.silver.mid);
  px.rect(10, 40, 6, 10, RAMPS.silver.dark);
  px.rect(12, 50, 2, 12, RAMPS.wood.mid);
  px.rect(48, 40, 10, 4, RAMPS.silver.mid);
  px.rect(50, 36, 6, 10, RAMPS.silver.dark);
  px.rect(52, 46, 2, 12, RAMPS.wood.mid);
}

function paintLakitu(px: PixelCanvas) {
  // Cloud
  px.ellipseFill(32, 72, 20, 8, RAMPS.cloud.mid);
  px.ellipseFill(18, 70, 10, 6, RAMPS.cloud.light);
  px.ellipseFill(46, 70, 10, 6, RAMPS.cloud.light);
  px.ellipseFill(32, 66, 12, 5, '#ffffff');
  // Body in cloud
  px.sphere(32, 52, 12, RAMPS.skin);
  px.bodyBox(24, 40, 16, 10, RAMPS.shroomRed, 2);
  paintEyes(px, 27, 50, 37, 50);
  // Spiny shell throw hint
  px.circle(50, 48, 6, RAMPS.orange.mid);
  px.set(50, 44, RAMPS.silver.light);
  px.set(48, 48, RAMPS.orange.hilite);
}

function paintChainChomp(px: PixelCanvas) {
  // Classic chained black ball with teeth
  px.sphere(32, 52, 22, RAMPS.darkArmor);
  px.grit(14, 34, 36, 36, '#080808', 0.1);
  // Eye whites
  px.circle(24, 44, 5, '#ffffff');
  px.circle(40, 44, 5, '#ffffff');
  px.circle(24, 44, 2, '#101018');
  px.circle(40, 44, 2, '#101018');
  // Big bite mouth
  px.ellipseFill(32, 60, 14, 8, '#101018');
  for (let i = -5; i <= 5; i++) {
    px.rect(32 + i * 2, 54, 2, 5, '#fff8f0');
    px.rect(32 + i * 2, 62, 2, 4, '#fff8f0');
  }
  // Chain
  for (let i = 0; i < 8; i++) {
    px.circle(10 - i * 2, 70 + i, 3, RAMPS.silver.mid);
    px.circleOutline(10 - i * 2, 70 + i, 3, RAMPS.silver.outline);
  }
}

// ─── Koopa Troop (classic Bowser crew) ──────────────────────────────────────

function paintBowser(px: PixelCanvas) {
  const shell: ShadeRamp = { outline: '#082018', dark: '#186030', mid: '#28a048', light: '#48c860', hilite: '#78e888' };
  const belly: ShadeRamp = { outline: '#403018', dark: '#c09040', mid: '#e0b858', light: '#f0d878', hilite: '#fff0a8' };

  px.limb(24, 88, 20, 66, 3, RAMPS.orange);
  px.limb(40, 88, 44, 66, 3, RAMPS.orange);
  // Spiked shell
  px.sphere(32, 56, 20, shell);
  for (const [x, y] of [[22, 48], [32, 42], [42, 48], [26, 58], [38, 58]] as const) {
    px.circle(x, y, 4, shell.dark);
    for (let j = 0; j < 5; j++) px.set(x, y - 3 - j, RAMPS.silver.light);
  }
  // Belly plate
  px.ellipseFill(32, 64, 12, 10, belly.mid);
  px.ellipseFill(32, 62, 8, 6, belly.light);
  // Arms + head
  px.sphere(12, 58, 7, RAMPS.orange);
  px.sphere(52, 58, 7, RAMPS.orange);
  px.sphere(32, 34, 12, RAMPS.orange);
  // Hair / brow spikes
  for (let i = -8; i <= 8; i += 4) {
    for (let j = 0; j < 6; j++) px.set(32 + i, 20 - j, RAMPS.redMalice.mid);
  }
  // Horns
  for (let i = 0; i < 8; i++) {
    px.set(18 - i, 28 - i, RAMPS.paper.mid);
    px.set(46 + i, 28 - i, RAMPS.paper.mid);
  }
  paintGlowEyes(px, 26, 32, 36, 32, RAMPS.redMalice.hilite);
  // Snarl teeth
  px.rect(26, 40, 12, 3, '#101018');
  for (let i = 0; i < 4; i++) px.rect(27 + i * 3, 40, 2, 4, '#fff8f0');
  // Wrist spikes
  px.set(10, 54, RAMPS.silver.hilite);
  px.set(54, 54, RAMPS.silver.hilite);
}

function paintKoopaTroopa(px: PixelCanvas) {
  const shell: ShadeRamp = { outline: '#082018', dark: '#186028', mid: '#28a040', light: '#50c858', hilite: '#80e880' };
  const skin = RAMPS.skin;

  // Classic walking Troopa — green shell, beige belly, beak
  px.limb(28, 88, 26, 72, 2, skin);
  px.limb(36, 88, 38, 72, 2, skin);
  px.ellipseFill(26, 86, 5, 3, '#fff8f0');
  px.ellipseFill(40, 86, 5, 3, '#fff8f0');
  // Shell
  px.sphere(32, 58, 16, shell);
  px.ellipseFill(32, 62, 10, 10, skin.mid);
  px.ellipseFill(32, 60, 7, 7, skin.light);
  // Shell ridges
  px.circleOutline(32, 54, 10, shell.dark);
  px.circleOutline(32, 54, 6, shell.light);
  px.sphere(18, 58, 5, skin);
  px.sphere(46, 58, 5, skin);
  // Head + beak
  px.sphere(32, 40, 9, skin);
  px.ellipseFill(32, 44, 6, 4, '#e8c878');
  px.rect(28, 44, 8, 2, '#c09040');
  paintEyes(px, 27, 38, 37, 38);
  // Soft smile
  px.set(30, 48, skin.dark);
  px.set(34, 48, skin.dark);
}

function paintBulletBill(px: PixelCanvas) {
  // Classic Bullet Bill missile
  px.ellipseFill(36, 52, 22, 14, RAMPS.darkArmor.mid);
  px.ellipseFill(36, 50, 18, 10, RAMPS.darkArmor.light);
  px.circle(14, 52, 10, RAMPS.darkArmor.dark);
  // Face
  px.circle(20, 48, 3, '#ffffff');
  px.circle(20, 48, 1, '#101018');
  px.rect(16, 56, 8, 2, '#101018');
  // Arms
  px.rect(28, 64, 4, 10, RAMPS.darkArmor.mid);
  px.rect(40, 64, 4, 10, RAMPS.darkArmor.mid);
  // Fuse / exhaust
  for (let i = 0; i < 8; i++) {
    px.set(54 + i, 50 + (i % 3) - 1, i < 3 ? RAMPS.lava.hilite : RAMPS.lava.mid);
  }
}

function paintMagikoopa(px: PixelCanvas) {
  const robe = RAMPS.blueArmor;
  // Pointed wizard robe
  for (let j = 0; j < 40; j++) {
    const half = 4 + Math.floor(j * 0.35);
    for (let i = -half; i <= half; i++) {
      px.set(32 + i, 48 + j, Math.abs(i) === half ? robe.outline : (i < 0 ? robe.dark : robe.mid));
    }
  }
  px.sphere(32, 42, 10, RAMPS.skin);
  // Classic spectacles
  px.circleOutline(27, 42, 3, '#101018');
  px.circleOutline(37, 42, 3, '#101018');
  px.rect(30, 42, 4, 1, '#101018');
  px.set(27, 42, '#101018');
  px.set(37, 42, '#101018');
  // Wizard hat
  for (let i = 0; i < 18; i++) {
    const half = 10 - Math.floor(i * 0.45);
    for (let x = -half; x <= half; x++) {
      px.set(32 + x, 34 - i, i < 2 ? robe.outline : robe.light);
    }
  }
  px.set(32, 14, RAMPS.gold.hilite);
  // Wand star
  paintStar(px, 52, 40, 7, RAMPS.gold);
  px.rect(48, 44, 2, 20, RAMPS.wood.mid);
}

function paintAirship(px: PixelCanvas) {
  // SMB3 / SMW Bowser airship silhouette
  px.ellipseFill(32, 58, 26, 10, RAMPS.wood.mid);
  px.ellipseFill(32, 54, 22, 8, RAMPS.wood.light);
  px.rect(12, 48, 40, 10, RAMPS.wood.dark);
  // Cabin
  px.bodyBox(24, 36, 16, 14, RAMPS.darkArmor, 2);
  px.rect(28, 40, 8, 6, '#88c0f0');
  // Mast + sail
  px.rect(40, 18, 2, 28, RAMPS.wood.mid);
  px.rect(42, 20, 12, 14, RAMPS.shroomRed.mid);
  px.rect(42, 22, 12, 2, RAMPS.shroomRed.light);
  // Cannons
  px.rect(8, 52, 8, 4, RAMPS.darkArmor.mid);
  px.rect(48, 52, 8, 4, RAMPS.darkArmor.mid);
  // Propeller
  px.rect(4, 56, 6, 2, RAMPS.silver.mid);
  px.set(2, 56, RAMPS.silver.hilite);
}

// ─── NightMare / Dark Matter (classic Kirby antagonists) ────────────────────

function paintMarx(px: PixelCanvas) {
  // Jester-like Marx silhouette — chaotic Popstar antagonist
  px.sphere(32, 56, 18, RAMPS.pink);
  px.sphere(14, 52, 8, RAMPS.void);
  px.sphere(50, 52, 8, RAMPS.gold);
  // Split jester hat
  for (let i = 0; i < 16; i++) {
    px.set(20 - Math.floor(i * 0.4), 36 - i, i % 2 ? RAMPS.void.mid : RAMPS.gold.mid);
    px.set(44 + Math.floor(i * 0.4), 36 - i, i % 2 ? RAMPS.gold.mid : RAMPS.void.mid);
  }
  px.circle(14, 20, 3, RAMPS.void.hilite);
  px.circle(50, 20, 3, RAMPS.gold.hilite);
  paintGlowEyes(px, 26, 52, 36, 52, '#ffffff');
  px.rect(28, 62, 8, 2, RAMPS.pink.dark);
}

function paintWaddleDoo(px: PixelCanvas) {
  const body = RAMPS.orange;
  px.ellipseFill(22, 82, 7, 4, '#a04820');
  px.ellipseFill(42, 82, 7, 4, '#a04820');
  px.sphere(32, 56, 17, body);
  // Single cyclops eye + beam hint
  px.circle(32, 52, 8, '#fff8f0');
  px.circle(32, 52, 5, '#101018');
  px.circle(32, 50, 2, '#ffffff');
  // Beam arcs
  for (let i = 0; i < 10; i++) {
    px.set(44 + i, 48 + Math.round(Math.sin(i * 0.8) * 2), RAMPS.redMalice.hilite);
  }
}

function paintDarkMatter(px: PixelCanvas) {
  // Floating orb with orange eye — classic Dark Matter
  px.sphere(32, 52, 20, RAMPS.void);
  px.grit(14, 36, 36, 36, '#080418', 0.12);
  // Petal spikes
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    for (let d = 14; d < 24; d++) {
      px.set(32 + Math.round(Math.cos(ang) * d), 52 + Math.round(Math.sin(ang) * d), RAMPS.void.light);
    }
  }
  px.circle(32, 52, 8, RAMPS.orange.mid);
  px.circle(32, 52, 4, RAMPS.orange.hilite);
  px.set(32, 50, '#ffffff');
}

function paintScarfy(px: PixelCanvas) {
  // Cute → angry Scarfy
  px.sphere(32, 54, 16, RAMPS.orange);
  px.ellipseFill(32, 70, 10, 5, RAMPS.orange.dark);
  // Ears / flaps
  px.circle(16, 42, 6, RAMPS.orange.mid);
  px.circle(48, 42, 6, RAMPS.orange.mid);
  paintEyes(px, 26, 50, 38, 50);
  // Little smile (pre-rage)
  for (let i = -2; i <= 2; i++) px.set(32 + i, 60 + (Math.abs(i) === 2 ? 0 : 1), RAMPS.orange.outline);
}

function paintZeroEye(px: PixelCanvas) {
  // Massive Zero pupil — NightMare endgame
  px.sphere(32, 52, 24, RAMPS.paper);
  px.grit(12, 32, 40, 40, '#d0c8c0', 0.06);
  px.circle(32, 52, 14, RAMPS.redMalice.mid);
  px.circle(32, 52, 8, RAMPS.redMalice.hilite);
  px.circle(32, 50, 3, '#ffffff');
  // Blood tear
  for (let i = 0; i < 14; i++) {
    px.set(32, 60 + i, i < 4 ? RAMPS.redMalice.hilite : RAMPS.redMalice.mid);
    px.set(31, 60 + i, RAMPS.redMalice.dark);
  }
}

function paintStar(px: PixelCanvas, cx: number, cy: number, r: number, ramp: ShadeRamp) {
  for (let j = -r; j <= r; j++) {
    for (let i = -r; i <= r; i++) {
      const ang = Math.atan2(j, i);
      const dist = Math.hypot(i, j);
      const point = (Math.cos(ang * 5) + 1) * 0.5;
      const maxR = r * (0.45 + point * 0.55);
      if (dist <= maxR) {
        const edge = dist > maxR - 1.2;
        let hex: Hex = ramp.mid;
        if (edge) hex = ramp.outline;
        else if (dist < r * 0.28) hex = ramp.hilite;
        else if (i + j < 0) hex = ramp.light;
        else hex = ramp.dark;
        px.set(cx + i, cy + j, hex);
      }
    }
  }
}

type Hex = string;
