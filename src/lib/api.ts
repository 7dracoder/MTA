import { MOCK_ROUTE_STATUSES, MOCK_VEHICLES } from '../data/mockTransit'
import type { RouteStatus, TransitMode, VehiclePosition } from '../types/transit'

function useMockData(): boolean {
  return import.meta.env.VITE_USE_MOCK_DATA === 'true'
}

function mockDelay<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, '')
  }
  return 'http://localhost:5000'
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

function inferMode(raw: Record<string, unknown>): TransitMode {
  const m = raw.mode ?? raw.route_type ?? raw.type
  if (m === 'subway' || m === 'bus' || m === 'rail') return m
  if (typeof m === 'number') {
    if (m === 0 || m === 1) return 'subway'
    if (m === 3) return 'bus'
    if (m === 2) return 'rail'
  }
  if (typeof m === 'string') {
    const s = m.toLowerCase()
    if (s.includes('bus')) return 'bus'
    if (s.includes('subway') || s.includes('metro')) return 'subway'
  }
  return 'unknown'
}

function inferSeverity(raw: Record<string, unknown>): RouteStatus['severity'] {
  const s = raw.severity ?? raw.status ?? raw.level
  if (s === 'good' || s === 'minor' || s === 'major') return s
  if (typeof s === 'string') {
    const low = s.toLowerCase()
    if (low.includes('delay') || low.includes('slow')) return 'minor'
    if (low.includes('susp') || low.includes('severe') || low.includes('critical'))
      return 'major'
    if (low.includes('good') || low.includes('on time') || low.includes('normal'))
      return 'good'
  }
  return 'unknown'
}

function pickString(...vals: unknown[]): string | undefined {
  for (const v of vals) {
    if (typeof v === 'string' && v.length > 0) return v
  }
  return undefined
}

function toRouteStatus(raw: Record<string, unknown>): RouteStatus | null {
  const route_id = pickString(raw.route_id, raw.routeId, raw.id)
  if (!route_id) return null
  const summary =
    pickString(
      raw.summary,
      raw.status_text,
      raw.message,
      raw.description,
      raw.name,
    ) ?? 'No status'
  return {
    route_id,
    route_short_name: pickString(raw.route_short_name, raw.short_name),
    route_long_name: pickString(raw.route_long_name, raw.long_name, raw.route_name),
    mode: inferMode(raw),
    summary,
    severity: inferSeverity(raw),
    is_delayed: typeof raw.is_delayed === 'boolean' ? raw.is_delayed : undefined,
    updated_at: pickString(raw.updated_at, raw.updatedAt, raw.last_updated),
  }
}

function extractArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const keys = ['routes', 'statuses', 'data', 'items', 'results'] as const
    for (const k of keys) {
      const v = o[k]
      if (Array.isArray(v)) return v
    }
  }
  return []
}

export async function fetchServiceStatus(): Promise<RouteStatus[]> {
  if (useMockData()) {
    return mockDelay([...MOCK_ROUTE_STATUSES])
  }
  const json = await fetchJson<unknown>('/api/status')
  return extractArray(json)
    .map((item) => (item && typeof item === 'object' ? toRouteStatus(item as Record<string, unknown>) : null))
    .filter((x): x is RouteStatus => x !== null)
}

export async function fetchServiceStatusByRoute(routeId: string): Promise<RouteStatus | null> {
  if (useMockData()) {
    const row = MOCK_ROUTE_STATUSES.find((r) => r.route_id === routeId) ?? null
    return mockDelay(row)
  }
  const enc = encodeURIComponent(routeId)
  const json = await fetchJson<unknown>(`/api/status/${enc}`)
  if (json && typeof json === 'object' && !Array.isArray(json)) {
    return toRouteStatus(json as Record<string, unknown>)
  }
  const arr = extractArray(json)
  if (arr[0] && typeof arr[0] === 'object') {
    return toRouteStatus(arr[0] as Record<string, unknown>)
  }
  return null
}

function toVehicle(raw: Record<string, unknown>): VehiclePosition | null {
  const route_id = pickString(raw.route_id, raw.routeId)
  const lat = typeof raw.lat === 'number' ? raw.lat : Number(raw.latitude)
  const lon = typeof raw.lon === 'number' ? raw.lon : Number(raw.longitude ?? raw.lng)
  if (!route_id || !Number.isFinite(lat) || !Number.isFinite(lon)) return null
  const bearing = typeof raw.bearing === 'number' ? raw.bearing : undefined
  const vehicle_id = pickString(raw.vehicle_id, raw.vehicleId, raw.id)
  let timestamp: number | undefined
  if (typeof raw.timestamp === 'number') timestamp = raw.timestamp
  else if (typeof raw.time === 'number') timestamp = raw.time
  return {
    route_id,
    lat,
    lon,
    bearing,
    vehicle_id,
    timestamp,
  }
}

export async function fetchVehiclePositions(): Promise<VehiclePosition[]> {
  if (useMockData()) {
    return mockDelay([...MOCK_VEHICLES])
  }
  const json = await fetchJson<unknown>('/api/vehicles')
  return extractArray(json)
    .map((item) => (item && typeof item === 'object' ? toVehicle(item as Record<string, unknown>) : null))
    .filter((x): x is VehiclePosition => x !== null)
}
