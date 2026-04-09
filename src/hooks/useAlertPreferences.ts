import { useCallback, useEffect, useState } from "react"
import { fetchAlertPreferences, putAlertPreferences, UserApiError } from "../lib/apiAuth"
import type { AlertPreferencesPayload } from "../types/userPreferences"

const DEFAULT_PREFS: AlertPreferencesPayload = {
  notify_minor: false,
  notify_major: false,
}

function isNotFound(status: number): boolean {
  return status === 404
}

export interface UseAlertPreferencesResult {
  preferences: AlertPreferencesPayload
  loading: boolean
  error: string | null
  setNotifyMinor: (value: boolean) => Promise<void>
  setNotifyMajor: (value: boolean) => Promise<void>
  clearError: () => void
}

/**
 * @param userId - Firebase uid when signed in; null when guest.
 * @param getIdToken - Resolves a Firebase ID token for Bearer auth.
 */
export function useAlertPreferences(
  userId: string | null,
  getIdToken: () => Promise<string | null>,
): UseAlertPreferencesResult {
  const [preferences, setPreferences] = useState<AlertPreferencesPayload>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) {
      setPreferences(DEFAULT_PREFS)
      setError(null)
      setLoading(false)
      return
    }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = await getIdToken()
        if (token === null) {
          if (!cancelled) {
            setPreferences(DEFAULT_PREFS)
            setLoading(false)
          }
          return
        }
        const data = await fetchAlertPreferences(token)
        if (!cancelled) {
          setPreferences(data)
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof UserApiError && isNotFound(e.status)) {
            setPreferences(DEFAULT_PREFS)
            setError(null)
          } else {
            const msg =
              e instanceof UserApiError
                ? e.message
                : e instanceof Error
                  ? e.message
                  : "Could not load alert preferences."
            setError(
              `${msg} If the backend is not ready, implement GET /api/me/alert-preferences on Flask.`,
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [userId, getIdToken])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const persist = useCallback(
    async (next: AlertPreferencesPayload) => {
      if (userId === null) {
        return
      }
      const token = await getIdToken()
      if (token === null) {
        setError("You must be signed in to save preferences.")
        return
      }

      const prev = preferences
      setPreferences(next)
      setError(null)

      try {
        await putAlertPreferences(token, next)
      } catch (e) {
        setPreferences(prev)
        const msg =
          e instanceof UserApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not save alert preferences."
        setError(`${msg} Ensure Flask implements PUT /api/me/alert-preferences.`)
      }
    },
    [userId, getIdToken, preferences],
  )

  const setNotifyMinor = useCallback(
    async (value: boolean) => {
      await persist({ ...preferences, notify_minor: value })
    },
    [persist, preferences],
  )

  const setNotifyMajor = useCallback(
    async (value: boolean) => {
      await persist({ ...preferences, notify_major: value })
    },
    [persist, preferences],
  )

  return {
    preferences,
    loading,
    error,
    setNotifyMinor,
    setNotifyMajor,
    clearError,
  }
}
