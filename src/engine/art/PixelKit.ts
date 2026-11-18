import * as THREE from 'three';

/**
 * Chrono Trigger / SNES-era pixel kit.
 * Draw at native pixel resolution, then nearest-neighbor upscale for crisp standees.
 */

export type Hex = string;

export interface ShadeRamp {
  outline: Hex;
  dark: Hex;
  mid: Hex;
  light: Hex;
  hilite: Hex;
}

export const RAMPS = {
  skin: { outline: '#3a2010', dark: '#c08050', mid: '#e0a870', light: '#f0c898', hilite: '#ffe8c8' },
  greenCloth: { outline: '#0a2010', dark: '#1a6030', mid: '#2a9040', light: '#48b858', hilite: '#80e088' },
  blueArmor: { outline: '#081828', dark: '#184878', mid: '#2868b0', light: '#4890d8', hilite: '#88c0f0' },
  redMalice: { outline: '#200008', dark: '#700818', mid: '#b01028', light: '#e02840', hilite: '#ff6870' },
  darkArmor: { outline: '#08040c', dark: '#18101c', mid: '#302030', light: '#483848', hilite: '#685868' },
  stone: { outline: '#202028', dark: '#585860', mid: '#808088', light: '#a8a8b0', hilite: '#d0d0d8' },
  wood: { outline: '#201008', dark: '#503018', mid: '#785028', light: '#a07040', hilite: '#c89860' },
  gold: { outline: '#302008', dark: '#906018', mid: '#c89028', light: '#e8b848', hilite: '#ffe888' },
  pink: { outline: '#401028', dark: '#d05078', mid: '#f078a0', light: '#ffa0c0', hilite: '#ffc8d8' },
  orange: { outline: '#301008', dark: '#b05018', mid: '#e07828', light: '#f0a048', hilite: '#ffc878' },
  leaf: { outline: '#0c2008', dark: '#286018', mid: '#3a8828', light: '#58b040', hilite: '#88d868' },
  leafDark: { outline: '#081808', dark: '#184010', mid: '#286020', light: '#388030', hilite: '#58a048' },
  water: { outline: '#082038', dark: '#184878', mid: '#2870b0', light: '#48a0d8', hilite: '#88d0f0' },
  void: { outline: '#080418', dark: '#180830', mid: '#301050', light: '#502878', hilite: '#8050a8' },
  paper: { outline: '#403028', dark: '#c8b090', mid: '#e0d0b0', light: '#f0e8d0', hilite: '#fff8e8' },
  silver: { outline: '#202028', dark: '#687078', mid: '#98a0a8', light: '#c0c8d0', hilite: '#e8f0f8' },
  /** Classic Mario mushroom-cap red. */
  shroomRed: { outline: '#280808', dark: '#881018', mid: '#d02828', light: '#f05048', hilite: '#ff9080' },
  /** Warp-pipe green. */
  pipeGreen: { outline: '#082018', dark: '#186028', mid: '#28a038', light: '#48d058', hilite: '#88f090' },
  /** Soft Dream Land pastel foliage. */
  dreamLeaf: { outline: '#204028', dark: '#58a070', mid: '#88d098', light: '#b8f0c0', hilite: '#e0ffe8' },
  /** Deku / Lost Woods deep teal. */
  deku: { outline: '#081818', dark: '#185048', mid: '#287868', light: '#40a088', hilite: '#68d0b0' },
  /** Soft cloud white for Kirby props. */
  cloud: { outline: '#687088', dark: '#c8d0e0', mid: '#e8f0f8', light: '#f8fcff', hilite: '#ffffff' },
  /** Bowser fortress burnt orange. */
  lava: { outline: '#280808', dark: '#a02808', mid: '#e04810', light: '#ff8020', hilite: '#ffc040' },
} as const satisfies Record<string, ShadeRamp>;

export class PixelCanvas {
  readonly w: number;
  readonly h: number;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  private data: ImageData;
  private buf: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.canvas = document.createElement('canvas');
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.ctx.imageSmoothingEnabled = false;
    this.data = this.ctx.createImageData(w, h);
    this.buf = this.data.data;
  }

  clear(): void {
    this.buf.fill(0);
  }

  /** Flush buffer to canvas. */
  flush(): void {
    this.ctx.putImageData(this.data, 0, 0);
  }

  set(x: number, y: number, hex: Hex, a = 255): void {
    const xi = x | 0;
    const yi = y | 0;
    if (xi < 0 || yi < 0 || xi >= this.w || yi >= this.h) return;
    const i = (yi * this.w + xi) * 4;
    const { r, g, b } = hexRgb(hex);
    this.buf[i] = r;
    this.buf[i + 1] = g;
    this.buf[i + 2] = b;
    this.buf[i + 3] = a;
  }

  getA(x: number, y: number): number {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.buf[(y * this.w + x) * 4 + 3];
  }

  /** Filled rect (pixel-perfect). */
  rect(x: number, y: number, w: number, h: number, hex: Hex): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) this.set(x + i, y + j, hex);
    }
  }

  /** Outline rect. */
  rectOutline(x: number, y: number, w: number, h: number, hex: Hex): void {
    for (let i = 0; i < w; i++) {
      this.set(x + i, y, hex);
      this.set(x + i, y + h - 1, hex);
    }
    for (let j = 0; j < h; j++) {
      this.set(x, y + j, hex);
      this.set(x + w - 1, y + j, hex);
    }
  }

  /** Filled circle. */
  circle(cx: number, cy: number, r: number, hex: Hex): void {
    const r2 = r * r;
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        if (i * i + j * j <= r2) this.set(cx + i, cy + j, hex);
      }
    }
  }

  /** Circle outline. */
  circleOutline(cx: number, cy: number, r: number, hex: Hex): void {
    const r2 = r * r;
    const rIn = (r - 1) * (r - 1);
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        const d = i * i + j * j;
        if (d <= r2 && d >= rIn) this.set(cx + i, cy + j, hex);
      }
    }
  }

  /** Soft shaded sphere using a ramp. */
  sphere(cx: number, cy: number, r: number, ramp: ShadeRamp, lightDir = { x: -0.4, y: -0.55 }): void {
    const r2 = r * r;
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        const d = i * i + j * j;
        if (d > r2) continue;
        if (d > (r - 0.6) * (r - 0.6)) {
          this.set(cx + i, cy + j, ramp.outline);
          continue;
        }
        const nx = i / r;
        const ny = j / r;
        const ndot = nx * lightDir.x + ny * lightDir.y;
        let hex: Hex;
        if (ndot < -0.35) hex = ramp.dark;
        else if (ndot < 0.05) hex = ramp.mid;
        else if (ndot < 0.45) hex = ramp.light;
        else hex = ramp.hilite;
        this.set(cx + i, cy + j, hex);
      }
    }
  }

  /** Vertical capsule / limb with shading. */
  limb(
    x0: number, y0: number, x1: number, y1: number,
    thickness: number, ramp: ShadeRamp,
  ): void {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const steps = Math.ceil(len);
    const nx = -dy / len;
    const ny = dx / len;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = Math.round(x0 + dx * t);
      const y = Math.round(y0 + dy * t);
      for (let k = -thickness; k <= thickness; k++) {
        const px = x + Math.round(nx * k);
        const py = y + Math.round(ny * k);
        let hex: Hex = ramp.mid;
        if (Math.abs(k) === thickness) hex = ramp.outline;
        else if (k < -thickness * 0.3) hex = ramp.dark;
        else if (k > thickness * 0.35) hex = ramp.light;
        this.set(px, py, hex);
      }
    }
  }

  /** Flat shaded rounded rect body. */
  bodyBox(x: number, y: number, w: number, h: number, ramp: ShadeRamp, radius = 2): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        // simple round corners
        const onEdge =
          (i < radius && j < radius && (i - radius) ** 2 + (j - radius) ** 2 > radius * radius) ||
          (i >= w - radius && j < radius && (i - (w - 1 - radius)) ** 2 + (j - radius) ** 2 > radius * radius) ||
          (i < radius && j >= h - radius && (i - radius) ** 2 + (j - (h - 1 - radius)) ** 2 > radius * radius) ||
          (i >= w - radius && j >= h - radius && (i - (w - 1 - radius)) ** 2 + (j - (h - 1 - radius)) ** 2 > radius * radius);
        if (onEdge) continue;

        const edge = i === 0 || j === 0 || i === w - 1 || j === h - 1;
        let hex: Hex;
        if (edge) hex = ramp.outline;
        else if (i < 2) hex = ramp.dark;
        else if (i > w - 3) hex = ramp.light;
        else if (j < 2) hex = ramp.light;
        else if (j > h - 3) hex = ramp.dark;
        else hex = ramp.mid;
        this.set(x + i, y + j, hex);
      }
    }
  }

  /** Checker dither between two colors in a region (CT-style). */
  dither(x: number, y: number, w: number, h: number, a: Hex, b: Hex): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        this.set(x + i, y + j, ((i + j) & 1) === 0 ? a : b);
      }
    }
  }

  /** 1px outline around all opaque pixels (die-cut). */
  outlineOpaque(hex: Hex = '#ffffff'): void {
    const add: { x: number; y: number }[] = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.getA(x, y) > 0) continue;
        if (
          this.getA(x - 1, y) || this.getA(x + 1, y) ||
          this.getA(x, y - 1) || this.getA(x, y + 1)
        ) {
          add.push({ x, y });
        }
      }
    }
    for (const p of add) this.set(p.x, p.y, hex);
  }

  /** Thicker die-cut border (2px). */
  dieCut(border: Hex = '#ffffff'): void {
    this.outlineOpaque(border);
    this.outlineOpaque(border);
  }

  ellipseFill(cx: number, cy: number, rx: number, ry: number, hex: Hex): void {
    for (let j = -ry; j <= ry; j++) {
      for (let i = -rx; i <= rx; i++) {
        if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1) this.set(cx + i, cy + j, hex);
      }
    }
  }

  /** Contact shadow ellipse under feet. */
  contactShadow(cx: number, cy: number, rx: number, ry: number): void {
    for (let j = -ry; j <= ry; j++) {
      for (let i = -rx; i <= rx; i++) {
        const t = (i * i) / (rx * rx) + (j * j) / (ry * ry);
        if (t <= 1) {
          const a = Math.floor((1 - t) * 90);
          const idx = ((cy + j) * this.w + (cx + i)) * 4;
          if (cx + i < 0 || cy + j < 0 || cx + i >= this.w || cy + j >= this.h) continue;
          if (this.buf[idx + 3] === 0) {
            this.buf[idx] = 0;
            this.buf[idx + 1] = 0;
            this.buf[idx + 2] = 0;
            this.buf[idx + 3] = a;
          }
        }
      }
    }
  }

  /** Soft horizontal band shade (tunic folds / CT cloth). */
  bandShade(x: number, y: number, w: number, h: number, ramp: ShadeRamp): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const t = i / Math.max(1, w - 1);
        let hex: Hex = ramp.mid;
        if (i === 0 || i === w - 1 || j === 0 || j === h - 1) hex = ramp.outline;
        else if (t < 0.2) hex = ramp.dark;
        else if (t > 0.75) hex = ramp.light;
        else if (j < 2) hex = ramp.light;
        else if ((i + j) % 5 === 0) hex = ramp.dark;
        this.set(x + i, y + j, hex);
      }
    }
  }

  /** Speckle noise in region (stone / bark / fabric grit). */
  grit(x: number, y: number, w: number, h: number, hex: Hex, density = 0.12): void {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const n = ((i * 374761 + j * 668265) ^ (x * 97 + y)) >>> 0;
        if ((n % 1000) / 1000 < density && this.getA(x + i, y + j) > 0) {
          this.set(x + i, y + j, hex);
        }
      }
    }
  }

  /** Hair strands from a scalp line (CT Crono/Marle style). */
  hairCap(cx: number, cy: number, halfW: number, depth: number, ramp: ShadeRamp, spike = false): void {
    for (let i = -halfW; i <= halfW; i++) {
      const drop = spike
        ? Math.floor(Math.abs(i) * 0.35) + (i % 3 === 0 ? 2 : 0)
        : Math.floor(Math.abs(i) * 0.15);
      const top = cy - depth + drop;
      for (let y = top; y <= cy + 1; y++) {
        const edge = y === top || Math.abs(i) === halfW;
        let hex: Hex = ramp.mid;
        if (edge) hex = ramp.outline;
        else if (i < -2) hex = ramp.dark;
        else if (i > 3) hex = ramp.light;
        else if (y < cy - depth + 3) hex = ramp.hilite;
        this.set(cx + i, y, hex);
      }
      if (spike && Math.abs(i) % 3 === 0) {
        this.set(cx + i, top - 1, ramp.light);
      }
    }
  }

  /**
   * Upscale with nearest-neighbor into a Three.js texture.
   * This is the Chrono Trigger crispness secret.
   */
  toTexture(scale = 6): THREE.CanvasTexture {
    this.flush();
    const out = document.createElement('canvas');
    out.width = this.w * scale;
    out.height = this.h * scale;
    const octx = out.getContext('2d')!;
    octx.imageSmoothingEnabled = false;
    octx.drawImage(this.canvas, 0, 0, out.width, out.height);

    const tex = new THREE.CanvasTexture(out);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }
}

function hexRgb(hex: Hex): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Eyes — CT style white sclera + dark pupil + catchlight. */
export function paintEyes(px: PixelCanvas, lx: number, ly: number, rx: number, ry: number, open = true): void {
  if (!open) {
    px.rect(lx - 1, ly, 3, 1, '#1a1010');
    px.rect(rx - 1, ry, 3, 1, '#1a1010');
    return;
  }
  px.rect(lx - 1, ly - 2, 3, 4, '#fff8f0');
  px.rect(rx - 1, ry - 2, 3, 4, '#fff8f0');
  px.set(lx, ly - 1, '#101018');
  px.set(rx, ry - 1, '#101018');
  px.set(lx, ly - 2, '#ffffff');
  px.set(rx, ry - 2, '#ffffff');
}

/** Angry / glowing eyes (Ganon / Meta). */
export function paintGlowEyes(px: PixelCanvas, lx: number, ly: number, rx: number, ry: number, glow: Hex): void {
  px.rect(lx - 1, ly - 1, 4, 3, glow);
  px.rect(rx - 1, ry - 1, 4, 3, glow);
  px.set(lx, ly, '#ffffff');
  px.set(rx, ry, '#ffffff');
  px.set(lx + 1, ly, '#101018');
  px.set(rx + 1, ry, '#101018');
}
