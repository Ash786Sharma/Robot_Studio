import React, { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

interface IdeBarItemProps {
  tooltip: string;
  shortcutKeys?: string[];
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
        "group cursor-pointer h-6.5 px-2 bg-transparent font-medium gap-1.5 rounded-md transition-all select-none duration-150 border text-current",
        isActive 
          ? "bg-ide-active text-foreground border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" 
          : "text-ide-inactive border-transparent hover:bg-ide-hover hover:text-foreground active:scale-[0.98]",
        className
      )}
    >
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
      <TooltipTrigger render={triggerElement} />
      
      {/* 2. Simplified: Let the TooltipContent primitive handle shadows, backgrounds, and arrows */}
      <TooltipContent
        side={side}
        sideOffset={6}
        className="shadow-ide-md" // Safely passes down the custom tailwind v4 shadow utility token
      >
        <span>{tooltip}</span>
        
        {/* 3. Base UI style dynamic shortcut collection */}
        {shortcutKeys && shortcutKeys.length > 0 && (
          <KbdGroup className="flex items-center gap-0.5 ml-1">
            {shortcutKeys.map((key, index) => (
              <span key={`${key}-${index}`} className="flex items-center gap-0.5">
                {/* 4. Styled to pull explicitly from the new theme tokens inside globals.css */}
                <Kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border border-ide-kbd-border bg-ide-kbd px-1.5 font-mono text-[10px] font-semibold text-ide-inactive shadow-[0_1px_0_rgba(0,0,0,0.15)]">
                  {key}
                </Kbd>
                {index < shortcutKeys.length - 1 && (
                  <span className="text-ide-inactive text-[10px] mx-0.5 font-bold opacity-60">+</span>
                )}
              </span>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
