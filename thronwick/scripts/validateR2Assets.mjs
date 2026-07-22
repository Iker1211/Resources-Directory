#!/usr/bin/env node

import { R2_ASSET_MANIFEST, R2_ASSET_MANIFEST_VERSION } from '../src/data/r2AssetManifest.js';

const DEFAULT_R2_BASE_URL = 'https://pub-37dce3d7ecf94df9acc08cadeb70022c.r2.dev/';
const baseUrl = normalizeBaseUrl(process.env.VITE_ASSET_BASE_URL || DEFAULT_R2_BASE_URL);
const corsOrigin = process.env.ASSET_CORS_ORIGIN?.trim() || null;
const concurrency = Number.parseInt(process.env.ASSET_VALIDATION_CONCURRENCY || '12', 10);

if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
  throw new Error('ASSET_VALIDATION_CONCURRENCY must be an integer between 1 and 32.');
}

function normalizeBaseUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('VITE_ASSET_BASE_URL must use HTTPS.');
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  url.search = '';
  url.hash = '';
  return url;
}

function resolveObjectUrl(objectKey) {
  const encodedKey = objectKey
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return new URL(encodedKey, baseUrl).href;
}

function parseGlbHeader(bytes) {
  if (bytes.byteLength < 12) return { valid: false, reason: `received ${bytes.byteLength} bytes` };
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = String.fromCharCode(...bytes.slice(0, 4));
  const version = view.getUint32(4, true);
  const declaredLength = view.getUint32(8, true);
  return {
    valid: magic === 'glTF' && version === 2,
    magic,
    version,
    declaredLength,
  };
}

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function validateAsset([assetId, objectKey]) {
  const url = resolveObjectUrl(objectKey);
  const headers = { Range: 'bytes=0-11' };
  if (corsOrigin) headers.Origin = corsOrigin;

  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers, redirect: 'follow' });

      if ((response.status === 429 || response.status >= 500) && attempt < maxAttempts) {
        await response.arrayBuffer();
        await sleep(250 * (2 ** (attempt - 1)));
        continue;
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const glb = parseGlbHeader(bytes);
      const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
      const contentRange = response.headers.get('content-range');
      const objectLength = contentRange ? Number.parseInt(contentRange.split('/').at(-1), 10) : null;
      const allowOrigin = response.headers.get('access-control-allow-origin');

      const failures = [];
      if (![200, 206].includes(response.status)) failures.push(`HTTP ${response.status}`);
      if (contentType !== 'model/gltf-binary') failures.push(`Content-Type ${contentType || '<missing>'}`);
      if (!glb.valid) failures.push(`invalid GLB header (${glb.magic || glb.reason}, version ${glb.version ?? '?'})`);
      if (objectLength && glb.declaredLength !== objectLength) {
        failures.push(`declared length ${glb.declaredLength} does not match object length ${objectLength}`);
      }
      if (corsOrigin && allowOrigin !== '*' && allowOrigin !== corsOrigin) {
        failures.push(`CORS does not allow ${corsOrigin}`);
      }

      return {
        assetId,
        objectKey,
        url,
        attempts: attempt,
        status: response.status,
        contentType,
        objectLength,
        etag: response.headers.get('etag'),
        cacheControl: response.headers.get('cache-control'),
        accessControlAllowOrigin: allowOrigin,
        valid: failures.length === 0,
        failures,
      };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(250 * (2 ** (attempt - 1)));
        continue;
      }
    }
  }

  return {
    assetId,
    objectKey,
    url,
    attempts: maxAttempts,
    valid: false,
    failures: [lastError instanceof Error ? lastError.message : String(lastError)],
  };
}

async function mapWithConcurrency(entries, limit, mapper) {
  const results = new Array(entries.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= entries.length) return;
      results[index] = await mapper(entries[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, entries.length) }, worker));
  return results;
}

const entries = Object.entries(R2_ASSET_MANIFEST);
const duplicateKeys = entries
  .map(([, objectKey]) => objectKey)
  .filter((objectKey, index, keys) => keys.indexOf(objectKey) !== index);

if (duplicateKeys.length > 0) {
  console.error('Duplicate R2 object keys:', [...new Set(duplicateKeys)]);
  process.exit(1);
}

console.log(`Validating ${entries.length} GLB objects from manifest ${R2_ASSET_MANIFEST_VERSION}`);
console.log(`Base URL: ${baseUrl.href}`);
console.log(`CORS origin: ${corsOrigin || 'not checked (set ASSET_CORS_ORIGIN to require it)'}`);

const results = await mapWithConcurrency(entries, concurrency, validateAsset);
const failures = results.filter(result => !result.valid);
const totalBytes = results.reduce((sum, result) => sum + (result.objectLength || 0), 0);
const missingCacheControl = results.filter(result => !result.cacheControl).length;

console.log(`Valid: ${results.length - failures.length}/${results.length}`);
console.log(`Payload: ${(totalBytes / 1024 / 1024).toFixed(2)} MiB`);
console.log(`Objects without explicit Cache-Control: ${missingCacheControl}`);

if (failures.length > 0) {
  console.error(`\n${failures.length} asset validation failure(s):`);
  failures.slice(0, 25).forEach(result => {
    console.error(`- ${result.assetId}: ${result.failures.join('; ')} (${result.url})`);
  });
  if (failures.length > 25) console.error(`...and ${failures.length - 25} more.`);
  process.exit(1);
}
