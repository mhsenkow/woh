/**
 * Deterministic lockstep netcode client stub.
 * Phase 7+: Full WebSocket/WebRTC implementation.
 *
 * The protocol is designed for SC2-style deterministic replay:
 * - Each tick, clients exchange hashed input commands
 * - Commands are buffered 2 ticks ahead for latency hiding
 * - On desync detection, clients can rollback or resync from authoritative state
 */

export interface NetCommand {
  tick: number;
  playerId: number;
  type: 'move' | 'attack' | 'build' | 'ability' | 'stop';
  targetX?: number;
  targetZ?: number;
  targetEntityId?: number;
  entityIds: number[];
  abilitySlot?: number;
}

export interface TickFrame {
  tick: number;
  commands: NetCommand[];
  hash: number;
}

export class LockstepClient {
  private inputBuffer: Map<number, NetCommand[]> = new Map();
  private currentTick = 0;
  private localPlayerId = 0;

  queueCommand(cmd: Omit<NetCommand, 'tick' | 'playerId'>): void {
    const fullCmd: NetCommand = {
      ...cmd,
      tick: this.currentTick + 2,
      playerId: this.localPlayerId,
    };
    const existing = this.inputBuffer.get(fullCmd.tick) ?? [];
    existing.push(fullCmd);
    this.inputBuffer.set(fullCmd.tick, existing);
  }

  getCommandsForTick(tick: number): NetCommand[] {
    this.currentTick = tick;
    const cmds = this.inputBuffer.get(tick) ?? [];
    this.inputBuffer.delete(tick);
    return cmds;
  }

  computeHash(state: ArrayBuffer): number {
    const view = new Uint8Array(state);
    let hash = 0;
    for (let i = 0; i < view.length; i++) {
      hash = ((hash << 5) - hash + view[i]) | 0;
    }
    return hash;
  }
}
