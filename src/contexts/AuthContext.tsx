import { FirebaseError } from "firebase/app"
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from "firebase/auth"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { getFirebaseClient, type FirebaseClientInit } from "../lib/firebase"

export interface AuthContextValue {
  /** True until the first onAuthStateChanged callback runs. */
  initializing: boolean
  /** Set when Firebase env is invalid or initializeApp fails. */
  configError: string | null
  /** Current signed-in user, or null if guest. */
  user: User | null
  /** Last auth operation error for display in the UI. */
  authError: string | null
  clearAuthError: () => void
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOutUser: () => Promise<void>
  /** Returns a fresh ID token for Flask, or null if signed out. */
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Maps Firebase Auth error codes to short user-facing strings.
 */
function mapFirebaseAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "That email is already registered. Try signing in."
      case "auth/invalid-email":
        return "Enter a valid email address."
      case "auth/weak-password":
        return "Password should be at least 6 characters."
      case "auth/user-disabled":
        return "This account has been disabled."
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Incorrect email or password."
      case "auth/too-many-requests":
        return "Too many attempts. Try again later."
      case "auth/network-request-failed":
        return "Network error. Check your connection."
      default:
        return err.message.length > 0 ? err.message : "Authentication failed."
    }
  }
  if (err instanceof Error) {
    return err.message
  }
  return "An unexpected error occurred."
}

function resolveAuthFromInit(init: FirebaseClientInit): Auth | null {
  return init.status === "ok" ? init.auth : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const init = useMemo(() => getFirebaseClient(), [])
  const configError = init.status === "error" ? init.message : null
  const authInstance = useMemo(() => resolveAuthFromInit(init), [init])

  const [initializing, setInitializing] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (authInstance === null) {
      setUser(null)
      setInitializing(false)
      return
    }

    const unsubscribe = onAuthStateChanged(authInstance, (next) => {
      setUser(next)
      setInitializing(false)
    })

    return () => {
      unsubscribe()
    }
  }, [authInstance])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (authInstance === null) {
        setAuthError("Firebase is not configured.")
        return
      }
      setAuthError(null)
      try {
        await createUserWithEmailAndPassword(authInstance, email.trim(), password)
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e))
        throw e
      }
    },
    [authInstance],
  )

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (authInstance === null) {
        setAuthError("Firebase is not configured.")
        return
      }
      setAuthError(null)
      try {
        await signInWithEmailAndPassword(authInstance, email.trim(), password)
      } catch (e) {
        setAuthError(mapFirebaseAuthError(e))
        throw e
      }
    },
    [authInstance],
  )

  const signOutUser = useCallback(async () => {
    if (authInstance === null) {
      return
    }
    setAuthError(null)
    try {
      await signOut(authInstance)
    } catch (e) {
      setAuthError(mapFirebaseAuthError(e))
      throw e
    }
  }, [authInstance])

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (user === null) {
      return null
    }
    return user.getIdToken()
  }, [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      configError,
      user,
      authError,
      clearAuthError,
      signUp,
      signIn,
      signOutUser,
      getIdToken,
    }),
    [
      initializing,
      configError,
      user,
      authError,
      clearAuthError,
      signUp,
      signIn,
      signOutUser,
      getIdToken,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return ctx
}
