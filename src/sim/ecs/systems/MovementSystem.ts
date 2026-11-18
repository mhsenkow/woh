import { defineQuery } from 'bitecs/legacy';
import { Position, Velocity, Pathfinding, Target, Standee } from '../components';
import { getMeta } from '../World';

const movingQuery = defineQuery([Position, Velocity, Pathfinding]);

export function MovementSystem(world: object): void {
  const meta = getMeta(world);
  const dt = meta.time.delta;
  const entities = movingQuery(world);

  for (const eid of entities) {
    if (!Pathfinding.hasPath[eid] && !Target.hasTarget[eid]) {
      Velocity.x[eid] = 0;
      Velocity.z[eid] = 0;
      continue;
    }

    const goalX = Pathfinding.hasPath[eid] ? Pathfinding.goalX[eid] : Target.x[eid];
    const goalZ = Pathfinding.hasPath[eid] ? Pathfinding.goalZ[eid] : Target.z[eid];

    const dx = goalX - Position.x[eid];
    const dz = goalZ - Position.z[eid];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.2) {
      Velocity.x[eid] = 0;
      Velocity.z[eid] = 0;
      Pathfinding.hasPath[eid] = 0;
      Standee.animState[eid] = 0;
      continue;
    }

    const speed = Pathfinding.speed[eid];
    const nx = dx / dist;
    const nz = dz / dist;

    Velocity.x[eid] = nx * speed;
    Velocity.z[eid] = nz * speed;

    Position.x[eid] += Velocity.x[eid] * dt;
    Position.z[eid] += Velocity.z[eid] * dt;

    Standee.direction[eid] = Math.round(((Math.atan2(nx, nz) + Math.PI) / (2 * Math.PI)) * 8) % 8;
    Standee.animState[eid] = 1;
  }
}
