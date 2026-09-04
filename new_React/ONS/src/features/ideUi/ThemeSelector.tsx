import { Palette } from "lucide-react"
import { useThemeStore, AVAILABLE_THEMES, type ThemeId } from "@/core/store/themeStore"
import { IdeBarItem } from "@/features/ideUi/ideBarItem"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeSelector() {
  const { currentTheme, setTheme } = useThemeStore()

  return (
    <DropdownMenu>
      {/* 1. Base UI uses the render prop wrapper instead of Radix's asChild */}
      <DropdownMenuTrigger
        render={
          <IdeBarItem
            tooltip="Change Workbench Theme..."
            icon={<Palette className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
            className="px-1"
          />
        }
      />
      
      {/* 2. Base UI Popover placement coordinates */}
      <DropdownMenuContent 
        side="bottom"
        align="end" 
        sideOffset={6}
        className="bg-ide-surface border border-border text-foreground p-1 rounded-md min-w-40 shadow-lg focus:outline-none"
      >
        {AVAILABLE_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setTheme(theme.id as ThemeId)}
            className={`cursor-pointer text-xs select-none rounded px-2 py-1.5 outline-none transition-colors ${
              currentTheme === theme.id 
                ? "bg-ide-active font-semibold text-primary" 
                : "hover:bg-ide-hover"
            }`}
          >
            {theme.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
