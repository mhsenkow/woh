export interface InputState {
  /** Normalized key aliases currently held (e.g. 'w', 'arrowup', 'keyw'). */
  keys: Set<string>;
  mouseX: number;
  mouseY: number;
  /** False until the pointer has actually entered/moved over the game surface. */
  mouseInView: boolean;
  mouseButtons: Set<number>;
  shiftHeld: boolean;
  ctrlHeld: boolean;
  altHeld: boolean;
  wheelDelta: number;
}

/** Keys that must not trigger browser chrome (scroll, focus move, zoom). */
const GAME_CODES = new Set(
  [
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD',
    'KeyQ',
    'KeyE',
    'KeyZ',
    'KeyX',
    'KeyF',
    'KeyR',
    'Space',
    'Home',
    'Equal',
    'Minus',
    'NumpadAdd',
    'NumpadSubtract',
    'Digit0',
    'Numpad0',
  ].map((c) => c.toLowerCase()),
);

/**
 * Expand a KeyboardEvent into every alias we might query.
 * Prefer `code` (layout-independent) and keep `key` as a friendly fallback.
 */
export function keyAliases(e: KeyboardEvent): string[] {
  const out = new Set<string>();
  const code = e.code || '';
  const key = e.key || '';

  if (code) {
    out.add(code.toLowerCase()); // arrowup, keyw, equal…
    if (code.startsWith('Key') && code.length === 4) {
      out.add(code.slice(3).toLowerCase()); // w, a, s, d…
    }
    if (code.startsWith('Digit') && code.length === 6) {
      out.add(code.slice(5)); // 0–9
    }
    if (code.startsWith('Numpad') && code.length === 7 && /Numpad\d/.test(code)) {
      out.add(code.slice(6)); // numpad 0–9 → '0'
    }
    if (code === 'Equal' || code === 'NumpadAdd') {
      out.add('=');
      out.add('+');
    }
    if (code === 'Minus' || code === 'NumpadSubtract') {
      out.add('-');
      out.add('_');
    }
    if (code.startsWith('Arrow')) {
      out.add(code.toLowerCase()); // arrowleft
    }
  }

  if (key) {
    const lower = key.toLowerCase();
    out.add(lower);
    // Older / odd environments sometimes report "Up" instead of "ArrowUp"
    if (lower === 'up') out.add('arrowup');
    if (lower === 'down') out.add('arrowdown');
    if (lower === 'left') out.add('arrowleft');
    if (lower === 'right') out.add('arrowright');
  }

  return [...out];
}

export function isKeyDown(keys: ReadonlySet<string>, ...names: string[]): boolean {
  for (const n of names) {
    if (keys.has(n.toLowerCase())) return true;
  }
  return false;
}

/** Screen-relative move axes from WASD / arrows. +y = forward (into scene). */
export function readMoveAxes(keys: ReadonlySet<string>): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (isKeyDown(keys, 'w', 'arrowup', 'keyw')) y += 1;
  if (isKeyDown(keys, 's', 'arrowdown', 'keys')) y -= 1;
  if (isKeyDown(keys, 'a', 'arrowleft', 'keya')) x -= 1;
  if (isKeyDown(keys, 'd', 'arrowright', 'keyd')) x += 1;
  if (x !== 0 || y !== 0) {
    const len = Math.hypot(x, y) || 1;
    x /= len;
    y /= len;
  }
  return { x, y };
}

export class InputManager {
  readonly state: InputState = {
    keys: new Set(),
    mouseX: Number.NaN,
    mouseY: Number.NaN,
    mouseInView: false,
    mouseButtons: new Set(),
    shiftHeld: false,
    ctrlHeld: false,
    altHeld: false,
    wheelDelta: 0,
  };

  private domElement: HTMLElement | null = null;
  private hotkeys = new Map<string, () => void>();
  /** code → aliases added on keydown, so keyup can clear even if modifiers changed. */
  private codeToAliases = new Map<string, string[]>();

  attach(el: HTMLElement): void {
    this.domElement = el;
    // Make the game surface focusable so arrows aren't stolen by HUD buttons
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.style.outline = 'none';

    window.addEventListener('keydown', this.onKeyDown, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    window.addEventListener('blur', this.onBlur);
    el.addEventListener('pointerdown', this.onPointerFocus);
    el.addEventListener('pointermove', this.onMouseMove);
    el.addEventListener('pointerenter', this.onMouseEnter);
    el.addEventListener('pointerleave', this.onMouseLeave);
    el.addEventListener('mousedown', this.onMouseDown);
    el.addEventListener('mouseup', this.onMouseUp);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.focus({ preventScroll: true });
  }

  detach(): void {
    window.removeEventListener('keydown', this.onKeyDown, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    window.removeEventListener('blur', this.onBlur);
    if (this.domElement) {
      this.domElement.removeEventListener('pointerdown', this.onPointerFocus);
      this.domElement.removeEventListener('pointermove', this.onMouseMove);
      this.domElement.removeEventListener('pointerenter', this.onMouseEnter);
      this.domElement.removeEventListener('pointerleave', this.onMouseLeave);
      this.domElement.removeEventListener('mousedown', this.onMouseDown);
      this.domElement.removeEventListener('mouseup', this.onMouseUp);
    }
    this.domElement = null;
    this.clearKeys();
  }

  registerHotkey(key: string, fn: () => void): void {
    this.hotkeys.set(key.toLowerCase(), fn);
  }

  resetFrameState(): void {
    this.state.wheelDelta = 0;
  }

  clearKeys(): void {
    this.state.keys.clear();
    this.codeToAliases.clear();
  }

  isDown(...names: string[]): boolean {
    return isKeyDown(this.state.keys, ...names);
  }

  private onPointerFocus = (): void => {
    this.domElement?.focus({ preventScroll: true });
  };

  private onBlur = (): void => {
    this.clearKeys();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    // Ignore pure repeats for hotkeys, but keep held state
    const aliases = keyAliases(e);
    this.codeToAliases.set(e.code || e.key, aliases);
    for (const a of aliases) this.state.keys.add(a);

    this.state.shiftHeld = e.shiftKey;
    this.state.ctrlHeld = e.ctrlKey || e.metaKey;
    this.state.altHeld = e.altKey;

    if (
      GAME_CODES.has((e.code || '').toLowerCase()) ||
      aliases.some((a) => a.startsWith('arrow'))
    ) {
      e.preventDefault();
    }

    if (!e.repeat) {
      for (const a of aliases) {
        const handler = this.hotkeys.get(a);
        if (handler) {
          handler();
          break;
        }
      }
    }

    if (this.state.ctrlHeld && e.code >= 'Digit1' && e.code <= 'Digit9') {
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const stored = this.codeToAliases.get(e.code || e.key) ?? keyAliases(e);
    for (const a of stored) this.state.keys.delete(a);
    this.codeToAliases.delete(e.code || e.key);

    this.state.shiftHeld = e.shiftKey;
    this.state.ctrlHeld = e.ctrlKey || e.metaKey;
    this.state.altHeld = e.altKey;
  };

  private onMouseEnter = (e: PointerEvent): void => {
    this.state.mouseInView = true;
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;
  };

  private onMouseLeave = (): void => {
    this.state.mouseInView = false;
  };

  private onMouseMove = (e: PointerEvent): void => {
    this.state.mouseInView = true;
    this.state.mouseX = e.clientX;
    this.state.mouseY = e.clientY;
  };

  private onMouseDown = (e: MouseEvent): void => {
    this.state.mouseButtons.add(e.button);
    this.domElement?.focus({ preventScroll: true });
  };

  private onMouseUp = (e: MouseEvent): void => {
    this.state.mouseButtons.delete(e.button);
  };
}
