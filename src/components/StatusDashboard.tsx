import type { RouteStatus, TransitMode } from '../types/transit'

const MODE_ORDER: TransitMode[] = ['subway', 'bus', 'rail', 'unknown']
const MODE_LABEL: Record<TransitMode, string> = { subway: 'Subway', bus: 'Bus', rail: 'Rail', unknown: 'Other' }

const SEVERITY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  good:    { bg: '#052e16', color: '#4ade80', label: 'Good Service' },
  minor:   { bg: '#2d1a00', color: '#fb923c', label: 'Minor Issues' },
  major:   { bg: '#2d0a0a', color: '#f87171', label: 'Disruption' },
  unknown: { bg: '#1e293b', color: '#94a3b8', label: 'Unknown' },
}

interface StatusDashboardProps {
  statuses: RouteStatus[]
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  onRetry: () => void
  isAuthenticated: boolean
  favoriteRouteIds: string[]
  favoriteByRouteId: ReadonlyMap<string, { id: number; alerts_enabled: boolean }>
  onToggleFavorite: (routeId: string, displayName: string) => void
  onToggleRouteAlerts: (favoriteId: number, enabled: boolean) => void
  favoritesError: string | null
  onClearFavoritesError: () => void
}

export function StatusDashboard({
  statuses, loading, error, lastUpdated, onRetry,
  isAuthenticated, favoriteRouteIds, favoriteByRouteId,
  onToggleFavorite, onToggleRouteAlerts,
  favoritesError, onClearFavoritesError,
}: StatusDashboardProps) {
  const favoriteSet = new Set(favoriteRouteIds)
  const byMode = new Map<TransitMode, RouteStatus[]>()
  for (const m of MODE_ORDER) byMode.set(m, [])
  for (const s of statuses) {
    const list = byMode.get(s.mode) ?? byMode.get('unknown')!
    list.push(s)
  }

  return (
    <section
      style={{ background: '#0f1623', border: '1px solid #1e2d45', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}
      aria-label="Service status"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #1e2d45', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
          Service Status
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#334155' }}>
          {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
          {loading && statuses.length > 0 && <span style={{ color: '#3b82f6' }}>Refreshing</span>}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>

        {!isAuthenticated && (
          <p style={{ fontSize: 11, color: '#475569', marginBottom: 10, lineHeight: 1.5 }}>
            Sign in to save favorite routes and enable in-app alerts.
          </p>
        )}

        {favoritesError && (
          <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>
            {favoritesError}
            <button type="button" onClick={onClearFavoritesError} style={{ marginLeft: 8, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Dismiss</button>
          </div>
        )}

        {error && (
          <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>
            <strong>Could not load status.</strong> {error}
            <button type="button" onClick={onRetry} style={{ marginLeft: 8, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Retry</button>
          </div>
        )}

        {loading && statuses.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ height: 44, background: '#1e2d45', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        )}

        {!loading && !error && statuses.length === 0 && (
          <p style={{ fontSize: 13, color: '#475569' }}>No data. Is the API running?</p>
        )}

        {MODE_ORDER.map((mode) => {
          const rows = byMode.get(mode) ?? []
          if (rows.length === 0) return null
          return (
            <div key={mode} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#334155', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #1e2d45' }}>
                {MODE_LABEL[mode]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rows.map((row, idx) => {
                  const sev = SEVERITY_STYLE[row.severity] ?? SEVERITY_STYLE.unknown
                  const routeMeta = isAuthenticated && favoriteSet.has(row.route_id) ? favoriteByRouteId.get(row.route_id) : undefined
                  const isFav = favoriteSet.has(row.route_id)

                  return (
                    <div
                      key={`${mode}-${row.route_id}-${idx}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: '#0a0e1a', border: '1px solid #1e2d45' }}
                    >
                      {/* Favorite star */}
                      <button
                        type="button"
                        disabled={!isAuthenticated}
                        onClick={() => {
                          onClearFavoritesError()
                          onToggleFavorite(row.route_id, row.route_long_name ?? row.route_short_name ?? `Route ${row.route_id}`)
                        }}
                        title={isAuthenticated ? (isFav ? 'Remove from favorites' : 'Add to favorites') : 'Sign in to save favorites'}
                        aria-pressed={isFav}
                        style={{
                          background: 'none', border: 'none', cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                          color: isFav ? '#f59e0b' : '#334155', fontSize: 14, padding: 0, lineHeight: 1,
                          opacity: isAuthenticated ? 1 : 0.4, flexShrink: 0,
                        }}
                      >
                        {isFav ? '★' : '☆'}
                      </button>

                      {/* Alerts toggle */}
                      {routeMeta !== undefined && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b', cursor: 'pointer', flexShrink: 0 }}>
                          <input
                            type="checkbox"
                            checked={routeMeta.alerts_enabled}
                            onChange={(e) => { onClearFavoritesError(); onToggleRouteAlerts(routeMeta.id, e.target.checked) }}
                            style={{ accentColor: '#3b82f6', width: 12, height: 12 }}
                          />
                          Alerts
                        </label>
                      )}

                      {/* Route ID badge */}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', background: '#1e2d45', padding: '2px 7px', flexShrink: 0, minWidth: 28, textAlign: 'center' }}>
                        {row.route_id}
                      </span>

                      {/* Name + summary */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.route_long_name || row.route_short_name || `Route ${row.route_id}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {row.summary}
                        </div>
                      </div>

                      {/* Status badge */}
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', background: sev.bg, color: sev.color, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {sev.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
