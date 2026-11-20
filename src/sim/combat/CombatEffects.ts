import { defineQuery, hasComponent } from 'bitecs/legacy';
import {
  Position, Health, Combat, Standee, Building, Faction, UnitType, Pathfinding,
} from '../ecs/components';
import { getCreepState } from '../ecs/systems/CreepSystem';

/** Presentation + landscape side-channel (drained by main.ts). */
export type WorldCombatEvent =
  | { type: 'hit'; x: number; y: number; z: number; ranged: boolean; kind?: string }
  | { type: 'kill'; x: number; y: number; z: number; wasBuilding: boolean; unitTypeId?: number; factionId?: number }
  | { type: 'heal'; x: number; y: number; z: number }
  | { type: 'buff'; x: number; y: number; z: number }
  | {
      type: 'landscape';
      x: number; y: number; z: number;
      impact: 'explosion' | 'fire' | 'ice' | 'tunnel' | 'malice' | 'void';
      radius: number;
    }
  | { type: 'ability'; name: string; x: number; y: number; z: number };

const eventQueue: WorldCombatEvent[] = [];

export function drainCombatEvents(): WorldCombatEvent[] {
  return eventQueue.splice(0, eventQueue.length);
}

export function pushCombatEvent(ev: WorldCombatEvent): void {
  eventQueue.push(ev);
}

// ─── Status / buffs ─────────────────────────────────────────────────────────

export type StatusId =
  | 'stim'
  | 'star'
  | 'siege'
  | 'slow'
  | 'adrenal'
  | 'magikoopaBuff'
  | 'gloomDrain'
  | 'copyEssence'
  | 'invuln';

export interface StatusEffect {
  id: StatusId;
  expiresAt: number; // sim elapsed seconds
  speedMul?: number;
  damageMul?: number;
  attackSpeedMul?: number;
  armorAdd?: number;
  invulnerable?: boolean;
}

const statusTable = new Map<number, StatusEffect[]>();

export function clearAllStatuses(): void {
  statusTable.clear();
}

export function addStatus(eid: number, effect: StatusEffect): void {
  const list = statusTable.get(eid) ?? [];
  // Replace same id
  const next = list.filter((s) => s.id !== effect.id);
  next.push(effect);
  statusTable.set(eid, next);
}

export function tickStatuses(eid: number, elapsed: number): void {
  const list = statusTable.get(eid);
  if (!list) return;
  const alive = list.filter((s) => s.expiresAt > elapsed);
  if (alive.length === 0) statusTable.delete(eid);
  else statusTable.set(eid, alive);
}

export function getStatuses(eid: number): StatusEffect[] {
  return statusTable.get(eid) ?? [];
}

export function isInvulnerable(eid: number): boolean {
  return getStatuses(eid).some((s) => s.invulnerable);
}

export function effectiveSpeed(eid: number, base: number): number {
  let mul = 1;
  for (const s of getStatuses(eid)) if (s.speedMul) mul *= s.speedMul;
  return base * mul;
}

export function effectiveDamage(eid: number, base: number): number {
  let mul = 1;
  for (const s of getStatuses(eid)) if (s.damageMul) mul *= s.damageMul;
  return base * mul;
}

export function effectiveAttackSpeed(eid: number, base: number): number {
  let mul = 1;
  for (const s of getStatuses(eid)) if (s.attackSpeedMul) mul *= s.attackSpeedMul;
  return base * mul;
}

export function effectiveArmor(eid: number, base: number): number {
  let add = 0;
  for (const s of getStatuses(eid)) if (s.armorAdd) add += s.armorAdd;
  return base + add;
}

// ─── Corpse registry (Blood Moon) ───────────────────────────────────────────

export interface CorpseRecord {
  unitTypeId: number;
  factionId: number;
  x: number;
  y: number;
  z: number;
  diedAt: number;
}

const corpses: CorpseRecord[] = [];

export function recordCorpse(c: CorpseRecord): void {
  corpses.push(c);
  if (corpses.length > 200) corpses.shift();
}

export function takeCorpsesNear(
  x: number,
  z: number,
  radius: number,
  filter: (c: CorpseRecord) => boolean,
): CorpseRecord[] {
  const out: CorpseRecord[] = [];
  const r2 = radius * radius;
  for (let i = corpses.length - 1; i >= 0; i--) {
    const c = corpses[i];
    const dx = c.x - x;
    const dz = c.z - z;
    if (dx * dx + dz * dz > r2) continue;
    if (!filter(c)) continue;
    out.push(c);
    corpses.splice(i, 1);
  }
  return out;
}

// ─── Damage helpers ─────────────────────────────────────────────────────────

const livingQuery = defineQuery([Position, Health, Faction]);

export function distXZ(a: number, b: number): number {
  const dx = Position.x[b] - Position.x[a];
  const dz = Position.z[b] - Position.z[a];
  return Math.sqrt(dx * dx + dz * dz);
}

export function applyDamage(
  world: object,
  attackerEid: number,
  targetEid: number,
  rawDamage: number,
  opts: { ranged?: boolean; kind?: string; ignoreArmor?: boolean } = {},
): boolean {
  if ((Health.current[attackerEid] ?? 0) <= 0) return false;
  if ((Health.current[targetEid] ?? 0) <= 0) return false;
  if (isInvulnerable(targetEid)) return false;

  let damage = rawDamage;

  const heightDiff = Position.y[attackerEid] - Position.y[targetEid];
  if (heightDiff > 0.5) damage *= 1.25;

  if (!opts.ignoreArmor) {
    damage = Math.max(0, damage - effectiveArmor(targetEid, Health.armor[targetEid] || 0));
  }

  if (Health.shield[targetEid] > 0) {
    const absorb = Math.min(Health.shield[targetEid], damage);
    Health.shield[targetEid] -= absorb;
    damage -= absorb;
  }

  Health.current[targetEid] -= damage;

  pushCombatEvent({
    type: 'hit',
    x: Position.x[targetEid],
    y: Position.y[targetEid],
    z: Position.z[targetEid],
    ranged: !!opts.ranged,
    kind: opts.kind,
  });

  if (Health.current[targetEid] <= 0) {
    killEntity(world, targetEid);
    return true;
  }

  if (hasComponent(world, Standee, targetEid) && Health.max[targetEid] > 0) {
    Standee.damageLevel[targetEid] = 1 - Health.current[targetEid] / Health.max[targetEid];
  }
  return false;
}

export function killEntity(world: object, eid: number): void {
  Health.current[eid] = 0;
  if (hasComponent(world, Standee, eid)) Standee.animState[eid] = 4;
  if (hasComponent(world, Pathfinding, eid)) Pathfinding.hasPath[eid] = 0;

  const wasBuilding = hasComponent(world, Building, eid);
  const unitTypeId = hasComponent(world, UnitType, eid) ? UnitType.id[eid] : 0;
  const factionId = hasComponent(world, Faction, eid) ? Faction.id[eid] : 0;

  pushCombatEvent({
    type: 'kill',
    x: Position.x[eid],
    y: Position.y[eid],
    z: Position.z[eid],
    wasBuilding,
    unitTypeId,
    factionId,
  });

  if (!wasBuilding && unitTypeId > 0) {
    recordCorpse({
      unitTypeId,
      factionId,
      x: Position.x[eid],
      y: Position.y[eid],
      z: Position.z[eid],
      diedAt: 0,
    });
  }
}

export function healEntity(world: object, eid: number, amount: number): void {
  if ((Health.current[eid] ?? 0) <= 0) return;
  Health.current[eid] = Math.min(Health.max[eid], Health.current[eid] + amount);
  if (hasComponent(world, Standee, eid) && Health.max[eid] > 0) {
    Standee.damageLevel[eid] = 1 - Health.current[eid] / Health.max[eid];
  }
  pushCombatEvent({
    type: 'heal',
    x: Position.x[eid],
    y: Position.y[eid],
    z: Position.z[eid],
  });
}

export function damageInRadius(
  world: object,
  attackerEid: number,
  cx: number,
  cz: number,
  radius: number,
  damage: number,
  opts: { ranged?: boolean; kind?: string; friendlyFire?: boolean } = {},
): number {
  const attackerFaction = Faction.id[attackerEid];
  let kills = 0;
  const r2 = radius * radius;
  for (const eid of livingQuery(world)) {
    if (eid === attackerEid) continue;
    if ((Health.current[eid] ?? 0) <= 0) continue;
    if (!opts.friendlyFire && Faction.id[eid] === attackerFaction) continue;
    const dx = Position.x[eid] - cx;
    const dz = Position.z[eid] - cz;
    if (dx * dx + dz * dz > r2) continue;
    if (applyDamage(world, attackerEid, eid, damage, opts)) kills++;
  }
  return kills;
}

export function alliesInRadius(
  world: object,
  eid: number,
  radius: number,
  unitTypeFilter?: number,
): number[] {
  const fid = Faction.id[eid];
  const out: number[] = [];
  const r2 = radius * radius;
  for (const other of livingQuery(world)) {
    if (other === eid) continue;
    if ((Health.current[other] ?? 0) <= 0) continue;
    if (Faction.id[other] !== fid) continue;
    if (unitTypeFilter !== undefined && UnitType.id[other] !== unitTypeFilter) continue;
    const dx = Position.x[other] - Position.x[eid];
    const dz = Position.z[other] - Position.z[eid];
    if (dx * dx + dz * dz > r2) continue;
    out.push(other);
  }
  return out;
}

export function enemiesInRadius(
  world: object,
  eid: number,
  radius: number,
): number[] {
  const fid = Faction.id[eid];
  const out: number[] = [];
  const r2 = radius * radius;
  for (const other of livingQuery(world)) {
    if (other === eid) continue;
    if ((Health.current[other] ?? 0) <= 0) continue;
    if (Faction.id[other] === fid) continue;
    const dx = Position.x[other] - Position.x[eid];
    const dz = Position.z[other] - Position.z[eid];
    if (dx * dx + dz * dz > r2) continue;
    out.push(other);
  }
  return out;
}

export function paintCreep(x: number, z: number, radius: number, kind: 'malice' | 'void'): void {
  const creep = getCreepState();
  const set = kind === 'malice' ? creep.maliceTiles : creep.voidTiles;
  const r = Math.ceil(radius);
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r) continue;
      set.add(`${Math.floor(x + dx)},${Math.floor(z + dz)}`);
    }
  }
  pushCombatEvent({
    type: 'landscape',
    x, y: 0, z,
    impact: kind,
    radius,
  });
}

export function onCreep(x: number, z: number): boolean {
  return getCreepState().maliceTiles.has(`${Math.floor(x)},${Math.floor(z)}`);
}

export function onVoid(x: number, z: number): boolean {
  return getCreepState().voidTiles.has(`${Math.floor(x)},${Math.floor(z)}`);
}

/** Units currently on attack-move (seek enemies while pathing). */
const attackMoveUnits = new Set<number>();

export function setAttackMove(eid: number, enabled: boolean): void {
  if (enabled) attackMoveUnits.add(eid);
  else attackMoveUnits.delete(eid);
}

export function clearAttackMove(eid: number): void {
  attackMoveUnits.delete(eid);
}

export function isAttackMove(eid: number): boolean {
  return attackMoveUnits.has(eid);
}
