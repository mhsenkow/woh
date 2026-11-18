import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero } from '../../sim/ecs/World';

export const GANON_UNITS = {
  bokoblin: { id: 110, name: 'Bokoblin', hp: 50, damage: 8, range: 1.0, speed: 2.8, attackSpeed: 1.3 },
  moblin: { id: 111, name: 'Moblin', hp: 120, damage: 18, range: 1.5, speed: 2.0, attackSpeed: 0.7 },
  lizalfos: { id: 112, name: 'Lizalfos', hp: 70, damage: 14, range: 1.2, speed: 3.2, attackSpeed: 1.1 },
  guardian: { id: 113, name: 'Guardian Stalker', hp: 250, damage: 40, range: 8.0, speed: 1.5, attackSpeed: 0.3, isRanged: true },
  gloomSpawn: { id: 114, name: 'Gloom Spawn', hp: 30, damage: 5, range: 1.0, speed: 3.5, attackSpeed: 2.0 },
};

export function spawnGanonArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  eids.push(spawnHero(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, 1, baseX, 0, baseZ));

  for (let i = 0; i < 10; i++) {
    const u = GANON_UNITS.bokoblin;
    eids.push(spawnUnit(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, u.id,
      baseX + (i % 5) * 1.2 - 2.4, 0, baseZ + Math.floor(i / 5) * 1.2 + 2, u));
  }

  for (let i = 0; i < 2; i++) {
    const u = GANON_UNITS.moblin;
    eids.push(spawnUnit(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, u.id,
      baseX + i * 3 - 1.5, 0, baseZ + 5, u));
  }

  return eids;
}
