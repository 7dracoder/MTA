import type { AlertPreferencesPayload } from "../types/userPreferences"

export interface AlertPreferencesPanelProps {
  preferences: AlertPreferencesPayload
  loading: boolean
  error: string | null
  onClearError: () => void
  onChangeMinor: (value: boolean) => void
  onChangeMajor: (value: boolean) => void
}

export function AlertPreferencesPanel({
  preferences,
  loading,
  error,
  onClearError,
  onChangeMinor,
  onChangeMajor,
}: AlertPreferencesPanelProps) {
  return (
    <section
      className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm"
      aria-label="Alert preferences for favorite routes"
    >
      <h2 className="mb-2 text-sm font-semibold tracking-wide text-slate-300">
        Favorite route alerts
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        When service status changes for a route you starred, show a banner here (no push notifications).
      </p>
      {loading ? (
        <p className="text-xs text-slate-500" aria-busy="true">
          Loading preferences…
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500"
              checked={preferences.notify_minor}
              onChange={(e) => {
                onClearError()
                void onChangeMinor(e.target.checked)
              }}
            />
            Notify on minor issues
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-sky-500 focus:ring-sky-500"
              checked={preferences.notify_major}
              onChange={(e) => {
                onClearError()
                void onChangeMajor(e.target.checked)
              }}
            />
            Notify on major disruptions
          </label>
        </div>
      )}
      {error !== null ? (
        <p className="mt-3 text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  )
}
