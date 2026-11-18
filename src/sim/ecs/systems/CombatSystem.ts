import { defineQuery, hasComponent } from 'bitecs/legacy';
import { Position, Health, Combat, Target, Standee, Building } from '../components';
import { getMeta } from '../World';

const combatQuery = defineQuery([Position, Health, Combat, Target]);

const HIGH_GROUND_BONUS = 0.25;

/** Callbacks for presentation layer (VFX / voxel craters). */
export type CombatEvent =
  | { type: 'hit'; x: number; y: number; z: number; ranged: boolean }
  | { type: 'kill'; x: number; y: number; z: number; wasBuilding: boolean };

const eventQueue: CombatEvent[] = [];

export function drainCombatEvents(): CombatEvent[] {
  return eventQueue.splice(0, eventQueue.length);
}

export function CombatSystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const entities = combatQuery(world);

  for (const eid of entities) {
    if (!Target.hasTarget[eid]) continue;

    const targetEid = Target.entity[eid];
    if (Health.current[targetEid] <= 0) {
      Target.hasTarget[eid] = 0;
      if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 0;
      continue;
    }

    const dx = Position.x[targetEid] - Position.x[eid];
    const dz = Position.z[targetEid] - Position.z[eid];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > Combat.range[eid]) continue;

    Combat.cooldown[eid] -= dt;
    if (Combat.cooldown[eid] > 0) continue;

    Combat.cooldown[eid] = 1.0 / Math.max(0.1, Combat.attackSpeed[eid]);
    if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 2;

    let damage = Combat.damage[eid];

    const heightDiff = Position.y[eid] - Position.y[targetEid];
    if (heightDiff > 0.5) damage *= 1 + HIGH_GROUND_BONUS;

    damage = Math.max(0, damage - (Health.armor[targetEid] || 0));

    if (Health.shield[targetEid] > 0) {
      const shieldAbsorb = Math.min(Health.shield[targetEid], damage);
      Health.shield[targetEid] -= shieldAbsorb;
      damage -= shieldAbsorb;
    }

    Health.current[targetEid] -= damage;

    eventQueue.push({
      type: 'hit',
      x: Position.x[targetEid],
      y: Position.y[targetEid],
      z: Position.z[targetEid],
      ranged: Combat.isRanged[eid] === 1,
    });

    if (Health.current[targetEid] <= 0) {
      Health.current[targetEid] = 0;
      if (hasComponent(world, Standee, targetEid)) Standee.animState[targetEid] = 4;
      eventQueue.push({
        type: 'kill',
        x: Position.x[targetEid],
        y: Position.y[targetEid],
        z: Position.z[targetEid],
        wasBuilding: hasComponent(world, Building, targetEid),
      });
    } else if (hasComponent(world, Standee, targetEid) && Health.max[targetEid] > 0) {
      Standee.damageLevel[targetEid] = 1 - Health.current[targetEid] / Health.max[targetEid];
    }
  }
}
