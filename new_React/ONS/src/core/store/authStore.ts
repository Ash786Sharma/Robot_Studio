import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiRequest } from "@/core/api/httpClient"

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthResponse {
  token: string
  user: AuthUser
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  isAuthenticating: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticating: false,
      error: null,

      login: async (email, password) => {
        set({ isAuthenticating: true, error: null })
        try {
          const result = await apiRequest<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: { email, password },
          })
          set({ token: result.token, user: result.user, isAuthenticating: false })
        } catch (err) {
          set({ isAuthenticating: false, error: err instanceof Error ? err.message : "Login failed" })
          throw err
        }
      },

      signup: async (name, email, password) => {
        set({ isAuthenticating: true, error: null })
        try {
          const result = await apiRequest<AuthResponse>("/api/auth/signup", {
            method: "POST",
            body: { name, email, password },
          })
          set({ token: result.token, user: result.user, isAuthenticating: false })
        } catch (err) {
          set({ isAuthenticating: false, error: err instanceof Error ? err.message : "Signup failed" })
          throw err
        }
      },

      logout: () => set({ token: null, user: null }),
    }),
    { name: "ons-auth", partialize: (state) => ({ token: state.token, user: state.user }) },
  ),
)
