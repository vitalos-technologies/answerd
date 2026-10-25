import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { BillingFrame, Portal } from "@/components/web/billing"
import { demoGate } from "@/lib/data/billing"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.billing.portal.metaTitle, description: pages.billing.metaDescription, path: "/billing/portal", noindex: true })

/** W-18 mock billing portal: plans, card and invoices. Prototype: no card, nothing charged. */
export default function PortalPage() {
  const b = pages.billing
  return (
    <WebPage className="bg-sky">
      <BillingFrame label={b.prototypePortal} title={b.portal.heading}>
        <Portal copy={b} gate={demoGate(pages.signIn.demo.slug)} />
      </BillingFrame>
    </WebPage>
  )
}
