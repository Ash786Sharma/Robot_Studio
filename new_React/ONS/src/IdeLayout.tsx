import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export const IdeLayout = () => {
  return (
    <div className="bg-slate-900 h-screen w-screen p-12 pl-14 pr-2">
      {/* Changed h-205 to use native viewport sizing controls */}
      <div className="h-full w-full rounded-xl overflow-hidden">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full"
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
            className="bg-transparent" 
          />

          {/* Inner Panel Stack */}
          <ResizablePanel defaultSize={80} className="rounded-xl">
            <ResizablePanelGroup orientation="vertical">
              
              {/* Panel Two */}
              <ResizablePanel defaultSize={70} className="rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex h-full items-center justify-center p-6 text-slate-200">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>

              {/* Horizontal Separator: Structural height automatically adjusts to 6px (h-1.5) */}
              <ResizableHandle 
                withHandle 
                dotsClassName="bg-slate-500 group-hover:bg-blue-500" 
                className="bg-transparent" 
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
    </div>
  )
}

export default IdeLayout
