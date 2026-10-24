"use client"
import Link from "next/link"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { DeskPill, GateCard, JobsTimeline, NeedsYouList, TodayStatRow } from "@/components/biz/ops/Today"
import { SetupCard } from "@/components/biz/ops/SetupCard"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { fmtDateLong, greeting } from "@/lib/time"

/** B-18 Today: desk pill, stat row, Needs you, today's jobs, setup and gate cards. */
export default function Today() {
  return (
    <OpsScreen id="B-18" tabs>
      {({ s, biz, listing, staff, staffUserId }) => {
        const me = s.users.find((u) => u.id === s.session.userId)
        return (
          <div className="space-y-5 px-4 pb-6 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="t-title">
                  {greeting(s.clock)}, {me?.firstName ?? "there"}
                </h1>
                <p className="t-label font-normal text-slate">{fmtDateLong(s.clock)}</p>
              </div>
              {!staff && <DeskPill businessId={biz.id} className="shrink-0" />}
            </div>
            <DataGate isEmpty={false} empty={<EmptyState title="Clear day" body="No jobs in the diary and nothing needs you today." />} rows={3}>
              <TodayStatRow listingId={listing.id} staffUserId={staffUserId} />
              {!staff && <GateCard businessId={biz.id} className="mt-5" />}
              {!staff && (
                <div className="mt-5 empty:hidden">
                  <SetupCard biz={biz} listing={listing} />
                </div>
              )}
              <section className="mt-5" aria-labelledby="needs">
                <div className="mb-2 flex items-center justify-between">
                  <h2 id="needs" className="t-heading">
                    Needs you
                  </h2>
                  <Link href="/app/biz/inbox?filter=needs" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
                    Inbox
                  </Link>
                </div>
                <NeedsYouList listingId={listing.id} limit={5} />
              </section>
              <section className="mt-5" aria-labelledby="jobs">
                <div className="mb-2 flex items-center justify-between">
                  <h2 id="jobs" className="t-heading">
                    {staff ? "Your jobs today" : "Today's jobs"}
                  </h2>
                  <Link href="/app/biz/diary" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
                    Diary
                  </Link>
                </div>
                <JobsTimeline listingId={listing.id} staffUserId={staffUserId} />
              </section>
            </DataGate>
          </div>
        )
      }}
    </OpsScreen>
  )
}
