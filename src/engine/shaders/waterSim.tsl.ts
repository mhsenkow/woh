/**
 * Water simulation config for flood/freeze voxel transitions.
 * Drives the water material animation and ice formation visuals.
 */

export interface WaterSimConfig {
  waveSpeed: number;
  waveHeight: number;
  flowDirection: [number, number];
  color: [number, number, number];
  foamColor: [number, number, number];
  transparency: number;
  ior: number;
}

export const WATER_PRESETS: Record<string, WaterSimConfig> = {
  river: {
    waveSpeed: 1.2,
    waveHeight: 0.02,
    flowDirection: [1.0, 0.0],
    color: [0.12, 0.38, 0.68],
    foamColor: [0.85, 0.92, 0.97],
    transparency: 0.6,
    ior: 1.33,
  },
  lake: {
    waveSpeed: 0.3,
    waveHeight: 0.005,
    flowDirection: [0.0, 0.0],
    color: [0.1, 0.35, 0.6],
    foamColor: [0.8, 0.88, 0.95],
    transparency: 0.5,
    ior: 1.33,
  },
  flood: {
    waveSpeed: 2.5,
    waveHeight: 0.04,
    flowDirection: [0.5, 0.5],
    color: [0.2, 0.35, 0.45],
    foamColor: [0.7, 0.75, 0.8],
    transparency: 0.4,
    ior: 1.33,
  },
  frozen: {
    waveSpeed: 0.0,
    waveHeight: 0.0,
    flowDirection: [0.0, 0.0],
    color: [0.7, 0.85, 0.95],
    foamColor: [0.9, 0.95, 1.0],
    transparency: 0.15,
    ior: 1.31,
  },
};
