import { defineComponent, Types } from 'bitecs/legacy';

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
});

export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32,
  armor: Types.f32,
  shield: Types.f32,
});

export const Faction = defineComponent({
  id: Types.ui8,
  alignment: Types.ui8,
});

export const UnitType = defineComponent({
  id: Types.ui16,
  tier: Types.ui8,
});

export const Target = defineComponent({
  entity: Types.ui32,
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  hasTarget: Types.ui8,
});

export const Combat = defineComponent({
  damage: Types.f32,
  range: Types.f32,
  attackSpeed: Types.f32,
  cooldown: Types.f32,
  isRanged: Types.ui8,
});

export const Harvester = defineComponent({
  resourceType: Types.ui8,
  gatherRate: Types.f32,
  capacity: Types.f32,
  carried: Types.f32,
});

export const Builder = defineComponent({
  buildingType: Types.ui16,
  buildProgress: Types.f32,
  buildSpeed: Types.f32,
  isBuilding: Types.ui8,
});

export const Hero = defineComponent({
  heroId: Types.ui8,
  level: Types.ui8,
  experience: Types.f32,
  ability1Cooldown: Types.f32,
  ability2Cooldown: Types.f32,
  ability3Cooldown: Types.f32,
});

export const Standee = defineComponent({
  direction: Types.ui8,
  animState: Types.ui8,
  animFrame: Types.ui8,
  damageLevel: Types.f32,
  isElite: Types.ui8,
  isSelected: Types.ui8,
});

export const Building = defineComponent({
  type: Types.ui16,
  isComplete: Types.ui8,
  buildProgress: Types.f32,
  rallyX: Types.f32,
  rallyZ: Types.f32,
});

export const Pathfinding = defineComponent({
  goalX: Types.f32,
  goalZ: Types.f32,
  hasPath: Types.ui8,
  pathIndex: Types.ui16,
  speed: Types.f32,
});

export const enum FactionId {
  HyruleRoyalGuard = 0,
  GanonMaliceHorde = 1,
  ToadstoolCollective = 2,
  KoopaTroop = 3,
  DreamLandStarGuard = 4,
  NightmareDarkMatter = 5,
}

export const enum AlignmentId {
  Order = 0,
  Chaos = 1,
}

export const enum ResourceType {
  Rupees = 0,
  Coins = 1,
  StarBits = 2,
}
