import { afterEach, describe, expect, it, vi } from "vitest"
import {
  fetchFavoritesList,
  fetchJsonWithAuth,
  parseFavoriteSingleResponse,
  parseFavoritesListResponse,
  UserApiError,
} from "./apiAuth"

afterEach(() => {
  vi.restoreAllMocks()
})

describe("parseFavoritesListResponse", () => {
  it("parses a valid list", () => {
    const result = parseFavoritesListResponse({
      data: [
        {
          id: 1,
          item_type: "route",
          item_id: "A",
          item_name: "Test",
          alerts_enabled: true,
          created_at: "2026-01-01T00:00:00",
        },
      ],
    })
    expect(result).toHaveLength(1)
    expect(result?.[0]?.item_id).toBe("A")
    expect(result?.[0]?.alerts_enabled).toBe(true)
  })

  it("rejects invalid rows", () => {
    expect(parseFavoritesListResponse({ data: [{}] })).toBeNull()
    expect(parseFavoritesListResponse({ routes: [] })).toBeNull()
  })
})

describe("parseFavoriteSingleResponse", () => {
  it("parses wrapped data", () => {
    const row = parseFavoriteSingleResponse({
      data: {
        id: 2,
        item_type: "route",
        item_id: "1",
        item_name: "1 Train",
        alerts_enabled: false,
        created_at: "2026-01-02T00:00:00",
      },
    })
    expect(row?.id).toBe(2)
    expect(row?.item_id).toBe("1")
  })
})

describe("fetchJsonWithAuth", () => {
  it("throws UserApiError reading backend error field", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: async () => '{"error":"Invalid or expired token"}',
      }),
    )

    await expect(fetchJsonWithAuth("/api/favorites", "tok")).rejects.toThrow(UserApiError)

    try {
      await fetchJsonWithAuth("/api/favorites", "tok")
    } catch (e) {
      expect(e).toBeInstanceOf(UserApiError)
      if (e instanceof UserApiError) {
        expect(e.status).toBe(401)
        expect(e.message).toBe("Invalid or expired token")
      }
    }
  })

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '{"data":[]}',
      }),
    )

    const body = await fetchJsonWithAuth("/api/favorites", "tok")
    expect(body).toEqual({ data: [] })
  })
})

describe("fetchFavoritesList", () => {
  it("returns records when response is valid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            data: [
              {
                id: 1,
                item_type: "route",
                item_id: "M1",
                item_name: "M1",
                alerts_enabled: false,
                created_at: "2026-01-01T00:00:00",
              },
            ],
          }),
      }),
    )

    const data = await fetchFavoritesList("tok")
    expect(data).toHaveLength(1)
    expect(data[0]?.item_id).toBe("M1")
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

    await expect(fetchFavoritesList("tok")).rejects.toThrow(UserApiError)
  })
})
