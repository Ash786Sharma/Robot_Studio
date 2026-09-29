import type { OrdDocument, OrdJoint } from "./ord.schema.js";

export interface SyntheticFileNode {
  id: string;
  projectId: string;
  parentId: string;
  name: string;
  kind: "folder";
  fileType: string;
  storageKey: null;
  /** Storage key of this link's visual mesh (if any) — lets the 3D viewer resolve what to highlight/load for the selected node. */
  visualMeshKey?: string | null;
  /** Storage key of this link's collision mesh (if any), separate from the visual mesh since robots often use a lower-poly mesh here. */
  collisionMeshKey?: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: SyntheticFileNode[];
}

/**
 * Builds the Kinematic Chain's link/joint nodes straight from the .ord
 * document — a flat, traversal-ordered list (not nested joint-inside-link
 * folders, which indents 10+ levels deep in the explorer). These are never
 * persisted as file_nodes; the .ord is the single source of truth, so the
 * tree always reflects whatever the .ord currently says.
 */
export function synthesizeKinematicChainNodes(
  projectId: string,
  kinematicChainId: string,
  ord: OrdDocument,
): SyntheticFileNode[] {
  const rootLink = ord.links.find((link) => link.parent === null);
  if (!rootLink) return [];

  const childJointsByParentLink = new Map<string, OrdJoint[]>();
  for (const joint of ord.joints) {
    if (!childJointsByParentLink.has(joint.parent)) childJointsByParentLink.set(joint.parent, []);
    childJointsByParentLink.get(joint.parent)!.push(joint);
  }

  const visualMeshByLink = new Map(ord.meshes.visual.map((mesh) => [mesh.link, mesh.storageKey]));
  const collisionMeshByLink = new Map(ord.meshes.collision.map((mesh) => [mesh.link, mesh.storageKey]));

  const now = new Date();
  const nodes: SyntheticFileNode[] = [];

  function addLink(linkName: string, isRoot: boolean) {
    const outgoingJoints = childJointsByParentLink.get(linkName) ?? [];
    nodes.push({
      id: `${kinematicChainId}:link:${linkName}`,
      projectId,
      parentId: kinematicChainId,
      name: linkName,
      kind: "folder",
      fileType: isRoot ? "kinematic root link" : outgoingJoints.length === 0 ? "kinematic tcp link" : "kinematic link",
      storageKey: null,
      visualMeshKey: visualMeshByLink.get(linkName) ?? null,
      collisionMeshKey: collisionMeshByLink.get(linkName) ?? null,
      createdAt: now,
      updatedAt: now,
      children: [],
    });
    for (const joint of outgoingJoints) {
      nodes.push({
        id: `${kinematicChainId}:joint:${joint.name}`,
        projectId,
        parentId: kinematicChainId,
        name: joint.name,
        kind: "folder",
        fileType: "kinematic joint",
        storageKey: null,
        createdAt: now,
        updatedAt: now,
        children: [],
      });
      addLink(joint.child, false);
    }
  }

  addLink(rootLink.name, true);
  return nodes;
}
