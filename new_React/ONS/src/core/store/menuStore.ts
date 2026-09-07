import { create } from "zustand"

interface MenuState {
  isMenuOpen: boolean
  activeMenuPath: string[] // ⚡ FIXED: Tracks the full branch path of open menus
  closeTimerId: ReturnType<typeof setTimeout> | null
  
  openMenu: () => void
  closeMenu: () => void
  pushToPath: (id: string, level: number) => void // Adds an active submenu level safely
  scheduleCloseSubMenu: (delayMs?: number) => void
  cancelCloseSubMenu: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  isMenuOpen: false,
  activeMenuPath: [],
  closeTimerId: null,

  openMenu: () => set({ isMenuOpen: true, activeMenuPath: [] }),
  
  closeMenu: () => {
    const timerId = get().closeTimerId
    if (timerId) clearTimeout(timerId)
    set({ isMenuOpen: false, activeMenuPath: [], closeTimerId: null })
  },
  
  pushToPath: (id, level) => {
    const timerId = get().closeTimerId
    if (timerId) clearTimeout(timerId)
    
    // Slice path to the current hover depth layer, then append the new target id
    const currentPath = get().activeMenuPath.slice(0, level)
    set({ activeMenuPath: [...currentPath, id], closeTimerId: null })
  },

  scheduleCloseSubMenu: (delayMs = 250) => {
    const currentTimer = get().closeTimerId
    if (currentTimer) clearTimeout(currentTimer)

    const timerId = setTimeout(() => {
      set({ activeMenuPath: [], closeTimerId: null })
    }, delayMs)

    set({ closeTimerId: timerId })
  },

  cancelCloseSubMenu: () => {
    const timerId = get().closeTimerId
    if (timerId) {
      clearTimeout(timerId)
      set({ closeTimerId: null })
    }
  }
}))
