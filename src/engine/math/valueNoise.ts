/** Deterministic value noise in [0, 1]. Smooth enough for coasts and groves. */
export function valueNoise(x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);
  const a = hash2(x0, z0) * (1 - sx) + hash2(x0 + 1, z0) * sx;
  const b = hash2(x0, z0 + 1) * (1 - sx) + hash2(x0 + 1, z0 + 1) * sx;
  return a * (1 - sz) + b * sz;
}

function hash2(ix: number, iz: number): number {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
