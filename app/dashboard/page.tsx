"use client"
import Link from "next/link"
import { CalendarPlus } from "lucide-react"
import { ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { DeskPill, GateCard, JobsTimeline, NeedsYouList, TodayStatRow } from "@/components/biz/ops/Today"
import { SetupChecklistCard, VerificationBanner } from "@/components/biz/profile"
import { DashPage, Panel } from "@/components/dashboard/kit"
import { EnquiriesChart } from "@/components/dashboard/EnquiriesChart"
import { dashOpsLinks, setupStepHref } from "@/components/dashboard/links"
import { fmtDateLong, greeting } from "@/lib/time"

/** W-13 Dashboard overview: stat row, Needs you, today's jobs, enquiries chart, setup banner and gate card. */
export default function Overview() {
  return (
    <DashPage
      id="W-13"
      title={({ s }) => `${greeting(s.clock)}, ${s.users.find((u) => u.id === s.session.userId)?.firstName ?? "there"}`}
      sub={({ s, listing }) => `${fmtDateLong(s.clock)} · ${listing.name}`}
      actions={({ biz, staff }) =>
        staff ? null : (
          <>
            <DeskPill businessId={biz.id} />
            <ButtonLink href={dashOpsLinks.newDiary()} size="md">
              <CalendarPlus /> Add to diary
            </ButtonLink>
          </>
        )
      }
    >
      {({ biz, listing, staff, staffUserId }) => (
        <DataGate isEmpty={false} rows={4} empty={<EmptyState title="Clear day" body="No jobs in the diary and nothing needs you today." />}>
          <div className="space-y-5">
            {!staff && (
              <>
                <VerificationBanner businessId={biz.id} />
                <div className="empty:hidden">
                  <SetupChecklistCard businessId={biz.id} href="/dashboard/profile" hrefFor={setupStepHref} className="border-l-4 border-blue" />
                </div>
                <GateCard businessId={biz.id} />
              </>
            )}
            <TodayStatRow listingId={listing.id} staffUserId={staffUserId} className="max-sm:grid-cols-2" />
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
              <div className="min-w-0 space-y-5">
                <Panel
                  title="Needs you"
                  action={
                    <Link href="/dashboard/inbox?f=needs" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
                      Open inbox
                    </Link>
                  }
                >
                  <NeedsYouList listingId={listing.id} limit={6} />
                </Panel>
                {!staff && <EnquiriesChart listingId={listing.id} statsHref="/dashboard/stats" />}
              </div>
              <Panel
                title={staff ? "Your jobs today" : "Today's jobs"}
                action={
                  <Link href="/dashboard/diary" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
                    Open diary
                  </Link>
                }
              >
                <JobsTimeline listingId={listing.id} staffUserId={staffUserId} />
              </Panel>
            </div>
          </div>
        </DataGate>
      )}
    </DashPage>
  )
}
