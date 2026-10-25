"use client"
import * as React from "react"
import Link from "next/link"
import { AdminPage, Kpi, Pill, ReasonButton } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { useStore } from "@/lib/store"
import { gateStatus, rulesFor } from "@/lib/selectors"
import { fmtDateYear, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"

interface Row {
  id: string
  name: string
  listingId: string
  count: number
  met: boolean
  override: boolean
  overrideReason: string
}

/** A-18: launch date, day-60 date, per-business enquiry counters and manual overrides with reason. */
export default function MonetiseGate() {
  const s = useStore()
  // R2: thresholds come from S-06
  const { gateEnquiries: GATE_ENQUIRIES, gateDays: GATE_DAYS } = rulesFor(s)
  const g0 = gateStatus(s, s.businesses[0]?.id)
  const daysSince = Math.floor((ms(s.clock) - ms(s.settings.launchDate)) / MS_DAY)
  const rows: Row[] = s.businesses.map((b) => {
    const g = gateStatus(s, b.id)
    const o = s.settings.gateOverrides.find((x) => x.businessId === b.id)
    return { id: b.id, name: s.listings.find((l) => l.id === b.listingId)?.name ?? b.tradingName, listingId: b.listingId, count: g.count, met: g.met, override: g.override, overrideReason: o?.reason ?? "" }
  })
  const columns: ColumnDef<Row>[] = [
    { accessorKey: "name", meta: { label: "Business" }, header: ({ column }) => <SortHeader label="Business" column={column} />, cell: ({ row }) => <Link href={`/admin/listings/${row.original.listingId}`} className="font-medium text-navy hover:text-blue hover:underline">{row.original.name}</Link> },
    {
      accessorKey: "count",
      meta: { label: "Answerd enquiries" },
      header: ({ column }) => <SortHeader label="Answerd enquiries" column={column} />,
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-sky" aria-hidden>
            <span className="block h-full rounded-full bg-blue" style={{ width: `${Math.min(100, (row.original.count / GATE_ENQUIRIES) * 100)}%` }} />
          </span>
          <span className="tnum">{row.original.count} of {GATE_ENQUIRIES}</span>
        </span>
      ),
    },
    { id: "state", accessorFn: (r) => (r.override ? "override" : r.met ? "met" : "not_met"), meta: { label: "Gate" }, header: "Gate", cell: ({ row }) => (row.original.override ? <Pill tone="info">Override</Pill> : row.original.met ? <Pill tone="good">Met</Pill> : <Pill>Not yet</Pill>) },
    { accessorKey: "overrideReason", meta: { label: "Override reason" }, header: "Override reason", cell: ({ row }) => <span className="block max-w-[260px] whitespace-normal">{row.original.overrideReason || "—"}</span> },
    {
      id: "actions",
      enableHiding: false,
      header: "",
      cell: ({ row }) =>
        row.original.override ? (
          <ReasonButton perm="gate" label="Remove override" title={`Remove the override for ${row.original.name}?`} description={`The business goes back to the normal rule: ${GATE_ENQUIRIES} enquiries and day ${GATE_DAYS}.`} onConfirm={(r) => { useStore.getState().adminDecide("gate", row.original.id, "remove_override", r); toast("Override removed") }} />
        ) : (
          <ReasonButton perm="gate" label="Override" title={`Open the gate for ${row.original.name}?`} description="They see paid prompts now, whatever their enquiry count or the date." presets={["Owner asked to upgrade early", "Pilot partner"]} onConfirm={(r) => { useStore.getState().adminDecide("gate", row.original.id, "override", r); toast("Gate opened for this business") }} />
        ),
    },
  ]
  return (
    <AdminPage id="A-18" title="Monetise gate" perm="gate" description={`A business sees paid prompts only once it has had ${GATE_ENQUIRIES} Answerd enquiries and it's at least ${GATE_DAYS} days after launch. Nothing is charged before then.`}>
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="Launch date" value={fmtDateYear(s.settings.launchDate)} sub={`${daysSince} days ago`} />
        <Kpi label={`Day ${GATE_DAYS}`} value={fmtDateYear(g0.gateDate)} sub={g0.daysOk ? "Passed" : `In ${Math.ceil((ms(g0.gateDate) - ms(s.clock)) / MS_DAY)} days`} />
        <Kpi label={`Businesses at ${GATE_ENQUIRIES}+`} value={rows.filter((r) => r.count >= GATE_ENQUIRIES).length} sub={`of ${rows.length}`} />
        <Kpi label="Overrides" value={s.settings.gateOverrides.length} sub="Set by admins, with reasons" />
      </div>
      <DataTable label="Gate progress" data={rows} columns={columns} getRowId={(r) => r.id} initialSort={[{ id: "count", desc: true }]} facets={[{ column: "state", label: "Gate", options: [{ value: "met", label: "Met" }, { value: "override", label: "Override" }, { value: "not_met", label: "Not yet" }] }]} searchPlaceholder="Search business" emptyTitle="No businesses yet" emptyBody="Businesses appear once a listing is claimed." />
    </AdminPage>
  )
}
