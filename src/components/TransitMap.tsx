import L from 'leaflet'
import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { fixLeafletDefaultIcons } from '../lib/fixLeafletIcons'
import type { VehiclePosition } from '../types/transit'

const NYC_CENTER: [number, number] = [40.7128, -74.006]
const DEFAULT_ZOOM = 11

let iconsFixed = false

function ensureIconsFixed() {
  if (!iconsFixed) {
    fixLeafletDefaultIcons()
    iconsFixed = true
  }
}

function MapFitBounds({ vehicles }: { vehicles: VehiclePosition[] }) {
  const map = useMap()
  useEffect(() => {
    if (vehicles.length === 0) {
      map.setView(NYC_CENTER, DEFAULT_ZOOM)
      return
    }
    const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lon]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, vehicles])
  return null
}

interface TransitMapProps {
  vehicles: VehiclePosition[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export function TransitMap({ vehicles, loading, error, onRetry }: TransitMapProps) {
  useEffect(() => {
    ensureIconsFixed()
  }, [])

  return (
    <section
      className="flex h-full min-h-[320px] flex-col rounded-xl border border-slate-700/80 bg-slate-900/60 shadow-lg backdrop-blur-sm lg:min-h-0"
      aria-label="Live vehicle map"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 px-4 py-3">
        <h2 className="text-base font-semibold text-slate-100">Live vehicles</h2>
        <span className="text-xs text-slate-500">
          {loading ? 'Updating…' : `${vehicles.length} on map`}
        </span>
      </div>
      {error ? (
        <div
          className="mx-4 mt-3 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-sm text-rose-100"
          role="alert"
        >
          <p className="font-medium">Could not load vehicles</p>
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
      <div className="relative min-h-[280px] flex-1 p-3">
        {loading && vehicles.length === 0 ? (
          <div
            className="absolute inset-3 z-[400] flex items-center justify-center rounded-xl bg-slate-950/70 text-sm text-slate-400"
            aria-busy="true"
          >
            Loading map…
          </div>
        ) : null}
        <MapContainer
          center={NYC_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full min-h-[260px] w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapFitBounds vehicles={vehicles} />
          {vehicles.map((v) => (
            <Marker key={v.vehicle_id ?? `${v.route_id}-${v.lat}-${v.lon}`} position={[v.lat, v.lon]}>
              <Popup>
                <span className="font-semibold">Route {v.route_id}</span>
                {v.vehicle_id ? (
                  <div className="text-xs text-slate-600">Vehicle {v.vehicle_id}</div>
                ) : null}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  )
}
