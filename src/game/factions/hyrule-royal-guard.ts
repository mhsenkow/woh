import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero, spawnBuilding } from '../../sim/ecs/World';

export const HYRULE_UNITS = {
  hylianSoldier: { id: 100, name: 'Hylian Soldier', hp: 80, damage: 10, range: 1.2, speed: 2.5, attackSpeed: 1.0 },
  goronSiege: { id: 101, name: 'Goron Siege', hp: 200, damage: 30, range: 4.0, speed: 1.2, attackSpeed: 0.5, isRanged: true },
  zoraSwimmer: { id: 102, name: 'Zora Swimmer', hp: 60, damage: 12, range: 1.0, speed: 3.5, attackSpeed: 1.2 },
  sheikahTurret: { id: 103, name: 'Sheikah Turret', hp: 150, damage: 18, range: 6.0, speed: 0, attackSpeed: 0.8, isRanged: true },
  fairyHealer: { id: 104, name: 'Fairy Healer', hp: 40, damage: 0, range: 3.0, speed: 2.8, attackSpeed: 0.85 },
};

export const HYRULE_BUILDINGS = {
  barracks: { id: 200, name: 'Barracks', hp: 800 },
  goronForge: { id: 201, name: 'Goron Forge', hp: 1000 },
  zoraReservoir: { id: 202, name: 'Zora Reservoir', hp: 600 },
  sheikahTower: { id: 203, name: 'Sheikah Tower', hp: 500 },
  castleKeep: { id: 204, name: 'Castle Keep', hp: 2000 },
};

export function spawnHyruleArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  const hero = spawnHero(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, 0, baseX, 0, baseZ);
  eids.push(hero);

  for (let i = 0; i < 6; i++) {
    const u = HYRULE_UNITS.hylianSoldier;
    const eid = spawnUnit(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, u.id,
      baseX + (i % 3) * 1.5 - 1.5, 0, baseZ + Math.floor(i / 3) * 1.5 + 2, u);
    eids.push(eid);
  }

  for (let i = 0; i < 2; i++) {
    const u = HYRULE_UNITS.goronSiege;
    const eid = spawnUnit(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, u.id,
      baseX + i * 2 - 1, 0, baseZ + 5, u);
    eids.push(eid);
  }

  const zora = HYRULE_UNITS.zoraSwimmer;
  eids.push(spawnUnit(world, FactionId.HyruleRoyalGuard, AlignmentId.Order, zora.id,
    baseX + 3, 0, baseZ + 1, zora));

  spawnBuilding(world, FactionId.HyruleRoyalGuard, HYRULE_BUILDINGS.castleKeep.id, baseX, 0, baseZ - 3);
  spawnBuilding(world, FactionId.HyruleRoyalGuard, HYRULE_BUILDINGS.barracks.id, baseX - 3, 0, baseZ - 2);

  return eids;
}
