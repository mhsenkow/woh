import * as THREE from 'three';

export interface SelectionRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Visual marquee layer only. Actual unit picking / orders live in SelectionController.
 */
export class SelectionBox {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private isSelecting = false;
  private rect: SelectionRect = { startX: 0, startY: 0, endX: 0, endY: 0 };
  private controlGroups: Map<number, number[]> = new Map();

  onSelect?: (entityIds: number[]) => void;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText =
      'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    this.resize();

    container.addEventListener('mousedown', this.onMouseDown);
    container.addEventListener('mousemove', this.onMouseMove);
    container.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  assignControlGroup(groupId: number, entityIds: number[]): void {
    this.controlGroups.set(groupId, [...entityIds]);
  }

  getControlGroup(groupId: number): number[] {
    return this.controlGroups.get(groupId) ?? [];
  }

  getSelectionRect(): SelectionRect | null {
    return this.isSelecting ? this.rect : null;
  }

  drawSelectionBox(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (!this.isSelecting) return;

    const x = Math.min(this.rect.startX, this.rect.endX);
    const y = Math.min(this.rect.startY, this.rect.endY);
    const w = Math.abs(this.rect.endX - this.rect.startX);
    const h = Math.abs(this.rect.endY - this.rect.startY);

    if (w < 3 && h < 3) return;

    this.ctx.strokeStyle = '#00ccff';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 2]);
    this.ctx.strokeRect(x, y, w, h);
    this.ctx.fillStyle = 'rgba(0, 204, 255, 0.08)';
    this.ctx.fillRect(x, y, w, h);
  }

  isInSelectionBox(screenPos: THREE.Vector2): boolean {
    if (!this.isSelecting) return false;
    const x = Math.min(this.rect.startX, this.rect.endX);
    const y = Math.min(this.rect.startY, this.rect.endY);
    const w = Math.abs(this.rect.endX - this.rect.startX);
    const h = Math.abs(this.rect.endY - this.rect.startY);
    return (
      screenPos.x >= x &&
      screenPos.x <= x + w &&
      screenPos.y >= y &&
      screenPos.y <= y + h
    );
  }

  private onMouseDown = (e: MouseEvent): void => {
    // Leave shift (camera pan) and alt (camera orbit) alone
    if (e.button !== 0 || e.shiftKey || e.altKey) return;
    this.isSelecting = true;
    this.rect.startX = e.clientX;
    this.rect.startY = e.clientY;
    this.rect.endX = e.clientX;
    this.rect.endY = e.clientY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isSelecting) return;
    this.rect.endX = e.clientX;
    this.rect.endY = e.clientY;
  };

  private onMouseUp = (_e: MouseEvent): void => {
    this.isSelecting = false;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  };
}
