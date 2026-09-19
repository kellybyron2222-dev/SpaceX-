/** World box for one mesh. InstancedMesh uses instance spread, not one hex at the origin. */
export function copyMeshWorldBox(node, target) {
  if (!node?.isMesh || !node.geometry) return false;
  if (node.isInstancedMesh) {
    node.computeBoundingBox();
    if (node.boundingBox && !node.boundingBox.isEmpty()) {
      target.copy(node.boundingBox).applyMatrix4(node.matrixWorld);
      return true;
    }
  }
  const geom = node.geometry;
  if (!geom.boundingBox) geom.computeBoundingBox();
  if (!geom.boundingBox) return false;
  target.copy(geom.boundingBox).applyMatrix4(node.matrixWorld);
  return true;
}

/** Bounding box that skips decorative ground / sea meshes (userData.skipFrame). */
export function unionFilteredBounds(object, target, scratch) {
  target.makeEmpty();
  object.updateWorldMatrix(true, true);
  object.traverse((node) => {
    if (node.userData.skipFrame) return;
    if (!copyMeshWorldBox(node, scratch)) return;
    target.union(scratch);
  });
  if (target.isEmpty()) target.setFromObject(object);
  return target;
}
