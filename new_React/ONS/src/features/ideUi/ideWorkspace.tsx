import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export const IdeWorkspace =()=>{
    return(
        <main className="flex-1 h-full min-w-0">
        <div className="h-full w-full rounded-xl overflow-hidden">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full border-none"
        >
          {/* Panel One */}
          <ResizablePanel defaultSize={20} className="rounded-xl border border-slate-800 bg-slate-950">
            <div className="flex h-full items-center justify-center p-6 text-slate-200">
              <span className="font-semibold">One</span>
            </div>
          </ResizablePanel>

          {/* Vertical Separator: Structural width automatically adjusts to 6px (w-1.5) */}
          <ResizableHandle 
            withHandle 
            className="bg-transparent border-none " 
            dotsClassName="group-hover:bg-slate-400"
          />

          {/* Inner Panel Stack */}
          <ResizablePanel defaultSize={80} className="rounded-xl">
            <ResizablePanelGroup orientation="vertical" className="border-none">
              
              {/* Panel Two */}
              <ResizablePanel defaultSize={70} className="rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex h-full items-center justify-center p-6 text-slate-200">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>

              {/* Horizontal Separator: Structural height automatically adjusts to 6px (h-1.5) */}
              <ResizableHandle 
                withHandle 
                dotsClassName="group-hover:bg-slate-400" 
                className="bg-transparent border-none " 
              />

              {/* Panel Three */}
              <ResizablePanel defaultSize={30} className="rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex h-full items-center justify-center p-6 text-slate-200">
                  <span className="font-semibold">Three</span>
                </div>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
       </main>
    )
}