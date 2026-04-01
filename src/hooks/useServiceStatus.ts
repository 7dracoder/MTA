import { useCallback, useEffect, useState } from 'react'
import { fetchServiceStatus } from '../lib/api'
import type { RouteStatus } from '../types/transit'

const POLL_MS = 60_000

export function useServiceStatus() {
  const [data, setData] = useState<RouteStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const rows = await fetchServiceStatus()
      setData(rows)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load status')
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
