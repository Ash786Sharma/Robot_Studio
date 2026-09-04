import { Field } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ButtonGroup } from "@/components/ui/button-group"
import { IdeBarItem } from "@/features/ideUi/ideBarItem"
import { ThemeSelector } from "@/features/ideUi/ThemeSelector"
import { PanelLeft, PanelBottom, LayoutPanelLeft, ArrowRight, ArrowLeft, Search } from "lucide-react"

export const IdeHeader = () => {
  return (
    <header className="h-8 w-full flex items-center justify-between px-3 text-sm shrink-0">
      {/* Left Side: Brand Name Node */}
      <div className="flex items-center gap-4">
        <span className="font-bold text-foreground tracking-wider text-base select-none">ONS</span>
      </div>
      
      {/* Middle: History Arrows, Search Input, and Theme Switcher grouped together */}
      <div className="flex items-center gap-2 max-w-2xl mx-4">
        {/* Navigation Arrows placed before search */}
        <ButtonGroup>
          {/* 1. Go Back Action */}
          <IdeBarItem
            tooltip="Go Back"
            shortcutKeys={["ALT", "←"]}
            icon={<ArrowLeft className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
            className="ml-1"
          />

          {/* 2. Go Forward Action */}
          <IdeBarItem
            tooltip="Go Forward"
            shortcutKeys={["ALT", "→"]}
            icon={<ArrowRight className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
            className="ml-1"
          />
        </ButtonGroup>

        {/* 3. Universal Workspace Search (Using render prop override) */}
        <div className="w-80 md:w-96">
          <IdeBarItem
            tooltip="Search"
            render={
              <Field>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ide-inactive pointer-events-none z-10" />
                  <Input
                    id="global-search"
                    type="text"
                    placeholder="Search files, commands, or settings..."
                    className="cursor-pointer w-full h-7 pl-9 pr-3 bg-ide-panel border-border text-xs text-foreground placeholder-ide-inactive/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus:bg-ide-surface transition-all rounded-lg"
                    aria-label="Universal Workspace Search"
                  />
                </div>
              </Field>
            }
          />
        </div>

        {/* 🎨 4. Theme Selector Trigger Icon Button (Rendered directly after search) */}
        <ThemeSelector />
      </div>

      {/* Right Side: Primary Layout Panels State Controls */}
      <div className="flex items-center gap-1">
        {/* 5. Customize Layout Options */}
        <IdeBarItem
          tooltip="Customize Layout..."
          icon={<LayoutPanelLeft className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
          className="px-1"
        />

        {/* 6. Toggle Primary Side Bar Pane */}
        <IdeBarItem
          tooltip="Toggle Primary Side Bar"
          shortcutKeys={["Ctrl", "B"]}
          icon={<PanelLeft className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
          className="px-1"
        />

        {/* 7. Toggle Terminal/Output Bottom Panel Panel */}
        <IdeBarItem
          tooltip="Toggle Panel"
          shortcutKeys={["Ctrl", "J"]}
          icon={<PanelBottom className="h-4 w-4 text-ide-inactive transition-colors group-hover:text-foreground" />}
          className="px-1"
        />
      </div>
    </header>
  )
}

export default IdeHeader
