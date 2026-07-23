import { Float32BufferAttribute } from 'three';

function toFloatAttribute(attribute) {
  const values = new Float32Array(attribute.count * attribute.itemSize);
  for (let index = 0; index < attribute.count; index++) {
    for (let component = 0; component < attribute.itemSize; component++) {
      values[index * attribute.itemSize + component] = attribute.getComponent(index, component);
    }
  }
  return new Float32BufferAttribute(values, attribute.itemSize);
}

/**
 * Extract the first mesh in scene space.
 *
 * gltfpack stores quantized integer coordinates and a compensating node
 * transform. BufferGeometry.applyMatrix4 writes transformed values back through
 * integer setters, which clamps them. Convert transform-sensitive attributes to
 * float first, then bake the complete node world matrix for InstancedMesh.
 */
export function extractMeshData(gltf) {
  let geometry = null;
  let material = null;

  gltf.scene.updateMatrixWorld(true);
  gltf.scene.traverse(child => {
    if (child.isMesh && !geometry) {
      geometry = child.geometry.clone();
      ['position', 'normal', 'tangent'].forEach(name => {
        const attribute = geometry.getAttribute(name);
        if (attribute && (!(attribute.array instanceof Float32Array) || attribute.normalized)) {
          geometry.setAttribute(name, toFloatAttribute(attribute));
        }
      });
      geometry.applyMatrix4(child.matrixWorld);
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
      material = child.material;
    }
  });

  return { geometry, material };
}
