/**
 * Replay recorder capturing voxel diffs + entity state per tick.
 * Phase 7+: Full implementation with scrubbing.
 */

import type { NetCommand } from './LockstepClient';

export interface ReplayFrame {
  tick: number;
  timestamp: number;
  commands: NetCommand[];
  voxelDiffs?: VoxelDiff[];
}

export interface VoxelDiff {
  chunkKey: string;
  changes: { index: number; oldType: number; newType: number }[];
}

export class ReplayRecorder {
  private frames: ReplayFrame[] = [];
  private recording = false;
  private startTime = 0;

  startRecording(): void {
    this.frames = [];
    this.recording = true;
    this.startTime = performance.now();
  }

  stopRecording(): ReplayFrame[] {
    this.recording = false;
    return this.frames;
  }

  recordFrame(tick: number, commands: NetCommand[], voxelDiffs?: VoxelDiff[]): void {
    if (!this.recording) return;
    this.frames.push({
      tick,
      timestamp: performance.now() - this.startTime,
      commands: [...commands],
      voxelDiffs,
    });
  }

  getFrame(tick: number): ReplayFrame | undefined {
    return this.frames.find((f) => f.tick === tick);
  }

  get frameCount(): number {
    return this.frames.length;
  }

  serialize(): string {
    return JSON.stringify(this.frames);
  }

  deserialize(data: string): void {
    this.frames = JSON.parse(data);
  }
}
