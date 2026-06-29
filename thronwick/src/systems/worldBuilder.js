/**
 * World Builder — places Layer 0 tiles, Layer 1 environments, and Layer 2 occupants
 */
import * as THREE from 'three';
import { CELLS, axialToWorld, BIOMES, HEX_W, HEX_H, ENTITY_DB } from '../data/worldData.js';
import { getAsset, extractMeshData } from './assetLoader.js';
import { createPRNG } from '../utils/prng.js';

const RNG = createPRNG(1337); // deterministic seed for reproducible layout
const rY = () => RNG() * Math.PI * 2;
const rS = (min, max) => min + RNG() * (max - min);

/**
 * Build Layer 0 hex tiles using InstancedMesh for performance.
 * Returns the number of instances created.
 */
export function buildTiles(scene, progressCb) {
  // Group cells by tile type
  const groups = { grass: [], river: [], road: [] };
  CELLS.forEach(c => {
    const type = c.tileType || 'grass';
    if (!groups[type]) groups[type] = [];
    const p = axialToWorld(c.q, c.r);
    groups[type].push(new THREE.Vector3(p.x + HEX_W * 3, 0, p.z - HEX_H * 1)); // offset for centering
  });

  let totalInstances = 0;

  Object.entries(groups).forEach(([type, positions]) => {
    if (positions.length === 0) return;
    const assetKey = type === 'grass' ? 'hex_grass' : type === 'river' ? 'hex_river_A' : 'hex_road_A';
    const gltf = getAsset(assetKey);
    if (!gltf) {
      console.warn(`[WorldBuilder] Missing tile asset: ${assetKey}`);
      return;
    }

    const { geometry, material } = extractMeshData(gltf);
    if (!geometry) {
      console.warn(`[WorldBuilder] No mesh in ${assetKey}`);
      return;
    }

    // Clone material for instancing (each batch gets its own)
    const mat = material.clone();
    mat.flatShading = true;

    const mesh = new THREE.InstancedMesh(geometry, mat, positions.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.isTile = true;
    mesh.userData.tileType = type;

    const dummy = new THREE.Object3D();
    positions.forEach((p, i) => {
      dummy.position.copy(p);
      dummy.position.y = -0.005; // slight ground sink
      dummy.rotation.set(0, (i % 6) * (Math.PI / 3), 0); // 60° variation
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    totalInstances += positions.length;

    if (progressCb) progressCb(`L0 ${assetKey}: ${positions.length} instances`);
  });

  return totalInstances;
}

/**
 * Build Layer 2 occupants (buildings + major features).
 * Returns count of placed occupants.
 */
export function buildOccupants(scene, progressCb) {
  let count = 0;

  CELLS.forEach(c => {
    if (!c.occ) return;

    const gltf = getAsset(c.occ);
    if (!gltf) {
      console.warn(`[WorldBuilder] Missing occupant: ${c.occ}`);
      return;
    }

    const p = axialToWorld(c.q, c.r);
    const pos = new THREE.Vector3(p.x + HEX_W * 3, 0, p.z - HEX_H * 1);

    const obj = gltf.scene.clone(true);
    obj.position.copy(pos);
    obj.position.y = 0;

    // Scale: use cell-specific scale or default from asset
    const baseScale = c.occScale || 0.55;
    const scaleVar = rS(0.9, 1.1);
    const s = baseScale * scaleVar;
    obj.scale.set(s, s, s);

    // Rotation: use cell-specific or random
    obj.rotation.y = c.occRotY !== undefined ? c.occRotY : rY();

    // Tag all meshes inside
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

  return count;
}

/**
 * Build Layer 1 environment props (trees, rocks, props, clouds).
 * Returns counts of items placed.
 */
export function buildEnvironment(scene, progressCb) {
  let totalItems = 0;
  let cloudItems = 0;

  CELLS.forEach(c => {
    if (!c.env || c.env.length === 0) return;

    const p = axialToWorld(c.q, c.r);
    const basePos = new THREE.Vector3(p.x + HEX_W * 3, 0, p.z - HEX_H * 1);

    // Validate: if cell has an occupant, skip L1 (exclusive)
    if (c.occ) return;

    // Place each env item
    c.env.forEach((assetKey, idx) => {
      const gltf = getAsset(assetKey);
      if (!gltf) return;

      const regEntry = null; // not needed for type checking
      const isCloud = assetKey === 'cloud_big';

      // Jitter position within hex
      const jitterAmt = isCloud ? 0.4 : 0.25;
      const pos = basePos.clone().add(
        new THREE.Vector3(
          (RNG() - 0.5) * jitterAmt,
          0,
          (RNG() - 0.5) * jitterAmt
        )
      );

      if (isCloud) {
        // Cloud float height by biome
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

      // Scale based on type
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
      else if (assetKey.startsWith('fence_')) scale = rS(0.22, 0.3);
      else if (assetKey.startsWith('rope_')) scale = rS(0.18, 0.25);
      else if (assetKey.startsWith('bucket_')) scale = rS(0.18, 0.25);
      else scale = rS(0.18, 0.28);

      obj.scale.set(scale, scale, scale);

      // Ground items: slight sink; clouds: no sink
      if (isCloud) {
        // Clouds float
      } else {
        obj.position.y = -0.005; // 0.5% ground sink
      }

      obj.position.copy(pos);
      obj.rotation.y = rY();

      // Tag for interaction
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
 * Build the world-river platform beneath the hex grid.
 * A decorative disc representing the Okeanos-style foundation.
 */
export function buildPlatform(scene, centerX, centerZ) {
  const S = 48;

  // Create concentric rings
  const rings = [
    { inner: 0, outer: 6.5, color: 0x0a1a2e },
    { inner: 6.5, outer: 11, color: 0x0f2a4a },
    { inner: 11, outer: 16, color: 0x1a4a5a },
    { inner: 16, outer: 20.5, color: 0x28606a },
  ];

  rings.forEach(r => {
    const geo = new THREE.RingGeometry(r.inner, r.outer, S);
    const mat = new THREE.MeshStandardMaterial({
      color: r.color,
      flatShading: true,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(centerX, -0.04, centerZ);
    mesh.receiveShadow = true;
    scene.add(mesh);
  });

  // Outer rim (land)
  const rimGeo = new THREE.RingGeometry(20.5, 23, S);
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0x2a1e15,
    flatShading: true,
    roughness: 0.75,
    metalness: 0.15,
    side: THREE.DoubleSide
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(centerX, 0.06, centerZ);
  rim.receiveShadow = true;
  scene.add(rim);

  // Outer wall
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a100a,
    flatShading: true,
    roughness: 0.75,
    metalness: 0.15,
    side: THREE.DoubleSide
  });
  const outerWall = new THREE.Mesh(new THREE.CylinderGeometry(23, 23, 0.08, S, 1, true), wallMat);
  outerWall.position.set(centerX, 0.04, centerZ);
  scene.add(outerWall);

  const innerWall = new THREE.Mesh(new THREE.CylinderGeometry(20.5, 20.5, 0.08, S, 1, true), wallMat);
  innerWall.position.set(centerX, 0.04, centerZ);
  scene.add(innerWall);

  // Outer glow halo
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(23, 27, S),
    new THREE.MeshStandardMaterial({
      color: 0x3a4a5a,
      flatShading: true,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
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

  // Biome/area labels
  CELLS.forEach(c => {
    if (!c.label) return;

    const p = axialToWorld(c.q, c.r);
    const pos = new THREE.Vector3(p.x + centerX, 0.8, p.z - HEX_H * 1);

    const isBuilding = !!c.occ;
    const text = c.label;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Rounded rect bg
    const r = 6;
    ctx.beginPath();
    ctx.moveTo(4 + r, 4);
    ctx.lineTo(508 - r, 4);
    ctx.quadraticCurveTo(508, 4, 508, 4 + r);
    ctx.lineTo(508, 60 - r);
    ctx.quadraticCurveTo(508, 60, 508 - r, 60);
    ctx.lineTo(4 + r, 60);
    ctx.quadraticCurveTo(4, 60, 4, 60 - r);
    ctx.lineTo(4, 4 + r);
    ctx.quadraticCurveTo(4, 4, 4 + r, 4);
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