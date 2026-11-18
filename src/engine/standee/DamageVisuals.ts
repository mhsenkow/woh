import * as THREE from 'three';

export const enum DamageType {
  None = 0,
  Scorched = 1,
  Bent = 2,
  Punched = 3,
}

export interface DamageState {
  healthPercent: number;
  damageType: DamageType;
  intensity: number;
}

export function applyDamageToStandee(
  group: THREE.Group,
  state: DamageState,
): void {
  const frontMesh = group.children.find(
    (c) => c instanceof THREE.Mesh && c.geometry instanceof THREE.PlaneGeometry,
  ) as THREE.Mesh | undefined;

  if (!frontMesh) return;

  const mat = frontMesh.material as THREE.MeshStandardMaterial;
  if (!mat.color) return;

  switch (state.damageType) {
    case DamageType.Scorched:
      mat.color.lerp(new THREE.Color(0x221100), state.intensity * 0.4);
      mat.roughness = Math.min(1.0, 0.75 + state.intensity * 0.25);
      break;
    case DamageType.Bent:
      frontMesh.rotation.z = Math.sin(Date.now() * 0.001) * state.intensity * 0.05;
      frontMesh.rotation.x = state.intensity * 0.08;
      break;
    case DamageType.Punched:
      frontMesh.scale.set(
        1.0 - state.intensity * 0.05,
        1.0 - state.intensity * 0.03,
        1.0,
      );
      break;
    default:
      break;
  }
}

export function getDamageStateFromHealth(health: number): DamageState {
  if (health > 0.75) return { healthPercent: health, damageType: DamageType.None, intensity: 0 };
  if (health > 0.5)
    return { healthPercent: health, damageType: DamageType.Scorched, intensity: (0.75 - health) * 4 };
  if (health > 0.25)
    return { healthPercent: health, damageType: DamageType.Bent, intensity: (0.5 - health) * 4 };
  return { healthPercent: health, damageType: DamageType.Punched, intensity: (0.25 - health) * 4 };
}
