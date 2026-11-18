import { FactionId } from '../../sim/ecs/components';
import {
  getTechTree,
  initiallyLockedBuildingIds,
  type TechEffect,
  type TechNode,
} from './TechTrees';

/**
 * Per-player research state. Deterministic — only mutated on lockstep ticks.
 */
export class TechProgress {
  readonly faction: FactionId;
  private completed = new Set<string>();
  private inProgress: { nodeId: string; remaining: number } | null = null;
  private unlockedUnits: Set<number>;
  private unlockedBuildings: Set<number>;
  private effects: TechEffect[] = [];

  constructor(faction: FactionId, startingBuildingIds: number[] = []) {
    this.faction = faction;
    const lockedB = initiallyLockedBuildingIds(faction);

    this.unlockedUnits = new Set(baselineUnitIds(faction));
    this.unlockedBuildings = new Set(baselineBuildingIds(faction));

    for (const id of startingBuildingIds) {
      if (!lockedB.has(id)) this.unlockedBuildings.add(id);
    }
  }

  get completedIds(): ReadonlySet<string> {
    return this.completed;
  }

  get activeResearch(): { nodeId: string; remaining: number } | null {
    return this.inProgress;
  }

  canResearch(node: TechNode, ownedBuildingTypes: Set<number>): string | null {
    if (this.completed.has(node.id)) return 'already-complete';
    if (this.inProgress) return 'research-busy';
    if (!ownedBuildingTypes.has(node.researchedAt)) return 'missing-building';

    const tree = getTechTree(this.faction);
    if (node.tier >= 2 && !ownedBuildingTypes.has(tree.tier2GateBuilding)) {
      return 'tier2-gate';
    }
    if (node.tier >= 3 && !ownedBuildingTypes.has(tree.tier3GateBuilding)) {
      return 'tier3-gate';
    }
    for (const req of node.requires) {
      if (!this.completed.has(req)) return `requires:${req}`;
    }
    return null;
  }

  startResearch(node: TechNode): boolean {
    if (this.inProgress) return false;
    this.inProgress = { nodeId: node.id, remaining: node.researchTime };
    return true;
  }

  /** Advance research by `dt` seconds. Returns completed node id if finished. */
  tick(dt: number): string | null {
    if (!this.inProgress) return null;
    this.inProgress.remaining -= dt;
    if (this.inProgress.remaining > 0) return null;

    const nodeId = this.inProgress.nodeId;
    this.inProgress = null;
    this.complete(nodeId);
    return nodeId;
  }

  complete(nodeId: string): void {
    if (this.completed.has(nodeId)) return;
    this.completed.add(nodeId);

    const tree = getTechTree(this.faction);
    const node = tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (node.unlocksUnits) {
      for (const id of node.unlocksUnits) this.unlockedUnits.add(id);
    }
    if (node.unlocksBuildings) {
      for (const id of node.unlocksBuildings) this.unlockedBuildings.add(id);
    }
    if (node.effect) this.effects.push(node.effect);
  }

  isUnitUnlocked(unitId: number): boolean {
    return this.unlockedUnits.has(unitId);
  }

  isBuildingUnlocked(buildingId: number): boolean {
    return this.unlockedBuildings.has(buildingId);
  }

  getEffects(): readonly TechEffect[] {
    return this.effects;
  }

  /** Aggregate mul/add for a stat across matching targetIds. */
  modifyStat(stat: string, base: number, entityTypeId: number): number {
    let value = base;
    for (const e of this.effects) {
      if (e.stat !== stat) continue;
      if (e.targetIds && !e.targetIds.includes(entityTypeId)) continue;
      if (e.mode === 'mul') value *= e.delta ?? 1;
      else value += e.delta ?? 0;
    }
    return value;
  }
}

function baselineUnitIds(faction: FactionId): number[] {
  // Lazy import avoided — hardcode openers that match UnitDefinitions requiresTech:false
  switch (faction) {
    case FactionId.HyruleRoyalGuard:
      return [100];
    case FactionId.GanonMaliceHorde:
      return [110];
    case FactionId.ToadstoolCollective:
      return [120, 121];
    case FactionId.KoopaTroop:
      return [130];
    case FactionId.DreamLandStarGuard:
      return [140];
    case FactionId.NightmareDarkMatter:
      return [150];
    default:
      return [];
  }
}

function baselineBuildingIds(faction: FactionId): number[] {
  switch (faction) {
    case FactionId.HyruleRoyalGuard:
      return [200, 201, 202, 203, 204];
    case FactionId.GanonMaliceHorde:
      return [210, 211];
    case FactionId.ToadstoolCollective:
      return [220];
    case FactionId.KoopaTroop:
      return [230];
    case FactionId.DreamLandStarGuard:
      return [240];
    case FactionId.NightmareDarkMatter:
      return [250];
    default:
      return [];
  }
}

