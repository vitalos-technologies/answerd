"use client"
import { Plus } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { Diary, type DiaryView } from "@/components/biz/ops/Diary"
import { ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate, withSuspense } from "@/components/app/helpers"

/** B-23 Diary: Day, Week and List. */
function DiaryPage() {
  const sp = useSearchParams()
  const day = sp.get("day") ?? undefined
  const v = sp.get("view")
  const view: DiaryView | undefined = v === "week" || v === "list" || v === "day" ? v : undefined
  return (
    <OpsScreen id="B-23" tabs>
      {({ biz, listing, staff, staffUserId }) => (
        <div className="px-4 pb-6 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h1 className="t-title">{staff ? "Your diary" : "Diary"}</h1>
              {staff && <p className="t-caption text-muted-ink">Jobs assigned to you</p>}
            </div>
            {!staff && (
              <ButtonLink href="/app/biz/diary/new" size="md">
                <Plus /> Add
              </ButtonLink>
            )}
          </div>
          <DataGate isEmpty={false} empty={<EmptyState title="Nothing in the diary" body="Jobs and blocked time show here as they're booked." />}>
            <Diary key={`${day}-${view}`} listingId={listing.id} businessId={biz.id} staffUserId={staffUserId} canAdd={!staff} initialDay={day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined} initialView={view} />
          </DataGate>
        </div>
      )}
    </OpsScreen>
  )
}

export default withSuspense(DiaryPage)
