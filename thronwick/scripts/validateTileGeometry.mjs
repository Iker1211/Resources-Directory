#!/usr/bin/env node

// GLTFLoader references browser globals while parsing embedded image textures.
// Tile geometry validation does not render textures, so lightweight stand-ins
// keep this test browser-independent while exercising the real loader/decoder.
globalThis.self = globalThis;
globalThis.ProgressEvent = class ProgressEvent {
  constructor(type, init = {}) {
    this.type = type;
    Object.assign(this, init);
  }
};
globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} });

const [
  { GLTFLoader },
  { MeshoptDecoder },
  { Vector3 },
  { R2_ASSET_MANIFEST },
  { extractMeshData },
] = await Promise.all([
  import('three/addons/loaders/GLTFLoader.js'),
  import('three/addons/libs/meshopt_decoder.module.js'),
  import('three'),
  import('../src/data/r2AssetManifest.js'),
  import('../src/utils/sceneGeometry.js'),
]);

const DEFAULT_ASSET_BASE_URL = 'https://pub-37dce3d7ecf94df9acc08cadeb70022c.r2.dev/';
const baseUrl = normalizeBaseUrl(process.env.VITE_ASSET_BASE_URL || DEFAULT_ASSET_BASE_URL);
const TOLERANCE = 0.02;

const TILE_CASES = [
  {
    id: 'grass',
    assetId: 'hex_grass',
    expectedSize: [2, 1, 2.3094],
    expectedMin: [-1, -1, -1.1547],
    expectedMax: [1, 0, 1.1547],
  },
  {
    id: 'water',
    assetId: 'hex_water',
    expectedSize: [2, 0.8, 2.3094],
    expectedMin: [-1, -1, -1.1547],
    expectedMax: [1, -0.2, 1.1547],
  },
  {
    id: 'road',
    assetId: 'hex_road_A',
    expectedSize: [2, 1, 2.3094],
    expectedMin: [-1, -1, -1.1547],
    expectedMax: [1, 0, 1.1547],
  },
];

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('VITE_ASSET_BASE_URL must use HTTPS.');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  url.search = '';
  url.hash = '';
  return url;
}

function objectUrl(objectKey) {
  const encoded = objectKey.split('/').map(encodeURIComponent).join('/');
  return new URL(encoded, baseUrl).href;
}

function closeTo(actual, expected, tolerance = TOLERANCE) {
  return Math.abs(actual - expected) <= tolerance;
}

function assertVector(actual, expected, label) {
  actual.forEach((value, index) => {
    if (!Number.isFinite(value)) throw new Error(`${label}[${index}] is not finite: ${value}`);
    if (!closeTo(value, expected[index])) {
      throw new Error(`${label}[${index}] expected ${expected[index]} ± ${TOLERANCE}, got ${value}`);
    }
  });
}

async function fetchGlb(url) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { Accept: 'model/gltf-binary' } });
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        await response.arrayBuffer();
        await new Promise(resolve => setTimeout(resolve, 250 * (2 ** (attempt - 1))));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
      if (contentType !== 'model/gltf-binary') throw new Error(`Unexpected Content-Type ${contentType || '<missing>'}`);
      return response.arrayBuffer();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 250 * (2 ** (attempt - 1))));
        continue;
      }
    }
  }
  throw lastError;
}

const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
await MeshoptDecoder.ready;

const results = [];
for (const testCase of TILE_CASES) {
  const objectKey = R2_ASSET_MANIFEST[testCase.assetId];
  if (!objectKey) throw new Error(`Manifest is missing ${testCase.assetId}`);

  const url = objectUrl(objectKey);
  const bytes = await fetchGlb(url);
  const gltf = await loader.parseAsync(bytes, url.slice(0, url.lastIndexOf('/') + 1));
  const { geometry } = extractMeshData(gltf);
  if (!geometry) throw new Error(`${testCase.id}: no mesh geometry found`);

  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  if (!(position.array instanceof Float32Array)) throw new Error(`${testCase.id}: position is not Float32Array`);
  if (normal && !(normal.array instanceof Float32Array)) throw new Error(`${testCase.id}: normal is not Float32Array`);

  const min = geometry.boundingBox.min.toArray();
  const max = geometry.boundingBox.max.toArray();
  const size = geometry.boundingBox.getSize(new Vector3()).toArray();
  const radius = geometry.boundingSphere?.radius;

  assertVector(min, testCase.expectedMin, `${testCase.id}.min`);
  assertVector(max, testCase.expectedMax, `${testCase.id}.max`);
  assertVector(size, testCase.expectedSize, `${testCase.id}.size`);
  if (!Number.isFinite(radius) || radius < 1 || radius > 2) {
    throw new Error(`${testCase.id}: bounding sphere radius is implausible: ${radius}`);
  }

  results.push({
    id: testCase.id,
    assetId: testCase.assetId,
    objectKey,
    bytes: bytes.byteLength,
    min,
    max,
    size,
    radius,
    positionArray: position.array.constructor.name,
    normalArray: normal?.array.constructor.name || null,
  });
}

console.log(JSON.stringify({
  baseUrl: baseUrl.href,
  tolerance: TOLERANCE,
  passed: results.length,
  tiles: results,
}, null, 2));
