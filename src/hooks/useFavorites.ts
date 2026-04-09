import { useCallback, useEffect, useState } from "react"
import { fetchFavorites, putFavorites, UserApiError } from "../lib/apiAuth"
import type { FavoritesPayload } from "../types/userPreferences"

const DEFAULT_FAVORITES: FavoritesPayload = { route_ids: [] }

function isNotFound(status: number): boolean {
  return status === 404
}

export interface UseFavoritesResult {
  routeIds: string[]
  loading: boolean
  error: string | null
  toggleFavorite: (routeId: string) => Promise<void>
  clearError: () => void
}

/**
 * @param userId - Firebase uid when signed in; null when guest (skips API calls).
 * @param getIdToken - Resolves a Firebase ID token for Bearer auth.
 */
export function useFavorites(
  userId: string | null,
  getIdToken: () => Promise<string | null>,
): UseFavoritesResult {
  const [routeIds, setRouteIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) {
      setRouteIds([])
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
            setRouteIds([])
            setLoading(false)
          }
          return
        }
        const data = await fetchFavorites(token)
        if (!cancelled) {
          setRouteIds(data.route_ids)
        }
      } catch (e) {
        if (!cancelled) {
          if (e instanceof UserApiError && isNotFound(e.status)) {
            setRouteIds(DEFAULT_FAVORITES.route_ids)
            setError(null)
          } else {
            const msg =
              e instanceof UserApiError
                ? e.message
                : e instanceof Error
                  ? e.message
                  : "Could not load favorites."
            setError(
              `${msg} If the backend is not deployed yet, ask your API engineer to implement GET /api/me/favorites.`,
            )
            setRouteIds([])
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

  const toggleFavorite = useCallback(
    async (routeId: string) => {
      if (userId === null) {
        return
      }
      const token = await getIdToken()
      if (token === null) {
        setError("You must be signed in to save favorites.")
        return
      }

      const prev = routeIds
      const set = new Set(routeIds)
      if (set.has(routeId)) {
        set.delete(routeId)
      } else {
        set.add(routeId)
      }
      const nextList = [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

      setRouteIds(nextList)
      setError(null)

      try {
        await putFavorites(token, { route_ids: nextList })
      } catch (e) {
        setRouteIds(prev)
        const msg =
          e instanceof UserApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not save favorites."
        setError(
          `${msg} Ensure the Flask API implements PUT /api/me/favorites and accepts a Firebase Bearer token.`,
        )
      }
    },
    [userId, getIdToken, routeIds],
  )

  return { routeIds, loading, error, toggleFavorite, clearError }
}
