"use client"
import * as React from "react"
import { Play } from "lucide-react"
import { AdminPage, Panel, Pill, ReasonButton } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { Banner } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { addDays, fmtDate, fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { ImportJob } from "@/lib/types"

const SOURCE: Record<ImportJob["source"], string> = { companies_house: "Companies House", osm: "OpenStreetMap" }

const columns: ColumnDef<ImportJob>[] = [
  { accessorKey: "source", meta: { label: "Source" }, header: "Source", cell: ({ row }) => SOURCE[row.original.source] },
  { accessorKey: "ranAt", meta: { label: "Ran at" }, header: ({ column }) => <SortHeader label="Ran at" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.ranAt)}, {fmtTime(row.original.ranAt)}</span> },
  { accessorKey: "added", meta: { label: "Rows added" }, header: ({ column }) => <SortHeader label="Added" column={column} />, cell: ({ row }) => <span className="tnum">{row.original.added.toLocaleString("en-GB")}</span> },
  { accessorKey: "updated", meta: { label: "Rows updated" }, header: ({ column }) => <SortHeader label="Updated" column={column} />, cell: ({ row }) => <span className="tnum">{row.original.updated.toLocaleString("en-GB")}</span> },
  { accessorKey: "errors", meta: { label: "Errors" }, header: ({ column }) => <SortHeader label="Errors" column={column} />, cell: ({ row }) => <span className={row.original.errors ? "text-red tnum" : "tnum"}>{row.original.errors}</span> },
  { accessorKey: "status", meta: { label: "Status" }, header: "Status", cell: ({ row }) => <Pill tone={row.original.status === "ok" ? "good" : "bad"}>{row.original.status === "ok" ? "Succeeded" : "Failed"}</Pill> },
]

/** A-13: Companies House and OpenStreetMap jobs; last run, rows added, updated, errors; Run now. */
export default function AdminImports() {
  const s = useStore()
  const recentFail = s.imports.find((j) => j.status === "failed" && ms(j.ranAt) >= ms(addDays(s.clock, -7)))
  const latestSame = recentFail ? s.imports.filter((j) => j.source === recentFail.source).sort((a, b) => b.ranAt.localeCompare(a.ranAt))[0] : undefined
  const recovered = recentFail && latestSame && latestSame.id !== recentFail.id && latestSame.status === "ok"
  const last = (src: ImportJob["source"]) => s.imports.filter((j) => j.source === src).sort((a, b) => b.ranAt.localeCompare(a.ranAt))[0]
  return (
    <AdminPage
      id="A-13"
      title="Imports"
      perm="imports"
      description="Nightly jobs that add and refresh seeded listings."
      actions={
        <ReasonButton
          perm="imports"
          size="md"
          variant="primary"
          label="Run now"
          icon={<Play aria-hidden />}
          title="Run the Companies House import now?"
          description="Adds new matching companies in South Norwood and Croydon as seeded listings."
          confirmLabel="Run import"
          presets={["Coverage gap in SE25 and CR0", "Testing the import"]}
          onConfirm={(reason) => {
            useStore.getState().runImport(reason)
            toast("Import finished: 5 seeded listings added")
          }}
        />
      }
    >
      {recentFail && (
        <Banner tone={recovered ? "warning" : "error"} title={`${SOURCE[recentFail.source]} import failed on ${fmtDate(recentFail.ranAt)} at ${fmtTime(recentFail.ranAt)}`} className="mb-4">
          {recovered ? `The next run on ${fmtDate(latestSame!.ranAt)} succeeded. ${recentFail.errors} error logged.` : "The latest run failed. Run it again or check the source."}
        </Banner>
      )}
      <div className="mb-6 grid grid-cols-2 gap-4">
        {(["companies_house", "osm"] as const).map((src) => {
          const j = last(src)
          return (
            <Panel key={src} title={SOURCE[src]}>
              {j ? (
                <p className="t-label font-normal text-slate">
                  Last run {fmtDate(j.ranAt)}, {fmtTime(j.ranAt)} · {j.added.toLocaleString("en-GB")} added · {j.updated.toLocaleString("en-GB")} updated · {j.errors} errors{" "}
                  <Pill tone={j.status === "ok" ? "good" : "bad"}>{j.status === "ok" ? "Succeeded" : "Failed"}</Pill>
                </p>
              ) : (
                <p className="t-label font-normal text-muted-ink">Never run.</p>
              )}
            </Panel>
          )
        })}
      </div>
      <DataTable label="Import history" data={s.imports} columns={columns} getRowId={(r) => r.id} initialSort={[{ id: "ranAt", desc: true }]} facets={[{ column: "source", label: "Source", options: [{ value: "companies_house", label: "Companies House" }, { value: "osm", label: "OpenStreetMap" }] }, { column: "status", label: "Status", options: [{ value: "ok", label: "Succeeded" }, { value: "failed", label: "Failed" }] }]} searchPlaceholder="Search jobs" emptyTitle="No imports yet" emptyBody="Run an import to add seeded listings." />
    </AdminPage>
  )
}
