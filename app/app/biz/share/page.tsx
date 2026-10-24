"use client"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { ShareProfile } from "@/components/biz/ops/ShareProfile"

/** B-29 Share your profile. */
export default function SharePage() {
  return (
    <OpsScreen id="B-29" title="Share your profile" back="/app/biz/more" ownerOnly>
      {({ biz, listing }) => (
        <div className="p-4">
          <ShareProfile biz={biz} listing={listing} />
        </div>
      )}
    </OpsScreen>
  )
}
