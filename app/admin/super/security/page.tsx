"use client"
import * as React from "react"
import { AlertTriangle, Download } from "lucide-react"
import { Kpi, Panel, Pill, download, toCsv } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { SuperPage } from "@/components/admin/super/ui"
import { SECURITY_LABEL, securityRows, unusualActivity, type SecurityKind, type SecurityRow } from "@/components/admin/super/metrics"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"

const TONE: Record<SecurityKind, "plain" | "info" | "warn" | "navy" | "good" | "bad"> = { sign_in: "plain", impersonation: "warn", export: "info", role: "navy", switch: "bad", rules: "good", other: "plain" }

const columns: ColumnDef<SecurityRow>[] = [
  { accessorKey: "at", meta: { label: "When" }, header: ({ column }) => <SortHeader label="When" column={column} />, cell: ({ row }) => <span className="whitespace-nowrap tnum">{fmtDate(row.original.at)}, {fmtTime(row.original.at)}</span> },
  { accessorKey: "kind", meta: { label: "Type" }, header: "Type", cell: ({ row }) => <Pill tone={row.original.ok ? TONE[row.original.kind] : "bad"}>{row.original.ok ? SECURITY_LABEL[row.original.kind] : "Refused sign-in"}</Pill> },
  { accessorKey: "who", meta: { label: "Who" }, header: ({ column }) => <SortHeader label="Who" column={column} />, cell: ({ row }) => <span className="font-medium text-navy">{row.original.who}</span> },
  { accessorKey: "what", meta: { label: "Action" }, header: "Action", cell: ({ row }) => <span className="font-mono text-[12.5px] text-navy">{row.original.what}</span> },
  { accessorKey: "target", meta: { label: "Record" }, header: "Record", cell: ({ row }) => <span className="block max-w-[180px] truncate text-[13px]" title={row.original.target}>{row.original.target}</span> },
  { accessorKey: "detail", meta: { label: "Detail" }, header: "Detail", cell: ({ row }) => <span className="block min-w-[200px] max-w-[320px] whitespace-normal">{row.original.detail}</span> },
]

/** S-10: staff sign-ins, impersonations, exports, role changes and switch flips, with filters, export and alerts. */
export default function SecurityLog() {
  const s = useStore()
  const rows = securityRows(s)
  const alerts = unusualActivity(s)
  const week = ms(s.clock) - 7 * MS_DAY
  const recent = rows.filter((r) => ms(r.at) >= week)
  const who = [...new Set(rows.map((r) => r.who))].sort()
  const exportCsv = () => {
    download(`answerd-security-${s.clock.slice(0, 10)}.csv`, toCsv([["When (UTC)", "Type", "Who", "Action", "Record", "Detail"], ...rows.map((r) => [r.at, SECURITY_LABEL[r.kind], r.who, r.what, r.target, r.detail])]))
    useStore.getState().exportAudit("security-log", rows.length)
    toast("Security log exported")
  }
  return (
    <SuperPage id="S-10" title="Security log" description="The audit log plus every console sign-in. Entries can't be edited or deleted; exports are logged too." actions={<Button variant="secondary" size="md" onClick={exportCsv}><Download aria-hidden /> Export CSV</Button>}>
      <div className="mb-4 grid grid-cols-5 gap-3">
        <Kpi label="Sign-ins, 7 days" value={recent.filter((r) => r.kind === "sign_in" && r.ok).length} sub={`${recent.filter((r) => r.kind === "sign_in" && !r.ok).length} refused`} tone={recent.some((r) => r.kind === "sign_in" && !r.ok) ? "warn" : "plain"} />
        <Kpi label="Impersonations" value={rows.filter((r) => r.kind === "impersonation" && /start|view_as/.test(r.what)).length} sub="Views as a customer or business" />
        <Kpi label="Exports" value={rows.filter((r) => r.kind === "export").length} sub="CSV and data exports" />
        <Kpi label="Role changes" value={rows.filter((r) => r.kind === "role").length} sub="Invites, roles, permissions" />
        <Kpi label="Switch flips" value={rows.filter((r) => r.kind === "switch").length} sub="Platform and desk switches" />
      </div>
      {alerts.length > 0 && (
        <Panel title={<span className="inline-flex items-center gap-2"><AlertTriangle className="size-4 text-amber-ink" aria-hidden />Unusual activity</span>} className="mb-4 border-amber">
          <ul className="divide-y divide-line">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-2 text-[13.5px]">
                <span className="w-32 shrink-0 text-muted-ink tnum">
                  {fmtDate(a.at)}, {fmtTime(a.at)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-navy">{a.title}</span> <span className="text-slate">{a.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      <DataTable
        label="Security log"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={15}
        initialSort={[{ id: "at", desc: true }]}
        searchPlaceholder="Search person, action, record or detail"
        searchKey={(r) => `${r.who} ${r.what} ${r.target} ${r.detail}`}
        facets={[
          { column: "kind", label: "Type", options: (Object.keys(SECURITY_LABEL) as SecurityKind[]).map((k) => ({ value: k, label: SECURITY_LABEL[k] })) },
          { column: "who", label: "Who", options: who.map((w) => ({ value: w, label: w })) },
        ]}
        emptyTitle="Nothing logged"
        emptyBody="Sign-ins and admin actions show here as they happen."
      />
    </SuperPage>
  )
}
