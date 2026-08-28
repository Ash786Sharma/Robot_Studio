import { SidebarProvider, SidebarTrigger, Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader, } from "@/components/ui/sidebar"

export const IdeLayout = () => {
  return (
    <SidebarProvider>
      <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
      <main>
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  )
}

export default IdeLayout