import { useEffect } from "react";
import { useThemeStore } from "@/core/store/themeStore";
import {IdeHeader} from "@/features/ideUi/ideHeader"
import {IdeNavRail} from "@/features/ideUi/ideNavRail"
import {IdeWorkspace} from "@/features/ideUi/ideWorkspace"
import {IdeFooter} from "@/features/ideUi/ideFooter"


export const IdeLayout = () => {
  const currentTheme = useThemeStore((state) => state.currentTheme)

  // Sync client-side cached theme directly onto root html/body viewport node
  useEffect(() => {
    document.documentElement.classList.add(currentTheme)
  }, [currentTheme])

  return (
    <div className="bg-ide-panel h-screen w-screen p-1.5 pl-0.5 flex flex-col gap-1.5 overflow-hidden select-none transition-colors duration-200">
      <IdeHeader />
      <div className="flex-1 flex flex-row gap-0.5 min-h-0 w-full">
        <IdeNavRail />
        <IdeWorkspace />
      </div>
      <IdeFooter />
    </div>
  )
}

export default IdeLayout
