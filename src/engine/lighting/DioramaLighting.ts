import * as THREE from 'three';

export interface DioramaLightConfig {
  keyColor: THREE.ColorRepresentation;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fillColor: THREE.ColorRepresentation;
  fillIntensity: number;
  rimColor: THREE.ColorRepresentation;
  rimIntensity: number;
  ambientColor: THREE.ColorRepresentation;
  ambientIntensity: number;
  shadowMapSize: number;
  shadowBias: number;
}

/** Paper-field daylight. Soft enough that stipple colors stay put, with a key from the iso upper-left. */
export const DEFAULT_LIGHT_CONFIG: DioramaLightConfig = {
  keyColor: 0xfff3e0,
  keyIntensity: 1.25,
  keyPosition: [18, 28, 14],
  fillColor: 0xf0eee9,
  fillIntensity: 0.42,
  rimColor: 0xfff6e8,
  rimIntensity: 0.22,
  ambientColor: 0xfff8ee,
  ambientIntensity: 0.48,
  shadowMapSize: 2048,
  shadowBias: -0.0003,
};

export class DioramaLighting {
  readonly keyLight: THREE.DirectionalLight;
  readonly fillLight: THREE.HemisphereLight;
  readonly rimLight: THREE.DirectionalLight;
  readonly ambientLight: THREE.AmbientLight;
  readonly group = new THREE.Group();

  constructor(config: Partial<DioramaLightConfig> = {}) {
    const cfg = { ...DEFAULT_LIGHT_CONFIG, ...config };

    this.keyLight = new THREE.DirectionalLight(cfg.keyColor, cfg.keyIntensity);
    this.keyLight.position.set(...cfg.keyPosition);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.setScalar(cfg.shadowMapSize);
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 100;
    this.keyLight.shadow.camera.left = -30;
    this.keyLight.shadow.camera.right = 30;
    this.keyLight.shadow.camera.top = 30;
    this.keyLight.shadow.camera.bottom = -30;
    this.keyLight.shadow.bias = cfg.shadowBias;
    this.keyLight.shadow.normalBias = 0.02;
    this.group.add(this.keyLight);
    this.group.add(this.keyLight.target);

    this.fillLight = new THREE.HemisphereLight(cfg.fillColor, 0xc4a882, cfg.fillIntensity);
    this.group.add(this.fillLight);

    this.rimLight = new THREE.DirectionalLight(cfg.rimColor, cfg.rimIntensity);
    this.rimLight.position.set(-16, 22, -12);
    this.group.add(this.rimLight);

    this.ambientLight = new THREE.AmbientLight(cfg.ambientColor, cfg.ambientIntensity);
    this.group.add(this.ambientLight);
  }
}
