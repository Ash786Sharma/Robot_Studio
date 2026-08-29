
import { Terminal, FolderTree, Settings, ShieldAlert, Menu } from "lucide-react"

export const IdeNavRail = ()=>{
    return (
        <nav className="w-12 flex flex-col justify-between items-center py-1 h-full shrink-0">
          <div className="flex flex-col gap-4 w-full items-center">
            <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 ">
              <Menu className="h-5 w-5" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800/40 text-slate-100 border border-slate-700/50">
              <FolderTree className="h-5 w-5" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100 ">
              <Terminal className="h-5 w-5" />
            </button>
            <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100">
              <ShieldAlert className="h-5 w-5" />
            </button>
          </div>
          <button className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800/80 hover:text-slate-100">
            <Settings className="h-5 w-5" />
          </button>
        </nav>
    )
}

export default IdeNavRail