import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero } from '../../sim/ecs/World';

export const NIGHTMARE_UNITS = {
  waddleDoo: { id: 150, name: 'Waddle Doo Husk', hp: 35, damage: 6, range: 2.0, speed: 2.5, attackSpeed: 1.5, isRanged: true },
  darkMatterShard: { id: 151, name: 'Dark Matter Shard', hp: 80, damage: 15, range: 3.0, speed: 2.0, attackSpeed: 0.8, isRanged: true },
  scarfy: { id: 152, name: 'Scarfy', hp: 25, damage: 20, range: 1.0, speed: 4.0, attackSpeed: 0.5 },
  zeroEye: { id: 153, name: 'Zero Eye', hp: 200, damage: 28, range: 5.0, speed: 1.2, attackSpeed: 0.6, isRanged: true },
  voidTermina: { id: 154, name: 'Void Termina Fragment', hp: 350, damage: 35, range: 3.0, speed: 0.8, attackSpeed: 0.4 },
};

export function spawnNightmareArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  eids.push(spawnHero(world, FactionId.NightmareDarkMatter, AlignmentId.Chaos, 5, baseX, 0, baseZ));

  for (let i = 0; i < 8; i++) {
    const u = NIGHTMARE_UNITS.waddleDoo;
    eids.push(spawnUnit(world, FactionId.NightmareDarkMatter, AlignmentId.Chaos, u.id,
      baseX + (i % 4) * 1.0 - 1.5, 0, baseZ + Math.floor(i / 4) * 1.0 + 2, u));
  }

  const dm = NIGHTMARE_UNITS.darkMatterShard;
  eids.push(spawnUnit(world, FactionId.NightmareDarkMatter, AlignmentId.Chaos, dm.id,
    baseX, 0, baseZ + 4, dm));

  return eids;
}
