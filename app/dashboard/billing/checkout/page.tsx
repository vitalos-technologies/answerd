"use client"
import { useSearchParams } from "next/navigation"
import { withSuspense } from "@/components/app/helpers"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { useOps } from "@/components/biz/ops/useOps"
import { OwnerOnly } from "@/components/dashboard/kit"
import { Checkout } from "@/components/dashboard/Hosted"

/** W-18 checkout: mock hosted checkout for the AI desk or Featured (?plan=desk|featured). */
function CheckoutPage() {
  const sp = useSearchParams()
  const { biz, staff } = useOps()
  const p = sp.get("plan")
  const plan = p === "desk" || p === "featured" ? p : null
  return (
    <>
      <ScreenMeta id="W-18" />
      {!biz ? null : staff ? <OwnerOnly /> : <Checkout key={plan ?? "none"} businessId={biz.id} plan={plan} />}
    </>
  )
}

export default withSuspense(CheckoutPage)
