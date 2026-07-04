/**
 * Thronwick Kingdom — Main Entry Point
 * 
 * Orchestrates scene setup, asset loading, world building, interaction, and UI.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getReferencedAssetKeys, loadAssets } from './systems/assetLoader.js';
import { buildPlatform, buildTiles, buildOccupants, buildEnvironment, buildLabels, buildRiverWaterSurface } from './systems/worldBuilder.js';
import { RIVER_PATH, FIELD_PACKS } from './data/worldData.js';
import { setupInteraction } from './systems/interaction.js';
import { CELLS, ENTITY_DB, HEX_W, HEX_H } from './data/worldData.js';

// ── DOM refs ──
const logEl = document.getElementById('log');
const fpsEl = document.getElementById('fps');
const modalOverlay = document.getElementById('modal-overlay');
const closeBtn = document.getElementById('close-btn');
const pTitle = document.getElementById('parchment-title');
const pDesc = document.getElementById('parchment-desc');
const pStats = document.getElementById('parchment-stats');

// ── Logging ──
const logBuf = [];
function log(msg, cls = '') {
  logBuf.push(cls ? `<span class="${cls}">${msg}</span>` : msg);
  logEl.innerHTML = logBuf.join('<br>');
  logEl.scrollTop = logEl.scrollHeight;
}
function sep() { log('━'.repeat(32), 'sep'); }
function ok(msg) { log(msg, 'ok'); }
function warn(msg) { log(msg, 'warn'); }

// ── Three.js Setup ──
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const skyColor = 0x2a3a4a;
const scene = new THREE.Scene();
scene.background = new THREE.Color(skyColor);
scene.fog = new THREE.FogExp2(skyColor, 0.005);

// Camera — elevated overhead view
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 80);
camera.position.set(8, 28, 30);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2.05;
controls.target.set(0, 0, 0);
controls.update();

// ── Lighting ──
const ambient = new THREE.AmbientLight(0x8fb0d0, 0.55);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffe5b0, 1.6);
sun.position.set(12, 20, 10);
sun.castShadow = true;
sun.shadow.mapSize.width = 2048;
sun.shadow.mapSize.height = 2048;
sun.shadow.camera.left = -40;
sun.shadow.camera.right = 40;
sun.shadow.camera.top = 40;
sun.shadow.camera.bottom = -40;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 60;
scene.add(sun);

const fill = new THREE.DirectionalLight(0x5580a0, 0.3);
fill.position.set(-8, 6, -6);
scene.add(fill);

// ── World Center ──
const CENTER_X = HEX_W * 0;
const CENTER_Z = -HEX_H * 8.5;

// ── Modal State ──
let modalOpen = false;

// ── Main Build ──
async function main() {
  const t0 = performance.now();
  log('κ Weaving the Kingdom of Thronwick…');
  log('⏤ from the 3D Grammar of Thornwick ⏤', 'dim');
  sep();

  // 1. Platform
  log('ϟ Raising world-river platform…', 'dim');
  buildPlatform(scene, CENTER_X, CENTER_Z);
  ok('Platform complete — 6 concentric rings');

  // 2. Determine required assets
  const allKeys = getReferencedAssetKeys(CELLS);
  log(`⌂ Loading ${allKeys.length} asset types…`, 'dim');

  const loadResult = await loadAssets(allKeys);
  const loadTime = ((performance.now() - t0) / 1000).toFixed(1);
  ok(`${loadResult.loaded}/${loadResult.total} assets loaded in ${loadTime}s`);
  if (loadResult.failed > 0) {
    warn(`${loadResult.failed} assets failed — some items may be missing`);
  }
  sep();

  // 3. Layer 0 — Tiles (with river variants)
  log('ϟ Building hex tiles (Layer 0)…', 'dim');
  const tileCount = buildTiles(scene, (msg) => ok(msg));
  ok(`${tileCount} hex tiles placed`);

  // 4. River water surface — single merged mesh for seamless continuity
  log('ϟ Weaving continuous water surface…', 'dim');
  const waterTileCount = buildRiverWaterSurface(scene, CENTER_X, CENTER_Z);
  ok(`Water surface: ${waterTileCount} river tiles merged into one seamless mesh`);

  // 5. Water chain system report
  const waterChainCount = CELLS.filter(c => c.tileType === 'water').length;
  ok(`Water chain: ${waterChainCount} pure water tiles (hex_water) — no env, no occ`);

  // 5. Field packs report
  const totalFieldCells = FIELD_PACKS.reduce((s, p) => s + p.cells.length, 0);
  ok(`Field packs: ${FIELD_PACKS.length} packs, ${totalFieldCells} total tiles (${FIELD_PACKS.map(p => `${p.packId}: ${p.cells.length} tiles`).join(', ')})`);

  // 6. Layer 2 — Occupants (buildings + field pack centroids)
  log('ϟ Placing buildings & field occupants (Layer 2)…', 'dim');
  const occCount = buildOccupants(scene, (msg) => ok(msg));
  ok(`${occCount} total occupants placed`);

  // 7. Layer 1 — Environment
  log('ϟ Scattering environment (Layer 1)…', 'dim');
  const envResult = buildEnvironment(scene, (msg) => ok(msg));
  ok(`${envResult.totalItems} environment items (${envResult.cloudItems} clouds)`);

  // 8. Labels
  log('ϟ Adding place labels…', 'dim');
  const labels = buildLabels(scene, CENTER_X, CENTER_Z);
  ok(`${labels.length} labels placed`);
  sep();

  // 7. Final stats
  const totalTime = ((performance.now() - t0) / 1000).toFixed(1);
  const objCount = countSceneObjects(scene);
  log(`Χ ${totalTime}s total build time`, 'ok');
  log(`Χ ${objCount} scene objects · ${loadResult.loaded} asset types used`, 'dim');
  log(`Χ ${CELLS.length} hex cells across 6 biomes`, 'dim');
  sep();
  log('✔ Thronwick Kingdom is complete', 'ok');
  log('⏤ Click any object to inspect — drag to orbit — scroll to zoom', 'dim');

  // 8. Interaction
  setupInteraction(scene, camera, renderer.domElement, {
    isModalOpen: () => modalOpen,
    onInspect: (assetKey) => showModal(assetKey)
  });

  // 9. Close modal
  closeBtn.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function countSceneObjects(s) {
  let count = 0;
  s.traverse(() => count++);
  return count;
}

function showModal(assetKey) {
  const data = ENTITY_DB[assetKey];
  if (!data) return;

  pTitle.textContent = data.title;
  pDesc.textContent = data.desc;
  pStats.innerHTML = '';

  Object.entries(data.stats).forEach(([k, v]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${k}</td><td class="stat-val">${v}</td>`;
    pStats.appendChild(tr);
  });

  modalOpen = true;
  modalOverlay.classList.add('active');
}

function closeModal() {
  modalOpen = false;
  modalOverlay.classList.remove('active');
}

// ── Animation Loop ──
let lastTime = performance.now();
let frameCount = 0;

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);

  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    fpsEl.textContent = `${frameCount} fps`;
    fpsEl.style.color = frameCount >= 50 ? '#7aaf6a' : frameCount >= 25 ? '#c9a84c' : '#c95a4c';
    frameCount = 0;
    lastTime = now;
  }
});

// ── Resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Start ──
main().catch(err => {
  sep();
  log(`☠ FATAL: ${err.message}`, 'err');
  console.error(err);
});