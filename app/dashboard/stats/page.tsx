"use client"
import { StatsPanel } from "@/components/biz/ops/StatsPanel"
import { DashPage } from "@/components/dashboard/kit"

/** Dashboard stats: the B-28 weekly enquiries chart and numbers, from the same Enquiry and Booking records. */
export default function StatsPage() {
  return (
    <DashPage id="B-28" title="Stats" sub="Calls, messages and bookings from Answerd, week by week." ownerOnly>
      {({ listing }) => (
        <div className="max-w-4xl">
          <StatsPanel listingId={listing.id} height={300} className="[&>dl]:md:grid-cols-3" />
        </div>
      )}
    </DashPage>
  )
}
