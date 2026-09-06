import React from "react";
import * as LucideIcons from "lucide-react";
import { IdeBarItem } from "@/features/ideUi/ideBarItem";
import { IdeMenuItem } from "./ideMenuItem";

// Import your navigation configuration data
import navConfig from "@/assets/navConfig.json"; 

// Create a component configuration interface
interface NavItemConfig {
  id: string;
  tooltip: string;
  shortcutKeys: string[];
  iconName: keyof typeof LucideIcons;
  isActive?: boolean;
  isMenuButton?: boolean;
}

export const IdeNavRail = () => {
  
  // Helper function to resolve the string to a React component
  const renderItem = (item: NavItemConfig) => {
    // Dynamically look up the icon component from Lucide
    const IconComponent = LucideIcons[item.iconName] as React.ComponentType<{ className?: string }>;
    
    const barItemElement = (
      <IdeBarItem
        tooltip={item.tooltip}
        side="right"
        shortcutKeys={item.shortcutKeys}
        icon={IconComponent ? <IconComponent className="h-5 w-5" /> : null}
        className="h-10 w-10 rounded-xl"
        isActive={item.isActive}
      />
    );

    // Conditionally wrap inside IdeMenuItem if it's the Toggle Menu button
    if (item.isMenuButton) {
      return <IdeMenuItem key={item.id} menuButton={barItemElement} />;
    }

    return <React.Fragment key={item.id}>{barItemElement}</React.Fragment>;
  };

  return (
    <nav className="w-12 flex flex-col justify-between items-center py-2 h-full shrink-0">
      
      {/* Top Section Actions */}
      <div className="flex flex-col gap-4 w-full items-center">
        {navConfig.topItems.map((item) => renderItem(item as NavItemConfig))}
      </div>

      {/* Bottom Section Actions */}
      <div className="w-full flex flex-col items-center">
        {navConfig.bottomItems.map((item) => renderItem(item as NavItemConfig))}
      </div>

    </nav>
  );
};

export default IdeNavRail;
