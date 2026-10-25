"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye } from "lucide-react"
import { AdminPage, Pill, ReasonButton } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { businessRows } from "@/components/admin/data"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { rulesFor } from "@/lib/selectors"

type Row = ReturnType<typeof businessRows>[number]

function ViewAs({ row }: { row: Row }) {
  const router = useRouter()
  return (
    <ReasonButton
      perm="support_view"
      label="View as support"
      icon={<Eye aria-hidden />}
      title={`View ${row.name} as support?`}
      description="Opens their business screens read-only under a banner. The visit is audited."
      confirmLabel="Open read-only"
      presets={["Owner called about their inbox", "Owner can't see a booking", "Checking desk settings for a ticket"]}
      onConfirm={(reason) => {
        useStore.getState().setSupportView(row.id, reason)
        router.push("/app/biz")
      }}
    />
  )
}

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "name",
    meta: { label: "Business" },
    enableHiding: false,
    header: ({ column }) => <SortHeader label="Business" column={column} />,
    cell: ({ row }) => (
      <Link href={`/admin/listings/${row.original.business.listingId}`} className="font-medium text-navy hover:text-blue hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "owner", meta: { label: "Owner" }, header: "Owner" },
  { accessorKey: "tenantId", meta: { label: "Tenant" }, header: "Tenant", cell: ({ row }) => <span className="font-mono text-[12.5px]">{row.original.tenantId}</span> },
  { accessorKey: "plan", meta: { label: "Plan" }, header: ({ column }) => <SortHeader label="Plan" column={column} /> },
  { accessorKey: "desk", meta: { label: "Desk" }, header: "Desk", cell: ({ row }) => <Pill tone={row.original.desk === "live" ? "good" : row.original.desk === "trial" ? "info" : row.original.desk === "paused" ? "warn" : "plain"}>{row.original.desk}</Pill> },
  {
    accessorKey: "gateCount",
    meta: { label: "Gate progress" },
    header: ({ column }) => <SortHeader label="Gate progress" column={column} />,
    cell: ({ row }) => {
      const GATE_ENQUIRIES = rulesFor(useStore.getState()).gateEnquiries
      const n = Math.min(row.original.gateCount, GATE_ENQUIRIES)
      return (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-sky" aria-hidden>
            <span className="block h-full rounded-full bg-blue" style={{ width: `${(n / GATE_ENQUIRIES) * 100}%` }} />
          </span>
          <span className="tnum">
            {row.original.gateCount}/{GATE_ENQUIRIES}
          </span>
          {row.original.gateMet && <Pill tone="good">Gate met</Pill>}
        </span>
      )
    },
  },
  { accessorKey: "status", meta: { label: "Status" }, header: "Status", cell: ({ row }) => <Pill tone={row.original.status === "live" ? "good" : row.original.status === "pending" ? "warn" : "bad"}>{row.original.status}</Pill> },
  { id: "actions", enableHiding: false, header: "", cell: ({ row }) => <ViewAs row={row.original} /> },
]

/** A-11: tenants with plan, desk status and gate progress; View as support (read-only, banner, audited). */
function AdminBusinesses() {
  const s = useStore()
  const params = useSearchParams()
  const rows = businessRows(s)
  return (
    <AdminPage id="A-11" title="Businesses" description="One business per claimed listing, each a Workforce tenant. View as support opens their screens read-only and is recorded in the audit log.">
      <DataTable
        key={params.toString()}
        label="Businesses"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        initialSearch={params.get("q") ?? ""}
        initialFilters={{ desk: params.get("desk") ?? "" }}
        initialSort={[{ id: "name", desc: false }]}
        searchPlaceholder="Search business, owner or tenant"
        searchKey={(r) => `${r.name} ${r.owner} ${r.tenantId}`}
        facets={[
          { column: "desk", label: "Desk", options: ["live", "trial", "paused", "off"].map((v) => ({ value: v, label: v })) },
          { column: "status", label: "Status", options: ["live", "pending", "suspended"].map((v) => ({ value: v, label: v })) },
        ]}
        emptyTitle="No businesses match"
        emptyBody="Try clearing a filter."
      />
    </AdminPage>
  )
}

export default withSuspense(AdminBusinesses)
