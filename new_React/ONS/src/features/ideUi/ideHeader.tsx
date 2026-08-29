import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PanelLeft, PanelBottom, LayoutPanelLeft, ArrowRight,ArrowLeft, Search} from "lucide-react"


export const IdeHeader = () => {
return (
    <header className="h-8 w-full flex items-center justify-between px-3 text-slate-400 text-sm shrink-0">
        
        {/* Left Side: Brand & History Navigation Buttons */}
        <div className="flex items-center gap-4">
          <span className="font-bold text-slate-200 tracking-wider text-base select-none">ONS</span>
          
        </div>

        {/* Middle: History Arrows and shadcn Search Input combined horizontally */}
        <div className="flex items-center gap-2 max-w-2xl mx-4">
          {/* Navigation Arrows placed before search */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button title="Back" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button title="Forward" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* shadcn Search Input */}
          <div className="w-80 md:w-96">
            <Field>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none z-10" />
                <Input 
                  id="global-search"
                  type="text" 
                  placeholder="Search files, commands, or settings..." 
                  className="w-full h-7 pl-9 pr-3 bg-slate-950/60 border-slate-800 text-xs text-slate-300 placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-slate-500/50 focus-visible:border-slate-500/50 focus:bg-slate-950 transition-all rounded-lg"
                  aria-label="Universal Workspace Search"
                />
              </div>
            </Field>
          </div>
        </div>

        {/* Right Side: Primary Layout Panels State Controls */}
        <div className="flex items-center gap-1">
          <button title="Toggle Primary Side Bar" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors">
            <LayoutPanelLeft className="h-4 w-4" />
          </button>
          <button title="Toggle Primary Side Bar" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors">
            <PanelLeft className="h-4 w-4" />
          </button>
          <button title="Toggle Secondary Side Bar" className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-slate-800 hover:text-slate-100 transition-colors">
            <PanelBottom className="h-4 w-4" />
          </button>
        </div>

      </header>
)
}

export default IdeHeader