import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, Bot, CalendarCheck, PhoneCall, Search, ShieldCheck, Star, type LucideIcon } from "lucide-react"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { PageHeader } from "@/components/web/ui"
import { btnPrimary } from "@/components/web/form"
import { GetAppButton } from "@/components/site/get-app"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.howItWorks.metaTitle, description: pages.howItWorks.metaDescription, path: "/how-it-works" })

const ICONS: Record<string, LucideIcon> = { Search, PhoneCall, CalendarCheck, Star, ShieldCheck, Bot, BadgeCheck }

/** W-08: how Answerd works for customers, and how trust and verification work. */
export default function HowItWorksPage() {
  const h = pages.howItWorks
  return (
    <WebPage>
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: h.metaTitle, href: "/how-it-works" }]} eyebrow={h.eyebrow} title={h.heading}>
        <p className="t-lead mt-4 max-w-[46rem]">{h.lead}</p>
      </PageHeader>
      <div className="container-site flex flex-col gap-16 py-12 md:gap-20 md:py-16">
        <section aria-labelledby="hiw-steps">
          <h2 id="hiw-steps" className="sr-only">
            {h.stepsHeading}
          </h2>
          <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {h.steps.map((s, i) => {
              const Icon = ICONS[s.icon] ?? Search
              return (
                <li key={s.title} className="card-site flex flex-col p-6 md:p-7">
                  <div className="flex items-center gap-3">
                    <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-blue-tint text-blue">
                      <Icon className="size-6" />
                    </span>
                    <span className="tnum text-[14px] font-semibold text-muted-ink">
                      <span className="sr-only">Step </span>
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="t-card-title mt-5">{s.title}</h3>
                  <p className="mt-2 text-slate">{s.body}</p>
                </li>
              )
            })}
          </ol>
        </section>

        <section aria-labelledby="hiw-trust">
          <h2 id="hiw-trust" className="t-section">
            {h.trustHeading}
          </h2>
          <ul className="mt-8 grid gap-5 md:grid-cols-2">
            {h.trust.map((t) => {
              const Icon = ICONS[t.icon] ?? ShieldCheck
              return (
                <li key={t.title} className="flex gap-4 rounded-2xl bg-sky p-6">
                  <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-teal-ink shadow-card">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-navy">{t.title}</h3>
                    <p className="mt-1 text-slate">{t.body}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="hiw-cta" className="card-site flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 id="hiw-cta" className="t-card-title">
              {h.ctaHeading}
            </h2>
            <p className="mt-2 text-slate">{h.ctaBody}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/search" className={btnPrimary}>
              <Search aria-hidden /> {h.search}
            </Link>
            <GetAppButton variant="secondary" label={h.getApp} />
          </div>
        </section>
      </div>
    </WebPage>
  )
}
