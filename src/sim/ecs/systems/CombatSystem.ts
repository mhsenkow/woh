import { defineQuery, hasComponent } from 'bitecs/legacy';
import {
  Position, Health, Combat, Target, Standee, Building, UnitType, Faction, Pathfinding, Hero,
} from '../components';
import { getMeta, removeEntity } from '../World';
import { getAttackKit } from '../../combat/AttackKits';
import {
  applyDamage,
  damageInRadius,
  healEntity,
  alliesInRadius,
  enemiesInRadius,
  distXZ,
  addStatus,
  tickStatuses,
  effectiveDamage,
  effectiveAttackSpeed,
  paintCreep,
  onCreep,
  onVoid,
  pushCombatEvent,
  drainCombatEvents,
  killEntity,
  isAttackMove,
  clearAttackMove,
} from '../../combat/CombatEffects';

export type { WorldCombatEvent as CombatEvent } from '../../combat/CombatEffects';
export { drainCombatEvents };

const combatQuery = defineQuery([Position, Health, Combat, Target]);
const allHealthQuery = defineQuery([Health]);
const pendingRemove: number[] = [];

/** Player attack-move / idle auto-acquire radius. */
const SEEK_RADIUS = 7;

export function CombatSystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const elapsed = meta.time.elapsed;
  const entities = combatQuery(world);

  for (const eid of entities) {
    tickStatuses(eid, elapsed);

    // Dead attackers stop fighting and queue removal
    if (Health.current[eid] <= 0) {
      Target.hasTarget[eid] = 0;
      Pathfinding.hasPath[eid] = 0;
      if (!pendingRemove.includes(eid)) pendingRemove.push(eid);
      continue;
    }

    // Void tile shield drain for Nightmare victims standing on void
    if (onVoid(Position.x[eid], Position.z[eid]) && Faction.id[eid] !== 5) {
      if (Health.shield[eid] > 0) Health.shield[eid] = Math.max(0, Health.shield[eid] - 4 * dt);
    }

    // Creep adrenal / void power (self buffs while standing on tiles)
    const kitPreview = getAttackKit(UnitType.id[eid] ?? 0);
    if (kitPreview.creepAdrenal && onCreep(Position.x[eid], Position.z[eid])) {
      addStatus(eid, {
        id: 'adrenal',
        expiresAt: elapsed + 0.4,
        attackSpeedMul: kitPreview.creepAdrenal,
      });
    }
    if (kitPreview.voidPower && onVoid(Position.x[eid], Position.z[eid])) {
      addStatus(eid, {
        id: 'adrenal',
        expiresAt: elapsed + 0.4,
        attackSpeedMul: kitPreview.voidPower,
      });
    }

    // Chase: refresh goal to live target position, stop at range
    if (Target.hasTarget[eid]) {
      const targetEid = Target.entity[eid];
      if ((Health.current[targetEid] ?? 0) <= 0) {
        Target.hasTarget[eid] = 0;
        if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 0;
      } else {
        Target.x[eid] = Position.x[targetEid];
        Target.y[eid] = Position.y[targetEid];
        Target.z[eid] = Position.z[targetEid];
        const dist = distXZ(eid, targetEid);
        const range = Combat.range[eid];
        if (dist > range) {
          // Walk toward target but aim for standoff
          const dx = Position.x[targetEid] - Position.x[eid];
          const dz = Position.z[targetEid] - Position.z[eid];
          const inv = 1 / Math.max(0.001, dist);
          const stand = Math.max(0.2, range * 0.85);
          Pathfinding.goalX[eid] = Position.x[targetEid] - dx * inv * stand;
          Pathfinding.goalZ[eid] = Position.z[targetEid] - dz * inv * stand;
          Pathfinding.hasPath[eid] = 1;
        } else {
          Pathfinding.hasPath[eid] = 0;
        }
      }
    }

    const kitEarly = getAttackKit(UnitType.id[eid] ?? 0);
    // Pure healers pulse without an enemy target
    if (kitEarly.healAmount && kitEarly.healAmount > 0 && Combat.damage[eid] <= 0) {
      performHealPulse(world, eid, kitEarly.healAmount, Combat.range[eid] || 3, elapsed);
      continue;
    }

    // Attack-move seek for player units
    if (!Target.hasTarget[eid] && Faction.id[eid] === meta.playerFaction && isAttackMove(eid)) {
      const foes = enemiesInRadius(world, eid, SEEK_RADIUS);
      if (foes.length > 0) {
        let best = foes[0];
        let bestD = distXZ(eid, best);
        for (const f of foes) {
          const d = distXZ(eid, f);
          if (d < bestD) { best = f; bestD = d; }
        }
        Target.hasTarget[eid] = 1;
        Target.entity[eid] = best;
        clearAttackMove(eid);
      }
    }

    if (!Target.hasTarget[eid]) continue;

    const targetEid = Target.entity[eid];
    if ((Health.current[targetEid] ?? 0) <= 0) continue;

    const kit = kitEarly;
    const dist = distXZ(eid, targetEid);

    if (dist > Combat.range[eid]) continue;

    // Cooldown always ticks while in range
    Combat.cooldown[eid] -= dt;
    if (Combat.cooldown[eid] > 0) continue;

    const atkSpd = effectiveAttackSpeed(eid, Combat.attackSpeed[eid]);
    Combat.cooldown[eid] = 1.0 / Math.max(0.1, atkSpd);
    if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 2;

    let damage = effectiveDamage(eid, Combat.damage[eid]);

    // Pack / overwhelm bonus
    const pack = kit.packBonus ?? kit.overwhelm;
    if (pack) {
      const allies = alliesInRadius(world, eid, pack.radius);
      const n = Math.min(pack.cap, allies.length);
      damage += pack.perAlly * n;
    }

    // Building bonus
    if (kit.buildingMul && hasComponent(world, Building, targetEid)) {
      damage *= kit.buildingMul;
    }

    // Shield drain pre-hit
    if (kit.shieldDrain && Health.shield[targetEid] > 0) {
      Health.shield[targetEid] = Math.max(0, Health.shield[targetEid] - kit.shieldDrain);
    }

    const ranged = Combat.isRanged[eid] === 1;
    applyDamage(world, eid, targetEid, damage, { ranged, kind: 'attack' });

    // Splash
    if (kit.splashRadius && kit.splashFactor) {
      damageInRadius(
        world,
        eid,
        Position.x[targetEid],
        Position.z[targetEid],
        kit.splashRadius,
        damage * kit.splashFactor,
        { ranged, kind: 'splash' },
      );
    }

    // Pierce — next nearest enemy beyond target
    if (kit.pierceCount && kit.pierceCount > 0) {
      const foes = enemiesInRadius(world, eid, Combat.range[eid] + 2)
        .filter((e) => e !== targetEid)
        .sort((a, b) => distXZ(eid, a) - distXZ(eid, b));
      for (let i = 0; i < kit.pierceCount && i < foes.length; i++) {
        applyDamage(world, eid, foes[i], damage * 0.6, { ranged, kind: 'pierce' });
      }
    }

    // Debuff
    if (kit.debuff) {
      addStatus(targetEid, {
        id: kit.debuff.id === 'slow' ? 'slow' : 'gloomDrain',
        expiresAt: elapsed + kit.debuff.duration,
        speedMul: kit.debuff.speedMul,
      });
    }

    // Ally buff (Magikoopa)
    if (kit.allyBuff) {
      const allies = alliesInRadius(world, eid, 6);
      if (allies.length > 0) {
        let best = allies[0];
        for (const a of allies) {
          if (Health.current[a] / Health.max[a] < Health.current[best] / Health.max[best]) best = a;
        }
        addStatus(best, {
          id: kit.allyBuff.id,
          expiresAt: elapsed + kit.allyBuff.duration,
          damageMul: kit.allyBuff.damageMul,
          speedMul: kit.allyBuff.speedMul,
          armorAdd: kit.allyBuff.armorAdd,
        });
        pushCombatEvent({
          type: 'buff',
          x: Position.x[best],
          y: Position.y[best],
          z: Position.z[best],
        });
      }
    }

    // Star Ally light heal on nearby ally when attacking
    if (kit.healAmount && Combat.damage[eid] > 0) {
      const allies = alliesInRadius(world, eid, 4);
      if (allies.length > 0) healEntity(world, allies[0], kit.healAmount);
    }

    // Paint creep / void
    if (kit.paint) {
      paintCreep(Position.x[targetEid], Position.z[targetEid], kit.paint.radius, kit.paint.kind);
    }

    // Landscape
    if (kit.landscape) {
      pushCombatEvent({
        type: 'landscape',
        x: Position.x[targetEid],
        y: Position.y[targetEid],
        z: Position.z[targetEid],
        impact: kit.landscape.impact,
        radius: kit.landscape.radius,
      });
    }

    // Suicide (Scarfy)
    if (kit.suicideOnHit) {
      if (kit.deathExplosion) {
        damageInRadius(
          world,
          eid,
          Position.x[eid],
          Position.z[eid],
          kit.deathExplosion.radius,
          kit.deathExplosion.damage,
          { kind: 'suicide' },
        );
        pushCombatEvent({
          type: 'landscape',
          x: Position.x[eid],
          y: Position.y[eid],
          z: Position.z[eid],
          impact: 'explosion',
          radius: kit.deathExplosion.radius * 0.6,
        });
      }
      killEntity(world, eid);
      if (!pendingRemove.includes(eid)) pendingRemove.push(eid);
    }
  }

  flushDead(world);
}

function performHealPulse(
  world: object,
  eid: number,
  amount: number,
  range: number,
  _elapsed: number,
): void {
  const dt = getMeta(world).time.delta;
  Combat.cooldown[eid] -= dt;
  if (Combat.cooldown[eid] > 0) return;
  Combat.cooldown[eid] = 1.2;

  const allies = alliesInRadius(world, eid, range);
  if (allies.length === 0) return;
  let best = allies[0];
  let bestRatio = Health.current[best] / Math.max(1, Health.max[best]);
  for (const a of allies) {
    const ratio = Health.current[a] / Math.max(1, Health.max[a]);
    if (ratio < bestRatio) {
      best = a;
      bestRatio = ratio;
    }
  }
  if (bestRatio >= 1) return;
  healEntity(world, best, amount);
  if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 2;
}

function flushDead(world: object): void {
  // Keep corpses briefly for Blood Moon; remove standee entities after 8s wall is handled in main.
  // Here: clear Target on anyone targeting dead, and queue building mesh cleanup via events.
  for (const eid of allHealthQuery(world)) {
    if (Health.current[eid] > 0) continue;
    Target.hasTarget[eid] = 0;
  }
  // Actually remove suicide / scarfy immediately
  while (pendingRemove.length > 0) {
    const eid = pendingRemove.pop()!;
    if (hasComponent(world, Hero, eid)) continue; // keep hero corpses selectable? remove anyway
    if (hasComponent(world, Building, eid)) continue;
    // Defer mesh removal to main via kill event; entity stays for corpse registry lookup
    // Soft-disable: zero speed
    if (hasComponent(world, Pathfinding, eid)) Pathfinding.speed[eid] = 0;
    void removeEntity;
  }
}
