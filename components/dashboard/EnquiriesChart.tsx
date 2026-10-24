"use client"
import * as React from "react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useStore } from "@/lib/store"
import { SegmentedControl } from "@/components/answerd/Status"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { SERIES, weeklyStats, type StatsRange } from "@/components/biz/ops/StatsPanel"
import { fmtDayMonth } from "@/lib/time"
import { cn } from "@/lib/utils"

function ChartTip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-overlay">
      <p className="t-caption text-muted-ink">Week of {label}</p>
      {SERIES.map((sr) => (
        <p key={sr.key} className="flex items-center gap-2 t-caption text-navy">
          <span className="size-2.5 rounded-sm" style={{ background: sr.color }} aria-hidden />
          <span className="flex-1">{sr.label}</span>
          <span className="tnum">{payload.find((p) => p.dataKey === sr.key)?.value ?? 0}</span>
        </p>
      ))}
    </div>
  )
}

/** W-13 enquiries chart: the same weekly calls, messages and bookings as B-28 (weeklyStats). */
export function EnquiriesChart({ listingId, statsHref, className }: { listingId: string; statsHref?: string; className?: string }) {
  const s = useStore()
  const [range, setRange] = React.useState<StatsRange>("4w")
  const st = weeklyStats(s, listingId, range)
  const total = st.calls + st.messages + st.booked
  return (
    <section className={cn("card p-4", className)} aria-labelledby="w13-chart">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="w13-chart" className="t-heading">
            Enquiries
          </h2>
          <p className="t-caption text-muted-ink tnum">
            {total} from {fmtDayMonth(st.from)}: {st.calls} calls, {st.messages} messages, {st.booked} bookings
          </p>
        </div>
        <SegmentedControl
          label="Chart range"
          value={range}
          onChange={setRange}
          className="w-[220px]"
          options={[
            { value: "4w", label: "4 weeks" },
            { value: "12w", label: "12 weeks" },
          ]}
        />
      </div>
      <DataGate isEmpty={!total} rows={2} empty={<EmptyState title="No enquiries yet" body="Calls, messages and bookings from Answerd show here by week." />}>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1" aria-label="Key">
          {SERIES.map((x) => (
            <li key={x.key} className="flex items-center gap-1.5 t-caption text-slate">
              <span className="size-2.5 rounded-sm" style={{ background: x.color }} aria-hidden /> {x.label}
            </li>
          ))}
        </ul>
        <div className="mt-2" role="img" aria-label={`Stacked bar chart of enquiries per week from ${fmtDayMonth(st.from)}: ${st.calls} calls, ${st.messages} messages and ${st.booked} bookings.`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={st.rows} margin={{ top: 8, right: 4, left: -24, bottom: 0 }} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#E2E8F0" }} tick={{ fill: "#64748B", fontSize: 11 }} interval="preserveStartEnd" minTickGap={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} width={40} />
              <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(37,99,255,0.06)" }} />
              {SERIES.map((x, i) => (
                <Bar key={x.key} dataKey={x.key} name={x.label} stackId="a" fill={x.color} stroke="#FFFFFF" strokeWidth={1} radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {statsHref && (
          <Link href={statsHref} className="mt-2 inline-flex min-h-11 items-center t-label text-blue hover:underline">
            See all stats
          </Link>
        )}
      </DataGate>
    </section>
  )
}
