/** GTFS route_id — always string (e.g. "1", "A", "B44"). */
export type RouteId = string

export type TransitMode = 'subway' | 'bus' | 'rail' | 'unknown'

export type ServiceSeverity = 'good' | 'minor' | 'major' | 'unknown'

export interface RouteStatus {
  route_id: RouteId
  route_short_name?: string
  route_long_name?: string
  mode: TransitMode
  summary: string
  severity: ServiceSeverity
  is_delayed?: boolean
  /** ISO timestamp from backend if provided */
  updated_at?: string
}

export interface VehiclePosition {
  route_id: RouteId
  lat: number
  lon: number
  bearing?: number
  vehicle_id?: string
  /** Unix seconds or ms — normalized in client if needed */
  timestamp?: number
}
