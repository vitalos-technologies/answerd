"use client"
import * as React from "react"
import Link from "next/link"
import { AdminPage, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { SegmentedControl } from "@/components/answerd/Status"
import { Stars } from "@/components/answerd/Rating"
import { useStore } from "@/lib/store"
import { listingRating } from "@/lib/selectors"
import { addDays, fmtDate, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Review } from "@/lib/types"

const POLICY = ["Fake: not a genuine customer", "Offensive or abusive", "Shares personal information", "Conflict of interest", "Not about this business"]

interface Row {
  id: string
  listing: string
  listingId: string
  author: string
  stars: number
  text: string
  createdAt: string
  status: string
  flag: string
  review: Review
}

function ContactReviewer({ review }: { review: Review }) {
  const [msg, setMsg] = React.useState(`Hi ${review.authorName.split(" ")[0]}, we're checking your review of this business. Can you tell us the date of your booking or call?`)
  return (
    <ReasonButton
      perm="reviews"
      label="Contact"
      disabled={!review.customerId}
      title={`Contact ${review.authorName}`}
      description="Sent as an Answerd notification and email."
      confirmLabel="Send"
      presets={["Checking a flagged review"]}
      validate={() => (msg.trim().length < 5 ? "Write a message." : null)}
      onConfirm={(reason) => {
        useStore.getState().adminContact(review.customerId!, msg.trim(), "review", review.id, reason)
        toast(`Message sent to ${review.authorName}`)
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Message</span>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className={`${adminInput} h-auto py-2`} />
      </label>
    </ReasonButton>
  )
}

function Actions({ r, name }: { r: Review; name: string }) {
  if (r.status === "removed")
    return <span className="t-caption text-muted-ink">Removed</span>
  return (
    <div className="flex items-center gap-1.5">
      <ReasonButton
        perm="reviews"
        label="Keep"
        title="Keep this review?"
        description="It stays live and the flag is cleared."
        presets={["Genuine customer: booking found", "Within policy"]}
        onConfirm={(reason) => {
          useStore.getState().adminDecide("review", r.id, "keep", reason)
          toast("Review kept")
        }}
      />
      <ReasonButton
        perm="reviews"
        label="Remove"
        variant="destructive"
        title={`Remove ${r.authorName}'s review of ${name}?`}
        description="It's hidden everywhere and the rating recalculates."
        confirmLabel="Remove review"
        presets={POLICY}
        onConfirm={(reason) => {
          useStore.getState().adminDecide("review", r.id, "remove", reason)
          toast("Review removed. Rating recalculated.")
        }}
      />
      <ContactReviewer review={r} />
    </div>
  )
}

/** A-08: flagged and new reviews; Keep, Remove (policy reason), Contact reviewer. Support can moderate. */
export default function AdminReviews() {
  const s = useStore()
  const [tab, setTab] = React.useState<"flagged" | "new" | "removed">("flagged")
  const weekAgo = ms(addDays(s.clock, -7))
  const pick = s.reviews.filter((r) => (tab === "flagged" ? r.flagged && r.status === "live" : tab === "removed" ? r.status === "removed" : r.status === "live" && ms(r.createdAt) >= weekAgo))
  const rows: Row[] = pick.map((r) => ({
    id: r.id,
    listing: s.listings.find((l) => l.id === r.listingId)?.name ?? "—",
    listingId: r.listingId,
    author: r.authorName,
    stars: r.stars,
    text: r.text,
    createdAt: r.createdAt,
    status: r.status,
    flag: r.flagReason ?? (s.reports.find((p) => p.target === "review" && p.targetId === r.id)?.reason ?? ""),
    review: r,
  }))
  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "listing",
      meta: { label: "Business" },
      header: ({ column }) => <SortHeader label="Business" column={column} />,
      cell: ({ row }) => {
        const l = s.listings.find((x) => x.id === row.original.listingId)
        const rt = l ? listingRating(s, l) : null
        return (
          <span className="block">
            <Link href={`/admin/listings/${row.original.listingId}`} className="font-medium text-navy hover:text-blue hover:underline">{row.original.listing}</Link>
            {rt && <span className="block t-caption text-muted-ink tnum">Rating {rt.rating.toFixed(1)} from {rt.count}</span>}
          </span>
        )
      },
    },
    { accessorKey: "author", meta: { label: "Reviewer" }, header: "Reviewer" },
    { accessorKey: "stars", meta: { label: "Stars" }, header: ({ column }) => <SortHeader label="Stars" column={column} />, cell: ({ row }) => <span className="inline-flex items-center gap-1"><Stars value={row.original.stars} size={12} /><span className="sr-only">{row.original.stars} stars</span></span> },
    { accessorKey: "text", meta: { label: "Review" }, header: "Review", cell: ({ row }) => <span className="block max-w-[320px] whitespace-normal text-navy">{row.original.text}</span> },
    { accessorKey: "flag", meta: { label: "Flag" }, header: "Flag", cell: ({ row }) => (row.original.flag ? <span className="block max-w-[200px] whitespace-normal"><Pill tone="warn">Flagged</Pill> <span className="t-caption text-slate">{row.original.flag}</span></span> : <span className="text-muted-ink">—</span>) },
    { accessorKey: "createdAt", meta: { label: "Posted" }, header: ({ column }) => <SortHeader label="Posted" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.createdAt)}</span> },
    { id: "actions", enableHiding: false, header: "Actions", cell: ({ row }) => <Actions r={row.original.review} name={row.original.listing} /> },
  ]
  const flaggedCount = s.reviews.filter((r) => r.flagged && r.status === "live").length
  return (
    <AdminPage id="A-08" title="Reviews" perm="reviews" description="Removing a review hides it on the app, the web and the dashboard, and the rating recalculates.">
      <SegmentedControl
        label="Reviews"
        className="mb-4 w-[420px]"
        value={tab}
        onChange={setTab}
        options={[
          { value: "flagged", label: `Flagged (${flaggedCount})` },
          { value: "new", label: "New this week" },
          { value: "removed", label: "Removed" },
        ]}
      />
      <DataTable
        key={tab}
        label="Reviews"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        pageSize={10}
        initialSort={[{ id: "createdAt", desc: true }]}
        searchPlaceholder="Search business, reviewer or text"
        searchKey={(r) => `${r.listing} ${r.author} ${r.text}`}
        facets={[{ column: "stars", label: "Stars", options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n}★` })) }]}
        emptyTitle={tab === "flagged" ? "No flagged reviews" : "No reviews here"}
        emptyBody={tab === "flagged" ? "Nothing needs moderating right now." : "Nothing matches these filters."}
      />
    </AdminPage>
  )
}
