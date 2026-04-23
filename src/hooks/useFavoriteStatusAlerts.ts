/**
 * Detects summary or severity changes for favorited routes whose per-favorite `alerts_enabled` is true.
 */
import { useEffect, useRef, useState } from "react"
import type { RouteStatus } from "../types/transit"

export interface FavoriteStatusAlert {
  id: string
  route_id: string
  message: string
}

function favoritesKey(routeIds: string[]): string {
  return [...routeIds].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join("|")
}

function alertsKey(map: ReadonlyMap<string, boolean>): string {
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([k, v]) => `${k}:${v ? "1" : "0"}`)
    .join("|")
}

/**
 * @param statuses - Latest service status rows from the dashboard poll.
 * @param favoriteRouteIds - GTFS route_ids that are starred.
 * @param alertsEnabledByRouteId - From backend `alerts_enabled` per favorite route.
 */
export function useFavoriteStatusAlerts(
  statuses: RouteStatus[],
  favoriteRouteIds: string[],
  alertsEnabledByRouteId: ReadonlyMap<string, boolean>,
): {
  alerts: FavoriteStatusAlert[]
  dismissAlert: (id: string) => void
} {
  const [alerts, setAlerts] = useState<FavoriteStatusAlert[]>([])
  const prevByRoute = useRef<Map<string, { summary: string; severity: RouteStatus["severity"] }>>(
    new Map(),
  )
  const seeded = useRef(false)
  const lastFavKey = useRef("")
  const lastAlertsKey = useRef("")

  useEffect(() => {
    const fKey = favoritesKey(favoriteRouteIds)
    const aKey = alertsKey(alertsEnabledByRouteId)
    if (fKey !== lastFavKey.current || aKey !== lastAlertsKey.current) {
      lastFavKey.current = fKey
      lastAlertsKey.current = aKey
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
        if (favSet.has(s.route_id) && alertsEnabledByRouteId.get(s.route_id) === true) {
          map.set(s.route_id, { summary: s.summary, severity: s.severity })
        }
      }
      prevByRoute.current = map
      seeded.current = true
      return
    }

    const newAlerts: FavoriteStatusAlert[] = []
    for (const s of statuses) {
      if (!favSet.has(s.route_id) || alertsEnabledByRouteId.get(s.route_id) !== true) {
        continue
      }
      const prev = prevByRoute.current.get(s.route_id)
      const next = { summary: s.summary, severity: s.severity }
      if (prev !== undefined) {
        const changed = prev.summary !== next.summary || prev.severity !== next.severity
        if (changed) {
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
  }, [statuses, favoriteRouteIds, alertsEnabledByRouteId])

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id))
  }

  return { alerts, dismissAlert }
}
