import { useEffect, useState } from 'react'

export interface Station {
  id: string
  name: string
  routes: string[]
  lat: number
  lon: number
}

export interface RouteInfo {
  route_id: string
  status: string
  alert: string | null
}

export interface TransferOption {
  line1: string
  line2: string
  transfer_station: string
  transfer_station_id: string
  line1_info: RouteInfo
  line2_info: RouteInfo
}

export interface TripResult {
  origin: { id: string; name: string; lat?: number; lon?: number }
  destination: { id: string; name: string; lat?: number; lon?: number }
  direct: RouteInfo[]
  transfers: TransferOption[]
}

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv.replace(/\/$/, '')
  return 'http://localhost:5000'
}

export function useStations() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getBaseUrl()}/api/stations/list`)
      .then((r) => r.json())
      .then((j) => setStations(j.data ?? []))
      .catch(() => setStations([]))
      .finally(() => setLoading(false))
  }, [])

  return { stations, loading }
}

export function useTripPlanner(stations: Station[]) {
  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [result, setResult] = useState<TripResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const plan = async () => {
    if (!fromId || !toId) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resp = await fetch(`${getBaseUrl()}/api/trip?from=${fromId}&to=${toId}`)
      const json = await resp.json()
      if (!resp.ok) {
        setError(json.error ?? 'Trip planning failed')
      } else {
        // Enrich origin/destination with coordinates from the stations list
        const originStation = stations.find(s => s.id === fromId)
        const destStation = stations.find(s => s.id === toId)
        const enriched: TripResult = {
          ...json,
          origin: { ...json.origin, lat: originStation?.lat, lon: originStation?.lon },
          destination: { ...json.destination, lat: destStation?.lat, lon: destStation?.lon },
        }
        setResult(enriched)
      }
    } catch {
      setError('Could not reach the server')
    } finally {
      setLoading(false)
    }
  }

  return { fromId, setFromId, toId, setToId, result, loading, error, plan }
}
