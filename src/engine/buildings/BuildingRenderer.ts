import * as THREE from 'three';
import { getBuilding } from '../../game/buildings/BuildingDefinitions';
import { createBuildingArtTexture } from './BuildingArtFactory';
import { FACTIONS } from '../../game/factions/FactionRegistry';

/**
 * Buildings as Paper Mario cutout standees — intricate illustration, flat cardboard,
 * same language as units. Landscape stays low-poly; buildings carry the detail.
 */
export class BuildingRenderer {
  readonly group = new THREE.Group();
  private meshes = new Map<number, THREE.Group>();
  private artCache = new Map<string, THREE.Texture>();
  private readonly facingYaw = Math.PI / 4;

  /** Y-billboard building cutouts to camera yaw (upright, Populous-style). */
  faceCamera(yaw: number): void {
    for (const root of this.meshes.values()) {
      const facePivot = root.userData.facePivot as THREE.Group | undefined;
      if (facePivot) facePivot.rotation.y = yaw;
    }
  }

  createBuilding(eid: number, buildingTypeId: number, factionId: number): THREE.Group {
    const def = getBuilding(buildingTypeId);
    const faction = FACTIONS.find((f) => f.id === factionId);
    const primary = faction?.primaryColor ?? 0xffffff;

    const root = new THREE.Group();
    root.userData.buildingTypeId = buildingTypeId;

    const size = def?.size ?? 2;
    const width = size * 1.35;
    const height = size * 1.7;

    const cacheKey = `${buildingTypeId}-${factionId}`;
    let map = this.artCache.get(cacheKey);
    if (!map) {
      map = createBuildingArtTexture(
        def?.visual ?? 'barracks',
        factionId,
        def?.name ?? 'Structure',
        768,
        buildingTypeId,
      );
      this.artCache.set(cacheKey, map);
    }

    const facePivot = new THREE.Group();
    facePivot.rotation.y = this.facingYaw;
    root.userData.facePivot = facePivot;
    root.add(facePivot);

    map.magFilter = THREE.NearestFilter;
    map.minFilter = THREE.NearestFilter;
    map.generateMipmaps = false;

    const mat = new THREE.MeshBasicMaterial({
      map,
      color: 0xffffff,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
    });

    const front = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat);
    front.position.set(0, height / 2 + 0.06, 0.05);
    front.castShadow = true;
    facePivot.add(front);

    // Cardboard back
    const backMat = new THREE.MeshBasicMaterial({
      map,
      color: 0xf3e6cf,
      transparent: true,
      alphaTest: 0.5,
      side: THREE.BackSide,
    });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(width, height), backMat);
    back.position.set(0, height / 2 + 0.06, -0.05);
    facePivot.add(back);

    // Plinth
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(size * 0.45, size * 0.52, 0.1, 20),
      new THREE.MeshLambertMaterial({ color: 0xc49a62 }),
    );
    base.position.y = 0.05;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Faction ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(size * 0.55, size * 0.68, 40),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    root.add(ring);

    this.meshes.set(eid, root);
    this.group.add(root);
    return root;
  }

  getBuilding(eid: number): THREE.Group | undefined {
    return this.meshes.get(eid);
  }

  removeBuilding(eid: number): void {
    const m = this.meshes.get(eid);
    if (m) {
      this.group.remove(m);
      this.meshes.delete(eid);
    }
  }
}
