/**
 * Thronwick Kingdom — Complete Hex Grid World Data
 * Based on 3d_thronwick_grammar.json and thornwick.json
 *
 * Axial coordinates (q, r). Pointy-top hexagons.
 * Layer 0: Tile type (grass, river, road)
 * Layer 1: Environment props (0-3 per cell)
 * Layer 2: Occupant (0-1 per cell, exclusive with L1)
 */
export const HEX_W = 1.82;
export const HEX_H = 1.575;

export function axialToWorld(q, r) {
  return { x: HEX_W * (q + r * 0.5), z: HEX_H * r };
}

/** Convert axial coords to a unique cell key */
export function cellKey(q, r) { return `${q},${r}`; }

/**
 * Biome definitions — each zone's chromatic identity
 */
export const BIOMES = {
  thornwick: {
    name: 'Thornwick',
    color: 0xc0a050,
    labelColor: '#c0d8e8',
    tileColor: 0x4a7a3a,
    desc: 'Central settlement of the kingdom'
  },
  valley_floor: {
    name: 'The Valley Floor',
    color: 0x4a9a3a,
    labelColor: '#4a9a3a',
    tileColor: 0x3a7a3a,
    desc: 'Deep alluvial loam — grain cultivation'
  },
  westwood: {
    name: 'The Westwood',
    color: 0x2a6a2a,
    labelColor: '#2a6a2a',
    tileColor: 0x2a5a2a,
    desc: 'Managed broadleaf woodland'
  },
  grey_hills: {
    name: 'The Grey Hills',
    color: 0x7a6a4a,
    labelColor: '#7a6a4a',
    tileColor: 0x6a5a4a,
    desc: 'Limestone-and-ironstone ridge'
  },
  southmarsh: {
    name: 'The Southmarsh',
    color: 0x3a7aba,
    labelColor: '#3a7aba',
    tileColor: 0x3a6a5a,
    desc: 'Reed beds and peat bogs'
  },
  saltwick: {
    name: 'Saltwick Cove',
    color: 0x8a7a5a,
    labelColor: '#8a7a5a',
    tileColor: 0x7a6a4a,
    desc: 'Sheltered shingle beach'
  }
};

/**
 * CELLS — the complete hex grid for Thronwick.
 * Each cell: { q, r, tileType, biome, env, occ, label, occScale, occRotY }
 *
 * tileType: 'grass' | 'river' | 'road'
 * env: array of asset keys for Layer 1 (0-3 items)
 * occ: asset key for Layer 2 occupant (null if none)
 */
export const CELLS = [
  // ═══════════════════════════════════════════════════════
  // THORNWICK — Central settlement cluster (q: -1..2, r: -1..2)
  // ═══════════════════════════════════════════════════════
  { q: 0,  r: 0,  tileType: 'grass', biome: 'thornwick', env: ['hex_road_A', 'hex_road_A'], occ: 'building_castle_blue', label: "Lord's Great Hall", occScale: 1.0 },
  { q: 1,  r: -1, tileType: 'grass', biome: 'thornwick', env: ['hex_road_A'], occ: 'building_tavern_blue', label: 'Brewery', occScale: 1.0 },
  { q: 1,  r: 0,  tileType: 'grass', biome: 'thornwick', env: [], occ: 'building_blacksmith_blue', label: 'Smithy', occScale: 1.0 },
  { q: 0,  r: 1,  tileType: 'grass', biome: 'thornwick', env: [], occ: 'building_church_blue', label: 'Chapel of St. Cuthbert', occScale: 1.0 },
  { q: -1, r: 1,  tileType: 'grass', biome: 'thornwick', env: ['hex_road_A'], occ: 'building_market_blue', label: 'Granary', occScale: 1.0 },
  { q: -1, r: 0,  tileType: 'grass', biome: 'thornwick', env: ['hex_road_A'], occ: 'building_tower_base_blue', label: 'Kiln', occScale: 0.9 },
  { q: -2, r: 1,  tileType: 'grass', biome: 'thornwick', env: [], occ: 'building_home_B_blue', label: 'Tannery', occScale: 0.9 },
  { q: -1, r: 2,  tileType: 'grass', biome: 'thornwick', env: ['hex_road_A'], occ: null, label: 'Thornwick Village' },
  { q: 0,  r: -1, tileType: 'grass', biome: 'thornwick', env: [], occ: null, label: 'Thornwick Fields' },
  { q: 2,  r: -1, tileType: 'grass', biome: 'thornwick', env: ['hex_road_A'], occ: 'building_home_A_blue', label: 'Demesne Barn', occScale: 0.9 },

  // ═══════════════════════════════════════════════════════
  // THE THORN RIVER — flowing south through valley (q: 0..1, r: -2..6)
  // ═══════════════════════════════════════════════════════
  { q: 0,  r: -2, tileType: 'river', biome: 'valley_floor', env: ['waterplant_A', 'waterplant_B'], occ: null },
  { q: 0,  r: -3, tileType: 'river', biome: 'valley_floor', env: ['waterplant_A'], occ: null },
  { q: 0,  r: 2,  tileType: 'river', biome: 'valley_floor', env: ['waterplant_A', 'waterplant_B', 'waterlily_A'], occ: 'building_watermill_blue', label: 'Watermill', occScale: 0.9 },
  { q: 0,  r: 3,  tileType: 'river', biome: 'valley_floor', env: ['waterplant_A', 'waterlily_A'], occ: null },
  { q: 0,  r: 4,  tileType: 'river', biome: 'southmarsh', env: ['waterplant_B', 'waterplant_C', 'waterlily_B'], occ: null },
  { q: 0,  r: 5,  tileType: 'river', biome: 'southmarsh', env: ['waterplant_C', 'waterplant_B'], occ: null },
  { q: 0,  r: 6,  tileType: 'river', biome: 'southmarsh', env: ['waterplant_C'], occ: null },

  // ═══════════════════════════════════════════════════════
  // MILLTHORPE — upstream settlement (q: -1..0, r: -3..-1)
  // ═══════════════════════════════════════════════════════
  { q: -1, r: -2, tileType: 'grass', biome: 'valley_floor', env: [], occ: 'building_lumbermill_blue', label: 'Sawmill', occScale: 0.9 },
  { q: -1, r: -3, tileType: 'grass', biome: 'valley_floor', env: ['Wood_Log_Stack', 'Wood_Log_A'], occ: null, label: 'Millthorpe' },
  { q: -2, r: -2, tileType: 'grass', biome: 'valley_floor', env: ['Wood_Log_A', 'Wood_Log_B'], occ: null },
  { q: -2, r: -3, tileType: 'grass', biome: 'valley_floor', env: ['Wood_Planks_Stack_Large', 'resource_lumber'], occ: null },

  // ═══════════════════════════════════════════════════════
  // THE VALLEY FLOOR — grain fields (q: -2..2, r: -1..4, excluding river)
  // ═══════════════════════════════════════════════════════
  { q: -1, r: -1, tileType: 'grass', biome: 'valley_floor', env: ['building_grain'], occ: null, label: 'Wheat Fields' },
  { q: 1,  r: 1,  tileType: 'grass', biome: 'valley_floor', env: ['building_grain', 'building_grain'], occ: null, label: 'Barley Fields' },
  { q: 2,  r: 0,  tileType: 'grass', biome: 'valley_floor', env: ['building_grain'], occ: null },
  { q: -2, r: 0,  tileType: 'grass', biome: 'valley_floor', env: ['building_grain'], occ: null },
  { q: -2, r: -1, tileType: 'grass', biome: 'valley_floor', env: ['building_grain', 'Pallet_Wood'], occ: null },
  { q: 2,  r: 1,  tileType: 'grass', biome: 'valley_floor', env: [], occ: null, label: 'Fallow Fields' },
  { q: 1,  r: 2,  tileType: 'grass', biome: 'valley_floor', env: ['building_grain'], occ: null },
  { q: 2,  r: 2,  tileType: 'grass', biome: 'valley_floor', env: ['Pallet_Wood', 'barrel_small'], occ: null },
  { q: -1, r: 3,  tileType: 'grass', biome: 'valley_floor', env: [], occ: null },
  { q: 1,  r: 3,  tileType: 'grass', biome: 'valley_floor', env: ['building_grain', 'sack'], occ: null },

  // ═══════════════════════════════════════════════════════
  // THE WESTWOOD — dense forest (q: -6..-2, r: -3..4)
  // ═══════════════════════════════════════════════════════
  { q: -3, r: -1, tileType: 'grass', biome: 'westwood', env: [], occ: null, label: 'The Westwood' },
  { q: -3, r: -2, tileType: 'grass', biome: 'westwood', env: ['Tree_1_A_Color1', 'Tree_2_A_Color1'], occ: null },
  { q: -4, r: 0,  tileType: 'grass', biome: 'westwood', env: ['Tree_1_B_Color1', 'Tree_3_A_Color1'], occ: null },
  { q: -4, r: -1, tileType: 'grass', biome: 'westwood', env: ['Tree_2_B_Color1', 'Bush_1_A_Color1'], occ: null },
  { q: -5, r: 0,  tileType: 'grass', biome: 'westwood', env: ['trees_A_medium', 'trees_A_small'], occ: null },
  { q: -5, r: 1,  tileType: 'grass', biome: 'westwood', env: ['Tree_3_A_Color1', 'Tree_1_C_Color1'], occ: null },
  { q: -4, r: 1,  tileType: 'grass', biome: 'westwood', env: ['Tree_2_C_Color1', 'Tree_4_A_Color1'], occ: null },
  { q: -3, r: 0,  tileType: 'grass', biome: 'westwood', env: ['Bush_2_A_Color1', 'Tree_2_D_Color1'], occ: null },
  { q: -4, r: 2,  tileType: 'grass', biome: 'westwood', env: ['Tree_3_B_Color1', 'trees_B_medium'], occ: null },
  { q: -5, r: 2,  tileType: 'grass', biome: 'westwood', env: ['trees_A_large', 'Bush_3_A_Color1'], occ: null },
  { q: -6, r: 1,  tileType: 'grass', biome: 'westwood', env: ['Tree_4_B_Color1', 'Tree_Bare_1_A_Color1'], occ: null },
  { q: -6, r: 2,  tileType: 'grass', biome: 'westwood', env: ['Tree_Bare_2_A_Color1', 'Bush_4_A_Color1'], occ: null },
  { q: -3, r: -3, tileType: 'grass', biome: 'westwood', env: ['Tree_2_E_Color1', 'Tree_1_A_Color1'], occ: null },
  { q: -4, r: -2, tileType: 'grass', biome: 'westwood', env: ['trees_B_small', 'Bush_1_B_Color1'], occ: null },
  { q: -5, r: -1, tileType: 'grass', biome: 'westwood', env: ['Tree_3_C_Color1'], occ: null },
  { q: -3, r: 1,  tileType: 'grass', biome: 'westwood', env: ['Rock_1_A_Color1', 'Tree_1_B_Color1'], occ: null },
  { q: -5, r: 3,  tileType: 'grass', biome: 'westwood', env: ['Tree_4_C_Color1', 'Bush_2_B_Color1'], occ: null },
  { q: -4, r: 3,  tileType: 'grass', biome: 'westwood', env: ['trees_B_large'], occ: null },

  // Westwood Fold — swine enclosure
  { q: -4, r: -3, tileType: 'grass', biome: 'westwood', env: ['fence_wood_straight', 'Tree_1_A_Color1'], occ: null, label: 'Westwood Fold' },

  // ═══════════════════════════════════════════════════════
  // THE GREY HILLS — limestone ridge east (q: 3..6, r: -2..4)
  // ═══════════════════════════════════════════════════════
  { q: 3,  r: 0,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_1_J_Color1', 'Rock_1_K_Color1'], occ: null, label: 'The Grey Hills' },
  { q: 3,  r: -1, tileType: 'grass', biome: 'grey_hills', env: ['rock_single_A', 'rock_single_B'], occ: null },
  { q: 4,  r: -1, tileType: 'grass', biome: 'grey_hills', env: ['Rock_2_A_Color1', 'Rock_2_B_Color1'], occ: null },
  { q: 4,  r: 0,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_1_L_Color1', 'Rock_1_M_Color1'], occ: null },
  { q: 3,  r: 1,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_2_C_Color1', 'rock_single_C'], occ: null },
  { q: 4,  r: 1,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_3_A_Color1', 'Rock_3_B_Color1'], occ: null },
  { q: 5,  r: 0,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_1_N_Color1', 'Rock_1_O_Color1'], occ: null },
  { q: 5,  r: -1, tileType: 'grass', biome: 'grey_hills', env: ['Rock_2_D_Color1', 'Rock_2_E_Color1'], occ: null },
  { q: 3,  r: 2,  tileType: 'grass', biome: 'grey_hills', env: ['rock_single_D', 'rock_single_E'], occ: null },
  { q: 4,  r: 2,  tileType: 'grass', biome: 'grey_hills', env: ['Rock_3_C_Color1', 'Rock_3_D_Color1'], occ: null },

  // Hillend — iron ore / quarry settlement
  { q: 5,  r: 1,  tileType: 'grass', biome: 'grey_hills', env: ['Iron_Nuggets', 'Iron_Nugget_Large', 'Iron_Bars_Stack_Small'], occ: null, label: 'Hillend — Ore Outcrop' },
  { q: 5,  r: 2,  tileType: 'grass', biome: 'grey_hills', env: ['Stone_Bricks_Stack_Medium', 'resource_stone'], occ: 'building_mine_blue', label: 'Smelter', occScale: 0.9 },
  { q: 6,  r: 0,  tileType: 'grass', biome: 'grey_hills', env: ['Stone_Chunks_Large', 'Stone_Bricks_Stack_Large'], occ: 'building_mine_green', label: 'Quarry', occScale: 0.9 },
  { q: 6,  r: 1,  tileType: 'grass', biome: 'grey_hills', env: ['Stone_Brick', 'Rock_3_E_Color1'], occ: null },
  { q: 3,  r: -2, tileType: 'grass', biome: 'grey_hills', env: ['Rock_1_P_Color1', 'Rock_1_Q_Color1'], occ: null },
  { q: 4,  r: -2, tileType: 'grass', biome: 'grey_hills', env: ['Rock_3_F_Color1', 'Rock_2_F_Color1'], occ: null },

  // ═══════════════════════════════════════════════════════
  // THE SOUTHMARSH — wetlands (q: -2..2, r: 5..7)
  // ═══════════════════════════════════════════════════════
  { q: -1, r: 5,  tileType: 'grass', biome: 'southmarsh', env: ['waterplant_A', 'waterplant_B'], occ: null, label: 'The Southmarsh' },
  { q: -2, r: 5,  tileType: 'grass', biome: 'southmarsh', env: ['waterplant_B', 'waterlily_A'], occ: null },
  { q: 1,  r: 5,  tileType: 'grass', biome: 'southmarsh', env: ['waterplant_C', 'waterlily_B'], occ: null },
  { q: -1, r: 6,  tileType: 'grass', biome: 'southmarsh', env: ['Fuel_B_Barrel', 'Fuel_B_Barrel_Dirty'], occ: null, label: 'Peat Beds' },
  { q: 1,  r: 6,  tileType: 'grass', biome: 'southmarsh', env: ['waterplant_A'], occ: null },
  { q: -2, r: 6,  tileType: 'grass', biome: 'southmarsh', env: ['Fuel_B_Barrels'], occ: null },
  { q: 2,  r: 5,  tileType: 'grass', biome: 'southmarsh', env: ['waterlily_A', 'waterlily_B'], occ: null },
  { q: 0,  r: 7,  tileType: 'grass', biome: 'southmarsh', env: ['waterplant_B', 'waterplant_C'], occ: null },

  // ═══════════════════════════════════════════════════════
  // SALTWICK COVE — coast & dock (q: -2..2, r: 7..9)
  // ═══════════════════════════════════════════════════════
  { q: -1, r: 7,  tileType: 'grass', biome: 'saltwick', env: ['sand_A', 'sand_B'], occ: null, label: 'Saltwick Cove' },
  { q: -2, r: 7,  tileType: 'grass', biome: 'saltwick', env: ['sand_A'], occ: null },
  { q: 1,  r: 7,  tileType: 'grass', biome: 'saltwick', env: ['sand_B', 'hex_coast_A'], occ: null },
  { q: 0,  r: 8,  tileType: 'grass', biome: 'saltwick', env: ['barrel_large', 'crate_A_big', 'rope_bundle_A'], occ: 'building_stage_A', label: 'Dock', occScale: 0.8 },
  { q: -1, r: 8,  tileType: 'grass', biome: 'saltwick', env: ['Fuel_A_Barrel', 'bucket_water'], occ: null, label: 'Salt Pans' },
  { q: 1,  r: 8,  tileType: 'grass', biome: 'saltwick', env: ['crate_long_A', 'crate_A_small'], occ: null },
  { q: 2,  r: 7,  tileType: 'grass', biome: 'saltwick', env: ['flag_blue', 'barrel_small'], occ: null },
  { q: 0,  r: 9,  tileType: 'grass', biome: 'saltwick', env: ['coin_stack_large', 'sack'], occ: null, label: 'Coastwatch' },
  { q: -2, r: 8,  tileType: 'grass', biome: 'saltwick', env: ['Fish (plate_food_A)', 'plate_food_B'], occ: null },

  // ═══════════════════════════════════════════════════════
  // ROAD NETWORK — connecting settlements
  // ═══════════════════════════════════════════════════════
  { q: -2, r: 0,  tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: -1, r: 0,  tileType: 'road', biome: 'thornwick', env: [], occ: null },
  { q: 1,  r: 0,  tileType: 'road', biome: 'thornwick', env: [], occ: null },
  { q: 2,  r: 0,  tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: 2,  r: -2, tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: 1,  r: -2, tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: -2, r: 1,  tileType: 'road', biome: 'thornwick', env: [], occ: null },
  { q: -2, r: 2,  tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: -2, r: 3,  tileType: 'road', biome: 'valley_floor', env: [], occ: null },
  { q: -2, r: 4,  tileType: 'road', biome: 'southmarsh', env: [], occ: null },
  { q: -1, r: 4,  tileType: 'road', biome: 'southmarsh', env: [], occ: null },
  { q: 1,  r: 4,  tileType: 'road', biome: 'southmarsh', env: [], occ: null },
  { q: 2,  r: 3,  tileType: 'road', biome: 'grey_hills', env: [], occ: null },
  { q: 2,  r: 4,  tileType: 'road', biome: 'southmarsh', env: [], occ: null },
  { q: 3,  r: 3,  tileType: 'road', biome: 'grey_hills', env: [], occ: null },
  { q: 3,  r: 4,  tileType: 'road', biome: 'southmarsh', env: [], occ: null },

  // Road to Hillend
  { q: 3,  r: -1, tileType: 'road', biome: 'grey_hills', env: [], occ: null },
  { q: 4,  r: -1, tileType: 'road', biome: 'grey_hills', env: [], occ: null },

  // ═══════════════════════════════════════════════════════
  // CLOUD ATMOSPHERE — floating above key areas
  // ═══════════════════════════════════════════════════════
  { q: 0,  r: -1, tileType: 'grass', biome: 'thornwick', env: ['cloud_big', 'cloud_big'], occ: null },
  { q: -1, r: 0,  tileType: 'grass', biome: 'thornwick', env: ['cloud_big'], occ: null },
  { q: -3, r: -1, tileType: 'grass', biome: 'westwood', env: ['cloud_big'], occ: null },
  { q: 4,  r: 0,  tileType: 'grass', biome: 'grey_hills', env: ['cloud_big'], occ: null },
  { q: 5,  r: 1,  tileType: 'grass', biome: 'grey_hills', env: ['cloud_big'], occ: null },
  { q: -1, r: 7,  tileType: 'grass', biome: 'saltwick', env: ['cloud_big'], occ: null },
  { q: -2, r: 4,  tileType: 'grass', biome: 'southmarsh', env: ['cloud_big'], occ: null },
];

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
    stats: { Capacity: '80 Worshippers', Records: 'Parish Register', Feast: 'St. Cuthbert\'s Day' }
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
    desc: 'Cruck-framed threshing barn at the center of the lord\'s demesne fields. Plough teams and equipment storage.',
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
  'hex_river_A': {
    title: 'The Thorn River',
    desc: 'The life-giving spine of the kingdom. Drinking water, irrigation, transport corridor, fish stock, and mill power.',
    stats: { Length: '12 miles', Width: '8–15 m', Depth: '1–3 m' }
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
    desc: 'A season\'s worth of cut peat stacked for drying. Critical winter fuel reserve.',
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
    desc: 'Standard measure of grain — the fundamental unit of the kingdom\'s agricultural economy.',
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