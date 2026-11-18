import { FactionId } from '../../sim/ecs/components';

/** Silhouette key consumed by BuildingRenderer. */
export type BuildingVisual =
  | 'keep' | 'barracks' | 'forge' | 'tower' | 'temple' | 'mine' | 'wall'
  | 'hive' | 'pit' | 'altar' | 'nest' | 'vein'
  | 'nexus' | 'shrine' | 'matrix' | 'platform' | 'crystal' | 'dojo';

export interface BuildingDef {
  id: number;
  name: string;
  hp: number;
  buildTime: number;
  cost: { primary: number };
  faction: FactionId;
  size: number;
  visual: BuildingVisual;
  produces?: number[];
  researches?: string[];
  requiresTech?: boolean;
  role: 'hq' | 'production' | 'tech' | 'defense' | 'economy' | 'transit' | 'special';
  /** Include in the mid-game completed base layout. */
  midGame?: boolean;
  description: string;
  /**
   * Placement / power fantasy tags for sim hooks:
   * - creepOnly: Malice buildings must sit on Malice tiles (Zerg)
   * - needsPower: Dream Land structures need a Crystal Peak in radius (Protoss)
   * - addon: Terran-style module that attaches to a host building
   * - spreadsCreep / spreadsVoid: passive tile infection
   */
  tags?: string[];
}

/**
 * Building roster — SC archetypes remapped to Zelda / Kirby logic.
 *
 * Hyrule ≈ Terran   — modular add-ons, depots, walls, combined-arms factories
 * Malice ≈ Zerg     — creep-only growth, tumors, spine blooms, Blood Moon
 * Dream Land ≈ Protoss — pylons power the grid, warp-in elites, few buildings
 */
export const BUILDING_DB: Record<number, BuildingDef> = {
  // ─── Hyrule Royal Guard (Terran / Positional Modular) ───────────────────
  200: {
    id: 200, name: 'Castle Keep', hp: 2200, buildTime: 30, cost: { primary: 400 },
    faction: FactionId.HyruleRoyalGuard, role: 'hq', size: 3.2, visual: 'keep', midGame: true,
    researches: ['hyrule-high-ground', 'hyrule-dins-fire', 'hyrule-command-radius'],
    description: 'Command Center. Trains Heroes, sets rally, and hosts Royal decrees.',
  },
  201: {
    id: 201, name: 'Soldier Barracks', hp: 900, buildTime: 15, cost: { primary: 150 },
    faction: FactionId.HyruleRoyalGuard, role: 'production', size: 2.2, visual: 'barracks', midGame: true,
    produces: [100, 104],
    researches: ['hyrule-soldier-shields', 'hyrule-fairy-corps', 'hyrule-stim-march'],
    description: 'Infantry bay. Barracks → add-on path for fairies and shield wall drills.',
  },
  202: {
    id: 202, name: 'Goron Forge', hp: 1100, buildTime: 20, cost: { primary: 200 },
    faction: FactionId.HyruleRoyalGuard, role: 'tech', size: 2.4, visual: 'forge', midGame: true,
    produces: [101],
    researches: ['hyrule-goron-siege', 'hyrule-master-forge', 'hyrule-siege-mode'],
    description: 'Factory analogue. Rolls out Goron Siege and heavy plating.',
  },
  203: {
    id: 203, name: 'Zora Reservoir', hp: 700, buildTime: 12, cost: { primary: 120 },
    faction: FactionId.HyruleRoyalGuard, role: 'economy', size: 2.0, visual: 'temple', midGame: true,
    produces: [102],
    researches: ['hyrule-zora-unlock', 'hyrule-ice-bridge'],
    description: 'Engineering bay. Trains Zora and unlocks ice-bridge terraforming.',
  },
  204: {
    id: 204, name: 'Sheikah Tower', hp: 550, buildTime: 18, cost: { primary: 175 },
    faction: FactionId.HyruleRoyalGuard, role: 'defense', size: 1.4, visual: 'tower', midGame: true,
    produces: [103],
    researches: ['hyrule-sheikah-turrets', 'hyrule-sensor-sweep'],
    description: 'Missile-turret + sensor tower. Peels fog and deploys foldable turrets.',
  },
  205: {
    id: 205, name: 'Temple of Time', hp: 800, buildTime: 22, cost: { primary: 225 },
    faction: FactionId.HyruleRoyalGuard, role: 'tech', size: 2.6, visual: 'temple', midGame: true,
    researches: ['hyrule-master-sword', 'hyrule-time-dilation'],
    description: 'Science facility. Master Sword upgrades and battlefield time buffs.',
  },
  206: {
    id: 206, name: 'Rupee Collectory', hp: 450, buildTime: 10, cost: { primary: 75 },
    faction: FactionId.HyruleRoyalGuard, role: 'economy', size: 1.6, visual: 'mine', midGame: true,
    description: 'Refinery. Workers drop Rupees — place next to resource nodes.',
  },
  207: {
    id: 207, name: 'Hylian Gatehouse', hp: 1200, buildTime: 14, cost: { primary: 100 },
    faction: FactionId.HyruleRoyalGuard, role: 'defense', size: 2.8, visual: 'wall', midGame: true,
    description: 'Bunker / wall anchor. Snap-grid Castle Stone fortifications.',
  },
  208: {
    id: 208, name: 'Supply Pavilion', hp: 400, buildTime: 8, cost: { primary: 60 },
    faction: FactionId.HyruleRoyalGuard, role: 'economy', size: 1.5, visual: 'mine', midGame: true,
    tags: ['supply'],
    description: 'Supply Depot. Raises army cap; can lower into a low wall.',
  },
  209: {
    id: 209, name: 'Sheikah Relay', hp: 500, buildTime: 12, cost: { primary: 110 },
    faction: FactionId.HyruleRoyalGuard, role: 'special', size: 1.6, visual: 'tower', midGame: true,
    tags: ['addon'],
    requiresTech: true,
    researches: ['hyrule-addon-bay'],
    description: 'Terran add-on. Attach to Barracks/Forge for transform kits and siege mode.',
  },

  // ─── Ganon's Malice Horde (Zerg / Creep Attrition) ───────────────────────
  210: {
    id: 210, name: 'Calamity Citadel', hp: 1800, buildTime: 25, cost: { primary: 350 },
    faction: FactionId.GanonMaliceHorde, role: 'hq', size: 3.4, visual: 'hive', midGame: true,
    tags: ['spreadsCreep', 'creepOnly'],
    produces: [111],
    researches: ['malice-swarm-spawn', 'malice-creep-spread', 'malice-blood-moon'],
    description: 'Hatchery. Grows on Malice, pulses creep, and morphs the Horde.',
  },
  211: {
    id: 211, name: 'Malice Pit', hp: 650, buildTime: 8, cost: { primary: 70 },
    faction: FactionId.GanonMaliceHorde, role: 'production', size: 1.8, visual: 'pit', midGame: true,
    tags: ['creepOnly'],
    produces: [110, 114],
    researches: ['malice-gloom-spawn', 'malice-adrenal'],
    description: 'Spawning Pool. Vomits Bokoblins and Gloom Spawn — creep required.',
  },
  212: {
    id: 212, name: 'Moblin War Camp', hp: 900, buildTime: 14, cost: { primary: 130 },
    faction: FactionId.GanonMaliceHorde, role: 'production', size: 2.3, visual: 'nest', midGame: true,
    tags: ['creepOnly'],
    produces: [111, 112],
    researches: ['malice-moblin-pack', 'malice-lizalfos', 'malice-overwhelm'],
    description: 'Evolution chamber / warren. Morphs Moblins and Lizalfos.',
  },
  213: {
    id: 213, name: 'Blood Moon Altar', hp: 700, buildTime: 20, cost: { primary: 200 },
    faction: FactionId.GanonMaliceHorde, role: 'special', size: 2.2, visual: 'altar', midGame: true,
    tags: ['creepOnly'],
    researches: ['malice-blood-moon', 'malice-queen-gaze'],
    description: 'Unique. Charges Blood Moon — fallen swarmers resurrect on creep.',
  },
  214: {
    id: 214, name: 'Corrupted Guardian Nest', hp: 1000, buildTime: 22, cost: { primary: 250 },
    faction: FactionId.GanonMaliceHorde, role: 'tech', size: 2.5, visual: 'nest', midGame: true,
    tags: ['creepOnly'],
    produces: [113],
    requiresTech: true,
    researches: ['malice-guardian', 'malice-laser-focus'],
    description: 'Spire. Hatches Guardian Stalkers for long-range laser siege.',
  },
  215: {
    id: 215, name: 'Malice Vein', hp: 400, buildTime: 6, cost: { primary: 50 },
    faction: FactionId.GanonMaliceHorde, role: 'economy', size: 1.4, visual: 'vein', midGame: true,
    tags: ['creepOnly'],
    description: 'Extractor. Harvests only while rooted in Malice creep.',
  },
  216: {
    id: 216, name: 'Gloom Tumor', hp: 300, buildTime: 5, cost: { primary: 40 },
    faction: FactionId.GanonMaliceHorde, role: 'special', size: 1.1, visual: 'vein', midGame: true,
    tags: ['spreadsCreep', 'creepOnly'],
    researches: ['malice-tumor-chain'],
    description: 'Creep tumor. Cheap forward node that paints Malice across voxels.',
  },
  217: {
    id: 217, name: 'Spine Bloom', hp: 450, buildTime: 7, cost: { primary: 55 },
    faction: FactionId.GanonMaliceHorde, role: 'defense', size: 1.3, visual: 'pit', midGame: true,
    tags: ['creepOnly'],
    requiresTech: true,
    description: 'Spine Crawler. Static creep defense — only lives on Malice.',
  },
  218: {
    id: 218, name: 'Blight Nest', hp: 1100, buildTime: 18, cost: { primary: 200 },
    faction: FactionId.GanonMaliceHorde, role: 'hq', size: 2.6, visual: 'hive', midGame: true,
    tags: ['spreadsCreep', 'creepOnly'],
    requiresTech: true,
    produces: [110],
    researches: ['malice-expand-hatch'],
    description: 'Satellite hatchery. Expands the creep web and local larva pressure.',
  },
  219: {
    id: 219, name: 'Ganon\'s Cocoon', hp: 800, buildTime: 16, cost: { primary: 180 },
    faction: FactionId.GanonMaliceHorde, role: 'tech', size: 2.0, visual: 'altar', midGame: true,
    tags: ['creepOnly'],
    requiresTech: true,
    researches: ['malice-morph-chamber'],
    description: 'Morph chamber. Unlocks late mutations and hero blight auras.',
  },

  // ─── Toadstool Collective (Terran Logistics / Bunker) ────────────────────
  220: {
    id: 220, name: 'Mushroom Castle', hp: 1900, buildTime: 26, cost: { primary: 360 },
    faction: FactionId.ToadstoolCollective, role: 'hq', size: 3.0, visual: 'keep', midGame: true,
    researches: ['toad-builder-kits', 'toad-bunker-doctrine'],
    description: 'HQ. Logistics hub for ?-Block attachments and pipe routing.',
  },
  221: {
    id: 221, name: 'Toad Barracks', hp: 850, buildTime: 12, cost: { primary: 120 },
    faction: FactionId.ToadstoolCollective, role: 'production', size: 2.0, visual: 'barracks', midGame: true,
    produces: [120, 121, 122, 124],
    researches: ['toad-hammer-bros', 'toad-chomp', 'toad-item-blocks'],
    description: 'Trains Builders, Guards, Hammer Bros, and Chain Chomps.',
  },
  222: {
    id: 222, name: 'Warp Pipe Hub', hp: 500, buildTime: 15, cost: { primary: 150 },
    faction: FactionId.ToadstoolCollective, role: 'transit', size: 1.8, visual: 'mine', midGame: true,
    produces: [123],
    requiresTech: true,
    researches: ['toad-lakitu', 'toad-pipe-capacity', 'toad-pipe-network'],
    description: 'Add-on transit. Links Warp Pipes like a dropship / bunker network.',
  },
  223: {
    id: 223, name: 'Brick Bunker', hp: 1100, buildTime: 14, cost: { primary: 100 },
    faction: FactionId.ToadstoolCollective, role: 'defense', size: 2.2, visual: 'wall', midGame: true,
    description: 'Loadable bunker. Guards fire from slits; Chomps leash to the door.',
  },
  224: {
    id: 224, name: 'Item Block Foundry', hp: 700, buildTime: 16, cost: { primary: 160 },
    faction: FactionId.ToadstoolCollective, role: 'tech', size: 2.0, visual: 'forge', midGame: true,
    requiresTech: true,
    researches: ['toad-item-blocks', 'toad-hotswap'],
    description: 'Hot-swap ?-Block modules onto structures (armor / produce / heal).',
  },
  225: {
    id: 225, name: 'Coin House', hp: 400, buildTime: 8, cost: { primary: 60 },
    faction: FactionId.ToadstoolCollective, role: 'economy', size: 1.5, visual: 'mine', midGame: true,
    tags: ['supply'],
    description: 'Supply + Coin drop-off. Terran depot with Mushroom Kingdom flair.',
  },

  // ─── Koopa Troop (Protoss / Mech Siege) ──────────────────────────────────
  230: {
    id: 230, name: 'Koopa Fortress', hp: 2100, buildTime: 28, cost: { primary: 380 },
    faction: FactionId.KoopaTroop, role: 'hq', size: 3.0, visual: 'keep', midGame: true,
    produces: [130],
    researches: ['koopa-shell-armor', 'koopa-ricochet'],
    tags: ['needsPower'],
    description: 'Nexus-fort. Warps armored shells; needs Coin Pylons nearby.',
  },
  231: {
    id: 231, name: 'Bullet Bill Factory', hp: 750, buildTime: 14, cost: { primary: 140 },
    faction: FactionId.KoopaTroop, role: 'production', size: 2.0, visual: 'forge', midGame: true,
    produces: [131],
    requiresTech: true,
    researches: ['koopa-bill-factory', 'koopa-bill-barrage'],
    tags: ['needsPower'],
    description: 'Robotics / factory. Mass-warps Bullet Bills down lanes.',
  },
  232: {
    id: 232, name: 'Airship Dock', hp: 900, buildTime: 22, cost: { primary: 280 },
    faction: FactionId.KoopaTroop, role: 'special', size: 2.6, visual: 'platform', midGame: true,
    produces: [134],
    requiresTech: true,
    researches: ['koopa-airship'],
    tags: ['needsPower'],
    description: 'Stargate analogue. Constructs capital Airships.',
  },
  233: {
    id: 233, name: 'Magikoopa Sanctum', hp: 800, buildTime: 16, cost: { primary: 180 },
    faction: FactionId.KoopaTroop, role: 'tech', size: 2.1, visual: 'temple', midGame: true,
    produces: [132, 133],
    researches: ['koopa-magikoopa', 'koopa-hammer-bros', 'koopa-geometry'],
    tags: ['needsPower'],
    description: 'Templar archives. Magikoopa warps and Hammer Bro cadres.',
  },
  234: {
    id: 234, name: 'Coin Pylon', hp: 350, buildTime: 6, cost: { primary: 50 },
    faction: FactionId.KoopaTroop, role: 'economy', size: 1.2, visual: 'crystal', midGame: true,
    tags: ['power'],
    description: 'Pylon. Powers Koopa structures in a radius; drops Coin income.',
  },
  235: {
    id: 235, name: 'Thwomp Battery', hp: 600, buildTime: 12, cost: { primary: 120 },
    faction: FactionId.KoopaTroop, role: 'defense', size: 1.6, visual: 'tower', midGame: true,
    tags: ['needsPower'],
    requiresTech: true,
    description: 'Photon cannon. Slams grounded foes; needs Coin Pylon power.',
  },

  // ─── Dream Land Star Guard (Protoss / Elite Assimilation) ────────────────
  240: {
    id: 240, name: 'Fountain of Dreams', hp: 2000, buildTime: 28, cost: { primary: 400 },
    faction: FactionId.DreamLandStarGuard, role: 'hq', size: 3.3, visual: 'nexus', midGame: true,
    tags: ['needsPower'],
    researches: ['star-waddle-drill', 'star-copy-matrix', 'star-dream-tempo'],
    description: 'Nexus. Channels Star Bits; Chrono-like Dream Tempo from here.',
  },
  241: {
    id: 241, name: 'Star Shrine', hp: 700, buildTime: 12, cost: { primary: 120 },
    faction: FactionId.DreamLandStarGuard, role: 'production', size: 2.0, visual: 'shrine', midGame: true,
    tags: ['needsPower', 'warpIn'],
    produces: [140, 144],
    researches: ['star-warp-in', 'star-warp-rider'],
    description: 'Gateway. Warps Bandana Dees and Star Allies onto the field.',
  },
  242: {
    id: 242, name: 'Copy-Essence Matrix', hp: 850, buildTime: 18, cost: { primary: 200 },
    faction: FactionId.DreamLandStarGuard, role: 'tech', size: 2.3, visual: 'matrix', midGame: true,
    tags: ['needsPower'],
    researches: ['star-double-copy', 'star-assimilate'],
    description: 'Dark shrine unique. Elite units absorb defeated enemy weapon traits.',
  },
  243: {
    id: 243, name: 'Meta Knight Dojo', hp: 900, buildTime: 20, cost: { primary: 220 },
    faction: FactionId.DreamLandStarGuard, role: 'tech', size: 2.2, visual: 'dojo', midGame: true,
    tags: ['needsPower'],
    produces: [141, 142],
    requiresTech: true,
    researches: ['star-meta-knight', 'star-knuckle'],
    description: 'Templar archives. Meta Knight and Knuckle Joe elites only.',
  },
  244: {
    id: 244, name: 'Warp Star Platform', hp: 750, buildTime: 16, cost: { primary: 180 },
    faction: FactionId.DreamLandStarGuard, role: 'special', size: 2.4, visual: 'platform', midGame: true,
    tags: ['needsPower'],
    produces: [143],
    researches: ['star-warp-rider', 'star-prism-ferry'],
    description: 'Stargate. Launches Warp Star Riders for hit-and-run raids.',
  },
  245: {
    id: 245, name: 'Crystal Peak', hp: 500, buildTime: 8, cost: { primary: 80 },
    faction: FactionId.DreamLandStarGuard, role: 'economy', size: 1.5, visual: 'crystal', midGame: true,
    tags: ['power'],
    description: 'Pylon. Powers nearby structures and collects Star Bits.',
  },
  246: {
    id: 246, name: 'Popstar Observatory', hp: 600, buildTime: 14, cost: { primary: 150 },
    faction: FactionId.DreamLandStarGuard, role: 'defense', size: 1.8, visual: 'tower', midGame: true,
    tags: ['needsPower'],
    researches: ['star-detection'],
    description: 'Observer hub. Reveals cloaked Malice and long-range LoS.',
  },
  247: {
    id: 247, name: 'Friend Heart Beacon', hp: 450, buildTime: 10, cost: { primary: 100 },
    faction: FactionId.DreamLandStarGuard, role: 'transit', size: 1.5, visual: 'shrine', midGame: true,
    tags: ['needsPower', 'warpIn'],
    requiresTech: true,
    description: 'Warp prism pad. Forward warp-in rally for Gateway units.',
  },
  248: {
    id: 248, name: 'Star Barrier', hp: 550, buildTime: 11, cost: { primary: 125 },
    faction: FactionId.DreamLandStarGuard, role: 'defense', size: 1.5, visual: 'tower', midGame: true,
    tags: ['needsPower'],
    requiresTech: true,
    description: 'Photon cannon. Hard defense while Crystal Peak power holds.',
  },
  249: {
    id: 249, name: 'Star Bit Siphon', hp: 420, buildTime: 9, cost: { primary: 70 },
    faction: FactionId.DreamLandStarGuard, role: 'economy', size: 1.4, visual: 'crystal', midGame: true,
    tags: ['needsPower'],
    description: 'Assimilator. Pulls Star Bits from nodes under pylon power.',
  },

  // ─── NightMare & Dark Matter (Zerg / Parasitic Void) ─────────────────────
  250: {
    id: 250, name: 'Dark Star Rod Altar', hp: 1600, buildTime: 24, cost: { primary: 320 },
    faction: FactionId.NightmareDarkMatter, role: 'hq', size: 2.8, visual: 'altar', midGame: true,
    tags: ['spreadsVoid'],
    produces: [150, 151],
    researches: ['void-husk-flood', 'void-tile-seed', 'void-parasite-wave'],
    description: 'Infested nexus. Spawns husks and seeds Void tiles that drain shields.',
  },
  251: {
    id: 251, name: 'Zero Spire', hp: 1000, buildTime: 22, cost: { primary: 260 },
    faction: FactionId.NightmareDarkMatter, role: 'special', size: 2.8, visual: 'tower', midGame: true,
    tags: ['spreadsVoid'],
    produces: [153, 154],
    requiresTech: true,
    researches: ['void-zero-eye', 'void-termina'],
    description: 'Greater spire. Manifests Zero Eye and Void Termina Fragments.',
  },
  252: {
    id: 252, name: 'Void Cyst', hp: 280, buildTime: 4, cost: { primary: 35 },
    faction: FactionId.NightmareDarkMatter, role: 'special', size: 1.0, visual: 'vein', midGame: true,
    tags: ['spreadsVoid'],
    researches: ['void-cyst-chain'],
    description: 'Creep-tumor analogue. Cheap Void paint for parasitic expansion.',
  },
  253: {
    id: 253, name: 'Scarfy Nest', hp: 500, buildTime: 10, cost: { primary: 90 },
    faction: FactionId.NightmareDarkMatter, role: 'production', size: 1.7, visual: 'nest', midGame: true,
    tags: ['spreadsVoid'],
    produces: [152],
    researches: ['void-scarfy'],
    description: 'Suicide pool. Hatches Scarfies that explode into Void blooms.',
  },
  254: {
    id: 254, name: 'Dark Matter Extractor', hp: 380, buildTime: 7, cost: { primary: 55 },
    faction: FactionId.NightmareDarkMatter, role: 'economy', size: 1.4, visual: 'vein', midGame: true,
    tags: ['spreadsVoid'],
    description: 'Extractor on Void. Star Bits drip faster the more tiles are corrupted.',
  },
  255: {
    id: 255, name: 'Parasite Spire', hp: 650, buildTime: 14, cost: { primary: 150 },
    faction: FactionId.NightmareDarkMatter, role: 'defense', size: 1.6, visual: 'tower', midGame: true,
    tags: ['spreadsVoid'],
    requiresTech: true,
    researches: ['void-shield-drain'],
    description: 'Spine / spore hybrid. Drains shields and seeds Void under attackers.',
  },
};

export function getBuilding(id: number): BuildingDef | undefined {
  return BUILDING_DB[id];
}

export function buildingsForFaction(faction: FactionId): BuildingDef[] {
  return Object.values(BUILDING_DB).filter((b) => b.faction === faction);
}

export function midGameBuildings(faction: FactionId | number): BuildingDef[] {
  return Object.values(BUILDING_DB).filter((b) => b.faction === faction && b.midGame);
}
