import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { BillingFrame, BillingOverview } from "@/components/web/billing"
import { demoGate } from "@/lib/data/billing"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.billing.metaTitle, description: pages.billing.metaDescription, path: "/billing" })

/** W-18: plans and billing. Subscriptions are bought on the web; everything else runs in the app. */
export default function BillingPage() {
  const b = pages.billing
  return (
    <WebPage className="bg-sky">
      <BillingFrame label={b.prototype} title={b.heading} intro={`${b.intro} ${b.gateLine}`}>
        <BillingOverview copy={b} gate={demoGate(pages.signIn.demo.slug)} />
      </BillingFrame>
    </WebPage>
  )
}
