import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStations, useTripPlanner } from '../hooks/useTripPlanner'
import type { RouteInfo } from '../hooks/useTripPlanner'
import { estimateCrowd, crowdColor } from '../lib/crowdEstimator'
import { getDirection } from '../lib/routeDirection'

const STATUS_COLOR: Record<string, string> = {
  'Good Service': '#4ade80',
  'Delays': '#fb923c',
  'Service Change': '#facc15',
  'Suspended': '#f87171',
}

function StatusDot({ status }: { status: string }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status] ?? '#94a3b8', marginRight: 5, flexShrink: 0 }} />
  )
}

function RouteBadge({ routeId }: { routeId: string }) {
  // Reuse the same color map from transitIcons
  const COLORS: Record<string, { bg: string; color: string }> = {
    '1': { bg: '#EE352E', color: '#fff' }, '2': { bg: '#EE352E', color: '#fff' }, '3': { bg: '#EE352E', color: '#fff' },
    '4': { bg: '#00933C', color: '#fff' }, '5': { bg: '#00933C', color: '#fff' }, '6': { bg: '#00933C', color: '#fff' }, '6X': { bg: '#00933C', color: '#fff' },
    '7': { bg: '#B933AD', color: '#fff' }, '7X': { bg: '#B933AD', color: '#fff' },
    'A': { bg: '#0039A6', color: '#fff' }, 'C': { bg: '#0039A6', color: '#fff' }, 'E': { bg: '#0039A6', color: '#fff' },
    'B': { bg: '#FF6319', color: '#fff' }, 'D': { bg: '#FF6319', color: '#fff' }, 'F': { bg: '#FF6319', color: '#fff' }, 'M': { bg: '#FF6319', color: '#fff' },
    'G': { bg: '#6CBE45', color: '#fff' },
    'L': { bg: '#A7A9AC', color: '#fff' },
    'J': { bg: '#996633', color: '#fff' }, 'Z': { bg: '#996633', color: '#fff' },
    'N': { bg: '#FCCC0A', color: '#000' }, 'Q': { bg: '#FCCC0A', color: '#000' }, 'R': { bg: '#FCCC0A', color: '#000' }, 'W': { bg: '#FCCC0A', color: '#000' },
    'GS': { bg: '#808183', color: '#fff' }, 'SI': { bg: '#0039A6', color: '#fff' },
  }
  const c = COLORS[routeId] ?? { bg: '#334155', color: '#fff' }
  const label = routeId.replace(/[X+]$/, '').slice(0, 3)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: c.bg, color: c.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
      {label}
    </span>
  )
}

function CrowdBar({ routeId }: { routeId: string }) {
  const est = estimateCrowd(routeId)
  const color = crowdColor(est.level)
  return (
    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Bar track */}
      <div style={{ flex: 1, height: 4, background: '#1e2d45', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${est.score}%`, background: color, transition: 'width 0.3s ease' }} />
      </div>
      {/* Label */}
      <span style={{ fontSize: 10, color, fontWeight: 600, flexShrink: 0, minWidth: 56, textAlign: 'right' }}>
        {est.label}
      </span>
      <span style={{ fontSize: 10, color: '#475569', flexShrink: 0 }}>
        {est.description}
      </span>
    </div>
  )
}

function RouteRow({ info, originLat, originLon, destLat, destLon }: {
  info: RouteInfo
  originLat?: number
  originLon?: number
  destLat?: number
  destLon?: number
}) {
  const [expanded, setExpanded] = useState(false)

  const direction = (originLat != null && originLon != null && destLat != null && destLon != null)
    ? getDirection(info.route_id, originLat, originLon, destLat, destLon)
    : null

  return (
    <div style={{ background: '#0a0e1a', border: '1px solid #1e2d45', padding: '7px 10px', marginBottom: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RouteBadge routeId={info.route_id} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#cbd5e1' }}>{info.route_id} Train</span>
            {direction && (
              <span style={{ fontSize: 10, color: '#64748b' }}>
                {direction.direction} toward <span style={{ color: '#94a3b8', fontWeight: 600 }}>{direction.toward}</span>
              </span>
            )}
          </div>
        </div>
        <StatusDot status={info.status} />
        <span style={{ fontSize: 11, color: STATUS_COLOR[info.status] ?? '#94a3b8' }}>{info.status}</span>
        {info.alert && (
          <button type="button" onClick={() => setExpanded(e => !e)} style={{ fontSize: 10, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 4 }}>
            {expanded ? 'Hide' : 'Details'}
          </button>
        )}
      </div>
      <CrowdBar routeId={info.route_id} />
      {expanded && info.alert && (
        <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', lineHeight: 1.5, borderTop: '1px solid #1e2d45', paddingTop: 6 }}>
          {info.alert}
        </div>
      )}
    </div>
  )
}

interface StationSelectProps {
  label: string
  value: string
  onChange: (id: string) => void
  stations: { id: string; name: string; routes: string[] }[]
  search: string
  onSearch: (v: string) => void
  placeholder: string
}

function StationSelect({ label, value, onChange, stations, search, onSearch, placeholder }: StationSelectProps) {
  const [open, setOpen] = useState(false)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return stations.slice(0, 50)
    return stations.filter(s => s.name.toLowerCase().includes(q) || s.routes.some(r => r.toLowerCase() === q)).slice(0, 50)
  }, [stations, search])

  const selected = stations.find(s => s.id === value)

  return (
    <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: 4 }}>{label}</div>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ background: '#0a0e1a', border: '1px solid #1e2d45', padding: '7px 10px', cursor: 'pointer', fontSize: 12, color: selected ? '#e2e8f0' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.name : placeholder}
        </span>
        <span style={{ color: '#334155', marginLeft: 6, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#0f1623', border: '1px solid #1e2d45', borderTop: 'none', maxHeight: 220, overflowY: 'auto' }}>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search station or line..."
            style={{ width: '100%', boxSizing: 'border-box', background: '#0a0e1a', border: 'none', borderBottom: '1px solid #1e2d45', color: '#e2e8f0', fontSize: 12, padding: '7px 10px', outline: 'none' }}
          />
          {filtered.map(s => (
            <div
              key={s.id}
              onClick={() => { onChange(s.id); onSearch(''); setOpen(false) }}
              style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, color: s.id === value ? '#93c5fd' : '#cbd5e1', background: s.id === value ? '#1e3a5f' : 'transparent', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { if (s.id !== value) (e.currentTarget as HTMLDivElement).style.background = '#1e2d45' }}
              onMouseLeave={e => { if (s.id !== value) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              <span style={{ fontSize: 10, color: '#334155', flexShrink: 0 }}>{s.routes.slice(0, 4).join(' ')}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '10px', fontSize: 12, color: '#475569' }}>No stations found</div>
          )}
        </div>
      )}
    </div>
  )
}

export function TripPlanner({ onRoutesResolved }: { onRoutesResolved?: (routeIds: string[]) => void }) {
  const { stations, loading: stationsLoading } = useStations()
  const { fromId, setFromId, toId, setToId, result, loading, error, plan } = useTripPlanner(stations)
  const [fromSearch, setFromSearch] = useState('')
  const [toSearch, setToSearch] = useState('')

  // Auto-select filter routes whenever trip results arrive
  useEffect(() => {
    if (!result || !onRoutesResolved) return
    const ids = new Set<string>()
    result.direct.forEach(r => ids.add(r.route_id))
    result.transfers.forEach(t => { ids.add(t.line1); ids.add(t.line2) })
    onRoutesResolved([...ids])
  }, [result]) // eslint-disable-line react-hooks/exhaustive-deps

  const swap = () => {
    const tmp = fromId
    setFromId(toId)
    setToId(tmp)
  }

  return (
    <div style={{ background: '#0f1623', borderTop: '1px solid #1e2d45', padding: '12px 16px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginBottom: 10 }}>
        Trip Planner
      </div>

      {/* Origin / Destination row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 10 }}>
        <StationSelect
          label="From"
          value={fromId}
          onChange={setFromId}
          stations={stations}
          search={fromSearch}
          onSearch={setFromSearch}
          placeholder={stationsLoading ? 'Loading...' : 'Select origin'}
        />
        <button
          type="button"
          onClick={swap}
          title="Swap origin and destination"
          style={{ flexShrink: 0, background: '#1e2d45', border: '1px solid #334155', color: '#94a3b8', width: 30, height: 30, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0, alignSelf: 'flex-end' }}
        >
          ⇄
        </button>
        <StationSelect
          label="To"
          value={toId}
          onChange={setToId}
          stations={stations}
          search={toSearch}
          onSearch={setToSearch}
          placeholder={stationsLoading ? 'Loading...' : 'Select destination'}
        />
        <button
          type="button"
          onClick={() => void plan()}
          disabled={!fromId || !toId || loading}
          style={{ flexShrink: 0, background: fromId && toId ? '#1a56db' : '#1e2d45', border: 'none', color: fromId && toId ? '#fff' : '#475569', padding: '0 16px', height: 30, cursor: fromId && toId ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, alignSelf: 'flex-end' }}
        >
          {loading ? '...' : 'Plan'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#2d0a0a', border: '1px solid #7f1d1d', padding: '7px 10px', fontSize: 12, color: '#fca5a5', marginBottom: 8 }}>
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          <div style={{ fontSize: 11, color: '#475569', marginBottom: 8 }}>
            {result.origin.name} <span style={{ color: '#334155' }}>to</span> {result.destination.name}
          </div>

          {result.direct.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: 6 }}>
                Direct ({result.direct.length} line{result.direct.length !== 1 ? 's' : ''})
              </div>
              {result.direct.map(r => (
                <RouteRow
                  key={r.route_id}
                  info={r}
                  originLat={result.origin.lat}
                  originLon={result.origin.lon}
                  destLat={result.destination.lat}
                  destLon={result.destination.lon}
                />
              ))}
            </div>
          )}

          {result.transfers.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#334155', marginBottom: 6 }}>
                With Transfer
              </div>
              {result.transfers.map((t, i) => {
                // Leg 1: origin → transfer station
                const transferStation = stations.find(s => s.id === t.transfer_station_id)
                const dir1 = (result.origin.lat != null && result.origin.lon != null && transferStation)
                  ? getDirection(t.line1, result.origin.lat, result.origin.lon, transferStation.lat, transferStation.lon)
                  : null
                // Leg 2: transfer station → destination
                const dir2 = (transferStation && result.destination.lat != null && result.destination.lon != null)
                  ? getDirection(t.line2, transferStation.lat, transferStation.lon, result.destination.lat, result.destination.lon)
                  : null

                return (
                  <div key={i} style={{ background: '#0a0e1a', border: '1px solid #1e2d45', padding: '8px 10px', marginBottom: 4 }}>
                    {/* Leg 1 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <RouteBadge routeId={t.line1} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{t.line1} Train</span>
                        {dir1 && (
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                            {dir1.direction} toward <span style={{ color: '#94a3b8', fontWeight: 600 }}>{dir1.toward}</span>
                          </span>
                        )}
                      </div>
                      <StatusDot status={t.line1_info.status} />
                      <span style={{ fontSize: 10, color: STATUS_COLOR[t.line1_info.status] ?? '#94a3b8' }}>{t.line1_info.status}</span>
                    </div>
                    <CrowdBar routeId={t.line1} />

                    {/* Transfer indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '6px 0', paddingLeft: 4 }}>
                      <span style={{ fontSize: 10, color: '#334155' }}>↓ Transfer at</span>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{t.transfer_station}</span>
                    </div>

                    {/* Leg 2 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <RouteBadge routeId={t.line2} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600 }}>{t.line2} Train</span>
                        {dir2 && (
                          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 6 }}>
                            {dir2.direction} toward <span style={{ color: '#94a3b8', fontWeight: 600 }}>{dir2.toward}</span>
                          </span>
                        )}
                      </div>
                      <StatusDot status={t.line2_info.status} />
                      <span style={{ fontSize: 10, color: STATUS_COLOR[t.line2_info.status] ?? '#94a3b8' }}>{t.line2_info.status}</span>
                    </div>
                    <CrowdBar routeId={t.line2} />
                  </div>
                )
              })}
            </div>
          )}

          {result.direct.length === 0 && result.transfers.length === 0 && (
            <div style={{ fontSize: 12, color: '#475569' }}>
              No direct or single-transfer route found between these stations.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
