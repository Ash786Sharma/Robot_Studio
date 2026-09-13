import { useEffect, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/core/store/authStore"
import { useProjectStore } from "@/core/store/projectStore"
import { projectsApi } from "@/core/api/projectsApi"
import { LoginScreen } from "./LoginScreen"

// Gates the IDE behind auth, then bootstraps an active project so the rest of
// the app (file tree, editor, etc.) always has a projectId to work with.
// Uses react-query (instead of a manual useEffect+fetch) so the bootstrap call
// is deduped under StrictMode's double-invoke and surfaces real errors instead
// of hanging silently.
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId)

  const bootstrapQuery = useQuery({
    queryKey: ["projects", "bootstrap"],
    queryFn: async () => {
      const projects = await projectsApi.list()
      return projects[0] ?? (await projectsApi.create({ name: "My Project" }))
    },
    enabled: Boolean(token) && !activeProjectId,
    retry: false,
  })

  useEffect(() => {
    if (bootstrapQuery.data && !activeProjectId) {
      setActiveProjectId(bootstrapQuery.data.id)
    }
  }, [bootstrapQuery.data, activeProjectId, setActiveProjectId])

  if (!token) return <LoginScreen />

  if (bootstrapQuery.isError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-[var(--background)] px-6 text-center text-sm text-[var(--foreground)]">
        <p>Couldn&apos;t load your workspace.</p>
        <p className="text-xs text-red-400">
          {bootstrapQuery.error instanceof Error ? bootstrapQuery.error.message : "Unknown error"}
        </p>
      </div>
    )
  }

  if (!activeProjectId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground)]">
        Loading workspace…
      </div>
    )
  }

  return <>{children}</>
}
