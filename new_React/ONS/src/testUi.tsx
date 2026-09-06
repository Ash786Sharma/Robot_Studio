"use client"

import React from "react"
import { Plus, FolderOpen, XCircle } from "lucide-react"
import { useIdeStore } from "@/core/store/ideStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface IdeMenuItemProps {
  // ⚡ Using React.ReactElement allows Base UI's render mechanism to pass triggers down perfectly
  menuButton: React.ReactElement 
}

export const IdeMenuItem = ({ menuButton }: IdeMenuItemProps) => {
  const { createNewProject, openExistingProject, closeProject } = useIdeStore()

  return (
    <DropdownMenu>
      {/* ⚡ Base UI standard: render safely handles the IdeBarItem button styles without adding layout layers */}
      <DropdownMenuTrigger render={menuButton} />

      <DropdownMenuContent 
        side="right" 
        align="start" 
        sideOffset={12}
        className="min-w-52 rounded-xl p-1.5 select-none bg-[var(--popover)] border-[var(--border)] text-[var(--ide-text-inactive)] shadow-xl"
        style={{ '--tw-shadow-color': 'var(--ide-tooltip-shadow)' } as React.CSSProperties}
      >
        <DropdownMenuGroup className="flex flex-col gap-0.5">
          <DropdownMenuItem 
            onClick={createNewProject}
            className="flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-[var(--ide-text-inactive)] data-[highlighted]:bg-[var(--ide-item-hover)] data-[highlighted]:text-[var(--foreground)]"
          >
            <Plus className="h-4 w-4 text-current shrink-0" />
            <span className="flex-1 tracking-wide">Create New Project</span>
          </DropdownMenuItem>

          <DropdownMenuItem 
            onClick={openExistingProject}
            className="flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-[var(--ide-text-inactive)] data-[highlighted]:bg-[var(--ide-item-hover)] data-[highlighted]:text-[var(--foreground)]"
          >
            <FolderOpen className="h-4 w-4 text-current shrink-0" />
            <span className="flex-1 tracking-wide">Open Existing Project</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1.5 mx-1 bg-[var(--border)]" />

        <DropdownMenuGroup>
          <DropdownMenuItem 
            onClick={closeProject}
            className="flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-red-400 data-[highlighted]:bg-red-950/30 data-[highlighted]:text-red-400"
          >
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1 tracking-wide">Close Project</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default IdeMenuItem
