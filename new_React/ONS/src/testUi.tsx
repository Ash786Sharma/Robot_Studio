import React, { useState } from "react"
import { createPortal } from "react-dom"
import * as LucideIcons from "lucide-react"
import { useIdeStore } from "@/core/store/ideStore"
import { useMenuStore } from "@/core/store/menuStore"
import { cn } from "@/lib/utils"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MenuItemData {
  id: string;
  text: string;
  iconName: string; 
  actionName?: string; 
  variant?: string;
  hasSeparatorBefore?: boolean;
  children?: MenuItemData[]; 
}

export interface MenuGroupData {
  groupId: string;
  hasSeparatorBefore?: boolean;
  items: MenuItemData[];
}

interface IdeMenuItemProps {
  menuButton?: React.ReactElement 
  config?: MenuGroupData[] | MenuItemData[] 
  items?: MenuItemData[]           
  level?: number 
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const IdeMenuItem = ({ 
  menuButton, 
  config = [], 
  items, 
  level = 0,
  open,             
  onOpenChange      
}: IdeMenuItemProps) => {
  const storeActions = useIdeStore() as Record<string, any>
  const globalMenu = useMenuStore()
  
  // Isolated state for workspace canvas dropdown instances
  const [localOpen, setLocalOpen] = useState(false)

  // Identify where the menu instance is currently executing
  const isMainMenuButton = !!menuButton && level === 0 && config.length > 0
  const isUsedInCanvas = !isMainMenuButton && level === 0

  const isCurrentlyOpen = open !== undefined 
    ? open 
    : (isUsedInCanvas ? localOpen : globalMenu.isMenuOpen)

  const handleOpenToggle = onOpenChange !== undefined 
    ? onOpenChange 
    : (nextOpen: boolean) => {
        if (isUsedInCanvas) {
          setLocalOpen(nextOpen)
        } else {
          nextOpen ? globalMenu.openMenu() : globalMenu.closeMenu()
        }
      }

  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const renderMenuNode = (item: MenuItemData) => {
    const iconKey = item.iconName as keyof typeof LucideIcons;
    const IconComponent = LucideIcons[iconKey] as React.ComponentType<{ className?: string }>
    
    const isDanger = item.variant === "danger"
    
    const itemStyles = isDanger
      ? "flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-red-400 data-[highlighted]:bg-red-950/30 data-[highlighted]:text-red-400"
      : "flex items-center gap-2 cursor-pointer font-medium text-xs rounded-md px-2.5 py-2 outline-none transition-colors duration-150 text-[var(--ide-text-inactive)] data-[highlighted]:bg-[var(--ide-item-hover)] data-[highlighted]:text-[var(--foreground)]"

    const nodes: React.ReactNode[] = []

    if (item.hasSeparatorBefore) {
      nodes.push(<DropdownMenuSeparator key={`sep-${item.id}`} className="my-1.5 mx-1" />)
    }

    if (item.children && item.children.length > 0) {
      const isCurrentSubOpen = globalMenu.activeMenuPath.includes(item.id)

      const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setCoords({
          top: rect.top - 6,
          left: rect.right + 2 
        })
        globalMenu.pushToPath(item.id, level)
      }

      nodes.push(
        <div 
          key={item.id} 
          className="w-full"
          onMouseEnter={handleMouseEnter}
          // Safeguard: Do not fire recursive timeouts if state is closed down
          onMouseLeave={() => isCurrentlyOpen && globalMenu.scheduleCloseSubMenu(300)} 
        >
          <DropdownMenuItem className={cn(itemStyles, "flex justify-between items-center pr-2.5")}>
            <div className="flex items-center gap-2">
              {IconComponent && <IconComponent className="h-4 w-4 text-current shrink-0" />}
              {item.text}
            </div>
            <LucideIcons.ChevronRight className="h-3.5 w-3.5 opacity-60 shrink-0" />
          </DropdownMenuItem>

          {isCurrentSubOpen && typeof window !== "undefined" && createPortal(
            <div 
              className="fixed min-w-52 rounded-xl p-1.5 select-none bg-[var(--popover)] border border-[var(--border)] text-[var(--ide-text-inactive)] shadow-xl z-50 flex flex-col gap-0.5"
              style={{
                top: `${coords.top}px`,
                left: `${coords.left - 2}px`, 
                '--tw-shadow-color': 'var(--ide-tooltip-shadow)'
              } as React.CSSProperties}
              onMouseEnter={globalMenu.cancelCloseSubMenu}
              onMouseLeave={() => globalMenu.scheduleCloseSubMenu(300)}
            >
              <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                <IdeMenuItem items={item.children} level={level + 1} />
              </div>
            </div>,
            document.body
          )}
        </div>
      )
    } else {
      const actionKey = item.actionName;
      const targetAction = actionKey ? storeActions[actionKey] : undefined

      nodes.push(
        <DropdownMenuItem 
          key={item.id} 
          className={itemStyles}
          onClick={() => {
            if (typeof targetAction === "function") targetAction();
            if (isUsedInCanvas) setLocalOpen(false);
            else globalMenu.closeMenu();
          }}
        >
          {IconComponent && <IconComponent className="h-4 w-4 text-current shrink-0" />}
          <span className="flex-1 tracking-wide">{item.text}</span>
        </DropdownMenuItem>
      )
    }

    return nodes
  }

  if (menuButton) {
    const isGrouped = config.length > 0 && config[0] !== undefined && "groupId" in config[0]

    return (
      <DropdownMenu open={isCurrentlyOpen} onOpenChange={handleOpenToggle} modal={false}>
        <DropdownMenuTrigger render={menuButton} />
        <DropdownMenuContent 
          side="right" 
          align="start" 
          sideOffset={12}
          className="min-w-52 rounded-xl p-1.5 select-none bg-[var(--popover)] border border-[var(--border)] text-[var(--ide-text-inactive)] shadow-xl"
          style={{ '--tw-shadow-color': 'var(--ide-tooltip-shadow)' } as React.CSSProperties}
        >
          {isGrouped ? (
            (config as MenuGroupData[]).map((group) => (
              <React.Fragment key={group.groupId}>
                {group.hasSeparatorBefore && (
                  <DropdownMenuSeparator className="my-1.5 mx-1" />
                )}
                <DropdownMenuGroup className="flex flex-col gap-0.5">
                  {group.items.flatMap((item) => renderMenuNode(item))}
                </DropdownMenuGroup>
              </React.Fragment>
            ))
          ) : (
            <DropdownMenuGroup className="flex flex-col gap-0.5">
              {(config as MenuItemData[]).flatMap((item) => renderMenuNode(item))}
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const recursiveItems = items || []
  return <>{recursiveItems.flatMap((item) => renderMenuNode(item))}</>
}

export default IdeMenuItem;
