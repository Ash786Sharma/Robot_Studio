import React from "react";
import * as LucideIcons from "lucide-react";
import { IdeBarItem } from "@/features/ideUi/ideBarItem";
import { IdeMenuItem } from "./ideMenuItem";
import primaryMenuData from "@/assets/menuConfig.json";
import navConfig from "@/assets/navConfig.json"; 
import { useLayoutStore } from "@/core/store/layoutStore";
import { useWorkspaceStore } from "@/core/store/workSpaceStore";

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
  const setLeftTab = useWorkspaceStore((state) => state.setLeftTab);
  const setRightTab = useWorkspaceStore((state) => state.setRightTab);
  const setIsSplitView = useWorkspaceStore((state) => state.setIsSplitView);
  const openTab = useWorkspaceStore((state) => state.openTab);
  const leftTab = useWorkspaceStore((state) => state.leftTab);
  const rightTab = useWorkspaceStore((state) => state.rightTab);
  const hiddenTabs = useWorkspaceStore((state) => state.hiddenTabs);
  const closeTab = useWorkspaceStore((state) => state.closeTab);
  const isViewerOpen = !hiddenTabs.includes("viewer") && (leftTab === "viewer" || rightTab === "viewer");

  const renderItem = (item: NavItemConfig) => {
    const IconComponent = LucideIcons[item.iconName] as React.ComponentType<{ className?: string }>;
    
    let isItemActive = false;
    let onClickAction = () => {};

    // Inside your IdeNavRail component's renderItem function:
    if (item.id === "explorer") {
      isItemActive = isExplorerOpen && activeView === "Explorer";
      onClickAction = () => {
        if (activeView === "Explorer") {
          toggleExplorer();
        } else {
          setActiveView("Explorer");
        }
      };
    } else if (item.id === "source-control") {
      isItemActive = activeView === "Source Control";
      onClickAction = () => setActiveView(activeView === "Source Control" ? "Explorer" : "Source Control");
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
    } else if (item.id === "3d-viewer") {
      isItemActive = isViewerOpen;
      onClickAction = () => {
        if (isViewerOpen) {
          closeTab("viewer", leftTab === "viewer" ? "left" : "right");
        } else {
          openTab("viewer");
          setLeftTab("viewer");
          setRightTab("viewer");
          setIsSplitView(false);
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
      return (
        <IdeMenuItem
          key={item.id}
          config={primaryMenuData}
          menuButton={barItemElement}
        />
      );
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
