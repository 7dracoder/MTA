/**
 * Loads and updates favorites via merged Flask API: GET/POST/DELETE/PATCH on `/api/favorites`.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  deleteFavorite,
  fetchFavoritesList,
  patchFavoriteAlerts,
  postFavorite,
  UserApiError,
} from "../lib/apiAuth"
import type { FavoriteRecord } from "../types/userPreferences"

function routeDisplayName(routeId: string, longName?: string, shortName?: string): string {
  const a = longName?.trim()
  const b = shortName?.trim()
  if (a !== undefined && a.length > 0) {
    return a
  }
  if (b !== undefined && b.length > 0) {
    return b
  }
  return `Route ${routeId}`
}

export interface UseFavoritesResult {
  /** All favorite rows from the server (routes and stations). */
  records: FavoriteRecord[]
  /** GTFS route_ids that are favorited (`item_type === "route"`). */
  routeIds: string[]
  /** Map route_id → DB row id and alerts flag for starred routes. */
  favoriteByRouteId: ReadonlyMap<string, { id: number; alerts_enabled: boolean }>
  loading: boolean
  error: string | null
  /** Star or unstar a route; `displayName` is sent as `item_name` on POST. */
  toggleFavorite: (routeId: string, displayName: string) => Promise<void>
  /** Toggle per-route alerts (PATCH `/api/favorites/:id/alerts`). */
  toggleRouteAlerts: (favoriteId: number, enabled: boolean) => Promise<void>
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
  const [records, setRecords] = useState<FavoriteRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const routeIds = useMemo(() => {
    const ids = records.filter((r) => r.item_type === "route").map((r) => r.item_id)
    ids.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    return ids
  }, [records])

  const favoriteByRouteId = useMemo(() => {
    const m = new Map<string, { id: number; alerts_enabled: boolean }>()
    for (const r of records) {
      if (r.item_type === "route") {
        m.set(r.item_id, { id: r.id, alerts_enabled: r.alerts_enabled })
      }
    }
    return m
  }, [records])

  const reloadFromServer = useCallback(async (): Promise<void> => {
    const token = await getIdToken()
    if (token === null) {
      setRecords([])
      return
    }
    const list = await fetchFavoritesList(token)
    setRecords(list)
  }, [getIdToken])

  useEffect(() => {
    if (userId === null) {
      setRecords([])
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
            setRecords([])
            setLoading(false)
          }
          return
        }
        const list = await fetchFavoritesList(token)
        if (!cancelled) {
          setRecords(list)
        }
      } catch (e) {
        if (!cancelled) {
          const msg =
            e instanceof UserApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not load favorites."
          setError(
            `${msg} Ensure Flask is running and accepts Bearer tokens on GET /api/favorites (see docs/BACKEND_INTEGRATION.md).`,
          )
          setRecords([])
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
    async (routeId: string, displayName: string) => {
      if (userId === null) {
        return
      }
      const token = await getIdToken()
      if (token === null) {
        setError("You must be signed in to save favorites.")
        return
      }

      const existing = records.find((r) => r.item_type === "route" && r.item_id === routeId)

      setError(null)

      if (existing !== undefined) {
        const prevRecords = records
        setRecords((rows) => rows.filter((r) => r.id !== existing.id))
        try {
          await deleteFavorite(token, existing.id)
        } catch (e) {
          setRecords(prevRecords)
          const msg =
            e instanceof UserApiError
              ? e.message
              : e instanceof Error
                ? e.message
                : "Could not remove favorite."
          setError(msg)
        }
        return
      }

      const name = routeDisplayName(routeId, displayName)
      try {
        const created = await postFavorite(token, {
          item_type: "route",
          item_id: routeId,
          item_name: name,
        })
        setRecords((rows) => [...rows, created])
      } catch (e) {
        if (e instanceof UserApiError && e.status === 409) {
          try {
            await reloadFromServer()
          } catch (e2) {
            const msg = e2 instanceof Error ? e2.message : "Could not refresh favorites."
            setError(msg)
          }
          return
        }
        const msg =
          e instanceof UserApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not add favorite."
        setError(msg)
      }
    },
    [userId, getIdToken, records, reloadFromServer],
  )

  const toggleRouteAlerts = useCallback(
    async (favoriteId: number, enabled: boolean) => {
      if (userId === null) {
        return
      }
      const token = await getIdToken()
      if (token === null) {
        setError("You must be signed in to change alert settings.")
        return
      }

      const prevRecords = records
      setRecords((rows) =>
        rows.map((r) => (r.id === favoriteId ? { ...r, alerts_enabled: enabled } : r)),
      )
      setError(null)

      try {
        const updated = await patchFavoriteAlerts(token, favoriteId, enabled)
        setRecords((rows) => rows.map((r) => (r.id === favoriteId ? updated : r)))
      } catch (e) {
        setRecords(prevRecords)
        const msg =
          e instanceof UserApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Could not update alerts."
        setError(msg)
      }
    },
    [userId, getIdToken, records],
  )

  return {
    records,
    routeIds,
    favoriteByRouteId,
    loading,
    error,
    toggleFavorite,
    toggleRouteAlerts,
    clearError,
  }
}
