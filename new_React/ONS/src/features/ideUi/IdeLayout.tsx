import {IdeHeader} from "@/features/ideUi/ideHeader"
import {IdeNavRail} from "@/features/ideUi/ideNavRail"
import {IdeWorkspace} from "@/features/ideUi/ideWorkspace"
import {IdeFooter} from "@/features/ideUi/ideFooter"


export const IdeLayout = () => {
  return (
    <div className="bg-slate-900 h-screen w-screen p-1.5 pl-0.5 flex flex-col gap-1.5 overflow-hidden select-none ">
      <IdeHeader />
      <div className="flex-1 flex flex-row gap-0.5 min-h-0 w-full">
        <IdeNavRail/>
       <IdeWorkspace/>
      </div>
      <IdeFooter/>
    </div>
  )
}

export default IdeLayout
