/**
 * Authenticated REST calls to Flask user endpoints using a Firebase ID token.
 * Matches merged backend: `/api/favorites` (not `/api/me/...`).
 */
import type { FavoriteItemType, FavoriteRecord } from "../types/userPreferences"

function getBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv.replace(/\/$/, "")
  }
  return "http://localhost:5000"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Parses JSON from a Response, or returns null if the body is empty. */
async function readJsonBody(res: Response): Promise<unknown | null> {
  const text = await res.text()
  const trimmed = text.trim()
  if (trimmed.length === 0) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return parsed
  } catch {
    return null
  }
}

function parseFavoriteRecord(raw: unknown): FavoriteRecord | null {
  if (!isRecord(raw)) {
    return null
  }
  const id = raw.id
  const item_type = raw.item_type
  const item_id = raw.item_id
  const item_name = raw.item_name
  const alerts_enabled = raw.alerts_enabled
  const created_at = raw.created_at
  if (typeof id !== "number" || !Number.isInteger(id)) {
    return null
  }
  if (item_type !== "route" && item_type !== "station") {
    return null
  }
  if (typeof item_id !== "string" || typeof item_name !== "string") {
    return null
  }
  if (typeof alerts_enabled !== "boolean") {
    return null
  }
  if (typeof created_at !== "string") {
    return null
  }
  return {
    id,
    item_type,
    item_id,
    item_name,
    alerts_enabled,
    created_at,
  }
}

/**
 * Parses `GET /api/favorites` body: `{ "data": FavoriteRecord[] }`.
 */
export function parseFavoritesListResponse(json: unknown): FavoriteRecord[] | null {
  if (!isRecord(json)) {
    return null
  }
  const data = json.data
  if (!Array.isArray(data)) {
    return null
  }
  const out: FavoriteRecord[] = []
  for (const row of data) {
    const rec = parseFavoriteRecord(row)
    if (rec === null) {
      return null
    }
    out.push(rec)
  }
  return out
}

/**
 * Parses a single-favorite response: `{ "data": FavoriteRecord }` (e.g. POST 201).
 */
export function parseFavoriteSingleResponse(json: unknown): FavoriteRecord | null {
  if (!isRecord(json)) {
    return null
  }
  const data = json.data
  return parseFavoriteRecord(data)
}

export class UserApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "UserApiError"
    this.status = status
  }
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body !== null && isRecord(body)) {
    if (typeof body.message === "string" && body.message.length > 0) {
      return body.message
    }
    if (typeof body.error === "string" && body.error.length > 0) {
      return body.error
    }
  }
  if (typeof body === "string" && body.length > 0) {
    return body
  }
  return fallback
}

/**
 * Performs fetch with Bearer token and returns parsed JSON on success (may be null for empty 200).
 * @throws UserApiError on non-OK HTTP status.
 */
export async function fetchJsonWithAuth(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<unknown | null> {
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${idToken}`,
      ...init?.headers,
    },
  })

  const body = await readJsonBody(res)

  if (!res.ok) {
    const detail = errorMessageFromBody(
      body,
      `HTTP ${res.status} ${res.statusText}`,
    )
    throw new UserApiError(res.status, detail)
  }

  return body
}

/**
 * Loads all favorites for the signed-in user.
 */
export async function fetchFavoritesList(idToken: string): Promise<FavoriteRecord[]> {
  const json = await fetchJsonWithAuth("/api/favorites", idToken, { method: "GET" })
  const parsed = parseFavoritesListResponse(json)
  if (parsed === null) {
    throw new UserApiError(502, "Invalid favorites list response from server.")
  }
  return parsed
}

export interface PostFavoriteBody {
  item_type: FavoriteItemType
  item_id: string
  item_name: string
}

/**
 * Adds a favorite. Returns the created row (201).
 */
export async function postFavorite(idToken: string, body: PostFavoriteBody): Promise<FavoriteRecord> {
  const json = await fetchJsonWithAuth("/api/favorites", idToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      item_type: body.item_type,
      item_id: body.item_id,
      item_name: body.item_name,
    }),
  })
  const parsed = parseFavoriteSingleResponse(json)
  if (parsed === null) {
    throw new UserApiError(502, "Invalid create-favorite response from server.")
  }
  return parsed
}

/**
 * Removes a favorite by its database id.
 */
export async function deleteFavorite(idToken: string, favoriteId: number): Promise<void> {
  await fetchJsonWithAuth(`/api/favorites/${favoriteId}`, idToken, { method: "DELETE" })
}

/**
 * Enables or disables in-app alerts for one favorite row.
 */
export async function patchFavoriteAlerts(
  idToken: string,
  favoriteId: number,
  alerts_enabled: boolean,
): Promise<FavoriteRecord> {
  const json = await fetchJsonWithAuth(`/api/favorites/${favoriteId}/alerts`, idToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alerts_enabled }),
  })
  const parsed = parseFavoriteSingleResponse(json)
  if (parsed === null) {
    throw new UserApiError(502, "Invalid patch-alerts response from server.")
  }
  return parsed
}
