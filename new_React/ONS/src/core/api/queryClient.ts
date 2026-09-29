import { QueryClient } from "@tanstack/react-query"

// Shared instance so non-component code (zustand stores) can invalidate
// queries too, not just components via useQueryClient().
export const queryClient = new QueryClient()
