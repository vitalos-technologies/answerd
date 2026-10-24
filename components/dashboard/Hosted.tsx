"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bot, CheckCircle2, CreditCard, Download, FileText, FlaskConical, Lock, Star } from "lucide-react"
import { useStore } from "@/lib/store"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { DataGate } from "@/components/app/helpers"
import { SmsConfirmSheet } from "@/components/biz/account/SmsConfirmSheet"
import { featuredRows } from "@/components/biz/account/FeaturedAvailability"
import { gateStatus, GATE_ENQUIRIES } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { addDays, fmtDate, fmtDateYear } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

export type PaidPlan = "desk" | "featured"

export const PLAN_INFO: Record<PaidPlan, { name: string; icon: typeof Bot; pricePence: number; lines: string[]; done: string }> = {
  desk: { name: "AI desk", icon: Bot, pricePence: 4900, lines: ["Answers calls and texts you miss", "Books jobs into your diary", "Responds instantly badge"], done: "You're subscribed. Your AI desk is active." },
  featured: { name: "Featured", icon: Star, pricePence: 2900, lines: ["Top 3 in your category and area", "Featured badge on results and the map"], done: "You're subscribed. You're Featured from today." },
}

export const vatOf = (pence: number) => Math.round(pence * 0.2)

/** The label every mock hosted page carries. */
export function PrototypeLabel({ children = "Prototype checkout, no card needed" }: { children?: React.ReactNode }) {
  return (
    <p className="inline-flex min-h-9 items-center gap-2 rounded-full bg-amber-tint px-3.5 t-label text-amber-ink">
      <FlaskConical className="size-4" aria-hidden /> {children}
    </p>
  )
}

/**
 * Mock hosted checkout (W-18): plan, price ex VAT, VAT and total. Confirm calls startSubscription
 * and returns to W-18 with a success toast. Paid plans stay locked until the monetise gate is met.
 */
export function Checkout({ businessId, plan }: { businessId: string; plan: PaidPlan | null }) {
  const s = useStore()
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const g = gateStatus(s, businessId)
  const listing = s.listings.find((l) => l.businessId === businessId)

  if (!plan) {
    return (
      <div className="space-y-5">
        <PrototypeLabel />
        <h1 className="t-title">Choose a plan</h1>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(PLAN_INFO) as PaidPlan[]).map((p) => (
            <Link key={p} href={`/dashboard/billing/checkout?plan=${p}`} className="card flex items-center gap-3 p-5 hover:border-blue">
              <PlanIcon plan={p} />
              <span className="min-w-0 flex-1">
                <span className="block t-subhead">{PLAN_INFO[p].name}</span>
                <span className="block t-label font-normal text-slate tnum">{gbp(PLAN_INFO[p].pricePence)}/month ex VAT</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  const info = PLAN_INFO[plan]
  const vat = vatOf(info.pricePence)
  const total = info.pricePence + vat
  const sub = s.subscriptions.find((x) => x.businessId === businessId && x.plan === plan)
  const active = sub?.status === "active" || sub?.status === "past_due"
  const noSlot = plan === "featured" && !featuredRows(s, businessId).some((r) => r.free > 0 && !r.mine)
  const blocked = !g.met ? "gate" : active ? "active" : noSlot ? "slot" : null

  const confirm = () => {
    setBusy(true)
    setTimeout(() => {
      useStore.getState().startSubscription(businessId, plan)
      toast(info.done)
      router.push("/dashboard/billing?checkout=success")
    }, 700)
  }

  return (
    <div className="space-y-5">
      <PrototypeLabel />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section aria-labelledby="co-summary" className="card p-6">
          <p className="t-caption text-muted-ink">{listing?.name ?? "Your business"} · subscribe to</p>
          <div className="mt-2 flex items-center gap-3">
            <PlanIcon plan={plan} />
            <h1 id="co-summary" className="t-title">
              {info.name}
            </h1>
          </div>
          <ul className="mt-3 list-disc pl-5 t-body text-slate">
            {info.lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <dl className="mt-5 divide-y divide-line border-y border-line t-body">
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate">{info.name}, monthly (ex VAT)</dt>
              <dd className="text-navy tnum">{gbp(info.pricePence)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="text-slate">VAT at 20%</dt>
              <dd className="text-navy tnum">{gbp(vat)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-3">
              <dt className="font-semibold text-navy">Total due today (inc VAT)</dt>
              <dd className="font-semibold text-navy tnum">{gbp(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 t-caption text-muted-ink tnum">
            Then {gbp(total)} a month inc VAT, next on {fmtDate(addDays(s.clock, 30))}. Cancel any time from your dashboard.
          </p>
        </section>

        <section aria-labelledby="co-pay" className="card p-6">
          <h2 id="co-pay" className="t-heading">
            Payment
          </h2>
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-line bg-sky p-4">
            <CreditCard className="size-6 shrink-0 text-navy" aria-hidden />
            <div className="min-w-0">
              <p className="t-label text-navy">No card needed</p>
              <p className="t-caption text-muted-ink">This prototype uses a test card ending 4242. Nothing is charged.</p>
            </div>
          </div>
          {blocked === "gate" && (
            <Banner tone="info" className="mt-4" icon={<Lock className="size-5" aria-hidden />} title={`Available after ${GATE_ENQUIRIES} enquiries`}>
              You&apos;ve had {Math.min(g.count, GATE_ENQUIRIES)} of {GATE_ENQUIRIES} enquiries from Answerd. You won&apos;t pay anything before you&apos;ve had {GATE_ENQUIRIES}.
            </Banner>
          )}
          {blocked === "active" && (
            <Banner tone="success" className="mt-4" title={`You already have ${info.name}`}>
              Manage or cancel it from billing.
            </Banner>
          )}
          {blocked === "slot" && (
            <Banner tone="warning" className="mt-4" title="No Featured slots free in your areas">
              We&apos;ll offer you a slot when one frees up.
            </Banner>
          )}
          <Button block className="mt-5" disabled={!!blocked} loading={busy} onClick={confirm}>
            {busy ? "Confirming…" : `Confirm and pay ${gbp(total)}`}
          </Button>
          <ButtonLink href="/dashboard/billing" variant="ghost" block className="mt-2">
            Cancel and go back
          </ButtonLink>
          <p className="mt-3 flex items-center justify-center gap-1.5 t-caption text-muted-ink">
            <Lock className="size-3.5" aria-hidden /> Prices exclude VAT unless marked inc VAT
          </p>
        </section>
      </div>
    </div>
  )
}

function PlanIcon({ plan }: { plan: PaidPlan }) {
  const I = PLAN_INFO[plan].icon
  return (
    <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
      <I className="size-5" aria-hidden />
    </span>
  )
}

/** Mock billing portal (W-18): subscriptions with Cancel (SMS code), payment method and invoices. */
export function BillingPortal({ businessId }: { businessId: string }) {
  const s = useStore()
  const [cancel, setCancel] = React.useState<PaidPlan | null>(null)
  const [cardOpen, setCardOpen] = React.useState(false)
  const subs = s.subscriptions.filter((x) => x.businessId === businessId && x.plan !== "free" && x.status !== "cancelled")
  const invoices = s.invoices.filter((x) => x.businessId === businessId)
  const listing = s.listings.find((l) => l.businessId === businessId)
  const owner = s.users.find((u) => u.id === s.session.userId)
  const hasCard = subs.some((x) => x.status === "active" || x.status === "past_due")
  const failed = subs.find((x) => x.status === "past_due")
  const label = (st: string) => (st === "active" ? "Active" : st === "trialing" ? "Free trial" : st === "past_due" ? "Payment failed" : st)

  return (
    <div className="space-y-5">
      <PrototypeLabel>Prototype billing portal, no card needed</PrototypeLabel>
      <div>
        <h1 className="t-title">Billing</h1>
        <p className="t-label font-normal text-slate">
          {listing?.name} · {owner ? `${owner.firstName} ${owner.lastName}` : ""}
          {owner?.email ? ` · ${owner.email}` : ""}
        </p>
      </div>
      {failed && (
        <Banner tone="error" title="Payment failed">
          We couldn&apos;t take this month&apos;s payment. Update your card to keep your desk.
        </Banner>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="bp-subs" className="card p-5">
          <h2 id="bp-subs" className="t-heading">
            Current plan
          </h2>
          {subs.length ? (
            <ul className="mt-3 divide-y divide-line">
              {subs.map((x) => {
                const plan = x.plan as PaidPlan
                const info = PLAN_INFO[plan]
                return (
                  <li key={x.id} className="flex flex-wrap items-center gap-3 py-3">
                    <PlanIcon plan={plan} />
                    <div className="min-w-0 flex-1">
                      <p className="t-subhead">{info?.name ?? x.plan}</p>
                      <p className="t-caption text-muted-ink tnum">
                        {label(x.status)} · {x.status === "trialing" ? `free until ${fmtDate(x.currentPeriodEnd)}` : `${gbp(x.pricePence)}/month ex VAT (${gbp(x.pricePence + vatOf(x.pricePence))} inc VAT) · renews ${fmtDate(x.currentPeriodEnd)}`}
                      </p>
                    </div>
                    {x.status !== "trialing" && (
                      <Button size="sm" variant="secondary" className="h-11 text-red" onClick={() => setCancel(plan)}>
                        Cancel {info?.name ?? "plan"}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 t-body text-slate">Free listing. £0, and your listing, inbox and diary stay free for good.</p>
          )}
          <Link href="/dashboard/billing" className="mt-2 inline-flex min-h-11 items-center t-label text-blue hover:underline">
            See plans
          </Link>
        </section>

        <section aria-labelledby="bp-card" className="card p-5">
          <h2 id="bp-card" className="t-heading">
            Payment method
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <CreditCard className="size-6 shrink-0 text-navy" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="t-label text-navy">{hasCard ? "Visa ending 4242" : "No card yet"}</p>
              <p className="t-caption text-muted-ink">{hasCard ? "Test card · expires 12/28" : "You'll add one when you subscribe."}</p>
            </div>
            {hasCard && (
              <Button size="sm" variant="secondary" className="h-11" onClick={() => setCardOpen(true)}>
                Update card
              </Button>
            )}
          </div>
          {cardOpen && (
            <div className="mt-4 rounded-xl border border-dashed border-line bg-sky p-4">
              <p className="t-label text-navy">No card needed</p>
              <p className="t-caption text-muted-ink">In the prototype, updating the card keeps the test card ending 4242.</p>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="h-11"
                  onClick={() => {
                    setCardOpen(false)
                    toast("Card updated")
                  }}
                >
                  Save card
                </Button>
                <Button size="sm" variant="ghost" className="h-11" onClick={() => setCardOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section aria-labelledby="bp-inv">
        <h2 id="bp-inv" className="mb-2 t-heading">
          Invoices
        </h2>
        <DataGate isEmpty={!invoices.length} rows={3} empty={<div className="card"><EmptyState title="No invoices yet" body="You won't pay anything before you've had 10 enquiries from Answerd." /></div>}>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] t-label">
              <caption className="sr-only">Invoices</caption>
              <thead>
                <tr className="border-b border-line text-left t-caption text-muted-ink">
                  <th className="px-4 py-2.5 font-medium">Date</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount (inc VAT)</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5">
                    <span className="sr-only">Download</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-2 text-navy tnum">{fmtDateYear(inv.at)}</td>
                    <td className="px-4 py-2 text-navy">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="size-4 text-muted-ink" aria-hidden /> {inv.description}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-navy tnum">{gbp(inv.amountPence)}</td>
                    <td className="px-4 py-2">
                      <span className={cn("inline-flex items-center gap-1 t-caption", inv.status === "paid" ? "text-teal-ink" : "text-red")}>
                        {inv.status === "paid" && <CheckCircle2 className="size-3.5" aria-hidden />}
                        {inv.status === "paid" ? "Paid" : inv.status === "failed" ? "Failed" : "Refunded"}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      <Button size="sm" variant="ghost" className="h-11" aria-label={`Download invoice: ${inv.description}, ${fmtDateYear(inv.at)}`} onClick={() => toast(`Invoice ${inv.id.toUpperCase()} downloaded (PDF)`)}>
                        <Download /> PDF
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataGate>
      </section>

      <ButtonLink href="/dashboard/billing" variant="secondary">
        Return to Answerd
      </ButtonLink>

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
