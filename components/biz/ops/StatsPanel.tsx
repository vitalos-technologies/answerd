"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useStore } from "@/lib/store"
import { SegmentedControl } from "@/components/answerd/Status"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { addDays, atMinutes, dayKey, fmtDayMonth, ms } from "@/lib/time"
import { cn } from "@/lib/utils"
import { daysOfData, deskTouched, medianResponseMin } from "./data"
import { mondayOf } from "./Diary"

export type StatsRange = "4w" | "12w" | "all"

// Validated categorical palette (blue, orange, aqua): passes CVD and normal-vision checks on white.
// Aqua is under 3:1 against white, so the chart always has a legend and a table view.
export const SERIES = [
  { key: "calls", label: "Calls", color: "#2563FF" },
  { key: "messages", label: "Messages", color: "#EB6834" },
  { key: "bookings", label: "Bookings", color: "#1BAF7A" },
] as const

interface WeekRow {
  week: string
  label: string
  calls: number
  messages: number
  bookings: number
}

/** Weekly calls, messages (Enquiry records) and bookings (Booking records), Monday to Sunday. */
export function weeklyStats(s: ReturnType<typeof useStore.getState>, listingId: string, range: StatsRange) {
  const now = s.clock
  const thisMonday = mondayOf(dayKey(now))
  const enq = s.enquiries.filter((e) => e.listingId === listingId && ms(e.at) <= ms(now))
  const bookings = s.bookings.filter((b) => b.listingId === listingId && ms(b.createdAt) <= ms(now))
  const first = [...enq.map((e) => e.at), ...bookings.map((b) => b.createdAt)].sort()[0] ?? now
  const allWeeks = Math.max(1, Math.ceil((ms(atMinutes(thisMonday, 0)) - ms(atMinutes(mondayOf(dayKey(first)), 0))) / (7 * 86_400_000)) + 1)
  const n = range === "4w" ? 4 : range === "12w" ? 12 : allWeeks
  const rows: WeekRow[] = []
  for (let i = n - 1; i >= 0; i--) {
    const start = atMinutes(dayKey(addDays(atMinutes(thisMonday, 12 * 60), -7 * i)), 0)
    const end = addDays(start, 7)
    const inWeek = (iso: string) => ms(iso) >= ms(start) && ms(iso) < ms(end)
    rows.push({
      week: start,
      label: fmtDayMonth(start),
      calls: enq.filter((e) => e.kind === "call" && inWeek(e.at)).length,
      messages: enq.filter((e) => e.kind === "message" && inWeek(e.at)).length,
      bookings: bookings.filter((b) => inWeek(b.createdAt)).length,
    })
  }
  const from = rows[0]!.week
  const inRange = (iso: string) => ms(iso) >= ms(from) && ms(iso) <= ms(now)
  const views = enq.filter((e) => e.kind === "profile_view" && inRange(e.at)).length
  const appearances = enq.filter((e) => e.kind === "search_appearance" && inRange(e.at)).length
  const calls = rows.reduce((a, r) => a + r.calls, 0)
  const messages = rows.reduce((a, r) => a + r.messages, 0)
  const booked = rows.reduce((a, r) => a + r.bookings, 0)
  const callRecs = s.calls.filter((c) => c.listingId === listingId && !c.spam && inRange(c.startedAt))
  const threadRecs = s.threads.filter((t) => t.listingId === listingId && !t.spam && t.channel !== "call" && inRange(t.createdAt))
  const handled = callRecs.filter((c) => c.outcome === "desk").length + threadRecs.filter((t) => deskTouched(s, t.id)).length
  const conversations = callRecs.length + threadRecs.length
  const converted = callRecs.filter((c) => c.bookingId).length + threadRecs.filter((t) => s.messages.some((m) => m.threadId === t.id && m.card?.kind === "booking")).length
  return {
    rows,
    from,
    views,
    appearances,
    calls,
    messages,
    booked,
    conversion: conversations ? Math.round((converted / conversations) * 100) : null,
    deskShare: conversations ? Math.round((handled / conversations) * 100) : null,
    responseMin: medianResponseMin(s, listingId, from),
  }
}

function fmtMins(m: number | null) {
  if (m === null) return "No data"
  if (m < 1) return "Under 1 min"
  if (m < 60) return `${Math.round(m)} min`
  const h = Math.round(m / 60)
  return `${h} hour${h > 1 ? "s" : ""}`
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((a, p) => a + (p.value ?? 0), 0)
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-overlay">
      <p className="t-caption text-muted-ink">Week of {label}</p>
      {SERIES.map((sr) => {
        const p = payload.find((x) => x.dataKey === sr.key)
        return (
          <p key={sr.key} className="flex items-center gap-2 t-caption text-navy">
            <span className="size-2.5 rounded-sm" style={{ background: sr.color }} aria-hidden />
            <span className="flex-1">{sr.label}</span>
            <span className="tnum">{p?.value ?? 0}</span>
          </p>
        )
      })}
      <p className="mt-1 border-t border-line pt-1 t-caption font-semibold text-navy tnum">Total {total}</p>
    </div>
  )
}

/**
 * B-28: stacked bars by week (calls, messages, bookings) plus profile views, search appearances,
 * conversion, desk-handled share and response time; range 4 weeks, 12 weeks or all.
 */
export function StatsPanel({ listingId, className, height = 220 }: { listingId: string; className?: string; height?: number }) {
  const s = useStore()
  const [range, setRange] = React.useState<StatsRange>("4w")
  const [table, setTable] = React.useState(false)
  const st = weeklyStats(s, listingId, range)
  const days = daysOfData(s, listingId)
  const empty = !st.calls && !st.messages && !st.booked && !st.views
  const tiles = [
    { label: "Profile views", value: String(st.views) },
    { label: "Search appearances", value: String(st.appearances) },
    { label: "Conversion", value: st.conversion === null ? "No data" : `${st.conversion}%`, hint: "Calls and chats that led to a booking" },
    { label: "Desk handled", value: st.deskShare === null ? "No data" : `${st.deskShare}%`, hint: "Calls and chats the desk answered" },
    { label: "Response time", value: fmtMins(st.responseMin), hint: "Median first reply" },
    { label: "Enquiries", value: String(st.calls + st.messages + st.booked), hint: `${st.calls} calls · ${st.messages} messages · ${st.booked} bookings` },
  ]
  return (
    <div className={cn("space-y-4", className)}>
      <SegmentedControl
        label="Range"
        value={range}
        onChange={setRange}
        options={[
          { value: "4w", label: "4 weeks" },
          { value: "12w", label: "12 weeks" },
          { value: "all", label: "All" },
        ]}
      />
      {days < 7 && (
        <Banner tone="info" title="Under 7 days of data">
          Numbers settle once you&apos;ve had a full week on Answerd.
        </Banner>
      )}
      <DataGate isEmpty={empty} empty={<EmptyState title="No enquiries yet" body="Calls, messages and bookings from Answerd show here by week." />}>
        <section className="card p-4" aria-labelledby="stats-chart">
          <div className="flex items-center justify-between gap-2">
            <h2 id="stats-chart" className="t-subhead">
              Enquiries by week
            </h2>
            <button type="button" onClick={() => setTable((t) => !t)} className="inline-flex min-h-11 items-center t-label text-blue hover:underline" aria-pressed={table}>
              {table ? "Show chart" : "Show as table"}
            </button>
          </div>
          {table ? (
            <table className="mt-2 w-full t-caption">
              <caption className="sr-only">Enquiries by week</caption>
              <thead>
                <tr className="text-left text-muted-ink">
                  <th className="py-1.5 font-medium">Week of</th>
                  {SERIES.map((x) => (
                    <th key={x.key} className="py-1.5 text-right font-medium">
                      {x.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-navy tnum">
                {st.rows.map((r) => (
                  <tr key={r.week}>
                    <td className="py-1.5">{r.label}</td>
                    <td className="py-1.5 text-right">{r.calls}</td>
                    <td className="py-1.5 text-right">{r.messages}</td>
                    <td className="py-1.5 text-right">{r.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-label="Key">
              {SERIES.map((x) => (
                <li key={x.key} className="flex items-center gap-1.5 t-caption text-slate">
                  <span className="size-2.5 rounded-sm" style={{ background: x.color }} aria-hidden /> {x.label}
                </li>
              ))}
            </ul>
          )}
          {!table && (
            <div className="mt-2" role="img" aria-label={`Stacked bar chart of calls, messages and bookings per week from ${fmtDayMonth(st.from)}. ${st.calls} calls, ${st.messages} messages and ${st.booked} bookings in total.`}>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={st.rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fill: "#64748B", fontSize: 11 }} interval="preserveStartEnd" minTickGap={8} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} width={40} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(37,99,255,0.06)" }} />
                  {SERIES.map((x, i) => (
                    <Bar key={x.key} dataKey={x.key} name={x.label} stackId="a" fill={x.color} stroke="#FFFFFF" strokeWidth={1} radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
        <dl className="grid grid-cols-2 gap-2">
          {tiles.map((t) => (
            <div key={t.label} className="card p-3.5">
              <dt className="t-caption text-muted-ink">{t.label}</dt>
              <dd className="t-heading tnum">{t.value}</dd>
              {t.hint && <dd className="t-caption text-muted-ink">{t.hint}</dd>}
            </div>
          ))}
        </dl>
        <p className="t-caption text-muted-ink">From {fmtDayMonth(st.from)} to today. Counts come from your Answerd calls, messages, bookings and profile views.</p>
      </DataGate>
    </div>
  )
}
