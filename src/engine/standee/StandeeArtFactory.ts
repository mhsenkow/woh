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
  | 'gloom-malice'
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
    case 'gloom-malice': paintGloomSpawn(px); break;
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
    case 110: return 'bokoblin-malice';
    case 111: return 'moblin-malice';
    case 112: return 'lizalfos-malice';
    case 113: return 'guardian-malice';
    case 114: return 'gloom-malice';
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

/**
 * Ganondorf — Gerudo King across Zelda eras:
 * OoT nose-jewel crown, TP black armor, TotK gloom veins,
 * classic boar tusks (Ganon DNA), Demise blade, Triforce of Power brand.
 */
function paintGanon(px: PixelCanvas) {
  const armor = RAMPS.darkArmor;
  const skin: ShadeRamp = { outline: '#3a2010', dark: '#a86838', mid: '#c88850', light: '#e0a870', hilite: '#f0c890' };
  const malice = RAMPS.redMalice;
  const gold = RAMPS.gold;
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };

  // Heavy greaves + clawed sabatons
  px.limb(24, 90, 22, 68, 4, armor);
  px.limb(40, 90, 42, 68, 4, armor);
  px.bodyBox(18, 82, 12, 9, armor, 1);
  px.bodyBox(34, 82, 12, 9, armor, 1);
  px.set(20, 84, gold.mid);
  px.set(42, 84, gold.mid);
  px.set(18, 88, malice.light);
  px.set(46, 88, malice.light);

  // Torn malice / Phantom Ganon cape (deep crimson → gloom)
  for (let j = 0; j < 44; j++) {
    for (let i = -22; i <= 22; i++) {
      if (Math.abs(i) > 13 + j / 2.2) continue;
      if (j > 32 && ((i + j * 2) % 6 === 0 || (i - j) % 7 === 0)) continue; // torn hem
      const edge = Math.abs(i) > 11 + j / 3;
      const deep = i < -6 || j > 28;
      px.set(32 + i, 42 + j, edge ? malice.outline : (deep ? gloom.dark : '#4a1020'));
    }
  }
  px.grit(12, 48, 40, 34, malice.dark, 0.14);
  // Cape clasp
  px.circle(32, 44, 3, gold.mid);
  px.set(32, 43, malice.hilite);

  // Cuirass — TP black plate + Gerudo filigree
  px.bodyBox(15, 38, 34, 34, armor, 2);
  px.bandShade(17, 40, 30, 28, armor);
  px.rect(22, 46, 20, 16, armor.light);
  // TotK gloom vein cracks
  for (const [x, y] of [[22, 44], [23, 48], [24, 52], [25, 56], [26, 60], [40, 44], [41, 48], [42, 52], [43, 56], [44, 60]] as const) {
    px.set(x, y, malice.light);
    px.set(x + 1, y + 1, gloom.mid);
  }
  // Triforce of Power brand (inverted glow)
  px.set(32, 50, gold.hilite);
  px.set(31, 52, gold.mid); px.set(32, 52, gold.hilite); px.set(33, 52, gold.mid);
  px.set(30, 54, gold.dark); px.set(31, 54, gold.mid); px.set(32, 54, gold.hilite);
  px.set(33, 54, gold.mid); px.set(34, 54, gold.dark);
  // Twinrova dual-gem
  px.circle(26, 48, 2, '#ff6040');
  px.circle(38, 48, 2, '#40a0ff');
  px.circle(32, 58, 3, gold.mid);
  px.set(32, 57, malice.hilite);

  // Massive Gerudo arms + spiked bracers
  px.limb(15, 44, 6, 68, 5, skin);
  px.limb(49, 44, 58, 68, 5, skin);
  px.sphere(5, 70, 6, skin);
  px.sphere(59, 70, 6, skin);
  px.rect(4, 56, 8, 5, armor.mid);
  px.rect(52, 56, 8, 5, armor.mid);
  for (const x of [5, 8, 53, 56]) px.set(x, 54, gold.hilite);

  // Blade of Demise / Greatsword of Demise
  px.rect(54, 10, 5, 60, RAMPS.silver.dark);
  px.rect(55, 10, 2, 60, RAMPS.silver.mid);
  px.rect(56, 10, 1, 60, '#c8d0d8');
  // Malice-wrapped hilt
  px.rect(52, 62, 9, 6, malice.mid);
  px.rect(53, 61, 7, 1, malice.hilite);
  px.rect(55, 68, 3, 10, armor.mid);
  px.circle(56, 10, 3, '#ffffff');
  px.set(56, 8, malice.light);

  // Head — Gerudo king + boar DNA
  px.sphere(32, 28, 12, skin);
  // Wild crimson mane (OoT spikes + TP volume)
  px.hairCap(32, 24, 15, 20, malice, true);
  for (let i = -16; i <= 16; i++) {
    if (Math.abs(i) % 2 === 0) {
      const tip = 6 + (Math.abs(i) % 5);
      for (let j = 0; j < tip; j++) {
        px.set(32 + i + (j % 2) - 1, 6 + j, j < 2 ? malice.hilite : (j < 4 ? malice.light : malice.mid));
      }
    }
  }
  // Boar tusks (classic Ganon silhouette tell)
  px.rect(20, 34, 4, 7, '#fff0e0');
  px.rect(41, 34, 4, 7, '#fff0e0');
  px.set(20, 40, skin.dark);
  px.set(44, 40, skin.dark);
  px.set(21, 34, '#ffffff');
  px.set(43, 34, '#ffffff');
  // Glowing malice / gloom eyes
  paintGlowEyes(px, 25, 26, 37, 26, '#ffe040');
  px.set(26, 25, malice.hilite);
  px.set(38, 25, malice.hilite);
  // Fierce snarl
  px.rect(26, 34, 12, 3, skin.dark);
  px.set(27, 35, '#fff8f0');
  px.set(30, 35, '#fff8f0');
  px.set(33, 35, '#fff8f0');
  px.set(36, 35, '#fff8f0');
  // OoT nose jewel + Gerudo earrings
  px.circle(32, 30, 2, gold.hilite);
  px.set(32, 29, malice.light);
  px.circle(32, 16, 3, gold.hilite);
  px.set(32, 15, malice.light);
  px.set(18, 30, gold.mid);
  px.set(46, 30, gold.mid);
}

/**
 * Bokoblin — BOTW/TotK red-tribe pig grubber:
 * bat ears, horn stubs, bone club, scrap shield, rope loincloth, clawed feet.
 * Reads as the classic swarm fodder of the Malice Horde.
 */
function paintBokoblin(px: PixelCanvas) {
  // BOTW red Bokoblin skin (warmer than Moblin olive)
  const skin: ShadeRamp = { outline: '#3a1810', dark: '#a04028', mid: '#c85838', light: '#e07850', hilite: '#f0a078' };
  const snout: ShadeRamp = { outline: '#401810', dark: '#b04830', mid: '#d06848', light: '#e88868', hilite: '#f8b090' };

  // Digging claw feet
  px.limb(26, 90, 24, 74, 2, skin);
  px.limb(38, 90, 40, 74, 2, skin);
  px.rect(20, 88, 10, 3, skin.dark);
  px.rect(36, 88, 10, 3, skin.dark);
  px.set(20, 89, '#e8c070');
  px.set(22, 90, '#e8c070');
  px.set(42, 89, '#e8c070');
  px.set(44, 90, '#e8c070');

  // Round pot belly (swarm silhouette)
  px.sphere(32, 66, 18, skin);
  px.grit(16, 52, 32, 30, skin.dark, 0.16);
  // Rope + hide loincloth
  px.rect(18, 70, 28, 6, RAMPS.wood.mid);
  px.rect(18, 71, 28, 1, RAMPS.wood.light);
  px.rect(26, 70, 12, 10, RAMPS.wood.dark);
  px.set(28, 72, RAMPS.wood.hilite);
  px.set(34, 74, RAMPS.wood.mid);

  // Left scrap shield (BOTW wooden)
  px.ellipseFill(10, 58, 8, 10, RAMPS.wood.mid);
  px.ellipseFill(10, 58, 6, 8, RAMPS.wood.light);
  px.circleOutline(10, 58, 7, RAMPS.wood.outline);
  px.set(10, 56, RAMPS.wood.hilite);
  px.rect(8, 62, 4, 2, RAMPS.silver.dark);

  // Right arm + claws
  px.sphere(52, 60, 8, skin);
  px.set(54, 62, '#e8c070');
  px.set(56, 64, '#e8c070');
  px.set(58, 62, '#e8c070');

  // Spiked Boko bone club
  px.rect(48, 30, 8, 36, RAMPS.paper.mid);
  px.rect(49, 30, 4, 36, RAMPS.paper.light);
  px.rectOutline(48, 30, 8, 36, RAMPS.paper.outline);
  px.circle(52, 28, 7, RAMPS.paper.hilite);
  for (const [x, y] of [[48, 24], [56, 26], [50, 22], [54, 30], [49, 34]] as const) {
    px.set(x, y, '#e8d8b0');
  }
  px.set(52, 26, RAMPS.paper.dark);

  // Head — pig snout first (readable tell)
  px.sphere(32, 40, 14, skin);
  px.ellipseFill(32, 48, 11, 7, snout.mid);
  px.ellipseFill(32, 48, 8, 5, snout.light);
  px.set(26, 48, skin.outline);
  px.set(38, 48, skin.outline);
  px.set(26, 47, snout.dark);
  px.set(38, 47, snout.dark);
  // Nostril slits
  px.set(28, 49, '#2a1008');
  px.set(36, 49, '#2a1008');

  // Big bat ears (orange-pink inner)
  for (let i = 0; i < 11; i++) {
    px.set(14 - i, 32 - Math.floor(i * 0.5), skin.mid);
    px.set(15 - i, 32 - Math.floor(i * 0.5), skin.light);
    px.set(50 + i, 32 - Math.floor(i * 0.5), skin.mid);
    px.set(49 + i, 32 - Math.floor(i * 0.5), skin.light);
    px.set(14 - i, 31 - Math.floor(i * 0.5), RAMPS.orange.light);
    px.set(50 + i, 31 - Math.floor(i * 0.5), RAMPS.orange.light);
  }
  // Horn stubs
  px.rect(22, 24, 4, 6, RAMPS.orange.mid);
  px.rect(38, 24, 4, 6, RAMPS.orange.mid);
  px.set(23, 23, RAMPS.orange.hilite);
  px.set(40, 23, RAMPS.orange.hilite);

  paintEyes(px, 24, 36, 40, 36);
  // Beady pupil glints
  px.set(25, 35, '#ffffff');
  px.set(41, 35, '#ffffff');
  // Cheek pouches + toothy grin
  px.circle(20, 44, 3, '#e07058');
  px.circle(44, 44, 3, '#e07058');
  px.rect(24, 54, 16, 3, skin.outline);
  for (const x of [25, 28, 31, 34, 37]) px.set(x, 54, '#fff8f0');
}

/**
 * Moblin — classic LoZ/ALTTP pig brute + BOTW spear-lord:
 * towering olive frame, huge forward snout, curved horns, scrap plate, pike.
 */
function paintMoblin(px: PixelCanvas) {
  const skin: ShadeRamp = { outline: '#1c2410', dark: '#486030', mid: '#688048', light: '#90a860', hilite: '#b0c880' };
  const armor = RAMPS.darkArmor;

  // Thick columnar legs
  px.limb(24, 90, 20, 62, 5, skin);
  px.limb(40, 90, 44, 62, 5, skin);
  px.bodyBox(16, 82, 12, 9, armor, 1);
  px.bodyBox(36, 82, 12, 9, armor, 1);
  px.set(18, 84, RAMPS.silver.dark);
  px.set(44, 84, RAMPS.silver.dark);

  // Barrel torso + bolted scrap armor
  px.bodyBox(12, 36, 40, 36, skin, 3);
  px.bandShade(14, 38, 36, 30, skin);
  px.grit(14, 40, 36, 30, skin.dark, 0.12);
  // Leather harness
  px.rect(16, 48, 32, 12, RAMPS.wood.dark);
  px.rect(16, 49, 32, 2, RAMPS.wood.mid);
  px.rect(16, 56, 32, 2, RAMPS.silver.dark);
  for (const x of [18, 28, 38]) px.set(x, 52, RAMPS.silver.mid);
  // Skull belt buckle (classic Moblin camp DNA)
  px.circle(32, 54, 4, RAMPS.paper.mid);
  px.set(30, 53, '#101018');
  px.set(34, 53, '#101018');
  px.rect(30, 56, 4, 1, '#101018');

  // Left tower shield (ALTTP Moblin)
  px.bodyBox(2, 42, 12, 28, armor, 1);
  px.rect(4, 46, 8, 18, armor.light);
  px.circle(8, 56, 3, RAMPS.redMalice.mid);
  px.set(8, 55, RAMPS.redMalice.hilite);

  // Right spear arm
  px.sphere(56, 46, 9, skin);
  px.sphere(8, 70, 5, skin); // shield grip hint

  // Classic Moblin pike (long silhouette)
  px.rect(56, 6, 4, 62, RAMPS.wood.mid);
  px.rect(57, 6, 2, 62, RAMPS.wood.light);
  px.rect(54, 4, 8, 10, RAMPS.silver.light);
  px.set(58, 2, RAMPS.silver.hilite);
  px.rect(55, 12, 6, 2, RAMPS.silver.mid);
  px.set(58, 8, '#ffffff');

  // Head — oversized forward pig snout (NES tell)
  px.sphere(32, 26, 13, skin);
  px.ellipseFill(32, 34, 12, 8, '#607840');
  px.ellipseFill(32, 34, 9, 6, '#789858');
  px.ellipseFill(32, 35, 6, 3, '#90a870');
  px.set(25, 34, skin.outline);
  px.set(39, 34, skin.outline);
  px.set(26, 36, '#2a3018');
  px.set(38, 36, '#2a3018');

  // Curved bone horns (sweeping out)
  for (let i = 0; i < 13; i++) {
    const y = 20 - Math.floor(i * 0.9);
    px.set(16 - i, y, RAMPS.paper.mid);
    px.set(17 - i, y, RAMPS.paper.light);
    px.set(18 - i, y + 1, RAMPS.paper.dark);
    px.set(48 + i, y, RAMPS.paper.mid);
    px.set(47 + i, y, RAMPS.paper.light);
    px.set(46 + i, y + 1, RAMPS.paper.dark);
  }
  px.set(6, 10, RAMPS.paper.hilite);
  px.set(58, 10, RAMPS.paper.hilite);

  paintGlowEyes(px, 24, 24, 38, 24, '#ffe080');
  // Tusks + snarl
  px.rect(22, 38, 4, 7, '#fff8f0');
  px.rect(38, 38, 4, 7, '#fff8f0');
  px.set(23, 38, '#ffffff');
  px.set(40, 38, '#ffffff');
  px.rect(26, 40, 12, 2, skin.outline);
}

/**
 * Lizalfos — OoT chameleon + BOTW amphibious skirmisher:
 * digitigrade reverse joints, gold crest, curling tail, Lizal boomerang, tongue.
 */
function paintLizalfos(px: PixelCanvas) {
  const skin: ShadeRamp = { outline: '#062418', dark: '#187848', mid: '#30a868', light: '#50c888', hilite: '#80e8b0' };
  const belly: ShadeRamp = { outline: '#204028', dark: '#88a060', mid: '#b0c880', light: '#d0e0a0', hilite: '#f0f8c8' };
  const crest = RAMPS.gold;

  // Digitigrade reverse-joint legs (skirmisher stance)
  px.limb(28, 90, 16, 74, 2, skin);
  px.limb(36, 90, 48, 74, 2, skin);
  px.limb(16, 74, 24, 56, 2, skin);
  px.limb(48, 74, 40, 56, 2, skin);
  px.rect(12, 88, 8, 3, skin.dark);
  px.rect(44, 88, 8, 3, skin.dark);
  px.set(12, 89, skin.hilite);
  px.set(50, 89, skin.hilite);

  // Lean torso + scale dither + pale belly
  px.bodyBox(22, 42, 20, 30, skin, 4);
  px.dither(24, 46, 16, 22, skin.mid, skin.light);
  // Camouflage blotches (OoT chameleon DNA)
  px.circle(26, 52, 3, skin.dark);
  px.circle(38, 58, 2, skin.dark);
  px.circle(30, 64, 2, '#208858');
  px.ellipseFill(32, 58, 9, 12, belly.mid);
  px.ellipseFill(32, 56, 6, 8, belly.light);

  // Long curling tail (counterbalance silhouette)
  for (let i = 0; i < 24; i++) {
    const r = Math.max(1, 6 - Math.floor(i / 4));
    const x = 46 + i;
    const y = 68 - Math.floor(i * 0.45) + (i > 14 ? Math.floor((i - 14) * 0.6) : 0);
    px.circle(x, y, r, i % 2 ? skin.mid : skin.light);
    if (i % 3 === 0) px.set(x, y - r, crest.mid);
  }

  // Arms
  px.limb(22, 48, 8, 64, 2, skin);
  px.limb(42, 48, 54, 56, 2, skin);
  px.sphere(6, 66, 4, skin);
  px.sphere(56, 56, 4, skin);

  // Crested chameleon head
  px.sphere(32, 34, 10, skin);
  // Tall gold crest plume
  for (let i = 0; i < 14; i++) {
    px.set(32, 26 - i, crest.mid);
    px.set(31, 26 - i, crest.dark);
    px.set(33, 26 - i, crest.light);
    if (i % 2 === 0) {
      px.set(30, 26 - i, crest.dark);
      px.set(34, 26 - i, crest.hilite);
    }
  }
  // Side frills / dewlap
  px.circle(18, 36, 6, skin.light);
  px.circle(46, 36, 6, skin.light);
  px.circle(18, 36, 3, skin.hilite);
  px.circle(46, 36, 3, skin.hilite);
  // Jaw
  px.ellipseFill(32, 42, 7, 4, belly.mid);

  paintEyes(px, 26, 34, 38, 34);
  px.set(27, 33, '#ffffff');
  px.set(39, 33, '#ffffff');
  // Forked tongue flick
  for (let i = 0; i < 8; i++) px.set(32 + i, 44, RAMPS.pink.mid);
  px.set(40, 43, RAMPS.pink.light);
  px.set(40, 45, RAMPS.pink.light);

  // Lizal boomerang (forked metal)
  px.rect(4, 48, 16, 3, RAMPS.silver.mid);
  px.rect(4, 47, 5, 5, RAMPS.silver.light);
  px.rect(15, 47, 5, 5, RAMPS.silver.light);
  px.set(6, 46, RAMPS.silver.hilite);
  px.set(18, 46, RAMPS.silver.hilite);
  px.rect(10, 49, 4, 2, RAMPS.silver.dark);
}

/**
 * Guardian Stalker — BOTW Sheikah ancient weapon, malice-corrupted:
 * hex dish chassis, six jointed legs, laser eye stalk, Sheikah glyph + Calamity cracks.
 */
function paintGuardian(px: PixelCanvas) {
  const shell: ShadeRamp = { outline: '#1a2820', dark: '#3a5850', mid: '#588078', light: '#80a8a0', hilite: '#b0d0c8' };
  const ancient = '#48e0b0';
  const malice = RAMPS.redMalice;

  // Hexagonal dish body (Sheikah tech silhouette)
  for (let j = -18; j <= 16; j++) {
    const half = 20 - Math.floor(Math.abs(j) * 0.55);
    for (let i = -half; i <= half; i++) {
      const edge = Math.abs(i) === half || Math.abs(j) === 18 || j === 16;
      const ring = Math.hypot(i, j);
      let hex: Hex = shell.mid;
      if (edge) hex = shell.outline;
      else if (ring < 5) hex = shell.hilite;
      else if (ring < 9) hex = shell.light;
      else if (i < -4) hex = shell.dark;
      else if ((i + j * 2) % 5 === 0) hex = '#406860';
      px.set(32 + i, 58 + j, hex);
    }
  }
  px.grit(14, 42, 36, 34, shell.dark, 0.18);
  // Concentric Sheikah rings
  px.circleOutline(32, 56, 14, ancient);
  px.circleOutline(32, 56, 10, '#28a080');
  px.circleOutline(32, 56, 6, ancient);
  // Eye of Truth-ish glyph dots
  for (const a of [0, 1, 2, 3, 4, 5] as const) {
    const ang = (a / 6) * Math.PI * 2;
    px.set(32 + Math.round(Math.cos(ang) * 10), 56 + Math.round(Math.sin(ang) * 8), ancient);
  }
  // Calamity malice cracks through plating
  for (const [x, y] of [[24, 48], [25, 52], [26, 56], [40, 50], [41, 54], [42, 58], [34, 62]] as const) {
    px.set(x, y, malice.light);
    px.set(x + 1, y + 1, malice.mid);
  }

  // Six articulated stalker legs
  for (const [x, y] of [[6, 72], [14, 84], [50, 84], [58, 72], [8, 44], [56, 44]] as const) {
    px.limb(32, 56, x, y, 2, shell);
    // Mid joint
    px.circle(Math.round((32 + x) / 2), Math.round((56 + y) / 2), 3, shell.dark);
    px.circle(x, y, 4, shell.dark);
    px.circle(x, y - 1, 2, ancient);
    px.set(x, y - 2, '#ffffff');
  }

  // Eye stalk + charging malice laser
  px.rect(29, 18, 6, 28, shell.mid);
  px.rect(30, 18, 4, 28, shell.light);
  px.rectOutline(29, 18, 6, 28, shell.outline);
  // Segment rings on stalk
  px.rect(29, 28, 6, 1, ancient);
  px.rect(29, 36, 6, 1, ancient);
  px.sphere(32, 16, 11, shell);
  px.circle(32, 16, 8, malice.dark);
  px.circle(32, 16, 6, malice.mid);
  px.circle(32, 16, 3, malice.hilite);
  px.circle(32, 16, 1, '#ffffff');
  // Laser charge beam hint
  px.rect(31, 4, 2, 6, '#ff4060');
  px.set(31, 2, '#ffffff');
  px.set(24, 10, ancient);
  px.set(40, 12, malice.hilite);
  px.set(28, 8, '#ff2040');
}

/**
 * Gloom Spawn — TotK Gloom Hands / phantom residue:
 * five-finger shadow claw, floating malice eyes, dripping gloom puddle.
 */
function paintGloomSpawn(px: PixelCanvas) {
  const gloom: ShadeRamp = { outline: '#100018', dark: '#280820', mid: '#501030', light: '#882040', hilite: '#c04058' };
  const malice = RAMPS.redMalice;

  // Gloom puddle base
  px.ellipseFill(32, 86, 20, 6, '#080010');
  px.ellipseFill(32, 84, 14, 4, gloom.dark);
  for (let i = 0; i < 8; i++) {
    px.set(20 + i * 3, 88 + (i % 3), gloom.light);
  }

  // Palm mass
  px.sphere(32, 60, 16, gloom);
  px.grit(16, 46, 32, 30, '#080010', 0.22);
  px.ellipseFill(32, 64, 12, 8, gloom.dark);

  // Five Gloom Hand fingers reaching upward (TotK tell)
  const fingers: Array<[number, number, number, number]> = [
    [-16, 56, 18, -0.7],
    [-8, 44, 22, -0.35],
    [0, 38, 26, 0.0],
    [8, 42, 22, 0.35],
    [16, 54, 18, 0.7],
  ];
  for (const [ox, oy, len, curve] of fingers) {
    for (let i = 0; i < len; i++) {
      const x = 32 + ox + Math.round(i * curve);
      const y = oy - Math.floor(i * 0.9);
      const r = Math.max(1, 5 - Math.floor(i / 5));
      px.circle(x, y, r, i % 2 ? gloom.mid : gloom.light);
      if (i > len - 4) px.set(x, y, malice.light);
      if (i === len - 1) {
        px.set(x, y - 1, malice.hilite);
        px.set(x - 1, y, gloom.outline); // claw tip
      }
    }
  }

  // Cluster of floating malice eyes in the palm
  for (const [x, y, s] of [[26, 56, 4], [36, 54, 5], [32, 64, 4], [22, 62, 3], [42, 62, 3], [30, 50, 2]] as const) {
    px.circle(x, y, s, malice.mid);
    px.circle(x, y, Math.max(1, s - 2), malice.hilite);
    px.set(x, y - 1, '#ffffff');
  }
  // Extra tendril drip from wrist
  for (let i = 0; i < 12; i++) {
    px.circle(32 + (i % 3) - 1, 74 + i, Math.max(1, 3 - Math.floor(i / 4)), i < 4 ? gloom.mid : gloom.light);
  }
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
