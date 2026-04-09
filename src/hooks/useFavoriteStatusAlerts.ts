import { useEffect, useRef, useState } from "react"
import type { RouteStatus } from "../types/transit"
import type { AlertPreferencesPayload } from "../types/userPreferences"

export interface FavoriteStatusAlert {
  id: string
  route_id: string
  message: string
}

function shouldNotifyForChange(
  prefs: AlertPreferencesPayload,
  newSeverity: RouteStatus["severity"],
): boolean {
  if (!prefs.notify_minor && !prefs.notify_major) {
    return false
  }
  if (newSeverity === "major") {
    return prefs.notify_major
  }
  if (newSeverity === "minor") {
    return prefs.notify_minor
  }
  if (newSeverity === "good" || newSeverity === "unknown") {
    return prefs.notify_minor || prefs.notify_major
  }
  return false
}

function favoritesKey(routeIds: string[]): string {
  return [...routeIds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join("|")
}

/**
 * @param statuses - Latest service status rows from the dashboard poll.
 * @param favoriteRouteIds - GTFS route IDs the user marked as favorites.
 * @param prefs - User alert toggles from the backend.
 */
export function useFavoriteStatusAlerts(
  statuses: RouteStatus[],
  favoriteRouteIds: string[],
  prefs: AlertPreferencesPayload,
): {
  alerts: FavoriteStatusAlert[]
  dismissAlert: (id: string) => void
} {
  const [alerts, setAlerts] = useState<FavoriteStatusAlert[]>([])
  const prevByRoute = useRef<Map<string, { summary: string; severity: RouteStatus["severity"] }>>(
    new Map(),
  )
  const seeded = useRef(false)
  const lastFavKey = useRef<string>("")

  useEffect(() => {
    const key = favoritesKey(favoriteRouteIds)
    if (key !== lastFavKey.current) {
      lastFavKey.current = key
      seeded.current = false
      prevByRoute.current = new Map()
      setAlerts([])
    }

    const favSet = new Set(favoriteRouteIds)
    if (statuses.length === 0) {
      return
    }

    if (!seeded.current) {
      const map = new Map<string, { summary: string; severity: RouteStatus["severity"] }>()
      for (const s of statuses) {
        if (favSet.has(s.route_id)) {
          map.set(s.route_id, { summary: s.summary, severity: s.severity })
        }
      }
      prevByRoute.current = map
      seeded.current = true
      return
    }

    const newAlerts: FavoriteStatusAlert[] = []
    for (const s of statuses) {
      if (!favSet.has(s.route_id)) {
        continue
      }
      const prev = prevByRoute.current.get(s.route_id)
      const next = { summary: s.summary, severity: s.severity }
      if (prev !== undefined) {
        const changed = prev.summary !== next.summary || prev.severity !== next.severity
        if (changed && shouldNotifyForChange(prefs, next.severity)) {
          newAlerts.push({
            id: `${s.route_id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            route_id: s.route_id,
            message: `Route ${s.route_id}: ${next.summary}`,
          })
        }
      }
      prevByRoute.current.set(s.route_id, next)
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev])
    }
  }, [statuses, favoriteRouteIds, prefs])

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return { alerts, dismissAlert }
}
