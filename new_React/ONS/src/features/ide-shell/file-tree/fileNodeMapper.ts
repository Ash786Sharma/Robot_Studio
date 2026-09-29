import type { FileNodeDto } from "@/core/api/filesApi"
import type { TreeNode } from "./fileTree.types"

const fileIconByType: Record<string, string> = {
  ld: "Workflow",
  graph: "Workflow",
  scl: "FileCode",
  db: "Database",
  "hmi ui": "MonitorSmartphone",
  rprg: "FileCode",
  rgprg: "Workflow",
  rsprg: "Shield",
  rsgprg: "Shield",
}

const folderIconByType: Record<string, string> = {
  "kinematic root link": "CircleDot",
  "kinematic tcp link": "Crosshair",
  "kinematic link": "Box",
  "kinematic joint": "Rotate3D",
}

function resolveIcon(kind: "folder" | "file", fileType?: string | null): string {
  if (kind === "folder") return (fileType && folderIconByType[fileType]) || "Folder"
  return (fileType && fileIconByType[fileType]) || "File"
}

// Backend nodes carry a real `fileType` per folder/file (e.g. "robot folder",
// "kinematic joint") that the tree UI's `type` union matches on directly.
export function mapFileNodeToTreeNode(node: FileNodeDto): TreeNode {
  return {
    id: node.id,
    name: node.name,
    type: node.fileType ?? (node.kind === "folder" ? "device folder" : "robot program file"),
    icon: resolveIcon(node.kind, node.fileType),
    kind: node.kind,
    fileType: node.fileType,
    visualMeshKey: node.visualMeshKey,
    collisionMeshKey: node.collisionMeshKey,
    children: node.children?.map(mapFileNodeToTreeNode),
  }
}
