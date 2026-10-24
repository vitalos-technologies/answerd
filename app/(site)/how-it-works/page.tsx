import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, CalendarCheck, Eye, MessageCircle, Phone, Search, ShieldCheck, Star } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { HeroSearch } from "@/components/web/home"
import { Container, PageHero, PillLink, SectionHead, StoreBadges } from "@/components/web/ui"

export const metadata: Metadata = {
  title: "How it works",
  description: "Find a local business, call, message or book in two taps, and review after the job. How Answerd checks businesses and labels its AI.",
  alternates: { canonical: "/how-it-works" },
}

const STEPS = [
  { icon: Search, title: "Find", body: "Search any service with your postcode, or tell Ask Answerd what's wrong. Results show prices, reviews, distance and how fast each business replies." },
  { icon: Phone, title: "Contact", body: "Call through an Answerd number, or send a message with photos. Businesses with an Answerd desk reply in about a minute, day or night." },
  { icon: CalendarCheck, title: "Book", body: "Pick a time from their real diary. Instant booking confirms straight away; request to book gets a yes or no within 2 hours." },
  { icon: Star, title: "Review", body: "After the job you get one review request. Reviews come only from completed bookings or tracked calls, so they're from real customers." },
]

const TRUST = [
  { icon: BadgeCheck, title: "Verified owners", body: "A business is only “claimed” once the owner proves it's theirs: a code to the listed number, a Companies House director check, or a document we check by hand." },
  { icon: ShieldCheck, title: "Checked credentials", body: "Gas Safe, NICEIC, NAPIT, insurance and DBS badges appear only after we've checked them. When one expires the badge comes off automatically." },
  { icon: Eye, title: "AI that's always labelled", body: "The Answerd desk and Ask Answerd are powered by AskBridge. They say they're an AI, every message they send is labelled, and a person can take over at any time." },
  { icon: MessageCircle, title: "Your number stays private", body: "Calls go through an Answerd number, so businesses know you found them here and you never have to share more than you want to." },
]

/** W-08: How it works. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-08" />
      <PageHero eyebrow="For customers" title="Local help in two taps" sub="Answerd is where every local business picks up. Here's how it works, and how we keep it trustworthy.">
        <HeroSearch className="mt-6 max-w-2xl" />
      </PageHero>
      <Container as="section" className="py-12 md:py-16" aria-labelledby="steps-h">
        <SectionHead id="steps-h" title="Find, contact, book, review" />
        <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((st, i) => (
            <li key={st.title} className="card p-6">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-blue-tint text-blue">
                <st.icon className="size-6" aria-hidden />
              </span>
              <p className="mt-4 t-caption text-muted-ink tnum">Step {i + 1}</p>
              <h3 className="t-subhead">{st.title}</h3>
              <p className="mt-1 t-body text-slate">{st.body}</p>
            </li>
          ))}
        </ol>
      </Container>
      <section className="border-y border-line bg-white" aria-labelledby="trust-h">
        <Container className="py-12 md:py-16">
          <SectionHead id="trust-h" title="Trust and verification" sub="What the badges mean and how we check them." />
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {TRUST.map((t) => (
              <li key={t.title} className="flex gap-4 rounded-2xl bg-sky p-6">
                <t.icon className="size-6 shrink-0 text-teal-ink" aria-hidden />
                <div>
                  <h3 className="t-subhead">{t.title}</h3>
                  <p className="mt-1 t-body text-slate">{t.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 t-label font-normal text-slate">
            Read the{" "}
            <Link href="/legal/reviews" className="text-blue underline underline-offset-2">
              review policy
            </Link>{" "}
            and the{" "}
            <Link href="/legal/call-recording" className="text-blue hover:underline">
              desk call-recording notice
            </Link>
            .
          </p>
        </Container>
      </section>
      <Container as="section" className="py-12 md:py-16" aria-labelledby="dl-h">
        <div className="card flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 id="dl-h" className="t-heading">
              Download the app
            </h2>
            <p className="mt-1 t-body text-slate">Replies, booking updates and reminders on your phone.</p>
          </div>
          <div className="flex flex-col gap-3">
            <StoreBadges />
            <PillLink href="/search" variant="secondary">
              Or search on the web
            </PillLink>
          </div>
        </div>
      </Container>
    </>
  )
}
