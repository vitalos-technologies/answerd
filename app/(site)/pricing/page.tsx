import type { Metadata } from "next"
import { Check, ShieldCheck } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Container, Faqs, PageHero, PillLink } from "@/components/web/ui"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free listing £0. AI desk £49/month with a 14-day free trial. Featured £29/month. All prices ex VAT. You'll never pay before you've had 10 enquiries from Answerd.",
  alternates: { canonical: "/pricing" },
}

const PLANS = [
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
    price: "£49",
    unit: "per month ex VAT",
    blurb: "Picks up calls and texts when you can't.",
    items: ["Answers missed calls and texts in your name", "Offers your free times and books jobs", "Follows up quotes at 2 and 7 days", "Asks for one review after each job", "Hands over emergencies, complaints and price talks", "Daily 7am digest by SMS"],
    cta: "Start your free trial",
    highlight: true,
  },
  {
    name: "Featured",
    price: "£29",
    unit: "per month ex VAT",
    blurb: "Top of your category in your area.",
    items: ["Up to 3 Featured slots per category and area", "Clearly labelled “Featured” to customers", "Shown first in search and category pages", "Cancel any time"],
    cta: "Get Featured",
  },
]

/** W-10: Pricing. All prices ex VAT. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-10" />
      <PageHero eyebrow="Pricing" title="Free to list. Pay only when it's working." sub="All prices are ex VAT. Cancel any time from your dashboard.">
        <p className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-teal-tint px-4 py-3 t-label text-navy">
          <ShieldCheck className="size-5 shrink-0 text-teal-ink" aria-hidden /> You&apos;ll never pay before you&apos;ve had 10 enquiries from Answerd
        </p>
      </PageHero>
      <Container className="py-12 md:py-16">
        <ul className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <li key={p.name} className={cn("card flex flex-col p-6 md:p-8", p.highlight && "ring-2 ring-blue")}>
              {p.highlight && <p className="mb-2 self-start rounded-full bg-blue-tint px-3 py-1 t-caption text-blue">14-day free trial</p>}
              <h2 className="t-heading">{p.name}</h2>
              <p className="mt-1 t-label font-normal text-slate">{p.blurb}</p>
              <p className="mt-5">
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
        <p className="mt-6 t-label font-normal text-slate">Prices exclude VAT at 20%. The AI desk trial lasts 14 days; we&apos;ll remind you 3 days before it ends. Paid plans only start once Answerd has sent you 10 enquiries and the marketplace has been live 60 days.</p>
        <Faqs
          className="mt-12"
          faqs={[
            { q: "What counts as an enquiry?", a: "A tracked call, a message or a booking request that came to you through Answerd. Profile views don't count." },
            { q: "What happens when my trial ends?", a: "We remind you 3 days before. The desk is £49/month ex VAT after the trial, and you won't be charged before Answerd has sent you 10 enquiries. Not for you? Switch it off; your free listing stays." },
            { q: "Can I cancel?", a: "Yes, any time from your dashboard. Your free listing stays live." },
          ]}
        />
      </Container>
    </>
  )
}
