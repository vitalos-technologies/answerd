"use client"
// Building blocks for S-01 to S-10: page frame (super admin only), data-source pills, chart panels with legend and table view.
import * as React from "react"
import { Database, FlaskConical, Sigma } from "lucide-react"
import { AdminPage, Panel, Pill } from "@/components/admin/kit"
import { C } from "./metrics"
import { cn } from "@/lib/utils"

export { C }

/** Every S screen: the admin frame, but only the super admin gets past it. */
export function SuperPage(props: Omit<React.ComponentProps<typeof AdminPage>, "superOnly">) {
  return <AdminPage {...props} superOnly />
}

export type Source = "live" | "modelled" | "simulated"

/** Where a number comes from: live store records, a model over them, or a simulation. */
export function SourcePill({ source }: { source: Source }) {
  if (source === "live")
    return (
      <Pill tone="good" icon={<Database aria-hidden />}>
        Live data
      </Pill>
    )
  if (source === "modelled")
    return (
      <Pill tone="info" icon={<Sigma aria-hidden />}>
        Modelled
      </Pill>
    )
  return (
    <Pill tone="warn" icon={<FlaskConical aria-hidden />}>
      Simulated
    </Pill>
  )
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Key">
      {items.map((x) => (
        <li key={x.label} className="flex items-center gap-1.5 t-caption text-slate">
          <span className="size-2.5 rounded-sm" style={{ background: x.color }} aria-hidden />
          {x.label}
        </li>
      ))}
    </ul>
  )
}

/** A chart in a panel: title, source, legend, the chart (described for screen readers) and a data-table view. */
export function ChartPanel({
  title,
  source,
  legend,
  summary,
  table,
  height = 240,
  note,
  className,
  children,
}: {
  title: string
  source: Source
  legend?: { label: string; color: string }[]
  summary: string
  table: { head: string[]; rows: (string | number)[][] }
  height?: number
  note?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <Panel title={title} id={id} className={className} action={<SourcePill source={source} />}>
      {legend && legend.length > 1 && (
        <div className="mb-2">
          <Legend items={legend} />
        </div>
      )}
      <div style={{ height }} role="img" aria-label={summary}>
        {children}
      </div>
      {note && <p className="mt-2 t-caption text-muted-ink">{note}</p>}
      <details className="mt-2">
        <summary className="inline-flex min-h-9 cursor-pointer items-center t-caption font-medium text-blue">Show the numbers</summary>
        <table className="mt-1 w-full text-[13px]">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b border-line text-left text-navy">
              {table.head.map((h, i) => (
                <th key={h} className={cn("py-1.5 font-semibold", i > 0 && "text-right")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-0">
                {r.map((c, j) => (
                  <td key={j} className={cn("py-1.5 text-slate", j > 0 && "text-right tnum")}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Panel>
  )
}

/** Recharts tooltip in the console's style; values in ink, the swatch carries the colour. */
export function ChartTip({ active, payload, label, format = (v: number) => String(v) }: { active?: boolean; payload?: { name?: string; dataKey?: string | number; value?: number; color?: string; fill?: string }[]; label?: string; format?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 shadow-overlay">
      {label && <p className="t-caption text-muted-ink">{label}</p>}
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-2 t-caption text-navy">
          <span className="size-2.5 rounded-sm" style={{ background: p.color ?? p.fill }} aria-hidden />
          <span className="flex-1">{p.name}</span>
          <span className="tnum">{format(Number(p.value ?? 0))}</span>
        </p>
      ))}
    </div>
  )
}

export const axisProps = { tick: { fontSize: 11, fill: C.axis }, tickLine: false, axisLine: { stroke: C.grid } } as const

/** A small headline figure for a section. */
export function Figure({ label, value, sub, tone = "plain" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "plain" | "warn" | "bad" | "good" }) {
  return (
    <div className={cn("rounded-2xl border bg-white p-4", tone === "warn" ? "border-amber" : tone === "bad" ? "border-red" : tone === "good" ? "border-teal" : "border-line")}>
      <p className="t-caption text-muted-ink">{label}</p>
      <p className="mt-1 text-[24px] font-bold leading-8 text-navy tnum">{value}</p>
      {sub && <p className="mt-1 t-caption text-slate">{sub}</p>}
    </div>
  )
}
