/**
 * TransitMap — high-performance map using native Leaflet layer management.
 *
 * Why not React-Leaflet <Marker> for each vehicle:
 *   600+ React components re-rendering every 60s is slow. Instead we manage
 *   a single Leaflet LayerGroup imperatively via useEffect, bypassing React
 *   reconciliation entirely for the marker layer. Only the MapContainer shell
 *   is rendered by React.
 */
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import { getRouteIcon } from '../lib/transitIcons'
import type { VehiclePosition } from '../types/transit'

const NYC_CENTER: [number, number] = [40.7128, -74.006]
const DEFAULT_ZOOM = 11

interface TransitMapProps {
  vehicles: VehiclePosition[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function TransitMap({ vehicles, loading, error, onRetry }: TransitMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)
  const fittedRef = useRef(false)

  // Force Leaflet to redraw when the wrapper resizes
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setTimeout(() => mapRef.current?.invalidateSize(), 0)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Update markers imperatively — no React reconciliation
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Create layer group once
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map)
    }
    const layer = layerRef.current
    layer.clearLayers()

    if (vehicles.length === 0) return

    // Fit bounds only on first load
    if (!fittedRef.current) {
      const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lon]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      fittedRef.current = true
    }

    // Add all markers natively — no React overhead
    for (const v of vehicles) {
      const marker = L.marker([v.lat, v.lon], { icon: getRouteIcon(v.route_id) })
      marker.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:130px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${v.route_id} Train</div>
          ${v.vehicle_id ? `<div style="font-size:12px;color:#555">Vehicle ${v.vehicle_id}</div>` : ''}
          <div style="font-size:11px;color:#888;margin-top:4px">${v.lat.toFixed(5)}, ${v.lon.toFixed(5)}</div>
        </div>`,
        { maxWidth: 200 }
      )
      layer.addLayer(marker)
    }
  }, [vehicles])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0f1623', overflow: 'hidden' }}>

      {/* Panel header */}
      <div style={{ height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderBottom: '1px solid #1e2d45' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b' }}>
          Live Vehicles
        </span>
        <span style={{ fontSize: 11, color: '#334155' }}>
          {loading ? 'Updating' : `${vehicles.length} active`}
        </span>
      </div>

      {error && (
        <div style={{ flexShrink: 0, background: '#2d0a0a', borderBottom: '1px solid #7f1d1d', padding: '8px 16px', fontSize: 12, color: '#fca5a5' }}>
          Could not load vehicles. {error}
          <button type="button" onClick={onRetry} style={{ marginLeft: 8, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>Retry</button>
        </div>
      )}

      {/* Map wrapper — flex:1, ResizeObserver measures real px height */}
      <div ref={wrapRef} style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
        {loading && vehicles.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,14,26,0.8)', fontSize: 13, color: '#64748b' }}>
            Loading map
          </div>
        )}

        <MapContainer
          center={NYC_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}
          scrollWheelZoom
          ref={(m) => {
            if (m && !mapRef.current) {
              mapRef.current = m
              setTimeout(() => m.invalidateSize(), 150)
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* No React markers here — managed imperatively in useEffect above */}
        </MapContainer>
      </div>
    </div>
  )
}
