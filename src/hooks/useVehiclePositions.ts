import { useCallback, useEffect, useState } from 'react'
import { fetchVehiclePositions } from '../lib/api'
import type { VehiclePosition } from '../types/transit'

const POLL_MS = 60_000

export function useVehiclePositions() {
  const [data, setData] = useState<VehiclePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const rows = await fetchVehiclePositions()
      setData(rows)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load vehicles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  return { data, loading, error, lastUpdated, refetch: load }
}
