import * as THREE from 'three';

/**
 * Isometric pixel landscape.
 *
 * Palette and stipple come from the hugelkultur Ink Studio scene
 * (sand #e6bc82, lush #4fd18b, charcoal plinth #252629, paper #f0eee9)
 * laid out like an ALTTP / Super Mario overworld: dithered grass,
 * sand clearings, tilled dirt, and dark cliff courses.
 * Lighting is snapped to a few bands so the pixels stay the authored colors.
 */

const INK_FNS = /* glsl */ `
vec3 inkSrgb(vec3 c) {
  return pow(c, vec3(2.2));
}

float inkHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float inkBayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  float x = q.x;
  float y = q.y;
  float v = 0.0;
  if (y < 1.0) {
    v = x < 1.0 ? 0.0 : x < 2.0 ? 8.0 : x < 3.0 ? 2.0 : 10.0;
  } else if (y < 2.0) {
    v = x < 1.0 ? 12.0 : x < 2.0 ? 4.0 : x < 3.0 ? 14.0 : 6.0;
  } else if (y < 3.0) {
    v = x < 1.0 ? 3.0 : x < 2.0 ? 11.0 : x < 3.0 ? 1.0 : 9.0;
  } else {
    v = x < 1.0 ? 15.0 : x < 2.0 ? 7.0 : x < 3.0 ? 13.0 : 5.0;
  }
  return v / 16.0;
}

vec3 inkPick(float t, vec3 a, vec3 b, vec3 c) {
  return t < 0.42 ? a : t < 0.78 ? b : c;
}

vec3 inkMistColor() {
  return inkSrgb(vec3(0.941, 0.933, 0.914));
}

/** Paper mist past the shore, so the far sea dissolves instead of filling the view. */
float inkMist(vec2 xz) {
  return smoothstep(46.0, 92.0, length(xz));
}

vec3 inkSurface(vec3 world, vec3 n, float kind) {
  float px = 0.08;
  vec2 g = floor(world.xz / px);
  float by = floor(world.y / px);
  float b = inkBayer(g);
  float h = inkHash(g + vec2(by * 0.17, 4.2));
  bool top = n.y > 0.65;
  bool bottom = n.y < -0.65;
  int k = int(kind + 0.5);

  vec3 charcoal = inkSrgb(vec3(0.145, 0.149, 0.161));
  vec3 soil = inkSrgb(vec3(0.353, 0.243, 0.180));
  vec3 loam = inkSrgb(vec3(0.553, 0.357, 0.298));
  vec3 sand = inkSrgb(vec3(0.902, 0.737, 0.510));
  vec3 cream = inkSrgb(vec3(0.953, 0.843, 0.651));
  vec3 paper = inkSrgb(vec3(0.969, 0.937, 0.886));
  vec3 deep = inkSrgb(vec3(0.110, 0.420, 0.251));
  vec3 moss = inkSrgb(vec3(0.184, 0.561, 0.333));
  vec3 lush = inkSrgb(vec3(0.310, 0.820, 0.545));
  vec3 leaf = inkSrgb(vec3(0.714, 0.890, 0.541));

  if (bottom) return h > 0.8 ? inkSrgb(vec3(0.176, 0.180, 0.196)) : charcoal;

  if (!top) {
    vec3 band = h > 0.45 ? loam : soil;
    if (k == 1) band = h > 0.5 ? deep : moss;
    else if (k == 6) band = h > 0.5 ? inkSrgb(vec3(0.769, 0.604, 0.384)) : soil;
    else if (k == 2 || k == 8) band = h > 0.55
      ? inkSrgb(vec3(0.455, 0.435, 0.410))
      : inkSrgb(vec3(0.345, 0.325, 0.305));
    else if (k == 9) band = h > 0.5 ? inkSrgb(vec3(0.545, 0.145, 0.110)) : inkSrgb(vec3(0.357, 0.090, 0.070));
    else if (k == 11) band = h > 0.6 ? inkSrgb(vec3(0.420, 0.040, 0.080)) : charcoal;
    else if (k == 12) band = h > 0.55 ? inkSrgb(vec3(0.220, 0.080, 0.320)) : inkSrgb(vec3(0.090, 0.040, 0.140));
    else if (k == 7) band = inkSrgb(vec3(0.620, 0.680, 0.760));
    else if (k == 10) band = inkSrgb(vec3(0.620, 0.480, 0.720));
    return band;
  }

  if (k == 1) {
    float n = inkHash(g);
    vec3 col = n < 0.28 ? deep : n < 0.62 ? moss : n < 0.9 ? lush : leaf;
    float tuft = inkHash(floor(g / 2.0) + 3.7);
    if (tuft > 0.78) col = deep;
    float flower = inkHash(floor(g / 8.0) + 9.0);
    if (flower > 0.992 && h > 0.6) col = inkSrgb(vec3(0.941, 0.470, 0.627));
    else if (flower > 0.984 && h > 0.75) col = inkSrgb(vec3(0.910, 0.780, 0.290));
    return col;
  }
  if (k == 6) {
    vec3 col = inkPick(b, inkSrgb(vec3(0.769, 0.604, 0.384)), sand, cream);
    if (h > 0.90) col = paper;
    if (h > 0.975) col = moss;
    return col;
  }
  if (k == 3 || k == 5) {
    float n = inkHash(g + 8.0);
    vec3 col = n < 0.35 ? soil : n < 0.75 ? loam : inkSrgb(vec3(0.620, 0.420, 0.260));
    if (k == 5 && inkHash(g.yx) > 0.72) col = inkSrgb(vec3(0.470, 0.300, 0.160));
    return col;
  }
  if (k == 2 || k == 8) {
    float n = inkHash(g + 2.0);
    vec3 block = k == 8
      ? inkSrgb(vec3(0.780, 0.745, 0.680))
      : inkSrgb(vec3(0.620, 0.590, 0.540));
    vec3 joint = k == 8
      ? inkSrgb(vec3(0.560, 0.520, 0.460))
      : inkSrgb(vec3(0.430, 0.400, 0.360));
    return n < 0.22 ? joint : n > 0.86 ? mix(block, paper, 0.2) : block;
  }
  if (k == 7) {
    return h > 0.7 ? paper : inkSrgb(vec3(0.820, 0.880, 0.940));
  }
  if (k == 9) {
    vec2 local = mod(g, vec2(5.0, 4.0));
    bool mortar = local.x < 0.5 || local.y < 0.5;
    vec3 brick = b > 0.55
      ? inkSrgb(vec3(0.816, 0.157, 0.157))
      : inkSrgb(vec3(0.620, 0.120, 0.100));
    return mortar ? inkSrgb(vec3(0.240, 0.140, 0.110)) : brick;
  }
  if (k == 10) {
    return inkPick(b,
      inkSrgb(vec3(0.620, 0.450, 0.780)),
      inkSrgb(vec3(0.780, 0.620, 0.900)),
      inkSrgb(vec3(0.920, 0.840, 0.980)));
  }
  if (k == 11) {
    vec3 col = b > 0.5
      ? inkSrgb(vec3(0.690, 0.063, 0.149))
      : inkSrgb(vec3(0.420, 0.030, 0.070));
    if (h > 0.93) col = inkSrgb(vec3(0.950, 0.250, 0.280));
    return col;
  }
  if (k == 12) {
    return b > 0.6
      ? inkSrgb(vec3(0.314, 0.063, 0.455))
      : inkSrgb(vec3(0.090, 0.020, 0.160));
  }
  if (k == 4) return inkSrgb(vec3(0.100, 0.450, 0.760));
  return inkPick(b, soil, sand, cream);
}
`;

const INK_WATER = /* glsl */ `
vec3 inkWater(vec3 world, float shore) {
  vec2 uv = (world.xz - uWaveOrigin) / max(uWaveSpan, 0.001);
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  vec4 wtex = texture2D(uWave, clamp(uv, vec2(0.0), vec2(1.0))) * inside;
  vec3 sea = inkSrgb(vec3(0.200, 0.430, 0.620));
  vec3 crest = inkSrgb(vec3(0.560, 0.740, 0.820));
  vec3 foam = inkSrgb(vec3(0.780, 0.860, 0.900));
  vec3 col = sea;
  col = mix(col, crest, clamp((wtex.r - 0.12) * 2.5, 0.0, 0.12));
  float texel = 1.0 / 80.0;
  float inGrid = step(texel, uv.x) * step(uv.x, 1.0 - texel) * step(texel, uv.y) * step(uv.y, 1.0 - texel);
  float wetN = min(min(texture2D(uWave, uv + vec2(texel, 0.0)).a, texture2D(uWave, uv - vec2(texel, 0.0)).a),
                   min(texture2D(uWave, uv + vec2(0.0, texel)).a, texture2D(uWave, uv - vec2(0.0, texel)).a));
  if (inGrid > 0.5 && wtex.a > 0.5 && wetN < 0.5) col = mix(col, foam, 0.16);
  if (shore > 0.5) col = mix(col, foam, 0.1);
  return col;
}
`;

const SHADE_CHUNK = /* glsl */ `
float inkL = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
float inkB = max(dot(inkAlbedo, vec3(0.299, 0.587, 0.114)), 0.045);
float inkS = clamp(inkL / inkB, 0.0, 1.35);
inkS = inkS < 0.46 ? 0.42 : inkS < 0.70 ? 0.64 : inkS < 0.92 ? 0.82 : 1.0;
vec3 inkLit = inkAlbedo * inkS;
inkLit = mix(inkLit, inkMistColor(), inkMist(vInkWorld.xz));
gl_FragColor = vec4(inkLit, diffuseColor.a);
`;

export interface InkWaterUniforms {
  uTime: { value: number };
  uWave: { value: THREE.Texture | null };
  uWaveOrigin: { value: THREE.Vector2 };
  uWaveSpan: { value: number };
}

function bindSurface(
  material: THREE.MeshLambertMaterial,
  cacheKey: string,
  kindVarying: string,
  water: InkWaterUniforms | null,
): void {
  material.customProgramCacheKey = () => cacheKey;
  material.onBeforeCompile = (shader) => {
    const uTime = water?.uTime ?? { value: 0 };
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         ${kindVarying.includes('attribute') ? 'attribute float aVoxel;' : 'attribute float aShore; uniform sampler2D uWave; uniform vec2 uWaveOrigin; uniform float uWaveSpan;'}
         varying vec3 vInkWorld;
         varying vec3 vInkN;
         varying float vShore;
         ${kindVarying.includes('attribute') ? 'varying float vInkVoxel;' : ''}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
         vInkWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vInkN = normalize(mat3(modelMatrix) * objectNormal);
         ${kindVarying.includes('attribute')
           ? 'vInkVoxel = aVoxel; vShore = uTime * 0.0;'
           : `vShore = aShore;
              vec2 inkUv = (vInkWorld.xz - uWaveOrigin) / uWaveSpan;
              float inSim = step(0.0, inkUv.x) * step(inkUv.x, 1.0) * step(0.0, inkUv.y) * step(inkUv.y, 1.0);
              float phys = clamp(texture2D(uWave, clamp(inkUv, vec2(0.0), vec2(1.0))).r, -0.05, 0.05) * inSim;
              transformed.y += phys * 0.12;
              vInkWorld.y += phys * 0.12;`}
         `,
      );

    const kindExpr = kindVarying.includes('attribute') ? 'vInkVoxel' : 'uInkKind';
    const colorExpr = water
      ? 'inkWater(vInkWorld, vShore)'
      : `inkSurface(vInkWorld, normalize(vInkN), ${kindExpr})`;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uTime;
         ${water ? 'uniform sampler2D uWave; uniform vec2 uWaveOrigin; uniform float uWaveSpan;' : ''}
         varying vec3 vInkWorld;
         varying vec3 vInkN;
         varying float vShore;
         ${kindVarying.includes('attribute') ? 'varying float vInkVoxel;' : 'uniform float uInkKind;'}
         vec3 inkAlbedo;
         ${INK_FNS}
         ${water ? INK_WATER : ''}`,
      )
      .replace(
        '#include <color_fragment>',
        `inkAlbedo = ${colorExpr};
         diffuseColor.rgb = inkAlbedo;`,
      )
      .replace(
        '#include <opaque_fragment>',
        water
          ? `float inkL = dot(outgoingLight, vec3(0.299, 0.587, 0.114));
             float inkB = max(dot(inkAlbedo, vec3(0.299, 0.587, 0.114)), 0.045);
             float inkS = clamp(inkL / inkB, 0.86, 1.04);
             vec3 inkLit = inkAlbedo * inkS;
             inkLit = mix(inkLit, inkMistColor(), inkMist(vInkWorld.xz));
             gl_FragColor = vec4(inkLit, diffuseColor.a);`
          : SHADE_CHUNK,
      );

    if (water) {
      shader.uniforms.uWave = water.uWave;
      shader.uniforms.uWaveOrigin = water.uWaveOrigin;
      shader.uniforms.uWaveSpan = water.uWaveSpan;
      shader.uniforms.uInkKind = { value: 4 };
    }
  };
}

const WAVE_PLACEHOLDER = new THREE.DataTexture(
  new Float32Array([0, 0, 0, 0]),
  1,
  1,
  THREE.RGBAFormat,
  THREE.FloatType,
);
WAVE_PLACEHOLDER.needsUpdate = true;
WAVE_PLACEHOLDER.magFilter = THREE.NearestFilter;
WAVE_PLACEHOLDER.minFilter = THREE.NearestFilter;
WAVE_PLACEHOLDER.wrapS = THREE.ClampToEdgeWrapping;
WAVE_PLACEHOLDER.wrapT = THREE.ClampToEdgeWrapping;
WAVE_PLACEHOLDER.flipY = false;
WAVE_PLACEHOLDER.colorSpace = THREE.NoColorSpace;

/** Stippled grass, sand, dirt, stone, and the other realm surfaces. */
export function createInkTerrainMaterial(): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });
  bindSurface(material, 'ink-terrain-v9', 'attribute', null);
  return material;
}

/** Moving shallow water: flowing pixels, shore foam, and a wave-height texture. */
export function createInkWaterMaterial(): THREE.MeshLambertMaterial {
  const water: InkWaterUniforms = {
    uTime: { value: 0 },
    uWave: { value: WAVE_PLACEHOLDER },
    uWaveOrigin: { value: new THREE.Vector2(-36, -36) },
    uWaveSpan: { value: 72 },
  };
  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
  });
  material.userData.waterUniforms = water;
  bindSurface(material, 'ink-water-v16', 'uniform', water);
  return material;
}
