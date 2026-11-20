import { createGameWorld, getMeta } from './ecs/World';
import { MovementSystem } from './ecs/systems/MovementSystem';
import { CombatSystem } from './ecs/systems/CombatSystem';
import { CreepSystem } from './ecs/systems/CreepSystem';
import { ResourceSystem } from './ecs/systems/ResourceSystem';
import { BuildSystem } from './ecs/systems/BuildSystem';
import { AbilitySystem } from './ecs/systems/AbilitySystem';
import { PathfindingSystem } from './ecs/systems/PathfindingSystem';
import { AISystem } from './ecs/systems/AISystem';

const TICK_RATE = 15;
const TICK_DURATION = 1000 / TICK_RATE;

export class SimLoop {
  readonly world: object;
  private accumulator = 0;
  private running = false;
  private lastTime = 0;

  constructor() {
    this.world = createGameWorld();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
  }

  stop(): void {
    this.running = false;
  }

  update(currentTime: number): void {
    if (!this.running) return;

    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += frameTime;

    while (this.accumulator >= TICK_DURATION) {
      this.tick();
      this.accumulator -= TICK_DURATION;
    }
  }

  /** Run one sim tick (also used by debug harness when rAF is paused). */
  step(n = 1): void {
    for (let i = 0; i < n; i++) this.tick();
  }

  private tick(): void {
    const meta = getMeta(this.world);
    const dt = TICK_DURATION / 1000;
    meta.time.delta = dt;
    meta.time.elapsed += dt;
    meta.time.tick++;

    AISystem(this.world);
    PathfindingSystem(this.world);
    MovementSystem(this.world);
    CombatSystem(this.world);
    ResourceSystem(this.world);
    BuildSystem(this.world);
    AbilitySystem(this.world);
    CreepSystem(this.world);
  }
}
