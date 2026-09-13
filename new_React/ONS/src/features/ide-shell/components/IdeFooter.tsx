import { 
  RefreshCw,
  XCircle,
  AlertTriangle,
  Bell, 
  Braces, 
  GitBranchPlus 
} from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"
import { IdeBarItem } from "./IdeBarItem"

export const IdeFooter = () => {
  return (
    /* 
      ⚡ FIXED THEME BACKGROUND & TEXT:
      Changed container to `bg-ide-panel text-foreground border-t border-border` 
      so it morphs perfectly with your custom VS Code, Catppuccin, or Dracula rules.
    */
    <footer className="h-5.5 w-full flex items-center justify-between px-2 text-xs font-normal shrink-0 select-none bg-ide-panel text-foreground ">
      
      {/* Left Side Elements */}
      <div className="flex items-center h-full gap-0.5">
        
        {/* Remote Server Node Connection */}
        <IdeBarItem 
          tooltip="Connected to Remote Server"
          icon={<span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />}
          text="ONS: UR5"
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />
        
        {/* Git Status Group */}
        <ButtonGroup>
          {/* 1. Git Branch Tooltip */}
          <IdeBarItem 
            tooltip="Git Repository: Current Active Branch"
            icon={<GitBranchPlus className="h-3 w-3 text-ide-inactive group-hover:text-foreground transition-colors" />}
            text="main*"
            className="ml-1 bg-transparent border-none text-inherit hover:bg-ide-hover"
          />
          {/* 2. Refresh Sync Tooltip */}
          <IdeBarItem 
            tooltip="Synchronise Changes with Remote Server"
            icon={<RefreshCw className="h-2.5 w-2.5 text-ide-inactive group-hover:text-foreground animate-[spin_4s_linear_infinite] transition-colors" />}
            className="px-1 mr-1 bg-transparent border-none text-inherit hover:bg-ide-hover"
          />
        </ButtonGroup>
        
        {/* Errors & Warnings Tracker */}
        <IdeBarItem 
          tooltip="Error/Warning"
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        >
          <div className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            <span className="text-inherit font-medium">{0}</span>
            <AlertTriangle className="h-3 w-3 text-amber-500 dark:text-amber-400" />
            <span className="text-inherit font-medium">{2}</span>
          </div>
        </IdeBarItem>
      </div>

      {/* Right Side Elements */}
      <div className="flex items-center h-full gap-0.5 pr-1">
        {/* 1. Go to Line/Column */}
        <IdeBarItem 
          tooltip="Go to Line/Column" 
          text="Ln 45, Col 12" 
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />

        {/* 2. Indentation Configuration */}
        <IdeBarItem 
          tooltip="Select Indentation" 
          text="Spaces: 2" 
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />

        {/* 3. File Encoding Settings */}
        <IdeBarItem 
          tooltip="Select Encoding" 
          text="UTF-8" 
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />

        {/* 4. Language Mode Selector */}
        <IdeBarItem 
          tooltip="Select Language Mode" 
          icon={<Braces className="h-3 w-3 text-ide-inactive group-hover:text-foreground transition-colors" />} 
          text="TypeScript JSX" 
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />

        {/* 5. Notification Bell Icon */}
        <IdeBarItem 
          tooltip="Notification" 
          icon={<Bell className="h-3 w-3 text-ide-inactive group-hover:text-foreground transition-colors" />} 
          className="bg-transparent border-none text-inherit hover:bg-ide-hover"
        />
      </div>
        
    </footer>
  )
}

export default IdeFooter
