"use client"
import * as React from "react"
import { Download } from "lucide-react"
import { AdminPage, download, toCsv, userName } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"

interface Row {
  id: string
  at: string
  actor: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  reason: string
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "at", meta: { label: "When" }, header: ({ column }) => <SortHeader label="When" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.at)}, {fmtTime(row.original.at)}</span> },
  { accessorKey: "actorId", meta: { label: "Who" }, header: ({ column }) => <SortHeader label="Who" column={column} />, cell: ({ row }) => <span className="font-medium text-navy">{row.original.actor}</span> },
  { accessorKey: "action", meta: { label: "Action" }, header: ({ column }) => <SortHeader label="Action" column={column} />, cell: ({ row }) => <span className="font-mono text-[12.5px] text-navy">{row.original.action}</span> },
  { accessorKey: "targetType", meta: { label: "Record type" }, header: "Record type" },
  { accessorKey: "targetId", meta: { label: "Record" }, header: "Record", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.targetId}</span> },
  { accessorKey: "reason", meta: { label: "Reason" }, header: "Reason", cell: ({ row }) => <span className="block max-w-[360px] whitespace-normal">{row.original.reason}</span> },
]

/** A-22: who did what, when, to which record, and why; filter and export. */
export default function AuditLog() {
  const s = useStore()
  const rows: Row[] = s.audit.map((a) => ({ ...a, actor: userName(s.users, a.actorId) }))
  const actors = [...new Set(rows.map((r) => r.actorId))]
  const types = [...new Set(rows.map((r) => r.targetType))].sort()
  const exportCsv = () => {
    download(`answerd-audit-${s.clock.slice(0, 10)}.csv`, toCsv([["When (UTC)", "Who", "Action", "Record type", "Record", "Reason"], ...rows.map((r) => [r.at, r.actor, r.action, r.targetType, r.targetId, r.reason])]))
    toast("Audit log exported")
  }
  return (
    <AdminPage id="A-22" title="Audit log" description="Every admin write, with the reason given. Entries can't be edited or deleted." actions={<Button variant="secondary" size="md" onClick={exportCsv}><Download aria-hidden /> Export CSV</Button>}>
      <DataTable
        label="Audit log"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={15}
        initialSort={[{ id: "at", desc: true }]}
        searchPlaceholder="Search action, record or reason"
        searchKey={(r) => `${r.actor} ${r.action} ${r.targetType} ${r.targetId} ${r.reason}`}
        facets={[
          { column: "actorId", label: "Who", options: actors.map((a) => ({ value: a, label: userName(s.users, a) })) },
          { column: "targetType", label: "Record type", options: types.map((t) => ({ value: t, label: t })) },
        ]}
        emptyTitle="No audit entries"
        emptyBody="Admin actions show here as they happen."
      />
    </AdminPage>
  )
}
