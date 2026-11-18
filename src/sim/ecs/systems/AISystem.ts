import { defineQuery, hasComponent } from 'bitecs/legacy';
import {
  Position, Health, Combat, Target, Faction, Pathfinding, Building, Hero, Standee,
  AlignmentId, UnitType,
} from '../components';
import { getMeta } from '../World';
import { getBuilding } from '../../../game/buildings/BuildingDefinitions';

const unitQuery = defineQuery([Position, Health, Combat, Faction, Target, Pathfinding]);
const allCombatants = defineQuery([Position, Health, Faction]);

/** How often AI re-evaluates (ticks). */
const AI_PERIOD = 6;

/** Ticks between wave launches. */
const WAVE_PERIOD = 240;

/** HP ratio below which units flee toward own HQ. */
const FLEE_HP = 0.28;

/** Soft focus-fire: prefer targets already under attack. */
const FOCUS_BONUS = 0.55;

interface Living {
  eid: number;
  faction: number;
  alignment: number;
  x: number;
  z: number;
  isBuilding: boolean;
  isHero: boolean;
  isHq: boolean;
  hp: number;
  hpRatio: number;
}

interface FactionBrain {
  /** Shared focus target for the faction this wave. */
  focusEid: number;
  /** Enemy HQ / base rally point. */
  assaultX: number;
  assaultZ: number;
  /** Own HQ for retreat. */
  homeX: number;
  homeZ: number;
  /** Wave phase 0=hold/defend, 1=push, 2=assault HQ. */
  phase: number;
  livingCount: number;
}

const brains = new Map<number, FactionBrain>();
/** Per-target attacker counts for focus fire. */
const attackerCounts = new Map<number, number>();

function ensureBrain(faction: number): FactionBrain {
  let b = brains.get(faction);
  if (!b) {
    b = {
      focusEid: -1,
      assaultX: 0,
      assaultZ: 0,
      homeX: 0,
      homeZ: 0,
      phase: 0,
      livingCount: 0,
    };
    brains.set(faction, b);
  }
  return b;
}

function isHqBuilding(eid: number): boolean {
  if (!Building.type[eid]) return false;
  const def = getBuilding(Building.type[eid]);
  return def?.role === 'hq';
}

/**
 * Watchable skirmish AI — Chrono Trigger–battle readable:
 *  - Waves: factions cycle defend → push → HQ assault
 *  - Focus fire: soft-stack onto a shared wounded / elite target
 *  - Flee: low-HP units retreat to own HQ
 *  - Base assaults: heroes + waves prioritize enemy HQs
 */
export function AISystem(world: object): void {
  const meta = getMeta(world);
  const tick = meta.time.tick;
  if (tick % AI_PERIOD !== 0) return;

  const units = unitQuery(world);
  attackerCounts.clear();

  // Count current attackers for focus-fire weighting
  for (const eid of units) {
    if (Health.current[eid] <= 0) continue;
    if (Target.hasTarget[eid]) {
      const t = Target.entity[eid];
      attackerCounts.set(t, (attackerCounts.get(t) ?? 0) + 1);
    }
  }

  const living: Living[] = [];
  const byFaction = new Map<number, Living[]>();

  for (const eid of allCombatants(world)) {
    if (Health.current[eid] <= 0) continue;
    const maxHp = Math.max(1, Health.max[eid]);
    const entry: Living = {
      eid,
      faction: Faction.id[eid],
      alignment: Faction.alignment[eid],
      x: Position.x[eid],
      z: Position.z[eid],
      isBuilding: hasComponent(world, Building, eid),
      isHero: hasComponent(world, Hero, eid),
      isHq: hasComponent(world, Building, eid) && isHqBuilding(eid),
      hp: Health.current[eid],
      hpRatio: Health.current[eid] / maxHp,
    };
    living.push(entry);
    let list = byFaction.get(entry.faction);
    if (!list) {
      list = [];
      byFaction.set(entry.faction, list);
    }
    list.push(entry);
  }

  // Refresh faction brains (home / assault / wave phase / focus)
  for (const [faction, members] of byFaction) {
    const brain = ensureBrain(faction);
    brain.livingCount = members.filter((m) => !m.isBuilding).length;

    const ownHq = members.find((m) => m.isHq);
    if (ownHq) {
      brain.homeX = ownHq.x;
      brain.homeZ = ownHq.z;
    } else {
      // Fallback: centroid of own buildings / units
      let sx = 0, sz = 0, n = 0;
      for (const m of members) {
        sx += m.x; sz += m.z; n++;
      }
      if (n > 0) {
        brain.homeX = sx / n;
        brain.homeZ = sz / n;
      }
    }

    // Pick nearest enemy HQ as assault objective
    let bestHq: Living | null = null;
    let bestHqDist = Infinity;
    for (const other of living) {
      if (other.faction === faction) continue;
      if (!other.isHq) continue;
      const dx = other.x - brain.homeX;
      const dz = other.z - brain.homeZ;
      const d = dx * dx + dz * dz;
      if (d < bestHqDist) {
        bestHqDist = d;
        bestHq = other;
      }
    }
    if (bestHq) {
      brain.assaultX = bestHq.x;
      brain.assaultZ = bestHq.z;
    }

    // Wave cadence: 0 defend, 1 skirmish push, 2 HQ assault
    const waveSlot = Math.floor(tick / WAVE_PERIOD) % 3;
    // Stagger factions so waves don't sync
    const stagger = (faction * 17) % 3;
    brain.phase = (waveSlot + stagger) % 3;

    // Shared focus: prefer enemy hero / wounded unit already under fire / HQ when assaulting
    let focus: Living | null = null;
    let focusScore = Infinity;
    for (const other of living) {
      if (other.faction === faction) continue;
      const dx = other.x - brain.homeX;
      const dz = other.z - brain.homeZ;
      const dist = Math.sqrt(dx * dx + dz * dz);
      let score = dist;
      if (other.isHero) score *= 0.5;
      if (other.isHq && brain.phase === 2) score *= 0.35;
      if (other.hpRatio < 0.45) score *= 0.65;
      const attackers = attackerCounts.get(other.eid) ?? 0;
      if (attackers > 0) score *= FOCUS_BONUS + 0.1 * Math.min(attackers, 4);
      if (other.isBuilding && !other.isHq && brain.phase < 2) score *= 1.2;
      if (score < focusScore) {
        focusScore = score;
        focus = other;
      }
    }
    brain.focusEid = focus?.eid ?? -1;
  }

  const playerFaction = meta.playerFaction;

  for (const eid of units) {
    if (Health.current[eid] <= 0) continue;

    const myFaction = Faction.id[eid];
    // Local player issues orders via SelectionController — don't overwrite
    if (myFaction === playerFaction) continue;

    const myAlign = Faction.alignment[eid];
    const mx = Position.x[eid];
    const mz = Position.z[eid];
    const isHero = hasComponent(world, Hero, eid);
    const canMove = Pathfinding.speed[eid] > 0.01;
    const hpRatio = Health.current[eid] / Math.max(1, Health.max[eid]);
    const brain = ensureBrain(myFaction);
    const range = Combat.range[eid];

    // ── Flee when critically wounded ─────────────────────────────────────
    if (canMove && hpRatio < FLEE_HP && !isHero) {
      Target.hasTarget[eid] = 0;
      Pathfinding.goalX[eid] = brain.homeX + (Math.sin(eid) * 2);
      Pathfinding.goalZ[eid] = brain.homeZ + (Math.cos(eid) * 2);
      Pathfinding.hasPath[eid] = 1;
      Standee.animState[eid] = 1;
      continue;
    }

    // Heroes flee only when nearly dead, then return
    if (canMove && isHero && hpRatio < 0.18) {
      Target.hasTarget[eid] = 0;
      Pathfinding.goalX[eid] = brain.homeX;
      Pathfinding.goalZ[eid] = brain.homeZ;
      Pathfinding.hasPath[eid] = 1;
      Standee.animState[eid] = 1;
      continue;
    }

    // Keep current target if alive, chaseable, and still a good fight
    if (Target.hasTarget[eid]) {
      const t = Target.entity[eid];
      if (Health.current[t] > 0) {
        const dx = Position.x[t] - mx;
        const dz = Position.z[t] - mz;
        const dist2 = dx * dx + dz * dz;
        const chaseLimit = brain.phase === 2 ? 50 : 32;
        // Stick to focus if assigned and nearby
        const stickToFocus =
          brain.focusEid === t ||
          brain.focusEid < 0 ||
          dist2 < range * range * 1.5;
        if (dist2 < chaseLimit * chaseLimit && stickToFocus) {
          if (canMove) {
            Pathfinding.goalX[eid] = Position.x[t];
            Pathfinding.goalZ[eid] = Position.z[t];
            Pathfinding.hasPath[eid] = 1;
          }
          continue;
        }
      }
      Target.hasTarget[eid] = 0;
    }

    // Wave assault: periodically ignore soft targets and march on enemy HQ
    if (canMove && brain.phase === 2 && !isHero && (eid + tick) % 5 !== 0) {
      // Most of the wave marches on the base; a few peel for local threats
      const localThreat = findLocalThreat(living, eid, myFaction, mx, mz, 10);
      if (!localThreat) {
        Pathfinding.goalX[eid] = brain.assaultX + Math.sin(eid * 1.7) * 3;
        Pathfinding.goalZ[eid] = brain.assaultZ + Math.cos(eid * 1.3) * 3;
        Pathfinding.hasPath[eid] = 1;
        Standee.animState[eid] = 1;
        // Acquire HQ as target when close enough
        const ax = brain.assaultX - mx;
        const az = brain.assaultZ - mz;
        if (ax * ax + az * az < 14 * 14) {
          const hq = living.find((l) => l.isHq && l.faction !== myFaction &&
            (l.x - brain.assaultX) ** 2 + (l.z - brain.assaultZ) ** 2 < 4);
          if (hq) {
            Target.hasTarget[eid] = 1;
            Target.entity[eid] = hq.eid;
            Target.x[eid] = hq.x;
            Target.y[eid] = 0;
            Target.z[eid] = hq.z;
          }
        }
        continue;
      }
    }

    // Defend phase: stay near home unless enemies enter perimeter
    if (canMove && brain.phase === 0 && !isHero) {
      const perimeter = findLocalThreat(living, eid, myFaction, mx, mz, 14);
      if (!perimeter) {
        const hx = brain.homeX - mx;
        const hz = brain.homeZ - mz;
        if (hx * hx + hz * hz > 36) {
          Pathfinding.goalX[eid] = brain.homeX + Math.sin(eid) * 3;
          Pathfinding.goalZ[eid] = brain.homeZ + Math.cos(eid) * 3;
          Pathfinding.hasPath[eid] = 1;
          Standee.animState[eid] = 1;
        }
        // Still shoot anything in range
        const inRange = findLocalThreat(living, eid, myFaction, mx, mz, range);
        if (inRange) assignTarget(eid, inRange);
        continue;
      }
    }

    // Score enemies — focus fire, alignment, heroes, HQ assault bias
    let best: Living | null = null;
    let bestScore = Infinity;

    // Soft commit to faction focus target
    if (brain.focusEid >= 0) {
      const focus = living.find((l) => l.eid === brain.focusEid);
      if (focus && focus.faction !== myFaction) {
        const dx = focus.x - mx;
        const dz = focus.z - mz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        // Only leash if within reasonable commit range
        if (dist < (isHero ? 40 : 28)) {
          best = focus;
          bestScore = dist * 0.4;
        }
      }
    }

    for (const other of living) {
      if (other.eid === eid) continue;
      if (other.faction === myFaction) continue;

      const dx = other.x - mx;
      const dz = other.z - mz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      let bias = 1;
      if (myAlign === AlignmentId.Order && other.alignment === AlignmentId.Chaos) bias = 0.72;
      if (myAlign === AlignmentId.Chaos && other.alignment === AlignmentId.Order) bias = 0.72;
      if (myAlign === other.alignment) bias = 1.3;

      if (isHero && other.isHero) bias *= 0.5;
      if (isHero && other.isHq) bias *= 0.55;
      if (isHero && other.isBuilding && !other.isHq) bias *= 0.8;

      // Swarms shred wounded
      if (!isHero && other.hpRatio < 0.4) bias *= 0.6;
      if (!isHero && other.isBuilding && brain.phase < 2) bias *= 1.2;
      if (other.isHq && brain.phase === 2) bias *= 0.4;

      // Focus fire stacking
      const attackers = attackerCounts.get(other.eid) ?? 0;
      if (attackers >= 1) bias *= FOCUS_BONUS;

      // Siege units (slow / high dmg) prefer buildings
      const unitId = UnitType.id[eid];
      if (unitId === 101 || unitId === 111 || unitId === 113) {
        if (other.isBuilding) bias *= 0.55;
      }

      const score = dist * bias;
      if (score < bestScore) {
        bestScore = score;
        best = other;
      }
    }

    if (!best) {
      // Idle march toward assault / midpoint during push
      if (canMove && brain.phase >= 1) {
        Pathfinding.goalX[eid] = brain.assaultX;
        Pathfinding.goalZ[eid] = brain.assaultZ;
        Pathfinding.hasPath[eid] = 1;
        Standee.animState[eid] = 1;
      }
      continue;
    }

    assignTarget(eid, best);

    if (canMove) {
      Pathfinding.goalX[eid] = best.x;
      Pathfinding.goalZ[eid] = best.z;
      Pathfinding.hasPath[eid] = 1;
      Standee.animState[eid] = 1;
    }
  }

  // Stationary turrets: nearest enemy in range
  for (const eid of units) {
    if (Pathfinding.speed[eid] > 0.01) continue;
    if (Health.current[eid] <= 0) continue;

    const myFaction = Faction.id[eid];
    const range = Combat.range[eid];
    const mx = Position.x[eid];
    const mz = Position.z[eid];

    let bestEid = -1;
    let bestDist = range;
    // Prefer focus if in range
    const brain = brains.get(myFaction);
    if (brain && brain.focusEid >= 0) {
      const t = brain.focusEid;
      if (Health.current[t] > 0 && Faction.id[t] !== myFaction) {
        const dx = Position.x[t] - mx;
        const dz = Position.z[t] - mz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < range) {
          bestEid = t;
          bestDist = dist;
        }
      }
    }

    for (const other of living) {
      if (other.faction === myFaction) continue;
      if (other.isBuilding) continue;
      const dx = other.x - mx;
      const dz = other.z - mz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      // Prefer wounded in range
      const adj = dist * (other.hpRatio < 0.5 ? 0.7 : 1);
      if (adj < bestDist) {
        bestDist = adj;
        bestEid = other.eid;
      }
    }

    if (bestEid >= 0) {
      Target.hasTarget[eid] = 1;
      Target.entity[eid] = bestEid;
      Target.x[eid] = Position.x[bestEid];
      Target.z[eid] = Position.z[bestEid];
    } else {
      Target.hasTarget[eid] = 0;
    }
  }
}

function assignTarget(eid: number, other: Living): void {
  Target.hasTarget[eid] = 1;
  Target.entity[eid] = other.eid;
  Target.x[eid] = other.x;
  Target.y[eid] = 0;
  Target.z[eid] = other.z;
  attackerCounts.set(other.eid, (attackerCounts.get(other.eid) ?? 0) + 1);
}

function findLocalThreat(
  living: Living[],
  self: number,
  faction: number,
  mx: number,
  mz: number,
  radius: number,
): Living | null {
  let best: Living | null = null;
  let bestD = radius;
  for (const other of living) {
    if (other.eid === self) continue;
    if (other.faction === faction) continue;
    if (other.isBuilding) continue;
    const dx = other.x - mx;
    const dz = other.z - mz;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < bestD) {
      bestD = d;
      best = other;
    }
  }
  return best;
}
