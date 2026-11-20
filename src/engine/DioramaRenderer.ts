import * as THREE from 'three';

/**
 * The Diorama Engine renderer.
 * Uses WebGLRenderer with high-quality settings.
 * WebGPU backend swap is a single-line change when @types/three ships WebGPURenderer types.
 */
export class DioramaRenderer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  private container: HTMLElement;
  private _width = 0;
  private _height = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    // Paper sky. Distance fog stays behind the playfield; the sea's own
    // mist ring hides the far water so the horizon is not one big gradient.
    const paper = new THREE.Color(0xf0eee9);
    this.scene.background = paper;
    this.scene.fog = new THREE.Fog(paper, 280, 640);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.container.appendChild(this.renderer.domElement);
    this.resize();
  }

  async init(): Promise<void> {
    window.addEventListener('resize', () => this.resize());
  }

  resize(): void {
    this._width = this.container.clientWidth;
    this._height = this.container.clientHeight;
    this.renderer.setSize(this._width, this._height);
  }

  render(camera: THREE.Camera): void {
    this.renderer.render(this.scene, camera);
  }

  get width(): number { return this._width; }
  get height(): number { return this._height; }
  get domElement(): HTMLCanvasElement { return this.renderer.domElement; }
}
