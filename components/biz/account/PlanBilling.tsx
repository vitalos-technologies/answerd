"use client"
import * as React from "react"
import Link from "next/link"
import { Bot, CreditCard, ExternalLink, FileText, Lock, Star, Store } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { deskFor, gateStatus, GATE_ENQUIRIES } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { fmtDate, fmtDateYear } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { ProgressBar } from "@/components/biz/desk/common"
import { SmsConfirmSheet } from "./SmsConfirmSheet"

export const CHECKOUT_HREF = (plan: "desk" | "featured") => `/dashboard/billing/checkout?plan=${plan}`

/** Monetise gate: nothing is charged before day 60 and 10 enquiries from Answerd. */
export function GateProgress({ businessId, className }: { businessId: string; className?: string }) {
  const s = useStore()
  const g = gateStatus(s, businessId)
  const shown = Math.min(g.count, GATE_ENQUIRIES)
  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="t-subhead">{g.met ? "Paid plans unlocked" : "Before you pay anything"}</p>
        <p className="shrink-0 t-label text-navy tnum">
          {shown} of {GATE_ENQUIRIES} enquiries
        </p>
      </div>
      <ProgressBar value={shown} max={GATE_ENQUIRIES} label="Enquiries from Answerd" className="mt-2" />
      <p className="mt-2 t-label font-normal text-slate">
        {g.met
          ? `Answerd has sent you ${g.count} enquiries. Paid plans are now available.`
          : g.count >= GATE_ENQUIRIES
            ? `You've had ${g.count} enquiries from Answerd. Paid plans open on ${fmtDate(g.gateDate)}.`
            : `You won't pay anything before you've had ${GATE_ENQUIRIES} enquiries from Answerd${g.daysOk ? "" : ` and before ${fmtDate(g.gateDate)}`}.`}
      </p>
    </div>
  )
}

const PLANS = [
  { plan: "desk" as const, icon: Bot, name: "AI desk", price: 4900, cta: "Upgrade", lines: ["Answers calls and texts you miss", "Books jobs into your diary", "Responds instantly badge"] },
  { plan: "featured" as const, icon: Star, name: "Featured", price: 2900, cta: "Get Featured", lines: ["Top 3 in your category and area", "Featured badge on results"] },
]

/**
 * B-36 plan and billing: current plan, monetise-gate progress, plans with Upgrade / Get Featured (gated),
 * payment method and invoices. Cancel needs an SMS code. Reused by W-18.
 */
export function PlanBilling({ businessId, checkoutHref = CHECKOUT_HREF, manageHref = "/dashboard/billing", portalHref = "/dashboard/billing/portal", readOnly, wide, manageLabel = "Manage on web" }: { businessId: string; checkoutHref?: (plan: "desk" | "featured") => string; manageHref?: string; portalHref?: string; readOnly?: boolean; /** Desktop layout (W-18): plan cards and sections side by side from 768 px. */ wide?: boolean; manageLabel?: string }) {
  const s = useStore()
  const g = gateStatus(s, businessId)
  const desk = deskFor(s, businessId)
  const subs = s.subscriptions.filter((x) => x.businessId === businessId)
  const deskSub = subs.find((x) => x.plan === "desk")
  const featSub = subs.find((x) => x.plan === "featured")
  const invoices = s.invoices.filter((x) => x.businessId === businessId)
  const paid = subs.filter((x) => x.plan !== "free" && (x.status === "active" || x.status === "past_due"))
  const failed = subs.find((x) => x.status === "past_due")
  const [cancel, setCancel] = React.useState<"desk" | "featured" | null>(null)

  const current: { icon: typeof Bot; name: string; sub: string }[] = []
  if (deskSub?.status === "trialing" && desk?.status !== "off") current.push({ icon: Bot, name: "Desk trial", sub: `Free until ${fmtDate(deskSub.currentPeriodEnd)}` })
  if (deskSub?.status === "active") current.push({ icon: Bot, name: "AI desk", sub: `${gbp(deskSub.pricePence)}/month ex VAT · renews ${fmtDate(deskSub.currentPeriodEnd)}` })
  if (deskSub?.status === "past_due") current.push({ icon: Bot, name: "AI desk", sub: "Payment failed" })
  if (featSub?.status === "active") current.push({ icon: Star, name: "Featured", sub: `${gbp(featSub.pricePence)}/month ex VAT · renews ${fmtDate(featSub.currentPeriodEnd)}` })
  if (!current.length) current.push({ icon: Store, name: "Free listing", sub: "£0. Your listing, inbox and diary are free for good." })

  return (
    <div className="space-y-4">
      {failed && (
        <Banner tone="error" title="Payment failed" action={readOnly ? undefined : <Link href={portalHref} className="t-label text-blue hover:underline">Update your card</Link>}>
          We couldn&apos;t take this month&apos;s payment. Update your card to keep your desk.
        </Banner>
      )}
      <div className={wide ? "grid items-start gap-4 md:grid-cols-2" : "space-y-4"}>
      <div className="card p-4">
        <p className="t-caption text-muted-ink">Current plan</p>
        <ul className="mt-1 space-y-2">
          {current.map((c) => (
            <li key={c.name} className="flex items-center gap-3">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
                <c.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block t-subhead">{c.name}</span>
                <span className="block t-label font-normal text-slate tnum">{c.sub}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <GateProgress businessId={businessId} />
      </div>

      <section aria-labelledby="plans-h" className="space-y-2">
        <h2 id="plans-h" className="t-heading">
          Plans
        </h2>
        <div className={wide ? "grid gap-4 md:grid-cols-2" : "space-y-2"}>
        {PLANS.map((p) => {
          const sub = p.plan === "desk" ? deskSub : featSub
          const active = sub?.status === "active" || sub?.status === "past_due"
          return (
            <div key={p.plan} className="card p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sky text-navy">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="t-subhead">{p.name}</p>
                  <p className="t-label text-navy tnum">
                    {gbp(p.price)}/month <span className="font-normal text-muted-ink">ex VAT ({gbp(Math.round(p.price * 1.2))} inc VAT)</span>
                  </p>
                  <ul className="mt-1 list-disc pl-4 t-label font-normal text-slate">
                    {p.lines.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {!readOnly && (
                <div className="mt-3">
                  {active ? (
                    <Button variant="secondary" block onClick={() => setCancel(p.plan)}>
                      Cancel {p.name}
                    </Button>
                  ) : g.met ? (
                    <ButtonLink href={checkoutHref(p.plan)} block>
                      {p.cta} <ExternalLink />
                    </ButtonLink>
                  ) : (
                    <Button block disabled aria-describedby={`gate-${p.plan}`}>
                      <Lock /> Available after 10 enquiries
                    </Button>
                  )}
                  {!active && !g.met && (
                    <p id={`gate-${p.plan}`} className="mt-1.5 text-center t-caption text-muted-ink">
                      {p.plan === "desk" && deskSub?.status === "trialing" ? "Your free trial carries on until then." : "Checkout opens on the web once you reach the gate."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        </div>
      </section>

      <div className={wide ? "grid items-start gap-4 md:grid-cols-2" : "space-y-4"}>
      <section aria-labelledby="pm-h">
        <h2 id="pm-h" className="mb-2 t-heading">
          Payment method
        </h2>
        <div className="card flex items-center gap-3 p-4">
          <CreditCard className="size-6 shrink-0 text-navy" aria-hidden />
          <div className="min-w-0 flex-1">
            {paid.length ? (
              <>
                <p className="t-label text-navy">Visa ending 4242</p>
                <p className="t-caption text-muted-ink">Stripe test card · expires 12/28</p>
              </>
            ) : (
              <>
                <p className="t-label text-navy">No card yet</p>
                <p className="t-caption text-muted-ink">You&apos;ll add one at checkout on the web.</p>
              </>
            )}
          </div>
          {!readOnly && (
            <Link href={manageHref} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-label text-blue hover:underline">
              {manageLabel} <ExternalLink className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      </section>

      <section aria-labelledby="inv-h">
        <h2 id="inv-h" className="mb-2 t-heading">
          Invoices
        </h2>
        <DataGate isEmpty={!invoices.length} rows={2} empty={<div className="card"><EmptyState title="No invoices yet" body="You won't pay anything before you've had 10 enquiries from Answerd." /></div>}>
          <ul className="card divide-y divide-line">
            {invoices.map((inv) => (
              <li key={inv.id}>
                <button type="button" onClick={() => toast(`Invoice ${inv.id.toUpperCase()} downloaded (PDF)`)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-sky" aria-label={`Download invoice: ${inv.description}, ${fmtDateYear(inv.at)}`}>
                  <FileText className="size-5 shrink-0 text-navy" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block t-label text-navy">{inv.description}</span>
                    <span className="block t-caption text-muted-ink">{fmtDateYear(inv.at)}</span>
                  </span>
                  <span className="text-right">
                    <span className="block t-label text-navy tnum">{gbp(inv.amountPence)}</span>
                    <span className={cn("block t-caption", inv.status === "paid" ? "text-teal-ink" : "text-red")}>{inv.status === "paid" ? "Paid · inc VAT" : inv.status === "failed" ? "Failed" : "Refunded"}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </DataGate>
      </section>
      </div>

      <SmsConfirmSheet
        open={!!cancel}
        onClose={() => setCancel(null)}
        title={cancel === "desk" ? "Cancel the AI desk?" : "Cancel Featured?"}
        body={cancel === "desk" ? "The desk stops answering at once and your listing loses the Responds instantly badge." : "You lose your Featured slot at once and it goes to the next business on the waitlist."}
        confirmLabel={cancel === "desk" ? "Cancel AI desk" : "Cancel Featured"}
        destructive
        onConfirm={() => {
          if (cancel) s.cancelSubscription(businessId, cancel)
          toast(cancel === "desk" ? "AI desk cancelled" : "Featured cancelled")
          setCancel(null)
        }}
      />
    </div>
  )
}
