"use client"
import * as React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import { AdminPage, Kpi, Panel, Pill, ReasonButton } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { useStore } from "@/lib/store"
import { gbp } from "@/lib/format"
import { addDays, fmtDate, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Invoice, Subscription } from "@/lib/types"

const PLAN = { free: "Free", desk: "AI desk", featured: "Featured" } as const
const STATUS_TONE = { trialing: "info", active: "good", past_due: "bad", cancelled: "plain" } as const

function StripeLink({ id, kind }: { id: string; kind: "subscriptions" | "payments" }) {
  if (!id) return <span className="text-muted-ink">—</span>
  return (
    <a href={`https://dashboard.stripe.com/test/${kind}/${id}`} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 font-mono text-[12px] text-blue hover:underline">
      {id} <ExternalLink className="size-3" aria-hidden />
      <span className="sr-only">(opens Stripe in a new tab)</span>
    </a>
  )
}

/** A-17: subscriptions, trials ending, failed payments and refunds, with links to Stripe. */
export default function AdminBilling() {
  const s = useStore()
  const name = (businessId: string) => s.listings.find((l) => l.businessId === businessId)?.name ?? businessId
  const listingOf = (businessId: string) => s.listings.find((l) => l.businessId === businessId)?.id ?? ""
  const subs = s.subscriptions.filter((x) => x.plan !== "free")
  const trialsEnding = s.deskConfigs.filter((c) => c.trialEndsAt && ["trial", "live", "paused"].includes(c.status) && !s.subscriptions.some((x) => x.businessId === c.businessId && x.plan === "desk" && x.status === "active") && ms(c.trialEndsAt) >= ms(s.clock) && ms(c.trialEndsAt) <= ms(addDays(s.clock, 7)))
  const failed = s.invoices.filter((i) => i.status === "failed")
  const pastDue = s.subscriptions.filter((x) => x.status === "past_due")
  const mrr = subs.filter((x) => x.status === "active").reduce((a, x) => a + x.pricePence, 0)

  const subCols: ColumnDef<Subscription>[] = [
    { id: "business", accessorFn: (r) => name(r.businessId), meta: { label: "Business" }, header: ({ column }) => <SortHeader label="Business" column={column} />, cell: ({ row }) => <Link href={`/admin/listings/${listingOf(row.original.businessId)}`} className="font-medium text-navy hover:text-blue hover:underline">{name(row.original.businessId)}</Link> },
    { accessorKey: "plan", meta: { label: "Plan" }, header: "Plan", cell: ({ row }) => PLAN[row.original.plan] },
    { accessorKey: "status", meta: { label: "Status" }, header: "Status", cell: ({ row }) => <Pill tone={STATUS_TONE[row.original.status]}>{row.original.status.replace("_", " ")}</Pill> },
    { accessorKey: "pricePence", meta: { label: "Price" }, header: ({ column }) => <SortHeader label="Price" column={column} />, cell: ({ row }) => <span className="tnum">{gbp(row.original.pricePence)}/month inc. VAT</span> },
    { accessorKey: "currentPeriodEnd", meta: { label: "Period ends" }, header: ({ column }) => <SortHeader label="Period ends" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.currentPeriodEnd)}</span> },
    { accessorKey: "stripeId", meta: { label: "Stripe" }, header: "Stripe", cell: ({ row }) => <StripeLink id={row.original.stripeId} kind="subscriptions" /> },
  ]
  const invCols: ColumnDef<Invoice>[] = [
    { id: "business", accessorFn: (r) => name(r.businessId), meta: { label: "Business" }, header: ({ column }) => <SortHeader label="Business" column={column} /> },
    { accessorKey: "description", meta: { label: "Description" }, header: "Description" },
    { accessorKey: "at", meta: { label: "Date" }, header: ({ column }) => <SortHeader label="Date" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.at)}</span> },
    { accessorKey: "amountPence", meta: { label: "Amount" }, header: "Amount", cell: ({ row }) => <span className="tnum">{gbp(row.original.amountPence)} inc. VAT</span> },
    { accessorKey: "status", meta: { label: "Status" }, header: "Status", cell: ({ row }) => <Pill tone={row.original.status === "paid" ? "good" : row.original.status === "failed" ? "bad" : "info"}>{row.original.status}</Pill> },
    {
      id: "actions",
      enableHiding: false,
      header: "",
      cell: ({ row }) =>
        row.original.status === "paid" ? (
          <ReasonButton
            perm="billing"
            label="Refund"
            variant="secondary"
            title={`Refund ${gbp(row.original.amountPence)} to ${name(row.original.businessId)}?`}
            description="Refunds go back to the card in Stripe and take 5 to 10 working days."
            confirmLabel="Refund"
            presets={["Charged in error", "Goodwill: desk outage"]}
            onConfirm={(reason) => {
              useStore.getState().adminRefund(row.original.id, reason)
              toast("Refund issued")
            }}
          />
        ) : (
          <StripeLink id={`pi_${row.original.id.replace(/\W/g, "")}`} kind="payments" />
        ),
    },
  ]

  return (
    <AdminPage id="A-17" title="Billing" perm="billing" description="Answerd billing runs in Stripe. Prices include VAT.">
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="MRR" value={gbp(mrr)} sub="Active paid plans, ex VAT" />
        <Kpi label="Paid subscriptions" value={subs.filter((x) => x.status === "active").length} sub={`${subs.filter((x) => x.status === "trialing").length} trialing`} />
        <Kpi label="Trials ending in 7 days" value={trialsEnding.length} href="#trials" />
        <Kpi label="Failed payments" value={failed.length + pastDue.length} tone={failed.length + pastDue.length ? "bad" : "plain"} href="#failed" />
      </div>
      <h2 className="mb-3 text-[19px] font-semibold text-navy">Subscriptions</h2>
      <DataTable label="Subscriptions" data={subs} columns={subCols} getRowId={(r) => r.id} initialSort={[{ id: "currentPeriodEnd", desc: false }]} pageSize={8} facets={[{ column: "plan", label: "Plan", options: [{ value: "desk", label: "AI desk" }, { value: "featured", label: "Featured" }] }, { column: "status", label: "Status", options: ["trialing", "active", "past_due", "cancelled"].map((v) => ({ value: v, label: v.replace("_", " ") })) }]} searchPlaceholder="Search business" emptyTitle="No subscriptions" emptyBody="Paid plans and trials show here." />
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Panel title="Trials ending in 7 days" id="trials">
          {trialsEnding.length ? (
            <ul className="divide-y divide-line text-[13.5px]">
              {trialsEnding.map((c) => (
                <li key={c.businessId} className="flex min-h-11 items-center gap-2 py-1.5">
                  <Link href={`/admin/listings/${listingOf(c.businessId)}`} className="flex-1 font-medium text-navy hover:text-blue hover:underline">{name(c.businessId)}</Link>
                  <span className="text-slate">Ends {fmtDate(c.trialEndsAt!)} · {Math.ceil((ms(c.trialEndsAt!) - ms(s.clock)) / MS_DAY)} days</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-label font-normal text-muted-ink">No trials end this week.</p>
          )}
        </Panel>
        <Panel title="Failed payments" id="failed">
          {failed.length || pastDue.length ? (
            <ul className="divide-y divide-line text-[13.5px]">
              {pastDue.map((x) => (
                <li key={x.id} className="flex min-h-11 items-center gap-2 py-1.5">
                  <span className="flex-1 font-medium text-navy">{name(x.businessId)}</span>
                  <Pill tone="bad">past due</Pill>
                  <StripeLink id={x.stripeId} kind="subscriptions" />
                </li>
              ))}
              {failed.map((i) => (
                <li key={i.id} className="flex min-h-11 items-center gap-2 py-1.5">
                  <span className="flex-1 font-medium text-navy">{name(i.businessId)} · {i.description}</span>
                  <span className="tnum">{gbp(i.amountPence)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-label font-normal text-muted-ink">No failed payments. Owners are told by push, SMS and email if a payment fails.</p>
          )}
        </Panel>
      </div>
      <h2 className="mb-3 mt-6 text-[19px] font-semibold text-navy">Payments and refunds</h2>
      <DataTable label="Payments" data={s.invoices} columns={invCols} getRowId={(r) => r.id} initialSort={[{ id: "at", desc: true }]} pageSize={8} facets={[{ column: "status", label: "Status", options: ["paid", "failed", "refunded"].map((v) => ({ value: v, label: v })) }]} searchPlaceholder="Search payments" emptyTitle="No payments yet" emptyBody="Payments show here once a business pays for a plan." />
    </AdminPage>
  )
}
