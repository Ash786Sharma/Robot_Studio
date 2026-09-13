import { Palette } from "lucide-react"
import { useThemeStore, AVAILABLE_THEMES, type ThemeId } from "@/core/store/themeStore"
import {IdeBarItem} from "./IdeBarItem"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
  const { currentTheme, setTheme } = useThemeStore()

  // 1. Handcrafted isolated trigger button matching IdeBarItem layout rules 
  // without the nested <Tooltip> primitive conflict wrapper
  const triggerButton = (
    <IdeBarItem
          tooltip="Select Theme"
          side="bottom"
          shortcutKeys={["Ctrl", "T"]}
          icon={<Palette className="h-5 w-5" />}
          className="h-8 w-8 rounded-full "
        />
  )
  return (
    <DropdownMenu>
      {/* 2. Base UI render prop bindings pass downstream actions flawlessly */}
      <DropdownMenuTrigger render={triggerButton} />
      
      {/* 3. Dropdown frame styled explicitly using your custom global token system */}
      <DropdownMenuContent 
        side="bottom"
        align="end" 
        sideOffset={6}
        className="bg-ide-panel border border-border text-foreground p-1 rounded-md min-w-48 shadow-ide focus:outline-none z-50 animate-in fade-in-50 zoom-in-95 duration-100"
      >
        {AVAILABLE_THEMES.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setTheme(theme.id as ThemeId)}
              className={cn(
                "cursor-pointer text-xs select-none rounded px-2.5 py-1.5 outline-none transition-colors flex items-center justify-between font-medium",
                isSelected 
                  ? "bg-ide-active text-foreground font-semibold" 
                  : "text-ide-inactive hover:bg-ide-hover hover:text-foreground"
              )}
            >
              <span>{theme.name}</span>
              {isSelected && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
