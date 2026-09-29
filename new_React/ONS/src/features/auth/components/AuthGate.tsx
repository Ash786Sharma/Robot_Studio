import { useEffect, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/core/store/authStore"
import { useProjectStore } from "@/core/store/projectStore"
import { projectsApi } from "@/core/api/projectsApi"
import { LoginScreen } from "./LoginScreen"

// Gates the IDE behind auth, then bootstraps an active project ONCE per
// session so the rest of the app always starts with a projectId. Uses
// react-query (instead of a manual useEffect+fetch) so the bootstrap call is
// deduped under StrictMode's double-invoke and surfaces real errors instead
// of hanging silently.
//
// Deliberately does NOT re-run (or re-gate the whole layout) just because
// `activeProjectId` later becomes null — that happens on purpose when the
// user closes/deletes the active project, and should only clear the
// workspace explorer/tabs (handled inside IdeWorkspace), not replace the
// entire IDE shell with a full-screen loader/error again.
export const AuthGate = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token)
  const activeProjectId = useProjectStore((state) => state.activeProjectId)
  const setActiveProjectId = useProjectStore((state) => state.setActiveProjectId)
  const [hasBootstrapped, setHasBootstrapped] = useState(false)

  const bootstrapQuery = useQuery({
    queryKey: ["projects", "bootstrap"],
    // Only picks an existing project to open, never creates one — an empty
    // list should land on IdeWorkspace's "no project open" placeholder, not
    // a silently auto-created "My Project".
    queryFn: async () => {
      const projects = await projectsApi.list()
      return projects[0] ?? null
    },
    enabled: Boolean(token) && !hasBootstrapped,
    retry: false,
  })

  useEffect(() => {
    if (bootstrapQuery.data && !activeProjectId) {
      setActiveProjectId(bootstrapQuery.data.id)
    }
  }, [bootstrapQuery.data, activeProjectId, setActiveProjectId])

  useEffect(() => {
    if (bootstrapQuery.isSuccess || bootstrapQuery.isError) {
      setHasBootstrapped(true)
    }
  }, [bootstrapQuery.isSuccess, bootstrapQuery.isError])

  // Re-arm the bootstrap for the next login once the session ends.
  useEffect(() => {
    if (!token) setHasBootstrapped(false)
  }, [token])

  if (!token) return <LoginScreen />

  if (!hasBootstrapped) {
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

    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground)]">
        Loading workspace…
      </div>
    )
  }

  return <>{children}</>
}
