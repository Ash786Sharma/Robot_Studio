import { create } from 'zustand';
import type { EditorTab } from '../types';

interface EditorStore {
  // State
  activeTabId: string | null;
  tabs: EditorTab[];
  splitLayout: 'single' | 'horizontal' | 'vertical';

  // Actions
  addTab: (tab: EditorTab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTab: (tabId: string, updates: Partial<EditorTab>) => void;
  setSplitLayout: (layout: 'single' | 'horizontal' | 'vertical') => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  getTabByFileId: (fileId: string) => EditorTab | undefined;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  activeTabId: null,
  tabs: [],
  splitLayout: 'single',

  addTab: (tab) =>
    set((state) => {
      const existingTab = state.tabs.find((t) => t.fileId === tab.fileId);
      if (existingTab) {
        return { activeTabId: existingTab.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  removeTab: (tabId) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveTabId = state.activeTabId;

      if (state.activeTabId === tabId) {
        newActiveTabId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
      }

      return {
        tabs: newTabs,
        activeTabId: newActiveTabId,
      };
    }),

  setActiveTab: (tabId) =>
    set(() => ({
      activeTabId: tabId,
    })),

  updateTab: (tabId, updates) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, ...updates } : t
      ),
    })),

  setSplitLayout: (layout) =>
    set(() => ({
      splitLayout: layout,
    })),

  closeAllTabs: () =>
    set(() => ({
      tabs: [],
      activeTabId: null,
    })),

  closeOtherTabs: (tabId) =>
    set(() => ({
      tabs: [get().tabs.find((t) => t.id === tabId)!],
      activeTabId: tabId,
    })),

  getTabByFileId: (fileId) => {
    return get().tabs.find((t) => t.fileId === fileId);
  },
}));
