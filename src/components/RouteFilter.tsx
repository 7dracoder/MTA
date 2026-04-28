interface RouteFilterProps {
  routeIds: string[]
  selectedRouteIds: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggleRoute: (routeId: string) => void
  onClear: () => void
}

export function RouteFilter({ routeIds, selectedRouteIds, search, onSearchChange, onToggleRoute, onClear }: RouteFilterProps) {
  const selected = new Set(selectedRouteIds)
  const q = search.trim().toLowerCase()
  const visibleIds = routeIds.filter((id) => !q || id.toLowerCase().includes(q))

  return (
    <section
      style={{ background: '#0f1623', border: '1px solid #1e2d45', padding: '14px 16px' }}
      aria-label="Filter by route"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
          Filter Routes
        </span>
        {selectedRouteIds.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Clear ({selectedRouteIds.length})
          </button>
        )}
      </div>

      <input
        id="route-search"
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search route (e.g. A, F, 1, B44)"
        style={{
          width: '100%', boxSizing: 'border-box', background: '#0a0e1a',
          border: '1px solid #1e2d45', color: '#e2e8f0', fontSize: 13,
          padding: '7px 10px', outline: 'none', marginBottom: 10,
          borderRadius: 0,
        }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
        {visibleIds.length === 0 ? (
          <span style={{ fontSize: 12, color: '#475569' }}>No routes match.</span>
        ) : visibleIds.map((id) => {
          const isOn = selected.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggleRoute(id)}
              aria-pressed={isOn}
              style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                border: isOn ? '1px solid #3b82f6' : '1px solid #1e2d45',
                background: isOn ? '#1e3a5f' : '#0a0e1a',
                color: isOn ? '#93c5fd' : '#94a3b8',
                cursor: 'pointer', borderRadius: 0,
                transition: 'all 0.1s',
              }}
            >
              {id}
            </button>
          )
        })}
      </div>

      <p style={{ marginTop: 8, fontSize: 11, color: '#334155' }}>
        {selectedRouteIds.length === 0
          ? 'All routes shown. Select to filter.'
          : `${selectedRouteIds.length} route(s) selected.`}
      </p>
    </section>
  )
}
