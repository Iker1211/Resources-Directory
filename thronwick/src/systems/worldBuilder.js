/**
 * World Builder — places Layer 0 tiles, Layer 1 environments, and Layer 2 occupants
 *
 * Implements:
 *   Section 9 — RIVER GRAMMAR: edge-flow matching for continuous river paths
 *   Section 10 — FARMING FIELD GRAMMAR: contiguous field packs with centroid occupants
 */
import * as THREE from 'three';
import { CELLS, axialToWorld, BIOMES, HEX_W, HEX_H, ENTITY_DB, RIVER_PATH, FIELD_PACKS, FIELD_PACK_MAP, getFieldPackCentroid, cellKey } from '../data/worldData.js';
import { getAsset, extractMeshData } from './assetLoader.js';
import { createPRNG } from '../utils/prng.js';

const RNG = createPRNG(1337); // deterministic seed for reproducible layout
const rY = () => RNG() * Math.PI * 2;
const rS = (min, max) => min + RNG() * (max - min);

// ── River variant lookup from RIVER_PATH ──────────────────────────────
const RIVER_VARIANT_LOOKUP = {};
RIVER_PATH.forEach(entry => {
  RIVER_VARIANT_LOOKUP[cellKey(entry.q, entry.r)] = entry.variant;
});

function getRiverVariant(q, r) {
  const key = cellKey(q, r);
  return RIVER_VARIANT_LOOKUP[key] || 'hex_river_A';
}

/**
 * Build Layer 0 hex tiles using InstancedMesh.
 * River tiles use variant selection from RIVER_PATH for edge-flow matching.
 */
export function buildTiles(scene, progressCb) {
  const groups = { grass: [], road: [], water: [] };
  const riverGroups = {};

  CELLS.forEach(c => {
    const type = c.tileType || 'grass';
    const p = axialToWorld(c.q, c.r);
    const pos = new THREE.Vector3(p.x + HEX_W * 0, 0, p.z - HEX_H * 8.5);

    if (type === 'water') {
      groups.water.push(pos);
    } else if (type === 'river') {
      const variant = getRiverVariant(c.q, c.r);
      if (!riverGroups[variant]) riverGroups[variant] = [];
      riverGroups[variant].push(pos);
    } else if (type === 'road') {
      groups.road.push(pos);
    } else {
      groups.grass.push(pos);
    }
  });

  let totalInstances = 0;

  if (groups.grass.length > 0) {
    totalInstances += buildTileBatch(scene, 'hex_grass', groups.grass, 'grass', progressCb);
  }
  if (groups.water.length > 0) {
    totalInstances += buildTileBatch(scene, 'hex_water', groups.water, 'water', progressCb);
  }
  if (groups.road.length > 0) {
    totalInstances += buildTileBatch(scene, 'hex_road_A', groups.road, 'road', progressCb);
  }
  Object.entries(riverGroups).forEach(([variant, positions]) => {
    totalInstances += buildTileBatch(scene, variant, positions, 'river', progressCb);
  });

  return totalInstances;
}

function buildTileBatch(scene, assetKey, positions, tileType, progressCb) {
  if (positions.length === 0) return 0;

  const gltf = getAsset(assetKey);
  if (!gltf) {
    console.warn(`[WorldBuilder] Missing tile asset: ${assetKey}`);
    return 0;
  }

  const { geometry, material } = extractMeshData(gltf);
  if (!geometry) {
    console.warn(`[WorldBuilder] No mesh in ${assetKey}`);
    return 0;
  }

  const mat = material.clone();
  mat.flatShading = true;

  const mesh = new THREE.InstancedMesh(geometry, mat, positions.length);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.isTile = true;
  mesh.userData.tileType = tileType;

  const dummy = new THREE.Object3D();
  positions.forEach((p, i) => {
    dummy.position.copy(p);
    dummy.position.y = -0.005;
    dummy.rotation.set(0, (i % 6) * (Math.PI / 3), 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  if (progressCb) progressCb(`L0 ${assetKey}: ${positions.length} instances`);
  return positions.length;
}

/**
 * Build Layer 2 occupants (buildings + major features + field pack centroids).
 */
export function buildOccupants(scene, progressCb) {
  let count = 0;

  // 1. Place explicit occupants from CELLS data
  CELLS.forEach(c => {
    if (!c.occ) return;

    const gltf = getAsset(c.occ);
    if (!gltf) {
      console.warn(`[WorldBuilder] Missing occupant: ${c.occ}`);
      return;
    }

    const p = axialToWorld(c.q, c.r);
    const pos = new THREE.Vector3(p.x + HEX_W * 0, 0, p.z - HEX_H * 8.5);

    const obj = gltf.scene.clone(true);
    obj.position.copy(pos);
    obj.position.y = 0;

    const baseScale = c.occScale || 0.55;
    const scaleVar = rS(0.9, 1.1);
    const s = baseScale * scaleVar;
    obj.scale.set(s, s, s);

    obj.rotation.y = c.occRotY !== undefined ? c.occRotY : rY();

    obj.traverse(n => {
      n.userData.assetKey = c.occ;
      n.userData.cellData = { q: c.q, r: c.r, label: c.label || '' };
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
      }
    });

    scene.add(obj);
    count++;

    if (progressCb) progressCb(`L2 ${c.occ} @ (${c.q},${c.r})`);
  });

  // 2. Place field pack occupants at centroids
  FIELD_PACKS.forEach(pack => {
    const centroid = getFieldPackCentroid(pack.cells);
    const occupantKey = pack.cropType === 'fallow' ? 'building_dirt'
                      : pack.cropType === 'abandoned' ? 'building_destroyed'
                      : 'building_grain'; // grain or pasture

    const gltf = getAsset(occupantKey);
    if (!gltf) {
      console.warn(`[WorldBuilder] Missing field occupant: ${occupantKey}`);
      return;
    }

    const p = axialToWorld(centroid.q, centroid.r);
    const pos = new THREE.Vector3(p.x + HEX_W * 0, 0, p.z - HEX_H * 8.5);

    const obj = gltf.scene.clone(true);
    obj.position.copy(pos);
    obj.position.y = 0;

    const packSize = pack.cells.length;
    const baseScale = packSize >= 6 ? 0.65 : packSize >= 4 ? 0.55 : 0.45;
    const scaleVar = rS(0.9, 1.1);
    const s = baseScale * scaleVar;
    obj.scale.set(s, s, s);

    obj.rotation.y = rY();

    obj.traverse(n => {
      n.userData.assetKey = occupantKey;
      n.userData.cellData = { q: centroid.q, r: centroid.r, label: pack.label || '' };
      n.userData.fieldPack = pack.packId;
      if (n.isMesh) {
        n.castShadow = true;
        n.receiveShadow = true;
      }
    });

    scene.add(obj);
    count++;

    if (progressCb) progressCb(`L2 field ${pack.packId}: ${occupantKey} @ (${centroid.q},${centroid.r})`);
  });

  return count;
}

/**
 * Build Layer 1 environment props (trees, rocks, props, clouds, field boundaries).
 */
export function buildEnvironment(scene, progressCb) {
  let totalItems = 0;
  let cloudItems = 0;

  CELLS.forEach(c => {
    if (!c.env || c.env.length === 0) return;

    const p = axialToWorld(c.q, c.r);
    const basePos = new THREE.Vector3(p.x + HEX_W * 0, 0, p.z - HEX_H * 8.5);

    // Validate: if cell has an occupant, skip L1 (exclusive)
    if (c.occ) return;

    c.env.forEach((assetKey) => {
      const gltf = getAsset(assetKey);
      if (!gltf) return;

      const isCloud = assetKey === 'cloud_big';
      const isFence = assetKey.startsWith('fence_');

      const jitterAmt = isCloud ? 0.4 : isFence ? 0.6 : 0.25;
      const pos = basePos.clone().add(
        new THREE.Vector3(
          (RNG() - 0.5) * jitterAmt,
          0,
          (RNG() - 0.5) * jitterAmt
        )
      );

      if (isCloud) {
        const biome = c.biome || 'thornwick';
        let floatMin = 1.5, floatMax = 2.5;
        if (biome === 'thornwick') { floatMin = 2.5; floatMax = 3.5; }
        else if (biome === 'westwood') { floatMin = 2.0; floatMax = 3.5; }
        else if (biome === 'grey_hills') { floatMin = 2.5; floatMax = 4.0; }
        else if (biome === 'saltwick') { floatMin = 1.5; floatMax = 2.5; }
        else if (biome === 'southmarsh') { floatMin = 1.5; floatMax = 2.5; }

        pos.y = rS(floatMin, floatMax);
        cloudItems++;
      }

      const obj = gltf.scene.clone(true);

      let scale = 0.3;
      if (isCloud) scale = rS(0.3, 0.55);
      else if (assetKey.startsWith('Tree') || assetKey.startsWith('trees')) scale = rS(0.3, 0.4);
      else if (assetKey.startsWith('Bush')) scale = rS(0.25, 0.35);
      else if (assetKey.startsWith('Rock') || assetKey.startsWith('rock')) scale = rS(0.25, 0.35);
      else if (assetKey === 'building_grain') scale = rS(0.3, 0.4);
      else if (assetKey.startsWith('coin_stack')) scale = rS(0.12, 0.18);
      else if (assetKey.startsWith('Wood_Log') || assetKey.startsWith('Wood_Planks') || assetKey === 'resource_lumber') scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('Iron_') || assetKey.startsWith('Stone_') || assetKey === 'resource_stone') scale = rS(0.15, 0.22);
      else if (assetKey.startsWith('Fuel_')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('water') || assetKey.startsWith('waterlily')) scale = rS(0.25, 0.35);
      else if (assetKey.startsWith('barrel') || assetKey.startsWith('crate') || assetKey === 'sack') scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('Pallet')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('flag')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('sand_') || assetKey === 'hex_coast_A') scale = rS(0.22, 0.3);
      else if (isFence) scale = rS(0.22, 0.3);
      else if (assetKey.startsWith('rope_')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('bucket_')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('wheelbarrow')) scale = rS(0.18, 0.25);
      else scale = rS(0.18, 0.28);

      obj.scale.set(scale, scale, scale);

      if (!isCloud) {
        obj.position.y = -0.005;
      }
      obj.position.copy(pos);
      obj.rotation.y = rY();

      obj.traverse(n => {
        n.userData.assetKey = assetKey;
        n.userData.cellData = { q: c.q, r: c.r, label: c.label || '' };
        if (n.isMesh) {
          n.castShadow = !isCloud;
          n.receiveShadow = !isCloud;
          if (isCloud && n.material) {
            n.material.transparent = true;
            n.material.opacity = 0.85;
          }
        }
      });

      scene.add(obj);
      totalItems++;
    });
  });

  if (progressCb) progressCb(`L1: ${totalItems} items (${cloudItems} clouds)`);
  return { totalItems, cloudItems };
}

/**
 * Build a single merged water surface mesh spanning all river tiles.
 * This creates one continuous hexagonal sheet at y = -0.002, overlaying
 * the individual baked water textures to eliminate seam artifacts.
 *
 * Implements Section 9.6 of SKILL.md — Water Surface Continuity.
 */
export function buildRiverWaterSurface(scene, centerX, centerZ) {
  const RIVER_TILES = CELLS.filter(c => c.tileType === 'river');
  if (RIVER_TILES.length === 0) return 0;

  const HEX_SIZE = 1.0;
  const positions = [];
  const indices = [];
  let vertexOffset = 0;

  RIVER_TILES.forEach(tile => {
    const p = axialToWorld(tile.q, tile.r);
    const cx = p.x + centerX;
    const cz = p.z - HEX_H * 8.5;

    // 6 perimeter vertices (pointy-top, starting from north)
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI / 2 - i * Math.PI / 3;
      positions.push(
        cx + HEX_SIZE * Math.cos(angle),
        -0.002,
        cz + HEX_SIZE * Math.sin(angle)
      );
    }

    // Center vertex
    positions.push(cx, -0.002, cz);

    // 6 triangles: center + edge pair
    for (let i = 0; i < 6; i++) {
      indices.push(vertexOffset + 6);                    // center
      indices.push(vertexOffset + i);                    // vi
      indices.push(vertexOffset + (i + 1) % 6);           // v(i+1)
    }

    vertexOffset += 7;
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2a6aba,
    transparent: true,
    opacity: 0.5,
    roughness: 0.3,
    metalness: 0.0,
    side: THREE.DoubleSide,
    flatShading: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.userData.isWaterSurface = true;
  scene.add(mesh);

  return RIVER_TILES.length;
}

/**
 * Build the world-river platform beneath the hex grid.
 */
export function buildPlatform(scene, centerX, centerZ) {
  const S = 64;

  const rings = [
    { inner: 0, outer: 8, color: 0x0a1a2e },
    { inner: 8, outer: 14, color: 0x0f2a4a },
    { inner: 14, outer: 21, color: 0x1a4a5a },
    { inner: 21, outer: 28, color: 0x28606a },
    { inner: 28, outer: 34, color: 0x1a3a5a },
  ];

  rings.forEach(r => {
    const geo = new THREE.RingGeometry(r.inner, r.outer, S);
    const mat = new THREE.MeshStandardMaterial({
      color: r.color, flatShading: true, roughness: 0.95, metalness: 0, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(centerX, -0.04, centerZ);
    mesh.receiveShadow = true;
    scene.add(mesh);
  });

  const rimGeo = new THREE.RingGeometry(34, 37, S);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x2a1e15, flatShading: true, roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(centerX, 0.06, centerZ);
  rim.receiveShadow = true;
  scene.add(rim);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a100a, flatShading: true, roughness: 0.75, metalness: 0.15, side: THREE.DoubleSide
  });
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(37, 37, 0.08, S, 1, true), wallMat);
  outerWall.position.set(centerX, 0.04, centerZ);
  scene.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(34, 34, 0.08, S, 1, true), wallMat);
  innerWall.position.set(centerX, 0.04, centerZ);
  scene.add(innerWall);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(37, 42, S),
    new THREE.MeshStandardMaterial({
      color: 0x3a4a5a, flatShading: true, roughness: 1, metalness: 0,
      transparent: true, opacity: 0.25, side: THREE.DoubleSide
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(centerX, -0.06, centerZ);
  scene.add(halo);

  return { rings: rings.length + 2 };
}

/**
 * Build canvas sprite labels for place names
 */
export function buildLabels(scene, centerX, centerZ) {
  const labels = [];

  CELLS.forEach(c => {
    if (!c.label) return;

    const p = axialToWorld(c.q, c.r);
    const pos = new THREE.Vector3(p.x + centerX, 0.8, p.z - HEX_H * 8.5);

    const isBuilding = !!c.occ;
    const text = c.label;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const rr = 6;
    ctx.beginPath();
    ctx.moveTo(4 + rr, 4);
    ctx.lineTo(508 - rr, 4);
    ctx.quadraticCurveTo(508, 4, 508, 4 + rr);
    ctx.lineTo(508, 60 - rr);
    ctx.quadraticCurveTo(508, 60, 508 - rr, 60);
    ctx.lineTo(4 + rr, 60);
    ctx.quadraticCurveTo(4, 60, 4, 60 - rr);
    ctx.lineTo(4, 4 + rr);
    ctx.quadraticCurveTo(4, 4, 4 + rr, 4);
    ctx.closePath();

    if (isBuilding) {
      ctx.fillStyle = 'rgba(8,6,14,0.75)';
      ctx.strokeStyle = 'rgba(180,200,220,0.2)';
      ctx.lineWidth = 1;
    } else {
      ctx.fillStyle = 'rgba(8,6,14,0.5)';
    }
    ctx.fill();
    if (isBuilding) ctx.stroke();

    ctx.font = isBuilding ? 'bold 20px Georgia' : '15px Georgia';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isBuilding ? '#d0d8e0' : '#6a8a9a';
    ctx.fillText(text, 256, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(isBuilding ? 2.0 : 1.4, isBuilding ? 0.26 : 0.2, 1);
    sprite.position.copy(pos);
    sprite.userData.isLabel = true;
    scene.add(sprite);
    labels.push(sprite);
  });

  return labels;
}