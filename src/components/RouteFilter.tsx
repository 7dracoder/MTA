interface RouteFilterProps {
  routeIds: string[]
  selectedRouteIds: string[]
  search: string
  onSearchChange: (value: string) => void
  onToggleRoute: (routeId: string) => void
  onClear: () => void
}

export function RouteFilter({
  routeIds,
  selectedRouteIds,
  search,
  onSearchChange,
  onToggleRoute,
  onClear,
}: RouteFilterProps) {
  const selected = new Set(selectedRouteIds)
  const q = search.trim().toLowerCase()
  const visibleIds = routeIds.filter((id) => {
    if (!q) return true
    return id.toLowerCase().includes(q)
  })

  return (
    <section
      className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm"
      aria-label="Filter by GTFS route"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">
          Routes <span className="font-normal text-slate-500">(GTFS route_id)</span>
        </h2>
        {selectedRouteIds.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            Clear filters
          </button>
        ) : null}
      </div>
      <label className="mb-3 block text-xs text-slate-500" htmlFor="route-search">
        Search route id or name
      </label>
      <input
        id="route-search"
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="e.g. C, F, 1, B44…"
        className="mb-3 w-full rounded-lg border border-slate-600 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
        {visibleIds.length === 0 ? (
          <p className="text-sm text-slate-500">No routes match.</p>
        ) : (
          visibleIds.map((id) => {
            const isOn = selected.has(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggleRoute(id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                  isOn
                    ? 'border-sky-500 bg-sky-600/30 text-sky-100'
                    : 'border-slate-600 bg-slate-800/80 text-slate-300 hover:border-slate-500'
                }`}
                aria-pressed={isOn}
              >
                {id}
              </button>
            )
          })
        )}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {selectedRouteIds.length === 0
          ? 'Showing all routes. Tap routes to narrow the list and map.'
          : `Filtering ${selectedRouteIds.length} route(s).`}
      </p>
    </section>
  )
}
