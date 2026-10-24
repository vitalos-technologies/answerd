"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { AddToDiaryForm } from "@/components/biz/ops/AddToDiaryForm"
import { withSuspense } from "@/components/app/helpers"

/** B-25 Add to diary: Booking or Block time. Save → B-23. */
function AddToDiary() {
  const router = useRouter()
  const at = useSearchParams().get("at") ?? undefined
  return (
    <OpsScreen id="B-25" title="Add to diary" back="/app/biz/diary" bg="white" ownerOnly>
      {({ biz, listing }) => (
        <div className="px-4 pb-8 pt-4">
          <AddToDiaryForm listingId={listing.id} businessId={biz.id} at={at} onSaved={(_, day) => router.push(`/app/biz/diary?day=${day}`)} />
        </div>
      )}
    </OpsScreen>
  )
}

export default withSuspense(AddToDiary)
