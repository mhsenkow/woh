import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero } from '../../sim/ecs/World';

export const KOOPA_UNITS = {
  koopaTroopa: { id: 130, name: 'Koopa Troopa', hp: 70, damage: 10, range: 1.0, speed: 2.2, attackSpeed: 1.0 },
  bulletBill: { id: 131, name: 'Bullet Bill', hp: 40, damage: 35, range: 6.0, speed: 4.0, attackSpeed: 0.3, isRanged: true },
  magikoopa: { id: 132, name: 'Magikoopa', hp: 55, damage: 20, range: 5.0, speed: 2.0, attackSpeed: 0.7, isRanged: true },
  hammerBro: { id: 133, name: 'Hammer Bro', hp: 80, damage: 16, range: 3.0, speed: 2.0, attackSpeed: 0.9, isRanged: true },
  airship: { id: 134, name: 'Airship', hp: 400, damage: 30, range: 7.0, speed: 1.0, attackSpeed: 0.4, isRanged: true },
};

export function spawnKoopaArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  eids.push(spawnHero(world, FactionId.KoopaTroop, AlignmentId.Chaos, 3, baseX, 0, baseZ));

  for (let i = 0; i < 4; i++) {
    const u = KOOPA_UNITS.koopaTroopa;
    eids.push(spawnUnit(world, FactionId.KoopaTroop, AlignmentId.Chaos, u.id,
      baseX + (i % 2) * 1.5 - 0.75, 0, baseZ + Math.floor(i / 2) * 1.5 + 2, u));
  }

  const u = KOOPA_UNITS.magikoopa;
  eids.push(spawnUnit(world, FactionId.KoopaTroop, AlignmentId.Chaos, u.id,
    baseX, 0, baseZ + 4, u));

  return eids;
}
