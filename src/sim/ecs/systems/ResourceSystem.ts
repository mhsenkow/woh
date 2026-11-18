import { defineQuery } from 'bitecs/legacy';
import { Position, Faction, Harvester, FactionId, ResourceType } from '../components';
import { getMeta, type GameWorld } from '../World';

const harvesterQuery = defineQuery([Position, Faction, Harvester]);

export function ResourceSystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const entities = harvesterQuery(world);

  for (const eid of entities) {
    const fid = Faction.id[eid];
    const resourceType = Harvester.resourceType[eid];
    const rate = Harvester.gatherRate[eid];
    const capacity = Harvester.capacity[eid];
    const carried = Harvester.carried[eid];

    if (carried >= capacity) continue;

    const gathered = Math.min(rate * dt, capacity - carried);
    Harvester.carried[eid] = carried + gathered;

    const res = meta.resources[fid];
    if (!res) continue;

    switch (resourceType) {
      case ResourceType.Rupees: res.rupees += gathered; break;
      case ResourceType.Coins: res.coins += gathered; break;
      case ResourceType.StarBits: res.starBits += gathered; break;
    }
  }
}

export function getResources(world: object, factionId: FactionId) {
  const meta = getMeta(world);
  return meta.resources[factionId] ?? { rupees: 0, coins: 0, starBits: 0 };
}
