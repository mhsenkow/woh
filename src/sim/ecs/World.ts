import { createWorld, addEntity, removeEntity } from 'bitecs';
import { addComponent } from 'bitecs/legacy';
import {
  Position, Velocity, Health, Faction, UnitType, Target,
  Combat, Standee, Pathfinding, Hero, Building, Harvester, Builder,
  FactionId, AlignmentId,
} from './components';

export interface GameWorld {
  time: { delta: number; elapsed: number; tick: number };
  resources: Record<number, { rupees: number; coins: number; starBits: number }>;
  /** Faction id under local player control — AI skips these units. */
  playerFaction: number;
}

const worlds = new WeakMap<object, GameWorld>();

export function createGameWorld(): object {
  const world = createWorld();
  const meta: GameWorld = {
    time: { delta: 0, elapsed: 0, tick: 0 },
    resources: {},
    playerFaction: FactionId.HyruleRoyalGuard,
  };
  for (let i = 0; i < 6; i++) {
    // Mid-game economy seed
    meta.resources[i] = { rupees: 850, coins: 720, starBits: 640 };
  }
  worlds.set(world, meta);
  return world;
}

export function getMeta(world: object): GameWorld {
  return worlds.get(world)!;
}

export function spawnUnit(
  world: object,
  factionId: FactionId,
  alignment: AlignmentId,
  unitTypeId: number,
  x: number,
  y: number,
  z: number,
  stats: { hp: number; damage: number; range: number; speed: number; attackSpeed: number; isRanged?: boolean },
): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Position.z[eid] = z;

  addComponent(world, Velocity, eid);

  addComponent(world, Health, eid);
  Health.current[eid] = stats.hp;
  Health.max[eid] = stats.hp;
  Health.armor[eid] = 0;
  Health.shield[eid] = 0;

  addComponent(world, Faction, eid);
  Faction.id[eid] = factionId;
  Faction.alignment[eid] = alignment;

  addComponent(world, UnitType, eid);
  UnitType.id[eid] = unitTypeId;
  UnitType.tier[eid] = 1;

  addComponent(world, Target, eid);
  Target.hasTarget[eid] = 0;

  addComponent(world, Combat, eid);
  Combat.damage[eid] = stats.damage;
  Combat.range[eid] = stats.range;
  Combat.attackSpeed[eid] = stats.attackSpeed;
  Combat.cooldown[eid] = 0;
  Combat.isRanged[eid] = stats.isRanged ? 1 : 0;

  addComponent(world, Standee, eid);
  Standee.direction[eid] = 4;
  Standee.animState[eid] = 0;
  Standee.animFrame[eid] = 0;
  Standee.damageLevel[eid] = 0;
  Standee.isElite[eid] = 0;
  Standee.isSelected[eid] = 0;

  addComponent(world, Pathfinding, eid);
  Pathfinding.speed[eid] = stats.speed;
  Pathfinding.hasPath[eid] = 0;

  return eid;
}

export function spawnHero(
  world: object,
  factionId: FactionId,
  alignment: AlignmentId,
  heroId: number,
  x: number,
  y: number,
  z: number,
): number {
  const eid = spawnUnit(world, factionId, alignment, 999, x, y, z, {
    hp: 500, damage: 25, range: 1.5, speed: 3.0, attackSpeed: 1.2,
  });

  addComponent(world, Hero, eid);
  Hero.heroId[eid] = heroId;
  Hero.level[eid] = 1;
  Hero.experience[eid] = 0;

  Standee.isElite[eid] = 1;

  return eid;
}

export function spawnBuilding(
  world: object,
  factionId: FactionId,
  buildingTypeId: number,
  x: number,
  y: number,
  z: number,
): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Position.z[eid] = z;

  addComponent(world, Faction, eid);
  Faction.id[eid] = factionId;
  // Order = even factions in our roster mapping; Chaos = malice/koopa/nightmare
  Faction.alignment[eid] =
    factionId === 1 || factionId === 3 || factionId === 5 ? 1 : 0;

  addComponent(world, Health, eid);
  Health.current[eid] = 800;
  Health.max[eid] = 800;
  Health.armor[eid] = 2;
  Health.shield[eid] = 0;

  addComponent(world, Building, eid);
  Building.type[eid] = buildingTypeId;
  Building.isComplete[eid] = 0;
  Building.buildProgress[eid] = 0;

  return eid;
}

export { removeEntity };
