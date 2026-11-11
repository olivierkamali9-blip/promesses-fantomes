const MINUTE_MS = 60 * 1_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export function formatCountdown(deadline: Date, now: Date): string {
  const remaining = deadline.getTime() - now.getTime()

  if (remaining <= 0) {
    return 'Échéance atteinte'
  }

  if (remaining < HOUR_MS) {
    return `${Math.ceil(remaining / MINUTE_MS)} min`
  }

  if (remaining < 2 * DAY_MS) {
    return `${Math.ceil(remaining / HOUR_MS)} h`
  }

  return `${Math.ceil(remaining / DAY_MS)} j`
}
