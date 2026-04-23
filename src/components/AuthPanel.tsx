import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"

export function AuthPanel() {
  const {
    initializing,
    configError,
    user,
    authError,
    clearAuthError,
    signUp,
    signIn,
    signOutUser,
  } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)

  if (configError !== null) {
    return (
      <div
        className="max-w-md rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-xs text-amber-100"
        role="alert"
      >
        <p className="font-semibold">Firebase configuration</p>
        <p className="mt-1 text-amber-200/90">{configError}</p>
      </div>
    )
  }

  if (initializing) {
    return (
      <p className="text-xs text-slate-500" aria-live="polite">
        Checking session…
      </p>
    )
  }

  if (user !== null) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-400" title={user.email ?? undefined}>
          Signed in as{" "}
          <span className="font-medium text-slate-200">{user.email ?? user.uid}</span>
        </span>
        <button
          type="button"
          onClick={() => {
            void signOutUser()
          }}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700"
        >
          Sign out
        </button>
      </div>
    )
  }

  const handleSignIn = async () => {
    clearAuthError()
    setPending(true)
    try {
      await signIn(email, password)
      setPassword("")
    } catch {
      /* authError set in context */
    } finally {
      setPending(false)
    }
  }

  const handleSignUp = async () => {
    clearAuthError()
    setPending(true)
    try {
      await signUp(email, password)
      setPassword("")
    } catch {
      /* authError set in context */
    } finally {
      setPending(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label="Sign in or create account"
    >
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label htmlFor="auth-email" className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-950/80 px-2 py-1.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </div>
      <div className="flex min-w-[10rem] flex-1 flex-col gap-1">
        <label
          htmlFor="auth-password"
          className="text-[10px] font-medium uppercase tracking-wide text-slate-500"
        >
          Password
        </label>
        <input
          id="auth-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-slate-600 bg-slate-950/80 px-2 py-1.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
          minLength={6}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleSignIn()}
          className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
        >
          Sign in
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleSignUp()}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-slate-700 disabled:opacity-50"
        >
          Create account
        </button>
      </div>
      {authError !== null ? (
        <p className="w-full text-xs text-rose-300" role="alert">
          {authError}
        </p>
      ) : null}
    </div>
  )
}
