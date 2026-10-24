"use client"
import * as React from "react"
import { AdminPage } from "@/components/admin/kit"
import { Heatmap, HeatLegend } from "@/components/admin/Heatmap"
import { CORE_CATEGORIES, POSTCODE_AREAS, SEEDED_AREAS, coverageCount } from "@/components/admin/data"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { Chip } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"

/** A-14: heatmap of the 121 UK postcode areas against core categories. Cells under 5 are gaps; a click filters A-03. */
export default function AdminCoverage() {
  const s = useStore()
  const [gapsOnly, setGapsOnly] = React.useState(false)
  const [q, setQ] = React.useState("")
  const cols = CORE_CATEGORIES.map((id) => ({ id, label: s.categories.find((c) => c.id === id)?.plural ?? id }))
  const ordered = [...SEEDED_AREAS, ...POSTCODE_AREAS.filter((a) => !SEEDED_AREAS.includes(a))]
  const rows = ordered.filter((a) => (!q || a.startsWith(q.toUpperCase())) && (!gapsOnly || CORE_CATEGORIES.some((c) => coverageCount(s, a, c) < 5)))
  const gaps = POSTCODE_AREAS.reduce((n, a) => n + CORE_CATEGORIES.filter((c) => coverageCount(s, a, c) < 5).length, 0)
  return (
    <AdminPage
      id="A-14"
      title="Coverage"
      description={
        <>
          {POSTCODE_AREAS.length} postcode areas × {CORE_CATEGORIES.length} core categories. {gaps} cells have fewer than 5 results. SE, CR, B and M count live seed listings; other areas show mock values. Click a cell to see those listings.
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label>
          <span className="sr-only">Find a postcode area</span>
          <input value={q} onChange={(e) => setQ(e.target.value.replace(/[^a-z]/gi, "").slice(0, 2))} placeholder="Area, e.g. SE" className="h-11 w-40 rounded-[12px] border border-line px-3 text-[14px] uppercase text-navy outline-none placeholder:normal-case placeholder:text-muted-ink focus:border-blue focus:ring-3 focus:ring-blue/20" />
        </label>
        <Chip active={gapsOnly} onClick={() => setGapsOnly((v) => !v)} className="h-11">
          Only areas with gaps
        </Chip>
        <div className="ml-auto">
          <HeatLegend />
        </div>
      </div>
      <DataGate isEmpty={rows.length === 0} empty={<EmptyState title="No areas match" body="Try a different postcode area." />}>
        <Heatmap
          rows={rows}
          cols={cols}
          value={(a, c) => coverageCount(s, a, c)}
          href={(a, c) => `/admin/listings?area=${a}&category=${c}`}
          rowNote={(a) => (SEEDED_AREAS.includes(a) ? "seed" : undefined)}
        />
      </DataGate>
    </AdminPage>
  )
}
