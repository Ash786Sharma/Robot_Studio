import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = 
  | "theme-vsc-dark" 
  | "theme-onedark" 
  | "theme-dracula" 
  | "theme-catppuccin" 
  | "theme-tokyonight"
  | "theme-high-contrast"
  | "theme-github-dark"
  | "theme-gruvbox"
  | "theme-solarized-light";

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
  // ⚡ EXTENDED ACCESSIBILITY & UTILITY IDE PROFILES
  { id: "theme-high-contrast", name: "High Contrast (A11y)" },
  { id: "theme-github-dark", name: "GitHub Dark" },
  { id: "theme-gruvbox", name: "Gruvbox Retro" },
  { id: "theme-solarized-light", name: "Solarized Light" },
] as const;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: "theme-vsc-dark",
      setTheme: (themeId) => {
        const root = document.documentElement;
        
        // 1. Safely strip all previous theme classes
        AVAILABLE_THEMES.forEach((theme) => root.classList.remove(theme.id));
        
        // 2. Inject the newly selected theme class
        root.classList.add(themeId);
        
        // 3. Handle dark/light utility mode flags dynamically
        if (themeId === "theme-solarized-light") {
          root.classList.remove("dark");
        } else if (themeId !== "theme-high-contrast") {
          root.classList.add("dark");
        }
        
        set({ currentTheme: themeId });
      },
    }),
    {
      name: "ons-ide-theme-storage",
      // ⚡ REHYDRATION LIFECYCLE FIX: Prevents layout color flashing during hard refreshes
      onRehydrateStorage: () => (state) => {
        if (state?.currentTheme) {
          const root = document.documentElement;
          AVAILABLE_THEMES.forEach((theme) => root.classList.remove(theme.id));
          root.classList.add(state.currentTheme);
          
          if (state.currentTheme === "theme-solarized-light") {
            root.classList.remove("dark");
          } else {
            root.classList.add("dark");
          }
        }
      }
    }
  )
);
