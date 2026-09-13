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
  disabled?: boolean;
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
  disabled,
  children,
  isActive,
  side = "top"
}: IdeBarItemProps & { children?: ReactNode }) {
  
  const defaultButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group cursor-pointer h-6.5 px-2 font-medium gap-1.5 rounded-md transition-all select-none duration-150 border",
        
        // ⚡ FIXED CONFLICTING HOVER LOOPS:
        // Hover modifications are restricted to the inactive branch state. Active state remains immutable.
        isActive 
          ? "bg-ide-active text-foreground border-border" 
          : "bg-transparent text-ide-inactive border-transparent hover:bg-ide-hover hover:text-foreground active:scale-[0.98]",
        
        // Dynamic edge lighting for dark layouts
        isActive && "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]",
        
        className
      )}
    >
      {children ? children : (
        <>
          {/* ⚡ Replaced text-inherit with text-current to respect active transitions instantly */}
          {icon && <span className="flex items-center justify-center shrink-0 text-current">{icon}</span>}
          {text && <span className="font-medium tracking-wide text-current">{text}</span>}
        </>
      )}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={render || defaultButton} />
      
      <TooltipContent 
        side={side} 
        sideOffset={6} 
        className="flex items-center gap-2 py-2.5 min-h-9 in-[.theme-dracula_&]:[--border:#44475a]"
      >
        <span className="font-medium tracking-wide text-xs">{tooltip}</span>
        
        {shortcutKeys && shortcutKeys.length > 0 && (
          <KbdGroup className="flex items-center gap-0.5 ml-1">
            {shortcutKeys.map((key, index) => (
              <span key={`${key}-${index}`} className="flex items-center gap-0.5">
                <Kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-1 rounded border border-ide-kbd-border bg-ide-kbd px-1.5 font-mono text-[10px] font-semibold text-ide-inactive shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                  {key}
                </Kbd>
                {index < shortcutKeys.length - 1 && (
                  <span className="text-ide-inactive text-[10px] font-bold">+</span>
                )}
              </span>
            ))}
          </KbdGroup>
        )}
      </TooltipContent>
    </Tooltip>
  )
}
