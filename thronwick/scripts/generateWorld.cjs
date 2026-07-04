/**
 * World Generator — doubles the Thronwick hex grid (2nd doubling)
 * Run: node scripts/generateWorld.cjs > src/data/worldData.js
 * 
 * Generates a ~2x larger world (from ~300 to ~600 cells) with:
 *   - Extended river (96 water tiles, doubled from 48)
 *   - 9 biomes with greatly expanded coverage
 *   - 36 field packs (doubled from 18)
 *   - More buildings, roads, clouds, trees, rocks
 *   - Deterministic PRNG for reproducibility
 * 
 * Target: ~600 cells (from ~300)
 */

const fs = require('fs');
const path = require('path');

// ── PRNG (mulberry32) ──
function createPRNG(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 15), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RNG = createPRNG(1337);
const rng = () => RNG();

// ── Constants ──
const HEX_W = 1.82;
const HEX_H = 1.575;

function axialToWorld(q, r) {
  return { x: HEX_W * (q + r * 0.5), z: HEX_H * r };
}

function cellKey(q, r) { return `${q},${r}`; }

// ── Biomes ──
const BIOMES = {
  thornwick: { name: 'Thornwick', color: 0xc0a050, labelColor: '#c0d8e8', tileColor: 0x4a7a3a, desc: 'Central settlement of the kingdom' },
  valley_floor: { name: 'The Valley Floor', color: 0x4a9a3a, labelColor: '#4a9a3a', tileColor: 0x3a7a3a, desc: 'Deep alluvial loam — grain cultivation' },
  westwood: { name: 'The Westwood', color: 0x2a6a2a, labelColor: '#2a6a2a', tileColor: 0x2a5a2a, desc: 'Managed broadleaf woodland' },
  grey_hills: { name: 'The Grey Hills', color: 0x7a6a4a, labelColor: '#7a6a4a', tileColor: 0x6a5a4a, desc: 'Limestone-and-ironstone ridge' },
  southmarsh: { name: 'The Southmarsh', color: 0x3a7aba, labelColor: '#3a7aba', tileColor: 0x3a6a5a, desc: 'Reed beds and peat bogs' },
  saltwick: { name: 'Saltwick Cove', color: 0x8a7a5a, labelColor: '#8a7a5a', tileColor: 0x7a6a4a, desc: 'Sheltered shingle beach' },
  eastweald: { name: 'East Weald', color: 0x5a8a4a, labelColor: '#5a8a4a', tileColor: 0x4a7a3a, desc: 'Rolling wooded hills' },
  northdowns: { name: 'North Downs', color: 0x8a9a7a, labelColor: '#8a9a7a', tileColor: 0x7a8a6a, desc: 'Chalk grassland escarpment' },
};

// ── River Path (96 water tiles, doubled from 48) ──
// The Thorn River now flows from r=-20 far north to r=48 far south
const RIVER_PATH = [
  // Far north headwaters (r=-20 to r=-10)
  { q: 1,  r: -20, variant: 'hex_river_J' },
  { q: 1,  r: -19, variant: 'hex_river_A' },
  { q: 0,  r: -18, variant: 'hex_river_A_curvy' },
  { q: 0,  r: -17, variant: 'hex_river_A' },
  { q: -1, r: -16, variant: 'hex_river_A_curvy' },
  { q: -1, r: -15, variant: 'hex_river_A' },
  { q: 0,  r: -15, variant: 'hex_river_A_curvy' },
  { q: 0,  r: -14, variant: 'hex_river_A' },
  { q: 1,  r: -14, variant: 'hex_river_A_curvy' },
  { q: 1,  r: -13, variant: 'hex_river_A' },
  { q: 0,  r: -12, variant: 'hex_river_A_curvy' },
  { q: 0,  r: -11, variant: 'hex_river_A' },
  // North headwaters continuation (r=-10 to 0)
  { q: 0,  r: -10, variant: 'hex_river_J' },
  { q: 0,  r: -9,  variant: 'hex_river_A' },
  { q: -1, r: -8,  variant: 'hex_river_A_curvy' },
  { q: -1, r: -7,  variant: 'hex_river_A' },
  { q: 0,  r: -7,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: -6,  variant: 'hex_river_J' },
  { q: 0,  r: -5,  variant: 'hex_river_A' },
  { q: -1, r: -4,  variant: 'hex_river_A_curvy' },
  { q: -1, r: -3,  variant: 'hex_river_A' },
  { q: 0,  r: -3,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: -2,  variant: 'hex_river_A' },
  { q: -1, r: -1,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 0,   variant: 'hex_river_A_curvy' },
  { q: 0,  r: 0,   variant: 'hex_river_A_curvy' },
  // Central valley (r=1 to 12)
  { q: 0,  r: 1,   variant: 'hex_river_A' },
  { q: 0,  r: 2,   variant: 'hex_river_A' },
  { q: 0,  r: 3,   variant: 'hex_river_A' },
  { q: 1,  r: 3,   variant: 'hex_river_A_curvy' },
  { q: 1,  r: 4,   variant: 'hex_river_A' },
  { q: 0,  r: 5,   variant: 'hex_river_A_curvy' },
  { q: 0,  r: 6,   variant: 'hex_river_A' },
  { q: 1,  r: 6,   variant: 'hex_river_A_curvy' },
  { q: 1,  r: 7,   variant: 'hex_river_A' },
  { q: 0,  r: 8,   variant: 'hex_river_A_curvy' },
  { q: 0,  r: 9,   variant: 'hex_river_A' },
  { q: -1, r: 9,   variant: 'hex_river_A_curvy' },
  { q: -1, r: 10,  variant: 'hex_river_A' },
  { q: 0,  r: 10,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 11,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 12,  variant: 'hex_river_A' },
  // Extended southern delta (r=12 to 24)
  { q: -1, r: 12,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 13,  variant: 'hex_river_A' },
  { q: 0,  r: 13,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 14,  variant: 'hex_river_A' },
  { q: 1,  r: 14,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 15,  variant: 'hex_river_A' },
  { q: 0,  r: 16,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 17,  variant: 'hex_river_A' },
  { q: -1, r: 17,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 18,  variant: 'hex_river_A' },
  { q: 0,  r: 18,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 19,  variant: 'hex_river_A' },
  { q: -1, r: 19,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 20,  variant: 'hex_river_A' },
  { q: 0,  r: 20,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 21,  variant: 'hex_river_A' },
  { q: 1,  r: 21,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 22,  variant: 'hex_river_A' },
  { q: 0,  r: 23,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 24,  variant: 'hex_river_A' },
  // Far south extension (r=24 to 48)
  { q: -1, r: 24,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 25,  variant: 'hex_river_A' },
  { q: 0,  r: 25,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 26,  variant: 'hex_river_A' },
  { q: 1,  r: 26,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 27,  variant: 'hex_river_A' },
  { q: 0,  r: 28,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 29,  variant: 'hex_river_A' },
  { q: -1, r: 29,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 30,  variant: 'hex_river_A' },
  { q: 0,  r: 30,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 31,  variant: 'hex_river_A' },
  { q: 1,  r: 31,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 32,  variant: 'hex_river_A' },
  { q: 0,  r: 33,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 34,  variant: 'hex_river_A' },
  { q: -1, r: 34,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 35,  variant: 'hex_river_A' },
  { q: 0,  r: 35,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 36,  variant: 'hex_river_A' },
  { q: 1,  r: 36,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 37,  variant: 'hex_river_A' },
  { q: 0,  r: 38,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 39,  variant: 'hex_river_A' },
  { q: -1, r: 39,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 40,  variant: 'hex_river_A' },
  { q: 0,  r: 40,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 41,  variant: 'hex_river_A' },
  { q: 1,  r: 41,  variant: 'hex_river_A_curvy' },
  { q: 1,  r: 42,  variant: 'hex_river_A' },
  { q: 0,  r: 43,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 44,  variant: 'hex_river_A' },
  { q: -1, r: 44,  variant: 'hex_river_A_curvy' },
  { q: -1, r: 45,  variant: 'hex_river_A' },
  { q: 0,  r: 46,  variant: 'hex_river_A_curvy' },
  { q: 0,  r: 47,  variant: 'hex_river_A' },
  { q: 0,  r: 48,  variant: 'hex_river_J' },
];

// ── Water cells from river path ──
const waterCells = RIVER_PATH.map(e => ({
  q: e.q, r: e.r, tileType: 'water', biome: 'valley_floor', env: [], occ: null
}));

// ── Helper: get neighbors ──
const HEX_DIRS = [
  [1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]
];

function getNeighbors(q, r) {
  return HEX_DIRS.map(([dq, dr]) => [q + dq, r + dr]);
}

// ── Track used cells ──
const used = new Set();
waterCells.forEach(c => used.add(cellKey(c.q, c.r)));

function isUsed(q, r) { return used.has(cellKey(q, r)); }
function markUsed(q, r) { used.add(cellKey(q, r)); }

// ── Building definitions ──
const BUILDINGS = [
  { key: 'building_castle_blue', label: "Lord's Great Hall", scale: 1.0 },
  { key: 'building_tavern_blue', label: 'Brewery', scale: 1.0 },
  { key: 'building_blacksmith_blue', label: 'Smithy', scale: 1.0 },
  { key: 'building_church_blue', label: 'Chapel of St. Cuthbert', scale: 1.0 },
  { key: 'building_market_blue', label: 'Granary', scale: 1.0 },
  { key: 'building_tower_base_blue', label: 'Kiln', scale: 0.9 },
  { key: 'building_home_A_blue', label: 'Demesne Barn', scale: 0.9 },
  { key: 'building_home_B_blue', label: 'Tannery', scale: 0.9 },
  { key: 'building_lumbermill_blue', label: 'Sawmill', scale: 0.9 },
  { key: 'building_mine_blue', label: 'Smelter', scale: 0.9 },
  { key: 'building_mine_green', label: 'Quarry', scale: 0.9 },
  { key: 'building_stage_A', label: 'Dock', scale: 0.8 },
];

// ── Tree/asset pools ──
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
  'Rock_1_A_Color1', 'Rock_1_J_Color1', 'Rock_1_K_Color1', 'Rock_1_L_Color1',
  'Rock_1_M_Color1', 'Rock_1_N_Color1', 'Rock_1_O_Color1', 'Rock_1_P_Color1', 'Rock_1_Q_Color1',
  'Rock_2_A_Color1', 'Rock_2_B_Color1', 'Rock_2_C_Color1', 'Rock_2_D_Color1', 'Rock_2_E_Color1', 'Rock_2_F_Color1',
  'Rock_3_A_Color1', 'Rock_3_B_Color1', 'Rock_3_C_Color1', 'Rock_3_D_Color1', 'Rock_3_E_Color1', 'Rock_3_F_Color1',
  'rock_single_A', 'rock_single_B', 'rock_single_C', 'rock_single_D', 'rock_single_E',
];

const WATER_PLANT_POOL = ['waterplant_A', 'waterplant_B', 'waterplant_C', 'waterlily_A', 'waterlily_B'];

const PROP_POOL = [
  'coin_stack_large', 'sack', 'barrel_small', 'barrel_large',
  'Pallet_Wood', 'Pallet_Wood_Covered_A', 'Pallet_Wood_Covered_B',
  'flag_blue', 'wheelbarrow',
];

const RESOURCE_POOL = [
  'Wood_Log_Stack', 'Wood_Log_A', 'Wood_Log_B', 'Wood_Planks_Stack_Large', 'resource_lumber',
  'Iron_Nuggets', 'Iron_Nugget_Large', 'Iron_Bars_Stack_Small',
  'Stone_Bricks_Stack_Medium', 'Stone_Bricks_Stack_Large', 'Stone_Chunks_Large', 'Stone_Brick', 'resource_stone',
  'Fuel_B_Barrel', 'Fuel_B_Barrel_Dirty', 'Fuel_B_Barrels', 'Fuel_A_Barrel',
  'crate_A_big', 'crate_A_small', 'crate_long_A', 'rope_bundle_A', 'bucket_water',
  'sand_A', 'sand_B', 'hex_coast_A',
];

function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, Math.min(n, shuffled.length));
}

// ── Generate cells ──
const cells = [];

// 1. Water cells
cells.push(...waterCells);

// 2. Thornwick settlement (expanded)
const thornwickCells = [
  { q: 1,  r: -1, env: ['hex_road_A'], occ: 'building_castle_blue', label: "Lord's Great Hall", occScale: 1.0 },
  { q: 1,  r: 0,  env: [], occ: 'building_blacksmith_blue', label: 'Smithy', occScale: 1.0 },
  { q: 1,  r: 1,  env: [], occ: 'building_church_blue', label: 'Chapel of St. Cuthbert', occScale: 1.0 },
  { q: -1, r: 1,  env: ['hex_road_A'], occ: 'building_market_blue', label: 'Granary', occScale: 1.0 },
  { q: -1, r: 2,  env: ['hex_road_A'], occ: 'building_tower_base_blue', label: 'Kiln', occScale: 0.9 },
  { q: -2, r: 1,  env: [], occ: 'building_home_B_blue', label: 'Tannery', occScale: 0.9 },
  { q: -2, r: 2,  env: ['hex_road_A'], occ: null, label: 'Thornwick Village' },
  { q: 0,  r: -1, env: [], occ: 'building_tavern_blue', label: 'Brewery', occScale: 1.0 },
  { q: 2,  r: -1, env: ['hex_road_A'], occ: 'building_home_A_blue', label: 'Demesne Barn', occScale: 0.9 },
  { q: 2,  r: 0,  env: ['hex_road_A'], occ: null, label: 'Thornwick Market' },
  { q: -2, r: 0,  env: ['hex_road_A'], occ: null },
  { q: 0,  r: -2, env: [], occ: null },
  { q: 2,  r: -2, env: ['hex_road_A'], occ: null },
  { q: -3, r: 1,  env: [], occ: null },
  { q: 3,  r: -1, env: [], occ: null },
  { q: -1, r: -2, env: [], occ: null },
  { q: 3,  r: 0,  env: ['hex_road_A'], occ: null },
  { q: -3, r: 0,  env: [], occ: null },
  { q: -3, r: 2,  env: [], occ: null },
  { q: 3,  r: 1,  env: [], occ: null },
  // Extra Thornwick blocks
  { q: 4,  r: -2, env: ['hex_road_A'], occ: null },
  { q: -4, r: 1,  env: [], occ: null },
  { q: 4,  r: 1,  env: [], occ: null },
  { q: -4, r: 2,  env: [], occ: null },
];

thornwickCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome: 'thornwick', env: c.env || [], occ: c.occ || null, label: c.label || undefined, occScale: c.occScale || undefined });
  }
});

// 3. Millthorpe (expanded)
const millthorpeCells = [
  { q: -1, r: -2, env: [], occ: 'building_lumbermill_blue', label: 'Sawmill', occScale: 0.9 },
  { q: -1, r: -3, env: ['Wood_Log_Stack', 'Wood_Log_A'], occ: null, label: 'Millthorpe' },
  { q: -2, r: -2, env: ['Wood_Log_A', 'Wood_Log_B'], occ: null },
  { q: -2, r: -3, env: ['Wood_Planks_Stack_Large', 'resource_lumber'], occ: null },
  { q: -3, r: -3, env: ['Wood_Log_Stack', 'Wood_Log_A'], occ: null },
  { q: -3, r: -2, env: ['trees_A_medium', 'trees_A_small'], occ: null },
  { q: -4, r: -3, env: ['Wood_Log_B', 'resource_lumber'], occ: null },
  { q: -4, r: -2, env: ['Wood_Planks_Stack_Large', 'Wood_Log_Stack'], occ: null },
  // New Millthorpe expansion
  { q: -5, r: -3, env: ['Wood_Log_A', 'Wood_Log_B'], occ: null },
  { q: -5, r: -2, env: ['trees_A_large', 'trees_B_medium'], occ: null },
  { q: -4, r: -4, env: ['Wood_Planks_Stack_Large', 'resource_lumber'], occ: null },
  { q: -2, r: -4, env: ['Wood_Log_Stack', 'resource_lumber'], occ: null },
];

millthorpeCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome: 'valley_floor', env: c.env || [], occ: c.occ || null, label: c.label || undefined, occScale: c.occScale || undefined });
  }
});

// 4. Field packs (36 packs — doubled from 18)
const fieldPacks = [
  // ── Original 18 packs ──
  { packId: 'demesne_grain_1', cropType: 'grain', label: "Lord's Demesne — Wheat", cells: [
    { q: -3, r: -1 }, { q: -3, r: 0 }, { q: -2, r: 0 }, { q: -2, r: -1 }, { q: -1, r: -2 }, { q: -2, r: -2 },
  ]},
  { packId: 'valley_grain_1', cropType: 'grain', label: 'Valley Grain Fields', cells: [
    { q: 2, r: 0 }, { q: 2, r: 1 }, { q: 1, r: 2 }, { q: 2, r: 2 },
  ]},
  { packId: 'valley_fallow_1', cropType: 'fallow', label: 'Fallow Fields', cells: [
    { q: -1, r: 3 }, { q: 0, r: 4 }, { q: -1, r: 4 },
  ]},
  { packId: 'valley_grain_2', cropType: 'grain', label: 'Barley Fields', cells: [
    { q: 1, r: 5 }, { q: 2, r: 5 }, { q: 1, r: 6 },
  ]},
  { packId: 'thornwick_gardens', cropType: 'grain', label: 'Thornwick Gardens', cells: [
    { q: 2, r: -2 }, { q: 3, r: -2 },
  ]},
  { packId: 'grey_hills_pasture', cropType: 'pasture', label: 'Hill Pasture', cells: [
    { q: 3, r: 2 }, { q: 4, r: 2 }, { q: 3, r: 3 }, { q: 4, r: 3 },
  ]},
  { packId: 'eastweald_grain_1', cropType: 'grain', label: 'East Weald Cornfields', cells: [
    { q: 5, r: 0 }, { q: 5, r: 1 }, { q: 6, r: 0 }, { q: 6, r: 1 }, { q: 5, r: 2 },
  ]},
  { packId: 'northdowns_pasture', cropType: 'pasture', label: 'North Downs Sheep Walk', cells: [
    { q: -4, r: -4 }, { q: -4, r: -3 }, { q: -5, r: -3 }, { q: -5, r: -2 },
  ]},
  { packId: 'valley_fallow_2', cropType: 'fallow', label: 'Lower Fallows', cells: [
    { q: 2, r: 4 }, { q: 3, r: 4 }, { q: 2, r: 5 },
  ]},
  { packId: 'westwood_meadow', cropType: 'pasture', label: 'Westwood Meadow', cells: [
    { q: -5, r: 1 }, { q: -5, r: 2 }, { q: -4, r: 1 }, { q: -4, r: 2 },
  ]},
  { packId: 'valley_grain_3', cropType: 'grain', label: 'South Valley Grain', cells: [
    { q: 3, r: 5 }, { q: 3, r: 6 }, { q: 4, r: 5 }, { q: 4, r: 6 }, { q: 4, r: 7 },
  ]},
  { packId: 'thornwick_gardens_2', cropType: 'grain', label: 'Millthorpe Gardens', cells: [
    { q: -3, r: -4 }, { q: -3, r: -3 }, { q: -2, r: -5 }, { q: -2, r: -4 },
  ]},
  { packId: 'north_grain_1', cropType: 'grain', label: 'Northern Wheatfields', cells: [
    { q: -2, r: -6 }, { q: -2, r: -5 }, { q: -1, r: -6 }, { q: -1, r: -5 },
  ]},
  { packId: 'grey_hills_fallow', cropType: 'fallow', label: 'Hill Fallow', cells: [
    { q: 5, r: 3 }, { q: 5, r: 4 }, { q: 6, r: 3 }, { q: 6, r: 4 },
  ]},
  { packId: 'eastweald_pasture', cropType: 'pasture', label: 'East Pasture', cells: [
    { q: 7, r: 1 }, { q: 7, r: 2 }, { q: 8, r: 1 }, { q: 8, r: 2 },
  ]},
  { packId: 'southmarsh_grain', cropType: 'grain', label: 'Marsh Edge Fields', cells: [
    { q: -2, r: 9 }, { q: -2, r: 10 }, { q: -1, r: 10 }, { q: -1, r: 11 },
  ]},
  { packId: 'valley_grain_4', cropType: 'grain', label: 'Riverbend Fields', cells: [
    { q: 2, r: 7 }, { q: 2, r: 8 }, { q: 3, r: 7 }, { q: 3, r: 8 },
  ]},
  { packId: 'northdowns_fallow', cropType: 'fallow', label: 'Downs Fallow', cells: [
    { q: -5, r: -5 }, { q: -5, r: -4 }, { q: -6, r: -4 },
  ]},
  // ── 18 NEW packs (doubling) ──
  { packId: 'far_north_grain_1', cropType: 'grain', label: 'High Moor Barley', cells: [
    { q: -3, r: -10 }, { q: -3, r: -9 }, { q: -2, r: -10 }, { q: -2, r: -9 },
  ]},
  { packId: 'far_north_fallow_1', cropType: 'fallow', label: 'High Moor Fallow', cells: [
    { q: -4, r: -8 }, { q: -4, r: -7 }, { q: -3, r: -8 }, { q: -3, r: -7 },
  ]},
  { packId: 'far_north_pasture_1', cropType: 'pasture', label: 'North Ridge Pasture', cells: [
    { q: -6, r: -9 }, { q: -6, r: -8 }, { q: -5, r: -9 }, { q: -5, r: -8 },
  ]},
  { packId: 'west_deep_grain', cropType: 'grain', label: 'Deep Westwood Fields', cells: [
    { q: -8, r: -1 }, { q: -8, r: 0 }, { q: -7, r: -1 }, { q: -7, r: 0 }, { q: -8, r: 1 },
  ]},
  { packId: 'west_deep_fallow', cropType: 'fallow', label: 'Western Fallow', cells: [
    { q: -9, r: 1 }, { q: -9, r: 2 }, { q: -8, r: 2 }, { q: -8, r: 3 },
  ]},
  { packId: 'south_valley_grain_5', cropType: 'grain', label: 'Great South Fields', cells: [
    { q: 2, r: 11 }, { q: 2, r: 12 }, { q: 3, r: 11 }, { q: 3, r: 12 }, { q: 3, r: 13 },
  ]},
  { packId: 'south_valley_fallow', cropType: 'fallow', label: 'South Fallow', cells: [
    { q: -2, r: 13 }, { q: -2, r: 14 }, { q: -1, r: 13 }, { q: -1, r: 14 },
  ]},
  { packId: 'south_valley_pasture', cropType: 'pasture', label: 'Southfen Pasture', cells: [
    { q: 2, r: 13 }, { q: 2, r: 14 }, { q: 3, r: 14 }, { q: 3, r: 15 },
  ]},
  { packId: 'far_east_grain_1', cropType: 'grain', label: 'Eastern Plains Grain', cells: [
    { q: 9, r: -2 }, { q: 9, r: -1 }, { q: 10, r: -2 }, { q: 10, r: -1 },
  ]},
  { packId: 'far_east_pasture', cropType: 'pasture', label: 'Eastern Sheep Run', cells: [
    { q: 11, r: -1 }, { q: 11, r: 0 }, { q: 12, r: -1 }, { q: 12, r: 0 }, { q: 11, r: 1 },
  ]},
  { packId: 'far_east_fallow', cropType: 'fallow', label: 'East Fallow Ground', cells: [
    { q: 10, r: 1 }, { q: 10, r: 2 }, { q: 11, r: 2 }, { q: 11, r: 3 },
  ]},
  { packId: 'deep_south_grain_1', cropType: 'grain', label: 'Delta Grain Fields', cells: [
    { q: 2, r: 20 }, { q: 2, r: 21 }, { q: 3, r: 20 }, { q: 3, r: 21 }, { q: 3, r: 22 },
  ]},
  { packId: 'deep_south_fallow_1', cropType: 'fallow', label: 'Delta Fallow', cells: [
    { q: -2, r: 20 }, { q: -2, r: 21 }, { q: -3, r: 20 }, { q: -3, r: 21 },
  ]},
  { packId: 'deep_south_pasture_1', cropType: 'pasture', label: 'Delta Meadow', cells: [
    { q: -2, r: 16 }, { q: -2, r: 17 }, { q: -3, r: 16 }, { q: -3, r: 17 },
  ]},
  { packId: 'far_south_grain_1', cropType: 'grain', label: 'Lower Marsh Grain', cells: [
    { q: 2, r: 27 }, { q: 2, r: 28 }, { q: 3, r: 27 }, { q: 3, r: 28 },
  ]},
  { packId: 'far_south_fallow_1', cropType: 'fallow', label: 'Lower Marsh Fallow', cells: [
    { q: -2, r: 27 }, { q: -2, r: 28 }, { q: -3, r: 27 }, { q: -3, r: 28 },
  ]},
  { packId: 'far_south_pasture_1', cropType: 'pasture', label: 'River Mouth Pasture', cells: [
    { q: 2, r: 33 }, { q: 2, r: 34 }, { q: 3, r: 33 }, { q: 3, r: 34 }, { q: 3, r: 35 },
  ]},
  { packId: 'far_south_grain_2', cropType: 'grain', label: 'Estuary Barley', cells: [
    { q: -2, r: 33 }, { q: -2, r: 34 }, { q: -3, r: 33 }, { q: -3, r: 34 },
  ]},
];

// Add field pack cells
fieldPacks.forEach(pack => {
  pack.cells.forEach(c => {
    if (!isUsed(c.q, c.r)) {
      markUsed(c.q, c.r);
      const biome = 
        c.r >= 25 ? 'southmarsh' :
        c.r >= 13 ? 'saltwick' :
        c.r >= 9 ? 'southmarsh' :
        c.q >= 9 ? 'eastweald' :
        c.q >= 7 ? 'eastweald' :
        c.q >= 4 && c.r >= 3 ? 'grey_hills' :
        c.q <= -7 ? 'westwood' :
        c.q <= -5 && c.r >= -2 ? 'westwood' :
        c.q <= -5 ? 'northdowns' :
        c.q <= -4 ? 'northdowns' :
        c.r <= -8 ? 'northdowns' :
        'valley_floor';
      const env = [];
      if (rng() < 0.5) env.push('fence_wood_straight');
      if (rng() < 0.2) env.push('fence_wood_straight_gate');
      if (rng() < 0.3) env.push(pack.cropType === 'pasture' ? 'Pallet_Wood_Covered_A' : 'sack');
      cells.push({ q: c.q, r: c.r, tileType: 'grass', biome, env, occ: null, packId: pack.packId, cropType: pack.cropType });
    }
  });
});

// 5. Westwood (expanded — larger western forest)
for (let q = -12; q <= -3; q++) {
  for (let r = -8; r <= 8; r++) {
    if (!isUsed(q, r) && Math.abs(q + r * 0.5) < 11 && Math.abs(r) < 9) {
      markUsed(q, r);
      const envCount = 1 + Math.floor(rng() * 2);
      const env = [];
      for (let i = 0; i < envCount; i++) {
        if (rng() < 0.6) env.push(pick(TREE_POOL));
        else if (rng() < 0.8) env.push(pick(BUSH_POOL));
        else env.push(pick(ROCK_POOL));
      }
      const label = (q === -6 && r === 0) ? 'The Westwood' : undefined;
      cells.push({ q, r, tileType: 'grass', biome: 'westwood', env, occ: null, label });
    }
  }
}

// 6. Grey Hills (expanded further east)
for (let q = 3; q <= 14; q++) {
  for (let r = -6; r <= 10; r++) {
    if (!isUsed(q, r) && Math.abs(q + r * 0.5) < 16 && Math.abs(r) < 11) {
      markUsed(q, r);
      const envCount = 1 + Math.floor(rng() * 2);
      const env = [];
      for (let i = 0; i < envCount; i++) {
        if (rng() < 0.7) env.push(pick(ROCK_POOL));
        else if (rng() < 0.85) env.push(pick(RESOURCE_POOL.filter(k => k.startsWith('Iron_') || k.startsWith('Stone_'))));
        else env.push(pick(TREE_POOL));
      }
      const label = (q === 3 && r === 0) ? 'The Grey Hills' : undefined;
      cells.push({ q, r, tileType: 'grass', biome: 'grey_hills', env, occ: null, label });
    }
  }
}

// 7. Southmarsh (expanded further south)
for (let q = -7; q <= 7; q++) {
  for (let r = 6; r <= 24; r++) {
    if (!isUsed(q, r) && Math.abs(q + r * 0.5) < 10 && r >= 6) {
      markUsed(q, r);
      const envCount = 1 + Math.floor(rng() * 2);
      const env = [];
      for (let i = 0; i < envCount; i++) {
        if (rng() < 0.6) env.push(pick(WATER_PLANT_POOL));
        else if (rng() < 0.8) env.push(pick(['Fuel_B_Barrel', 'Fuel_B_Barrel_Dirty', 'Fuel_B_Barrels']));
        else env.push(pick(PROP_POOL));
      }
      const label = (q === -1 && r === 6) ? 'The Southmarsh' : (q === -1 && r === 7) ? 'Peat Beds' : undefined;
      cells.push({ q, r, tileType: 'grass', biome: 'southmarsh', env, occ: null, label });
    }
  }
}

// 8. Saltwick Cove (expanded — larger coastal area)
const saltwickCells = [
  { q: -1, r: 7,  env: ['sand_A', 'sand_B'], occ: null, label: 'Saltwick Cove' },
  { q: -2, r: 7,  env: ['sand_A'], occ: null },
  { q: 1,  r: 7,  env: ['sand_B', 'hex_coast_A'], occ: null },
  { q: 0,  r: 8,  env: ['barrel_large', 'crate_A_big', 'rope_bundle_A'], occ: 'building_stage_A', label: 'Dock', occScale: 0.8 },
  { q: -1, r: 8,  env: ['Fuel_A_Barrel', 'bucket_water'], occ: null, label: 'Salt Pans' },
  { q: 1,  r: 8,  env: ['crate_long_A', 'crate_A_small'], occ: null },
  { q: 2,  r: 7,  env: ['flag_blue', 'barrel_small'], occ: null },
  { q: 0,  r: 9,  env: ['coin_stack_large', 'sack'], occ: null, label: 'Coastwatch' },
  { q: -2, r: 8,  env: ['barrel_small', 'barrel_small'], occ: null },
  { q: -3, r: 7,  env: ['sand_A', 'sand_B'], occ: null },
  { q: -3, r: 8,  env: ['sand_A', 'flag_blue'], occ: null },
  { q: 2,  r: 8,  env: ['sand_B', 'crate_A_small'], occ: null },
  { q: 1,  r: 9,  env: ['coin_stack_large', 'barrel_small'], occ: null },
  { q: -1, r: 9,  env: ['sand_A', 'bucket_water'], occ: null },
  { q: -4, r: 9,  env: ['sand_A', 'sand_B', 'flag_blue'], occ: null, label: "Fisherman's Bay" },
  { q: -4, r: 10, env: ['sand_B', 'crate_long_A'], occ: null },
  { q: -3, r: 10, env: ['sand_A', 'barrel_small'], occ: null },
  { q: -2, r: 10, env: ['sand_A', 'bucket_water'], occ: null },
  { q: 3,  r: 9,  env: ['sand_B', 'flag_blue', 'crate_A_big'], occ: null },
  { q: 3,  r: 10, env: ['sand_B', 'barrel_large'], occ: null },
  { q: 2,  r: 10, env: ['sand_A', 'coin_stack_large'], occ: null },
  // New saltwick expansion
  { q: -5, r: 9,  env: ['sand_A', 'flag_blue'], occ: null },
  { q: -5, r: 10, env: ['sand_B', 'barrel_small'], occ: null },
  { q: 4,  r: 9,  env: ['sand_A', 'crate_A_big'], occ: null },
  { q: 4,  r: 10, env: ['sand_B', 'rope_bundle_A'], occ: null },
  { q: -4, r: 11, env: ['sand_A', 'barrel_small'], occ: null },
  { q: -3, r: 11, env: ['sand_B', 'bucket_water'], occ: null },
  { q: 3,  r: 11, env: ['sand_A', 'crate_A_small'], occ: null },
  { q: 2,  r: 11, env: ['sand_B', 'flag_blue'], occ: null },
  { q: -5, r: 11, env: ['sand_A', 'sand_B'], occ: null, label: 'Far Shore' },
  { q: 4,  r: 11, env: ['sand_A', 'barrel_large'], occ: null },
  { q: 5,  r: 10, env: ['sand_B', 'crate_long_A'], occ: null },
  { q: -6, r: 10, env: ['sand_A', 'flag_blue'], occ: null },
];

saltwickCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome: 'saltwick', env: c.env || [], occ: c.occ || null, label: c.label || undefined, occScale: c.occScale || undefined });
  }
});

// 9. East Weald (expanded further east)
for (let q = 7; q <= 16; q++) {
  for (let r = -7; r <= 6; r++) {
    if (!isUsed(q, r) && Math.abs(q + r * 0.5) < 18 && Math.abs(r) < 8) {
      markUsed(q, r);
      const envCount = 1 + Math.floor(rng() * 2);
      const env = [];
      for (let i = 0; i < envCount; i++) {
        if (rng() < 0.5) env.push(pick(TREE_POOL));
        else if (rng() < 0.7) env.push(pick(BUSH_POOL));
        else env.push(pick(ROCK_POOL));
      }
      const label = (q === 8 && r === -1) ? 'East Weald' : undefined;
      cells.push({ q, r, tileType: 'grass', biome: 'eastweald', env, occ: null, label });
    }
  }
}

// 10. North Downs (expanded further north)
for (let q = -12; q <= -3; q++) {
  for (let r = -14; r <= -7; r++) {
    if (!isUsed(q, r)) {
      markUsed(q, r);
      const env = [pick(ROCK_POOL)];
      if (rng() < 0.5) env.push(pick(BUSH_POOL));
      const label = (q === -5 && r === -9) ? 'North Downs' : undefined;
      cells.push({ q, r, tileType: 'grass', biome: 'northdowns', env, occ: null, label });
    }
  }
}

// 11. Hillend (expanded)
const hillendCells = [
  { q: 5,  r: 1,  env: ['Iron_Nuggets', 'Iron_Nugget_Large', 'Iron_Bars_Stack_Small'], occ: null, label: 'Hillend — Ore Outcrop' },
  { q: 5,  r: 2,  env: ['Stone_Bricks_Stack_Medium', 'resource_stone'], occ: 'building_mine_blue', label: 'Smelter', occScale: 0.9 },
  { q: 6,  r: 0,  env: ['Stone_Chunks_Large', 'Stone_Bricks_Stack_Large'], occ: 'building_mine_green', label: 'Quarry', occScale: 0.9 },
  { q: 6,  r: 1,  env: ['Stone_Brick', 'Rock_3_E_Color1'], occ: null },
  { q: 7,  r: 0,  env: ['Stone_Chunks_Large', 'Iron_Nuggets'], occ: null },
  { q: 7,  r: 1,  env: ['resource_stone', 'Stone_Brick'], occ: null },
  { q: 5,  r: 0,  env: ['Iron_Bars_Stack_Small', 'rock_single_A'], occ: null },
  { q: 6,  r: 2,  env: ['Stone_Bricks_Stack_Large', 'Iron_Nuggets'], occ: null },
  { q: 8,  r: 0,  env: ['Stone_Chunks_Large', 'resource_stone'], occ: null },
  { q: 8,  r: 1,  env: ['Rock_3_D_Color1', 'Iron_Bars_Stack_Small'], occ: null },
  // New Hillend expansion
  { q: 9,  r: -1, env: ['Iron_Nuggets', 'Iron_Nugget_Large'], occ: null },
  { q: 9,  r: 0,  env: ['Stone_Chunks_Large', 'resource_stone'], occ: null },
  { q: 10, r: -1, env: ['Rock_2_D_Color1', 'Iron_Bars_Stack_Small'], occ: null },
  { q: 10, r: 0,  env: ['Stone_Bricks_Stack_Medium', 'resource_stone'], occ: null },
];

hillendCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome: 'grey_hills', env: c.env || [], occ: c.occ || null, label: c.label || undefined, occScale: c.occScale || undefined });
  }
});

// 12. Far south delta settlements
const deltaCells = [
  { q: -3, r: 15, env: ['waterplant_A', 'Fuel_B_Barrel'], occ: null, label: 'Lower Marsh' },
  { q: -3, r: 18, env: ['waterplant_B', 'Fuel_B_Barrel_Dirty'], occ: null },
  { q: -3, r: 22, env: ['waterplant_A', 'Fuel_B_Barrels'], occ: null, label: 'Deep Marsh' },
  { q: -3, r: 25, env: ['sand_A', 'flag_blue'], occ: 'building_stage_A', label: 'South Dock', occScale: 0.8 },
  { q: -3, r: 29, env: ['waterplant_C', 'Fuel_B_Barrel'], occ: null },
  { q: -3, r: 32, env: ['sand_B', 'crate_A_big'], occ: null, label: 'Eastern Delta' },
  { q: -3, r: 36, env: ['waterplant_A', 'sand_A'], occ: null },
  { q: -3, r: 39, env: ['sand_B', 'barrel_large'], occ: null, label: 'South Shore' },
  { q: -3, r: 42, env: ['sand_A', 'flag_blue'], occ: null },
  { q: -3, r: 45, env: ['sand_B', 'rope_bundle_A'], occ: null, label: "River's End" },
  { q: 3,  r: 16, env: ['waterplant_B', 'Fuel_B_Barrel'], occ: null },
  { q: 3,  r: 19, env: ['waterplant_A', 'Fuel_B_Barrels'], occ: null, label: 'Fen Edge' },
  { q: 3,  r: 23, env: ['sand_A', 'barrel_small'], occ: null },
  { q: 3,  r: 26, env: ['sand_B', 'crate_long_A'], occ: null },
  { q: 3,  r: 30, env: ['waterplant_C', 'Fuel_B_Barrel_Dirty'], occ: null },
  { q: 3,  r: 37, env: ['sand_A', 'flag_blue'], occ: null },
  { q: 3,  r: 43, env: ['sand_B', 'bucket_water'], occ: null },
  { q: 3,  r: 46, env: ['sand_A', 'coin_stack_large'], occ: null },
];

deltaCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome: 'southmarsh', env: c.env || [], occ: c.occ || null, label: c.label || undefined, occScale: c.occScale || undefined });
  }
});

// 13. Road network (expanded fully)
const roadCells = [
  // Original roads
  { q: -2, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 },
  { q: 2, r: -2 }, { q: 1, r: -2 },
  { q: -2, r: 1 }, { q: -2, r: 2 }, { q: -2, r: 3 }, { q: -2, r: 4 },
  { q: 1, r: 4 }, { q: 2, r: 3 }, { q: 2, r: 4 },
  { q: 3, r: 3 }, { q: 3, r: 4 },
  { q: 3, r: -1 }, { q: 4, r: -1 },
  { q: -3, r: 0 }, { q: -3, r: 1 },
  { q: 4, r: 0 }, { q: 4, r: 1 },
  { q: 5, r: 0 }, { q: 5, r: 1 },
  { q: -2, r: -1 }, { q: -2, r: -2 },
  { q: 0, r: -2 }, { q: 0, r: -3 },
  { q: -1, r: 5 }, { q: -1, r: 6 },
  { q: 0, r: 7 }, { q: 0, r: 8 },
  { q: -3, r: 5 }, { q: -3, r: 6 },
  { q: 3, r: 5 }, { q: 4, r: 5 },
  { q: -4, r: -2 }, { q: -4, r: -1 },
  { q: 6, r: -1 }, { q: 6, r: 0 },
  { q: -3, r: -2 }, { q: -3, r: -3 },
  { q: -4, r: 0 }, { q: -4, r: 1 },
  { q: -4, r: 2 }, { q: -5, r: 2 },
  { q: 5, r: 2 }, { q: 6, r: 2 },
  { q: 7, r: -1 }, { q: 7, r: 0 },
  { q: -2, r: 5 }, { q: -2, r: 6 },
  { q: -3, r: 7 }, { q: -3, r: 8 },
  { q: 2, r: 6 }, { q: 3, r: 6 },
  { q: 4, r: 6 }, { q: 4, r: 7 },
  { q: -5, r: -1 }, { q: -5, r: 0 },
  { q: -6, r: -2 }, { q: -6, r: -1 },
  { q: 8, r: -1 }, { q: 8, r: 0 },
  { q: 9, r: 0 }, { q: 9, r: 1 },
  { q: -4, r: 6 }, { q: -4, r: 7 },
  { q: -3, r: 9 }, { q: -2, r: 9 },
  { q: 0, r: 10 }, { q: 0, r: 11 },
  { q: 5, r: 5 }, { q: 5, r: 6 },
  // New expanded roads (2nd doubling)
  { q: -6, r: 0 }, { q: -6, r: 1 },
  { q: -7, r: -1 }, { q: -7, r: 0 },
  { q: 10, r: 0 }, { q: 10, r: 1 },
  { q: 11, r: -1 }, { q: 11, r: 0 },
  { q: -5, r: -6 }, { q: -5, r: -5 },
  { q: -6, r: -5 }, { q: -6, r: -4 },
  { q: 0, r: -5 }, { q: 0, r: -4 },
  { q: -1, r: -8 }, { q: -1, r: -9 },
  { q: -3, r: -7 }, { q: -3, r: -6 },
  { q: -2, r: 11 }, { q: -2, r: 12 },
  { q: -3, r: 12 }, { q: -3, r: 13 },
  { q: 2, r: 9 }, { q: 2, r: 10 },
  { q: 3, r: 9 }, { q: 3, r: 10 },
  { q: -2, r: 14 }, { q: -2, r: 15 },
  { q: 2, r: 15 }, { q: 2, r: 16 },
  { q: -3, r: 16 }, { q: -3, r: 17 },
  { q: 3, r: 17 }, { q: 3, r: 18 },
  { q: -4, r: 18 }, { q: -4, r: 19 },
  { q: 4, r: 19 }, { q: 4, r: 20 },
  { q: -4, r: 22 }, { q: -4, r: 23 },
  { q: 4, r: 23 }, { q: 4, r: 24 },
  { q: -5, r: 25 }, { q: -4, r: 25 },
  { q: 4, r: 26 }, { q: 5, r: 26 },
  { q: -4, r: 28 }, { q: -5, r: 28 },
  { q: 4, r: 30 }, { q: 4, r: 31 },
  { q: -5, r: 31 }, { q: -5, r: 32 },
  { q: 4, r: 35 }, { q: 4, r: 36 },
  { q: -5, r: 36 }, { q: -5, r: 37 },
  { q: 4, r: 40 }, { q: 4, r: 41 },
  { q: -5, r: 40 }, { q: -5, r: 41 },
  { q: 4, r: 44 }, { q: 4, r: 45 },
  { q: -5, r: 44 }, { q: -5, r: 45 },
];

roadCells.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    const biome = 
      c.r >= 28 ? 'southmarsh' :
      c.r >= 13 ? 'saltwick' :
      c.r >= 9 ? 'southmarsh' :
      c.r >= 6 ? 'southmarsh' :
      c.r >= 3 ? 'valley_floor' :
      c.q >= 8 ? 'grey_hills' :
      c.q >= 5 ? 'grey_hills' :
      c.q >= 3 ? 'grey_hills' :
      c.q <= -6 ? 'westwood' :
      c.q <= -4 ? 'westwood' :
      c.r <= -6 ? 'northdowns' :
      'thornwick';
    cells.push({ q: c.q, r: c.r, tileType: 'road', biome, env: [], occ: null });
  }
});

// 14. Clouds (expanded — more atmospheric coverage)
const cloudPositions = [
  // Original clouds
  { q: 0,  r: -1 }, { q: -3, r: -2 }, { q: 4,  r: 0 },
  { q: 5,  r: 1 },  { q: -1, r: 7 },  { q: -2, r: 4 },
  { q: -5, r: -2 }, { q: -5, r: 0 },  { q: 6,  r: -1 },
  { q: 7,  r: 0 },  { q: -4, r: 5 },  { q: 3,  r: 5 },
  { q: -6, r: -3 }, { q: -6, r: 2 },  { q: 8,  r: 1 },
  { q: 9,  r: 2 },  { q: -2, r: 7 },  { q: 1,  r: 11 },
  { q: 5,  r: 7 },  { q: 6,  r: 5 },  { q: -5, r: 4 },
  { q: -7, r: 0 },  { q: 4,  r: 8 },  { q: -3, r: 10 },
  { q: -1, r: 12 }, { q: 2,  r: 10 },
  // New clouds — far north
  { q: -4, r: -11 }, { q: -5, r: -12 }, { q: -7, r: -9 },
  { q: -2, r: -12 }, { q: -8, r: -10 }, { q: 0,  r: -11 },
  { q: -9, r: -7 },  { q: -10, r: -5 }, { q: -11, r: -3 },
  // New clouds — far east
  { q: 10, r: -3 }, { q: 11, r: -2 }, { q: 12, r: 0 },
  { q: 13, r: 1 },  { q: 12, r: 3 },  { q: 11, r: 4 },
  { q: 14, r: -1 }, { q: 15, r: 0 },
  // New clouds — far south
  { q: -4, r: 15 }, { q: 3,  r: 16 }, { q: -3, r: 19 },
  { q: 4,  r: 22 }, { q: -4, r: 24 }, { q: 3,  r: 25 },
  { q: -3, r: 30 }, { q: 4,  r: 32 }, { q: -4, r: 35 },
  { q: 3,  r: 38 }, { q: -4, r: 41 }, { q: 4,  r: 44 },
  { q: -5, r: 46 }, { q: 5,  r: 47 },
];

cloudPositions.forEach(c => {
  if (!isUsed(c.q, c.r)) {
    markUsed(c.q, c.r);
    const biome = 
      c.r >= 30 ? 'southmarsh' :
      c.r >= 13 ? 'saltwick' :
      c.r >= 6 ? 'southmarsh' :
      c.q >= 8 ? 'grey_hills' :
      c.q <= -7 ? 'northdowns' :
      c.q <= -4 ? 'westwood' :
      'thornwick';
    const env = rng() < 0.3 ? ['cloud_big', 'cloud_big'] : ['cloud_big'];
    cells.push({ q: c.q, r: c.r, tileType: 'grass', biome, env, occ: null });
  }
});

// ── Sort cells by q, r ──
cells.sort((a, b) => a.r - b.r || a.q - b.q);

// ── Generate output ──
function generateOutput() {
  let out = `/**
 * Thronwick Kingdom — Complete Hex Grid World Data
 * Auto-generated by scripts/generateWorld.js
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
 * CELLS — the complete hex grid for Thronwick (2x doubled).
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
console.error(`Generated ${cells.length} cells, ${waterCells.length} water tiles, ${fieldPacks.length} field packs`);
