import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  DepthOfFieldEffect,
  VignetteEffect,
  BloomEffect,
} from 'postprocessing';

export interface PostProcessConfig {
  bloomStrength: number;
  bloomThreshold: number;
  vignetteIntensity: number;
  toneMappingExposure: number;
  /** Soft cinematic bokeh — focus stays on look-at / mid playfield. */
  bokehScale: number;
  focusRange: number;
}

export const DEFAULT_POST_CONFIG: PostProcessConfig = {
  bloomStrength: 0.04,
  bloomThreshold: 0.92,
  vignetteIntensity: 0.14,
  toneMappingExposure: 1,
  bokehScale: 0.15,
  focusRange: 80,
};

export function applyPostProcessConfig(
  renderer: THREE.WebGLRenderer,
  config: Partial<PostProcessConfig> = {},
): PostProcessConfig {
  const cfg = { ...DEFAULT_POST_CONFIG, ...config };
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = cfg.toneMappingExposure;
  return cfg;
}

export interface DioramaPostStack {
  composer: EffectComposer;
  dof: DepthOfFieldEffect;
  setSize: (width: number, height: number) => void;
  render: (delta: number) => void;
  /** Keep the look-at point sharp as the camera dollies. */
  setFocus: (worldPoint: THREE.Vector3, focusDistance: number) => void;
  dispose: () => void;
}

export function createDioramaPostStack(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  config: Partial<PostProcessConfig> = {},
): DioramaPostStack {
  const cfg = { ...DEFAULT_POST_CONFIG, ...config };

  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: 0,
  });

  const dof = new DepthOfFieldEffect(camera, {
    focusDistance: 38,
    focusRange: cfg.focusRange,
    bokehScale: cfg.bokehScale,
    resolutionScale: 0.65,
  });
  dof.target = new THREE.Vector3();

  const bloom = new BloomEffect({
    intensity: cfg.bloomStrength,
    luminanceThreshold: cfg.bloomThreshold,
    luminanceSmoothing: 0.35,
    mipmapBlur: true,
  });

  const vignette = new VignetteEffect({
    eskil: false,
    offset: 0.28,
    darkness: cfg.vignetteIntensity,
  });

  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new EffectPass(camera, dof, bloom, vignette),
  );

  return {
    composer,
    dof,
    setSize(width, height) {
      composer.setSize(width, height);
    },
    render(delta) {
      composer.render(delta);
    },
    setFocus(worldPoint, focusDistance) {
      dof.target?.copy(worldPoint);
      // Normalized focus helpers vary by version — world target is the reliable path
      void focusDistance;
    },
    dispose() {
      composer.dispose();
    },
  };
}

/** @deprecated Prefer createDioramaPostStack — kept for simple overlays. */
export function createVignetteOverlay(intensity: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: { uIntensity: { value: intensity } },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uIntensity;
      void main() {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float vignette = smoothstep(0.4, 0.75, dist) * uIntensity;
        gl_FragColor = vec4(0.0, 0.0, 0.0, vignette);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9999;
  return mesh;
}
