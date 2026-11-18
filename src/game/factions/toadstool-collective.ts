import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero } from '../../sim/ecs/World';

export const TOADSTOOL_UNITS = {
  toadBuilder: { id: 120, name: 'Toad Builder', hp: 50, damage: 4, range: 1.0, speed: 2.5, attackSpeed: 0.8 },
  mushroomGuard: { id: 121, name: 'Mushroom Guard', hp: 90, damage: 12, range: 1.2, speed: 2.2, attackSpeed: 1.0 },
  hammerBro: { id: 122, name: 'Hammer Bro', hp: 75, damage: 15, range: 3.0, speed: 2.0, attackSpeed: 0.9, isRanged: true },
  lakitu: { id: 123, name: 'Lakitu Scout', hp: 45, damage: 8, range: 5.0, speed: 3.0, attackSpeed: 0.6, isRanged: true },
  chainChomp: { id: 124, name: 'Chain Chomp', hp: 160, damage: 25, range: 1.5, speed: 2.8, attackSpeed: 0.5 },
};

export function spawnToadstoolArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  eids.push(spawnHero(world, FactionId.ToadstoolCollective, AlignmentId.Order, 2, baseX, 0, baseZ));

  for (let i = 0; i < 4; i++) {
    const u = TOADSTOOL_UNITS.mushroomGuard;
    eids.push(spawnUnit(world, FactionId.ToadstoolCollective, AlignmentId.Order, u.id,
      baseX + (i % 2) * 1.5 - 0.75, 0, baseZ + Math.floor(i / 2) * 1.5 + 2, u));
  }

  for (let i = 0; i < 2; i++) {
    const u = TOADSTOOL_UNITS.hammerBro;
    eids.push(spawnUnit(world, FactionId.ToadstoolCollective, AlignmentId.Order, u.id,
      baseX + i * 2 - 1, 0, baseZ + 5, u));
  }

  return eids;
}
