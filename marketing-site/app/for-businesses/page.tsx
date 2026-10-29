import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Inbox, PhoneIncoming, Store, type LucideIcon } from "lucide-react"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { JsonLd, PageHeader } from "@/components/web/ui"
import { btnPrimary, btnSecondary } from "@/components/web/form"
import { DeskDemo } from "@/components/web/desk-demo"
import { FaqList, faqJsonLd } from "@/components/web/faq-list"
import { PlanCards } from "@/components/web/plan-cards"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.forBusinesses.metaTitle, description: pages.forBusinesses.metaDescription, path: "/for-businesses" })

const ICONS: Record<string, LucideIcon> = { Store, Inbox, PhoneIncoming }

/** W-09: for businesses. Testimonials are real only, and there are none at launch, so the section is left out. */
export default function ForBusinessesPage() {
  const f = pages.forBusinesses
  return (
    <WebPage>
      <JsonLd data={faqJsonLd(f.faqs)} />
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: f.metaTitle, href: "/for-businesses" }]} eyebrow={f.eyebrow} title={f.heading}>
        <p className="t-lead mt-4 max-w-[46rem]">{f.lead}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/claim" className={btnPrimary}>
            {f.claim} <ArrowRight aria-hidden />
          </Link>
          <Link href="/pricing" className={btnSecondary}>
            {f.seePricing}
          </Link>
        </div>
      </PageHeader>
      <div className="container-site flex flex-col gap-16 py-12 md:gap-20 md:py-16">
        <ul className="grid gap-5 md:grid-cols-3">
          {f.features.map((c) => {
            const Icon = ICONS[c.icon] ?? Store
            return (
              <li key={c.title} className="card-site p-6 md:p-7">
                <span aria-hidden className="grid size-12 place-items-center rounded-xl bg-blue-tint text-blue">
                  <Icon className="size-6" />
                </span>
                <h2 className="t-card-title mt-5">{c.title}</h2>
                <p className="mt-2 text-slate">{c.body}</p>
              </li>
            )
          })}
        </ul>

        <section aria-labelledby="fb-demo" className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16">
          <div className="lg:pt-6">
            <h2 id="fb-demo" className="t-section">
              {f.demoHeading}
            </h2>
            <p className="t-lead mt-4">{f.demoBody}</p>
          </div>
          <DeskDemo copy={f} />
        </section>

        <section aria-labelledby="fb-pricing">
          <div className="max-w-[46rem]">
            <h2 id="fb-pricing" className="t-section">
              {f.pricingHeading}
            </h2>
            <p className="t-lead mt-4">{f.pricingBody}</p>
          </div>
          <div className="mt-8">
            <PlanCards compact cta={pages.pricing.start} ctaFree={pages.pricing.startFree} />
          </div>
          <Link href="/pricing" className={`${btnSecondary} mt-6`}>
            {f.seePricing} <ArrowRight aria-hidden />
          </Link>
        </section>

        <FaqList id="fb-faqs" heading={f.faqsHeading} items={f.faqs} />
      </div>
    </WebPage>
  )
}
