import { useCallback, useMemo, useState } from "react"
import { AuthPanel } from "./components/AuthPanel"
import { FavoriteAlertsBanner } from "./components/FavoriteAlertsBanner"
import { RouteFilter } from "./components/RouteFilter"
import { StatusDashboard } from "./components/StatusDashboard"
import { TransitMap } from "./components/TransitMap"
import { TripPlanner } from "./components/TripPlanner"
import { useAuth } from "./contexts/AuthContext"
import { useFavoriteStatusAlerts } from "./hooks/useFavoriteStatusAlerts"
import { useFavorites } from "./hooks/useFavorites"
import { useServiceStatus } from "./hooks/useServiceStatus"
import { useVehiclePositions } from "./hooks/useVehiclePositions"

function useFilteredByRoutes<T extends { route_id: string }>(items: T[], selectedRouteIds: string[]): T[] {
  return useMemo(() => {
    if (selectedRouteIds.length === 0) return items
    const set = new Set(selectedRouteIds)
    return items.filter((x) => set.has(x.route_id))
  }, [items, selectedRouteIds])
}

const MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === "true"
const HEADER_H = 56 // px — keep in sync with header style below

export default function App() {
  const { user, getIdToken } = useAuth()
  const userId = user !== null ? user.uid : null
  const isAuthenticated = user !== null

  const { data: statuses, loading: statusLoading, error: statusError, lastUpdated: statusUpdated, refetch: refetchStatus } = useServiceStatus()
  const { data: vehicles, loading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useVehiclePositions()
  const { routeIds: favoriteRouteIds, favoriteByRouteId, error: favoritesError, toggleFavorite, toggleRouteAlerts, clearError: clearFavoritesError } = useFavorites(userId, getIdToken)

  const alertsEnabledByRouteId = useMemo(() => {
    const m = new Map<string, boolean>()
    favoriteByRouteId.forEach((v, routeId) => { m.set(routeId, v.alerts_enabled) })
    return m
  }, [favoriteByRouteId])

  const { alerts: favoriteAlerts, dismissAlert } = useFavoriteStatusAlerts(statuses, favoriteRouteIds, alertsEnabledByRouteId)

  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([])
  const [search, setSearch] = useState("")

  const routeIds = useMemo(() => {
    const ids = [...new Set(statuses.map((s) => s.route_id))]
    ids.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    return ids
  }, [statuses])

  const filteredStatuses = useFilteredByRoutes(statuses, selectedRouteIds)
  const filteredVehicles = useFilteredByRoutes(vehicles, selectedRouteIds)

  const toggleRoute = useCallback((routeId: string) => {
    setSelectedRouteIds((prev) => prev.includes(routeId) ? prev.filter((id) => id !== routeId) : [...prev, routeId])
  }, [])
  const clearFilters = useCallback(() => setSelectedRouteIds([]), [])

  // When trip planner resolves routes, auto-select them in the filter
  const handleTripRoutes = useCallback((routeIds: string[]) => {
    setSelectedRouteIds(routeIds)
  }, [])

  return (
    // Full-viewport fixed layout
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0e1a' }}>

      {/* ── Header ── */}
      <header style={{ height: HEADER_H, flexShrink: 0, background: '#0f1623', borderBottom: '1px solid #1e2d45', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: '#1a56db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11, color: '#fff', letterSpacing: '-0.5px', flexShrink: 0 }}>
            MTA
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.2 }}>NYC Transit Hub</div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.2 }}>Real-time service status and live vehicle tracking</div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <AuthPanel />
        </div>
      </header>

      {MOCK_MODE && (
        <div style={{ flexShrink: 0, background: '#451a03', borderBottom: '1px solid #78350f', padding: '6px 20px', fontSize: 11, color: '#fcd34d' }}>
          Practice mode: using sample data. Set <code>VITE_USE_MOCK_DATA=false</code> to connect to the real API.
        </div>
      )}

      {/* ── Alerts banner ── */}
      {favoriteAlerts.length > 0 && (
        <div style={{ flexShrink: 0, padding: '8px 20px 0' }}>
          <FavoriteAlertsBanner alerts={favoriteAlerts} onDismiss={dismissAlert} />
        </div>
      )}

      {/* ── Main content: two columns, fills remaining height ── */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '420px 1fr', overflow: 'hidden' }}>

        {/* Left column: filter + status list */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid #1e2d45', overflow: 'hidden' }}>
          {/* Route filter — fixed height */}
          <div style={{ flexShrink: 0, borderBottom: '1px solid #1e2d45' }}>
            <RouteFilter
              routeIds={routeIds}
              selectedRouteIds={selectedRouteIds}
              search={search}
              onSearchChange={setSearch}
              onToggleRoute={toggleRoute}
              onClear={clearFilters}
            />
          </div>
          {/* Status dashboard — scrollable, fills rest */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <StatusDashboard
              statuses={filteredStatuses}
              loading={statusLoading}
              error={statusError}
              lastUpdated={statusUpdated}
              onRetry={refetchStatus}
              isAuthenticated={isAuthenticated}
              favoriteRouteIds={favoriteRouteIds}
              favoriteByRouteId={favoriteByRouteId}
              onToggleFavorite={(routeId, displayName) => { void toggleFavorite(routeId, displayName) }}
              onToggleRouteAlerts={(favoriteId, enabled) => { void toggleRouteAlerts(favoriteId, enabled) }}
              favoritesError={favoritesError}
              onClearFavoritesError={clearFavoritesError}
            />
          </div>
        </div>

        {/* Right column: map top half + trip planner bottom half */}
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Map — takes 60% of the column height */}
          <div style={{ flex: '0 0 60%', position: 'relative', overflow: 'hidden' }}>
            <TransitMap
              vehicles={filteredVehicles}
              loading={vehiclesLoading}
              error={vehiclesError}
              onRetry={refetchVehicles}
            />
          </div>
          {/* Trip planner — fills remaining 40% */}
          <div style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', borderTop: '1px solid #1e2d45' }}>
            <TripPlanner onRoutesResolved={handleTripRoutes} />
          </div>
        </div>
      </div>
    </div>
  )
}
