/**
 * Asset Loader — handles GLTF loading, caching, and instancing
 */
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RIVER_PATH, FIELD_PACKS } from '../data/worldData.js';
import { R2_ASSET_MANIFEST, R2_ASSET_MANIFEST_VERSION } from '../data/r2AssetManifest.js';
import { extractMeshData } from '../utils/sceneGeometry.js';

export { extractMeshData };

/**
 * Registry of all assets used in the world.
 * Maps asset key -> { gltfPath, type, scale }.
 *
 * gltfPath is retained as provenance metadata only. Runtime model bytes are
 * resolved exclusively through R2_ASSET_MANIFEST for local and production use.
 */
export const ASSET_REGISTRY = {
  // ── Tiles (Layer 0) ──
  hex_grass: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/base/hex_grass.gltf', type: 'tile' },
  hex_water: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/base/hex_water.gltf', type: 'tile' },
  hex_river_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/rivers/hex_river_A.gltf', type: 'tile' },
  hex_river_A_curvy: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/rivers/hex_river_A_curvy.gltf', type: 'tile' },
  hex_river_J: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/rivers/hex_river_J.gltf', type: 'tile' },
  hex_river_crossing_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/rivers/hex_river_crossing_A.gltf', type: 'tile' },
  hex_road_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/roads/hex_road_A.gltf', type: 'tile' },

  // ── Buildings (Layer 2) ──
  building_castle_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_castle_blue.gltf', type: 'building', scale: 0.55 },
  building_tavern_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_tavern_blue.gltf', type: 'building', scale: 0.55 },
  building_blacksmith_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_blacksmith_blue.gltf', type: 'building', scale: 0.55 },
  building_church_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_church_blue.gltf', type: 'building', scale: 0.55 },
  building_market_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_market_blue.gltf', type: 'building', scale: 0.55 },
  building_tower_base_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_tower_base_blue.gltf', type: 'building', scale: 0.55 },
  building_home_A_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_home_A_blue.gltf', type: 'building', scale: 0.55 },
  building_home_B_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_home_B_blue.gltf', type: 'building', scale: 0.55 },
  building_watermill_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_watermill_blue.gltf', type: 'building', scale: 0.55 },
  building_lumbermill_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_lumbermill_blue.gltf', type: 'building', scale: 0.55 },
  building_mine_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour blue/building_mine_blue.gltf', type: 'building', scale: 0.55 },
  building_mine_green: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/colour green/building_mine_green.gltf', type: 'building', scale: 0.55 },
  building_stage_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/building_stage_A.gltf', type: 'building', scale: 0.55 },
  building_grain: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/building_grain.gltf', type: 'building', scale: 0.55 },
  building_dirt: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/building_dirt.gltf', type: 'building', scale: 0.55 },
  building_destroyed: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/building_destroyed.gltf', type: 'building', scale: 0.55 },

  // ── Nature & Trees (Layer 1) ──
  Tree_1_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_A_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_1_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_B_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_1_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_C_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_2_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_A_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_2_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_B_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_2_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_C_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_2_D_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_D_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_2_E_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_E_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_3_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_A_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_3_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_B_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_3_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_C_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_4_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_4_A_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_4_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_4_B_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_4_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_4_C_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_Bare_1_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_Bare_1_A_Color1.gltf', type: 'nature', scale: 0.35 },
  Tree_Bare_2_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_Bare_2_A_Color1.gltf', type: 'nature', scale: 0.35 },
  trees_A_large: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_A_large.gltf', type: 'nature', scale: 0.35 },
  trees_A_medium: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_A_medium.gltf', type: 'nature', scale: 0.35 },
  trees_A_small: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_A_small.gltf', type: 'nature', scale: 0.35 },
  trees_B_large: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_B_large.gltf', type: 'nature', scale: 0.35 },
  trees_B_medium: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_B_medium.gltf', type: 'nature', scale: 0.35 },
  trees_B_small: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/trees_B_small.gltf', type: 'nature', scale: 0.35 },

  // ── Bushes ──
  Bush_1_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_1_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Bush_1_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_1_B_Color1.gltf', type: 'nature', scale: 0.3 },
  Bush_2_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_2_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Bush_2_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_2_B_Color1.gltf', type: 'nature', scale: 0.3 },
  Bush_3_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_3_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Bush_4_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_4_A_Color1.gltf', type: 'nature', scale: 0.3 },

  // ── Rocks ──
  Rock_1_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_B_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_J_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_J_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_K_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_K_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_L_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_L_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_M_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_M_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_N_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_N_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_O_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_O_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_P_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_P_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_1_Q_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_Q_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_B_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_C_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_D_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_D_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_E_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_E_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_2_F_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_F_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_A_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_A_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_B_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_B_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_C_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_C_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_D_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_D_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_E_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_E_Color1.gltf', type: 'nature', scale: 0.3 },
  Rock_3_F_Color1: { gltfPath: '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_F_Color1.gltf', type: 'nature', scale: 0.3 },
  rock_single_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/rock_single_A.gltf', type: 'nature', scale: 0.3 },
  rock_single_B: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/rock_single_B.gltf', type: 'nature', scale: 0.3 },
  rock_single_C: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/rock_single_C.gltf', type: 'nature', scale: 0.3 },
  rock_single_D: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/rock_single_D.gltf', type: 'nature', scale: 0.3 },
  rock_single_E: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/rock_single_E.gltf', type: 'nature', scale: 0.3 },

  // ── Clouds ──
  cloud_big: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/cloud_big.gltf', type: 'cloud', scale: 0.4 },

  // ── Props & Decorations (Layer 1) ──
  coin_stack_large: { gltfPath: '/assets/KayKit_DungeonRemastered_1.1_FREE/KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/coin_stack_large.gltf', type: 'prop', scale: 0.15 },
  Wood_Log_Stack: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Wood_Log_Stack.gltf', type: 'prop', scale: 0.2 },
  Wood_Log_A: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Wood_Log_A.gltf', type: 'prop', scale: 0.2 },
  Wood_Log_B: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Wood_Log_B.gltf', type: 'prop', scale: 0.2 },
  Wood_Planks_Stack_Large: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Wood_Planks_Stack_Large.gltf', type: 'prop', scale: 0.2 },
  resource_lumber: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/resource_lumber.gltf', type: 'prop', scale: 0.2 },
  Iron_Nuggets: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Iron_Nuggets.gltf', type: 'prop', scale: 0.15 },
  Iron_Nugget_Large: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Iron_Nugget_Large.gltf', type: 'prop', scale: 0.15 },
  Iron_Bars_Stack_Small: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Iron_Bars_Stack_Small.gltf', type: 'prop', scale: 0.15 },
  Stone_Bricks_Stack_Medium: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Stone_Bricks_Stack_Medium.gltf', type: 'prop', scale: 0.2 },
  Stone_Bricks_Stack_Large: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Stone_Bricks_Stack_Large.gltf', type: 'prop', scale: 0.2 },
  Stone_Chunks_Large: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Stone_Chunks_Large.gltf', type: 'prop', scale: 0.2 },
  Stone_Brick: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Stone_Brick.gltf', type: 'prop', scale: 0.2 },
  resource_stone: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/resource_stone.gltf', type: 'prop', scale: 0.2 },
  Fuel_B_Barrel: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Fuel_B_Barrel.gltf', type: 'prop', scale: 0.2 },
  Fuel_B_Barrel_Dirty: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Fuel_B_Barrel_Dirty.gltf', type: 'prop', scale: 0.2 },
  Fuel_B_Barrels: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Fuel_B_Barrels.gltf', type: 'prop', scale: 0.2 },
  Fuel_A_Barrel: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Fuel_A_Barrel.gltf', type: 'prop', scale: 0.2 },
  Pallet_Wood: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Pallet_Wood.gltf', type: 'prop', scale: 0.2 },
  Pallet_Wood_Covered_A: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Pallet_Wood_Covered_A.gltf', type: 'prop', scale: 0.2 },
  Pallet_Wood_Covered_B: { gltfPath: '/assets/KayKit_ResourceBits_1.0_FREE/KayKit_ResourceBits_1.0_FREE/Assets/gltf/Pallet_Wood_Covered_B.gltf', type: 'prop', scale: 0.2 },
  barrel_small: { gltfPath: '/assets/KayKit_DungeonRemastered_1.1_FREE/KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/barrel_small.gltf', type: 'prop', scale: 0.2 },
  barrel_large: { gltfPath: '/assets/KayKit_DungeonRemastered_1.1_FREE/KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/barrel_large.gltf', type: 'prop', scale: 0.2 },
  crate_A_big: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/crate_A_big.gltf', type: 'prop', scale: 0.2 },
  crate_A_small: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/crate_A_small.gltf', type: 'prop', scale: 0.2 },
  crate_long_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/crate_long_A.gltf', type: 'prop', scale: 0.2 },
  sack: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/sack.gltf', type: 'prop', scale: 0.2 },
  rope_bundle_A: { gltfPath: '/assets/KayKit_RPGToolsBits_1.0_FREE/KayKit_RPGToolsBits_1.0_FREE/Assets/gltf/rope_bundle_A.gltf', type: 'prop', scale: 0.2 },
  bucket_water: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/bucket_water.gltf', type: 'prop', scale: 0.2 },
  flag_blue: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/flag_blue.gltf', type: 'prop', scale: 0.2 },
  sand_A: { gltfPath: '/assets/KayKit_BlockBits_1.0_FREE/KayKit_BlockBits_1.0_FREE/Assets/gltf/sand_A.gltf', type: 'prop', scale: 0.25 },
  sand_B: { gltfPath: '/assets/KayKit_BlockBits_1.0_FREE/KayKit_BlockBits_1.0_FREE/Assets/gltf/sand_B.gltf', type: 'prop', scale: 0.25 },
  hex_coast_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/tiles/coast/hex_coast_A.gltf', type: 'prop', scale: 0.25 },
  fence_wood_straight: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/fence_wood_straight.gltf', type: 'prop', scale: 0.25 },
  fence_wood_straight_gate: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/walls, gates, bridges and other buildings/fence_wood_straight_gate.gltf', type: 'prop', scale: 0.25 },
  wheelbarrow: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/props/wheelbarrow.gltf', type: 'prop', scale: 0.2 },

  // ── Water plants ──
  waterplant_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/waterplant_A.gltf', type: 'nature', scale: 0.3 },
  waterplant_B: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/waterplant_B.gltf', type: 'nature', scale: 0.3 },
  waterplant_C: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/waterplant_C.gltf', type: 'nature', scale: 0.3 },
  waterlily_A: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/waterlily_A.gltf', type: 'nature', scale: 0.3 },
  waterlily_B: { gltfPath: '/assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/decoration/nature/waterlily_B.gltf', type: 'nature', scale: 0.3 },

  // ── Food (fish representation) ──
  'Fish (plate_food_A)': { gltfPath: '/assets/KayKit_DungeonRemastered_1.1_FREE/KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/plate_food_A.gltf', type: 'prop', scale: 0.15 },
  plate_food_B: { gltfPath: '/assets/KayKit_DungeonRemastered_1.1_FREE/KayKit_DungeonRemastered_1.1_FREE/Assets/gltf/plate_food_B.gltf', type: 'prop', scale: 0.15 },
};

const DEFAULT_ASSET_BASE_URL = 'https://pub-37dce3d7ecf94df9acc08cadeb70022c.r2.dev/';
const configuredAssetBaseUrl = import.meta.env.VITE_ASSET_BASE_URL?.trim() || DEFAULT_ASSET_BASE_URL;

function normalizeRemoteBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`[AssetLoader] VITE_ASSET_BASE_URL is not a valid absolute URL: ${value}`);
  }

  if (url.protocol !== 'https:') {
    throw new Error('[AssetLoader] VITE_ASSET_BASE_URL must use HTTPS.');
  }
  if (url.search || url.hash) {
    throw new Error('[AssetLoader] VITE_ASSET_BASE_URL must not contain query parameters or a fragment.');
  }

  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url;
}

const remoteAssetBaseUrl = normalizeRemoteBaseUrl(configuredAssetBaseUrl);

export const ASSET_SOURCE = Object.freeze({
  mode: 'r2',
  baseUrl: remoteAssetBaseUrl.href,
  manifestVersion: R2_ASSET_MANIFEST_VERSION,
});

/** Resolve an application asset ID to its immutable R2 GLB URL. */
export function resolveAssetUrl(key) {
  if (!ASSET_REGISTRY[key]) {
    throw new Error(`[AssetLoader] Unknown asset: ${key}`);
  }

  const objectKey = R2_ASSET_MANIFEST[key];
  if (!objectKey) {
    throw new Error(`[AssetLoader] R2 manifest ${R2_ASSET_MANIFEST_VERSION} has no entry for: ${key}`);
  }

  const encodedObjectKey = objectKey
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

  return new URL(encodedObjectKey, remoteAssetBaseUrl).href;
}

// R2 assets are generated with gltfpack and require EXT_meshopt_compression.
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const loadCache = new Map();
const loadedGeos = new Map(); // key -> { geometry, material, scene }

function loadGltf(url) {
  return new Promise((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
}

/** Load a single R2 asset and cache the parsed GLTF. */
export async function loadAsset(key) {
  if (loadCache.has(key)) return loadCache.get(key);

  const url = resolveAssetUrl(key);
  try {
    const gltf = await loadGltf(url);
    loadCache.set(key, gltf);
    return gltf;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[AssetLoader] Failed to load ${key} from ${url}: ${message}`, { cause: error });
  }
}

/**
 * Load multiple assets concurrently
 */
export async function loadAssets(keys) {
  const unique = [...new Set(keys)];
  const promises = unique.map(k => loadAsset(k).catch(err => {
    console.warn(`[AssetLoader] Failed to load ${k}:`, err.message);
    return null;
  }));
  const results = await Promise.allSettled(promises);
  const loaded = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
  const failed = results.filter(r => r.status === 'rejected' || r.value === null).length;
  return { total: unique.length, loaded, failed };
}

/**
 * Get cached GLTF for an asset key
 */
export function getAsset(key) {
  return loadCache.get(key) || null;
}

/**
 * Check which assets exist in the registry (for validation)
 */
export function assetExists(key) {
  return !!ASSET_REGISTRY[key];
}

/**
 * Get all unique asset keys referenced across world cells, river path, and field packs
 */
export function getReferencedAssetKeys(cells) {
  const keys = new Set();

  // From cells
  cells.forEach(c => {
    if (c.tileType === 'grass') keys.add('hex_grass');
    else if (c.tileType === 'water') keys.add('hex_water');
    else if (c.tileType === 'river') keys.add('hex_river_A');
    else if (c.tileType === 'road') keys.add('hex_road_A');
    if (c.occ) keys.add(c.occ);
    if (c.env) c.env.forEach(e => keys.add(e));
  });

  // River variants from RIVER_PATH
  RIVER_PATH.forEach(entry => {
    keys.add(entry.variant);
  });

  // Field pack occupants
  FIELD_PACKS.forEach(pack => {
    const occupantKey = pack.cropType === 'fallow' ? 'building_dirt'
                      : pack.cropType === 'abandoned' ? 'building_destroyed'
                      : 'building_grain';
    keys.add(occupantKey);
  });

  return [...keys];
}