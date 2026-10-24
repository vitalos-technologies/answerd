"use client"
import { BizScreen } from "@/components/app/biz"
import { FeaturedAvailability } from "@/components/biz/account/FeaturedAvailability"

/** B-37 Featured */
export default function FeaturedPage() {
  return (
    <BizScreen id="B-37" title="Featured" back="/app/biz/more">
      {({ biz, readOnly }) => (
        <div className="px-4 py-4">
          <FeaturedAvailability businessId={biz!.id} readOnly={readOnly} />
        </div>
      )}
    </BizScreen>
  )
}
