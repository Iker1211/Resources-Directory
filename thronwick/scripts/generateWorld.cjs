/**
 * Thronwick World Generator — Second-Crown Basin
 *
 * Run: node scripts/generateWorld.cjs > src/data/worldData.js
 *
 * Generates a completely new deterministic world while preserving the original
 * architecture and rules:
 *   - axial pointy-top hex grid
 *   - one cell record per coordinate
 *   - continuous north-to-south water chain
 *   - contiguous 3–12 tile field packs
 *   - Layer 0 terrain, Layer 1 environment, Layer 2 occupants
 *   - only assets registered by the application loader
 *   - deterministic output from a fixed seed
 */

const WORLD_SEED = 20260723;

// ── Deterministic PRNG ──────────────────────────────────────────────────
function createPRNG(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 15), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RNG = createPRNG(WORLD_SEED);
const rng = () => RNG();

// ── Hex geometry ────────────────────────────────────────────────────────
const HEX_W = 1.82;
const HEX_H = 1.575;
const HEX_DIRS = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1],
];

function axialToWorld(q, r) {
  return { x: HEX_W * (q + r * 0.5), z: HEX_H * r };
}

function cellKey(q, r) { return `${q},${r}`; }

function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

function axialLine(a, b) {
  const count = hexDistance(a, b);
  const ac = { x: a.q, z: a.r, y: -a.q - a.r };
  const bc = { x: b.q, z: b.r, y: -b.q - b.r };
  const result = [];

  function cubeRound(cube) {
    let rx = Math.round(cube.x);
    let ry = Math.round(cube.y);
    let rz = Math.round(cube.z);
    const dx = Math.abs(rx - cube.x);
    const dy = Math.abs(ry - cube.y);
    const dz = Math.abs(rz - cube.z);
    if (dx > dy && dx > dz) rx = -ry - rz;
    else if (dy > dz) ry = -rx - rz;
    else rz = -rx - ry;
    return { q: rx, r: rz };
  }

  for (let i = 0; i <= count; i++) {
    const t = count === 0 ? 0 : i / count;
    result.push(cubeRound({
      x: ac.x + (bc.x - ac.x) * t,
      y: ac.y + (bc.y - ac.y) * t,
      z: ac.z + (bc.z - ac.z) * t,
    }));
  }
  return result;
}

function shuffled(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick(values) { return values[Math.floor(rng() * values.length)]; }
function pickN(values, count) { return shuffled(values).slice(0, Math.min(count, values.length)); }

// ── Biome vocabulary ───────────────────────────────────────────────────
const BIOMES = {
  thornwick: { name: 'Thornwick Crown', color: 0xc0a050, labelColor: '#d7c56a', tileColor: 0x4f7b3d, desc: 'Hill-town overlooking the Crown Bend' },
  valley_floor: { name: 'Crown Valley', color: 0x4a9a3a, labelColor: '#61aa50', tileColor: 0x3b783a, desc: 'River-fed meadows and arable terraces' },
  westwood: { name: 'The Deep Westwood', color: 0x2a6a2a, labelColor: '#4f9848', tileColor: 0x285728, desc: 'Dense managed woodland and coppice' },
  grey_hills: { name: 'The Broken Grey Hills', color: 0x7a6a4a, labelColor: '#a09270', tileColor: 0x665943, desc: 'Ironstone shelves and limestone ridges' },
  southmarsh: { name: 'The Reed March', color: 0x3a7aba, labelColor: '#5695ca', tileColor: 0x37695b, desc: 'Peat islands, reeds, and wet meadows' },
  saltwick: { name: 'Saltwick Estuary', color: 0x8a7a5a, labelColor: '#b2a17e', tileColor: 0x76674d, desc: 'Tidal flats, shingle banks, and docks' },
  eastweald: { name: 'The Amber Weald', color: 0x5a8a4a, labelColor: '#75a366', tileColor: 0x4a733d, desc: 'Open woodland and eastern grazing country' },
  northdowns: { name: 'The Windward Downs', color: 0x8a9a7a, labelColor: '#a6b496', tileColor: 0x718263, desc: 'High chalk pasture above the headwaters' },
};

function classifyBiome(q, r) {
  if (hexDistance({ q, r }, { q: 2, r: 0 }) <= 3) return 'thornwick';
  if (r >= 20 && Math.abs(q + r * 0.12) <= 9) return 'saltwick';
  if (r >= 10) return 'southmarsh';
  if (r <= -8) return 'northdowns';
  if (q <= -6) return 'westwood';
  if (q >= 8 && r <= -1) return 'eastweald';
  if (q >= 7) return 'grey_hills';
  return 'valley_floor';
}

// ── Asset pools (all keys are present in ASSET_REGISTRY) ───────────────
const TREE_POOL = [
  'Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_1_C_Color1',
  'Tree_2_A_Color1', 'Tree_2_B_Color1', 'Tree_2_C_Color1', 'Tree_2_D_Color1', 'Tree_2_E_Color1',
  'Tree_3_A_Color1', 'Tree_3_B_Color1', 'Tree_3_C_Color1',
  'Tree_4_A_Color1', 'Tree_4_B_Color1', 'Tree_4_C_Color1',
  'Tree_Bare_1_A_Color1', 'Tree_Bare_2_A_Color1',
  'trees_A_large', 'trees_A_medium', 'trees_A_small',
  'trees_B_large', 'trees_B_medium', 'trees_B_small',
];

const BUSH_POOL = [
  'Bush_1_A_Color1', 'Bush_1_B_Color1', 'Bush_2_A_Color1',
  'Bush_2_B_Color1', 'Bush_3_A_Color1', 'Bush_4_A_Color1',
];

const ROCK_POOL = [
  'Rock_1_A_Color1', 'Rock_1_B_Color1', 'Rock_1_J_Color1', 'Rock_1_K_Color1',
  'Rock_1_L_Color1', 'Rock_1_M_Color1', 'Rock_1_N_Color1', 'Rock_1_O_Color1',
  'Rock_1_P_Color1', 'Rock_1_Q_Color1', 'Rock_2_A_Color1', 'Rock_2_B_Color1',
  'Rock_2_C_Color1', 'Rock_2_D_Color1', 'Rock_2_E_Color1', 'Rock_2_F_Color1',
  'Rock_3_A_Color1', 'Rock_3_B_Color1', 'Rock_3_C_Color1', 'Rock_3_D_Color1',
  'Rock_3_E_Color1', 'Rock_3_F_Color1', 'rock_single_A', 'rock_single_B',
  'rock_single_C', 'rock_single_D', 'rock_single_E',
];

const WATER_PLANT_POOL = ['waterplant_A', 'waterplant_B', 'waterplant_C', 'waterlily_A', 'waterlily_B'];
const PROP_POOL = ['coin_stack_large', 'sack', 'barrel_small', 'barrel_large', 'Pallet_Wood', 'Pallet_Wood_Covered_A', 'Pallet_Wood_Covered_B', 'flag_blue', 'wheelbarrow'];
const WOOD_POOL = ['Wood_Log_Stack', 'Wood_Log_A', 'Wood_Log_B', 'Wood_Planks_Stack_Large', 'resource_lumber'];
const STONE_POOL = ['Iron_Nuggets', 'Iron_Nugget_Large', 'Iron_Bars_Stack_Small', 'Stone_Bricks_Stack_Medium', 'Stone_Bricks_Stack_Large', 'Stone_Chunks_Large', 'Stone_Brick', 'resource_stone'];
const MARSH_RESOURCE_POOL = ['Fuel_B_Barrel', 'Fuel_B_Barrel_Dirty', 'Fuel_B_Barrels', 'Fuel_A_Barrel'];
const COAST_POOL = ['sand_A', 'sand_B', 'hex_coast_A', 'crate_A_big', 'crate_A_small', 'crate_long_A', 'rope_bundle_A', 'bucket_water'];

function baseEnvironment(biome) {
  switch (biome) {
    case 'westwood':
      return pickN([...TREE_POOL, ...TREE_POOL, ...BUSH_POOL, ...ROCK_POOL], 2 + Math.floor(rng() * 2));
    case 'grey_hills':
      return pickN([...ROCK_POOL, ...ROCK_POOL, ...STONE_POOL], 1 + Math.floor(rng() * 2));
    case 'eastweald':
      return pickN([...TREE_POOL, ...BUSH_POOL, ...ROCK_POOL], 1 + Math.floor(rng() * 2));
    case 'northdowns':
      return pickN([...ROCK_POOL, ...BUSH_POOL], 1 + Math.floor(rng() * 2));
    case 'southmarsh':
      return pickN([...WATER_PLANT_POOL, ...WATER_PLANT_POOL, ...MARSH_RESOURCE_POOL], 1 + Math.floor(rng() * 2));
    case 'saltwick':
      return pickN([...COAST_POOL, ...PROP_POOL], 1 + Math.floor(rng() * 2));
    case 'thornwick':
      return rng() < 0.25 ? [pick(PROP_POOL)] : [];
    default:
      if (rng() < 0.35) return [pick([...TREE_POOL, ...BUSH_POOL, ...PROP_POOL])];
      return [];
  }
}

// ── World footprint ────────────────────────────────────────────────────
// A broad central basin with a northern upland lobe and southern estuary.
const cellMap = new Map();
for (let q = -18; q <= 18; q++) {
  for (let r = -16; r <= 28; r++) {
    const inBasin = hexDistance({ q, r }, { q: 0, r: 4 }) <= 14;
    const inNorthLobe = hexDistance({ q, r }, { q: -3, r: -9 }) <= 5;
    const inSouthLobe = hexDistance({ q, r }, { q: 3, r: 20 }) <= 6;
    if (!inBasin && !inNorthLobe && !inSouthLobe) continue;

    const biome = classifyBiome(q, r);
    cellMap.set(cellKey(q, r), {
      q,
      r,
      tileType: 'grass',
      biome,
      env: baseEnvironment(biome),
      occ: null,
    });
  }
}

function requireCell(q, r) {
  const cell = cellMap.get(cellKey(q, r));
  if (!cell) throw new Error(`World feature falls outside footprint: ${q},${r}`);
  return cell;
}

// ── Continuous Thorn River ─────────────────────────────────────────────
const RIVER_PATH = [];
const lateralByRow = new Map([
  [-11, 1], [-7, 1], [-3, -1], [2, -1], [6, 1],
  [10, 1], [14, -1], [18, -1], [22, 1],
]);
let riverQ = -2;
for (let r = -14; r <= 26; r++) {
  const rowVariant = r === -14 || r === 26 ? 'hex_river_J'
    : r === 0 ? 'hex_river_crossing_A'
    : 'hex_river_A';
  RIVER_PATH.push({ q: riverQ, r, variant: rowVariant });
  if (lateralByRow.has(r)) {
    riverQ += lateralByRow.get(r);
    RIVER_PATH.push({ q: riverQ, r, variant: 'hex_river_A_curvy' });
  }
}

const riverLabels = new Map([
  [-12, 'Thorn Headwaters'],
  [0, 'The Crown Bend'],
  [12, 'Reedwater Reach'],
  [22, 'Saltwick Estuary'],
  [26, "River's End"],
]);
const labeledRiverRows = new Set();
RIVER_PATH.forEach(entry => {
  const cell = requireCell(entry.q, entry.r);
  cell.tileType = 'water';
  cell.biome = entry.r >= 20 ? 'saltwick' : entry.r >= 10 ? 'southmarsh' : 'valley_floor';
  cell.env = [];
  cell.occ = null;
  if (riverLabels.has(entry.r) && !labeledRiverRows.has(entry.r)) {
    cell.label = riverLabels.get(entry.r);
    labeledRiverRows.add(entry.r);
  }
});

// ── Road network ───────────────────────────────────────────────────────
const HUBS = {
  thornwick: { q: 2, r: 0 },
  millthorpe: { q: -3, r: -5 },
  northwatch: { q: -5, r: -10 },
  hillend: { q: 8, r: 2 },
  eastweald: { q: 10, r: -3 },
  saltwick: { q: 1, r: 22 },
};

const roadPairs = [
  ['thornwick', 'millthorpe'],
  ['millthorpe', 'northwatch'],
  ['thornwick', 'hillend'],
  ['hillend', 'eastweald'],
  ['thornwick', 'saltwick'],
];

const roadKeys = new Set();
roadPairs.forEach(([from, to]) => {
  axialLine(HUBS[from], HUBS[to]).forEach(({ q, r }) => {
    const cell = cellMap.get(cellKey(q, r));
    if (!cell || cell.tileType === 'water') return;
    cell.tileType = 'road';
    cell.env = [];
    roadKeys.add(cellKey(q, r));
  });
});

// ── Settlements and industries ─────────────────────────────────────────
const settlementCells = [
  { q: 2, r: 0, occ: 'building_castle_blue', label: 'Thornwick Crown — Great Hall', scale: 1.0 },
  { q: 3, r: 0, occ: 'building_tavern_blue', label: 'Crown Brewery', scale: 0.9 },
  { q: 2, r: 1, occ: 'building_blacksmith_blue', label: 'Crown Smithy', scale: 0.9 },
  { q: 3, r: -1, occ: 'building_church_blue', label: 'Chapel of St. Cuthbert', scale: 0.9 },
  { q: 4, r: -1, occ: 'building_market_blue', label: 'Crown Granary', scale: 0.9 },
  { q: 4, r: 0, occ: 'building_tower_base_blue', label: 'Eastwatch Tower', scale: 0.85 },
  { q: 1, r: 1, occ: 'building_home_A_blue', label: 'Demesne Barn', scale: 0.85 },
  { q: 3, r: 1, occ: 'building_home_B_blue', label: 'Tannery', scale: 0.85 },

  { q: -3, r: -5, occ: 'building_lumbermill_blue', label: 'Millthorpe Sawmill', scale: 0.9 },
  { q: -1, r: -5, occ: 'building_watermill_blue', label: 'Upper Thorn Watermill', scale: 0.9 },

  { q: 8, r: 2, occ: 'building_mine_blue', label: 'Hillend Smelter', scale: 0.9 },
  { q: 9, r: 2, occ: 'building_mine_green', label: 'Grey Hills Quarry', scale: 0.9 },

  { q: 1, r: 22, occ: 'building_stage_A', label: 'Saltwick Dock', scale: 0.8 },
];

settlementCells.forEach(def => {
  const cell = requireCell(def.q, def.r);
  if (cell.tileType === 'water') throw new Error(`Settlement overlaps river: ${def.label}`);
  cell.occ = def.occ;
  cell.label = def.label;
  cell.occScale = def.scale;
  cell.env = [];
});

const featureCells = [
  { q: -4, r: -5, label: 'Millthorpe', env: ['Wood_Log_Stack', 'Wood_Log_A', 'Wood_Planks_Stack_Large'] },
  { q: -5, r: -6, label: 'The Timber Yards', env: ['Wood_Log_B', 'resource_lumber'] },
  { q: 7, r: 3, label: 'Hillend Ore Face', env: ['Iron_Nuggets', 'Iron_Nugget_Large', 'Iron_Bars_Stack_Small'] },
  { q: 8, r: 3, label: 'Quarry Steps', env: ['Stone_Bricks_Stack_Medium', 'Stone_Chunks_Large'] },
  { q: 2, r: 22, label: 'Salt Pans', env: ['sand_A', 'sand_B', 'bucket_water'] },
  { q: 2, r: 23, label: 'Harbour Stores', env: ['barrel_large', 'crate_A_big', 'rope_bundle_A'] },
  { q: -4, r: 15, label: 'The Peat Beds', env: ['Fuel_B_Barrel', 'Fuel_B_Barrel_Dirty', 'waterplant_A'] },
];
featureCells.forEach(def => {
  const cell = requireCell(def.q, def.r);
  if (cell.tileType === 'water' || cell.occ) return;
  cell.label = def.label;
  cell.env = def.env;
});

// ── Contiguous field packs ─────────────────────────────────────────────
const PACK_DEFINITIONS = [
  ['crown_wheat', 'grain', 'Crown Wheat Terraces', 5, 3, 6],
  ['crown_fallow', 'fallow', 'Crown Fallow', 4, 6, 5],
  ['lower_barley', 'grain', 'Lower Valley Barley', 2, 8, 6],
  ['west_meadow', 'pasture', 'Westwood Meadow', -5, 5, 5],
  ['millthorpe_oats', 'grain', 'Millthorpe Oats', -5, -3, 5],
  ['north_sheepwalk', 'pasture', 'Windward Sheep Walk', -6, -9, 6],
  ['north_fallow', 'fallow', 'Downs Fallow', -3, -8, 4],
  ['east_corn', 'grain', 'Amber Weald Corn', 9, -1, 6],
  ['east_pasture', 'pasture', 'East Weald Pasture', 11, 1, 5],
  ['hill_fallow', 'fallow', 'Grey Hills Fallow', 7, 5, 4],
  ['riverbend_grain', 'grain', 'Riverbend Grain', 4, 10, 6],
  ['reed_meadow', 'pasture', 'Reedwater Meadow', -4, 11, 5],
  ['marsh_grain', 'grain', 'March Edge Grain', 3, 13, 5],
  ['marsh_fallow', 'fallow', 'March Fallow', -5, 13, 4],
  ['peat_pasture', 'pasture', 'Peat Island Pasture', 5, 15, 5],
  ['lost_croft', 'abandoned', 'The Lost Croft', -6, 17, 4],
  ['estuary_barley', 'grain', 'Estuary Barley', 4, 19, 5],
  ['estuary_fallow', 'fallow', 'Estuary Fallow', -4, 19, 4],
  ['saltwick_grazing', 'pasture', 'Saltwick Grazing', 5, 22, 5],
  ['old_salt_fields', 'abandoned', 'Old Salt Fields', -5, 22, 4],
  ['south_wheat', 'grain', 'Southbank Wheat', 4, 24, 5],
  ['south_meadow', 'pasture', 'Southbank Meadow', -4, 24, 5],
  ['west_coppice_field', 'fallow', 'Coppice Edge Fallow', -8, 1, 4],
  ['quarry_pasture', 'pasture', 'Quarry Pasture', 10, 5, 4],
];

const fieldPacks = [];
const fieldKeys = new Set();

function fieldCellAvailable(q, r) {
  const cell = cellMap.get(cellKey(q, r));
  return Boolean(cell)
    && cell.tileType === 'grass'
    && !cell.occ
    && !fieldKeys.has(cellKey(q, r));
}

function growFieldPack(packIndex, q, r, size) {
  const target = { q, r };
  const candidates = [...cellMap.values()]
    .filter(cell => fieldCellAvailable(cell.q, cell.r) && hexDistance(cell, target) <= 4)
    .sort((a, b) => hexDistance(a, target) - hexDistance(b, target) || a.r - b.r || a.q - b.q);
  if (candidates.length === 0) throw new Error(`No available seed near ${q},${r}`);

  const start = candidates[0];
  const cells = [];
  const queued = new Set([cellKey(start.q, start.r)]);
  const queue = [start];
  const directionOffset = packIndex % HEX_DIRS.length;

  while (queue.length > 0 && cells.length < size) {
    const current = queue.shift();
    if (!fieldCellAvailable(current.q, current.r)) continue;
    cells.push({ q: current.q, r: current.r });
    fieldKeys.add(cellKey(current.q, current.r));

    for (let i = 0; i < HEX_DIRS.length; i++) {
      const [dq, dr] = HEX_DIRS[(i + directionOffset) % HEX_DIRS.length];
      const next = { q: current.q + dq, r: current.r + dr };
      const key = cellKey(next.q, next.r);
      if (!queued.has(key) && fieldCellAvailable(next.q, next.r)) {
        queued.add(key);
        queue.push(next);
      }
    }
  }

  if (cells.length < 3) throw new Error(`Field pack at ${q},${r} has only ${cells.length} cells`);
  return cells;
}

PACK_DEFINITIONS.forEach(([packId, cropType, label, q, r, size], index) => {
  const packCells = growFieldPack(index, q, r, size);
  const pack = { packId, cropType, label, cells: packCells };
  fieldPacks.push(pack);

  packCells.forEach((coord, cellIndex) => {
    const cell = requireCell(coord.q, coord.r);
    cell.packId = packId;
    cell.cropType = cropType;
    cell.env = [];
    if (cellIndex === 0 || rng() < 0.45) cell.env.push('fence_wood_straight');
    if (rng() < 0.15) cell.env.push('fence_wood_straight_gate');
    if (rng() < 0.25) cell.env.push(cropType === 'pasture' ? 'Pallet_Wood_Covered_A' : 'sack');
  });
});

// ── Biome labels and atmospheric clouds ────────────────────────────────
const biomeLabels = [
  [-9, 2, 'The Deep Westwood'],
  [10, 3, 'The Broken Grey Hills'],
  [10, -4, 'The Amber Weald'],
  [-5, -11, 'The Windward Downs'],
  [3, 6, 'Crown Valley'],
  [-5, 14, 'The Reed March'],
  [4, 22, 'Saltwick Estuary'],
];
biomeLabels.forEach(([q, r, label]) => {
  const cell = cellMap.get(cellKey(q, r));
  if (cell && !cell.label) cell.label = label;
});

const cloudCandidates = shuffled([...cellMap.values()].filter(cell =>
  cell.tileType === 'grass' && !cell.occ && !cell.packId && cell.env.length < 2
));
cloudCandidates.slice(0, 18).forEach((cell, index) => {
  cell.env.push('cloud_big');
  if (index % 7 === 0) cell.env.push('cloud_big');
});

// ── Final cell list and invariant checks ───────────────────────────────
const cells = [...cellMap.values()].sort((a, b) => a.r - b.r || a.q - b.q);

function assert(condition, message) {
  if (!condition) throw new Error(`World validation failed: ${message}`);
}

assert(cells.length === cellMap.size, 'duplicate cell coordinates');
assert(RIVER_PATH.length >= 40, 'river is too short');
for (let i = 1; i < RIVER_PATH.length; i++) {
  assert(hexDistance(RIVER_PATH[i - 1], RIVER_PATH[i]) === 1, `river discontinuity at index ${i}`);
}
fieldPacks.forEach(pack => {
  assert(pack.cells.length >= 3 && pack.cells.length <= 12, `${pack.packId} size outside 3–12`);
  const connected = new Set([cellKey(pack.cells[0].q, pack.cells[0].r)]);
  let changed = true;
  while (changed) {
    changed = false;
    pack.cells.forEach(cell => {
      if (connected.has(cellKey(cell.q, cell.r))) return;
      if (HEX_DIRS.some(([dq, dr]) => connected.has(cellKey(cell.q + dq, cell.r + dr)))) {
        connected.add(cellKey(cell.q, cell.r));
        changed = true;
      }
    });
  }
  assert(connected.size === pack.cells.length, `${pack.packId} is not contiguous`);
});

const waterCells = cells.filter(cell => cell.tileType === 'water');
const roadCells = cells.filter(cell => cell.tileType === 'road');
const occupiedCells = cells.filter(cell => cell.occ);
const environmentItems = cells.reduce((sum, cell) => sum + cell.env.length, 0);

function generateOutput() {
  let out = `/**
 * Thronwick Kingdom — Second-Crown Basin World Data
 * Auto-generated by scripts/generateWorld.cjs with seed 20260723
 *
 * Axial coordinates (q, r). Pointy-top hexagons.
 * Layer 0: Tile type (grass, water, river, road)
 * Layer 1: Environment props (0-3 per cell)
 * Layer 2: Occupant (0-1 per cell, exclusive with L1)
 *
 * RIVER GRAMMAR (Section 9 of SKILL.md):
 *   - River tiles form a continuous path with edge-flow matching
 *   - Each river cell specifies a variant matching its flow pattern
 *
 * FIELD GRAMMAR (Section 10 of SKILL.md):
 *   - Fields are contiguous packs of 3-12 grass tiles
 *   - Each pack has a single L2 occupant at its centroid
 *   - packId groups cells into a field pack
 *   - cropType: 'grain' | 'fallow' | 'pasture' | 'abandoned'
 *
 * PRIORITY RULES (no duplicate cells):
 *   Water > Road > Occupant > Field > Cloud > Environment
 */
export const HEX_W = 1.82;
export const HEX_H = 1.575;

export function axialToWorld(q, r) {
  return { x: HEX_W * (q + r * 0.5), z: HEX_H * r };
}

/** Convert axial coords to a unique cell key */
export function cellKey(q, r) { return \`\${q},\${r}\`; }

/**
 * Biome definitions — each zone's chromatic identity
 */
export const BIOMES = ${JSON.stringify(BIOMES, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"0x([0-9a-f]+)"/g, '0x$1')};

/**
 * RIVER PATH — The Thorn River flows south through the valley.
 * Ordered array of axial coordinates forming a continuous path.
 * Pure water chain: hex_water tiles only, no env, no occ.
 */
export const RIVER_PATH = ${JSON.stringify(RIVER_PATH, null, 2)};

/**
 * FIELD PACKS — Contiguous groups of grass tiles forming agricultural fields.
 * Each pack has a cropType and a single L2 occupant at its centroid.
 */
export const FIELD_PACKS = ${JSON.stringify(fieldPacks, null, 2)};

/**
 * Build a lookup from cellKey → field pack info
 */
export const FIELD_PACK_MAP = {};
FIELD_PACKS.forEach(pack => {
  pack.cells.forEach(c => {
    FIELD_PACK_MAP[cellKey(c.q, c.r)] = {
      packId: pack.packId,
      cropType: pack.cropType,
      label: pack.label,
    };
  });
});

/**
 * Get the centroid (average q, r) of a field pack's cells
 */
export function getFieldPackCentroid(cells) {
  const n = cells.length;
  const avgQ = cells.reduce((s, c) => s + c.q, 0) / n;
  const avgR = cells.reduce((s, c) => s + c.r, 0) / n;
  let best = cells[0];
  let bestDist = Infinity;
  cells.forEach(c => {
    const d = (c.q - avgQ) ** 2 + (c.r - avgR) ** 2;
    if (d < bestDist) { bestDist = d; best = c; }
  });
  return best;
}

/**
 * CELLS — the complete Second-Crown Basin hex world.
 * Each cell appears exactly once. Priority: Water > Road > Occupant > Field > Cloud > Env
 */
export const CELLS = ${JSON.stringify(cells, null, 2).replace(/"(\w+)":/g, '$1:').replace(/"0x([0-9a-f]+)"/g, '0x$1')};

/**
 * Entity database for click-to-inspect modal.
 * Maps asset keys to { title, desc, stats }
 */
export const ENTITY_DB = {
  'building_castle_blue': {
    title: "Lord's Great Hall",
    desc: 'Timber-framed with stone foundation. The seat of local governance — manorial court, feasts, and strategic planning.',
    stats: { Defense: '75/100', Garrison: '200 Militia', Treasury: '+80 Gold/Month' }
  },
  'building_tavern_blue': {
    title: 'Brewery',
    desc: 'Produces small beer for daily distribution — a crucial source of calories and safe hydration for the entire settlement.',
    stats: { Production: '60 Barrels/Month', Workers: '3', Storage: 'Fermentation Vats' }
  },
  'building_blacksmith_blue': {
    title: 'Smithy',
    desc: 'Forge and anvil where bloom iron is converted into plowshares, horseshoes, nails, and weapons for the militia.',
    stats: { Production: '12 Tools/Week', Fuel: 'Charcoal', Water: 'Quench Trough' }
  },
  'building_church_blue': {
    title: 'Chapel of St. Cuthbert',
    desc: 'Fieldstone chapel serving all five settlements. Candle-lit interior with written records of births, marriages, and deaths.',
    stats: { Capacity: '80 Worshippers', Records: 'Parish Register', Feast: "St. Cuthbert's Day" }
  },
  'building_market_blue': {
    title: 'Granary',
    desc: 'Raised timber storehouse holding grain at 1.5x annual consumption. Rat-proofed with stone footings.',
    stats: { Capacity: '500 Bushels', Workers: '4', Rotation: 'Quarterly' }
  },
  'building_tower_base_blue': {
    title: 'Kiln',
    desc: 'Dual-chamber updraft kiln firing pottery and roof tiles from local clay deposits along the Thorn River.',
    stats: { Temperature: '900°C', Output: '200 Pots/Week', Fuel: 'Firewood' }
  },
  'building_home_B_blue': {
    title: 'Tannery',
    desc: 'Downstream workshops with liming and oak-bark tanning pits. Produces leather for shoes, harnesses, and bellows.',
    stats: { Time: '12 Months/Hide', Pits: '6', Output: '40 Hides/Year' }
  },
  'building_home_A_blue': {
    title: 'Demesne Barn',
    desc: "Cruck-framed threshing barn at the center of the lord's demesne fields. Plough teams and equipment storage.",
    stats: { Threshing: '200 Sheaves/Day', Storage: 'Hay & Straw', Oxen: '6 Teams' }
  },
  'building_watermill_blue': {
    title: 'Watermill',
    desc: 'Undershot water wheel harnessing the Thorn River. Grinds grain for all five settlements.',
    stats: { Grinding: '4 Bushels/Hour', Sluice: 'Adjustable', Maintenance: 'Annual' }
  },
  'building_lumbermill_blue': {
    title: 'Sawmill',
    desc: 'Upstream sawmill at Millthorpe where the river gradient is steeper. Logs are floated downstream from The Westwood.',
    stats: { Cutting: '20 Logs/Day', Blade: 'Water-Driven', Season: 'Spring Thaw' }
  },
  'building_mine_blue': {
    title: 'Smelter',
    desc: 'Bloomery hearth at Hillend near iron ore outcrops. Layers of ore, charcoal, and limestone produce raw iron blooms.',
    stats: { Output: '1 Bloom/Day', Iron: '35 kg/Bloom', Fuel: 'Charcoal (3:1 ratio)' }
  },
  'building_mine_green': {
    title: 'Quarry',
    desc: 'Open-face limestone quarry on the Grey Hills escarpment. Stone blocks sledged downslope for construction.',
    stats: { Output: '20 Blocks/Day', Tools: 'Wedges & Drills', Transport: 'Oxygen Sledge' }
  },
  'building_stage_A': {
    title: 'Dock',
    desc: 'Timber jetty and stone quay at Saltwick Cove. Mooring for fishing boats and the coasting cog that brings trade goods.',
    stats: { Mooring: '3 Vessels', Trade: 'Salt, Fish, Wool', Depth: '2.5m at Mid-tide' }
  },
  'cloud_big': {
    title: 'Divine Cloud',
    desc: 'A wisp of celestial mist drifting over the kingdom. Carries benediction and rain.',
    stats: { Divinity: '+50', Visibility: 'Low', Breeze: 'Mild' }
  },
  'hex_grass': {
    title: 'Verdant Meadow',
    desc: 'Fertile grassland nourished by the Thorn River. Perfect for grazing and cultivation.',
    stats: { Fertility: 'High', Soil: 'Alluvial Loam', Irrigation: 'River-fed' }
  },
  'hex_water': {
    title: 'The Thorn River',
    desc: 'Pure water tile — the life-giving spine of the kingdom. Drinking water, irrigation, and transport corridor.',
    stats: { Length: '48 miles', Width: '8–15 m', Depth: '1–3 m' }
  },
  'hex_river_A': {
    title: 'The Thorn River',
    desc: 'The life-giving spine of the kingdom. Drinking water, irrigation, transport corridor, fish stock, and mill power.',
    stats: { Length: '48 miles', Width: '8–15 m', Depth: '1–3 m' }
  },
  'hex_road_A': {
    title: 'Stone Road',
    desc: 'Paved pathway connecting settlements. Built with local limestone and gravel from the Grey Hills.',
    stats: { 'March Speed': '+25%', Maintenance: 'Annual', Surface: 'Gravelled' }
  },
  'building_grain': {
    title: 'Grain Fields',
    desc: 'Two-field rotation of wheat and barley. The agricultural backbone of the kingdom.',
    stats: { Production: '200 Bushels/Acre', Workers: '80', Rotation: 'Wheat/Barley/Fallow' }
  },
  'building_dirt': {
    title: 'Fallow Field',
    desc: 'Resting field left unplanted to restore soil fertility. Part of the three-field rotation system.',
    stats: { Rest: '1 Season', Recovery: 'Nitrogen Fixing', Next: 'Winter Wheat' }
  },
  'Wood_Log_Stack': {
    title: 'Timber Pile',
    desc: 'Stacked logs from The Westwood. The primary construction material for buildings, ships, and tools.',
    stats: { Volume: '6 cords', Species: 'Oak & Beech', Seasoning: '2 Years' }
  },
  'Wood_Planks_Stack_Large': {
    title: 'Plank Stack',
    desc: 'Sawn planks ready for construction. Versatile building material for floors, walls, and furniture.',
    stats: { Count: '200 Planks', Width: '8–12 inches', Drying: 'Kiln-dried' }
  },
  'resource_lumber': {
    title: 'Lumber Pile',
    desc: 'Rough-hewn timber beams and posts awaiting use. Essential for structural framing.',
    stats: { Volume: '5 cubic m', Quality: 'Select Grade', Origin: 'The Westwood' }
  },
  'Iron_Nuggets': {
    title: 'Iron Nuggets',
    desc: 'Raw iron ore from the Grey Hills outcrops. Smelted into blooms at the Hillend smelter.',
    stats: { Purity: '45–55%', Source: 'Hillend Vein', Value: '8 Coins/kg' }
  },
  'Iron_Bars_Stack_Small': {
    title: 'Iron Bars',
    desc: 'Smelted and refined iron ready for the smithy. Each bar represents hours of skilled work.',
    stats: { Mass: '15 kg', Grade: 'Wrought Iron', Purity: '99%' }
  },
  'Stone_Bricks_Stack_Medium': {
    title: 'Limestone Blocks',
    desc: 'Dressed limestone from the Grey Hills quarry. The premium building material for important structures.',
    stats: { Count: '48 Blocks', Weight: '2.4 tons', Hardness: 'Mohs 3–4' }
  },
  'Stone_Chunks_Large': {
    title: 'Stone Chunks',
    desc: 'Rough quarry stone for foundations, walls, and roadbeds. The backbone of construction.',
    stats: { Volume: '3 cubic m', Use: 'Foundations & Walls', Source: 'Grey Hills' }
  },
  'resource_stone': {
    title: 'Stone Resource',
    desc: 'Crushed stone and gravel used for road surfacing and concrete flooring.',
    stats: { Grade: '2–4 cm', Use: 'Road Base & Mortar', Source: 'Quarry Waste' }
  },
  'Fuel_B_Barrel': {
    title: 'Peat Barrel',
    desc: 'Dried peat from the Southmarsh. The primary fuel for cooking and heating in the southern settlements.',
    stats: { Energy: '15 MJ/kg', Seasoning: '6 Months', Use: 'Cooking & Heating' }
  },
  'Fuel_B_Barrel_Dirty': {
    title: 'Peat (Sooty)',
    desc: 'Ready-to-burn peat with characteristic smoky aroma. Slower burn than wood with steady heat output.',
    stats: { Burn: '4 Hours/kg', Smoke: 'Moderate', Ash: '8% by mass' }
  },
  'Fuel_B_Barrels': {
    title: 'Peat Stack',
    desc: "A season's worth of cut peat stacked for drying. Critical winter fuel reserve.",
    stats: { Volume: '12 barrels', Drying: 'East-facing', Value: '30 Coins' }
  },
  'Fuel_A_Barrel': {
    title: 'Charcoal Barrel',
    desc: 'High-energy charcoal produced in The Westwood. Essential for metalworking and smelting.',
    stats: { Energy: '30 MJ/kg', Use: 'Metalworking', Origin: 'Westwood Coppice' }
  },
  'Pallet_Wood': {
    title: 'Hay Pallet',
    desc: 'Stacked hay bales for animal fodder. Winter feed for the ox teams and sheep flocks.',
    stats: { Weight: '200 kg', Feed: '6 Oxen/Month', Season: 'Winter Reserve' }
  },
  'barrel_small': {
    title: 'Small Barrel',
    desc: 'General-purpose storage container for ale, salted fish, pickled vegetables, or grain.',
    stats: { Capacity: '50 Litres', Use: 'Storage', Material: 'Oak Staves' }
  },
  'barrel_large': {
    title: 'Large Barrel',
    desc: 'Heavy-duty storage for bulk goods: grain, salt, fish, or ale. Often reused for multiple seasons.',
    stats: { Capacity: '200 Litres', Weight: '30 kg (empty)', Durability: '10 Years' }
  },
  'crate_A_big': {
    title: 'Shipping Crate',
    desc: 'Sturdy wooden crate for transporting goods to and from the dock. Used for trade exports.',
    stats: { Volume: '1 cubic m', Cargo: 'General Goods', Origin: 'Dock Stores' }
  },
  'crate_long_A': {
    title: 'Long Crate',
    desc: 'Elongated crate for transporting tools, weapons, or timber. Common in the smithy and dock.',
    stats: { Length: '2 m', Capacity: '150 kg', Material: 'Pine Planks' }
  },
  'sack': {
    title: 'Grain Sack',
    desc: "Standard measure of grain — the fundamental unit of the kingdom's agricultural economy.",
    stats: { Weight: '50 kg', Volume: '1 Bushel', Value: '12 Coins' }
  },
  'rope_bundle_A': {
    title: 'Rope Coil',
    desc: 'Sturdy hemp rope for mooring, hauling, and rigging. Essential for dock and quarry operations.',
    stats: { Length: '50 m', Strength: '2 ton load', Material: 'Hemp' }
  },
  'bucket_water': {
    title: 'Water Bucket',
    desc: 'Essential for every household and workshop. Drawn daily from the Thorn River.',
    stats: { Capacity: '10 Litres', Use: 'Drinking, Cleaning', Material: 'Oak' }
  },
  'coin_stack_large': {
    title: 'Treasury Coins',
    desc: 'Silver and copper coins — taxes collected, trade surplus, and military fund.',
    stats: { Value: '5000 Coins', Weight: 'Heavy', Origin: 'Annual Tax' }
  },
  'flag_blue': {
    title: 'Kingdom Banner',
    desc: 'The blue banner of Thronwick flies over settlements and the dock. A symbol of unity.',
    stats: { Symbol: 'Thorn Branch', Color: 'Thornwick Blue', Material: 'Dyed Wool' }
  },
  'sand_A': {
    title: 'Shingle Beach',
    desc: 'The sheltered beach of Saltwick Cove. Accessible only at low tide for beaching small boats.',
    stats: { Type: 'Shingle & Sand', Tidal: '2.5 m Range', Access: 'Limited' }
  },
  'sand_B': {
    title: 'Sandy Shore',
    desc: 'Sandy patches along the cove used for salt evaporation pans and fish drying.',
    stats: { Grain: 'Fine', Salt: 'Evaporative Pans', Fish: 'Drying Racks' }
  },
  'hex_coast_A': {
    title: 'Coastline',
    desc: 'The transition zone from marsh to sea. Rich in marine life and salt-tolerant plants.',
    stats: { Flora: 'Saltmarsh Grasses', Fauna: 'Shorebirds, Crabs', Tide: 'Semi-diurnal' }
  },
  'waterplant_A': {
    title: 'Reed Bed',
    desc: 'Dense reeds for thatching roofs and weaving mats. Managed by Southmarsh dwellers.',
    stats: { Height: '2–3 m', Harvest: 'Annually (Winter)', Use: 'Thatching & Mats' }
  },
  'waterplant_B': {
    title: 'Cattails',
    desc: 'Edible wetland plants providing rhizome flour in spring and pollen in summer.',
    stats: { Edible: 'Rhizome & Pollen', Wildlife: 'Nesting Habitat', Water: 'Filtration' }
  },
  'waterlily_A': {
    title: 'Water Lilies',
    desc: 'Floating flowers along the slow-moving river. A sign of healthy water quality.',
    stats: { Bloom: 'June–August', Root: 'Mud-anchored', Symbol: 'Purity' }
  },
  'Tree_1_A_Color1': {
    title: 'Oak Tree',
    desc: 'Mighty oak in The Westwood. Produces hard timber for construction and acorns for pannage.',
    stats: { Height: '25 m', Age: '80–120 Years', Timber: 'High-grade' }
  },
  'Tree_2_A_Color1': {
    title: 'Beech Tree',
    desc: 'Smooth-barked beech providing fine-grained timber. Mast for swine in autumn.',
    stats: { Height: '20 m', Age: '60–100 Years', Use: 'Furniture & Charcoal' }
  },
  'Tree_3_A_Color1': {
    title: 'Ash Tree',
    desc: 'Hardy ash — preferred for tool handles, cart shafts, and spear shafts due to its flexibility.',
    stats: { Height: '18 m', Age: '40–80 Years', Use: 'Tool Handles & Wheels' }
  },
  'Bush_1_A_Color1': {
    title: 'Hazel Coppice',
    desc: 'Managed hazel underwood in the Westwood. Cut on a 7-year rotation for wattle, hurdles, and bindings.',
    stats: { Rotation: '7 Years', Use: 'Wattle & Hurdles', Regrowth: 'Stool shoots' }
  },
  'Rock_1_J_Color1': {
    title: 'Ironstone Outcrop',
    desc: 'Exposed iron-bearing rock on the Grey Hills. Rust-colored seams indicate iron ore presence.',
    stats: { Ore: 'Limonite & Siderite', Grade: '45% Iron', Location: 'Hillend Vein' }
  },
  'Rock_2_A_Color1': {
    title: 'Limestone Pavement',
    desc: 'Fractured limestone surface forming the bedrock of the Grey Hills. Quarried for building stone.',
    stats: { Type: 'Carboniferous', Fossils: 'Crinoids & Corals', Use: 'Quicklime & Stone' }
  },
};

/**
 * Map cellKey -> cell data for fast lookup
 */
export const CELL_MAP = {};
CELLS.forEach(c => { CELL_MAP[cellKey(c.q, c.r)] = c; });

/**
 * Default tile type for any coordinate not explicitly defined
 */
export function getTileAt(q, r) {
  const key = cellKey(q, r);
  return CELL_MAP[key] || null;
}
`;

  return out;
}

const output = generateOutput();
console.log(output);
console.error(`Generated ${cells.length} cells, ${waterCells.length} water tiles, ${roadCells.length} road tiles, ${fieldPacks.length} field packs, ${occupiedCells.length} explicit occupants, ${environmentItems} environment items`);
