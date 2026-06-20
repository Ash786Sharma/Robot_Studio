import { create } from 'zustand'

export type AppTab = {
  id: string
  label: string
  type: 'text' | 'graph' | '3d' | 'terminal'
  content?: string
}

export type DrawerNode = {
  id: string
  label: string
  icon?: string
  type?: string
  children?: DrawerNode[]
}

interface AppState {
  drawerData: DrawerNode[]
  openTabs: AppTab[]
  activeTabId: string
  setDrawerData: (data: DrawerNode[]) => void
  setOpenTabs: (tabs: AppTab[]) => void
  setActiveTabId: (tabId: string) => void
  addTab: (tab: AppTab) => void
}

const useAppStore = create<AppState>((set) => ({
  drawerData: [],
  openTabs: [
    {
      id: 'welcome',
      label: 'Welcome',
      type: 'text',
      content: 'Welcome to Robot Studio IDE. Open a file or create a new project to get started.'
    }
  ],
  activeTabId: 'welcome',
  setDrawerData: (data) => set({ drawerData: data }),
  setOpenTabs: (tabs) => set({ openTabs: tabs }),
  setActiveTabId: (tabId) => set({ activeTabId: tabId }),
  addTab: (tab) =>
    set((state) => ({
      openTabs: [...state.openTabs.filter((item) => item.id !== tab.id), tab],
      activeTabId: tab.id
    }))
}))

export default useAppStore
