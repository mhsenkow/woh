import { FactionId } from '../../sim/ecs/components';

export interface UnitDef {
  id: number;
  name: string;
  faction: FactionId;
  hp: number;
  damage: number;
  range: number;
  speed: number;
  attackSpeed: number;
  isRanged?: boolean;
  buildTime: number;
  cost: { primary: number };
  tier: number;
  /** True if locked behind a tech-tree unlock node. */
  requiresTech?: boolean;
  role: 'worker' | 'melee' | 'ranged' | 'siege' | 'support' | 'elite' | 'swarm' | 'air';
  tags?: string[];
  spriteSheet?: string;
}

export const UNIT_DB: Record<number, UnitDef> = {
  // ——— Hyrule Royal Guard (100–109) ———
  100: { id: 100, name: 'Hylian Soldier', faction: FactionId.HyruleRoyalGuard, hp: 80, damage: 10, range: 1.2, speed: 2.5, attackSpeed: 1.0, buildTime: 5, cost: { primary: 50 }, tier: 1, role: 'melee', tags: ['infantry'] },
  101: { id: 101, name: 'Goron Siege', faction: FactionId.HyruleRoyalGuard, hp: 200, damage: 30, range: 4.0, speed: 1.2, attackSpeed: 0.5, isRanged: true, buildTime: 12, cost: { primary: 150 }, tier: 2, requiresTech: true, role: 'siege', tags: ['artillery', 'buildingDamage'] },
  102: { id: 102, name: 'Zora Swimmer', faction: FactionId.HyruleRoyalGuard, hp: 60, damage: 12, range: 1.0, speed: 3.5, attackSpeed: 1.2, buildTime: 6, cost: { primary: 60 }, tier: 1, requiresTech: true, role: 'melee', tags: ['aquatic'] },
  103: { id: 103, name: 'Sheikah Turret', faction: FactionId.HyruleRoyalGuard, hp: 150, damage: 18, range: 6.0, speed: 0, attackSpeed: 0.8, isRanged: true, buildTime: 10, cost: { primary: 120 }, tier: 2, requiresTech: true, role: 'ranged', tags: ['turret', 'transform'] },
  104: { id: 104, name: 'Fairy Healer', faction: FactionId.HyruleRoyalGuard, hp: 40, damage: 0, range: 3.0, speed: 2.8, attackSpeed: 0, buildTime: 8, cost: { primary: 80 }, tier: 1, requiresTech: true, role: 'support', tags: ['heal'] },

  // ——— Ganon's Malice Horde (110–119) ———
  110: { id: 110, name: 'Bokoblin', faction: FactionId.GanonMaliceHorde, hp: 50, damage: 8, range: 1.0, speed: 2.8, attackSpeed: 1.3, buildTime: 3, cost: { primary: 25 }, tier: 1, role: 'swarm', tags: ['bloodMoon'] },
  111: { id: 111, name: 'Moblin', faction: FactionId.GanonMaliceHorde, hp: 120, damage: 18, range: 1.5, speed: 2.0, attackSpeed: 0.7, buildTime: 8, cost: { primary: 75 }, tier: 1, requiresTech: true, role: 'melee', tags: ['brute'] },
  112: { id: 112, name: 'Lizalfos', faction: FactionId.GanonMaliceHorde, hp: 70, damage: 14, range: 1.2, speed: 3.2, attackSpeed: 1.1, buildTime: 5, cost: { primary: 55 }, tier: 1, requiresTech: true, role: 'melee', tags: ['creepBonus'] },
  113: { id: 113, name: 'Guardian Stalker', faction: FactionId.GanonMaliceHorde, hp: 250, damage: 40, range: 8.0, speed: 1.5, attackSpeed: 0.3, isRanged: true, buildTime: 20, cost: { primary: 250 }, tier: 2, requiresTech: true, role: 'siege', tags: ['ancient', 'laser'] },
  114: { id: 114, name: 'Gloom Spawn', faction: FactionId.GanonMaliceHorde, hp: 30, damage: 5, range: 1.0, speed: 3.5, attackSpeed: 2.0, buildTime: 2, cost: { primary: 15 }, tier: 1, requiresTech: true, role: 'swarm', tags: ['parasite', 'creep'] },

  // ——— Toadstool Collective (120–129) ———
  120: { id: 120, name: 'Toad Builder', faction: FactionId.ToadstoolCollective, hp: 50, damage: 4, range: 1.0, speed: 2.5, attackSpeed: 0.8, buildTime: 4, cost: { primary: 30 }, tier: 1, role: 'worker', tags: ['builder', 'itemBlock'] },
  121: { id: 121, name: 'Mushroom Guard', faction: FactionId.ToadstoolCollective, hp: 90, damage: 12, range: 1.2, speed: 2.2, attackSpeed: 1.0, buildTime: 6, cost: { primary: 55 }, tier: 1, role: 'melee', tags: ['bunker'] },
  122: { id: 122, name: 'Hammer Bro', faction: FactionId.ToadstoolCollective, hp: 75, damage: 15, range: 3.0, speed: 2.0, attackSpeed: 0.9, isRanged: true, buildTime: 7, cost: { primary: 70 }, tier: 1, requiresTech: true, role: 'ranged', tags: ['arc'] },
  123: { id: 123, name: 'Lakitu Scout', faction: FactionId.ToadstoolCollective, hp: 45, damage: 8, range: 5.0, speed: 3.0, attackSpeed: 0.6, isRanged: true, buildTime: 8, cost: { primary: 85 }, tier: 2, requiresTech: true, role: 'air', tags: ['scout', 'cloud'] },
  124: { id: 124, name: 'Chain Chomp', faction: FactionId.ToadstoolCollective, hp: 160, damage: 25, range: 1.5, speed: 2.8, attackSpeed: 0.5, buildTime: 14, cost: { primary: 160 }, tier: 2, requiresTech: true, role: 'elite', tags: ['leash'] },

  // ——— Koopa Troop (130–139) ———
  130: { id: 130, name: 'Koopa Troopa', faction: FactionId.KoopaTroop, hp: 70, damage: 10, range: 1.0, speed: 2.2, attackSpeed: 1.0, buildTime: 5, cost: { primary: 40 }, tier: 1, role: 'melee', tags: ['shell', 'ricochet'] },
  131: { id: 131, name: 'Bullet Bill', faction: FactionId.KoopaTroop, hp: 40, damage: 35, range: 6.0, speed: 4.0, attackSpeed: 0.3, isRanged: true, buildTime: 3, cost: { primary: 45 }, tier: 1, requiresTech: true, role: 'siege', tags: ['projectile', 'factory'] },
  132: { id: 132, name: 'Magikoopa', faction: FactionId.KoopaTroop, hp: 55, damage: 20, range: 5.0, speed: 2.0, attackSpeed: 0.7, isRanged: true, buildTime: 10, cost: { primary: 100 }, tier: 2, requiresTech: true, role: 'support', tags: ['buff', 'geometryWarp'] },
  133: { id: 133, name: 'Hammer Bro', faction: FactionId.KoopaTroop, hp: 80, damage: 16, range: 3.0, speed: 2.0, attackSpeed: 0.9, isRanged: true, buildTime: 7, cost: { primary: 65 }, tier: 1, requiresTech: true, role: 'ranged', tags: ['arc'] },
  134: { id: 134, name: 'Airship', faction: FactionId.KoopaTroop, hp: 400, damage: 30, range: 7.0, speed: 1.0, attackSpeed: 0.4, isRanged: true, buildTime: 25, cost: { primary: 350 }, tier: 3, requiresTech: true, role: 'air', tags: ['capital', 'siege'] },

  // ——— Dream Land Star Guard (140–149) ———
  140: { id: 140, name: 'Bandana Waddle Dee', faction: FactionId.DreamLandStarGuard, hp: 60, damage: 10, range: 1.5, speed: 2.8, attackSpeed: 1.2, buildTime: 4, cost: { primary: 35 }, tier: 1, role: 'melee', tags: ['ally'] },
  141: { id: 141, name: 'Meta Knight', faction: FactionId.DreamLandStarGuard, hp: 180, damage: 22, range: 1.5, speed: 3.5, attackSpeed: 1.5, buildTime: 15, cost: { primary: 180 }, tier: 2, requiresTech: true, role: 'elite', tags: ['copyEssence'] },
  142: { id: 142, name: 'Knuckle Joe', faction: FactionId.DreamLandStarGuard, hp: 100, damage: 18, range: 1.2, speed: 3.0, attackSpeed: 1.3, buildTime: 10, cost: { primary: 110 }, tier: 2, requiresTech: true, role: 'melee', tags: ['fighter'] },
  143: { id: 143, name: 'Warp Star Rider', faction: FactionId.DreamLandStarGuard, hp: 80, damage: 15, range: 4.0, speed: 4.0, attackSpeed: 0.8, isRanged: true, buildTime: 12, cost: { primary: 130 }, tier: 2, requiresTech: true, role: 'air', tags: ['mobility'] },
  144: { id: 144, name: 'Star Ally', faction: FactionId.DreamLandStarGuard, hp: 120, damage: 20, range: 2.0, speed: 2.5, attackSpeed: 1.0, buildTime: 14, cost: { primary: 160 }, tier: 3, requiresTech: true, role: 'elite', tags: ['copyEssence'] },

  // ——— NightMare & Dark Matter (150–159) ———
  150: { id: 150, name: 'Waddle Doo Husk', faction: FactionId.NightmareDarkMatter, hp: 35, damage: 6, range: 2.0, speed: 2.5, attackSpeed: 1.5, isRanged: true, buildTime: 2, cost: { primary: 15 }, tier: 1, role: 'swarm', tags: ['husk', 'beam'] },
  151: { id: 151, name: 'Dark Matter Shard', faction: FactionId.NightmareDarkMatter, hp: 80, damage: 15, range: 3.0, speed: 2.0, attackSpeed: 0.8, isRanged: true, buildTime: 8, cost: { primary: 90 }, tier: 1, requiresTech: true, role: 'ranged', tags: ['void'] },
  152: { id: 152, name: 'Scarfy', faction: FactionId.NightmareDarkMatter, hp: 25, damage: 20, range: 1.0, speed: 4.0, attackSpeed: 0.5, buildTime: 3, cost: { primary: 30 }, tier: 2, requiresTech: true, role: 'swarm', tags: ['suicide', 'explode'] },
  153: { id: 153, name: 'Zero Eye', faction: FactionId.NightmareDarkMatter, hp: 200, damage: 28, range: 5.0, speed: 1.2, attackSpeed: 0.6, isRanged: true, buildTime: 18, cost: { primary: 220 }, tier: 2, requiresTech: true, role: 'elite', tags: ['shieldDrain'] },
  154: { id: 154, name: 'Void Termina Fragment', faction: FactionId.NightmareDarkMatter, hp: 350, damage: 35, range: 3.0, speed: 0.8, attackSpeed: 0.4, buildTime: 30, cost: { primary: 400 }, tier: 3, requiresTech: true, role: 'elite', tags: ['titan', 'void'] },
};

export function getUnit(id: number): UnitDef | undefined {
  return UNIT_DB[id];
}

export function unitsForFaction(faction: FactionId): UnitDef[] {
  return Object.values(UNIT_DB).filter((u) => u.faction === faction);
}
