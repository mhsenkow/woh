/**
 * Per-unit attack kits — unique combat identity for every creature.
 * Good (Order) vs Bad (Chaos) pairs mirror each other thematically.
 */

export type LandscapeImpact = 'explosion' | 'fire' | 'ice' | 'tunnel' | 'malice' | 'void';

export interface AttackKit {
  /** Splash around primary target. */
  splashRadius?: number;
  splashFactor?: number;
  /** Extra multiplier vs buildings. */
  buildingMul?: number;
  /** Heal nearest wounded ally instead of dealing damage (Fairy). */
  healAmount?: number;
  healPreferWounded?: boolean;
  /** Apply status to target on hit. */
  debuff?: { id: 'slow' | 'gloomDrain'; duration: number; speedMul?: number };
  /** Buff nearest ally (Magikoopa). */
  allyBuff?: { id: 'magikoopaBuff' | 'stim'; duration: number; damageMul?: number; speedMul?: number; armorAdd?: number };
  /** Drain shield before HP. */
  shieldDrain?: number;
  /** Death explosion (Scarfy). */
  deathExplosion?: { radius: number; damage: number };
  /** Paint creep/void on hit. */
  paint?: { kind: 'malice' | 'void'; radius: number };
  /** Landscape impact at target. */
  landscape?: { impact: LandscapeImpact; radius: number };
  /** Pack / swarm bonus: +damage per nearby ally of same type. */
  packBonus?: { perAlly: number; cap: number; radius: number };
  /** Bonus attack speed while on malice creep. */
  creepAdrenal?: number;
  /** Bonus move implied elsewhere; here attack speed on void. */
  voidPower?: number;
  /** Chain / pierce: also hit next nearest enemy in cone. */
  pierceCount?: number;
  /** Suicide charge — kill self on hit. */
  suicideOnHit?: boolean;
  /** Bonus damage while attacker has more allies nearby (Overwhelm). */
  overwhelm?: { perAlly: number; cap: number; radius: number };
}

/** Kits keyed by UnitType.id (heroes = 999; abilities handle specials). */
export const ATTACK_KITS: Record<number, AttackKit> = {
  /** Heroes — light splash so basic attacks feel punchy between ability casts. */
  999: { splashRadius: 1.1, splashFactor: 0.25 },
  // ── Hyrule (Order) ──────────────────────────────────────────────────────
  /** Hylian Soldier — disciplined spear; slight armor shred via consistent hits. */
  100: { overwhelm: { perAlly: 0.5, cap: 4, radius: 4 } },
  /** Goron Siege — artillery boulder; heavy vs buildings, splash crater. */
  101: { buildingMul: 1.75, splashRadius: 1.8, splashFactor: 0.45, landscape: { impact: 'explosion', radius: 0.9 } },
  /** Zora Swimmer — harpoon; slows target (ice-tipped). */
  102: { debuff: { id: 'slow', duration: 2.5, speedMul: 0.55 }, landscape: { impact: 'ice', radius: 0.6 } },
  /** Sheikah Turret — focused bolt; slight pierce. */
  103: { pierceCount: 1 },
  /** Fairy Healer — restores allies, never attacks. */
  104: { healAmount: 18, healPreferWounded: true },

  // ── Malice (Chaos) ──────────────────────────────────────────────────────
  /** Bokoblin — swarm overwhelm; Blood Moon fodder. */
  110: { overwhelm: { perAlly: 1, cap: 8, radius: 5 }, paint: { kind: 'malice', radius: 1 } },
  /** Moblin — brute smash; bonus vs buildings. */
  111: { buildingMul: 1.4, splashRadius: 1.2, splashFactor: 0.3 },
  /** Lizalfos — creep skirmisher; faster attacks on malice. */
  112: { creepAdrenal: 1.25, debuff: { id: 'slow', duration: 1.2, speedMul: 0.7 } },
  /** Guardian Stalker — laser siege; ignites wood, building mul. */
  113: { buildingMul: 2.0, landscape: { impact: 'fire', radius: 1.2 }, pierceCount: 1 },
  /** Gloom Spawn — parasite; drains + paints gloom. */
  114: { shieldDrain: 8, debuff: { id: 'gloomDrain', duration: 3, speedMul: 0.65 }, paint: { kind: 'malice', radius: 1.5 } },

  // ── Toadstool (Order) ───────────────────────────────────────────────────
  /** Toad Builder — weak wrench smack; tiny tunnel dig. */
  120: { landscape: { impact: 'tunnel', radius: 0.4 } },
  /** Mushroom Guard — bunker spear; armor buff pulse to self-stack via allyBuff self-ish. */
  121: { overwhelm: { perAlly: 0.8, cap: 3, radius: 3 } },
  /** Hammer Bro — arcing hammers; splash. */
  122: { splashRadius: 1.4, splashFactor: 0.4 },
  /** Lakitu Scout — cloud spit; light slow. */
  123: { debuff: { id: 'slow', duration: 1.5, speedMul: 0.75 } },
  /** Chain Chomp — savage bite; splash knock chunk. */
  124: { splashRadius: 1.5, splashFactor: 0.5, landscape: { impact: 'explosion', radius: 0.7 } },

  // ── Koopa (Chaos) ───────────────────────────────────────────────────────
  /** Koopa Troopa — shell bash; ricochet pierce. */
  130: { pierceCount: 1 },
  /** Bullet Bill — piercing rocket; building mul + fire. */
  131: { pierceCount: 2, buildingMul: 1.6, landscape: { impact: 'fire', radius: 0.8 } },
  /** Magikoopa — wand blast + buff nearest ally. */
  132: { allyBuff: { id: 'magikoopaBuff', duration: 6, damageMul: 1.3, armorAdd: 2 } },
  /** Koopa Hammer Bro — arc hammers. */
  133: { splashRadius: 1.3, splashFactor: 0.35 },
  /** Airship — bombardment splash + fire. */
  134: { splashRadius: 2.5, splashFactor: 0.55, buildingMul: 1.5, landscape: { impact: 'fire', radius: 1.4 } },

  // ── Dream Land (Order) ──────────────────────────────────────────────────
  /** Bandana Waddle Dee — spear flurry; pack bonus. */
  140: { overwhelm: { perAlly: 0.6, cap: 5, radius: 4 } },
  /** Meta Knight — mach tornado slash; splash. */
  141: { splashRadius: 1.6, splashFactor: 0.5 },
  /** Knuckle Joe — vulcan jab; attack-speed self adrenal via pack. */
  142: { overwhelm: { perAlly: 0.4, cap: 3, radius: 3 } },
  /** Warp Star Rider — star shot; pierce. */
  143: { pierceCount: 1 },
  /** Star Ally — friend heart; light heal splash on hit (heal ally near target). */
  144: { healAmount: 8, splashRadius: 1.2, splashFactor: 0.25 },

  // ── Nightmare (Chaos) ───────────────────────────────────────────────────
  /** Waddle Doo Husk — beam; paints void. */
  150: { paint: { kind: 'void', radius: 1 }, voidPower: 1.15 },
  /** Dark Matter Shard — void bolt; shield drain. */
  151: { shieldDrain: 12, paint: { kind: 'void', radius: 1.5 }, landscape: { impact: 'void', radius: 1 } },
  /** Scarfy — kamikaze; death explosion. */
  152: { suicideOnHit: true, deathExplosion: { radius: 2.2, damage: 28 }, landscape: { impact: 'explosion', radius: 1.2 } },
  /** Zero Eye — beam + heavy shield drain. */
  153: { shieldDrain: 20, pierceCount: 1, voidPower: 1.2 },
  /** Void Termina Fragment — titan smash; void paint + splash. */
  154: { splashRadius: 2.2, splashFactor: 0.6, paint: { kind: 'void', radius: 2.5 }, landscape: { impact: 'void', radius: 2 }, buildingMul: 1.4 },
};

export function getAttackKit(unitTypeId: number): AttackKit {
  return ATTACK_KITS[unitTypeId] ?? {};
}
