// Demo clock helpers, ported from the prototype (lib/time.ts) and trimmed. All times are Europe/London.
// The mock data is pinned to the prototype's demo clock, Mon 26 Oct 2026 9am, so every build renders the same.

export const DEMO_NOW = "2026-10-26T09:00:00.000Z"
export const LAUNCH_DATE = "2026-09-01T00:00:00.000+01:00"
export const MS_MIN = 60_000
export const MS_HOUR = 3_600_000
export const MS_DAY = 86_400_000

function lastSundayUTC(year: number, month: number) {
  const d = new Date(Date.UTC(year, month + 1, 0))
  d.setUTCDate(d.getUTCDate() - d.getUTCDay())
  return d
}

/** Offset of Europe/London from UTC in minutes for a given UTC instant (0 or 60). */
function londonOffsetMin(utcMs: number) {
  const y = new Date(utcMs).getUTCFullYear()
  const start = lastSundayUTC(y, 2).getTime() + MS_HOUR
  const end = lastSundayUTC(y, 9).getTime() + MS_HOUR
  return utcMs >= start && utcMs < end ? 60 : 0
}

/** ISO instant from London wall-clock parts (month is 1-based). */
export function london(y: number, m: number, d: number, h = 0, min = 0): string {
  const guess = Date.UTC(y, m - 1, d, h, min)
  const off = londonOffsetMin(guess - 60 * MS_MIN)
  return new Date(guess - off * MS_MIN).toISOString()
}

export function parts(iso: string) {
  const t = new Date(iso).getTime()
  const local = new Date(t + londonOffsetMin(t) * MS_MIN)
  return { y: local.getUTCFullYear(), m: local.getUTCMonth() + 1, d: local.getUTCDate(), h: local.getUTCHours(), min: local.getUTCMinutes(), dow: local.getUTCDay() }
}

export const ms = (iso: string) => new Date(iso).getTime()
export const addMinutes = (iso: string, minutes: number) => new Date(ms(iso) + minutes * MS_MIN).toISOString()
export const addDays = (iso: string, days: number) => new Date(ms(iso) + days * MS_DAY).toISOString()

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** "Thu 30 Oct" */
export function fmtDate(iso: string) {
  const p = parts(iso)
  return `${DOW[p.dow]} ${p.d} ${MON[p.m - 1]}`
}
/** "1 Oct" */
export function fmtDayMonth(iso: string) {
  const p = parts(iso)
  return `${p.d} ${MON[p.m - 1]}`
}
/** "30 Oct 2026" */
export function fmtDateYear(iso: string) {
  const p = parts(iso)
  return `${p.d} ${MON[p.m - 1]} ${p.y}`
}
/** "08:00" → "8am", "14:30" → "2:30pm" */
export function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  const suffix = h >= 12 ? "pm" : "am"
  const hh = h % 12 === 0 ? 12 : h % 12
  return m ? `${hh}:${String(m).padStart(2, "0")}${suffix}` : `${hh}${suffix}`
}
