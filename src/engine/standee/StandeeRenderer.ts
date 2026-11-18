import * as THREE from 'three';

export interface StandeeConfig {
  width: number;
  height: number;
  rimDepth: number;
  baseRadius: number;
  baseHeight: number;
  /** Yaw to face the isometric camera (π/4 for 45° iso). */
  facingYaw: number;
}

const DEFAULT_CONFIG: StandeeConfig = {
  width: 1.2,
  height: 1.8,
  rimDepth: 0.12,
  baseRadius: 0.45,
  baseHeight: 0.08,
  facingYaw: Math.PI / 4,
};

export class StandeeRenderer {
  readonly group = new THREE.Group();
  private standees = new Map<number, THREE.Group>();

  /**
   * Y-axis billboard all cutouts to the camera yaw.
   * Keeps standees upright (no pitch lean) — Populous / board-game standee read.
   */
  faceCamera(yaw: number): void {
    for (const standee of this.standees.values()) {
      const facePivot = standee.userData.facePivot as THREE.Group | undefined;
      if (facePivot) facePivot.rotation.y = yaw;
    }
  }

  createStandee(
    id: number,
    config: Partial<StandeeConfig> = {},
    material?: THREE.Material,
    borderColor: THREE.ColorRepresentation = 0xffffff,
  ): THREE.Group {
    const cfg = { ...DEFAULT_CONFIG, ...config };
    const standeeGroup = new THREE.Group();
    standeeGroup.userData.baseRadius = cfg.baseRadius;

    // Pivot that faces the isometric camera (yaw only — stays standing upright)
    const facePivot = new THREE.Group();
    facePivot.rotation.y = cfg.facingYaw;
    standeeGroup.userData.facePivot = facePivot;
    standeeGroup.add(facePivot);

    const frontMat =
      material ??
      new THREE.MeshStandardMaterial({
        color: 0xddccaa,
        roughness: 0.75,
        metalness: 0.0,
        side: THREE.DoubleSide,
        emissive: 0x221100,
        emissiveIntensity: 0.15,
      });

    const hasArtMap =
      frontMat instanceof THREE.MeshPhysicalMaterial ||
      frontMat instanceof THREE.MeshStandardMaterial
        ? Boolean((frontMat as THREE.MeshStandardMaterial).map)
        : false;

    // Front cutout plane (painted art / AI sprite)
    const frontGeo = new THREE.PlaneGeometry(cfg.width, cfg.height);
    const frontMesh = new THREE.Mesh(frontGeo, frontMat);
    frontMesh.position.set(0, cfg.height / 2 + cfg.baseHeight, cfg.rimDepth * 0.5);
    frontMesh.castShadow = true;
    facePivot.add(frontMesh);

    if (hasArtMap) {
      // Cardboard back face — same alpha cutout, warm paper color for thickness
      const srcMap = (frontMat as THREE.MeshStandardMaterial).map;
      const backMat = new THREE.MeshStandardMaterial({
        color: 0xe8dcc8,
        map: srcMap,
        alphaTest: 0.15,
        transparent: true,
        side: THREE.BackSide,
        roughness: 0.85,
        metalness: 0.0,
      });
      const backMesh = new THREE.Mesh(frontGeo.clone(), backMat);
      backMesh.position.set(0, cfg.height / 2 + cfg.baseHeight, -cfg.rimDepth * 0.5);
      backMesh.castShadow = true;
      facePivot.add(backMesh);
    } else {
      // Placeholder mode: extruded rim + faction border frame
      const rimGeo = this.createRimGeometry(cfg);
      rimGeo.translate(0, 0, -cfg.rimDepth / 2);
      const rimMat = new THREE.MeshStandardMaterial({
        color: 0xf5f0e8,
        roughness: 0.45,
        metalness: 0.02,
      });
      const rimMesh = new THREE.Mesh(rimGeo, rimMat);
      rimMesh.position.set(0, cfg.height / 2 + cfg.baseHeight, 0);
      rimMesh.castShadow = true;
      facePivot.add(rimMesh);

      const borderGeo = this.createBorderGeometry(cfg);
      borderGeo.translate(0, 0, -cfg.rimDepth / 2 - 0.01);
      const borderMat = new THREE.MeshStandardMaterial({
        color: borderColor,
        roughness: 0.25,
        metalness: 0.15,
        emissive: borderColor,
        emissiveIntensity: 0.35,
      });
      const borderMesh = new THREE.Mesh(borderGeo, borderMat);
      borderMesh.position.set(0, cfg.height / 2 + cfg.baseHeight, 0);
      facePivot.add(borderMesh);
    }

    // Circular plinth base
    const baseGeo = new THREE.CylinderGeometry(
      cfg.baseRadius,
      cfg.baseRadius * 1.15,
      cfg.baseHeight,
      24,
    );
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.45,
      metalness: 0.35,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = cfg.baseHeight / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    standeeGroup.add(baseMesh);

    // Selection + health rings (world-aligned, not yawed)
    const selectionRing = this.createSelectionRing(cfg.baseRadius);
    selectionRing.visible = false;
    standeeGroup.add(selectionRing);
    standeeGroup.userData.selectionRing = selectionRing;

    const healthRing = this.createHealthRing(cfg.baseRadius);
    standeeGroup.add(healthRing);
    standeeGroup.userData.healthRing = healthRing;

    this.standees.set(id, standeeGroup);
    this.group.add(standeeGroup);
    return standeeGroup;
  }

  private createRimGeometry(cfg: StandeeConfig): THREE.BufferGeometry {
    const shape = new THREE.Shape();
    const hw = cfg.width / 2;
    const hh = cfg.height / 2;
    const r = 0.06;
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);

    return new THREE.ExtrudeGeometry(shape, {
      depth: cfg.rimDepth,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 3,
    });
  }

  private createBorderGeometry(cfg: StandeeConfig): THREE.BufferGeometry {
    const hw = cfg.width / 2;
    const hh = cfg.height / 2;
    const borderWidth = 0.05;

    const outerShape = new THREE.Shape();
    outerShape.moveTo(-hw - borderWidth, -hh - borderWidth);
    outerShape.lineTo(hw + borderWidth, -hh - borderWidth);
    outerShape.lineTo(hw + borderWidth, hh + borderWidth);
    outerShape.lineTo(-hw - borderWidth, hh + borderWidth);
    outerShape.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-hw, -hh);
    hole.lineTo(hw, -hh);
    hole.lineTo(hw, hh);
    hole.lineTo(-hw, hh);
    hole.closePath();
    outerShape.holes.push(hole);

    return new THREE.ExtrudeGeometry(outerShape, {
      depth: cfg.rimDepth + 0.02,
      bevelEnabled: false,
    });
  }

  createSelectionRing(radius: number): THREE.Mesh {
    const geo = new THREE.RingGeometry(radius * 1.25, radius * 1.5, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ccff,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    return ring;
  }

  createHealthRing(radius: number): THREE.Mesh {
    const geo = new THREE.RingGeometry(radius * 1.0, radius * 1.15, 48, 1, 0, Math.PI * 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ff66,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.015;
    return ring;
  }

  setHealth(id: number, health: number): void {
    const standee = this.standees.get(id);
    if (!standee) return;
    const ring = standee.userData.healthRing as THREE.Mesh;
    if (!ring) return;
    const mat = ring.material as THREE.MeshBasicMaterial;
    const t = Math.max(0, Math.min(1, health));
    mat.color.setHSL(t * 0.33, 0.9, 0.5);
    const r = (standee.userData.baseRadius as number) ?? 0.45;
    ring.geometry.dispose();
    ring.geometry = new THREE.RingGeometry(r * 1.0, r * 1.15, 48, 1, 0, Math.PI * 2 * t);
  }

  setSelected(id: number, selected: boolean): void {
    const standee = this.standees.get(id);
    if (!standee) return;
    const ring = standee.userData.selectionRing as THREE.Mesh;
    if (ring) ring.visible = selected;
  }

  getStandee(id: number): THREE.Group | undefined {
    return this.standees.get(id);
  }

  removeStandee(id: number): void {
    const standee = this.standees.get(id);
    if (standee) {
      this.group.remove(standee);
      this.standees.delete(id);
    }
  }
}
