"use client"
import * as React from "react"
import Link from "next/link"
import { AdminPage, Pill, ReasonButton, userName } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { SegmentedControl } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Report } from "@/lib/types"

interface Row {
  id: string
  target: Report["target"]
  targetName: string
  targetHref: string
  reason: string
  details: string
  reporter: string
  at: string
  status: string
  resolution: string
  report: Report
}

function Resolve({ r }: { r: Report }) {
  if (r.status === "resolved") return <span className="t-caption text-muted-ink">{r.resolution}</span>
  const st = () => useStore.getState()
  if (r.target === "review")
    return (
      <div className="flex gap-1.5">
        <ReasonButton perm="reviews" label="Remove review" variant="destructive" title="Remove the reported review?" description="It's hidden everywhere and the rating recalculates." presets={["Fake: not a genuine customer", "Offensive or abusive"]} onConfirm={(reason) => {
          st().adminDecide("review", r.targetId, "remove", reason)
          toast("Review removed and report resolved")
        }} />
        <ReasonButton perm="reviews" label="Keep review" title="Keep the review and close the report?" presets={["Within policy", "Booking found"]} onConfirm={(reason) => {
          st().adminDecide("review", r.targetId, "keep", reason)
          toast("Review kept and report resolved")
        }} />
      </div>
    )
  if (r.target === "listing")
    return (
      <div className="flex gap-1.5">
        <ReasonButton perm="listings" label="Suspend listing" variant="destructive" title="Suspend the reported listing?" description="It disappears from search until you unsuspend it." presets={["Business closed", "Misleading listing"]} onConfirm={(reason) => {
          st().adminDecide("listing", r.targetId, "suspend", reason)
          st().adminDecide("report", r.id, "Listing suspended", reason)
          toast("Listing suspended and report resolved")
        }} />
        <ReasonButton perm="reports" label="No action" title="Close the report with no action?" presets={["Checked: listing is accurate"]} onConfirm={(reason) => {
          st().adminDecide("report", r.id, "No action", reason)
          toast("Report resolved")
        }} />
      </div>
    )
  return (
    <div className="flex gap-1.5">
      <ReasonButton perm="customers" label="Suspend user" variant="destructive" title="Suspend the reported user?" presets={["Abusive messages", "Repeated no-shows"]} onConfirm={(reason) => {
        st().adminDecide("customer", r.targetId, "suspend", reason)
        st().adminDecide("report", r.id, "User suspended", reason)
        toast("User suspended and report resolved")
      }} />
      <ReasonButton perm="reports" label="No action" title="Close the report with no action?" onConfirm={(reason) => {
        st().adminDecide("report", r.id, "No action", reason)
        toast("Report resolved")
      }} />
    </div>
  )
}

const columns: ColumnDef<Row>[] = [
  { accessorKey: "target", meta: { label: "Type" }, header: "Type", cell: ({ row }) => <Pill tone="info">{row.original.target}</Pill> },
  { accessorKey: "targetName", meta: { label: "Reported" }, header: ({ column }) => <SortHeader label="Reported" column={column} />, cell: ({ row }) => <Link href={row.original.targetHref} className="font-medium text-navy hover:text-blue hover:underline">{row.original.targetName}</Link> },
  { accessorKey: "reason", meta: { label: "Reason" }, header: "Reason" },
  { accessorKey: "details", meta: { label: "Details" }, header: "Details", cell: ({ row }) => <span className="block max-w-[280px] whitespace-normal">{row.original.details}</span> },
  { accessorKey: "reporter", meta: { label: "Reporter" }, header: "Reporter" },
  { accessorKey: "at", meta: { label: "Reported at" }, header: ({ column }) => <SortHeader label="When" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.at)}, {fmtTime(row.original.at)}</span> },
  { id: "actions", enableHiding: false, header: "Resolve", cell: ({ row }) => <Resolve r={row.original.report} /> },
]

/** A-09: listing, review and user reports with reasons and resolve actions. */
export default function AdminReports() {
  const s = useStore()
  const [tab, setTab] = React.useState<"open" | "resolved">("open")
  const rows: Row[] = s.reports
    .filter((r) => r.status === tab)
    .map((r) => {
      const review = r.target === "review" ? s.reviews.find((x) => x.id === r.targetId) : undefined
      const listing = r.target === "listing" ? s.listings.find((x) => x.id === r.targetId) : review ? s.listings.find((x) => x.id === review.listingId) : undefined
      const user = r.target === "user" ? s.users.find((x) => x.id === r.targetId) : undefined
      return {
        id: r.id,
        target: r.target,
        targetName: r.target === "review" ? `${review?.authorName ?? "Review"} on ${listing?.name ?? "—"}` : r.target === "listing" ? listing?.name ?? "—" : user ? `${user.firstName} ${user.lastName}` : "—",
        targetHref: r.target === "user" ? `/admin/customers?q=${encodeURIComponent(user?.phone ?? "")}` : r.target === "review" ? "/admin/reviews" : `/admin/listings/${r.targetId}`,
        reason: r.reason,
        details: r.details,
        reporter: r.reporterId ? userName(s.users, r.reporterId) : "Guest",
        at: r.at,
        status: r.status,
        resolution: r.resolution ?? "",
        report: r,
      }
    })
  return (
    <AdminPage id="A-09" title="Reports" perm="reports" description="Reports from customers and owners. Support can resolve review reports.">
      <SegmentedControl label="Reports" className="mb-4 w-[320px]" value={tab} onChange={setTab} options={[{ value: "open", label: `Open (${s.reports.filter((r) => r.status === "open").length})` }, { value: "resolved", label: "Resolved" }]} />
      <DataTable
        key={tab}
        label="Reports"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        initialSort={[{ id: "at", desc: true }]}
        facets={[{ column: "target", label: "Type", options: [{ value: "listing", label: "Listing" }, { value: "review", label: "Review" }, { value: "user", label: "User" }] }]}
        searchPlaceholder="Search reports"
        emptyTitle={tab === "open" ? "No open reports" : "No resolved reports"}
        emptyBody={tab === "open" ? "Everything reported has been dealt with." : "Resolved reports show here."}
      />
    </AdminPage>
  )
}
