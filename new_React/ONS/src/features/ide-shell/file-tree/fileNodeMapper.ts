import type { FileNodeDto } from "@/core/api/filesApi"
import type { TreeNode } from "./fileTree.types"

const fileIconByType: Record<string, string> = {
  ld: "Workflow",
  graph: "Workflow",
  scl: "FileCode",
  db: "Database",
  "hmi ui": "MonitorSmartphone",
}

function resolveIcon(kind: "folder" | "file", fileType?: string | null): string {
  if (kind === "folder") return "Folder"
  return (fileType && fileIconByType[fileType]) || "File"
}

// Backend nodes are generic (kind/fileType); the tree UI wants a richer, IDE-specific
// "type" + icon. Folders default to "device folder" until real project scaffolding exists.
export function mapFileNodeToTreeNode(node: FileNodeDto): TreeNode {
  return {
    id: node.id,
    name: node.name,
    type: node.kind === "folder" ? "device folder" : (node.fileType ?? "robot program file"),
    icon: resolveIcon(node.kind, node.fileType),
    children: node.children?.map(mapFileNodeToTreeNode),
  }
}
