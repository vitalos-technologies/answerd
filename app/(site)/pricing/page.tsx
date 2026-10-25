import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { PageHero } from "@/components/web/ui"
import { GatePromise, PricingPlans } from "@/components/admin/super/live"

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free listing £0. AI desk £49/month with a 14-day free trial. Featured £29/month. All prices ex VAT. You'll never pay before you've had 10 enquiries from Answerd.",
  alternates: { canonical: "/pricing" },
}

/** W-10: Pricing. All prices ex VAT. Prices, trial length and the gate come from the S-06 rules (client side). */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-10" />
      <PageHero eyebrow="Pricing" title="Free to list. Pay only when it's working." sub="All prices are ex VAT. Cancel any time from your dashboard.">
        <p className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-teal-tint px-4 py-3 t-label text-navy">
          <ShieldCheck className="size-5 shrink-0 text-teal-ink" aria-hidden /> <GatePromise />
        </p>
      </PageHero>
      <PricingPlans />
    </>
  )
}
