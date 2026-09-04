import { GitBranch,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Bell, Braces } from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group";
import {IdeBarItem} from "@/features/ideUi/ideBarItem"

export const IdeFooter = () =>{
    return (
        <footer className="h-6 w-full flex items-center justify-between px-2 text-xs text-slate-500 font-normal shrink-0 select-none ">
        {/* Left Side Elements */}
        <div className="flex items-center h-full">
          <IdeBarItem 
        tooltip="Connected to Remote Server"
        icon={<span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
        text="ONS: UR5"
      />
          {/* Git Status Group */}
          <ButtonGroup>
  {/* 1. Git Branch Tooltip */}
  <IdeBarItem 
        tooltip="Git Repository: Current Active Branch"
        icon={<GitBranch className="h-3 w-3 text-slate-500 group-hover:text-slate-100 transition-colors" />}
        text="main*"
        className="ml-1"
      />
  {/* 2. Refresh Sync Tooltip */}
  <IdeBarItem 
        tooltip="Synchronise Changes with Remote Server"
        icon={<RefreshCw className="h-2.5 w-2.5 text-slate-500 animate-[spin_4s_linear_infinite]" />}
        className="px-1 mr-1"
      />
</ButtonGroup>
          {/* Errors & Warnings Tracker */}
          <IdeBarItem 
        tooltip="Error/Warning">
          <XCircle className="h-3 w-3 text-rose-500" />
              <span>0</span>
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>2</span>
        </IdeBarItem>
        </div>
        <div className="flex items-center h-full gap-1 pr-1">
            <IdeBarItem 
        tooltip="Go to Line/Column" 
        text="Ln 45, Col 12" 
        className="group"
      />

      {/* 2. Indentation Configuration */}
      <IdeBarItem 
        tooltip="Select Indentation" 
        text="Spaces: 2" 
      />

      {/* 3. File Encoding Settings */}
      <IdeBarItem 
        tooltip="Select Encoding" 
        text="UTF-8" 
      />

      {/* 4. Language Mode Selector */}
      <IdeBarItem 
        tooltip="Select Language Mode" 
        icon={<Braces className="h-3 w-3" />} // Kept small to match your bell icon layout scale
        text="TypeScript JSX" 
      />

      {/* 5. Notification Bell Icon */}
      <IdeBarItem 
        tooltip="Notification" 
        icon={<Bell className="h-3 w-3" />} 
      />
        </div>
        
      </footer>
    )
}

export default IdeFooter