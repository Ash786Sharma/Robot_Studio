import { Terminal, FolderTree, Settings, ShieldAlert, Menu, Box, Move3D, GitBranch } from "lucide-react"
import { IdeBarItem } from "@/features/ideUi/ideBarItem"

export const IdeNavRail = () => {
  return (
    <nav className="w-12 flex flex-col justify-between items-center py-2 h-full shrink-0 ">
      
      {/* Top Section Actions */}
      <div className="flex flex-col gap-4 w-full items-center">
        {/* 1. Toggle Side Bar Menu */}
        <IdeBarItem
          tooltip="Toggle Menu"
          side="right"
          shortcutKeys={["Ctrl", "M"]}
          icon={<Menu className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl "
        />

        {/* 2. Project File Explorer (Active State Example) */}
        <IdeBarItem
          tooltip="Explorer"
          side="right"
          shortcutKeys={["Ctrl", "Shift", "E"]}
          icon={<FolderTree className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl"
          isActive={true} // Clean parameter toggle handles styles dynamically
        />

        <IdeBarItem
          tooltip="3D Viewer"
          side="right"
          shortcutKeys={["Ctrl","Shift", "D"]}
          icon={<Box className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl "
        />

        {/* 3. Integrated Terminal View */}
        <IdeBarItem
          tooltip="Terminal"
          side="right"
          shortcutKeys={["Ctrl", "`"]}
          icon={<Terminal className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl"
        />

        {/* 4. Active Project Error Diagnostics */}
        <IdeBarItem
          tooltip="Problems"
          side="right"
          shortcutKeys={["Ctrl", "Shift", "M"]}
          icon={<ShieldAlert className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl"
        />
      </div>

      {/* Bottom Section Actions */}
      <div className="w-full flex flex-col items-center">
        {/* 5. Workspace Configuration Panel */}
        <IdeBarItem
          tooltip="Settings"
          side="right"
          shortcutKeys={["Ctrl", ","]}
          icon={<Settings className="h-5 w-5" />}
          className="h-10 w-10 rounded-xl"
        />
      </div>

    </nav>
  )
}

export default IdeNavRail
