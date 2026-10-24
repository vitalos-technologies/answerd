// Demo clock helpers. All times are Europe/London.
// The spec says "Mon 27 Oct 2026", but 27 Oct 2026 is a Tuesday. The demo keeps the spec's weekdays
// (Mon start, Tayo's Thursday booking) on the real 2026 calendar: Mon 26 Oct and Thu 29 Oct.

export const DEMO_START = "2026-10-26T09:00:00.000Z" // GMT: BST ends on Sun 25 Oct 2026
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
export function londonOffsetMin(utcMs: number) {
  const y = new Date(utcMs).getUTCFullYear()
  const start = lastSundayUTC(y, 2).getTime() + MS_HOUR // 01:00 UTC last Sun March
  const end = lastSundayUTC(y, 9).getTime() + MS_HOUR // 01:00 UTC last Sun October
  return utcMs >= start && utcMs < end ? 60 : 0
}

/** Build an ISO instant from London wall-clock parts (month is 1-based). */
export function london(y: number, m: number, d: number, h = 0, min = 0): string {
  const guess = Date.UTC(y, m - 1, d, h, min)
  const off = londonOffsetMin(guess - 60 * MS_MIN)
  return new Date(guess - off * MS_MIN).toISOString()
}

/** London wall-clock parts of an instant. */
export function parts(iso: string | number | Date) {
  const ms = typeof iso === "number" ? iso : new Date(iso).getTime()
  const local = new Date(ms + londonOffsetMin(ms) * MS_MIN)
  return {
    y: local.getUTCFullYear(),
    m: local.getUTCMonth() + 1,
    d: local.getUTCDate(),
    h: local.getUTCHours(),
    min: local.getUTCMinutes(),
    dow: local.getUTCDay(),
  }
}

export function ms(iso: string) {
  return new Date(iso).getTime()
}

export function addMinutes(iso: string, minutes: number) {
  return new Date(ms(iso) + minutes * MS_MIN).toISOString()
}
export function addHours(iso: string, hours: number) {
  return new Date(ms(iso) + hours * MS_HOUR).toISOString()
}
export function addDays(iso: string, days: number) {
  return new Date(ms(iso) + days * MS_DAY).toISOString()
}

/** yyyy-mm-dd of the London date. */
export function dayKey(iso: string) {
  const p = parts(iso)
  return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`
}

/** London midnight of the day containing iso. */
export function startOfDay(iso: string) {
  const p = parts(iso)
  return london(p.y, p.m, p.d)
}

export function sameDay(a: string, b: string) {
  return dayKey(a) === dayKey(b)
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DOW_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MON_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

/** "Thu 30 Oct" */
export function fmtDate(iso: string) {
  const p = parts(iso)
  return `${DOW[p.dow]} ${p.d} ${MON[p.m - 1]}`
}
/** "Thursday 30 October" */
export function fmtDateLong(iso: string) {
  const p = parts(iso)
  return `${DOW_LONG[p.dow]} ${p.d} ${MON_LONG[p.m - 1]}`
}
/** "30 Oct 2026" */
export function fmtDateYear(iso: string) {
  const p = parts(iso)
  return `${p.d} ${MON[p.m - 1]} ${p.y}`
}
/** "1 Oct" */
export function fmtDayMonth(iso: string) {
  const p = parts(iso)
  return `${p.d} ${MON[p.m - 1]}`
}
export function fmtDow(iso: string) {
  return DOW[parts(iso).dow]
}

/** "2pm", "2:30pm", "12pm" */
export function fmtTime(iso: string) {
  const p = parts(iso)
  return fmtHM(p.h, p.min)
}
export function fmtHM(h: number, min: number) {
  const suffix = h >= 12 ? "pm" : "am"
  const hh = h % 12 === 0 ? 12 : h % 12
  return min ? `${hh}:${String(min).padStart(2, "0")}${suffix}` : `${hh}${suffix}`
}
/** "08:00" → "8am" */
export function fmtClock(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return fmtHM(h, m)
}

/** "Thu 30 Oct, 2pm" */
export function fmtDateTime(iso: string) {
  return `${fmtDate(iso)}, ${fmtTime(iso)}`
}

/** "Today", "Tomorrow", "Yesterday" or "Thu 30 Oct" relative to now. */
export function fmtRelDay(iso: string, now: string) {
  const diff = Math.round((ms(startOfDay(iso)) - ms(startOfDay(now))) / MS_DAY)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  if (diff === -1) return "Yesterday"
  return fmtDate(iso)
}

/** Spoken form for the desk: "today at 3pm", "tomorrow at 8am", "Thu 29 Oct at 2pm". */
export function spokenSlot(iso: string, now: string) {
  const d = fmtRelDay(iso, now)
  return `${d === "Today" ? "today" : d === "Tomorrow" ? "tomorrow" : d} at ${fmtTime(iso)}`
}

/** Short "ago" for feeds: "now", "5m", "3h", "Mon", "12 Oct". */
export function fmtAgo(iso: string, now: string) {
  const diff = ms(now) - ms(iso)
  if (diff < MS_MIN) return "now"
  if (diff < MS_HOUR) return `${Math.floor(diff / MS_MIN)}m`
  if (diff < MS_DAY && sameDay(iso, now)) return fmtTime(iso)
  if (diff < 6 * MS_DAY) return fmtDow(iso)
  return fmtDayMonth(iso)
}

export function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}

export function greeting(iso: string) {
  const h = parts(iso).h
  if (h < 12) return "Morning"
  if (h < 18) return "Afternoon"
  return "Evening"
}

export function hhmmToMin(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function minutesOfDay(iso: string) {
  const p = parts(iso)
  return p.h * 60 + p.min
}

/** ISO for a London date key plus minutes from midnight. */
export function atMinutes(day: string, minutes: number) {
  const [y, m, d] = day.split("-").map(Number)
  return london(y, m, d, Math.floor(minutes / 60), minutes % 60)
}

/** .ics file content for a booking */
export function icsFile(opts: { uid: string; start: string; end: string; title: string; location: string; description: string }) {
  const f = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Answerd//Prototype//EN",
    "BEGIN:VEVENT",
    `UID:${opts.uid}@answerd.vitalos.co.uk`,
    `DTSTAMP:${f(opts.start)}`,
    `DTSTART:${f(opts.start)}`,
    `DTEND:${f(opts.end)}`,
    `SUMMARY:${opts.title}`,
    `LOCATION:${opts.location}`,
    `DESCRIPTION:${opts.description}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}
