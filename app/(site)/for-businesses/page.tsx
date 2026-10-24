import type { Metadata } from "next"
import { BarChart3, CalendarCheck, Check, Inbox, PhoneIncoming, Store } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { SampleCall } from "@/components/web/marketing/SampleCall"
import { Container, Faqs, JsonLd, PillLink, SectionHead } from "@/components/web/ui"
import { faqLd, type Faq } from "@/components/web/data"

export const metadata: Metadata = {
  title: "For businesses: list free, never miss a customer",
  description: "List your business on Answerd for free, see every enquiry, and switch on an AI front desk that answers calls and texts. You'll never pay before you've had 10 enquiries from Answerd.",
  alternates: { canonical: "/for-businesses" },
}

const FAQS: Faq[] = [
  { q: "Is the listing really free?", a: "Yes. Claiming or adding your listing, replying to messages, taking bookings and seeing your enquiries are free for good." },
  { q: "When would I ever pay?", a: "Only if you choose the AI desk (£49/month after a 14-day free trial) or Featured (£29/month), both ex VAT. You'll never pay before you've had 10 enquiries from Answerd." },
  { q: "Does the desk pretend to be me?", a: "No. It says it's your Answerd assistant and an AI, tells callers the call is recorded, never invents prices outside your listed ranges and hands over to you for emergencies, complaints and price negotiation." },
  { q: "Do I need a new phone number?", a: "You get an Answerd number. Forward missed calls to it from your mobile (we show the codes for EE, O2, Vodafone and Three) and the desk picks up when you can't." },
  { q: "Can my staff use it?", a: "Yes. Invite staff by text. They see their own jobs and the shared inbox, and can pause the desk, but can't change billing or your profile." },
]

const FEATURES = [
  { icon: Store, title: "A free listing customers trust", body: "Services and prices with VAT stated, photos, hours, service area and checked credentials, on the web and in the app." },
  { icon: Inbox, title: "Enquiries you can see", body: "Every tracked call, message and booking request from Answerd in one inbox, from day one. Nothing hidden behind a paywall." },
  { icon: PhoneIncoming, title: "An AI front desk", body: "Answers missed calls and texts in your name, offers your free times, books jobs into your diary and hands over when it should." },
  { icon: CalendarCheck, title: "A diary that fills itself", body: "Instant booking or request to book, reminders, reschedules and one review request after every job." },
  { icon: BarChart3, title: "Stats that matter", body: "Profile views, search appearances, enquiries by week and how fast you respond." },
]

/** W-09: For businesses. No testimonials until real ones exist. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-09" />
      <JsonLd data={faqLd(FAQS)} />
      <section className="bg-navy text-white">
        <Container className="grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="t-label text-white/80">Answerd for businesses</p>
            <h1 className="mt-2 text-[30px] font-bold leading-9 tracking-[-0.02em] text-white md:text-[48px] md:leading-[56px]">Every business picks up.</h1>
            <p className="mt-4 max-w-xl t-body text-white/85">List free, see who&apos;s been trying to reach you, and switch on an AI front desk that answers calls and texts when you&apos;re up a ladder.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PillLink href="/claim" variant="white">
                Claim or add your business
              </PillLink>
              <PillLink href="/pricing" variant="ghost" className="border border-white/40 text-white hover:bg-white/10">
                See pricing
              </PillLink>
            </div>
            <ul className="mt-6 space-y-2">
              {["Free listing, for good", "Verified in minutes", "You'll never pay before you've had 10 enquiries from Answerd"].map((t) => (
                <li key={t} className="flex items-center gap-2 t-label font-normal text-white">
                  <Check className="size-4 shrink-0 text-teal" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <SampleCall />
        </Container>
      </section>

      <Container as="section" className="py-12 md:py-16" aria-labelledby="feat-h">
        <SectionHead id="feat-h" title="Everything you need to answer every customer" />
        <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="card p-6">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-blue-tint text-blue">
                <f.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 t-subhead">{f.title}</h3>
              <p className="mt-1 t-body text-slate">{f.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-y border-line bg-white" aria-labelledby="price-h">
        <Container className="py-12 md:py-16">
          <SectionHead id="price-h" title="Simple pricing" sub="All prices ex VAT." action={<PillLink href="/pricing" variant="secondary">See full pricing</PillLink>} />
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Free listing", "£0", "Listing, inbox, diary, bookings and reviews."],
              ["AI desk", "£49/month", "14-day free trial. Answers calls and texts for you."],
              ["Featured", "£29/month", "Top of your category and area, clearly labelled."],
            ].map(([name, price, body]) => (
              <li key={name} className="rounded-2xl bg-sky p-6">
                <p className="t-label text-navy">{name}</p>
                <p className="mt-1 text-[28px] font-bold leading-9 text-navy tnum">{price}</p>
                <p className="mt-1 t-label font-normal text-slate">{body}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 t-label text-navy">You&apos;ll never pay before you&apos;ve had 10 enquiries from Answerd.</p>
        </Container>
      </section>

      <Container className="py-12 md:py-16">
        <Faqs faqs={FAQS} />
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <PillLink href="/claim">Claim or add your business</PillLink>
          <PillLink href="/pricing" variant="secondary">
            See pricing
          </PillLink>
        </div>
      </Container>
    </>
  )
}
