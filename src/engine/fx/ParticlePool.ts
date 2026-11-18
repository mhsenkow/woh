import * as THREE from 'three';

export interface ParticleConfig {
  maxParticles: number;
  size: number;
  color: THREE.ColorRepresentation;
  lifetime: number;
  gravity: number;
  spread: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  active: boolean;
}

export class ParticlePool {
  readonly mesh: THREE.Points;
  private particles: Particle[];
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private config: ParticleConfig;

  constructor(config: ParticleConfig) {
    this.config = config;
    this.particles = [];
    this.positions = new Float32Array(config.maxParticles * 3);
    this.colors = new Float32Array(config.maxParticles * 3);
    this.sizes = new Float32Array(config.maxParticles);

    for (let i = 0; i < config.maxParticles; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: config.lifetime,
        active: false,
      });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(this.sizes, 1));

    const mat = new THREE.PointsMaterial({
      size: config.size,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.mesh = new THREE.Points(geo, mat);
  }

  emit(origin: THREE.Vector3, count: number): void {
    let emitted = 0;
    for (const p of this.particles) {
      if (emitted >= count) break;
      if (p.active) continue;

      p.active = true;
      p.life = 0;
      p.maxLife = this.config.lifetime * (0.5 + Math.random() * 0.5);
      p.position.copy(origin);
      p.velocity.set(
        (Math.random() - 0.5) * this.config.spread,
        Math.random() * this.config.spread * 0.5 + 0.5,
        (Math.random() - 0.5) * this.config.spread,
      );
      emitted++;
    }
  }

  update(dt: number): void {
    const baseColor = new THREE.Color(this.config.color);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) {
        this.sizes[i] = 0;
        continue;
      }

      p.life += dt;
      if (p.life >= p.maxLife) {
        p.active = false;
        this.sizes[i] = 0;
        continue;
      }

      p.velocity.y -= this.config.gravity * dt;
      p.position.addScaledVector(p.velocity, dt);

      const t = p.life / p.maxLife;
      const idx = i * 3;
      this.positions[idx] = p.position.x;
      this.positions[idx + 1] = p.position.y;
      this.positions[idx + 2] = p.position.z;

      this.colors[idx] = baseColor.r * (1 - t * 0.5);
      this.colors[idx + 1] = baseColor.g * (1 - t * 0.7);
      this.colors[idx + 2] = baseColor.b * (1 - t * 0.3);

      this.sizes[i] = this.config.size * (1 - t * 0.8);
    }

    const geo = this.mesh.geometry;
    (geo.attributes.position as THREE.Float32BufferAttribute).needsUpdate = true;
    (geo.attributes.color as THREE.Float32BufferAttribute).needsUpdate = true;
    (geo.attributes.size as THREE.Float32BufferAttribute).needsUpdate = true;
  }
}

export function createExplosionEmitter(): ParticlePool {
  return new ParticlePool({
    maxParticles: 200,
    size: 0.15,
    color: 0xff6622,
    lifetime: 1.2,
    gravity: 3.0,
    spread: 2.0,
  });
}

export function createStarBitsEmitter(): ParticlePool {
  return new ParticlePool({
    maxParticles: 100,
    size: 0.08,
    color: 0xffee44,
    lifetime: 2.0,
    gravity: 0.5,
    spread: 1.0,
  });
}
