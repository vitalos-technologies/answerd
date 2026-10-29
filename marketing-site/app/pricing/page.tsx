import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { JsonLd, PageHeader } from "@/components/web/ui"
import { FaqList, faqJsonLd } from "@/components/web/faq-list"
import { PlanCards } from "@/components/web/plan-cards"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.pricing.metaTitle, description: pages.pricing.metaDescription, path: "/pricing" })

/** W-10: the public plans. Buying and managing a plan stays on /billing (W-18). */
export default function PricingPage() {
  const p = pages.pricing
  return (
    <WebPage>
      <JsonLd data={faqJsonLd(p.faqs)} />
      <PageHeader crumbs={[{ name: pages.common.home, href: "/" }, { name: p.metaTitle, href: "/pricing" }]} eyebrow={p.eyebrow} title={p.heading}>
        <p className="t-lead mt-4 max-w-[46rem]">{p.lead}</p>
      </PageHeader>
      <div className="container-site flex flex-col gap-16 py-12 md:gap-20 md:py-16">
        <PlanCards cta={p.start} ctaFree={p.startFree} />
        <FaqList id="pricing-faqs" heading={p.faqsHeading} items={p.faqs} />
      </div>
    </WebPage>
  )
}
