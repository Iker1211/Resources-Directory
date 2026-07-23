#!/usr/bin/env node

import {
  BIOMES,
  CELLS,
  FIELD_PACKS,
  RIVER_PATH,
  cellKey,
  getFieldPackCentroid,
} from '../src/data/worldData.js';
import { R2_ASSET_MANIFEST } from '../src/data/r2AssetManifest.js';

const HEX_DIRS = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];
const TILE_TYPES = new Set(['grass', 'water', 'river', 'road']);
const CROP_TYPES = new Set(['grain', 'fallow', 'pasture', 'abandoned']);
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

const cellMap = new Map();
const assetReferences = new Set();
const tileCounts = {};
const biomeCounts = {};
let environmentItems = 0;
let explicitOccupants = 0;
let labels = 0;

CELLS.forEach((cell, index) => {
  const key = cellKey(cell.q, cell.r);
  check(Number.isInteger(cell.q) && Number.isInteger(cell.r), `Cell ${index} has non-integer coordinates`);
  check(!cellMap.has(key), `Duplicate cell coordinate ${key}`);
  cellMap.set(key, cell);

  check(TILE_TYPES.has(cell.tileType), `Cell ${key} has invalid tileType ${cell.tileType}`);
  check(Boolean(BIOMES[cell.biome]), `Cell ${key} has unknown biome ${cell.biome}`);
  check(Array.isArray(cell.env), `Cell ${key} env must be an array`);

  tileCounts[cell.tileType] = (tileCounts[cell.tileType] || 0) + 1;
  biomeCounts[cell.biome] = (biomeCounts[cell.biome] || 0) + 1;
  environmentItems += Array.isArray(cell.env) ? cell.env.length : 0;
  if (cell.label) labels += 1;

  for (const assetKey of cell.env || []) {
    assetReferences.add(assetKey);
    check(Boolean(R2_ASSET_MANIFEST[assetKey]), `Cell ${key} references unmapped env asset ${assetKey}`);
  }
  if (cell.occ) {
    explicitOccupants += 1;
    assetReferences.add(cell.occ);
    check(Boolean(R2_ASSET_MANIFEST[cell.occ]), `Cell ${key} references unmapped occupant ${cell.occ}`);
  }

  if (cell.tileType === 'water' || cell.tileType === 'river') {
    check((cell.env || []).length === 0, `Water cell ${key} must not contain environment assets`);
    check(!cell.occ, `Water cell ${key} must not contain an occupant`);
    check(!cell.packId, `Water cell ${key} must not belong to a field pack`);
  }
});

// Entire footprint must be connected.
if (CELLS.length > 0) {
  const visited = new Set();
  const queue = [CELLS[0]];
  while (queue.length) {
    const cell = queue.shift();
    const key = cellKey(cell.q, cell.r);
    if (visited.has(key)) continue;
    visited.add(key);
    for (const [dq, dr] of HEX_DIRS) {
      const neighbor = cellMap.get(cellKey(cell.q + dq, cell.r + dr));
      if (neighbor && !visited.has(cellKey(neighbor.q, neighbor.r))) queue.push(neighbor);
    }
  }
  check(visited.size === CELLS.length, `World footprint has ${CELLS.length - visited.size} disconnected cells`);
}

// River must be a unique, continuous water chain represented in CELLS.
const riverKeys = new Set();
RIVER_PATH.forEach((entry, index) => {
  const key = cellKey(entry.q, entry.r);
  check(!riverKeys.has(key), `River repeats coordinate ${key}`);
  riverKeys.add(key);
  check(Boolean(R2_ASSET_MANIFEST[entry.variant]), `River ${key} references unmapped variant ${entry.variant}`);
  assetReferences.add(entry.variant);
  const cell = cellMap.get(key);
  check(Boolean(cell), `River coordinate ${key} does not exist in CELLS`);
  if (cell) check(cell.tileType === 'water' || cell.tileType === 'river', `River coordinate ${key} is ${cell.tileType}`);
  if (index > 0) check(hexDistance(RIVER_PATH[index - 1], entry) === 1, `River discontinuity before ${key}`);
});

// Field packs must be contiguous, unique, and reflected in cell metadata.
const packIds = new Set();
const packedCellKeys = new Set();
FIELD_PACKS.forEach(pack => {
  check(!packIds.has(pack.packId), `Duplicate field pack id ${pack.packId}`);
  packIds.add(pack.packId);
  check(CROP_TYPES.has(pack.cropType), `Field pack ${pack.packId} has invalid crop type ${pack.cropType}`);
  check(pack.cells.length >= 3 && pack.cells.length <= 12, `Field pack ${pack.packId} has ${pack.cells.length} cells`);

  const packCellKeys = new Set(pack.cells.map(cell => cellKey(cell.q, cell.r)));
  pack.cells.forEach(coord => {
    const key = cellKey(coord.q, coord.r);
    check(!packedCellKeys.has(key), `Cell ${key} belongs to multiple field packs`);
    packedCellKeys.add(key);
    const cell = cellMap.get(key);
    check(Boolean(cell), `Field pack ${pack.packId} references missing cell ${key}`);
    if (cell) {
      check(cell.tileType === 'grass', `Field pack ${pack.packId} uses non-grass cell ${key}`);
      check(cell.packId === pack.packId, `Cell ${key} packId does not match ${pack.packId}`);
      check(cell.cropType === pack.cropType, `Cell ${key} cropType does not match ${pack.cropType}`);
    }
  });

  if (pack.cells.length) {
    const connected = new Set([cellKey(pack.cells[0].q, pack.cells[0].r)]);
    let changed = true;
    while (changed) {
      changed = false;
      pack.cells.forEach(coord => {
        const key = cellKey(coord.q, coord.r);
        if (connected.has(key)) return;
        if (HEX_DIRS.some(([dq, dr]) => connected.has(cellKey(coord.q + dq, coord.r + dr)))) {
          connected.add(key);
          changed = true;
        }
      });
    }
    check(connected.size === pack.cells.length, `Field pack ${pack.packId} is disconnected`);
    const centroid = getFieldPackCentroid(pack.cells);
    check(packCellKeys.has(cellKey(centroid.q, centroid.r)), `Field pack ${pack.packId} centroid is outside the pack`);
  }
});

// Coarse quality bounds catch accidental empty or runaway generations.
check(CELLS.length >= 500 && CELLS.length <= 1200, `Cell count ${CELLS.length} outside 500–1200`);
check(RIVER_PATH.length >= 35 && RIVER_PATH.length <= 150, `River length ${RIVER_PATH.length} outside 35–150`);
check((tileCounts.road || 0) >= 20, `Only ${tileCounts.road || 0} road cells`);
check(Object.keys(biomeCounts).length >= 6, `Only ${Object.keys(biomeCounts).length} populated biomes`);
check(FIELD_PACKS.length >= 12, `Only ${FIELD_PACKS.length} field packs`);
check(explicitOccupants >= 8, `Only ${explicitOccupants} explicit occupants`);
check(labels >= 12, `Only ${labels} labels`);

const summary = {
  cells: CELLS.length,
  tileCounts,
  biomeCounts,
  riverEntries: RIVER_PATH.length,
  fieldPacks: FIELD_PACKS.length,
  packedCells: packedCellKeys.size,
  explicitOccupants,
  environmentItems,
  labels,
  uniqueAssetReferences: assetReferences.size,
  failures: failures.length,
};

console.log(JSON.stringify(summary, null, 2));
if (failures.length) {
  console.error('\nWorld validation failures:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
