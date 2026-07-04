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
| **water** | `hex_water` | ❌ false | ❌ false | Pure water tile — no env, no occ |
| **river** | `hex_river_A`–`hex_river_L` + crossings + waterless | ❌ false | ❌ false | Flowing river through cells |
| **road**  | `hex_road_A`–`hex_road_M` | ❌ false | ✅ true | Path/road network |

**Cardinal rule:** Layer 1 environment props and Layer 2 occupants are validated against the `tileType` of the underlying hex cell. A building cannot sit on a river. The `validOn` property in `registry.json` defines the allowed tileTypes for each L1/L2 asset.

**NOT in this system** (because the assets do not exist in the project and break the flat-ground premise):
- ❌ Sloped tiles (`hex_grass_sloped_high/low`) — no elevation changes
- ❌ Bottom tiles (`hex_grass_bottom`) — no elevation changes
- ❌ Coast tiles (`hex_coast_A–E`) — no transition tile available
- ❌ Coast waterless variants — not needed

If a larger body of water is needed, it should be constructed at the **platform level** (e.g., the Okeanos disc approach — concentric rings beneath the hex grid) rather than through individual hex tiles.

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
5. **River system:** Build continuous river paths using Section 9 grammar. Validate edge-flow continuity.
6. **River water surface:** Build a single merged water surface mesh spanning all river tiles (Section 9.6).
7. **Field packs:** Identify grass clusters and assign field packs using Section 10 grammar. Place L2 occupants at centroids.
8. **Alpha Anchors (L2):** Buildings + major terrain features. Validate `validOn`. Mesh clones.
9. **Beta Supports (L1):** Medium props + secondary L2. Validate `validOn`. InstancedMesh or clone.
10. **Scatter (L1):** Small props + clouds. Stochastic transforms with 1% ground sink (not 10–25%).
11. **Labels (optional):** Canvas sprites for place names and character tags. Float above ground.
12. **Lighting & fog:** 40° sun, PCFSoft, exponential fog matching background.
13. **Validate:** `validOn`, L1↔L2 exclusivity, max 3 L1, cloud rules, river continuity, water surface continuity, field pack rules, flat y=0 for all tiles.

---

## 9. RIVER GRAMMAR — HYDROLOGICAL FLOW & TILE CHAINING

### 9.1. River Asset Inventory

The KayKit Medieval Hexagon Pack provides a rich set of river tiles designed to chain together into continuous watercourses. Each variant encodes a specific flow pattern through the hexagon's six edges:

| Asset Key | Flow Pattern | Visual Description |
|-----------|-------------|-------------------|
| `hex_river_A` | Straight N–S | Water enters one edge, exits the opposite edge (straight channel) |
| `hex_river_A_curvy` | Curved N→E or S→W | Water enters one edge, exits an adjacent edge (gentle bend) |
| `hex_river_B` | Straight NE–SW | Diagonal straight channel |
| `hex_river_C` | Straight NW–SE | Diagonal straight channel |
| `hex_river_D` | T-junction | Water enters from two edges, exits through one (or vice versa) |
| `hex_river_E` | T-junction (alt) | Alternative T-junction orientation |
| `hex_river_F` | Three-way fork | Water splits or merges through three edges |
| `hex_river_G` | Three-way fork (alt) | Alternative three-way fork orientation |
| `hex_river_H` | Four-way crossing | Water passes through four edges (intersection) |
| `hex_river_I` | Four-way crossing (alt) | Alternative four-way crossing orientation |
| `hex_river_J` | End cap / source | Water enters from one edge only (river start or end) |
| `hex_river_K` | End cap (alt) | Alternative end cap orientation |
| `hex_river_L` | Isolated pool | Water contained within tile (no edge flow — lake/pond) |
| `hex_river_crossing_A` | Crossing (ford) | Water with a fordable crossing surface |
| `hex_river_crossing_B` | Crossing (bridge) | Water with a bridge crossing surface |

**Waterless variants** (`hex_river_*_waterless`) exist for every river tile. These are identical in geometry but use a dry riverbed texture (no water surface). Use them for seasonal streams, dried-up tributaries, or construction-phase riverbeds.

### 9.2. Edge Flow Encoding

Each river tile defines which of its 6 edges have water flowing through them. For pointy-top hexagons, edges are indexed clockwise starting from the top-right:

```
Edge indices (pointy-top hexagon):
        _____
       /     \
  ┌───╱   E1  ╲───┐
  │   ╲       ╱   │
  │ E6 ╲     ╱ E2 │
  │     ╲   ╱     │
  │      ╲ ╱      │
  │  E5   ╲   E3  │
  │      ╱ ╲      │
  │     ╱   ╲     │
  │   ╱       ╲   │
  └───╱   E4  ╲───┘
       ╲     ╱
        ╲___╱
```

**Edge flow bitmask convention** (for algorithmic tile selection):
- Bit 0 = E1 (top-right)
- Bit 1 = E2 (right)
- Bit 2 = E3 (bottom-right)
- Bit 3 = E4 (bottom-left)
- Bit 4 = E5 (left)
- Bit 5 = E6 (top-left)

Each river tile variant maps to a specific bitmask. For example:
- `hex_river_A` (straight N–S): E1 + E4 = 0b001001 = 9
- `hex_river_A_curvy` (N→E): E1 + E2 = 0b000011 = 3
- `hex_river_J` (end cap at E1): E1 only = 0b000001 = 1

### 9.3. Hydrological Flow Rules — The Core River Grammar

#### 9.3.1. Source & Termination
- **Every river MUST have a source** — a tile where water enters the visible grid. Sources are:
  - Map edge: river enters from outside the visible hex grid (use `hex_river_J` or `hex_river_K` at the boundary).
  - Platform-level water body: river originates from a larger water feature (e.g., Okeanos disc, lake platform).
  - Spring tile: a single `hex_river_L` (isolated pool) that feeds into adjacent river tiles.
- **Every river MUST terminate** — a tile where water exits the visible grid or merges into a water body:
  - Map edge: river exits using an end-cap tile at the boundary.
  - Platform-level water body: river flows into a larger water feature.
  - Confluence: river merges with another river (use three-way fork tiles).
- **A river MUST NOT start and end within the grid without a source/termination** — no isolated river segments.

#### 9.3.2. Flow Continuity (Edge Matching)
- **Adjacent river tiles MUST have matching edge flow.** If tile A has water exiting through edge E2, tile B (neighbor at E2) MUST have water entering through its corresponding opposite edge.
- **Opposite edge mapping** (for pointy-top hexagons):
  - E1 (top-right) ↔ E4 (bottom-left)
  - E2 (right) ↔ E5 (left)
  - E3 (bottom-right) ↔ E6 (top-left)
- **Algorithm for tile selection at position (q, r):**
  1. Determine which edges of the current cell have incoming water from already-placed neighbors.
  2. Determine which edges need outgoing water toward planned downstream neighbors.
  3. Select the river tile variant whose bitmask matches the required edge set.
  4. If no exact match exists, use a crossing or fork tile, or adjust the river path.

#### 9.3.3. River Width Consistency
- **River width is always 1 tile** — the KayKit river tiles are single-hex width. Do not attempt to create 2-tile-wide rivers.
- **River tiles are always `tileType = "river"`** — they cannot be mixed with grass or road tiles within the river channel.
- **Waterless variants** may be used for dry riverbeds, but they must still obey edge-flow continuity with adjacent river tiles.

#### 9.3.4. River Path Constraints
- **Minimum river length:** A river should span at least 3 tiles from source to termination. Shorter segments look unnatural.
- **Maximum straight run:** No more than 5 consecutive straight (`hex_river_A`) tiles without a curve or variation. Rivers meander.
- **Curve frequency:** At least 1 curve (`hex_river_A_curvy` or equivalent) every 3–5 tiles to avoid artificial straightness.
- **No 180° turns:** A river cannot double back on itself. Flow direction must be monotonic along the river's axis.
- **No isolated river tiles:** Every river tile MUST have at least one adjacent river tile (except source/termination at map edge).
- **No tile-type interruption in river chains:** A continuous river path MUST NOT be interrupted by a non-river tile (grass, road, or any other tileType). The river chain must be a contiguous sequence of river tiles from source to termination.
  - **Exception 1 — Source/Termination:** The river may begin at a source tile (sea/ocean edge, mountain spring, platform-level water body) or end at a termination tile. These boundary tiles are not river tiles themselves but are the origin/destination of the flow.
  - **Exception 2 — Building on watered tile:** A building that directly uses the water (e.g., watermill, dock, fishery) may be placed on a river tile. The building occupies the river tile but the tile remains `tileType: "river"` and the river flow continues through it. The building does NOT break the river chain.
  - **Exception 3 — Crossing/Ford:** A `hex_river_crossing_A` or `hex_river_crossing_B` tile is still a river tile (`tileType: "river"`) and does NOT interrupt the chain. Crossings allow road adjacency but remain part of the river path.
  - **Rationale:** A river that jumps from a river tile to a grass tile and back to a river tile is visually incoherent and breaks the hydrological flow illusion. The water surface must be continuous.

#### 9.3.5. Confluences & Forks
- **Confluences** (two rivers joining): Use `hex_river_D` or `hex_river_E` (T-junction) where a tributary meets the main river.
- **Forks** (one river splitting): Use `hex_river_F` or `hex_river_G` (three-way fork) where the river branches.
- **Crossings** (two rivers intersecting): Use `hex_river_H` or `hex_river_I` (four-way crossing) — rare, use sparingly.
- **Confluence density:** Max 1 confluence per 8 river tiles. Too many junctions look chaotic.

#### 9.3.6. River Crossings (Bridges & Fords)
- **Crossing tiles** (`hex_river_crossing_A`, `hex_river_crossing_B`) are special river tiles that allow road/path continuity across the river.
- **Crossing placement rules:**
  - A crossing tile MUST be adjacent to a road tile on at least one side.
  - The road direction must align with the crossing's flow-perpendicular axis.
  - Crossings are L0 river tiles — they do NOT allow L1 or L2 occupants.
  - Max 1 crossing per 6 river tiles. Crossings are strategic chokepoints.

#### 9.3.7. River Decoration (L1 on Adjacent Grass)
- **Water plants** (`waterplant_A`, `waterplant_B`, `waterplant_C`) and **water lilies** (`waterlily_A`, `waterlily_B`) may be placed on grass tiles immediately adjacent to river tiles.
- **Placement rules for bank vegetation:**
  - Only on grass tiles that share an edge with a river tile.
  - Max 2 bank vegetation items per adjacent grass cell.
  - 30–50% of river-adjacent grass cells should have bank vegetation.
  - Do NOT place bank vegetation on road tiles or occupant tiles.

#### 9.3.8. River Biome Integration

| Biome Context | River Role | Water Tone | Bank Vegetation | Crossing Style |
|---------------|-----------|------------|-----------------|----------------|
| **Valley Floor** | Main watercourse | #3a7aba (clear blue) | Dense reeds & lilies | Wooden bridge |
| **Southmarsh** | Widening wetlands | #2a5a4a (dark tea) | Very dense reeds | Ford / stepping stones |
| **Grey Hills** | Fast tributary | #4a8aba (bright blue) | Sparse, rocky banks | Stone bridge |
| **Westwood** | Shaded forest stream | #2a4a3a (dark green) | Moss & ferns | Log bridge |
| **Coastal** | Estuary / outlet | #1a4a7a (deep blue) | Salt marsh grasses | Stone quay |

### 9.4. River Construction Algorithm

```
function buildRiver(path, grid):
  // path: ordered array of axial coordinates [(q0,r0), (q1,r1), ...]
  // grid: reference to the hex grid for neighbor lookup

  for i, (q, r) in enumerate(path):
    // 1. Determine incoming edges from previous tile
    incoming = (i > 0) ? edgeFrom(path[i-1], (q, r)) : null

    // 2. Determine outgoing edges to next tile
    outgoing = (i < path.length-1) ? edgeTo((q, r), path[i+1]) : null

    // 3. Determine if any tributaries join at this cell
    tributaries = findTributaries((q, r), grid)

    // 4. Build required edge set
    requiredEdges = new Set()
    if incoming: requiredEdges.add(incoming)
    if outgoing: requiredEdges.add(outgoing)
    for t in tributaries: requiredEdges.add(edgeFrom(t, (q, r)))

    // 5. Select best-matching river tile variant
    tileKey = selectRiverTile(requiredEdges)

    // 6. Assign tile to cell
    grid.setTile((q, r), tileKey)
```

### 9.5. Validation Rules
- ✅ Every river tile has ≥1 adjacent river tile (except map-edge source/termination).
- ✅ Adjacent river tiles have matching edge flow.
- ✅ River has exactly one source and one termination (or merges into another river).
- ✅ No isolated river segments (all river tiles belong to a continuous path).
- ✅ No 180° turns in flow direction.
- ✅ Max 5 consecutive straight tiles without a curve.
- ✅ Crossing tiles are adjacent to road tiles.
- ✅ River chain is contiguous — no non-river tiles interrupting the path.
- ✅ Building on river tile directly uses the water resource (watermill, dock, fishery).
- ❌ River tile with no flow connection to any neighbor = INVALID.
- ❌ River tile with mismatched edge flow to neighbor = INVALID.
- ❌ River shorter than 3 tiles = INVALID (unless it's a spring-fed pond).
- ❌ River chain interrupted by a non-river tile (grass, road, or other tileType) = INVALID.
- ❌ Building placed on a river tile that does not directly use the water (e.g., castle, blacksmith, church on river) = INVALID. Only water-dependent buildings may occupy river tiles.

### 9.6. Water Surface Continuity — The Seamless Water Principle

**The problem:** Each river GLTF tile from the KayKit pack has a self-contained baked water texture. When tiles are placed adjacent to each other, the water texture stops at each tile's boundary, creating visible seams between tiles. Edge-flow matching ensures logical continuity, but the visual water surface is still fragmented.

**The solution:** Override the individual baked water surfaces with a **single merged water surface mesh** that spans all river tiles as one continuous planar geometry.

#### 9.6.1. Merged Water Surface Construction

For every river tile in the path, generate a hexagonal cap (6 triangles forming a filled hexagon at y = -0.002, just above the tile surface at y = -0.005). Merge all hexagonal caps into a single `BufferGeometry` with shared vertices at adjacent tile edges, creating one seamless mesh.

**Vertex generation** (pointy-top hexagon, radius = HEX_SIZE = 1.0):
```
For each river tile at world position (cx, cz):
  For i = 0..5:
    angle = π/2 - i × π/3  // pointy-top, starting from north
    vx = cx + HEX_SIZE × cos(angle)
    vz = cz + HEX_SIZE × sin(angle)
  Yield 6 perimeter vertices + 1 center vertex
  Yield 6 triangles: (center, vi, v(i+1) mod 6) for each edge
```

**Merge rule:** All perimeter vertices from adjacent tiles that share the same edge will have identical world coordinates. When merged into a single `BufferGeometry` (no vertex deduplication needed — the shared edge vertices naturally coincide), the water surface becomes one continuous sheet with zero seams.

**Vertex count:** For N river tiles: (6 triangles × 3 vertices) × N = 18N vertices in triangle soup, or 7N vertices indexed (1 center + 6 perimeter per tile). Use indexed geometry for efficiency.

#### 9.6.2. Water Material

| Property | Value | Rationale |
|----------|-------|-----------|
| `color` | `0x2a6aba` (mid-blue) | Matches river biome palette |
| `transparent` | `true` | Allows riverbed texture to show through |
| `opacity` | `0.45–0.6` | Semi-transparent veil over baked texture |
| `roughness` | `0.3` | Slight specular for water sheen |
| `metalness` | `0.0–0.1` | Minimal — water is dielectric |
| `side` | `THREE.DoubleSide` | Visible from above and below (for edge-on views) |

**Y-position:** Place at `y = -0.002` — above the tile surface (`y = -0.005`) but below occupants (`y = 0`). This ensures the water surface overlays the baked tile water textures and hides seams.

#### 9.6.3. Water Surface Placement Rules
- **Every river tile MUST have a water surface cap.** No river tile is left without the merged surface.
- **River tiles with buildings** (watermill, dock) STILL get the water surface beneath them. The building's base geometry sits at y = 0, above the water at y = -0.002.
- **The water surface does NOT extend to non-river tiles.** Only river tiles in the path get hexagonal caps.
- **The merged surface is a single `Mesh` added to the scene** — one draw call for the entire river system, regardless of tile count.

#### 9.6.4. Water Surface Construction Algorithm

```javascript
function buildRiverWaterSurface(riverPath, grid):
  positions = []
  indices = []
  vertexOffset = 0

  for each (q, r) in riverPath:
    (cx, cz) = axialToWorld(q, r)
    
    // Generate 6 perimeter vertices (pointy-top hexagon)
    for i = 0..5:
      angle = PI/2 - i * PI/3
      vx = cx + HEX_SIZE * cos(angle)
      vz = cz + HEX_SIZE * sin(angle)
      positions.push(vx, -0.002, vz)
    
    // Center vertex
    positions.push(cx, -0.002, cz)
    
    // 6 triangles: center + edge pair
    for i = 0..5:
      indices.push(vertexOffset + 6)     // center (last in this tile's vertices)
      indices.push(vertexOffset + i)       // vi
      indices.push(vertexOffset + (i+1)%6) // v(i+1)
    
    vertexOffset += 7  // 6 perimeter + 1 center

  geometry = new BufferGeometry(positions, indices)
  material = MeshStandardMaterial(color=0x2a6aba, transparent, opacity=0.5, ...)
  mesh = new Mesh(geometry, material)
  mesh.receiveShadow = true
  scene.add(mesh)
  return mesh
```

#### 9.6.5. Validation Rules
- ✅ Every river tile in the path has a hexagonal water cap in the merged surface.
- ✅ The water surface is a single merged mesh (one draw call).
- ✅ Water surface is placed at y = -0.002, above tile surface but below occupants.
- ✅ Water surface covers the full area of each river hexagon.
- ❌ River tile with no water surface cap = INVALID (water looks broken at edges).
- ❌ Water surface with gaps between adjacent river tile caps = INVALID (seams visible).
- ❌ Water surface placed at wrong Y height so it clips through buildings or tiles = INVALID.

### 9.7. Water Chain Types — Temporal Rule

A **water chain** is a contiguous sequence of water-bearing tiles that form a hydrological flow path. The grammar defines multiple types of water chains, each with its own purity constraints. The water chain's tileType determines which Layer 0 tile asset to use.

#### 9.7.1. Type 1: The River (Pure Water Chain, `hex_water` tiles)

The **river** is the first and primary water chain type. It uses **`hex_water`** tiles — the pure water hex tile from the KayKit Medieval Hexagon Pack's base tiles (`base/hex_water.gltf`). These tiles have a baked water surface with no edge-flow variants, representing a uniform water body.

**Rule: The water chain of the river should have only pure water tiles/hex (`hex_water`).** All cells in a river water chain MUST use `tileType: "water"` and the Layer 0 asset `hex_water`.

**Specific constraints:**
- **Tile type:** `tileType: "water"` for all river chain cells.
- **Asset:** `hex_water` — the baked pure water tile from the base tiles directory.
- **No L1 environment props** on water tiles: `env: []` or `env: null` for every water cell.
- **No L2 occupants** on water tiles: `occ: null` for every water cell.
- **No bank vegetation** (`waterplant_A`, `waterplant_B`, `waterplant_C`, `waterlily_A`, `waterlily_B`) on water tiles themselves. Bank vegetation is placed on **adjacent grass tiles only** (per Section 9.3.7).
- **No buildings** on water tiles — not even water-dependent buildings (watermill, dock, fishery).
- **No crossings** — water tiles have no edge-flow variants.
- **Water surface continuity** still applies — the merged water surface cap (Section 9.6) spans all water tiles if desired for a seamless look, though `hex_water` already includes a baked water surface.

**Rationale:** Using the dedicated `hex_water` tile ensures the river reads as a single uniform pure water body. The `hex_water` tile is designed specifically for this purpose — it has a consistent baked water texture that tessellates seamlessly with adjacent `hex_water` tiles, requiring no edge-flow matching or variant selection.

**All previous rules about water and congruency still apply:**
- Water surface continuity (Section 9.6) — single merged mesh spanning all water tiles.
- River path constraints (Section 9.3.4) — minimum length, meandering, no 180° turns.
- Source & termination (Section 9.3.1) — every river MUST have a source and termination.
- No tile-type interruption in water chains — the water chain must be a contiguous sequence of water tiles.

#### 9.7.2. Future Water Chain Types (Reserved)

Additional water chain types may be defined in future temporal rules:
- **Type 2: The Canal** — man-made water channel, may allow L1 bank props.
- **Type 3: The Estuary** — tidal water body, may allow L2 docks and fisheries.
- **Type 4: The Lake** — still water body, may allow L1 water plants and L2 fishing structures.

These types are reserved and not yet active. When activated, each will define its own purity constraints.

---

## 10. FARMING FIELD GRAMMAR — AGRICULTURAL PACK COMPOSITION

### 10.1. Farming Assets in the Project

| Asset Key | Layer | Type | ValidOn | Purpose |
|-----------|-------|------|---------|---------|
| `building_grain` | L2 | Occupant | `grass` | Grain field / crop representation |
| `building_dirt` | L2 | Occupant | `grass` | Tilled / fallow field |
| `building_destroyed` | L2 | Occupant | `grass` | Abandoned field ruin |
| `sack` | L1 | Prop | `grass` | Harvest bags at field edge |
| `barrel_large` | L1 | Prop | `grass` | Water / ale barrels for field workers |
| `barrel_small` | L1 | Prop | `grass` | Small field barrels |
| `Pallet_Wood` | L1 | Prop | `grass` | Hay bale / straw pallet |
| `Pallet_Wood_Covered_A` | L1 | Prop | `grass` | Covered haystack |
| `Pallet_Wood_Covered_B` | L1 | Prop | `grass` | Covered haystack (alt) |
| `wheelbarrow` | L1 | Prop | `grass` | Field transport tool |
| `plough` (axe tool rep.) | L1 | Prop | `grass` | Plough representation |
| `fence_wood_straight` | L1 | Prop | `grass` | Field boundary fence |
| `fence_wood_straight_gate` | L1 | Prop | `grass` | Field gate |

### 10.2. Field Pack Concept — The Core Principle

**A farming field is NEVER a single isolated tile.** Fields are composed as contiguous packs of 3–12 adjacent grass tiles that share the same agricultural function. A single `building_grain` or `building_dirt` occupant represents the entire field pack — it is placed at the visual center of the pack, not on every tile.

**Field pack structure:**
```
LAYER 0 — TILE:       grass (all tiles in the pack)
LAYER 1 — ENVIRONMENT: 0–3 props per cell (fences, haystacks, tools at edges)
LAYER 2 — OCCUPANT:    1 building_grain or building_dirt at pack center only
```

### 10.3. Field Pack Size & Shape Grammar

#### 10.3.1. Pack Size Rules
- **Minimum pack size:** 3 contiguous grass tiles. Smaller packs look like accidental scatter.
- **Optimal pack size:** 5–8 tiles. This creates visually satisfying field blocks.
- **Maximum pack size:** 12 tiles. Larger packs become monotonous and should be subdivided by internal paths or hedgerows.
- **Pack size distribution** (70/30 rule applied to fields):
  - 70% of field packs: 5–8 tiles (standard fields)
  - 20% of field packs: 3–4 tiles (smallholdings, garden plots)
  - 10% of field packs: 9–12 tiles (lord's demesne, open fields)

#### 10.3.2. Pack Shape Rules
- **Fields MUST be compact clusters** — avoid linear strings of tiles. A valid field pack should have a shape ratio (longest axis / shortest axis) ≤ 2.5.
- **Preferred shapes:** Hexagonal clusters, rhomboid blocks, or irregular blobs. Avoid perfect rectangles.
- **Concavity allowed:** A field pack may have missing interior tiles (e.g., a rock outcrop or tree left unploughed), but the pack must remain visually coherent.
- **Hole rule:** A field pack may contain at most 1 interior grass tile that is NOT part of the pack (left as uncultivated). This tile must have a natural feature (tree, rock, bush) as L1.

#### 10.3.3. Pack Boundary Rules
- **Field packs MUST be separated from each other** by at least 1 non-field tile (grass without field occupant, road, river, etc.).
- **Boundary markers:** 40–60% of field pack perimeter tiles should have at least one L1 boundary prop:
  - `fence_wood_straight` along edges between field and non-field tiles.
  - `fence_wood_straight_gate` at access points (1–2 per pack).
  - `Pallet_Wood` or `Pallet_Wood_Covered_A` at field corners.
- **Adjacent field packs** (different farms) must have a clear visual separator: a road, a hedgerow (dense L1 bushes), or a 1-tile grass buffer.

### 10.4. Crop Type Grammar

#### 10.4.1. Crop Types & Visual Representation

| Crop Type | L2 Occupant | L1 Decoration | Seasonality | Color Palette |
|-----------|-------------|---------------|-------------|---------------|
| **Grain (wheat/barley)** | `building_grain` | `Pallet_Wood`, `sack` | Growing: green → gold at harvest | #8a7a3a (gold) |
| **Fallow / tilled** | `building_dirt` | `wheelbarrow`, `barrel_small` | Bare earth, resting | #6a5a3a (brown) |
| **Pasture / hay** | `building_grain` (hay) | `Pallet_Wood_Covered_A`, `Pallet_Wood_Covered_B` | Hay bales after cutting | #7a8a3a (hay green) |
| **Abandoned** | `building_destroyed` | None | Overgrown, ruined | #4a4a3a (dead brown) |

#### 10.4.2. Crop Rotation Rules
- **Adjacent field packs MUST NOT have the same crop type.** If pack A is grain, pack B (neighbor) must be fallow, pasture, or a different crop.
- **Crop diversity:** In any 10×10 hex area, there must be at least 2 different crop types represented.
- **Fallow ratio:** At least 20% of field packs in a biome should be fallow (`building_dirt`) to represent crop rotation.
- **Demesne fields** (lord's direct farmland): May be larger (9–12 tiles) and are preferentially grain.

#### 10.4.3. Field Decoration Density

| Crop Type | L1 Props per Field Cell | Typical L1 Assets |
|-----------|------------------------|-------------------|
| **Grain** | 0–1 per cell | `sack` at edges, `Pallet_Wood` at harvest |
| **Fallow** | 0–2 per cell | `wheelbarrow`, `barrel_small`, `barrel_large` |
| **Pasture** | 1–2 per cell | `Pallet_Wood_Covered_A`, `Pallet_Wood_Covered_B` |
| **Abandoned** | 0 per cell | None (overgrown look) |

### 10.5. Field Pack Placement Algorithm

```
function placeFieldPacks(grassTiles, grid, rng):
  // grassTiles: array of axial coordinates of all grass tiles
  // grid: reference to hex grid
  // rng: seeded random number generator

  // 1. Identify candidate clusters using flood-fill on grass tiles
  clusters = floodFillClusters(grassTiles, grid, minSize=3)

  // 2. Filter clusters by size constraints
  validClusters = clusters.filter(c => c.size >= 3 && c.size <= 12)

  // 3. Assign field packs to 30–50% of valid clusters (70/30 rule)
  fieldClusters = selectSubset(validClusters, 0.3 + rng() * 0.2)

  for cluster in fieldClusters:
    // 4. Determine crop type based on neighbors and biome
    cropType = selectCropType(cluster, grid, rng)

    // 5. Place L2 occupant at cluster centroid
    center = findCentroid(cluster)
    grid.setOccupant(center, cropType.occupant)

    // 6. Place L1 boundary props on perimeter tiles
    for tile in cluster:
      if isPerimeter(tile, cluster):
        placeBoundaryProps(tile, cropType, rng)

    // 7. Place L1 field props on interior tiles (sparse)
    for tile in cluster:
      if !isPerimeter(tile, cluster) && rng() < 0.3:
        placeFieldProps(tile, cropType, rng)
```

### 10.6. Field Pack Validation Rules
- ✅ Each field pack has exactly 1 L2 occupant at its visual center.
- ✅ All tiles in a field pack are `grass` tileType.
- ✅ Field pack size is between 3 and 12 tiles (inclusive).
- ✅ Field pack shape ratio (longest / shortest axis) ≤ 2.5.
- ✅ Adjacent field packs have different crop types.
- ✅ At least 1 tile of separation between different field packs.
- ✅ 40–60% of perimeter tiles have boundary markers (fence, haystack, etc.).
- ❌ Single isolated `building_grain` or `building_dirt` with no adjacent field tiles = INVALID.
- ❌ Two adjacent field packs with the same crop type = INVALID.
- ❌ Field pack with no L1 boundary props on any perimeter tile = INVALID (looks unbounded).
- ❌ Field pack shape ratio > 2.5 (long linear strip) = INVALID.

### 10.7. Biome-Specific Field Modes

| Biome Context | Field Density | Typical Crop | Boundary Style | Special Rules |
|---------------|--------------|--------------|----------------|---------------|
| **Valley Floor** | High (50% of grass) | Grain / fallow rotation | Wooden fences, hedgerows | Demesne fields are largest |
| **Thornwick Perimeter** | Medium (30% of grass) | Garden plots, small grain | Wattle fences, gates | Smaller packs (3–5 tiles) |
| **Grey Hills Fringe** | Low (15% of grass) | Pasture / hay | Stone walls, drystone | Irregular shapes, rocky inclusions |
| **Southmarsh Edge** | Very low (5% of grass) | Pasture only | Ditches, raised beds | Small packs (3–4 tiles), drainage channels |
| **Coastwatch** | Low (10% of grass) | Barley (salt-tolerant) | Stone fences, windbreaks | Narrow fields, oriented away from sea |

---

## 11. EXECUTION WORKFLOW (UPDATED)

1. **Grid bounds:** Axial (q, r). Load from world data.
2. **Assign tiles:** Tile per cell → `axialToWorld(q, r)` with y=0 always.
3. ~~Slope: Use sloped tiles for 45° transitions.~~ **SKIP** — ground is perfectly flat, no elevation transitions needed.
4. **Platform (optional):** If a world-river / disc platform is desired (e.g., Okeanos disc), build it as concentric ring geometry beneath the hex grid at y=-0.04 to y=0.06.
5. **River system:** Build continuous river paths using Section 9 grammar. Validate edge-flow continuity.
6. **River water surface:** Build a single merged water surface mesh spanning all river tiles (Section 9.6).
7. **Field packs:** Identify grass clusters and assign field packs using Section 10 grammar. Place L2 occupants at centroids.
8. **Alpha Anchors (L2):** Buildings + major terrain features. Validate `validOn`. Mesh clones.
9. **Beta Supports (L1):** Medium props + secondary L2. Validate `validOn`. InstancedMesh or clone.
10. **Scatter (L1):** Small props + clouds. Stochastic transforms with 1% ground sink (not 10–25%).
11. **Labels (optional):** Canvas sprites for place names and character tags. Float above ground.
12. **Lighting & fog:** 40° sun, PCFSoft, exponential fog matching background.
13. **Validate:** `validOn`, L1↔L2 exclusivity, max 3 L1, cloud rules, river continuity, water surface continuity, field pack rules, flat y=0 for all tiles.