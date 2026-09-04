import { 
  RefreshCw,
  XCircle,
  AlertTriangle,
  Bell, Braces, GitBranchPlus } from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"
import { IdeBarItem } from "@/features/ideUi/ideBarItem"

export const IdeFooter = () => {
  return (
    // Replaced text-slate-500 with bg-primary and text-primary-foreground to support themes beautifully
    <footer className="h-5.5 w-full flex items-center justify-between px-2 text-xs font-normal shrink-0 select-none">
      
      {/* Left Side Elements */}
      <div className="flex items-center h-full gap-0.5">
        
        {/* Remote Server Node Connection */}
        <IdeBarItem 
          tooltip="Connected to Remote Server"
          icon={<span className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]" />}
          text="ONS: UR5"
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />
        
        {/* Git Status Group */}
        <ButtonGroup>
          {/* 1. Git Branch Tooltip */}
          <IdeBarItem 
            tooltip="Git Repository: Current Active Branch"
            icon={<GitBranchPlus className="h-3 w-3 text-primary-foreground/80 group-hover:text-primary-foreground transition-colors" />}
            text="main*"
            className="ml-1 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
          />
          {/* 2. Refresh Sync Tooltip */}
          <IdeBarItem 
            tooltip="Synchronise Changes with Remote Server"
            icon={<RefreshCw className="h-2.5 w-2.5 text-primary-foreground/80 group-hover:text-primary-foreground animate-[spin_4s_linear_infinite]" />}
            className="px-1 mr-1 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
          />
        </ButtonGroup>
        
        {/* Errors & Warnings Tracker */}
        <IdeBarItem 
          tooltip="Error/Warning"
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        >
          <XCircle className="h-3 w-3 text-rose-300" />
          <span className="text-primary-foreground">{0}</span>
          <AlertTriangle className="h-3 w-3 text-amber-300" />
          <span className="text-primary-foreground">{2}</span>
        </IdeBarItem>
      </div>

      {/* Right Side Elements */}
      <div className="flex items-center h-full gap-0.5 pr-1">
        {/* 1. Go to Line/Column */}
        <IdeBarItem 
          tooltip="Go to Line/Column" 
          text="Ln 45, Col 12" 
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />

        {/* 2. Indentation Configuration */}
        <IdeBarItem 
          tooltip="Select Indentation" 
          text="Spaces: 2" 
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />

        {/* 3. File Encoding Settings */}
        <IdeBarItem 
          tooltip="Select Encoding" 
          text="UTF-8" 
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />

        {/* 4. Language Mode Selector */}
        <IdeBarItem 
          tooltip="Select Language Mode" 
          icon={<Braces className="h-3 w-3 text-primary-foreground/80 group-hover:text-primary-foreground" />} 
          text="TypeScript JSX" 
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />

        {/* 5. Notification Bell Icon */}
        <IdeBarItem 
          tooltip="Notification" 
          icon={<Bell className="h-3 w-3 text-primary-foreground/80 group-hover:text-primary-foreground" />} 
          className="bg-transparent text-primary-foreground hover:bg-primary-foreground/10 border-none"
        />
      </div>
        
    </footer>
  )
}

export default IdeFooter
