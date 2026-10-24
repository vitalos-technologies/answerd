"use client"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { useOps } from "@/components/biz/ops/useOps"
import { OwnerOnly } from "@/components/dashboard/kit"
import { BillingPortal } from "@/components/dashboard/Hosted"

/** W-18 billing portal: mock portal for the card, invoices and cancelling (SMS code required). */
export default function PortalPage() {
  const { biz, staff } = useOps()
  return (
    <>
      <ScreenMeta id="W-18" />
      {!biz ? null : staff ? <OwnerOnly /> : <BillingPortal businessId={biz.id} />}
    </>
  )
}
