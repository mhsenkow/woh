import { defineQuery } from 'bitecs/legacy';
import { Position, Faction, FactionId } from '../components';
import { getMeta } from '../World';

export interface CreepState {
  maliceTiles: Set<string>;
  voidTiles: Set<string>;
  pipeTiles: Set<string>;
}

export function createCreepState(): CreepState {
  return { maliceTiles: new Set(), voidTiles: new Set(), pipeTiles: new Set() };
}

const creepState: CreepState = createCreepState();

export function getCreepState(): CreepState {
  return creepState;
}

const factionQuery = defineQuery([Position, Faction]);

function tileKey(x: number, z: number): string {
  return `${Math.floor(x)},${Math.floor(z)}`;
}

export function CreepSystem(world: object): void {
  const meta = getMeta(world);
  if (meta.time.tick % 15 !== 0) return;

  const entities = factionQuery(world);

  for (const eid of entities) {
    const fid = Faction.id[eid];
    const x = Position.x[eid];
    const z = Position.z[eid];

    if (fid === FactionId.GanonMaliceHorde) {
      for (let dx = -2; dx <= 2; dx++) {
        for (let dz = -2; dz <= 2; dz++) {
          if (dx * dx + dz * dz <= 4) {
            creepState.maliceTiles.add(tileKey(x + dx, z + dz));
          }
        }
      }
    }

    if (fid === FactionId.NightmareDarkMatter) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          creepState.voidTiles.add(tileKey(x + dx, z + dz));
        }
      }
    }

    if (fid === FactionId.ToadstoolCollective) {
      creepState.pipeTiles.add(tileKey(x, z));
    }
  }
}
