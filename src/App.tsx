import { useCallback, useMemo, useState } from "react"
import { AlertPreferencesPanel } from "./components/AlertPreferencesPanel"
import { AuthPanel } from "./components/AuthPanel"
import { FavoriteAlertsBanner } from "./components/FavoriteAlertsBanner"
import { RouteFilter } from "./components/RouteFilter"
import { StatusDashboard } from "./components/StatusDashboard"
import { TransitMap } from "./components/TransitMap"
import { useAuth } from "./contexts/AuthContext"
import { useAlertPreferences } from "./hooks/useAlertPreferences"
import { useFavoriteStatusAlerts } from "./hooks/useFavoriteStatusAlerts"
import { useFavorites } from "./hooks/useFavorites"
import { useServiceStatus } from "./hooks/useServiceStatus"
import { useVehiclePositions } from "./hooks/useVehiclePositions"

function useFilteredByRoutes<T extends { route_id: string }>(
  items: T[],
  selectedRouteIds: string[],
): T[] {
  return useMemo(() => {
    if (selectedRouteIds.length === 0) {
      return items
    }
    const set = new Set(selectedRouteIds)
    return items.filter((x) => set.has(x.route_id))
  }, [items, selectedRouteIds])
}

const MOCK_MODE = import.meta.env.VITE_USE_MOCK_DATA === "true"

export default function App() {
  const { user, getIdToken } = useAuth()
  const userId = user !== null ? user.uid : null
  const isAuthenticated = user !== null

  const {
    data: statuses,
    loading: statusLoading,
    error: statusError,
    lastUpdated: statusUpdated,
    refetch: refetchStatus,
  } = useServiceStatus()
  const {
    data: vehicles,
    loading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useVehiclePositions()

  const {
    routeIds: favoriteRouteIds,
    error: favoritesError,
    toggleFavorite,
    clearError: clearFavoritesError,
  } = useFavorites(userId, getIdToken)

  const {
    preferences: alertPreferences,
    loading: alertPrefsLoading,
    error: alertPrefsError,
    setNotifyMinor,
    setNotifyMajor,
    clearError: clearAlertPrefsError,
  } = useAlertPreferences(userId, getIdToken)

  const { alerts: favoriteAlerts, dismissAlert } = useFavoriteStatusAlerts(
    statuses,
    favoriteRouteIds,
    alertPreferences,
  )

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
    setSelectedRouteIds((prev) => {
      const has = prev.includes(routeId)
      if (has) {
        return prev.filter((id) => id !== routeId)
      }
      return [...prev, routeId]
    })
  }, [])

  const clearFilters = useCallback(() => setSelectedRouteIds([]), [])

  const handleToggleFavorite = useCallback(
    (routeId: string) => {
      void toggleFavorite(routeId)
    },
    [toggleFavorite],
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
              NYC Transit Hub
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Service status and live vehicles — refreshes every 60 seconds
            </p>
            {MOCK_MODE ? (
              <p className="mt-2 inline-block rounded-md border border-amber-700/60 bg-amber-950/50 px-2 py-1 text-xs font-medium text-amber-200">
                Practice mode: sample routes in{" "}
                <code className="text-amber-100">src/data/mockTransit.ts</code> — set{" "}
                <code className="text-amber-100">VITE_USE_MOCK_DATA=false</code> to use the real API
              </p>
            ) : null}
          </div>
          <div className="w-full min-w-[16rem] lg:max-w-xl">
            <AuthPanel />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] gap-4 p-4 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-6">
        <div className="col-span-2 mb-4">
          <FavoriteAlertsBanner alerts={favoriteAlerts} onDismiss={dismissAlert} />
        </div>
        <div className="flex min-h-0 flex-col gap-4 lg:max-h-[calc(100vh-6rem)]">
          <RouteFilter
            routeIds={routeIds}
            selectedRouteIds={selectedRouteIds}
            search={search}
            onSearchChange={setSearch}
            onToggleRoute={toggleRoute}
            onClear={clearFilters}
          />
          {isAuthenticated ? (
            <AlertPreferencesPanel
              preferences={alertPreferences}
              loading={alertPrefsLoading}
              error={alertPrefsError}
              onClearError={clearAlertPrefsError}
              onChangeMinor={setNotifyMinor}
              onChangeMajor={setNotifyMajor}
            />
          ) : null}
          <StatusDashboard
            statuses={filteredStatuses}
            loading={statusLoading}
            error={statusError}
            lastUpdated={statusUpdated}
            onRetry={refetchStatus}
            isAuthenticated={isAuthenticated}
            favoriteRouteIds={favoriteRouteIds}
            onToggleFavorite={handleToggleFavorite}
            favoritesError={favoritesError}
            onClearFavoritesError={clearFavoritesError}
          />
        </div>
        <div className="min-h-[420px] lg:min-h-[calc(100vh-6rem)]">
          <TransitMap
            vehicles={filteredVehicles}
            loading={vehiclesLoading}
            error={vehiclesError}
            onRetry={refetchVehicles}
          />
        </div>
      </main>
    </div>
  )
}
