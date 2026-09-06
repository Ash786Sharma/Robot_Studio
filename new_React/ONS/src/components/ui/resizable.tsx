import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
}

function ResizablePanel({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />
}

interface ResizableHandleProps extends ResizablePrimitive.SeparatorProps {
  withHandle?: boolean
  dotsClassName?: string 
}

function ResizableHandle({
  withHandle,
  className,
  dotsClassName,
  ...props
}: ResizableHandleProps) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        // ⚡ GAPS REMOVED & ROUNDED FULL HANDLE:
        // Removed outer margins completely to sit flush against panel edges.
        // Set rounded-full for clean rounded handle capsule bars on interaction.
        "group relative flex shrink-0 items-center justify-center bg-transparent transition-colors outline-none rounded-full",
        
        // Tightened track metrics to reduce dead layout space
        "aria-[orientation=vertical]:w-1 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize",
        "aria-[orientation=horizontal]:h-1 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        
        // Interactive state lighting overrides standard transparent rests
        "hover:bg-primary/40 data-[resize-handle-active=pointer]:bg-primary/60",
        
        // Expanded touch target spacing mechanics remain fully active for easy tracking
        "aria-[orientation=vertical]:after:absolute aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:left-1/2 aria-[orientation=vertical]:after:w-3 aria-[orientation=vertical]:after:-translate-x-1/2",
        "aria-[orientation=horizontal]:after:absolute aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-3 aria-[orientation=horizontal]:after:-translate-y-1/2",
        
        // Rotates dot patterns for horizontal splits
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex flex-col justify-between items-center h-3 w-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-[resize-handle-active=pointer]:opacity-100 pointer-events-none select-none">
          <div className={cn("h-[16%] aspect-square rounded-full bg-foreground/40 transition-colors duration-150", dotsClassName)} />
          <div className={cn("h-[16%] aspect-square rounded-full bg-foreground/40 transition-colors duration-150", dotsClassName)} />
          <div className={cn("h-[16%] aspect-square rounded-full bg-foreground/40 transition-colors duration-150", dotsClassName)} />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
