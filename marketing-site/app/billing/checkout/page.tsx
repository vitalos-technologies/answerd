import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { BillingFrame, Checkout } from "@/components/web/billing"
import { demoGate } from "@/lib/data/billing"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.billing.checkout.metaTitle, description: pages.billing.metaDescription, path: "/billing/checkout", noindex: true })

/** W-18 mock hosted checkout (?plan=desk or featured). Prototype: no card, nothing charged. */
export default function CheckoutPage() {
  const b = pages.billing
  return (
    <WebPage className="bg-sky">
      <BillingFrame label={b.prototype} title={b.checkout.heading}>
        <Checkout copy={b} gate={demoGate(pages.signIn.demo.slug)} />
      </BillingFrame>
    </WebPage>
  )
}
