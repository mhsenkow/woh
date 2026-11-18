import * as THREE from 'three';

/**
 * Loads a JPG/PNG and removes the outer studio background via flood-fill
 * from the corners, preserving painted white die-cut borders.
 */
export async function loadChromaKeyTexture(url: string): Promise<THREE.CanvasTexture> {
  const img = await loadImage(url);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const w = canvas.width;
  const h = canvas.height;

  const corners = [
    pixelAt(d, w, 2, 2),
    pixelAt(d, w, w - 3, 2),
    pixelAt(d, w, 2, h - 3),
    pixelAt(d, w, w - 3, h - 3),
  ];
  const bg = averageColor(corners);
  const threshold = 42;

  // Magenta key also supported
  const magenta: [number, number, number] = [255, 0, 255];

  const visited = new Uint8Array(w * h);
  const stack: number[] = [];

  const seeds = [
    0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1),
    Math.floor(w / 2), (h - 1) * w + Math.floor(w / 2),
    Math.floor(h / 2) * w, Math.floor(h / 2) * w + (w - 1),
  ];

  for (const s of seeds) stack.push(s);

  while (stack.length) {
    const idx = stack.pop()!;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * 4;
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    const isBg =
      colorDist(r, g, b, bg[0], bg[1], bg[2]) < threshold ||
      colorDist(r, g, b, magenta[0], magenta[1], magenta[2]) < 80 ||
      (r > 200 && b > 200 && g < 140);

    if (!isBg) continue;

    d[i + 3] = 0;

    const x = idx % w;
    const y = Math.floor(idx / w);
    if (x > 0) stack.push(idx - 1);
    if (x < w - 1) stack.push(idx + 1);
    if (y > 0) stack.push(idx - w);
    if (y < h - 1) stack.push(idx + w);
  }

  ctx.putImageData(imageData, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  tex.anisotropy = 8;
  return tex;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function pixelAt(data: Uint8ClampedArray, w: number, x: number, y: number): [number, number, number] {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2]];
}

function averageColor(colors: [number, number, number][]): [number, number, number] {
  const sum = [0, 0, 0];
  for (const c of colors) {
    sum[0] += c[0];
    sum[1] += c[1];
    sum[2] += c[2];
  }
  return [
    Math.round(sum[0] / colors.length),
    Math.round(sum[1] / colors.length),
    Math.round(sum[2] / colors.length),
  ];
}

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
