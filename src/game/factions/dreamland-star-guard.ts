import { FactionId, AlignmentId } from '../../sim/ecs/components';
import { spawnUnit, spawnHero } from '../../sim/ecs/World';

export const DREAMLAND_UNITS = {
  waddleDee: { id: 140, name: 'Bandana Waddle Dee', hp: 60, damage: 10, range: 1.5, speed: 2.8, attackSpeed: 1.2 },
  metaKnight: { id: 141, name: 'Meta Knight', hp: 180, damage: 22, range: 1.5, speed: 3.5, attackSpeed: 1.5 },
  knuckleJoe: { id: 142, name: 'Knuckle Joe', hp: 100, damage: 18, range: 1.2, speed: 3.0, attackSpeed: 1.3 },
  warpStar: { id: 143, name: 'Warp Star Rider', hp: 80, damage: 15, range: 4.0, speed: 4.0, attackSpeed: 0.8, isRanged: true },
  starAlly: { id: 144, name: 'Star Ally', hp: 120, damage: 20, range: 2.0, speed: 2.5, attackSpeed: 1.0 },
};

export function spawnDreamlandArmy(world: object, baseX: number, baseZ: number): number[] {
  const eids: number[] = [];

  eids.push(spawnHero(world, FactionId.DreamLandStarGuard, AlignmentId.Order, 4, baseX, 0, baseZ));

  for (let i = 0; i < 3; i++) {
    const u = DREAMLAND_UNITS.waddleDee;
    eids.push(spawnUnit(world, FactionId.DreamLandStarGuard, AlignmentId.Order, u.id,
      baseX + i * 1.5 - 1.5, 0, baseZ + 2, u));
  }

  const mk = DREAMLAND_UNITS.metaKnight;
  eids.push(spawnUnit(world, FactionId.DreamLandStarGuard, AlignmentId.Order, mk.id,
    baseX + 2, 0, baseZ + 1, mk));

  return eids;
}
