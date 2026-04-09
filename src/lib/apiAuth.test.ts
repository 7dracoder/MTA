import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fetchFavorites,
  fetchJsonWithAuth,
  parseAlertPreferencesPayload,
  parseFavoritesPayload,
  UserApiError,
} from "./apiAuth"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("parseFavoritesPayload", () => {
  it("accepts a valid route_ids array", () => {
    const result = parseFavoritesPayload({ route_ids: ["A", "B"] })
    expect(result).toEqual({ route_ids: ["A", "B"] })
  })

  it("rejects non-objects", () => {
    expect(parseFavoritesPayload(null)).toBeNull()
    expect(parseFavoritesPayload("x")).toBeNull()
    expect(parseFavoritesPayload([1, 2])).toBeNull()
  })

  it("rejects missing or invalid route_ids", () => {
    expect(parseFavoritesPayload({})).toBeNull()
    expect(parseFavoritesPayload({ route_ids: "A" })).toBeNull()
    expect(parseFavoritesPayload({ route_ids: [1, "B"] })).toBeNull()
  })
})

describe("parseAlertPreferencesPayload", () => {
  it("accepts valid booleans", () => {
    const result = parseAlertPreferencesPayload({
      notify_minor: true,
      notify_major: false,
    })
    expect(result).toEqual({ notify_minor: true, notify_major: false })
  })

  it("rejects non-boolean fields", () => {
    expect(
      parseAlertPreferencesPayload({ notify_minor: "yes", notify_major: false }),
    ).toBeNull()
    expect(parseAlertPreferencesPayload({ notify_minor: true })).toBeNull()
  })
})

describe("fetchJsonWithAuth", () => {
  it("throws UserApiError with status and message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => '{"message":"bad token"}',
      }),
    )

    await expect(fetchJsonWithAuth("/api/me/favorites", "tok")).rejects.toThrow(UserApiError)

    try {
      await fetchJsonWithAuth("/api/me/favorites", "tok")
    } catch (e) {
      expect(e).toBeInstanceOf(UserApiError)
      if (e instanceof UserApiError) {
        expect(e.status).toBe(401)
        expect(e.message).toContain("bad token")
      }
    }
  })

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{"route_ids":["1"]}',
      }),
    )

    const body = await fetchJsonWithAuth("/api/me/favorites", "tok")
    expect(body).toEqual({ route_ids: ["1"] })
  })
})

describe("fetchFavorites", () => {
  it("returns favorites when response is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{"route_ids":["M1","M2"]}',
      }),
    )

    const data = await fetchFavorites("tok")
    expect(data.route_ids).toEqual(["M1", "M2"])
  })

  it("throws UserApiError when body shape is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{"routes":[]}',
      }),
    )

    await expect(fetchFavorites("tok")).rejects.toThrow(UserApiError)
  })
})
