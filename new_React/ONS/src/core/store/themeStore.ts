import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = 
  | "theme-vsc-dark" 
  | "theme-onedark" 
  | "theme-dracula" 
  | "theme-catppuccin" 
  | "theme-tokyonight";

interface ThemeState {
  currentTheme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
}

export const AVAILABLE_THEMES = [
  { id: "theme-vsc-dark", name: "VS Code Dark" },
  { id: "theme-onedark", name: "One Dark Pro" },
  { id: "theme-dracula", name: "Dracula Official" },
  { id: "theme-catppuccin", name: "Catppuccin Mocha" },
  { id: "theme-tokyonight", name: "Tokyo Night" },
] as const;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: "theme-vsc-dark",
      setTheme: (themeId) => {
        // 1. Get the root element
        const root = document.documentElement;
        
        // 2. Safely strip all previous theme classes
        AVAILABLE_THEMES.forEach((theme) => root.classList.remove(theme.id));
        
        // 3. Inject the newly selected theme class
        root.classList.add(themeId);
        
        set({ currentTheme: themeId });
      },
    }),
    {
      name: "ons-ide-theme-storage", // Keeps the theme active even after a page refresh
    }
  )
);
