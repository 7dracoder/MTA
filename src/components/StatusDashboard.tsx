import type { RouteStatus, TransitMode } from '../types/transit'

const MODE_ORDER: TransitMode[] = ['subway', 'bus', 'rail', 'unknown']

const MODE_LABEL: Record<TransitMode, string> = {
  subway: 'Subway',
  bus: 'Bus',
  rail: 'Rail',
  unknown: 'Other',
}

function severityClasses(severity: RouteStatus['severity']): string {
  switch (severity) {
    case 'good':
      return 'bg-emerald-900/50 text-emerald-200 ring-emerald-700/60'
    case 'minor':
      return 'bg-amber-900/50 text-amber-200 ring-amber-700/60'
    case 'major':
      return 'bg-rose-900/50 text-rose-200 ring-rose-700/60'
    default:
      return 'bg-slate-700/50 text-slate-200 ring-slate-600/60'
  }
}

function severityLabel(severity: RouteStatus['severity']): string {
  switch (severity) {
    case 'good':
      return 'Good service'
    case 'minor':
      return 'Minor issues'
    case 'major':
      return 'Major disruption'
    default:
      return 'Status'
  }
}

interface StatusDashboardProps {
  statuses: RouteStatus[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  onRetry: () => void
  /** When false, favorite controls are disabled and a hint is shown. */
  isAuthenticated: boolean
  favoriteRouteIds: string[]
  /** DB id and alerts flag for each favorited route (from GET /api/favorites). */
  favoriteByRouteId: ReadonlyMap<string, { id: number; alerts_enabled: boolean }>
  onToggleFavorite: (routeId: string, displayName: string) => void
  onToggleRouteAlerts: (favoriteId: number, enabled: boolean) => void
  favoritesError: string | null
  onClearFavoritesError: () => void
}

export function StatusDashboard({
  statuses,
  loading,
  error,
  lastUpdated,
  onRetry,
  isAuthenticated,
  favoriteRouteIds,
  favoriteByRouteId,
  onToggleFavorite,
  onToggleRouteAlerts,
  favoritesError,
  onClearFavoritesError,
}: StatusDashboardProps) {
  const favoriteSet = new Set(favoriteRouteIds)
  const byMode = new Map<TransitMode, RouteStatus[]>()
  for (const m of MODE_ORDER) byMode.set(m, [])
  for (const s of statuses) {
    const list = byMode.get(s.mode) ?? byMode.get("unknown")
    if (list !== undefined) {
      list.push(s)
    }
  }

  return (
    <section
      className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-lg backdrop-blur-sm"
      aria-label="Service status"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-100">Service status</h2>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {lastUpdated ? (
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          ) : null}
          {loading && statuses.length > 0 ? <span className="text-sky-400">Refreshing…</span> : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {!isAuthenticated ? (
          <p className="mb-3 text-xs text-slate-500">
            Sign in to star routes. For starred routes, turn on <strong className="text-slate-400">Alerts</strong> to
            see in-app banners when MTA status text changes (no push notifications).
          </p>
        ) : null}
        {favoritesError !== null ? (
          <div
            className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
            role="alert"
          >
            <p>{favoritesError}</p>
            <button
              type="button"
              onClick={onClearFavoritesError}
              className="mt-2 text-[10px] font-semibold text-sky-400 hover:text-sky-300"
            >
              Dismiss
            </button>
          </div>
        ) : null}
        {error ? (
          <div
            className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100"
            role="alert"
          >
            <p className="font-medium">Could not load status</p>
            <p className="mt-1 text-rose-200/90">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-xs font-semibold text-sky-400 hover:text-sky-300"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading && statuses.length === 0 ? (
          <ul className="space-y-3" aria-busy="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="h-14 animate-pulse rounded-lg bg-slate-800/80"
              />
            ))}
          </ul>
        ) : null}

        {!loading && !error && statuses.length === 0 ? (
          <p className="text-sm text-slate-500">No status rows returned. Is the API running?</p>
        ) : null}

        {statuses.length > 0
          ? MODE_ORDER.map((mode) => {
              const rows = byMode.get(mode) ?? []
              if (rows.length === 0) return null
              return (
                <div key={mode} className="mb-6 last:mb-0">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    {MODE_LABEL[mode]}
                  </h3>
                  <ul className="space-y-2">
                    {rows.map((row, idx) => {
                      const routeMeta =
                        isAuthenticated && favoriteSet.has(row.route_id)
                          ? favoriteByRouteId.get(row.route_id)
                          : undefined
                      return (
                        <li
                          key={`${mode}-${row.route_id}-${idx}`}
                          className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2.5"
                        >
                          <button
                            type="button"
                            disabled={!isAuthenticated}
                            onClick={() => {
                              onClearFavoritesError()
                              const displayName =
                                row.route_long_name ??
                                row.route_short_name ??
                                `Route ${row.route_id}`
                              void onToggleFavorite(row.route_id, displayName)
                            }}
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition-colors ${
                              favoriteSet.has(row.route_id)
                                ? "border-amber-500/80 bg-amber-900/40 text-amber-100"
                                : "border-slate-600 bg-slate-800/80 text-slate-400 hover:border-slate-500"
                            } disabled:cursor-not-allowed disabled:opacity-40`}
                            title={
                              isAuthenticated
                                ? favoriteSet.has(row.route_id)
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                                : "Sign in to save favorites"
                            }
                            aria-pressed={favoriteSet.has(row.route_id)}
                            aria-label={
                              favoriteSet.has(row.route_id)
                                ? `Unfavorite route ${row.route_id}`
                                : `Favorite route ${row.route_id}`
                            }
                          >
                            {favoriteSet.has(row.route_id) ? "★" : "☆"}
                          </button>
                          {routeMeta !== undefined ? (
                            <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-slate-600/80 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-400">
                              <input
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded border-slate-500 bg-slate-950 text-sky-500 focus:ring-sky-500"
                                checked={routeMeta.alerts_enabled}
                                onChange={(e) => {
                                  onClearFavoritesError()
                                  void onToggleRouteAlerts(routeMeta.id, e.target.checked)
                                }}
                                aria-label={`In-app alerts for route ${row.route_id}`}
                              />
                              Alerts
                            </label>
                          ) : null}
                          <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-slate-800 px-2 text-sm font-bold text-slate-100">
                            {row.route_id}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-200">
                              {row.route_long_name ||
                                row.route_short_name ||
                                `Route ${row.route_id}`}
                            </p>
                            <p className="text-xs text-slate-400">{row.summary}</p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset ${severityClasses(row.severity)}`}
                          >
                            {severityLabel(row.severity)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })
          : null}
      </div>
    </section>
  )
}
