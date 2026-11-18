import { defineQuery } from 'bitecs/legacy';
import { Position, Pathfinding, Target } from '../components';

const pathQuery = defineQuery([Position, Pathfinding]);

export function PathfindingSystem(world: object): void {
  const entities = pathQuery(world);

  for (const eid of entities) {
    if (!Target.hasTarget[eid] && !Pathfinding.hasPath[eid]) continue;

    if (Target.hasTarget[eid] && !Pathfinding.hasPath[eid]) {
      Pathfinding.goalX[eid] = Target.x[eid];
      Pathfinding.goalZ[eid] = Target.z[eid];
      Pathfinding.hasPath[eid] = 1;
      Pathfinding.pathIndex[eid] = 0;
    }
  }
}

export function heuristic(ax: number, az: number, bx: number, bz: number): number {
  return Math.abs(ax - bx) + Math.abs(az - bz);
}

export function findPath(
  startX: number, startZ: number, goalX: number, goalZ: number,
  isWalkable: (x: number, z: number) => boolean,
  maxIterations = 500,
): { x: number; z: number }[] {
  const open: { x: number; z: number; g: number; h: number; f: number; parent: any }[] = [];
  const closed = new Set<string>();

  const start = { x: Math.floor(startX), z: Math.floor(startZ), g: 0, h: 0, f: 0, parent: null as any };
  start.h = heuristic(start.x, start.z, goalX, goalZ);
  start.f = start.h;
  open.push(start);

  let iterations = 0;

  while (open.length > 0 && iterations < maxIterations) {
    iterations++;
    open.sort((a, b) => a.f - b.f);
    const current = open.shift()!;
    const key = `${current.x},${current.z}`;

    if (closed.has(key)) continue;
    closed.add(key);

    if (Math.abs(current.x - goalX) < 1 && Math.abs(current.z - goalZ) < 1) {
      const path: { x: number; z: number }[] = [];
      let node = current;
      while (node) { path.unshift({ x: node.x + 0.5, z: node.z + 0.5 }); node = node.parent; }
      return path;
    }

    for (const [nx, nz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
      const newX = current.x + nx, newZ = current.z + nz;
      if (closed.has(`${newX},${newZ}`)) continue;
      if (!isWalkable(newX, newZ)) continue;
      const g = current.g + (nx !== 0 && nz !== 0 ? 1.414 : 1);
      const h = heuristic(newX, newZ, goalX, goalZ);
      open.push({ x: newX, z: newZ, g, h, f: g + h, parent: current });
    }
  }

  return [];
}
