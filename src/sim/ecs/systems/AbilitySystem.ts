import { defineQuery, hasComponent } from 'bitecs/legacy';
import {
  Position, Hero, Health, Faction, Combat, Standee, Pathfinding, UnitType,
} from '../components';
import { getMeta, spawnUnit } from '../World';
import { getHero } from '../../../game/heroes/HeroDefinitions';
import {
  damageInRadius,
  applyDamage,
  enemiesInRadius,
  addStatus,
  paintCreep,
  pushCombatEvent,
  takeCorpsesNear,
} from '../../combat/CombatEffects';
import { AlignmentId, FactionId } from '../components';

const heroQuery = defineQuery([Position, Hero, Health, Faction, Combat]);

export interface AbilityCommand {
  heroEid: number;
  abilitySlot: 0 | 1 | 2;
  targetX?: number;
  targetZ?: number;
  targetEid?: number;
}

const abilityQueue: AbilityCommand[] = [];

export function queueAbility(cmd: AbilityCommand): void {
  abilityQueue.push(cmd);
}

export function AbilitySystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const elapsed = meta.time.elapsed;
  const heroes = heroQuery(world);

  for (const eid of heroes) {
    Hero.ability1Cooldown[eid] = Math.max(0, Hero.ability1Cooldown[eid] - dt);
    Hero.ability2Cooldown[eid] = Math.max(0, Hero.ability2Cooldown[eid] - dt);
    Hero.ability3Cooldown[eid] = Math.max(0, Hero.ability3Cooldown[eid] - dt);
  }

  while (abilityQueue.length > 0) {
    const cmd = abilityQueue.shift()!;
    const eid = cmd.heroEid;
    if ((Health.current[eid] ?? 0) <= 0) continue;
    if (!hasComponent(world, Hero, eid)) continue;

    const heroId = Hero.heroId[eid];
    const def = getHero(heroId);
    if (!def) continue;

    const slot = cmd.abilitySlot;
    const ability = def.abilities[slot];
    const cdField = slot === 0 ? 'ability1Cooldown' : slot === 1 ? 'ability2Cooldown' : 'ability3Cooldown';
    if (Hero[cdField][eid] > 0) continue;

    Hero[cdField][eid] = ability.cooldown;
    if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 2;

    const tx = cmd.targetX ?? Position.x[eid];
    const tz = cmd.targetZ ?? Position.z[eid];
    const dmg = ability.damage ?? 0;

    pushCombatEvent({
      type: 'ability',
      name: ability.name,
      x: Position.x[eid],
      y: Position.y[eid],
      z: Position.z[eid],
    });

    executeHeroAbility(world, eid, heroId, slot, tx, tz, cmd.targetEid, dmg, ability.range, elapsed);
  }
}

function executeHeroAbility(
  world: object,
  eid: number,
  heroId: number,
  slot: 0 | 1 | 2,
  tx: number,
  tz: number,
  targetEid: number | undefined,
  dmg: number,
  range: number,
  elapsed: number,
): void {
  switch (heroId) {
    // ── Link ──────────────────────────────────────────────────────────────
    case 0:
      if (slot === 0) {
        // Spin Attack — AoE melee
        damageInRadius(world, eid, Position.x[eid], Position.z[eid], range, dmg, { kind: 'spin' });
        pushCombatEvent({ type: 'landscape', x: Position.x[eid], y: 0, z: Position.z[eid], impact: 'explosion', radius: 0.5 });
      } else if (slot === 1) {
        // Bow Shot — long range single (headshot 2x if target wounded)
        const foe = pickFoe(world, eid, range, targetEid, tx, tz);
        if (foe !== null) {
          const ratio = Health.current[foe] / Math.max(1, Health.max[foe]);
          applyDamage(world, eid, foe, dmg * (ratio < 0.35 ? 2 : 1), { ranged: true, kind: 'bow' });
        }
      } else {
        // Paraglider — dash to point
        dashTo(eid, tx, tz, range);
      }
      break;

    // ── Ganondorf ─────────────────────────────────────────────────────────
    case 1:
      if (slot === 0) {
        // Malice Burst — AoE + creep
        damageInRadius(world, eid, Position.x[eid], Position.z[eid], range, dmg, { kind: 'malice' });
        paintCreep(Position.x[eid], Position.z[eid], range, 'malice');
      } else if (slot === 1) {
        // Dark Punch
        const foe = pickFoe(world, eid, range, targetEid, tx, tz);
        if (foe !== null) applyDamage(world, eid, foe, dmg, { kind: 'punch' });
      } else {
        // Blood Moon Ritual — revive Bokoblin / Gloom corpses on creep
        const revived = takeCorpsesNear(Position.x[eid], Position.z[eid], 20, (c) =>
          c.factionId === FactionId.GanonMaliceHorde && (c.unitTypeId === 110 || c.unitTypeId === 114),
        );
        for (const c of revived.slice(0, 8)) {
          const stats = c.unitTypeId === 114
            ? { hp: 30, damage: 5, range: 1.0, speed: 3.5, attackSpeed: 2.0 }
            : { hp: 50, damage: 8, range: 1.0, speed: 2.8, attackSpeed: 1.3 };
          spawnUnit(world, FactionId.GanonMaliceHorde, AlignmentId.Chaos, c.unitTypeId, c.x, 0, c.z, stats);
        }
        pushCombatEvent({
          type: 'ability', name: 'Blood Moon', x: Position.x[eid], y: 2, z: Position.z[eid],
        });
      }
      break;

    // ── Mario ─────────────────────────────────────────────────────────────
    case 2:
      if (slot === 0) {
        // Fireball Barrage
        damageInRadius(world, eid, tx, tz, 2.2, dmg, { ranged: true, kind: 'fireball' });
        pushCombatEvent({ type: 'landscape', x: tx, y: 0, z: tz, impact: 'fire', radius: 1.5 });
      } else if (slot === 1) {
        // Super Star
        addStatus(eid, {
          id: 'star',
          expiresAt: elapsed + 5,
          invulnerable: true,
          speedMul: 1.5,
        });
        pushCombatEvent({ type: 'buff', x: Position.x[eid], y: Position.y[eid], z: Position.z[eid] });
      } else {
        // Ground Pound
        damageInRadius(world, eid, Position.x[eid], Position.z[eid], range, dmg, { kind: 'pound' });
        pushCombatEvent({
          type: 'landscape',
          x: Position.x[eid], y: Position.y[eid], z: Position.z[eid],
          impact: 'explosion', radius: 1.6,
        });
      }
      break;

    // ── Bowser ────────────────────────────────────────────────────────────
    case 3:
      if (slot === 0) {
        // Fire Breath cone approx as forward disk
        damageInRadius(world, eid, tx, tz, range * 0.7, dmg, { kind: 'breath' });
        pushCombatEvent({ type: 'landscape', x: tx, y: 0, z: tz, impact: 'fire', radius: 1.8 });
      } else if (slot === 1) {
        // Shell Slam charge
        dashTo(eid, tx, tz, range + 4);
        damageInRadius(world, eid, tx, tz, 2.5, dmg, { kind: 'shell' });
        pushCombatEvent({ type: 'landscape', x: tx, y: 0, z: tz, impact: 'explosion', radius: 1.2 });
      } else {
        // Koopa Summon
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          spawnUnit(
            world,
            FactionId.KoopaTroop,
            AlignmentId.Chaos,
            130,
            Position.x[eid] + Math.cos(a) * 1.5,
            0,
            Position.z[eid] + Math.sin(a) * 1.5,
            { hp: 70, damage: 10, range: 1.0, speed: 2.2, attackSpeed: 1.0 },
          );
        }
      }
      break;

    // ── Kirby ─────────────────────────────────────────────────────────────
    case 4:
      if (slot === 0) {
        // Inhale & Copy — damage + steal a damage buff from foe
        const foe = pickFoe(world, eid, range, targetEid, tx, tz);
        if (foe !== null) {
          applyDamage(world, eid, foe, 22, { kind: 'inhale' });
          addStatus(eid, {
            id: 'copyEssence',
            expiresAt: elapsed + 12,
            damageMul: 1.35,
            attackSpeedMul: 1.15,
          });
        }
      } else if (slot === 1) {
        // Star Spit
        const foe = pickFoe(world, eid, range, targetEid, tx, tz);
        if (foe !== null) applyDamage(world, eid, foe, dmg, { ranged: true, kind: 'star' });
        else damageInRadius(world, eid, tx, tz, 1.5, dmg, { ranged: true, kind: 'star' });
      } else {
        // Float
        dashTo(eid, tx, tz, range);
      }
      break;

    // ── Marx ──────────────────────────────────────────────────────────────
    case 5:
      if (slot === 0) {
        // Dark Matter Wave — AoE + shield drain
        const foes = enemiesInRadius(world, eid, range);
        for (const f of foes) {
          if (Health.shield[f] > 0) Health.shield[f] = Math.max(0, Health.shield[f] - 25);
          applyDamage(world, eid, f, dmg, { kind: 'wave' });
        }
        paintCreep(Position.x[eid], Position.z[eid], range * 0.6, 'void');
      } else if (slot === 1) {
        // Jester Teleport
        dashTo(eid, tx, tz, range);
      } else {
        // Void Corruption
        paintCreep(tx, tz, range, 'void');
        damageInRadius(world, eid, tx, tz, range * 0.5, 20, { kind: 'void' });
        pushCombatEvent({ type: 'landscape', x: tx, y: 0, z: tz, impact: 'void', radius: range });
      }
      break;
  }
}

function pickFoe(
  world: object,
  eid: number,
  range: number,
  targetEid: number | undefined,
  tx: number,
  tz: number,
): number | null {
  if (targetEid !== undefined && (Health.current[targetEid] ?? 0) > 0 && Faction.id[targetEid] !== Faction.id[eid]) {
    return targetEid;
  }
  const foes = enemiesInRadius(world, eid, Math.max(range, 1));
  if (foes.length === 0) {
    // Prefer enemy nearest to click point
    const all = enemiesInRadius(world, eid, range + 8);
    let best: number | null = null;
    let bestD = Infinity;
    for (const f of all) {
      const dx = Position.x[f] - tx;
      const dz = Position.z[f] - tz;
      const d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }
  let best = foes[0];
  let bestD = Infinity;
  for (const f of foes) {
    const dx = Position.x[f] - tx;
    const dz = Position.z[f] - tz;
    const d = dx * dx + dz * dz;
    if (d < bestD) { bestD = d; best = f; }
  }
  return best;
}

function dashTo(eid: number, tx: number, tz: number, maxRange: number): void {
  const dx = tx - Position.x[eid];
  const dz = tz - Position.z[eid];
  const dist = Math.sqrt(dx * dx + dz * dz);
  const scale = dist > maxRange && dist > 0 ? maxRange / dist : 1;
  Position.x[eid] += dx * scale;
  Position.z[eid] += dz * scale;
  Pathfinding.hasPath[eid] = 0;
  Pathfinding.goalX[eid] = Position.x[eid];
  Pathfinding.goalZ[eid] = Position.z[eid];
}
