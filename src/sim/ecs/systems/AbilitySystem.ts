import { defineQuery } from 'bitecs/legacy';
import { Position, Hero, Health, Faction, Combat } from '../components';
import { getMeta } from '../World';

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
  const heroes = heroQuery(world);

  for (const eid of heroes) {
    Hero.ability1Cooldown[eid] = Math.max(0, Hero.ability1Cooldown[eid] - dt);
    Hero.ability2Cooldown[eid] = Math.max(0, Hero.ability2Cooldown[eid] - dt);
    Hero.ability3Cooldown[eid] = Math.max(0, Hero.ability3Cooldown[eid] - dt);
  }

  while (abilityQueue.length > 0) {
    const cmd = abilityQueue.shift()!;
    const eid = cmd.heroEid;

    switch (cmd.abilitySlot) {
      case 0:
        if (Hero.ability1Cooldown[eid] <= 0) {
          Hero.ability1Cooldown[eid] = 3.0;
        }
        break;
      case 1:
        if (Hero.ability2Cooldown[eid] <= 0) {
          Hero.ability2Cooldown[eid] = 5.0;
        }
        break;
      case 2:
        if (Hero.ability3Cooldown[eid] <= 0) {
          Hero.ability3Cooldown[eid] = 8.0;
        }
        break;
    }
  }
}
