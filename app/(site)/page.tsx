import type { Metadata } from "next"
import Link from "next/link"
import { CalendarCheck, MessageCircle, Search, ShieldCheck, Star } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { CategoryTile } from "@/components/answerd/Search"
import { Mark } from "@/components/brand/Mark"
import { HeroSearch, InstantNear } from "@/components/web/home"
import { AskAnswerdButton } from "@/components/web/chrome"
import { AppQr } from "@/components/web/AppQr"
import { Container, JsonLd, PillLink, SectionHead, StoreBadges } from "@/components/web/ui"
import { SITE } from "@/components/web/data"
import { HOME_CATEGORIES, LEAF_CATEGORIES } from "@/lib/categories"
import { CITY_AREAS } from "@/components/web/data"

export const metadata: Metadata = {
  title: { absolute: "Answerd: local help, just a message away" },
  description: "Find, call, message and book local plumbers, cleaners, mechanics, barbers and more near you. Every business picks up.",
  alternates: { canonical: "/" },
}

const STEPS = [
  { icon: Search, title: "Find", body: "Search any local service with your postcode. See prices, reviews and who replies fastest." },
  { icon: MessageCircle, title: "Call, message or book", body: "Reach the business in two taps. If they're busy, their Answerd desk picks up." },
  { icon: Star, title: "Review", body: "After the job, leave an honest review so your neighbours know who to trust." },
]

/** W-01: Home. */
export default function Home() {
  const popular = HOME_CATEGORIES.map((id) => LEAF_CATEGORIES.find((c) => c.id === id)!).filter(Boolean)
  return (
    <>
      <ScreenMeta id="W-01" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Answerd",
          url: SITE,
          potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={search_term_string}`, "query-input": "required name=search_term_string" },
        }}
      />
      <section className="relative overflow-hidden bg-white">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-blue-tint opacity-70 max-md:hidden" />
        <Container className="relative grid items-center gap-10 py-12 md:py-20 lg:grid-cols-[1.25fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-teal-tint px-3 py-1 t-caption text-teal-ink">
              <span className="size-2 rounded-full bg-teal animate-pulse-dot" aria-hidden /> Every business picks up.
            </p>
            <h1 className="t-display mt-4 max-w-xl">Local help, just a message away.</h1>
            <p className="mt-3 max-w-lg t-body text-slate">Plumbers, cleaners, mechanics, barbers and every other local service. Call, message or book in two taps.</p>
            <HeroSearch className="mt-6 max-w-2xl" />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="t-label font-normal text-slate">Not sure who you need?</span>
              <AskAnswerdButton className="h-10 bg-blue-tint px-4 text-blue hover:bg-[#dbe5ff]">Chat with Answerd</AskAnswerdButton>
            </div>
          </div>
          <div className="relative hidden lg:block" aria-hidden>
            <div className="card mx-auto max-w-sm space-y-3 p-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[hsl(200_70%_92%)] t-label font-semibold text-navy">SP</span>
                <div>
                  <p className="t-subhead">Swift Plumbing &amp; Heating</p>
                  <p className="t-caption text-teal-ink">Answerd desk online · replies in a minute</p>
                </div>
              </div>
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-blue px-3.5 py-2.5 t-label font-normal text-white">Hi, my boiler&apos;s making a banging noise. Are you free this week?</p>
              <div className="flex items-end gap-2">
                <Mark size={28} />
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-teal-tint px-3.5 py-2.5">
                  <p className="t-caption text-teal-ink">Answerd desk</p>
                  <p className="t-label font-normal text-navy">Sorry to hear that. I can book a Gas Safe engineer tomorrow at 9am or 2pm. Which suits you?</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container as="section" className="py-12 md:py-16" aria-labelledby="pop-h">
        <SectionHead id="pop-h" title="Popular services" action={<Link href="/search" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">See all services</Link>} />
        <ul className="mt-6 grid grid-cols-4 gap-x-2 gap-y-5 sm:grid-cols-8">
          {popular.map((c) => (
            <li key={c.id} className="flex justify-center">
              <CategoryTile icon={c.icon} label={c.plural} href={`/${c.slug}`} />
            </li>
          ))}
        </ul>
      </Container>

      <section className="border-y border-line bg-white" aria-labelledby="how-h">
        <Container className="py-12 md:py-16">
          <SectionHead id="how-h" title="How it works" action={<Link href="/how-it-works" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">More about how it works</Link>} />
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((st, i) => (
              <li key={st.title} className="rounded-2xl bg-sky p-6">
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-white text-blue shadow-card">
                  <st.icon className="size-6" aria-hidden />
                </span>
                <p className="mt-4 t-caption text-muted-ink tnum">Step {i + 1}</p>
                <h3 className="t-subhead">{st.title}</h3>
                <p className="mt-1 t-body text-slate">{st.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <Container as="section" className="py-12 md:py-16" aria-labelledby="instant-h">
        <SectionHead id="instant-h" title="Businesses that respond instantly near you" sub="Their Answerd desk picks up calls and messages straight away, and says it's an AI." />
        <div className="mt-6">
          <InstantNear />
        </div>
      </Container>

      <section className="bg-navy text-white" aria-labelledby="biz-h">
        <Container className="grid items-center gap-8 py-12 md:grid-cols-[1.4fr_1fr] md:py-16">
          <div>
            <p className="t-label text-white/80">For businesses</p>
            <h2 id="biz-h" className="mt-2 text-[30px] font-bold leading-9 tracking-[-0.02em] text-white md:text-[40px] md:leading-[48px]">Every business picks up.</h2>
            <p className="mt-3 max-w-xl t-body text-white/85">List free, see every enquiry Answerd sends you, and switch on an AI front desk that answers calls and texts when you can&apos;t. You&apos;ll never pay before you&apos;ve had 10 enquiries from Answerd.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PillLink href="/for-businesses" variant="white">
                List your business
              </PillLink>
              <PillLink href="/claim" className="border border-white/40 bg-transparent text-white hover:bg-white/10" variant="ghost">
                Claim your listing
              </PillLink>
            </div>
          </div>
          <ul className="grid gap-3">
            {[
              [ShieldCheck, "Free listing, verified in minutes"],
              [MessageCircle, "Enquiries you can see from day one"],
              [CalendarCheck, "Desk books jobs straight into your diary"],
            ].map(([I, t]) => {
              const Icon = I as typeof ShieldCheck
              return (
                <li key={t as string} className="flex items-center gap-3 rounded-2xl bg-white/10 p-4 t-label text-white">
                  <Icon className="size-5 shrink-0" aria-hidden /> {t as string}
                </li>
              )
            })}
          </ul>
        </Container>
      </section>

      <Container as="section" className="py-12 md:py-16" aria-labelledby="app-h">
        <div className="card grid items-center gap-8 p-6 md:grid-cols-[1fr_auto] md:p-10">
          <div>
            <h2 id="app-h" className="t-heading">
              Get the Answerd app
            </h2>
            <p className="mt-2 max-w-lg t-body text-slate">One app for customers and businesses. Get replies, booking updates and reminders on your phone.</p>
            <StoreBadges className="mt-5" />
            <Link href="/get-the-app" className="mt-4 inline-flex min-h-11 items-center t-label text-blue hover:underline">
              More about the app
            </Link>
          </div>
          <div className="max-md:hidden">
            <AppQr size={150} />
          </div>
        </div>
      </Container>

      <Container as="section" className="pb-16" aria-labelledby="areas-h">
        <h2 id="areas-h" className="t-subhead">
          Browse by area
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CITY_AREAS.map((a) => (
            <li key={a.slug}>
              <Link href={`/areas/${a.slug}`} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
                {a.name}
              </Link>
            </li>
          ))}
          {["plumbers/croydon", "electricians/croydon", "cleaners/south-norwood", "barbers/birmingham", "cleaners/manchester"].map((p) => {
            const [c, a] = p.split("/")
            const cat = LEAF_CATEGORIES.find((x) => x.slug === c)
            const area = CITY_AREAS.find((x) => x.slug === a)?.name ?? (a === "south-norwood" ? "South Norwood" : a)
            return (
              <li key={p}>
                <Link href={`/${p}`} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:border-blue">
                  {cat?.plural} in {area}
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </>
  )
}
