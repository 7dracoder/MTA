import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { RouteStatus } from "../types/transit"
import { useFavoriteStatusAlerts } from "./useFavoriteStatusAlerts"

function status(routeId: string, summary: string, severity: RouteStatus["severity"]): RouteStatus {
  return {
    route_id: routeId,
    mode: "subway",
    summary,
    severity,
  }
}

describe("useFavoriteStatusAlerts", () => {
  it("does not fire before seeding completes", () => {
    const statuses: RouteStatus[] = [status("A", "Good", "good")]
    const { result } = renderHook(() =>
      useFavoriteStatusAlerts(statuses, ["A"], new Map([["A", true]])),
    )
    expect(result.current.alerts).toHaveLength(0)
  })

  it("adds an alert when a favorited route with alerts enabled changes summary", () => {
    const map = new Map<string, boolean>([["A", true]])
    const { result, rerender } = renderHook(
      ({ rows }: { rows: RouteStatus[] }) => useFavoriteStatusAlerts(rows, ["A"], map),
      { initialProps: { rows: [status("A", "Old", "good")] } },
    )
    expect(result.current.alerts).toHaveLength(0)

    act(() => {
      rerender({ rows: [status("A", "New", "good")] })
    })

    expect(result.current.alerts.length).toBeGreaterThanOrEqual(1)
    expect(result.current.alerts[0]?.message).toContain("New")
  })
})
