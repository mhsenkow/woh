/**
 * Creep / corruption overlay shader config.
 * Malice (Ganon), Void (Dark Matter), and Pipe network overlays
 * modify the terrain voxel appearance in real-time.
 */

export interface CreepOverlayConfig {
  type: 'malice' | 'void' | 'pipe';
  color: [number, number, number];
  emissive: [number, number, number];
  emissiveIntensity: number;
  pulseSpeed: number;
  pulseAmplitude: number;
  opacity: number;
}

export const CREEP_OVERLAYS: Record<string, CreepOverlayConfig> = {
  malice: {
    type: 'malice',
    color: [0.65, 0.03, 0.12],
    emissive: [0.5, 0.02, 0.08],
    emissiveIntensity: 1.2,
    pulseSpeed: 1.5,
    pulseAmplitude: 0.3,
    opacity: 0.85,
  },
  void: {
    type: 'void',
    color: [0.08, 0.01, 0.18],
    emissive: [0.12, 0.0, 0.25],
    emissiveIntensity: 1.5,
    pulseSpeed: 0.8,
    pulseAmplitude: 0.5,
    opacity: 0.9,
  },
  pipe: {
    type: 'pipe',
    color: [0.15, 0.55, 0.15],
    emissive: [0.05, 0.2, 0.05],
    emissiveIntensity: 0.3,
    pulseSpeed: 0.0,
    pulseAmplitude: 0.0,
    opacity: 0.7,
  },
};
