"use client"
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AdminPage, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { listingRows, POSTCODE_AREAS, type ListingRow } from "@/components/admin/data"
import { withSuspense } from "@/components/app/helpers"
import { ButtonLink } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { fmtDate } from "@/lib/time"

const LAYER_TONE = { claimed: "good", seeded: "info", places: "plain" } as const

const columns: ColumnDef<ListingRow>[] = [
  {
    accessorKey: "name",
    meta: { label: "Name" },
    enableHiding: false,
    header: ({ column }) => <SortHeader label="Name" column={column} />,
    cell: ({ row }) => (
      <Link href={`/admin/listings/${row.original.id}`} className="font-medium text-navy hover:text-blue hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { accessorKey: "category", meta: { label: "Category" }, header: ({ column }) => <SortHeader label="Category" column={column} /> },
  { accessorKey: "categoryIds", meta: { label: "Category filter" }, header: "Category IDs", enableHiding: false },
  { accessorKey: "area", meta: { label: "Area" }, header: ({ column }) => <SortHeader label="Area" column={column} />, cell: ({ row }) => <span>{row.original.district} · {row.original.area}</span> },
  { accessorKey: "postcodeArea", meta: { label: "Postcode area" }, header: "Postcode area" },
  { accessorKey: "layer", meta: { label: "Layer" }, header: ({ column }) => <SortHeader label="Layer" column={column} />, cell: ({ row }) => <Pill tone={LAYER_TONE[row.original.layer as keyof typeof LAYER_TONE]}>{row.original.layer}</Pill> },
  { accessorKey: "claimed", meta: { label: "Claimed" }, header: "Claimed" },
  { accessorKey: "verified", meta: { label: "Verified" }, header: "Verified" },
  {
    accessorKey: "desk",
    meta: { label: "Desk" },
    header: "Desk",
    cell: ({ row }) => {
      const d = row.original.desk
      return d === "—" ? <span className="text-muted-ink">—</span> : <Pill tone={d === "live" ? "good" : d === "trial" ? "info" : d === "paused" ? "warn" : "plain"}>{d}</Pill>
    },
  },
  {
    accessorKey: "rating",
    meta: { label: "Rating" },
    header: ({ column }) => <SortHeader label="Rating" column={column} />,
    cell: ({ row }) => (row.original.count ? <span className="tnum">{row.original.rating.toFixed(1)} <span className="text-muted-ink">({row.original.count})</span></span> : <span className="text-muted-ink">—</span>),
  },
  { accessorKey: "last", meta: { label: "Last activity" }, header: ({ column }) => <SortHeader label="Last activity" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.last)}</span> },
  {
    accessorKey: "status",
    meta: { label: "Status" },
    header: "Status",
    cell: ({ row }) => <Pill tone={row.original.status === "Live" ? "plain" : "bad"}>{row.original.status}</Pill>,
  },
]

function Bulk({ rows, clear }: { rows: ListingRow[]; clear: () => void }) {
  const cats = useStore((s) => s.categories).filter((c) => c.parentId)
  const [cat, setCat] = React.useState(cats[0]?.id ?? "")
  const decide = (decision: string, reason: string, extra?: Record<string, unknown>) => {
    const st = useStore.getState()
    for (const r of rows) st.adminDecide("listing", r.id, decision, reason, extra)
    toast(`${rows.length} listing${rows.length > 1 ? "s" : ""} updated`)
    clear()
  }
  return (
    <>
      <ReasonButton perm="listings" label="Suspend" variant="destructive" title={`Suspend ${rows.length} listing${rows.length > 1 ? "s" : ""}?`} description="Suspended listings disappear from search, the app and the web until you unsuspend them." presets={["Business closed", "Fraud check", "Owner request"]} onConfirm={(r) => decide("suspend", r)} showDenied />
      <ReasonButton perm="listings" label="Unsuspend" title={`Unsuspend ${rows.length} listing${rows.length > 1 ? "s" : ""}?`} onConfirm={(r) => decide("unsuspend", r)} />
      <ReasonButton perm="listings" label="Recategorise" title={`Recategorise ${rows.length} listing${rows.length > 1 ? "s" : ""}`} description="Replaces each listing's categories with the one you choose." presets={["Wrong category from import"]} onConfirm={(r) => decide("recategorise", r, { categoryId: cat })}>
        <label className="flex flex-col gap-1.5">
          <span className="t-label text-navy">New category</span>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={adminInput}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </ReasonButton>
    </>
  )
}

/** A-03: every listing across the three layers, with filters and bulk suspend or recategorise. */
function AdminListings() {
  const s = useStore()
  const params = useSearchParams()
  const rows = React.useMemo(() => listingRows(s), [s])
  const cats = s.categories.filter((c) => c.parentId)
  const filters = { layer: params.get("layer") ?? "", postcodeArea: params.get("area") ?? "", categoryIds: params.get("category") ?? "" }
  const areaName = filters.postcodeArea
  const catName = cats.find((c) => c.id === filters.categoryIds)?.plural
  const presentAreas = POSTCODE_AREAS.filter((a) => rows.some((r) => r.postcodeArea === a) || a === areaName)
  return (
    <AdminPage
      id="A-03"
      title="Listings"
      perm="listings"
      description={areaName || catName ? <>Filtered from Coverage: {[catName, areaName && `postcode area ${areaName}`].filter(Boolean).join(" in ")}.</> : "Claimed, seeded and Places listings. Open a row for sources, history and actions."}
      actions={<ButtonLink href="/admin/coverage" variant="secondary" size="md">Coverage</ButtonLink>}
    >
      <DataTable
        key={params.toString()}
        label="Listings"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        rowHref={(r) => `/admin/listings/${r.id}`}
        searchPlaceholder="Search name, area, postcode"
        searchKey={(r) => `${r.name} ${r.area} ${r.district} ${r.category}`}
        initialFilters={filters}
        initialSort={[{ id: "name", desc: false }]}
        initialHidden={{ categoryIds: false, postcodeArea: false, claimed: false, verified: false }}
        facets={[
          { column: "layer", label: "Layer", options: [{ value: "claimed", label: "Claimed" }, { value: "seeded", label: "Seeded" }, { value: "places", label: "Places" }] },
          { column: "categoryIds", label: "Category", options: cats.map((c) => ({ value: c.id, label: c.name })) },
          { column: "postcodeArea", label: "Postcode area", options: presentAreas.map((a) => ({ value: a, label: a })) },
          { column: "status", label: "Status", options: ["Live", "Suspended", "Unpublished"].map((v) => ({ value: v, label: v })) },
        ]}
        bulk={(sel, clear) => <Bulk rows={sel} clear={clear} />}
        emptyTitle="No listings match"
        emptyBody={areaName ? `Nothing in ${areaName}${catName ? ` for ${catName.toLowerCase()}` : ""} yet. Run an import or seed this area.` : "Try clearing a filter."}
        emptyAction={areaName ? <ButtonLink href="/admin/imports" size="md">Go to imports</ButtonLink> : undefined}
      />
    </AdminPage>
  )
}

export default withSuspense(AdminListings)
