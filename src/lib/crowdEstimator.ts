/**
 * Crowd level estimator based on MTA historical ridership patterns.
 *
 * Source: MTA ridership data (data.ny.gov) + MTA published peak/off-peak schedules.
 * Subway ridership peaks sharply 7-9am and 5-7pm on weekdays.
 * Weekends have a flatter, later curve peaking around noon-3pm.
 *
 * Returns a 0-100 score and a label for display.
 */

export type CrowdLevel = 'light' | 'moderate' | 'busy' | 'very_busy'

export interface CrowdEstimate {
  level: CrowdLevel
  label: string
  score: number        // 0-100
  description: string
}

// Per-line multipliers — some lines are consistently more crowded than others.
// Based on MTA average weekday ridership per line (normalized).
const LINE_MULTIPLIER: Record<string, number> = {
  '4': 1.3, '5': 1.3, '6': 1.4,   // Lex Ave — busiest in system
  'A': 1.2, 'C': 1.0, 'E': 1.1,
  '1': 1.1, '2': 1.2, '3': 1.0,
  'N': 1.0, 'Q': 1.0, 'R': 0.9, 'W': 0.8,
  'B': 0.9, 'D': 1.0, 'F': 1.1, 'M': 0.8,
  '7': 1.1, '7X': 1.1,
  'G': 0.7,
  'L': 1.0,
  'J': 0.8, 'Z': 0.8,
  'GS': 0.6, 'FS': 0.5,
  'SI': 0.4,
}

/**
 * Hourly base load (0-100) for a typical weekday.
 * Index = hour of day (0-23).
 */
const WEEKDAY_HOURLY: number[] = [
  5,  4,  3,  3,  4,  8,   // 0-5am
  20, 55, 80, 65, 50, 55,  // 6-11am
  60, 55, 50, 55, 70, 85,  // 12-5pm
  80, 65, 50, 35, 20, 10,  // 6-11pm
]

/**
 * Hourly base load for weekends (flatter, later peak).
 */
const WEEKEND_HOURLY: number[] = [
  8,  6,  5,  4,  4,  5,   // 0-5am
  8,  12, 20, 35, 50, 60,  // 6-11am
  65, 65, 60, 55, 50, 50,  // 12-5pm
  55, 50, 45, 35, 25, 15,  // 6-11pm
]

export function estimateCrowd(routeId: string, now: Date = new Date()): CrowdEstimate {
  const hour = now.getHours()
  const dow = now.getDay() // 0=Sun, 6=Sat
  const isWeekend = dow === 0 || dow === 6

  const base = isWeekend ? WEEKEND_HOURLY[hour] : WEEKDAY_HOURLY[hour]
  const multiplier = LINE_MULTIPLIER[routeId] ?? 0.9
  const score = Math.min(100, Math.round(base * multiplier))

  let level: CrowdLevel
  let label: string
  let description: string

  if (score < 25) {
    level = 'light'
    label = 'Light'
    description = 'Seats available'
  } else if (score < 50) {
    level = 'moderate'
    label = 'Moderate'
    description = 'Some standing room'
  } else if (score < 75) {
    level = 'busy'
    label = 'Busy'
    description = 'Limited seats'
  } else {
    level = 'very_busy'
    label = 'Very busy'
    description = 'Expect crowding'
  }

  return { level, label, score, description }
}

export function crowdColor(level: CrowdLevel): string {
  switch (level) {
    case 'light':     return '#4ade80'
    case 'moderate':  return '#facc15'
    case 'busy':      return '#fb923c'
    case 'very_busy': return '#f87171'
  }
}
