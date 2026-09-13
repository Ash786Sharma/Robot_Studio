import { useState, type FormEvent } from "react"
import { useAuthStore } from "@/core/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export const LoginScreen = () => {
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const login = useAuthStore((state) => state.login)
  const signup = useAuthStore((state) => state.signup)
  const error = useAuthStore((state) => state.error)
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    try {
      if (mode === "login") await login(email, password)
      else await signup(name, email, password)
    } catch {
      // surfaced via useAuthStore().error
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--ide-panel-bg)] p-6"
      >
        <h1 className="text-lg font-semibold">
          {mode === "login" ? "Sign in to ONS" : "Create your ONS account"}
        </h1>

        {mode === "signup" && (
          <label className="flex flex-col gap-1.5 text-xs text-[var(--ide-text-inactive)]">
            Name
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-xs text-[var(--ide-text-inactive)]">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label className="flex flex-col gap-1.5 text-xs text-[var(--ide-text-inactive)]">
          Password
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
          />
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button type="submit" disabled={isAuthenticating}>
          {isAuthenticating ? "Please wait…" : mode === "login" ? "Sign in" : "Sign up"}
        </Button>

        <button
          type="button"
          className="text-xs text-[var(--ide-text-inactive)] hover:text-[var(--foreground)]"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  )
}
