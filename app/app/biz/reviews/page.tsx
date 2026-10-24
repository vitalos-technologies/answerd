"use client"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { ReviewsPanel } from "@/components/biz/ops/ReviewsPanel"

/** B-27 Reviews. */
export default function ReviewsPage() {
  return (
    <OpsScreen id="B-27" title="Reviews" back="/app/biz/more" ownerOnly>
      {({ listing }) => (
        <div className="p-4">
          <ReviewsPanel listingId={listing.id} />
        </div>
      )}
    </OpsScreen>
  )
}
