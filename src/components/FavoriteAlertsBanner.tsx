import type { FavoriteStatusAlert } from "../hooks/useFavoriteStatusAlerts"

export interface FavoriteAlertsBannerProps {
  alerts: FavoriteStatusAlert[]
  onDismiss: (id: string) => void
}

export function FavoriteAlertsBanner({ alerts, onDismiss }: FavoriteAlertsBannerProps) {
  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="space-y-2" role="region" aria-label="Favorite route updates" aria-live="polite">
      {alerts.map((a) => (
        <div
          key={a.id}
          className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-sky-800/60 bg-sky-950/50 px-3 py-2 text-sm text-sky-100"
        >
          <p className="min-w-0 flex-1">
            <span className="font-semibold text-sky-200">Update</span> — {a.message}
          </p>
          <button
            type="button"
            onClick={() => onDismiss(a.id)}
            className="shrink-0 text-xs font-semibold text-sky-300 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
