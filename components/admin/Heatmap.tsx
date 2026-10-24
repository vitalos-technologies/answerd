"use client"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** Sequential blue for healthy cells; red-tint with red text under 5 (spec A-14). */
export function cellTone(n: number) {
  if (n < 5) return "bg-red-tint text-red"
  if (n < 15) return "bg-blue-tint text-navy"
  if (n < 30) return "bg-[#C7D6FF] text-navy"
  return "bg-[#7FA0FF] text-navy"
}

export function HeatLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 t-caption text-slate" aria-label="Legend">
      {[
        ["Under 5 (gap)", cellTone(0)],
        ["5 to 14", cellTone(5)],
        ["15 to 29", cellTone(15)],
        ["30 or more", cellTone(30)],
      ].map(([label, cls]) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <span className={cn("inline-block h-4 w-6 rounded-[4px]", cls)} aria-hidden />
          {label}
        </span>
      ))}
    </div>
  )
}

/** Postcode areas (rows) × categories (columns). Each cell links to the filtered listings table. */
export function Heatmap({ rows, cols, value, href, rowNote }: { rows: string[]; cols: { id: string; label: string }[]; value: (row: string, col: string) => number; href: (row: string, col: string) => string; rowNote?: (row: string) => string | undefined }) {
  return (
    <div className="overflow-auto rounded-2xl border border-line" style={{ maxHeight: 640 }}>
      <table className="w-full border-separate border-spacing-[2px] bg-white text-[12.5px]" aria-label="Coverage by postcode area and category">
        <thead>
          <tr>
            <th className="sticky left-0 top-0 z-20 bg-white px-2 py-2 text-left font-semibold text-navy">Area</th>
            {cols.map((c) => (
              <th key={c.id} scope="col" className="sticky top-0 z-10 bg-white px-1 py-2 text-center font-semibold text-navy">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th scope="row" className="sticky left-0 z-10 whitespace-nowrap bg-white px-2 text-left font-mono font-semibold text-navy">
                {r}
                {rowNote?.(r) && <span className="ml-1.5 font-sans text-[11px] font-medium text-muted-ink">{rowNote(r)}</span>}
              </th>
              {cols.map((c) => {
                const n = value(r, c.id)
                return (
                  <td key={c.id} className="p-0">
                    <Link
                      href={href(r, c.id)}
                      title={`${r} · ${c.label}: ${n} result${n === 1 ? "" : "s"}${n < 5 ? " (gap)" : ""}`}
                      aria-label={`${r}, ${c.label}: ${n} results${n < 5 ? ", under 5" : ""}. Open listings`}
                      className={cn("flex h-8 min-w-14 items-center justify-center rounded-[4px] font-semibold tnum outline-offset-1 hover:ring-2 hover:ring-navy/40 focus-visible:outline-2 focus-visible:outline-blue", cellTone(n))}
                    >
                      {n}
                    </Link>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
