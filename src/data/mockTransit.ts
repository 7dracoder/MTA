import type { RouteStatus, VehiclePosition } from '../types/transit'

/** Practice data — GTFS-style route_id strings (subway + one bus). */
export const MOCK_ROUTE_STATUSES: RouteStatus[] = [
  {
    route_id: '1',
    route_short_name: '1',
    route_long_name: 'Broadway–7 Avenue',
    mode: 'subway',
    summary: 'Good service',
    severity: 'good',
  },
  {
    route_id: '2',
    route_short_name: '2',
    route_long_name: '7 Avenue Express',
    mode: 'subway',
    summary: 'Delays due to earlier congestion',
    severity: 'minor',
    is_delayed: true,
  },
  {
    route_id: '3',
    route_short_name: '3',
    route_long_name: '7 Avenue Express',
    mode: 'subway',
    summary: 'Good service',
    severity: 'good',
  },
  {
    route_id: 'C',
    route_short_name: 'C',
    route_long_name: '8 Avenue Local',
    mode: 'subway',
    summary: 'Planned work — expect longer waits overnight',
    severity: 'minor',
  },
  {
    route_id: 'F',
    route_short_name: 'F',
    route_long_name: 'Queens Blvd Express / 6 Av Local',
    mode: 'subway',
    summary: 'Service suspended between stations — take alternate routes',
    severity: 'major',
  },
  {
    route_id: 'MTA NYCT_B46',
    route_short_name: 'B46',
    route_long_name: 'Utica Avenue',
    mode: 'bus',
    summary: 'Good service',
    severity: 'good',
  },
]

/** Rough NYC area — good for checking the map and filters. */
export const MOCK_VEHICLES: VehiclePosition[] = [
  { route_id: '1', lat: 40.758, lon: -73.9855, vehicle_id: 'mock-1-1', bearing: 90 },
  { route_id: '1', lat: 40.749, lon: -73.991, vehicle_id: 'mock-1-2', bearing: 180 },
  { route_id: '2', lat: 40.7328, lon: -73.9903, vehicle_id: 'mock-2-1', bearing: 45 },
  { route_id: '3', lat: 40.7614, lon: -73.9776, vehicle_id: 'mock-3-1', bearing: 270 },
  { route_id: 'C', lat: 40.8057, lon: -73.9522, vehicle_id: 'mock-C-1', bearing: 0 },
  { route_id: 'F', lat: 40.7223, lon: -73.9871, vehicle_id: 'mock-F-1', bearing: 120 },
  {
    route_id: 'MTA NYCT_B46',
    lat: 40.6782,
    lon: -73.9442,
    vehicle_id: 'mock-B46-1',
    bearing: 200,
  },
]
