"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate, withSuspense } from "@/components/app/helpers"
import { JobPanel } from "@/components/biz/ops/JobPanel"
import { BookingRequestCard } from "@/components/biz/ops/RequestCard"
import { AddToDiaryForm } from "@/components/biz/ops/AddToDiaryForm"
import { mondayOf } from "@/components/biz/ops/Diary"
import { isOpenRequest } from "@/components/biz/ops/data"
import { DashPage, SidePanel } from "@/components/dashboard/kit"
import { DiaryWeek } from "@/components/dashboard/DiaryWeek"
import { useStore } from "@/lib/store"
import { dayKey, ms } from "@/lib/time"
import type { Booking } from "@/lib/types"

/** W-15 Dashboard diary: week calendar with drag to reschedule, job side panel (B-24) and Add to diary (B-25). */
function DiaryPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const s = useStore()
  const jobId = sp.get("job")
  const newAt = sp.get("new")
  const job = jobId ? s.bookings.find((b) => b.id === jobId) : undefined
  const dayParam = sp.get("day")
  const initialDay = job ? dayKey(job.startAt) : dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : newAt && newAt !== "now" && !Number.isNaN(ms(newAt)) ? dayKey(newAt) : dayKey(s.clock)
  const [week, setWeek] = React.useState(() => mondayOf(initialDay))
  // Opening a job from elsewhere (a link with ?job=) shows the week it is in
  const [shownFor, setShownFor] = React.useState(jobId)
  if (jobId !== shownFor) {
    setShownFor(jobId)
    if (job) setWeek(mondayOf(dayKey(job.startAt)))
  }

  const setParams = (p: Record<string, string>) => {
    const q = new URLSearchParams(p).toString()
    router.replace(`/dashboard/diary${q ? `?${q}` : ""}`, { scroll: false })
  }
  const close = () => setParams({})
  const open = (b: Booking) => setParams({ job: b.id })

  return (
    <DashPage
      id="W-15"
      title={({ staff }) => (staff ? "Your diary" : "Diary")}
      sub={({ staff }) => (staff ? "Jobs assigned to you" : undefined)}
      actions={({ staff }) =>
        staff ? null : (
          <Button size="md" onClick={() => setParams({ new: "now" })}>
            <CalendarPlus /> Add to diary
          </Button>
        )
      }
    >
      {({ biz, listing, staff, staffUserId }) => {
        const request = job && isOpenRequest(job)
        const panelTitle = job ? (job.status === "requested" ? `Booking request: ${job.customerName}` : job.customerName) : "Add to diary"
        return (
          <>
            <DataGate isEmpty={false} rows={6} empty={<EmptyState title="Nothing in the diary" body="Jobs and blocked time show here as they're booked." />}>
              <DiaryWeek listingId={listing.id} businessId={biz.id} staffUserId={staffUserId} canAdd={!staff} weekStart={week} onWeekChange={setWeek} selectedId={jobId} onOpen={open} onAdd={(at) => setParams({ new: at })} />
            </DataGate>
            <SidePanel open={!!jobId || (!!newAt && !staff)} onClose={close} title={jobId ? panelTitle : "Add to diary"}>
              {jobId ? (
                job ? (
                  request ? (
                    <BookingRequestCard key={job.id} bookingId={job.id} />
                  ) : (
                    <JobPanel key={job.id} bookingId={job.id} />
                  )
                ) : (
                  <EmptyState title="Job not found" body="It may have been removed or belong to another business." />
                )
              ) : (
                <div className="card p-4">
                  <AddToDiaryForm
                    key={newAt}
                    listingId={listing.id}
                    businessId={biz.id}
                    at={newAt && newAt !== "now" ? newAt : undefined}
                    onSaved={(_, day) => {
                      setWeek(mondayOf(day))
                      close()
                    }}
                  />
                </div>
              )}
            </SidePanel>
          </>
        )
      }}
    </DashPage>
  )
}

export default withSuspense(DiaryPage)
