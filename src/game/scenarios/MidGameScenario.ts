import { FactionId, AlignmentId, Building } from '../../sim/ecs/components';
import { spawnUnit, spawnHero, spawnBuilding } from '../../sim/ecs/World';
import { midGameBuildings } from '../buildings/BuildingDefinitions';
import { HYRULE_UNITS } from '../factions/hyrule-royal-guard';
import { GANON_UNITS } from '../factions/ganon-malice-horde';
import { DREAMLAND_UNITS } from '../factions/dreamland-star-guard';
import { Health } from '../../sim/ecs/components';
import { getBuilding } from '../buildings/BuildingDefinitions';

export interface ScenarioResult {
  unitEids: number[];
  buildingEids: number[];
}

/** Layout offsets for a completed mid-game base around a spawn point. */
const BASE_LAYOUT: { dx: number; dz: number }[] = [
  { dx: 0, dz: 0 },       // HQ
  { dx: -4.5, dz: 1.5 },  // primary production
  { dx: 4.5, dz: 1.5 },   // secondary production
  { dx: -3.5, dz: -3.5 }, // tech / unique
  { dx: 3.5, dz: -3.5 },  // tech / air / forge
  { dx: 0, dz: -5.5 },    // detection / temple
  { dx: -6, dz: -1 },     // resource / crystal
  { dx: 6, dz: -1 },      // wall / tumor / crystal 2
];

function completeBuilding(world: object, eid: number, typeId: number): void {
  Building.isComplete[eid] = 1;
  Building.buildProgress[eid] = 1;
  const def = getBuilding(typeId);
  if (def) {
    Health.current[eid] = def.hp;
    Health.max[eid] = def.hp;
  }
}

function spawnCompleteBase(
  world: object,
  factionId: FactionId,
  baseX: number,
  baseZ: number,
): number[] {
  const buildings = midGameBuildings(factionId);
  const eids: number[] = [];

  buildings.forEach((def, i) => {
    const slot = BASE_LAYOUT[i % BASE_LAYOUT.length];
    // Spread extras in a second ring
    const ring = Math.floor(i / BASE_LAYOUT.length);
    const dx = slot.dx + (ring > 0 ? (i % 2 === 0 ? 2.5 : -2.5) : 0);
    const dz = slot.dz + (ring > 0 ? -2.5 : 0);
    const eid = spawnBuilding(world, factionId, def.id, baseX + dx, 0, baseZ + dz);
    completeBuilding(world, eid, def.id);
    eids.push(eid);
  });

  return eids;
}

function spawnFormation(
  world: object,
  factionId: FactionId,
  alignment: AlignmentId,
  baseX: number,
  baseZ: number,
  units: { stats: { id: number; hp: number; damage: number; range: number; speed: number; attackSpeed: number; isRanged?: boolean }; count: number; forward: number }[],
): number[] {
  const eids: number[] = [];
  for (const row of units) {
    for (let i = 0; i < row.count; i++) {
      const col = i - (row.count - 1) / 2;
      eids.push(
        spawnUnit(
          world,
          factionId,
          alignment,
          row.stats.id,
          baseX + col * 1.4,
          0,
          baseZ + row.forward,
          row.stats,
        ),
      );
    }
  }
  return eids;
}

/**
 * Mid-game 3-faction skirmish:
 *  - SW: Hyrule Royal Guard (Order / Terran)
 *  - NE: Ganon's Malice Horde (Chaos / Zerg)
 *  - NW: Dream Land Star Guard (Order / Protoss)
 */
export function spawnMidGameScenario(
  world: object,
  spawns: { faction: number; x: number; z: number }[],
): ScenarioResult {
  const hyrule = spawns.find((s) => s.faction === FactionId.HyruleRoyalGuard) ?? { x: -16, z: -14 };
  const malice = spawns.find((s) => s.faction === FactionId.GanonMaliceHorde) ?? { x: 16, z: 14 };
  const dream = spawns.find((s) => s.faction === FactionId.DreamLandStarGuard) ?? { x: -16, z: 14 };

  const unitEids: number[] = [];
  const buildingEids: number[] = [];

  // ── Hyrule ──────────────────────────────────────────────────────────────
  buildingEids.push(...spawnCompleteBase(world, FactionId.HyruleRoyalGuard, hyrule.x, hyrule.z));
  unitEids.push(spawnHero(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, 0, hyrule.x + 1, 0, hyrule.z + 3));
  unitEids.push(
    ...spawnFormation(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, hyrule.x, hyrule.z, [
      { stats: HYRULE_UNITS.hylianSoldier, count: 8, forward: 5 },
      { stats: HYRULE_UNITS.goronSiege, count: 2, forward: 7 },
      { stats: HYRULE_UNITS.zoraSwimmer, count: 3, forward: 4 },
      { stats: HYRULE_UNITS.fairyHealer, count: 2, forward: 3.5 },
      { stats: HYRULE_UNITS.sheikahTurret, count: 2, forward: 2 },
    ]),
  );

  // ── Malice ──────────────────────────────────────────────────────────────
  buildingEids.push(...spawnCompleteBase(world, FactionId.GanonMaliceHorde, malice.x, malice.z));
  unitEids.push(spawnHero(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, 1, malice.x - 1, 0, malice.z - 3));
  unitEids.push(
    ...spawnFormation(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, malice.x, malice.z, [
      { stats: GANON_UNITS.bokoblin, count: 14, forward: -5 },
      { stats: GANON_UNITS.gloomSpawn, count: 6, forward: -4 },
      { stats: GANON_UNITS.moblin, count: 3, forward: -6.5 },
      { stats: GANON_UNITS.lizalfos, count: 3, forward: -3.5 },
      { stats: GANON_UNITS.guardian, count: 1, forward: -8 },
    ]),
  );

  // ── Dream Land ──────────────────────────────────────────────────────────
  buildingEids.push(...spawnCompleteBase(world, FactionId.DreamLandStarGuard, dream.x, dream.z));
  unitEids.push(spawnHero(world, FactionId.DreamLandStarGuard, AlignmentId.Order, 4, dream.x + 1.5, 0, dream.z - 2));
  unitEids.push(
    ...spawnFormation(world, FactionId.DreamLandStarGuard, AlignmentId.Order, dream.x, dream.z, [
      { stats: DREAMLAND_UNITS.waddleDee, count: 5, forward: -4 },
      { stats: DREAMLAND_UNITS.starAlly, count: 2, forward: -5 },
      { stats: DREAMLAND_UNITS.metaKnight, count: 1, forward: -3 },
      { stats: DREAMLAND_UNITS.knuckleJoe, count: 2, forward: -5.5 },
      { stats: DREAMLAND_UNITS.warpStar, count: 2, forward: -6.5 },
    ]),
  );

  return { unitEids, buildingEids };
}
