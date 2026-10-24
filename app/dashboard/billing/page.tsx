"use client"
import { PlanBilling } from "@/components/biz/account/PlanBilling"
import { FeaturedAvailability } from "@/components/biz/account/FeaturedAvailability"
import { DashPage, Panel } from "@/components/dashboard/kit"
import { PORTAL_HREF } from "@/components/dashboard/links"

/** W-18 Dashboard billing: plan cards, monetise-gate progress, checkout for the AI desk and Featured, the billing portal. */
export default function BillingPage() {
  return (
    <DashPage id="W-18" title="Billing" sub="Your listing is free for good. Prices exclude VAT." ownerOnly>
      {({ biz }) => (
        <div className="space-y-8">
          <PlanBilling businessId={biz.id} wide manageHref={PORTAL_HREF} portalHref={PORTAL_HREF} manageLabel="Manage payment method and invoices" />
          <Panel title="Featured slots">
            <div className="max-w-2xl">
              <FeaturedAvailability businessId={biz.id} />
            </div>
          </Panel>
        </div>
      )}
    </DashPage>
  )
}
