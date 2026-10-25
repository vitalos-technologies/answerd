"use client"
// The super admin's rules (S-06) and switches (S-07) as other surfaces show them: W-10 pricing, the app's
// maintenance screen (C-48), the web maintenance banner, paused sign-ups and claims, and the S-09 customer-view bar.
import * as React from "react"
import { usePathname } from "next/navigation"
import { Check, Construction, PauseCircle, RefreshCw } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Mark } from "@/components/brand/Mark"
import { Container, Faqs, PillLink } from "@/components/web/ui"
import { useStore } from "@/lib/store"
import { platformFor, rulesFor } from "@/lib/selectors"
import { gbp, plural } from "@/lib/format"
import { cn } from "@/lib/utils"

type Sel = Parameters<typeof rulesFor>[0]

/** Rules in force on the demo clock (memoised: selectors must not return fresh objects). */
export function useRules() {
  const settings = useStore((s) => s.settings)
  const clock = useStore((s) => s.clock)
  return React.useMemo(() => rulesFor({ settings, clock } as Sel), [settings, clock])
}

export function usePlatform() {
  const settings = useStore((s) => s.settings)
  return React.useMemo(() => platformFor({ settings } as Sel), [settings])
}

// ------------------------------------------------------------------ W-10 pricing

/** "You'll never pay before you've had 10 enquiries from Answerd" with the threshold from S-06. */
export function GatePromise() {
  const r = useRules()
  return <>You&apos;ll never pay before you&apos;ve had {r.gateEnquiries} enquiries from Answerd</>
}

/** W-10 plan cards, note and FAQs. Prices, trial length and gate thresholds come from S-06. */
export function PricingPlans() {
  const r = useRules()
  const plans = [
    {
      name: "Free listing",
      price: "£0",
      unit: "for good",
      blurb: "Everything you need to be found and booked.",
      items: ["Claimed, verified listing on web and app", "Services, prices, photos and hours", "Inbox for calls, messages and booking requests", "Diary with instant or request booking", "Reviews and replies", "Stats on views and enquiries"],
      cta: "Claim or add free",
    },
    {
      name: "AI desk",
      price: gbp(r.deskPricePence),
      unit: "per month ex VAT",
      blurb: "Picks up calls and texts when you can't.",
      items: ["Answers missed calls and texts in your name", "Offers your free times and books jobs", "Follows up quotes at 2 and 7 days", "Asks for one review after each job", "Hands over emergencies, complaints and price talks", "Daily 7am digest by SMS"],
      cta: "Start your free trial",
      highlight: true,
    },
    {
      name: "Featured",
      price: gbp(r.featuredPricePence),
      unit: "per month ex VAT",
      blurb: "Top of your category in your area.",
      items: [`Up to ${r.featuredSlotsPerArea} Featured slot${r.featuredSlotsPerArea === 1 ? "" : "s"} per category and area`, "Clearly labelled “Featured” to customers", "Shown first in search and category pages", "Cancel any time"],
      cta: "Get Featured",
    },
  ]
  return (
    <Container className="py-12 md:py-16">
      <ul className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => (
          <li key={p.name} className={cn("card flex flex-col p-6 md:p-8", p.highlight && "ring-2 ring-blue")}>
            {p.highlight && <p className="mb-2 self-start rounded-full bg-blue-tint px-3 py-1 t-caption text-blue">{r.trialDays}-day free trial</p>}
            <h2 className="t-heading">{p.name}</h2>
            <p className="mt-1 t-label font-normal text-slate">{p.blurb}</p>
            <p className="mt-5" data-plan-price={p.name}>
              <span className="text-[40px] font-bold leading-none text-navy tnum">{p.price}</span> <span className="t-label font-normal text-slate">{p.unit}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {p.items.map((it) => (
                <li key={it} className="flex items-start gap-2 t-label font-normal text-slate">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-ink" aria-hidden /> {it}
                </li>
              ))}
            </ul>
            <PillLink href="/claim" variant={p.highlight ? "primary" : "secondary"} className="mt-8 w-full">
              {p.cta}
            </PillLink>
          </li>
        ))}
      </ul>
      <p className="mt-6 t-label font-normal text-slate">
        Prices exclude VAT at 20%. The AI desk trial lasts {r.trialDays} days; we&apos;ll remind you 3 days before it ends. Paid plans only start once Answerd has sent you {r.gateEnquiries} enquiries and the marketplace has been live {r.gateDays} days.
      </p>
      <Faqs
        className="mt-12"
        faqs={[
          { q: "What counts as an enquiry?", a: "A tracked call, a message or a booking request that came to you through Answerd. Profile views don't count." },
          { q: "What happens when my trial ends?", a: `We remind you 3 days before. The desk is ${gbp(r.deskPricePence)}/month ex VAT after the trial, and you won't be charged before Answerd has sent you ${r.gateEnquiries} enquiries. Not for you? Switch it off; your free listing stays.` },
          { q: "Can I cancel?", a: "Yes, any time from your dashboard. Your free listing stays live." },
        ]}
      />
    </Container>
  )
}

// ------------------------------------------------------------------ maintenance (S-07)

/** C-48 maintenance screen: every app screen shows it while maintenance mode is on. */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const p = usePlatform()
  const pathname = usePathname()
  if (!p.maintenance || pathname === "/app/states") return <>{children}</>
  return (
    <AppScreen id="C-48" bg="white" header={<TopBar title="Answerd" />}>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
        <span className="relative inline-flex size-20 items-center justify-center rounded-full bg-blue-tint">
          <Mark size={44} />
          <span className="absolute -bottom-1 -right-1 inline-flex size-8 items-center justify-center rounded-full bg-amber text-navy">
            <Construction className="size-4" aria-hidden />
          </span>
        </span>
        <h1 className="mt-4 t-heading">We&apos;re making Answerd better</h1>
        <p className="mt-1 t-body text-slate">{p.maintenanceMessage}</p>
        <Button className="mt-5" variant="secondary" size="md" onClick={() => window.location.reload()}>
          <RefreshCw /> Try again
        </Button>
      </div>
    </AppScreen>
  )
}

/** Web: a banner above the header while maintenance mode is on, with the S-07 message. */
export function MaintenanceBanner() {
  const p = usePlatform()
  if (!p.maintenance) return null
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-amber-tint px-4 py-2.5 text-center t-label text-navy">
      <Construction className="size-4 shrink-0 text-amber-ink" aria-hidden />
      <span>
        <span className="font-semibold">Maintenance:</span> {p.maintenanceMessage}
      </span>
    </div>
  )
}

// ------------------------------------------------------------------ paused sign-ups and claims (S-07)

export function useSwitch(key: "signups" | "claims" | "payments" | "ask") {
  return usePlatform()[key]
}

/** A full-screen paused state for a blocked flow (C-08, B-01, W-11). */
export function PausedNotice({ title, body, action, className }: { title: string; body: string; action: { href: string; label: string }; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)} role="status">
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-amber-tint">
        <PauseCircle className="size-8 text-amber-ink" aria-hidden />
      </span>
      <h1 className="mt-4 t-heading">{title}</h1>
      <p className="mt-1 max-w-md t-body text-slate">{body}</p>
      <ButtonLink href={action.href} size="md" className="mt-5">
        {action.label}
      </ButtonLink>
    </div>
  )
}

/** C-06: existing customers can still sign in while new sign-ups are paused. */
export function SignupsPausedBanner({ className }: { className?: string }) {
  const on = useSwitch("signups")
  if (on) return null
  return (
    <Banner tone="warning" className={className} title="New sign-ups are paused">
      If you already have an Answerd account, sign in as usual. New accounts open again soon.
    </Banner>
  )
}

/** W-11: claims and new listings paused. */
export function ClaimsGate({ children }: { children: React.ReactNode }) {
  const on = useSwitch("claims")
  if (on) return <>{children}</>
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <PausedNotice title="Claims are paused for now" body="We've paused new claims and listings for a short while. Your business can still be found and called on Answerd. Please try again later." action={{ href: "/", label: "Back to Answerd" }} className="card" />
    </div>
  )
}

/** "2 hours" from S-06, for copy that quotes the booking-request window. */
export function RequestWindow() {
  const r = useRules()
  return <>{plural(r.requestExpiryHours, "hour")}</>
}

