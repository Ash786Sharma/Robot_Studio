import React, { useEffect, useState } from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "@/lib/utils"
import { IdeMenuItem, type MenuGroupData, type MenuItemData } from "@/features/ide-shell/components/IdeMenuItem"
import type { WorkspaceFile } from "@/core/store/workspaceStore"
import treeActionsRaw from "@/config/treeItemActions.json"
import type { TreeNode } from "./fileTree.types"

export type { TreeNode }

export interface DraftNode {
  parentId: string;
  kind: "folder" | "file";
  fileType?: string;
  icon: string;
  placeholder: string;
}

interface FileTreeItemProps {
  node: TreeNode;
  depth?: number;
  // ⚡ FIXED: Added explicit typings so your layout workspace compiles seamlessly
  activeNodeId?: string;
  onNodeSelect?: (node: TreeNode) => void;
  onFileOpen?: (file: WorkspaceFile) => void;
  onAction?: (item: MenuItemData, node: TreeNode) => void | Promise<void>;
  path?: string[];
  renamingNodeId?: string | null;
  onRenameCommit?: (node: TreeNode, name: string) => void;
  onRenameCancel?: () => void;
  draftNode?: DraftNode | null;
  onDraftCommit?: (name: string) => void;
  onDraftCancel?: () => void;
}

const toWorkspaceFile = (node: TreeNode, path: string[]): WorkspaceFile | null => {
  const isFile = ["robot Safety program file", "robot program file", "ld", "graph", "scl", "db", "hmi ui", "hardware config", "software config"].includes(node.type)
  if (!isFile) return null

  const isRobot = node.type.includes("robot")
  return {
    id: node.id,
    name: node.name,
    path: [...path, node.name],
    icon: node.icon,
    type: node.type,
    blockType: node["block type"],
    device: isRobot ? "robot" : node.type === "hmi ui" ? "hmi" : ["ld", "graph", "scl", "db"].includes(node.type) ? "plc" : "unknown",
    safety: node.type.includes("Safety") || node.name.toLowerCase().includes("safety"),
  }
}

export const FileTreeItem = ({ 
  node, 
  depth = 0, 
  activeNodeId, 
  onNodeSelect,
  onFileOpen,
  onAction,
  path = [],
  renamingNodeId,
  onRenameCommit,
  onRenameCancel,
  draftNode,
  onDraftCommit,
  onDraftCancel,
}: FileTreeItemProps) => {
  const [isOpen, setIsOpen] = useState(depth === 0)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const hasDraftHere = draftNode?.parentId === node.id
  const hasChildren = Boolean(node.children && node.children.length > 0) || hasDraftHere

  // Auto-expand a folder that just received a new-file/new-folder draft row.
  useEffect(() => {
    if (hasDraftHere) setIsOpen(true)
  }, [hasDraftHere])

  const isRenaming = renamingNodeId === node.id
  const [renameValue, setRenameValue] = useState("")
  useEffect(() => {
    if (isRenaming) setRenameValue("")
  }, [isRenaming])

  const IconComponent = (LucideIcons[node.icon as keyof typeof LucideIcons] || LucideIcons.File) as React.ComponentType<{ className?: string }>
  const isSelected = activeNodeId === node.id

  const commitRename = () => onRenameCommit?.(node, renameValue)

  // ⚡ SMART FILTER ENGINE: Automatically splits folder variants based on name patterns
  const filteredActions: MenuGroupData[] = (treeActionsRaw as Array<{ groupId: string; items: any[] }>)
    .map(group => {
      const matchedItems = group.items.filter(item => {
        const allowedTypes = (item as any).showOn || []
        
        let evaluatedType = node.type;
        if (node.type === "program folder" && node.name.toLowerCase().includes("safety")) {
          evaluatedType = "safety program folder";
        }

        return allowedTypes.includes(evaluatedType)
      })

      return {
        groupId: group.groupId, 
        items: matchedItems
      }
    })
    .filter(group => group.items.length > 0)

  const handleRowClick = () => {
    if (isRenaming) return
    if (hasChildren) {
      setIsOpen(!isOpen)
    }
    // Fire your selection update method up to your IdeWorkspace state loop
    if (onNodeSelect) {
      onNodeSelect(node)
    }
    const workspaceFile = toWorkspaceFile(node, path)
    if (workspaceFile && onFileOpen) {
      onFileOpen(workspaceFile)
    }
  }

  return (
    <div className="w-full flex flex-col select-none">
      <div 
        className={cn(
          "group flex items-center justify-between py-1.5 px-2 rounded-md transition-all duration-150 text-xs font-medium cursor-pointer border border-transparent",
          "text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]",
          "hover:bg-[var(--ide-item-hover)]",
          isSelected && "bg-[var(--ide-item-active)] text-[var(--foreground)] border-[var(--border)]",
          isDropdownOpen && "bg-[var(--ide-item-hover)] text-[var(--foreground)]"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleRowClick}
      >
        <div className="flex items-center gap-2 overflow-hidden truncate">
          {hasChildren ? (
            <LucideIcons.ChevronDown className={cn("h-3.5 w-3.5 transition-transform shrink-0 opacity-60", !isOpen && "-rotate-90")} />
          ) : (
            <div className="w-3.5 h-3.5 shrink-0" />
          )}
          
          <IconComponent className="h-4 w-4 shrink-0 text-current" />
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              placeholder={node.name}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitRename() }
                else if (e.key === "Escape") { e.preventDefault(); onRenameCancel?.() }
              }}
              className="min-w-0 flex-1 rounded border border-[var(--primary)] bg-[var(--ide-surface-bg)] px-1 py-0.5 text-xs text-[var(--foreground)] outline-none"
            />
          ) : (
            <span className="truncate tracking-wide">{node.name}</span>
          )}
          
          {node["block type"] && (
            <span className="ml-1.5 px-1 py-0.25 text-[9px] uppercase tracking-wider rounded font-bold bg-[var(--ide-surface-bg)] text-[var(--ide-text-inactive)] border border-[var(--border)] shrink-0 scale-90">
              {node["block type"]}
            </span>
          )}
        </div>

        <div 
          className={cn(
            "flex items-center gap-0.5 transition-opacity duration-150", 
            isDropdownOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )} 
          onClick={(e) => e.stopPropagation()}
        >
          <IdeMenuItem 
            config={filteredActions}
            onAction={(item) => onAction?.(item, node)}
            open={isDropdownOpen}
            onOpenChange={setIsDropdownOpen}
            menuButton={
              <button className="p-1 rounded hover:bg-[var(--ide-surface-bg)] text-[var(--ide-text-inactive)] hover:text-[var(--foreground)] transition-colors outline-none">
                <LucideIcons.MoreVertical className="h-3.5 w-3.5" />
              </button>
            }
          />
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col w-full">
          {(node.children ?? []).map((child) => (
            <FileTreeItem 
              key={child.id} 
              node={child} 
              depth={depth + 1} 
              // ⚡ PASSED DOWN: Continuously route properties down to deeper sub-nodes
              activeNodeId={activeNodeId}
              onNodeSelect={onNodeSelect}
              onFileOpen={onFileOpen}
              onAction={onAction}
              path={[...path, node.name]}
              renamingNodeId={renamingNodeId}
              onRenameCommit={onRenameCommit}
              onRenameCancel={onRenameCancel}
              draftNode={draftNode}
              onDraftCommit={onDraftCommit}
              onDraftCancel={onDraftCancel}
            />
          ))}
          {hasDraftHere && draftNode && (
            <DraftRow depth={depth + 1} draftNode={draftNode} onCommit={onDraftCommit} onCancel={onDraftCancel} />
          )}
        </div>
      )}
    </div>
  )
}

interface DraftRowProps {
  depth: number;
  draftNode: DraftNode;
  onCommit?: (name: string) => void;
  onCancel?: () => void;
}

const DraftRow = ({ depth, draftNode, onCommit, onCancel }: DraftRowProps) => {
  const [value, setValue] = useState("")
  const DraftIcon = (LucideIcons[draftNode.icon as keyof typeof LucideIcons] || LucideIcons.File) as React.ComponentType<{ className?: string }>

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 text-xs font-medium text-[var(--foreground)]"
      style={{ paddingLeft: `${depth * 12 + 8 + 18}px` }}
    >
      <DraftIcon className="h-4 w-4 shrink-0 text-current" />
      <input
        autoFocus
        value={value}
        placeholder={draftNode.placeholder}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onCommit?.(value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); onCommit?.(value) }
          else if (e.key === "Escape") { e.preventDefault(); onCancel?.() }
        }}
        className="min-w-0 flex-1 rounded border border-[var(--primary)] bg-[var(--ide-surface-bg)] px-1 py-0.5 text-xs text-[var(--foreground)] outline-none"
      />
    </div>
  )
}
