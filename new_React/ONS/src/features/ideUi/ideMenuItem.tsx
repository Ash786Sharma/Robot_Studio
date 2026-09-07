"use client"

import React from "react"
import * as LucideIcons from "lucide-react"
import { useIdeStore } from "@/core/store/ideStore"
import { useThemeStore, AVAILABLE_THEMES, type ThemeId } from "@/core/store/themeStore"
import { cn } from "@/lib/utils"

// ⚡ Import all components explicitly from your working layout file configuration
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal, 
} from "@/components/ui/dropdown-menu"

import menuConfig from "@/assets/menuConfig.json"

interface IdeMenuItemProps {
  menuButton: React.ReactElement 
}

interface MenuItemData {
  id: string;
  type: "action" | "theme-selector";
  text: string;
  iconName: keyof typeof LucideIcons;
  actionName?: "createNewProject" | "openExistingProject" | "closeProject";
  variant?: "danger";
}

interface MenuGroupData {
  groupId: string;
  hasSeparatorBefore?: boolean;
  items: MenuItemData[];
}

export const IdeMenuItem = ({ menuButton }: IdeMenuItemProps) => {
  const storeActions = useIdeStore()
  const { currentTheme, setTheme } = useThemeStore()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={menuButton} />

      <DropdownMenuContent 
        side="right" 
        align="start" 
        sideOffset={12}
        className="min-w-52 rounded-xl p-1.5 select-none bg-[var(--popover)] border-[var(--border)] text-[var(--ide-text-inactive)] shadow-xl"
        style={{ '--tw-shadow-color': 'var(--ide-tooltip-shadow)' } as React.CSSProperties}
      >
        {(menuConfig as MenuGroupData[]).map((group: MenuGroupData) => (
          <React.Fragment key={group.groupId}>
            {group.hasSeparatorBefore && (
              <DropdownMenuSeparator className="my-1.5 mx-1 bg-[var(--border)]" />
            )}

            <DropdownMenuGroup className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const IconComponent = LucideIcons[item.iconName] as React.ComponentType<{ className?: string }>
                
                const isDanger = item.variant === "danger"
                const itemStyles = isDanger
                  ? "flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-red-400 data-[highlighted]:bg-red-950/30 data-[highlighted]:text-red-400"
                  : "flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-[var(--ide-text-inactive)] data-[highlighted]:bg-[var(--ide-item-hover)] data-[highlighted]:text-[var(--foreground)]"

                // ⚡ ROUTE 1: Dynamic Theme Selector matching your multi-level reference layout
                if (item.type === "theme-selector") {
                  return (
                    <DropdownMenuSub key={item.id}>
                      <DropdownMenuSubTrigger
                       className={itemStyles}>
                        {IconComponent && <IconComponent className="h-4 w-4 text-current shrink-0" />}
                        <span className="flex-1 tracking-wide">{item.text}</span>
                      </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent
                        sideOffset={4} 
                          className="bg-ide-panel border border-border text-foreground p-1 rounded-md min-w-48 shadow-ide focus:outline-none z-50"
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
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )
                }

                // ROUTE 2: Render Standard Project Execution Actions
                const targetAction = item.actionName ? storeActions[item.actionName] : undefined

                return (
                  <DropdownMenuItem 
                    key={item.id}
                    onClick={targetAction}
                    className={itemStyles}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4 text-current shrink-0" />}
                    <span className="flex-1 tracking-wide">{item.text}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default IdeMenuItem
