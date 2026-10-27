"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, CreditCard, ExternalLink, FileText, Lock, MessagesSquare, Star, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import { fill } from "@/lib/fill"
import { focusRing } from "@/components/site/focus"
import { useDemo, writeDemo, type DemoPlan, type DemoState } from "@/lib/demo-session"
import type { pages } from "@/content/pages"
import { Note, PrototypeLabel, btnPrimary, btnSecondary, linkCls } from "./form"
import { apiEnabled } from "@/lib/api/client"
import { billingStatus, checkout, portal, signOut } from "@/lib/api/actions"

/*
 * W-18. Subscriptions are bought on the web (not in the app), so billing is the one business page the site
 * keeps. Without the API everything is a labelled prototype in sessionStorage: no card, no Stripe. In API mode
 * (NEXT_PUBLIC_ANSWERD_API_URL set) the plan and gate come from the API and checkout and the portal are Stripe.
 */

type Copy = (typeof pages)["billing"]
export type GateInfo = { count: number; total: number; date: string; dateOk: boolean; trialEnds: string; today: string; renews: string }

const ICONS = { free: Store, desk: MessagesSquare, featured: Star } as const
const gbp = (pence: number) => `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: pence % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
const vatOf = (pence: number) => Math.round(pence * 0.2)
const noop = () => () => {}
const useParam = (key: string) => React.useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get(key), () => null)

type LiveBilling = { plans: DemoPlan[]; gate: { count: number; total: number; met: boolean } | null }

/** API mode: the signed-in business's plan and monetise gate. Field names follow the prototype until the spec confirms them. */
function useLiveBilling(demo: DemoState | undefined): LiveBilling | null {
  const id = apiEnabled && demo?.user?.api ? demo.user.businessId : null
  const [live, setLive] = React.useState<LiveBilling | null>(null)
  React.useEffect(() => {
    if (!id) return
    let on = true
    billingStatus(id).then((r) => {
      if (!on || !r.ok) return
      const b = r.data
      const plans = (Array.isArray(b.plans) ? b.plans : [b.plan]).filter((p): p is DemoPlan => p === "desk" || p === "featured")
      setLive({ plans, gate: b.gate ? { count: b.gate.enquiries, total: b.gate.required, met: b.gate.met } : null })
    })
    return () => {
      on = false
    }
  }, [id])
  return live
}

function gateState(g: GateInfo, demo: DemoState, live?: LiveBilling | null) {
  // API mode: the API enforces the gate at checkout; show its numbers when it sends them
  if (apiEnabled && demo.user?.api) {
    const lg = live?.gate
    return { enqOk: lg ? lg.count >= lg.total : true, dateOk: lg ? lg.met : true, met: lg ? lg.met : true, count: lg?.count ?? 0 }
  }
  const enqOk = demo.gateMet || g.count >= g.total
  const dateOk = demo.gateMet || g.dateOk
  return { enqOk, dateOk, met: enqOk && dateOk, count: demo.gateMet ? Math.max(g.count, g.total) : g.count }
}

function PlanIcon({ plan }: { plan: keyof typeof ICONS }) {
  const I = ICONS[plan]
  return (
    <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-tint text-blue">
      <I className="size-5" />
    </span>
  )
}

function SignInPrompt({ copy, next }: { copy: Copy; next: string }) {
  return (
    <div className="card-site flex flex-col gap-4 p-6 sm:flex-row sm:items-center md:p-8">
      <div className="min-w-0 flex-1">
        <h2 className="t-card-title">{copy.signInHeading}</h2>
        <p className="mt-1 text-slate">{copy.signInBody}</p>
      </div>
      <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className={btnSecondary}>
        {copy.signIn}
      </Link>
    </div>
  )
}

// ------------------------------------------------------------------ /billing

export function BillingOverview({ copy, gate }: { copy: Copy; gate: GateInfo }) {
  const demo = useDemo()
  const success = useParam("checkout")
  const signedIn = !!demo?.user
  const live = useLiveBilling(demo)
  const g = demo ? gateState(gate, demo, live) : null
  const has = (p: DemoPlan) => (live ? live.plans.includes(p) : !!demo?.subs.some((s) => s.plan === p))

  const cta = (plan: DemoPlan, price: number) => {
    if (!g || !signedIn) return null
    if (has(plan))
      return (
        <Link href="/billing/portal" className={cn(btnSecondary, "w-full")}>
          {copy.yourPlan}
        </Link>
      )
    if (g.met) {
      const label = plan === "featured" ? copy.ctaFeatured : copy.ctaKeepDesk
      return (
        <Link href={`/billing/checkout?plan=${plan}`} className={cn(btnPrimary, "w-full whitespace-normal")}>
          {fill(label, { price: gbp(price) })}
        </Link>
      )
    }
    const label = g.enqOk ? fill(copy.lockedDate, { date: gate.date }) : fill(copy.lockedEnquiries, { total: gate.total })
    return (
      <>
        <button type="button" disabled aria-describedby={`gate-${plan}`} className={cn(btnPrimary, "w-full")}>
          <Lock aria-hidden /> {label}
        </button>
        <p id={`gate-${plan}`} className="mt-1.5 text-center text-[14px] leading-5 text-muted-ink">
          {!g.enqOk && !g.dateOk ? fill(copy.lockedBothNote, { date: gate.date }) : ""}
          {plan === "desk" ? `${!g.enqOk && !g.dateOk ? ". " : ""}${copy.trialCarriesOn}` : ""}
        </p>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {success && (success === "desk" || success === "featured") && has(success) && (
        <Note tone="success" title={fill(copy.success, { plan: copy.plans.find((p) => p.plan === success)!.name })} />
      )}

      {/* Signed out is the common case, so it is also what renders before the session is read (no swap, no shift) */}
      {!signedIn ? (
        <SignInPrompt copy={copy} next="/billing" />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div className="card-site p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[14px] leading-5 text-muted-ink">{fill(copy.account, { business: demo.user!.business, name: demo.user!.name })}</p>
              <button
                type="button"
                onClick={async () => {
                  if (demo.user?.api) await signOut()
                  writeDemo((s) => ({ ...s, user: null, subs: [] }))
                }}
                className={`inline-flex min-h-11 items-center rounded-full px-2 text-[14px] font-semibold text-blue hover:underline ${focusRing}`}
              >
                {copy.signOut}
              </button>
            </div>
            <p className="mt-3 text-[14px] leading-5 font-semibold tracking-[0.06em] text-muted-ink uppercase">{copy.currentPlan}</p>
            <ul className="mt-2 flex flex-col gap-3">
              {((live ? live.plans : demo.subs.map((s) => s.plan)).length ? (live ? live.plans : demo.subs.map((s) => s.plan)) : ["trial" as const]).map((p) => (
                <li key={p} className="flex items-center gap-3">
                  <PlanIcon plan={p === "trial" ? "desk" : p} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-navy">{p === "trial" ? copy.trial : copy.plans.find((x) => x.plan === p)!.name}</span>
                    <span className="tnum block text-[14px] leading-5 text-slate">
                      {p === "trial" ? fill(copy.trialSub, { date: gate.trialEnds }) : fill(copy.activeSub, { price: gbp(copy.plans.find((x) => x.plan === p)!.price), date: gate.renews })}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/billing/portal" className={`mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[15px] font-semibold text-blue hover:underline ${focusRing}`}>
              {copy.manage} <ExternalLink className="size-4" aria-hidden />
            </Link>
          </div>

          {(!apiEnabled || live?.gate) && (
            <div className="card-site p-6">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-navy">{g!.met ? copy.gateMet : copy.gateHeading}</p>
                <p className="tnum shrink-0 text-[15px] font-semibold text-navy">{fill(copy.gateCount, { n: Math.min(g!.count, gate.total), total: gate.total })}</p>
              </div>
              <div role="progressbar" aria-label={copy.gateBar} aria-valuemin={0} aria-valuemax={gate.total} aria-valuenow={Math.min(g!.count, gate.total)} className="mt-3 h-2.5 overflow-hidden rounded-full bg-sky">
                <div className="h-full rounded-full bg-blue" style={{ width: `${(Math.min(g!.count, gate.total) / gate.total) * 100}%` }} />
              </div>
              <p className="mt-3 text-[15px] leading-6 text-slate">
                {g!.met
                  ? fill(copy.gateOpen, { n: g!.count })
                  : g!.enqOk
                    ? fill(copy.gateDate, { n: g!.count, date: gate.date })
                    : g!.dateOk
                      ? fill(copy.gateEnquiries, { date: gate.date, total: gate.total })
                      : fill(copy.gateBoth, { total: gate.total, date: gate.date })}
              </p>
              {!apiEnabled && (
                <fieldset className="mt-4 border-t border-line pt-4">
                  <legend className="sr-only">{copy.previewLabel}</legend>
                  <p aria-hidden className="text-[14px] leading-5 font-semibold text-amber-ink">
                    {copy.previewLabel}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { v: false, label: copy.previewMock },
                      { v: true, label: copy.previewMet },
                    ].map((o) => (
                      <label key={o.label} className={cn("inline-flex min-h-10 cursor-pointer items-center rounded-full border px-4 text-[14px] font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue", demo.gateMet === o.v ? "border-blue bg-blue-tint text-navy" : "border-line text-navy hover:border-blue/50")}>
                        <input type="radio" name="gate-preview" className="sr-only" checked={demo.gateMet === o.v} onChange={() => writeDemo((s) => ({ ...s, gateMet: o.v }))} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </div>
          )}
        </div>
      )}

      <section aria-labelledby="plans-h">
        <h2 id="plans-h" className="text-[22px] leading-[30px] font-bold md:text-[26px] md:leading-[34px]">
          {copy.plansHeading}
        </h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {copy.plans.map((p) => (
            <li key={p.plan} className="card-site flex flex-col p-6">
              <div className="flex items-center gap-3">
                <PlanIcon plan={p.plan} />
                <h3 className="t-card-title">{p.name}</h3>
              </div>
              <p className="mt-4">
                <span className="tnum text-[32px] leading-10 font-bold text-navy">{gbp(p.price)}</span>
                {p.price > 0 && <span className="text-slate">{copy.perMonth}</span>}
              </p>
              <p className="tnum text-[14px] leading-5 text-muted-ink">{p.price ? fill(copy.exVat, { inc: gbp(p.price + vatOf(p.price)) }) : copy.freeForGood}</p>
              {"trial" in p && <p className="mt-2 inline-flex self-start rounded-full bg-teal-tint px-3 py-1 text-[13px] leading-5 font-semibold text-teal-ink">{p.trial}</p>}
              <ul className="mt-4 flex flex-1 flex-col gap-2 text-[15px] leading-6 text-slate">
                {p.lines.map((x) => (
                  <li key={x} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 size-4 shrink-0 text-teal-ink" aria-hidden />
                    {x}
                  </li>
                ))}
              </ul>
              {p.plan !== "free" && <div className="mt-5">{cta(p.plan, p.price)}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ------------------------------------------------------------------ /billing/checkout

export function Checkout({ copy, gate }: { copy: Copy; gate: GateInfo }) {
  const demo = useDemo()
  const param = useParam("plan")
  const c = copy.checkout
  const plan = param === "desk" || param === "featured" ? param : null
  if (demo === undefined) return <div className="card-site h-[320px] animate-pulse motion-reduce:animate-none" aria-hidden />
  if (!demo.user) return <SignInPrompt copy={copy} next={`/billing/checkout${plan ? `?plan=${plan}` : ""}`} />
  if (!plan)
    return (
      <Note title={c.choose}>
        <Link href="/billing" className={linkCls}>
          {c.unknown}
        </Link>
      </Note>
    )
  return <CheckoutFor copy={copy} gate={gate} demo={demo} plan={plan} />
}

function CheckoutFor({ copy, gate, demo, plan }: { copy: Copy; gate: GateInfo; demo: DemoState; plan: DemoPlan }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  const live = useLiveBilling(demo)
  const c = copy.checkout
  const user = demo.user!
  const api = apiEnabled && !!user.api
  if (api && !user.businessId)
    return (
      <Note title={copy.live.noBusiness}>
        <Link href="/claim" className={linkCls}>
          {copy.live.claim}
        </Link>
      </Note>
    )
  const info = copy.plans.find((p) => p.plan === plan)!
  const vat = vatOf(info.price)
  const total = info.price + vat
  const g = gateState(gate, demo, live)
  const active = live ? live.plans.includes(plan) : demo.subs.some((s) => s.plan === plan)
  const blocked = !g.met ? "gate" : active ? "active" : null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section aria-labelledby="co-summary" className="card-site p-6 md:p-8">
        <p className="text-[14px] leading-5 text-muted-ink">{fill(c.subscribeTo, { business: user.business })}</p>
        <div className="mt-2 flex items-center gap-3">
          <PlanIcon plan={plan} />
          <h2 id="co-summary" className="text-[26px] leading-8 font-bold">
            {info.name}
          </h2>
        </div>
        <ul className="mt-4 flex flex-col gap-1.5 text-slate">
          {info.lines.map((x) => (
            <li key={x} className="flex items-start gap-2">
              <CheckCircle2 className="mt-1 size-4 shrink-0 text-teal-ink" aria-hidden /> {x}
            </li>
          ))}
        </ul>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate">{fill(c.monthly, { plan: info.name })}</dt>
            <dd className="tnum text-navy">{gbp(info.price)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="text-slate">{c.vat}</dt>
            <dd className="tnum text-navy">{gbp(vat)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-3">
            <dt className="font-semibold text-navy">{c.total}</dt>
            <dd className="tnum font-semibold text-navy">{gbp(total)}</dd>
          </div>
        </dl>
        <p className="tnum mt-3 text-[14px] leading-5 text-muted-ink">{fill(c.then, { total: gbp(total), date: gate.renews })}</p>
      </section>

      <section aria-labelledby="co-pay" className="card-site p-6 md:p-8">
        <h2 id="co-pay" className="t-card-title">
          {c.payment}
        </h2>
        <div className={cn("mt-3 flex items-center gap-3 rounded-xl p-4", api ? "bg-sky" : "border border-dashed border-line bg-sky")}>
          <CreditCard className="size-6 shrink-0 text-navy" aria-hidden />
          {api ? (
            <p className="min-w-0 text-[15px] leading-6 text-slate">{copy.live.payment}</p>
          ) : (
            <div className="min-w-0">
              <p className="font-semibold text-navy">{c.noCard}</p>
              <p className="text-[14px] leading-5 text-slate">{c.noCardBody}</p>
            </div>
          )}
        </div>
        {error && <Note className="mt-4" title={error} />}
        {blocked === "gate" && (
          <Note className="mt-4" title={c.gateBlocked}>
            {fill(c.gateBlockedBody, { total: gate.total })}
          </Note>
        )}
        {blocked === "active" && (
          <Note tone="success" className="mt-4" title={fill(c.active, { plan: info.name })}>
            {c.activeBody}
          </Note>
        )}
        <button
          type="button"
          className={cn(btnPrimary, "mt-5 w-full")}
          disabled={!!blocked || busy}
          onClick={async () => {
            setBusy(true)
            if (api) {
              // Stripe Checkout: the API creates the session; Stripe sends the owner back to /billing
              const r = await checkout(user.businessId!, plan, `${window.location.origin}/billing?checkout=${plan}`)
              if (r.ok) return window.location.assign(r.data.url)
              setBusy(false)
              return setError(fill(copy.live.error, { message: r.message }))
            }
            writeDemo((s) => ({ ...s, subs: [...s.subs.filter((x) => x.plan !== plan), { plan, since: gate.today }] }))
            router.push(`/billing?checkout=${plan}`)
          }}
        >
          {busy ? (api ? copy.live.redirecting : c.confirming) : fill(api ? copy.live.continue : c.confirm, { total: gbp(total) })}
        </button>
        <Link href="/billing" className={cn(btnSecondary, "mt-2 w-full border-transparent")}>
          {c.cancel}
        </Link>
      </section>
    </div>
  )
}

// ------------------------------------------------------------------ /billing/portal

export function Portal({ copy, gate }: { copy: Copy; gate: GateInfo }) {
  const demo = useDemo()
  const [cancelled, setCancelled] = React.useState<string | null>(null)
  const c = copy.portal
  if (demo === undefined) return <div className="card-site h-[320px] animate-pulse motion-reduce:animate-none" aria-hidden />
  if (!demo.user) return <SignInPrompt copy={copy} next="/billing/portal" />
  if (apiEnabled && demo.user.api) return <LivePortal copy={copy} businessId={demo.user.businessId ?? null} />
  const subs = demo.subs.map((s) => ({ ...s, info: copy.plans.find((p) => p.plan === s.plan)! }))

  return (
    <div className="flex flex-col gap-6">
      <p className="text-slate">{fill(copy.account, { business: demo.user.business, name: demo.user.name })}</p>
      {cancelled && <Note tone="success" title={cancelled} />}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section aria-labelledby="bp-subs" className="card-site p-6">
          <h2 id="bp-subs" className="t-card-title">
            {copy.currentPlan}
          </h2>
          {subs.length ? (
            <ul className="mt-3 divide-y divide-line">
              {subs.map((s) => (
                <li key={s.plan} className="flex flex-wrap items-center gap-3 py-3">
                  <PlanIcon plan={s.plan} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-navy">{s.info.name}</p>
                    <p className="tnum text-[14px] leading-5 text-muted-ink">{fill(copy.activeSub, { price: gbp(s.info.price), date: gate.renews })}</p>
                  </div>
                  <button
                    type="button"
                    className={cn(btnSecondary, "h-11 px-4 text-[15px] text-red")}
                    onClick={() => {
                      writeDemo((st) => ({ ...st, subs: st.subs.filter((x) => x.plan !== s.plan) }))
                      setCancelled(fill(c.cancelled, { plan: s.info.name }))
                    }}
                  >
                    {fill(c.cancel, { plan: s.info.name })}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate">{c.noPlans}</p>
          )}
        </section>
        <section aria-labelledby="bp-card" className="card-site p-6">
          <h2 id="bp-card" className="t-card-title">
            {c.card}
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <CreditCard className="size-6 shrink-0 text-navy" aria-hidden />
            <div className="min-w-0">
              <p className="font-semibold text-navy">{subs.length ? c.cardOn : c.cardOff}</p>
              <p className="text-[14px] leading-5 text-muted-ink">{subs.length ? c.cardOnSub : c.cardOffSub}</p>
            </div>
          </div>
        </section>
      </div>
      <section aria-labelledby="bp-inv">
        <h2 id="bp-inv" className="t-card-title">
          {c.invoices}
        </h2>
        {subs.length ? (
          <div className="card-site mt-3 overflow-x-auto" tabIndex={0} role="region" aria-labelledby="bp-inv">
            <table className="w-full min-w-[520px] text-left text-[15px] leading-6">
              <caption className="sr-only">{c.invoices}</caption>
              <thead className="bg-sky text-navy">
                <tr>
                  {c.invoiceCols.map((h, i) => (
                    <th key={h} scope="col" className={cn("px-4 py-3 font-semibold", i === 2 && "text-right")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.plan} className="border-t border-line">
                    <td className="tnum px-4 py-3 text-navy">{s.since}</td>
                    <td className="px-4 py-3 text-navy">
                      <span className="inline-flex items-center gap-2">
                        <FileText className="size-4 text-muted-ink" aria-hidden /> {s.info.name}
                      </span>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-navy">{gbp(s.info.price + vatOf(s.info.price))}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-[14px] font-medium text-teal-ink">
                        <CheckCircle2 className="size-4" aria-hidden /> {c.paid}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-slate">{c.noInvoices}</p>
        )}
      </section>
      <Link href="/billing" className={cn(btnSecondary, "self-start")}>
        {c.back}
      </Link>
    </div>
  )
}

/** API mode: Stripe's Customer Portal handles cards, invoices and cancelling. */
function LivePortal({ copy, businessId }: { copy: Copy; businessId: string | null }) {
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState("")
  if (!businessId)
    return (
      <Note title={copy.live.noBusiness}>
        <Link href="/claim" className={linkCls}>
          {copy.live.claim}
        </Link>
      </Note>
    )
  return (
    <section aria-labelledby="bp-live" className="card-site flex flex-col gap-4 p-6 md:p-8">
      <h2 id="bp-live" className="t-card-title">
        {copy.live.portalHeading}
      </h2>
      <p className="text-slate">{copy.live.portalBody}</p>
      {error && <Note title={error} />}
      <button
        type="button"
        className={cn(btnPrimary, "self-start")}
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          const r = await portal(businessId, `${window.location.origin}/billing`)
          if (r.ok) return window.location.assign(r.data.url)
          setBusy(false)
          setError(fill(copy.live.error, { message: r.message }))
        }}
      >
        {busy ? copy.live.redirecting : copy.live.portalOpen} <ExternalLink aria-hidden />
      </button>
    </section>
  )
}

export function BillingFrame({ label, title, intro, children }: { label: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-site py-10 md:py-14">
      {/* API mode is real billing, so no prototype label */}
      {!apiEnabled && <PrototypeLabel>{label}</PrototypeLabel>}
      <h1 className="mt-4 text-[32px] leading-[38px] font-bold tracking-[-0.02em] md:text-[40px] md:leading-[48px]">{title}</h1>
      {intro && <p className="t-lead mt-3 max-w-[46rem]">{intro}</p>}
      <div className="mt-8">{children}</div>
    </div>
  )
}
