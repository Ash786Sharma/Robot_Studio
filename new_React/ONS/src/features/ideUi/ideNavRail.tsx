import React from "react";
import * as LucideIcons from "lucide-react";
import { IdeBarItem } from "@/features/ideUi/ideBarItem";
import { IdeMenuItem } from "./ideMenuItem";
import primaryMenuData from "@/assets/menuConfig.json";
import navConfig from "@/assets/navConfig.json"; 
import { useLayoutStore } from "@/core/store/layoutStore";

interface NavItemConfig {
  id: string;
  tooltip: string;
  shortcutKeys: string[];
  iconName: keyof typeof LucideIcons;
  isActive?: boolean;
  isMenuButton?: boolean;
}

export const IdeNavRail = () => {
  const activeView = useLayoutStore((state) => state.activeView);
  const isExplorerOpen = useLayoutStore((state) => state.isExplorerOpen);
  const isTerminalOpen = useLayoutStore((state) => state.isTerminalOpen);
  
  const setActiveView = useLayoutStore((state) => state.setActiveView);
  const toggleExplorer = useLayoutStore((state) => state.toggleExplorer);
  const toggleTerminal = useLayoutStore((state) => state.toggleTerminal);

  const renderItem = (item: NavItemConfig) => {
    const IconComponent = LucideIcons[item.iconName] as React.ComponentType<{ className?: string }>;
    
    let isItemActive = false;
    let onClickAction = () => {};

    // Inside your IdeNavRail component's renderItem function:
if (item.id === "explorer") {
      isItemActive = isExplorerOpen;
      onClickAction = () => toggleExplorer();
    } else if (item.id === "terminal") {
      isItemActive = isTerminalOpen && activeView !== "Problems";
      onClickAction = () => {
        if (isTerminalOpen && activeView === "Problems") {
          setActiveView("Terminal");
        } else {
          if (isTerminalOpen) setActiveView(null); 
          toggleTerminal();
        }
      };
    } else if (item.id === "problems") {
      isItemActive = isTerminalOpen && activeView === "Problems";
      onClickAction = () => {
        if (isTerminalOpen && activeView === "Problems") {
          setActiveView(null); 
          toggleTerminal();
        } else {
          setActiveView("Problems");
          if (!isTerminalOpen) toggleTerminal();
        }
      };
    } else if (item.id === "viewer3d") {
      // 🧊 Active when the central workspace surface is explicitly rendered as the 3D Viewer
      isItemActive = activeView === "3D Viewer";
      onClickAction = () => {
        if (activeView === "3D Viewer") {
          // Reverting it sets it back to null or your default code editor mode
          setActiveView(null); 
        } else {
          setActiveView("3D Viewer");
        }
      };
    }

    const barItemElement = (
      <IdeBarItem
        tooltip={item.tooltip}
        side="right"
        shortcutKeys={item.shortcutKeys}
        icon={IconComponent ? <IconComponent className="h-5 w-5" /> : null}
        className="h-10 w-10 rounded-xl"
        isActive={isItemActive}
        onClick={onClickAction}
      />
    );

    if (item.isMenuButton) {
      return <IdeMenuItem key={item.id} config={primaryMenuData} menuButton={barItemElement} />;
    }

    return <React.Fragment key={item.id}>{barItemElement}</React.Fragment>;
  };

  return (
    <nav className="w-12 flex flex-col justify-between items-center py-2 h-full shrink-0 bg-[var(--ide-panel-bg)]">
      <div className="flex flex-col gap-4 w-full items-center">
        {navConfig.topItems.map((item) => renderItem(item as NavItemConfig))}
      </div>
      <div className="w-full flex flex-col items-center">
        {navConfig.bottomItems.map((item) => renderItem(item as NavItemConfig))}
      </div>
    </nav>
  );
};

export default IdeNavRail;
