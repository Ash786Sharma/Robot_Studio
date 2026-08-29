import { GitBranch,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ButtonGroup } from "@/components/ui/button-group";

export const IdeFooter = () =>{
    return (
        <footer className="h-6 w-full flex items-center justify-between px-2 text-xs text-slate-500 font-normal shrink-0 select-none ">
        
        {/* Left Side Elements */}
        <div className="flex items-center h-full">
          {/* Remote Environment Indicator (Uses matching indigo accent text instead of blue bg) */}
          <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span>ONS: UR5</span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Connected to Remote Server
          </TooltipContent>
        </Tooltip>

          {/* Git Status Group */}
          <ButtonGroup>
  {/* 1. Git Branch Tooltip */}
  <Tooltip>
    <TooltipTrigger
      render={
        <Button 
          variant="ghost" 
          size="sm" 
          className="ml-1 h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md"
        >
          <GitBranch className="h-3 w-3 text-slate-500" />
          <span>main*</span>
        </Button>
      } 
    />
    <TooltipContent 
      side="top" 
      className="text-xs bg-slate-950 text-slate-200 px-2.5 py-1.5 rounded-md filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))]"
    >
      Git Repository: Current Active Branch
    </TooltipContent>
  </Tooltip>

  {/* 2. Refresh Sync Tooltip */}
  <Tooltip>
    <TooltipTrigger
      render={
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6.5 px-1 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md"
        >
          <RefreshCw className="h-2.5 w-2.5 ml-0.5 text-slate-500 animate-[spin_4s_linear_infinite]" />
        </Button>
      } 
    />
    <TooltipContent 
      side="top" 
      className="text-xs bg-slate-950 text-slate-200 px-2.5 py-1.5 rounded-md filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))]"
    >
      Synchronise Changes with Remote Server
    </TooltipContent>
  </Tooltip>
</ButtonGroup>


          {/* Errors & Warnings Tracker */}
           <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <XCircle className="h-3 w-3 text-rose-500" />
              <span>0</span>
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>2</span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        </div>
        <div className="flex items-center h-full gap-1 pr-1">
            <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <span className="hover:bg-slate-900 hover:text-slate-200 h-full px-2 flex items-center cursor-pointer transition-colors rounded">
            Ln 45, Col 12
          </span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <span className="hover:bg-slate-900 hover:text-slate-200 h-full px-2 flex items-center cursor-pointer transition-colors rounded">
            Spaces: 2
          </span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <span className="hover:bg-slate-900 hover:text-slate-200 h-full px-2 flex items-center cursor-pointer transition-colors rounded">
            UTF-8
          </span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <span className="hover:bg-slate-900 hover:text-slate-200 h-full px-2 flex items-center cursor-pointer transition-colors rounded">
            TypeScript JSX
          </span>
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md "
              >
                <Bell className="h-3 w-3" />
              </Button>
            } 
          />
          <TooltipContent side="top" className="text-xs bg-slate-950 text-slate-200 filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))] ">
            Error/Warning
          </TooltipContent>
        </Tooltip>
        </div>
        
      </footer>
    )
}

export default IdeFooter