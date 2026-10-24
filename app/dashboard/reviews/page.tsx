"use client"
import { ReviewsPanel } from "@/components/biz/ops/ReviewsPanel"
import { ShareProfile } from "@/components/biz/ops/ShareProfile"
import { DashPage, Panel } from "@/components/dashboard/kit"

/** Dashboard reviews: the B-27 reviews list with one public reply each, beside B-29 Share your profile. */
export default function ReviewsPage() {
  return (
    <DashPage id="B-27" title="Reviews" sub="Reply once, in public. Replies show on your listing in the app and on the web." ownerOnly>
      {({ biz, listing }) => (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 max-w-3xl">
            <ReviewsPanel listingId={listing.id} />
          </div>
          <Panel title="Get more reviews" id="share">
            <ShareProfile biz={biz} listing={listing} />
          </Panel>
        </div>
      )}
    </DashPage>
  )
}
