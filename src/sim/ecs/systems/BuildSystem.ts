import { defineQuery } from 'bitecs/legacy';
import { Position, Building, Faction, Health } from '../components';
import { getMeta } from '../World';

const buildingQuery = defineQuery([Position, Building, Faction, Health]);

const BUILD_SPEED = 0.15;

export function BuildSystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const entities = buildingQuery(world);

  for (const eid of entities) {
    if (Building.isComplete[eid]) continue;

    Building.buildProgress[eid] += BUILD_SPEED * dt;

    if (Building.buildProgress[eid] >= 1.0) {
      Building.buildProgress[eid] = 1.0;
      Building.isComplete[eid] = 1;
    }
  }
}
