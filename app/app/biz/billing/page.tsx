"use client"
import { BizScreen } from "@/components/app/biz"
import { PlanBilling } from "@/components/biz/account/PlanBilling"

/** B-36 Plan and billing */
export default function BillingPage() {
  return (
    <BizScreen id="B-36" title="Plan and billing" back="/app/biz/more">
      {({ biz, readOnly }) => (
        <div className="px-4 py-4">
          <PlanBilling businessId={biz!.id} readOnly={readOnly} />
        </div>
      )}
    </BizScreen>
  )
}
