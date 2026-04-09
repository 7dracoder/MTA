import type { AlertPreferencesPayload, FavoritesPayload } from "../types/userPreferences"

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

/**
 * Parses a favorites response body into `{ route_ids }` or returns null if invalid.
 */
export function parseFavoritesPayload(json: unknown): FavoritesPayload | null {
  if (!isRecord(json)) {
    return null
  }
  const ids = json.route_ids
  if (!Array.isArray(ids)) {
    return null
  }
  const route_ids: string[] = []
  for (const item of ids) {
    if (typeof item !== "string") {
      return null
    }
    route_ids.push(item)
  }
  return { route_ids }
}

/**
 * Parses alert preferences JSON into booleans or returns null if invalid.
 */
export function parseAlertPreferencesPayload(json: unknown): AlertPreferencesPayload | null {
  if (!isRecord(json)) {
    return null
  }
  const minor = json.notify_minor
  const major = json.notify_major
  if (typeof minor !== "boolean" || typeof major !== "boolean") {
    return null
  }
  return { notify_minor: minor, notify_major: major }
}

export class UserApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "UserApiError"
    this.status = status
  }
}

/**
 * Performs fetch with Bearer token and returns parsed JSON on success.
 * @throws UserApiError on non-OK HTTP status.
 */
export async function fetchJsonWithAuth(
  path: string,
  idToken: string,
  init?: RequestInit,
): Promise<unknown> {
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
    const detail =
      body !== null && isRecord(body) && typeof body.message === "string"
        ? body.message
        : typeof body === "string"
          ? body
          : `HTTP ${res.status} ${res.statusText}`
    throw new UserApiError(res.status, detail)
  }

  return body
}

/**
 * Loads the current user's favorite GTFS route IDs from the backend.
 */
export async function fetchFavorites(idToken: string): Promise<FavoritesPayload> {
  const json = await fetchJsonWithAuth("/api/me/favorites", idToken, { method: "GET" })
  const parsed = parseFavoritesPayload(json)
  if (parsed === null) {
    throw new UserApiError(502, "Invalid favorites response from server.")
  }
  return parsed
}

/**
 * Replaces the user's favorite route list on the server.
 */
export async function putFavorites(idToken: string, payload: FavoritesPayload): Promise<void> {
  const body = JSON.stringify({ route_ids: payload.route_ids })
  await fetchJsonWithAuth("/api/me/favorites", idToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  })
}

/**
 * Loads alert preference toggles for the signed-in user.
 */
export async function fetchAlertPreferences(idToken: string): Promise<AlertPreferencesPayload> {
  const json = await fetchJsonWithAuth("/api/me/alert-preferences", idToken, { method: "GET" })
  const parsed = parseAlertPreferencesPayload(json)
  if (parsed === null) {
    throw new UserApiError(502, "Invalid alert-preferences response from server.")
  }
  return parsed
}

/**
 * Saves alert preference toggles for the signed-in user.
 */
export async function putAlertPreferences(
  idToken: string,
  payload: AlertPreferencesPayload,
): Promise<void> {
  const body = JSON.stringify({
    notify_minor: payload.notify_minor,
    notify_major: payload.notify_major,
  })
  await fetchJsonWithAuth("/api/me/alert-preferences", idToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
  })
}
