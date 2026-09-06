import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export const IdeWorkspace = () => {
  return (
    <main className="flex-1 h-full min-w-0 bg-background text-foreground select-none">
      {/* ⚡ REDUCED OUTER EDGE GAP: Dropped padding to p-0.5 for a flush, tight layout grid */}
      <div className="h-full w-full overflow-hidden p-0.5 bg-ide-panel">
        <ResizablePanelGroup
          orientation="horizontal"
          className="h-full w-full border-none"
        >
          {/* Panel One: Sidebar File Explorer */}
          <ResizablePanel 
            defaultSize={20} 
            className="rounded-sm border border-border bg-ide-panel transition-colors duration-150"
          >
            <div className="flex h-full items-center justify-center p-6 text-ide-inactive">
              <span className="font-semibold text-xs tracking-wide">SIDEBAR / EXPLORER</span>
            </div>
          </ResizablePanel>

          {/* ⚡ FLUSH SEPARATOR HANDLE */}
          <ResizableHandle 
            withHandle 
            className="bg-transparent border-none"
            dotsClassName="bg-foreground/40 group-hover:bg-primary"
          />

          {/* Core Code Split Stack */}
          <ResizablePanel defaultSize={80}>
            <ResizablePanelGroup orientation="vertical" className="border-none">
              
              {/* Panel Two: Primary Code Workspace Surface */}
              <ResizablePanel 
                defaultSize={70} 
                className="rounded-sm border border-border bg-ide-surface transition-colors duration-150"
              >
                <div className="flex h-full items-center justify-center p-6 text-foreground">
                  <span className="font-semibold text-xs tracking-wide">EDITOR CANVAS</span>
                </div>
              </ResizablePanel>

              {/* ⚡ FLUSH SEPARATOR HANDLE */}
              <ResizableHandle 
                withHandle 
                className="bg-transparent border-none"
                dotsClassName="bg-foreground/40 group-hover:bg-primary"
              />

              {/* Panel Three: Diagnostic Console/Terminal Window */}
              <ResizablePanel 
                defaultSize={30} 
                className="rounded-sm border border-border bg-ide-panel transition-colors duration-150"
              >
                <div className="flex h-full items-center justify-center p-6 text-ide-inactive">
                  <span className="font-semibold text-xs tracking-wide">TERMINAL / CONSOLE</span>
                </div>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}
