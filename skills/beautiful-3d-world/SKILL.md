# SKILL: BEAUTIFUL-3D-WORLD — HEX TILE GRAMMAR & LOW-POLY COMPOSITION

## 1. PURPOSE & CORE OBJECTIVE
You are an expert 3D world composer for the **KayKit Medieval Hexagon Pack** asset ecosystem. Your sole purpose is to arrange perfect-hexagonal low-poly tiles (Layer 0) and their associated environment/occupant layers (Layer 1, Layer 2) into a spatially coherent, chromatically harmonious 3D world readable from `registry.json`.

**CRITICAL CONSTRAINT:** Ignore gameplay, narrative, lore, or interactive logic. Focus 100% on geometric tile composition, the `validOn` constraint system, chromatic palettes per biome, stochastic asset transforms, and atmospheric unification.

---

## 2. HEXAGONAL TILE SYSTEM — LAYER 0 FOUNDATION

### 2.1. The Perfect Hexagon Premise

The Layer 0 foundation is composed of **perfect low-poly hexagonal tiles** from the KayKit Medieval Hexagon Pack. These tiles are regular hexagons with pointy-top orientation, designed to tessellate in an axial grid with zero gaps.

**Key geometric constants** (calibrated from actual asset measurements):

```
HEX_SIZE = 1.0      // logical radius of the hexagon (base unit)
HEX_W    = 1.82     // horizontal center-to-center spacing (≈ √3 × HEX_SIZE)
HEX_H    = 1.575    // vertical center-to-center spacing (≈ 1.5 × HEX_SIZE)
```

**Axial→World conversion (pointy-top):**
```
x = HEX_W × (q + r × 0.5)
z = HEX_H × r
y = 0 (base elevation; slope adjusts this)
```
### 2.2. Tile Type Taxonomy

The registry defines these Layer 0 tile types, each with its own constraint profile:

| Tile Type         | Asset Key Pattern             | AllowsEnv | AllowsOccupant | Purpose                          |
|-------------------|-------------------------------|-----------|----------------|----------------------------------|
| **grass**         | `hex_grass`                   | ✅ true    | ✅ true         | Default ground — buildable        |
| **grass (sloped)**| `hex_grass_sloped_high/low`   | ✅ true    | ✅ true         | Elevation transition (45° slopes) |
| **grass (bottom)**| `hex_grass_bottom`            | ✅ true    | ✅ true         | Low-elevation grass               |
| **water**         | `hex_water`                   | ❌ false   | ❌ false        | Deep water — no placement         |
| **coast**         | `hex_coast_A`–`E`             | ✅ true    | ✅ true         | Grass/water edge — grass side     |
| **coast (waterless)** | `hex_coast_A_waterless`–`E_waterless` | ❌ false | ❌ false | Coast tile from water side  |
| **river**         | `hex_river_A`–`L`             | ❌ false   | ❌ false        | Flowing river through cells       |
| **road**          | `hex_road_A`–`M`              | ❌ false   | ✅ true         | Path/road network                 |

**Cardinal rule:** Layer 1 environment props and Layer 2 occupants are validated against the `tileType` of the underlying hex cell. A tree cannot sit on water. A building cannot sit on a river. The `validOn` property in `registry.json` defines the allowed tileTypes for each L1/L2 asset.
### 2.3. Coast, River & Road Edge Topology

Coast tiles (A–E) are **transition hexes** that are half-grass, half-water along one edge of the hexagon. The letter (A–E) encodes which of the 6 hex edges has the water boundary:

```
     A ─── B
    /       \
   F         C
    \       /
     E ─── D
```

- `hex_coast_A` = water on edge A (top-right)
- `hex_coast_B` = water on edge B (right)
- `hex_coast_C` = water on edge C (bottom-right)
- `hex_coast_D` = water on edge D (bottom-left)
- `hex_coast_E` = water on edge E (left)

River tiles (A–L) encode **through-flow** paths — water enters one hex edge and exits through another, or turns, or terminates at a lake edge. The `_waterless` variants exist so that when a river tile is viewed from the water-side neighbor, no duplicate water surface is visible.

Road tiles (A–M) encode road segments that connect through hex edges — straight paths, curves, T-junctions, 4-way crosses, and dead-end endpoints.

---

## 3. LAYERED ASSET GRAMMAR

The world has exactly 3 layers per cell, following the ontological-layer-composer contract:

```
LAYER 0 — TILE        (1 per cell, always present)
LAYER 1 — ENVIRONMENT (0–3 props per cell)
LAYER 2 — OCCUPANT    (0–1 per cell, mutually exclusive with L1)
```

### 3.1. Layer 0 — Tile (InstancedMesh)
- Exactly one hex tile per cell, chosen by `tileType`.
- Rendered with `InstancedMesh` — one draw call per tile type for all instances.
- Defines the cell's `tileType` which gates all L1/L2 placement validation.

### 3.2. Layer 1 — Environment Props (InstancedMesh)
- 0 to 3 assets per cell from a wide pool of decoratives:
  - **Trees (Forest Nature Pack):** `Tree_1_A_Color1`–`Tree_4_C_Color1`, `Tree_Bare_1_A_Color1`–`Tree_Bare_2_C_Color1`
  - **Trees (Hexagon Pack):** `tree_single_A/B`, `tree_single_A/B_cut`, `trees_A/B_large/medium/small/cut`
  - **Mountains & Hills:** `mountain_A/B/C` + `_grass`/`_grass_trees`, `hill_single_A/B/C`, `hills_A/B/C` + `_trees`
  - **Bushes:** `Bush_1_A_Color1`–`Bush_4_F_Color1`
  - **Rocks:** `Rock_1_A_Color1`–`Rock_3_R_Color1`, `rock_single_A`–`E`, `resource_stone`, `Stone_Brick`/`Stone_Chunks_*`
  - **Grass tufts:** `Grass_1_A_Color1`–`Grass_2_D_Singlesided_Color1`
  - **Clouds:** `cloud_big`, `cloud_small`
  - **Props:** `barrel`, `bucket_arrows/empty/water`, `crate_A/B_big/small`, `crate_long_A/B/C/empty`, `crate_open`, `flag_*`, `ladder`, `pallet`, `resource_lumber`, `sack`, `target`, `wheelbarrow`, `anvil`, `grindstone`
  - **Water plants:** `waterlily_A/B`, `waterplant_A/B/C`
  - **Fences (stone):** `fence_stone_straight`, `fence_stone_straight_gate`
  - **Resource stacks:** `coin_stack_large`, ore/bar/nugget variants, `Wood_Log_A/B/Stack`
  - **BlockBits L1:** `dirt_with_grass`, `grass`, `grass_with_snow`, `gravel_with_grass`, `sand_with_grass`, `stone`, `stone_dark`, `stone_with_*`, `tree`, `tree_with_snow`
  - **DungeonRemastered L1:** all `banner_*`, `barrel_large/small/*`, `barrier_*`, `box_*`, `floor_dirt_large_rocky`, `floor_tile_large_rocks`, `cactus_*`
- Rendered with `InstancedMesh` when ≥5 instances of the same type exist.
- **Must respect `validOn`:** The asset's `validOn` array must include the cell's `tileType`.
- **Cannot coexist with Layer 2 occupant** in the same cell.

### 3.3. Layer 2 — Occupant (Mesh clone)
- 0 or 1 per cell. Exclusive with L1 (placing occupant clears L1 from that cell).
- **Buildings (4 colors × 15 types):** `building_castle_blue/green/red/yellow`, `building_home_A/B_*`, `building_tavern_*`, `building_church_*`, `building_tower_A/B_*`, `building_well_*`, `building_windmill_*`, `building_blacksmith_*`, `building_market_*`, `building_lumbermill_*`, `building_mine_*`, `building_barracks_*`, `building_archeryrange_*`, `building_watermill_*`, `building_tower_base_*`, `building_tower_catapult_*`
- **Neutral buildings:** `building_bridge_A/B`, `building_destroyed`, `building_dirt`, `building_grain`, `building_scaffolding`, `building_stage_A/B/C`
- **Walls & Fences:** all `wall_*` variants, `fence_wood_straight`/`gate`, `wall_corner_A/B_inside/outside/gate`, `wall_straight`/`gate`
- **Stairs (L2):** `stairs_wall_left/right`, `stairs_walled`
- **Torches:** `torch`, `torch_lit`, `torch_mounted`, `torch__gltf`, `torch_burnt`
- **Skeleton items:** `Skeleton_Arrow` variants, `Skeleton_Axe/Blade/Crossbow/Quiver/Shield_*`, `Skeleton_Staff`
- **Tent:** `tent`
- Rendered with `Mesh.clone()` — each occupant is unique.
- Must respect `validOn` and (if present) `subtype` for compatibility.


## 4. CLOUD GRAMMAR — ATMOSPHERIC COMPOSITION RULES

### 4.1. Cloud Assets in the Registry

| Asset Key    | Size  | Layer | ValidOn                     | Source Pack                              |
|-------------|-------|-------|-----------------------------|------------------------------------------|
| `cloud_big`  | 17.5 KB | L1  | `grass, dirt, mountain`    | KayKit Medieval Hexagon Pack — nature    |
| `cloud_small`| 10.9 KB | L1  | `grass, dirt, mountain`    | KayKit Medieval Hexagon Pack — nature    |

Both clouds share the Medieval Hexagon Pack texture atlas (`hexagons_medieval`) and the same PBR material (metallic=0, roughness=0.5) as the rest of the hex pack. They are single-mesh, single-submesh GLTFs.

### 4.2. Cloud Placement Grammar

Clouds obey standard L1 rules plus the following cloud-specific grammatical constraints:

#### 4.2.1. Valid Surface Restriction
- Clouds may only be placed on tiles where `tileType` ∈ `{grass, dirt, mountain}`.
- **Clouds CANNOT be placed on:** water, river, road, coast, sand, snow, gravel, lava, stone_dark, or any tileType not in `validOn`.

#### 4.2.2. Cardinality & Density
- **Max 1 cloud per cell** for standard placement (both `cloud_big` and `cloud_small` occupy visual space).
- Exception: a cell may contain `cloud_big` + `cloud_small` **only** if the cell has no other L1 assets (total = 2 clouds, 0 other props).
- Follow the **70/30 rule**: 70% of clouds cluster over 30% of eligible cells (mountain peaks, divine biomes). Avoid uniform distribution.

#### 4.2.3. Elevation & Float — Inverted Ground Intersection
- Unlike rocks/trees that **sink** into terrain, clouds **float above** it.
- **Float height (stochastic):** `cloudFloatY = 1.5 + random() × 2.5` (range: 1.5–4.0 units above hex surface).
- `cloud_big` floats higher (2.0–4.0), `cloud_small` lower (1.5–3.0).

#### 4.2.4. Scale Transformation
- Scale should be **uniform** (same Sx, Sy, Sz) — clouds are amorphous and stretch looks unnatural.
- `cloud_big` scale: 0.3–0.6 (stochastic)
- `cloud_small` scale: 0.4–0.8 (stochastic)
- Slight Y-stretch (1.0–1.15) is acceptable only for low-lying fog-like clouds.

#### 4.2.5. Rotation & Tilt
- **Y-axis:** Full stochastic range (0–2π). Rotation is imperceptible on amorphous clouds but variance prevents identical shadow maps.
- **X/Z tilt:** -5° to +5° to simulate wind drift. Keep minimal — excessive tilt breaks the flat low-poly aesthetic.

#### 4.2.6. Biome-Specific Cloud Modes

Clouds serve different atmospheric roles depending on biome context:

| Biome Context          | Cloud Role            | Density     | Float Ht.  | Scale     | Recommended Count    |
|------------------------|-----------------------|-------------|------------|-----------|---------------------|
| **Divine / Celestial** | Divine aura / atmosphere | High (clustered) | 3.0–4.0 | 0.4–0.6 | 5–10 over 3–5 cells |
| **Mystical Island**    | Mystic fog / veil     | Medium (wispy) | 2.0–3.0   | 0.3–0.5   | 3–6 over 2–4 cells  |
| **Mountain Peaks**     | Summit crown clouds   | Low (sparse)   | 2.5–4.0   | 0.4–0.7   | 1–3 per peak cluster |
| **Plains / Grasslands**| Horizon wisps         | Very low       | 1.5–2.5   | 0.3–0.5   | 0–2 over entire biome|
| **Ruins / Wasteland**  | Smoke / dust haze     | Low            | 1.5–2.0   | 0.2–0.4   | 0–1 per ruin cell    |

#### 4.2.7. Coexistence Rules
- Clouds can coexist with **other L1 props** in the same cell **if total L1 count ≤ 3**.
- Clouds **cannot coexist** with an L2 occupant in the same cell (standard L1 exclusion).
- ✅ `cloud_big` + 2 trees = VALID (total L1 = 3)
- ✅ `cloud_small` + 1 rock + 1 bush = VALID (total L1 = 3)
- ❌ `cloud_big` + `building_castle_green` = INVALID (L2 conflict)

#### 4.2.8. Rendering & Shading Rules
- **Do NOT cast shadows:** `cloudInstance.castShadow = false;`
- **Do NOT receive shadows:** `cloudInstance.receiveShadow = false;`
- **Optional transparency:** Set `material.transparent = true` and `material.opacity = 0.85–0.95`.
- **Render order:** Higher than terrain, lower than UI.

---

## 5. COMPOSITIONAL RULES — 70/30 + ANCHOR HIERARCHY

### 5.1. Spatial Chunking (70/30 Rule)
- **Dense Clusters (30% of terrain):** 70% of high-impact assets in concentrated zones.
- **Negative Space (70% of terrain):** Minimal scatter for visual rest.
- **Implementation:** 30% cells `environment: [...]`, 70% cells `environment: []`.

### 5.2. Anchor Hierarchy per Dense Cluster
1. **Alpha Anchor (1):** L2 building or large terrain feature.
2. **Beta Supports (3–5):** Medium L1/L2 around anchor.
3. **Scatter Details (10–20):** Small L1 micro-assets.

### 5.3. Asset Transformation Rules
- **Rotation:** L1/L2 = 0–2π. L0 = 60° increments.
- **Scaling:** Trees/rocks 0.82–1.18. Buildings 0.85–1.15. Props 0.8–1.2.
- **Ground sinking:** Trees/rocks/buildings/props: 10%–25% into terrain.
- **Clouds:** Inverted rule — float above (Section 4.2.3).

---

## 6. CHROMATIC ARCHITECTURE

### 6.1. Altitudinal Color Gradient
| Zone  | Y Range    | Tone  | RGB Emphasis |
|-------|-----------|-------|-------------|
| Low   | y < -1.0  | Cool  | Desat blues |
| Mid   | -1.0–1.0  | Core  | Greens, ochres |
| High  | y > 1.0   | Warm  | Bleached white |

### 6.2. Fake AO
Tint bottom vertices with `lerp(baseColor, #4a3070, 0.3)`.

### 6.3. Triadic Palette
60% base → 30% secondary → 10% accent per biome.

---

## 7. LIGHTING & ATMOSPHERE
- **Sun pitch:** 32°–48°. Fill: `#5580a0` at 0.3. Ambient: `#8fb0d0` at 0.45–0.9.
- **Shadows:** PCFSoftShadowMap, 1024–2048px. Clouds cast/receive no shadows.
- **Fog:** `FogExp2`, density 0.012–0.022, color `#4a5a6a`.
- **Tone mapping:** `ACESFilmic`, exposure 0.8–1.0, `outputColorSpace = SRGBColorSpace`.

---

## 8. EXECUTION WORKFLOW
1. **Grid bounds:** Axial (q, r). Load from world data.
2. **Assign tiles:** Tile per cell → `axialToWorld(q, r)`.
3. **Slope:** Use sloped tiles for 45° transitions.
4. **Alpha Anchors (L2):** Buildings. Validate `validOn`. Mesh clones.
5. **Beta Supports (L1):** Medium props. Validate `validOn`. InstancedMesh.
6. **Scatter (L1):** Small props + clouds. Stochastic transforms.
7. **Chromatic layers:** Altitude tints + fake AO.
8. **Lighting & fog:** 40° sun, PCFSoft, exponential fog.
9. **Validate:** `validOn`, L1↔L2 exclusivity, max 3 L1, cloud rules.
