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
  dotsClassName?: string // Prop to dynamically change dot appearance from usage
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
        // Added group to allow children to track layout states
        "group relative flex shrink-0 items-center justify-center bg-border transition-colors outline-none",
        
        // Dynamic defaults: Auto-swaps between custom widths and heights based on split style
        "aria-[orientation=vertical]:w-1.5 aria-[orientation=vertical]:h-full aria-[orientation=vertical]:cursor-col-resize",
        "aria-[orientation=horizontal]:h-1.5 aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        
        // Blends out the background bar line on hover
        "hover:bg-transparent data-[resize-handle-active=pointer]:bg-transparent",
        
        // Expanded touch target space so clicking remains highly reliable
        "aria-[orientation=vertical]:after:absolute aria-[orientation=vertical]:after:inset-y-0 aria-[orientation=vertical]:after:left-1/2 aria-[orientation=vertical]:after:w-4 aria-[orientation=vertical]:after:-translate-x-1/2",
        "aria-[orientation=horizontal]:after:absolute aria-[orientation=horizontal]:after:inset-x-0 aria-[orientation=horizontal]:after:top-1/2 aria-[orientation=horizontal]:after:h-4 aria-[orientation=horizontal]:after:-translate-y-1/2",
        
        // Rotates internal elements for row splits
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex flex-col justify-between items-center h-4 w-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-data-[resize-handle-active=pointer]:opacity-100 pointer-events-none select-none">
          <div className={cn("h-[18%] aspect-square rounded-full bg-blue-500 transition-colors duration-200", dotsClassName)} />
          <div className={cn("h-[18%] aspect-square rounded-full bg-blue-500 transition-colors duration-200", dotsClassName)} />
          <div className={cn("h-[18%] aspect-square rounded-full bg-blue-500 transition-colors duration-200", dotsClassName)} />
        </div>
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
