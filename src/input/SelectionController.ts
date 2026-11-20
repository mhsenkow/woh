import * as THREE from 'three';
import { defineQuery } from 'bitecs/legacy';
import {
  Position,
  Health,
  Faction,
  Standee,
  Pathfinding,
  Target,
  UnitType,
  Building,
  Hero,
} from '../sim/ecs/components';
import { getUnit } from '../game/units/UnitDefinitions';
import { queueAbility } from '../sim/ecs/systems/AbilitySystem';
import { setAttackMove, clearAttackMove } from '../sim/combat/CombatEffects';
import type { StandeeRenderer } from '../engine/standee/StandeeRenderer';
import type { SelectionBox } from './SelectionBox';

const selectableQuery = defineQuery([Position, Health, Faction, Standee, Pathfinding]);
const buildingTargetQuery = defineQuery([Position, Health, Faction, Building]);

export type OrderMode = 'default' | 'attack' | 'move' | 'stop' | 'hold';

export interface SelectedUnitInfo {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
}

/**
 * RTS selection + order layer.
 * LMB click / marquee → select player units
 * RMB ground → move · RMB enemy → attack
 * Command card / hotkeys → attack-move, stop, hold
 * Ctrl+1-9 / 1-9 → control groups
 */
export class SelectionController {
  private selected = new Set<number>();
  private controlGroups = new Map<number, number[]>();
  private orderMode: OrderMode = 'default';
  private readonly ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private readonly raycaster = new THREE.Raycaster();
  private readonly ndc = new THREE.Vector2();
  private readonly hit = new THREE.Vector3();
  private readonly screen = new THREE.Vector3();
  private dragStart: { x: number; y: number } | null = null;
  private dragging = false;
  private readonly DRAG_THRESH_PX = 6;

  constructor(
    private readonly container: HTMLElement,
    private readonly camera: THREE.Camera,
    private readonly world: object,
    private readonly playerFaction: number,
    private readonly standees: StandeeRenderer,
    private readonly selectionBox: SelectionBox,
  ) {
    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('pointerup', this.onPointerUp);
    container.addEventListener('pointercancel', this.onPointerCancel);
    // Marquee drawing still owned by SelectionBox; we only consume the result
    this.selectionBox.onSelect = (ids) => this.applySelection(ids, false);
  }

  dispose(): void {
    this.container.removeEventListener('pointerdown', this.onPointerDown);
    this.container.removeEventListener('pointerup', this.onPointerUp);
    this.container.removeEventListener('pointercancel', this.onPointerCancel);
  }

  getSelectedIds(): number[] {
    this.pruneDead();
    return [...this.selected];
  }

  getSelectedInfos(): SelectedUnitInfo[] {
    return this.getSelectedIds().map((eid) => {
      const typeId = UnitType.id[eid];
      const def = getUnit(typeId);
      return {
        id: eid,
        name: def?.name ?? (Standee.isElite[eid] ? 'Hero' : `Unit ${eid}`),
        hp: Health.current[eid] ?? 0,
        maxHp: Health.max[eid] ?? 1,
      };
    });
  }

  getOrderMode(): OrderMode {
    return this.orderMode;
  }

  setOrderMode(mode: OrderMode): void {
    this.orderMode = mode;
  }

  clearSelection(): void {
    for (const eid of this.selected) {
      Standee.isSelected[eid] = 0;
      this.standees.setSelected(eid, false);
    }
    this.selected.clear();
  }

  selectIds(ids: number[], additive = false): void {
    this.applySelection(ids, additive);
  }

  /** Command card / hotkey entry point. */
  issueCommand(commandId: string): void {
    switch (commandId) {
      case 'stop':
        this.stopSelected();
        this.orderMode = 'default';
        break;
      case 'hold':
        this.holdSelected();
        this.orderMode = 'default';
        break;
      case 'attack':
        this.orderMode = this.orderMode === 'attack' ? 'default' : 'attack';
        break;
      case 'move':
        this.orderMode = this.orderMode === 'move' ? 'default' : 'move';
        break;
      case 'patrol':
        this.patrolSelected();
        break;
      case 'ability1':
        this.castHeroAbility(0);
        break;
      case 'ability2':
        this.castHeroAbility(1);
        break;
      case 'ability3':
        this.castHeroAbility(2);
        break;
      default:
        break;
    }
  }

  assignControlGroup(groupId: number): void {
    this.controlGroups.set(groupId, this.getSelectedIds());
    this.selectionBox.assignControlGroup(groupId, this.getSelectedIds());
  }

  recallControlGroup(groupId: number, additive = false): void {
    const ids = (this.controlGroups.get(groupId) ?? this.selectionBox.getControlGroup(groupId))
      .filter((eid) => (Health.current[eid] ?? 0) > 0 && Faction.id[eid] === this.playerFaction);
    if (ids.length === 0) return;
    this.applySelection(ids, additive);
  }

  /** Double-tap recall: select + center camera on group centroid. */
  getSelectionCentroid(): THREE.Vector3 | null {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return null;
    let sx = 0;
    let sz = 0;
    for (const eid of ids) {
      sx += Position.x[eid];
      sz += Position.z[eid];
    }
    return new THREE.Vector3(sx / ids.length, 0, sz / ids.length);
  }

  // ── Pointer ─────────────────────────────────────────────────────────────

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button === 0 && !e.shiftKey && !e.altKey) {
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.dragging = false;
    }
  };

  private onPointerCancel = (): void => {
    this.dragStart = null;
    this.dragging = false;
  };

  private onPointerUp = (e: PointerEvent): void => {
    // Right-click → order
    if (e.button === 2) {
      this.handleOrderClick(e.clientX, e.clientY);
      this.dragStart = null;
      return;
    }

    if (e.button !== 0 || e.shiftKey || e.altKey) {
      this.dragStart = null;
      return;
    }

    if (!this.dragStart) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    const dist = Math.hypot(dx, dy);
    this.dragging = dist >= this.DRAG_THRESH_PX;

    if (this.dragging) {
      // Marquee — SelectionBox already tracked the rect; gather units inside
      const rect = {
        minX: Math.min(this.dragStart.x, e.clientX),
        maxX: Math.max(this.dragStart.x, e.clientX),
        minY: Math.min(this.dragStart.y, e.clientY),
        maxY: Math.max(this.dragStart.y, e.clientY),
      };
      const ids = this.unitsInScreenRect(rect);
      this.applySelection(ids, e.ctrlKey || e.metaKey);
    } else {
      // Click select — or pending attack/move cursor mode
      if (this.orderMode === 'attack' || this.orderMode === 'move') {
        this.handleOrderClick(e.clientX, e.clientY);
        this.orderMode = 'default';
      } else {
        const picked = this.pickUnitAtScreen(e.clientX, e.clientY, true);
        if (picked !== null) {
          this.applySelection([picked], e.ctrlKey || e.metaKey);
        } else if (!e.ctrlKey && !e.metaKey) {
          this.clearSelection();
        }
      }
    }

    this.dragStart = null;
    this.dragging = false;
  };

  // ── Picking ─────────────────────────────────────────────────────────────

  private setRayFromScreen(clientX: number, clientY: number): void {
    const rect = this.container.getBoundingClientRect();
    this.ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
  }

  private groundAtScreen(clientX: number, clientY: number): THREE.Vector3 | null {
    this.setRayFromScreen(clientX, clientY);
    const hit = this.raycaster.ray.intersectPlane(this.ground, this.hit);
    return hit ? this.hit.clone() : null;
  }

  private worldToScreen(x: number, y: number, z: number): { x: number; y: number } | null {
    const rect = this.container.getBoundingClientRect();
    this.screen.set(x, y + 0.6, z);
    this.screen.project(this.camera);
    if (this.screen.z > 1) return null;
    return {
      x: (this.screen.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-this.screen.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  private pickUnitAtScreen(clientX: number, clientY: number, playerOnly: boolean): number | null {
    let best: number | null = null;
    let bestDist = 36; // px pick radius

    for (const eid of selectableQuery(this.world)) {
      if ((Health.current[eid] ?? 0) <= 0) continue;
      if (playerOnly && Faction.id[eid] !== this.playerFaction) continue;

      const sp = this.worldToScreen(Position.x[eid], Position.y[eid], Position.z[eid]);
      if (!sp) continue;
      const d = Math.hypot(sp.x - clientX, sp.y - clientY);
      if (d < bestDist) {
        bestDist = d;
        best = eid;
      }
    }

    // Also allow targeting enemy buildings (attack orders only)
    if (!playerOnly) {
      for (const eid of buildingTargetQuery(this.world)) {
        if ((Health.current[eid] ?? 0) <= 0) continue;
        if (Faction.id[eid] === this.playerFaction) continue;
        const sp = this.worldToScreen(Position.x[eid], Position.y[eid], Position.z[eid]);
        if (!sp) continue;
        const d = Math.hypot(sp.x - clientX, sp.y - clientY);
        if (d < bestDist + 12) {
          bestDist = d;
          best = eid;
        }
      }
    }
    return best;
  }

  private unitsInScreenRect(rect: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }): number[] {
    const out: number[] = [];
    for (const eid of selectableQuery(this.world)) {
      if ((Health.current[eid] ?? 0) <= 0) continue;
      if (Faction.id[eid] !== this.playerFaction) continue;
      const sp = this.worldToScreen(Position.x[eid], Position.y[eid], Position.z[eid]);
      if (!sp) continue;
      if (sp.x >= rect.minX && sp.x <= rect.maxX && sp.y >= rect.minY && sp.y <= rect.maxY) {
        out.push(eid);
      }
    }
    return out;
  }

  // ── Selection apply ─────────────────────────────────────────────────────

  private applySelection(ids: number[], additive: boolean): void {
    const valid = ids.filter(
      (eid) =>
        (Health.current[eid] ?? 0) > 0 &&
        Faction.id[eid] === this.playerFaction,
    );

    if (!additive) this.clearSelection();

    for (const eid of valid) {
      this.selected.add(eid);
      Standee.isSelected[eid] = 1;
      this.standees.setSelected(eid, true);
    }
  }

  private pruneDead(): void {
    for (const eid of [...this.selected]) {
      if ((Health.current[eid] ?? 0) <= 0) {
        this.selected.delete(eid);
        Standee.isSelected[eid] = 0;
        this.standees.setSelected(eid, false);
      }
    }
  }

  // ── Orders ──────────────────────────────────────────────────────────────

  private handleOrderClick(clientX: number, clientY: number): void {
    this.pruneDead();
    if (this.selected.size === 0) return;

    const enemy = this.pickUnitAtScreen(clientX, clientY, false);
    if (
      enemy !== null &&
      Faction.id[enemy] !== this.playerFaction &&
      this.orderMode !== 'move'
    ) {
      this.attackTarget(enemy);
      return;
    }

    const ground = this.groundAtScreen(clientX, clientY);
    if (!ground) return;

    if (this.orderMode === 'attack') {
      this.attackMove(ground.x, ground.z);
    } else {
      this.moveTo(ground.x, ground.z);
    }
  }

  private moveTo(x: number, z: number): void {
    const ids = this.getSelectedIds();
    const formation = this.formationOffsets(ids.length);
    ids.forEach((eid, i) => {
      const off = formation[i];
      clearAttackMove(eid);
      Target.hasTarget[eid] = 0;
      Target.entity[eid] = 0;
      Pathfinding.goalX[eid] = x + off.x;
      Pathfinding.goalZ[eid] = z + off.z;
      Pathfinding.hasPath[eid] = 1;
      Pathfinding.pathIndex[eid] = 0;
      Standee.animState[eid] = 1;
    });
  }

  private attackMove(x: number, z: number): void {
    const ids = this.getSelectedIds();
    const formation = this.formationOffsets(ids.length);
    ids.forEach((eid, i) => {
      const off = formation[i];
      Target.hasTarget[eid] = 0;
      Target.entity[eid] = 0;
      setAttackMove(eid, true);
      Pathfinding.goalX[eid] = x + off.x;
      Pathfinding.goalZ[eid] = z + off.z;
      Pathfinding.hasPath[eid] = 1;
      Pathfinding.pathIndex[eid] = 0;
      Standee.animState[eid] = 1;
    });
  }

  private attackTarget(enemyEid: number): void {
    for (const eid of this.getSelectedIds()) {
      clearAttackMove(eid);
      Target.hasTarget[eid] = 1;
      Target.entity[eid] = enemyEid;
      Target.x[eid] = Position.x[enemyEid];
      Target.y[eid] = Position.y[enemyEid];
      Target.z[eid] = Position.z[enemyEid];
      Pathfinding.goalX[eid] = Position.x[enemyEid];
      Pathfinding.goalZ[eid] = Position.z[enemyEid];
      Pathfinding.hasPath[eid] = 1;
      Standee.animState[eid] = 1;
    }
  }

  private castHeroAbility(slot: 0 | 1 | 2): void {
    const hero = this.getSelectedIds().find((eid) => Standee.isElite[eid] === 1);
    if (hero === undefined) return;
    const ground = this.getSelectionCentroid();
    queueAbility({
      heroEid: hero,
      abilitySlot: slot,
      targetX: ground?.x ?? Position.x[hero],
      targetZ: ground?.z ?? Position.z[hero],
      targetEid: Target.hasTarget[hero] ? Target.entity[hero] : undefined,
    });
    void Hero;
  }

  private stopSelected(): void {
    for (const eid of this.getSelectedIds()) {
      clearAttackMove(eid);
      Target.hasTarget[eid] = 0;
      Pathfinding.hasPath[eid] = 0;
      Standee.animState[eid] = 0;
    }
  }

  private holdSelected(): void {
    for (const eid of this.getSelectedIds()) {
      clearAttackMove(eid);
      Target.hasTarget[eid] = 0;
      Pathfinding.hasPath[eid] = 0;
      Pathfinding.goalX[eid] = Position.x[eid];
      Pathfinding.goalZ[eid] = Position.z[eid];
      Standee.animState[eid] = 0;
    }
  }

  private patrolSelected(): void {
    const c = this.getSelectionCentroid();
    if (!c) return;
    this.moveTo(c.x + 4, c.z + 4);
  }

  private formationOffsets(count: number): { x: number; z: number }[] {
    if (count <= 1) return [{ x: 0, z: 0 }];
    const cols = Math.ceil(Math.sqrt(count));
    const spacing = 1.35;
    const out: { x: number; z: number }[] = [];
    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      out.push({
        x: (col - (cols - 1) / 2) * spacing,
        z: (row - (Math.ceil(count / cols) - 1) / 2) * spacing,
      });
    }
    return out;
  }
}
