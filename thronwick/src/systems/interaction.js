/**
 * Interaction System — raycast-based click-to-inspect
 */
import * as THREE from 'three';
import { ENTITY_DB } from '../data/worldData.js';

/**
 * Setup click interaction on the scene
 */
export function setupInteraction(scene, camera, domElement, callbacks) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredObject = null;

  function getAssetKey(object) {
    let node = object;
    while (node.parent) {
      if (node.userData && node.userData.assetKey) return node.userData.assetKey;
      // Check if this is an InstancedMesh with userData
      if (node.isInstancedMesh && node.userData.tileType) {
        return node.userData.tileType === 'grass' ? 'hex_grass' :
               node.userData.tileType === 'river' ? 'hex_river_A' : 'hex_road_A';
      }
      node = node.parent;
    }
    return null;
  }

  function onClick(event) {
    // Don't interact if modal is open
    if (callbacks.isModalOpen && callbacks.isModalOpen()) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Get all meshes and instanced meshes
    const meshes = [];
    scene.traverse(child => {
      if (child.isMesh || child.isInstancedMesh) {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const assetKey = getAssetKey(hit);

      if (assetKey && ENTITY_DB[assetKey]) {
        callbacks.onInspect(assetKey);
        return;
      }

      // Check if hit is an instance of an instanced mesh
      if (hit.isInstancedMesh) {
        const instanceId = hit.instanceId;
        if (instanceId !== undefined && hit.userData.tileType) {
          const tileKey = hit.userData.tileType === 'grass' ? 'hex_grass' :
                          hit.userData.tileType === 'river' ? 'hex_river_A' : 'hex_road_A';
          if (ENTITY_DB[tileKey]) {
            callbacks.onInspect(tileKey);
            return;
          }
        }
      }
    }
  }

  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes = [];
    scene.traverse(child => {
      if (child.isMesh || child.isInstancedMesh) {
        meshes.push(child);
      }
    });

    const intersects = raycaster.intersectObjects(meshes, false);
    const hit = intersects.length > 0 ? intersects[0].object : null;

    // Change cursor on hoverable items
    if (hit) {
      const assetKey = getAssetKey(hit);
      if (assetKey && ENTITY_DB[assetKey]) {
        domElement.style.cursor = 'pointer';
        return;
      }
    }
    domElement.style.cursor = 'default';
  }

  domElement.addEventListener('click', onClick);
  domElement.addEventListener('mousemove', onMouseMove);

  // Return cleanup function
  return () => {
    domElement.removeEventListener('click', onClick);
    domElement.removeEventListener('mousemove', onMouseMove);
  };
}