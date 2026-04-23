/**
 * Shapes returned by Flask `GET /api/favorites` and related endpoints.
 */
export type FavoriteItemType = "route" | "station"

/**
 * One saved favorite row (SQLite), as returned in `data` from the API.
 */
export interface FavoriteRecord {
  id: number
  item_type: FavoriteItemType
  item_id: string
  item_name: string
  alerts_enabled: boolean
  created_at: string
}
