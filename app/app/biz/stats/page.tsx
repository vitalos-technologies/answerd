"use client"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { StatsPanel } from "@/components/biz/ops/StatsPanel"

/** B-28 Stats. */
export default function StatsPage() {
  return (
    <OpsScreen id="B-28" title="Stats" back="/app/biz/more" ownerOnly>
      {({ listing }) => (
        <div className="p-4">
          <StatsPanel listingId={listing.id} />
        </div>
      )}
    </OpsScreen>
  )
}
