import React, { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

interface IdeBarItemProps {
  tooltip: string;
  shortcutKeys?: string[];
  // render override allows passing input fields or custom elements down to the Base UI trigger
  render?: React.ReactElement; 
  text?: string;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

export function IdeBarItem({
  tooltip,
  shortcutKeys,
  render,
  text,
  icon,
  className,
  onClick,
  children,
  isActive,
  side = "top"
}: IdeBarItemProps & { children?: ReactNode }) {
  
  // 1. Build the base button if no custom render target (like an Input) is passed
  const triggerElement = render || (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        // 3. Changed default text configuration to handle cascading text states cleanly
        "group cursor-pointer h-6.5 px-2 bg-transparent font-medium gap-1.5 rounded-md transition-all select-none duration-150 border text-current",
        isActive 
          ? "bg-ide-active text-foreground border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-ide-active" 
          : "text-ide-inactive border-transparent hover:bg-ide-hover hover:text-foreground active:scale-[0.98]",
        className
      )}
    >
         {/* If children are provided, render them; otherwise fallback to icon/text props */}
      {children ? children : (
        <>
          {icon && <span className="text-current flex items-center justify-center shrink-0">{icon}</span>}
          {text && <span className="text-current font-medium tracking-wide">{text}</span>}
        </>
      )}
    </Button>
  );

  return (
    <Tooltip>
      {/* 2. Match Base UI's render prop signature pattern */}
      <TooltipTrigger render={triggerElement} />
      
      <TooltipContent
        side={side}
        sideOffset={6}
        className="shadow-ide-md"      >
        <span>{tooltip}</span>
        
        {/* 3. Base UI style dynamic shortcut collection */}
        {shortcutKeys && shortcutKeys.length > 0 && (
          <KbdGroup className="flex items-center gap-0.5 ml-1">
            {shortcutKeys.map((key, index) => (
              <span key={key} className="flex items-center gap-0.5">
                <Kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                  <span className="text-xs">{key}</span>
                </Kbd>
                {index < shortcutKeys.length - 1 && <span className="text-slate-500 text-[10px]">+</span>}
              </span>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
