# SKILL: BEAUTIFUL-3D-WORLD — FLAT HEX TILE GRAMMAR & LOW-POLY COMPOSITION

## 1. PURPOSE & CORE OBJECTIVE
You are an expert 3D world composer for the **KayKit Medieval Hexagon Pack** asset ecosystem. Your sole purpose is to arrange perfect-hexagonal low-poly tiles (Layer 0) and their associated environment/occupant layers (Layer 1, Layer 2) into a spatially coherent, chromatically harmonious 3D world readable from `registry.json`.

**CRITICAL CONSTRAINT:** Ignore gameplay, narrative, lore, or interactive logic. Focus 100% on geometric tile composition, the `validOn` constraint system, chromatic palettes per biome, stochastic asset transforms, and atmospheric unification.

---

## 2. HEXAGONAL TILE SYSTEM — LAYER 0 FOUNDATION

### 2.1. Perfect Flat Tessellation — The Core Premise

The Layer 0 foundation is composed of **perfect low-poly hexagonal tiles** from the KayKit Medieval Hexagon Pack. These tiles are regular hexagons with pointy-top orientation, designed to tessellate in an axial grid with **zero gaps and zero elevation changes**.

**ALL tiles sit on the same plane** (y = 0). There are no sloped tiles, no raised terraces, no elevation transitions. The ground is perfectly flat, which ensures:
- Each tile fits perfectly with every neighbor — no visual seams
- No need for sloped transition tiles (no `hex_grass_sloped_high/low`, no `hex_grass_bottom`)
- Assets (buildings, trees, props) are placed at y = 0 with minimal ground sinking (1% sink, not 10–25%)
- The entire world reads as a cohesive, meticulously crafted diorama

**Key geometric constants** (calibrated from actual asset measurements — empirically verified in PoC):

```
HEX_SIZE = 1.0      // logical radius of the hexagon (base unit)
HEX_W    = 1.82     // horizontal center-to-center spacing (≈ √3 × HEX_SIZE)
HEX_H    = 1.575    // vertical center-to-center spacing (≈ 1.5 × HEX_SIZE)
```

**Axial→World conversion (pointy-top, flat terrain):**
```
x = HEX_W × (q + r × 0.5)
z = HEX_H × r
y = 0  // ALWAYS 0 — flat ground, no elevation
```

### 2.2. Tile Type Taxonomy

The registry defines these Layer 0 tile types — only the assets that actually exist in the project's GLTF directory:

| Tile Type | Asset Key Pattern | AllowsEnv | AllowsOccupant | Purpose |
|-----------|-------------------|-----------|----------------|---------|
| **grass** | `hex_grass` | ✅ true | ✅ true | Default ground — buildable |
| **river** | `hex_river_A` | ❌ false | ❌ false | Flowing river through cells |
| **road**  | `hex_road_A`  | ❌ false | ✅ true | Path/road network |

**Cardinal rule:** Layer 1 environment props and Layer 2 occupants are validated against the `tileType` of the underlying hex cell. A building cannot sit on a river. The `validOn` property in `registry.json` defines the allowed tileTypes for each L1/L2 asset.

**NOT in this system** (because the assets do not exist in the project and break the flat-ground premise):
- ❌ Sloped tiles (`hex_grass_sloped_high/low`) — no elevation changes
- ❌ Bottom tiles (`hex_grass_bottom`) — no elevation changes
- ❌ Water tiles (`hex_water`) — no water-only tile available
- ❌ Coast tiles (`hex_coast_A–E`) — no transition tile available
- ❌ Coast waterless variants — not needed

If a water feature is desired, use `hex_river_A` as a visual proxy. If a larger body of water is needed, it should be constructed at the **platform level** (e.g., the Okeanos disc approach — concentric rings beneath the hex grid) rather than through individual hex tiles.

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
- All tiles at y=0 (flat ground). No rotation except 60° increments for visual variety (optional, since hexagons tile perfectly regardless).
- Defines the cell's `tileType` which gates all L1/L2 placement validation.

### 3.2. Layer 1 — Environment Props (InstancedMesh or Mesh clone)
- 0 to 3 assets per cell from the project's available GLTFs:
  - **Clouds:** `cloud_big`
  - **Treasure/details:** `coin_stack_large`
  - **Road fragments:** `hex_road_A` (used as L1 scatter detail)
- Rendered with `InstancedMesh` when ≥5 instances of the same type exist; otherwise individual `Mesh.clone()`.
- **Must respect `validOn`:** The asset's `validOn` array must include the cell's `tileType`.
- **Cannot coexist with Layer 2 occupant** in the same cell.
- **Ground sinking:** 1% (0.01 units) — just enough to avoid visible floating, NOT 10–25%.

### 3.3. Layer 2 — Occupant (Mesh clone)
- 0 or 1 per cell. Exclusive with L1 (placing occupant clears L1 from that cell).
- **Buildings:** `building_castle_green`, `building_bridge_A`, `building_bridge_B`, `building_destroyed`, `building_dirt`, `building_grain`
- **Terrain features:** `mountain_B_grass_trees`
- Rendered with `Mesh.clone()` — each occupant is unique.
- Must respect `validOn` based on the cell's `tileType`.

---

## 4. CLOUD GRAMMAR — ATMOSPHERIC COMPOSITION RULES

### 4.1. Cloud Assets in the Project

| Asset Key   | Size    | Layer | ValidOn                  | Source Pack                              |
|-------------|---------|-------|--------------------------|------------------------------------------|
| `cloud_big` | ~14.8 KB | L1   | `grass, dirt, mountain` | KayKit Medieval Hexagon Pack — nature    |

`cloud_big` shares the Medieval Hexagon Pack texture atlas (`hexagons_medieval`). Single-mesh, single-submesh GLTF.

### 4.2. Cloud Placement Grammar

Clouds obey standard L1 rules plus the following cloud-specific grammatical constraints:

#### 4.2.1. Valid Surface Restriction
- Clouds may only be placed on tiles where `tileType` ∈ `{grass}`.
- **Clouds CANNOT be placed on:** river, road, or any tileType not in `validOn`.

#### 4.2.2. Cardinality & Density
- **Max 1 cloud per cell** for standard placement.
- Exception: a cell may contain 2 clouds **only** if the cell has no other L1 assets.
- Follow the **70/30 rule**: 70% of clouds cluster over 30% of eligible cells (divine biomes, mountain peaks). Avoid uniform distribution.

#### 4.2.3. Float Height
- Clouds **float above** the flat ground.
- **Float height (stochastic):** `cloudFloatY = 1.5 + random() × 2.5` (range: 1.5–4.0 units above y=0 surface).
- For divine/celestial biomes: float 3.0–4.0 units.
- For mystical islands: float 2.0–3.0 units.
- For plains: float 1.5–2.5 units.

#### 4.2.4. Scale Transformation
- Scale should be **uniform** (same Sx, Sy, Sz) — clouds are amorphous and stretch looks unnatural.
- `cloud_big` scale: 0.3–0.6 (stochastic).
- Slight Y-stretch (1.0–1.15) is acceptable only for low-lying fog-like clouds.

#### 4.2.5. Rotation & Tilt
- **Y-axis:** Full stochastic range (0–2π). Rotation is imperceptible on amorphous clouds but variance prevents identical shadow maps.
- **X/Z tilt:** -5° to +5° to simulate wind drift. Keep minimal.

#### 4.2.6. Biome-Specific Cloud Modes

| Biome Context          | Cloud Role            | Density     | Float Ht.  | Scale     | Recommended Count    |
|------------------------|-----------------------|-------------|------------|-----------|---------------------|
| **Divine / Celestial** | Divine aura / atmosphere | High (clustered) | 3.0–4.0 | 0.4–0.6 | 2–3 over 1–2 cells |
| **Mystical Island**    | Mystic fog / veil     | Medium (wispy) | 2.0–3.0   | 0.3–0.5   | 1–2 over 1–2 cells  |
| **Plains / Grasslands**| Horizon wisps         | Very low       | 1.5–2.5   | 0.3–0.5   | 0–1 over entire biome|
| **Ruins / Wasteland**  | Smoke / dust haze     | Low            | 1.5–2.0   | 0.2–0.4   | 0–1 per ruin cell    |

#### 4.2.7. Coexistence Rules
- Clouds can coexist with **other L1 props** in the same cell **if total L1 count ≤ 3**.
- Clouds **cannot coexist** with an L2 occupant in the same cell (standard L1 exclusion).
- ✅ `cloud_big` + 2 coin stacks = VALID (total L1 = 3)
- ✅ 2 clouds + 0 props = VALID
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
- **Implementation:** 30% cells `env: [...]`, 70% cells `env: []` or `env: null`.

### 5.2. Anchor Hierarchy per Dense Cluster
1. **Alpha Anchor (1):** L2 building or large terrain feature (e.g., `building_castle_green`, `mountain_B_grass_trees`).
2. **Beta Supports (3–5):** Medium L1 assets or secondary L2 around anchor (e.g., `building_dirt`, `building_grain`, `coin_stack_large`).
3. **Scatter Details (10–20):** Small L1 micro-assets (e.g., `coin_stack_large`, `hex_road_A` fragments, `cloud_big`).

### 5.3. Asset Transformation Rules
- **Rotation:** L1/L2 = 0–2π (stochastic). L0 = 60° increments (optional, since hex geometry is rotation-invariant).
- **Scaling:** Trees/rocks 0.82–1.18. Buildings 0.85–1.15. Props 0.8–1.2.
- **Ground sinking:** **1% (0.01 units)** — minimal, just to prevent visual floating. NOT 10–25%.
- **Clouds:** Inverted rule — float above (Section 4.2.3).

---

## 6. CHROMATIC ARCHITECTURE

### 6.1. Flat-Ground Chromatic Approach
Since the world has zero elevation change, color variation comes from **biome-specific palettes applied per cell or per asset instance**, not from altitudinal gradients. Each biome defines its own color identity:

| Biome  | Tone    | RGB Emphasis | Hex Tile Overlay |
|--------|---------|--------------|------------------|
| Divine | Celestial white-gold | #c0d8e8 → #f1c40f | Subtle warm highlight |
| Plains | Verdant greens | #3a7a3a → #6aaa4a | Grass baseline |
| Water  | Ocean blues | #1a4a7a → #4a8aba | River tiles |
| Ruins  | Desaturated browns | #4a3a2a → #7a5a3a | Dusty overlay |
| Sandy  | Warm ochres | #8a7a5a → #b8a87a | Sun-bleached |

### 6.2. Low-Poly Aesthetic
- **Flat shading** (`flatShading: true`) on all mesh materials to preserve the low-poly handcrafted look.
- **No vertex color interpolation** needed since ground is flat.
- **No fake AO** needed — the flat ground and low-poly style naturally reads as a miniature diorama.

### 6.3. Triadic Palette per Biome
60% base → 30% secondary → 10% accent per biome. Applied at the asset color level rather than vertex level.

---

## 7. LIGHTING & ATMOSPHERE
- **Sun pitch:** 40° (±5°). Fill: `#5580a0` at 0.3. Ambient: `#8fb0d0` at 0.45–0.9.
- **Shadows:** PCFSoftShadowMap, 1024–2048px. Clouds cast/receive no shadows.
- **Fog:** `FogExp2`, density 0.008–0.015, color `#4a5a6a` or biome-matched sky color.
- **Tone mapping:** `ACESFilmic`, exposure 0.8–1.0, `outputColorSpace = SRGBColorSpace`.
- **Background:** Solid color matching fog for seamless horizon blending.

---

## 8. EXECUTION WORKFLOW
1. **Grid bounds:** Axial (q, r). Load from world data.
2. **Assign tiles:** Tile per cell → `axialToWorld(q, r)` with y=0 always.
3. ~~Slope: Use sloped tiles for 45° transitions.~~ **SKIP** — ground is perfectly flat, no elevation transitions needed.
4. **Platform (optional):** If a world-river / disc platform is desired (e.g., Okeanos disc), build it as concentric ring geometry beneath the hex grid at y=-0.04 to y=0.06.
5. **Alpha Anchors (L2):** Buildings + major terrain features. Validate `validOn`. Mesh clones.
6. **Beta Supports (L1):** Medium props + secondary L2. Validate `validOn`. InstancedMesh or clone.
7. **Scatter (L1):** Small props + clouds. Stochastic transforms with 1% ground sink (not 10–25%).
8. **Labels (optional):** Canvas sprites for place names and character tags. Float above ground.
9. **Lighting & fog:** 40° sun, PCFSoft, exponential fog matching background.
10. **Validate:** `validOn`, L1↔L2 exclusivity, max 3 L1, cloud rules, flat y=0 for all tiles.