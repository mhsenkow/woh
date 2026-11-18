/**
 * Micro-animation catalog for the Diorama Engine.
 * Specs drive flipbooks, UI feedback, and world VFX — deterministic & state-driven
 * so netcode / replays stay kilobyte-scale (no skeletal curves).
 */

/** Shared easing tokens used by UI + standee tweens. */
export type EaseId =
  | 'linear'
  | 'snap'          // instant (Y-flip facing)
  | 'press'         // mechanical switch depress
  | 'softOut'       // selection bloom
  | 'pop'           // spawn / unlock
  | 'recoil';        // attack kickback

export interface MicroAnimKey {
  /** Normalized 0–1 timeline sample. */
  t: number;
  /** Primary channel (scale, yaw, opacity, ringRadius…). */
  v: number;
}

export interface MicroAnimClip {
  id: string;
  /** What system consumes this clip. */
  channel:
    | 'standee'
    | 'plinth'
    | 'ui'
    | 'terrain'
    | 'vfx'
    | 'commandCard';
  durationMs: number;
  ease: EaseId;
  loop: boolean;
  /** Optional multi-keyframe curve; if empty, systems use ease(duration). */
  keys?: MicroAnimKey[];
  /** Free-form params (degrees, meters, hex colors…). */
  params?: Record<string, number | string | boolean>;
}

/**
 * Flipbook rows beyond the base Idle/Walk/Attack/Hurt/Die set.
 * Row index = AnimState enum value in FlipbookSystem.
 */
export const MICRO_FLIPBOOK_STATES = {
  Idle: { row: 0, frames: 6, fps: 8, loop: true },
  Walk: { row: 1, frames: 8, fps: 12, loop: true },
  Attack: { row: 2, frames: 6, fps: 14, loop: false },
  Hurt: { row: 3, frames: 3, fps: 12, loop: false },
  Die: { row: 4, frames: 6, fps: 10, loop: false },
  /** Build / gather bob — builders & harvesters. */
  Work: { row: 5, frames: 6, fps: 10, loop: true },
  /** Spell / ability cast wind-up. */
  Cast: { row: 6, frames: 8, fps: 12, loop: false },
  /** Victory / taunt after kill streak. */
  Cheer: { row: 7, frames: 4, fps: 8, loop: false },
  /** Sheikah turret fold / unfold. */
  Transform: { row: 8, frames: 8, fps: 14, loop: false },
  /** Blood Moon / void corrupt flicker. */
  Corrupt: { row: 9, frames: 6, fps: 16, loop: true },
} as const;

export type MicroFlipbookState = keyof typeof MICRO_FLIPBOOK_STATES;

/** 180° Y-axis snap when facing crosses the billboard threshold (PD §2.2). */
export const STANDEE_Y_FLIP: MicroAnimClip = {
  id: 'standee-y-flip',
  channel: 'standee',
  durationMs: 80,
  ease: 'snap',
  loop: false,
  params: { yawDegrees: 180, scaleXPunch: 0.92 },
};

/** Selection plinth ring bloom under standee foot-base. */
export const SELECTION_PLINTH: MicroAnimClip = {
  id: 'selection-plinth',
  channel: 'plinth',
  durationMs: 180,
  ease: 'softOut',
  loop: false,
  keys: [
    { t: 0, v: 0 },
    { t: 0.45, v: 1.15 },
    { t: 1, v: 1 },
  ],
  params: { ringWidth: 0.06, subgroupPulseHz: 0 },
};

/** Subgroup priority tether pulse (color-coded control groups). */
export const SUBGROUP_TETHER: MicroAnimClip = {
  id: 'subgroup-tether',
  channel: 'plinth',
  durationMs: 900,
  ease: 'linear',
  loop: true,
  params: { opacityMin: 0.35, opacityMax: 0.85 },
};

/** Radial health arc around circular foot-base (PD §5). */
export const HEALTH_RING_DRAIN: MicroAnimClip = {
  id: 'health-ring-drain',
  channel: 'plinth',
  durationMs: 120,
  ease: 'softOut',
  loop: false,
  params: { arcStartDeg: 90, clockwise: true },
};

/** Physical damage states on cutout border. */
export const DAMAGE_MICRO: Record<'scorch' | 'bend' | 'punch' | 'foilPeel', MicroAnimClip> = {
  scorch: {
    id: 'damage-scorch',
    channel: 'standee',
    durationMs: 200,
    ease: 'softOut',
    loop: false,
    params: { sootMix: 0.4, edgeGlow: 0.1 },
  },
  bend: {
    id: 'damage-bend',
    channel: 'standee',
    durationMs: 0,
    ease: 'linear',
    loop: true,
    params: { cornerBendRad: 0.08, flutterHz: 1.2 },
  },
  punch: {
    id: 'damage-punch',
    channel: 'standee',
    durationMs: 150,
    ease: 'pop',
    loop: false,
    params: { holeScale: 0.08, scalePunch: 0.95 },
  },
  foilPeel: {
    id: 'damage-foil-peel',
    channel: 'standee',
    durationMs: 400,
    ease: 'softOut',
    loop: false,
    params: { hologramIntensity: 0.6 },
  },
};

/** Attack recoil — standee kicks back along facing. */
export const ATTACK_RECOIL: MicroAnimClip = {
  id: 'attack-recoil',
  channel: 'standee',
  durationMs: 110,
  ease: 'recoil',
  loop: false,
  keys: [
    { t: 0, v: 0 },
    { t: 0.3, v: -1 },
    { t: 1, v: 0 },
  ],
  params: { pushMeters: 0.12 },
};

/** Spawn pop when a unit exits a barracks / pit / pipe. */
export const UNIT_SPAWN_POP: MicroAnimClip = {
  id: 'unit-spawn-pop',
  channel: 'standee',
  durationMs: 220,
  ease: 'pop',
  loop: false,
  keys: [
    { t: 0, v: 0 },
    { t: 0.55, v: 1.12 },
    { t: 1, v: 1 },
  ],
  params: { fromY: -0.4 },
};

/** Die — cardboard tip-over then fade. */
export const STANDEE_TIP_OVER: MicroAnimClip = {
  id: 'standee-tip-over',
  channel: 'standee',
  durationMs: 450,
  ease: 'softOut',
  loop: false,
  keys: [
    { t: 0, v: 0 },
    { t: 0.7, v: 1 },
    { t: 1, v: 1 },
  ],
  params: { tipAxis: 'x', tipDegrees: 85, fadeAfter: 0.7 },
};

/** Command card mechanical switch depress (PD §5). */
export const COMMAND_PRESS: MicroAnimClip = {
  id: 'command-press',
  channel: 'commandCard',
  durationMs: 120,
  ease: 'press',
  loop: false,
  keys: [
    { t: 0, v: 0 },
    { t: 0.35, v: 1 },
    { t: 1, v: 0 },
  ],
  params: { translateYpx: 2, insetShadow: true },
};

/** Research / build progress tick on structure standee. */
export const BUILD_PROGRESS_TICK: MicroAnimClip = {
  id: 'build-progress-tick',
  channel: 'ui',
  durationMs: 80,
  ease: 'snap',
  loop: false,
  params: { sparkCount: 2 },
};

/** Creep / void tile grow pulse when a voxel converts. */
export const CREEP_VOXEL_PULSE: MicroAnimClip = {
  id: 'creep-voxel-pulse',
  channel: 'terrain',
  durationMs: 280,
  ease: 'softOut',
  loop: false,
  keys: [
    { t: 0, v: 0.6 },
    { t: 0.4, v: 1.2 },
    { t: 1, v: 1 },
  ],
  params: { emissiveFlash: 0.5 },
};

/** Water freeze → ice bridge form. */
export const ICE_BRIDGE_FORM: MicroAnimClip = {
  id: 'ice-bridge-form',
  channel: 'terrain',
  durationMs: 500,
  ease: 'softOut',
  loop: false,
  params: { frostSpreadMetersPerSec: 4 },
};

/** Fire ignite on wooden voxels / dry grass. */
export const FIRE_IGNITE: MicroAnimClip = {
  id: 'fire-ignite',
  channel: 'vfx',
  durationMs: 350,
  ease: 'pop',
  loop: false,
  params: { particleBurst: 12, color: 0xff6622 },
};

/** Warp pipe gulp / eject. */
export const PIPE_TRANSIT: MicroAnimClip = {
  id: 'pipe-transit',
  channel: 'standee',
  durationMs: 400,
  ease: 'press',
  loop: false,
  keys: [
    { t: 0, v: 1 },
    { t: 0.4, v: 0 },
    { t: 0.6, v: 0 },
    { t: 1, v: 1 },
  ],
  params: { squashY: 0.3 },
};

/** Blood Moon sky flash + bokoblin revive shimmer. */
export const BLOOD_MOON_PULSE: MicroAnimClip = {
  id: 'blood-moon-pulse',
  channel: 'vfx',
  durationMs: 1200,
  ease: 'softOut',
  loop: false,
  params: { skyTint: 0xaa1020, reviveStaggerMs: 80 },
};

/** Minimap terrain scar when voxels are destroyed. */
export const MINIMAP_SCAR: MicroAnimClip = {
  id: 'minimap-scar',
  channel: 'ui',
  durationMs: 200,
  ease: 'snap',
  loop: false,
  params: { flashColor: 0xffffff },
};

/** Hero lock camera handoff (macro → micro). */
export const HERO_LOCK_HANDOFF: MicroAnimClip = {
  id: 'hero-lock-handoff',
  channel: 'vfx',
  durationMs: 320,
  ease: 'softOut',
  loop: false,
  params: { fovPunch: 4, letterbox: 0.08 },
};

/** Catalog for tooling / replay annotation. */
export const MICRO_ANIM_CATALOG: MicroAnimClip[] = [
  STANDEE_Y_FLIP,
  SELECTION_PLINTH,
  SUBGROUP_TETHER,
  HEALTH_RING_DRAIN,
  DAMAGE_MICRO.scorch,
  DAMAGE_MICRO.bend,
  DAMAGE_MICRO.punch,
  DAMAGE_MICRO.foilPeel,
  ATTACK_RECOIL,
  UNIT_SPAWN_POP,
  STANDEE_TIP_OVER,
  COMMAND_PRESS,
  BUILD_PROGRESS_TICK,
  CREEP_VOXEL_PULSE,
  ICE_BRIDGE_FORM,
  FIRE_IGNITE,
  PIPE_TRANSIT,
  BLOOD_MOON_PULSE,
  MINIMAP_SCAR,
  HERO_LOCK_HANDOFF,
];

export function getMicroAnim(id: string): MicroAnimClip | undefined {
  return MICRO_ANIM_CATALOG.find((c) => c.id === id);
}

/** Sample a clip's primary channel at time `elapsedMs`. */
export function sampleClip(clip: MicroAnimClip, elapsedMs: number): number {
  const t = clip.loop
    ? (elapsedMs % clip.durationMs) / Math.max(1, clip.durationMs)
    : Math.min(1, elapsedMs / Math.max(1, clip.durationMs));

  if (clip.keys && clip.keys.length > 0) {
    if (t <= clip.keys[0].t) return clip.keys[0].v;
    for (let i = 1; i < clip.keys.length; i++) {
      const a = clip.keys[i - 1];
      const b = clip.keys[i];
      if (t <= b.t) {
        const u = (t - a.t) / Math.max(1e-6, b.t - a.t);
        return a.v + (b.v - a.v) * ease(u, clip.ease);
      }
    }
    return clip.keys[clip.keys.length - 1].v;
  }

  return ease(t, clip.ease);
}

function ease(t: number, id: EaseId): number {
  switch (id) {
    case 'linear':
      return t;
    case 'snap':
      return t >= 1 ? 1 : 0;
    case 'press':
      return t < 0.35 ? t / 0.35 : 1 - (t - 0.35) / 0.65;
    case 'softOut':
      return 1 - Math.pow(1 - t, 3);
    case 'pop':
      return t < 0.55 ? (t / 0.55) * 1.12 : 1.12 - ((t - 0.55) / 0.45) * 0.12;
    case 'recoil':
      return Math.sin(t * Math.PI) * (t < 0.3 ? 1 : 1 - (t - 0.3) / 0.7);
    default:
      return t;
  }
}
