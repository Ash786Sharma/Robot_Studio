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
}

export function IdeBarItem({
  tooltip,
  shortcutKeys,
  render,
  text,
  icon,
  className,
  onClick,
  children
}: IdeBarItemProps & { children?: ReactNode }) {
  
  // 1. Build the base button if no custom render target (like an Input) is passed
  const triggerElement = render || (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "group cursor-pointer h-6.5 px-2 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium gap-1.5 rounded-md transition-colors",
        className
      )}
    >
         {/* If children are provided, render them; otherwise fallback to icon/text props */}
      {children ? children : (
        <>
          {icon}
          {text && <span>{text}</span>}
        </>
      )}
    </Button>
  );

  return (
    <Tooltip>
      {/* 2. Match Base UI's render prop signature pattern */}
      <TooltipTrigger render={triggerElement} />
      
      <TooltipContent
        side="top"
        className="flex items-center gap-2 text-xs bg-slate-950 text-slate-200 px-2.5 py-1.5 rounded-md filter-[drop-shadow(0_0_1px_rgba(51,65,85,1))_drop-shadow(0_10px_8px_rgba(0,0,0,0.4))]"
      >
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
