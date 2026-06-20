import { create } from 'zustand';
import type { ViewMode } from '../types';

interface UIStore {
  // State
  sidebarOpen: boolean;
  terminalOpen: boolean;
  explorerOpen: boolean;
  terminalHeight: number;
  sidebarWidth: number;
  viewMode: ViewMode;
  theme: 'light' | 'dark';

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;
  toggleExplorer: () => void;
  setExplorerOpen: (open: boolean) => void;
  setTerminalHeight: (height: number) => void;
  setSidebarWidth: (width: number) => void;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  terminalOpen: false,
  explorerOpen: true,
  terminalHeight: 200,
  sidebarWidth: 250,
  viewMode: {
    layout: 'text',
    activePanel: 'editor',
  },
  theme: 'dark',

  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set(() => ({
      sidebarOpen: open,
    })),

  toggleTerminal: () =>
    set((state) => ({
      terminalOpen: !state.terminalOpen,
    })),

  setTerminalOpen: (open) =>
    set(() => ({
      terminalOpen: open,
    })),

  toggleExplorer: () =>
    set((state) => ({
      explorerOpen: !state.explorerOpen,
    })),

  setExplorerOpen: (open) =>
    set(() => ({
      explorerOpen: open,
    })),

  setTerminalHeight: (height) =>
    set(() => ({
      terminalHeight: height,
    })),

  setSidebarWidth: (width) =>
    set(() => ({
      sidebarWidth: width,
    })),

  setViewMode: (mode) =>
    set(() => ({
      viewMode: mode,
    })),

  setTheme: (theme) =>
    set(() => ({
      theme,
    })),
}));
