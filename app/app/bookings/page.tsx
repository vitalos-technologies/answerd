"use client"
import * as React from "react"
import Link from "next/link"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ListingAvatar } from "@/components/answerd/Media"
import { StatusPill } from "@/components/answerd/Status"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { SegmentedControl } from "@/components/answerd/Status"
import { DataGate, signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { bookingTitle } from "@/lib/selectors"
import { fmtRelDay, fmtTime, ms } from "@/lib/time"
import type { Booking } from "@/lib/types"

const ACTIVE = ["requested", "confirmed", "on_the_way", "arrived"]

function isUpcoming(b: Booking, now: string) {
  return ACTIVE.includes(b.status) && ms(b.endAt) > ms(now) - 3_600_000
}

/** C-29: Upcoming and Past tabs. */
export default function BookingsPage() {
  const s = useStore()
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming")
  const userId = s.session.userId
  const mine = userId ? s.bookings.filter((b) => b.customerId === userId) : []
  const upcoming = mine.filter((b) => isUpcoming(b, s.clock)).sort((a, b) => ms(a.startAt) - ms(b.startAt))
  const past = mine.filter((b) => !isUpcoming(b, s.clock)).sort((a, b) => ms(b.startAt) - ms(a.startAt))
  const list = tab === "upcoming" ? upcoming : past

  return (
    <AppScreen
      id="C-29"
      tabs="customer"
      header={
        <div className="border-b border-line bg-white pb-3">
          <TopBar title="Bookings" tone="clear" />
          <div className="px-4">
            <SegmentedControl
              label="Bookings"
              value={tab}
              onChange={setTab}
              options={[
                { value: "upcoming", label: `Upcoming${upcoming.length ? ` (${upcoming.length})` : ""}` },
                { value: "past", label: "Past" },
              ]}
            />
          </div>
        </div>
      }
    >
      <div className="p-4">
        {!userId ? (
          <EmptyState title="Sign in to see your bookings" body="Book a local business and it shows up here." action={<ButtonLink href={signInHref("/app/bookings")} size="md">Sign in</ButtonLink>} />
        ) : (
          <DataGate isEmpty={!list.length} empty={<EmptyState title={tab === "upcoming" ? "No bookings yet" : "No past bookings"} body="When you book a local business it shows up here." action={<ButtonLink href="/app/search" size="md">Find a service</ButtonLink>} />}>
            <ul className="space-y-3">
              {list.map((b) => {
                const l = s.listings.find((x) => x.id === b.listingId)
                if (!l) return null
                const needsReview = b.status === "completed" && !b.reviewId
                return (
                  <li key={b.id}>
                    <Link href={`/app/bookings/${b.id}`} className="card flex items-start gap-3 p-4 hover:border-blue">
                      <ListingAvatar listing={l} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="t-subhead truncate">{bookingTitle(s, b)}</p>
                        <p className="truncate t-label font-normal text-slate">{l.name}</p>
                        <p className="t-label text-navy tnum">
                          {fmtRelDay(b.startAt, s.clock)}, {fmtTime(b.startAt)}
                        </p>
                        {b.changeRequest && b.status !== "cancelled" && <p className="mt-1 t-caption text-amber-ink">{b.changeRequest.reason === "proposed_by_business" ? "New time suggested" : "Change requested"}</p>}
                        {needsReview && <p className="mt-1 t-caption text-blue">Leave a review</p>}
                      </div>
                      <StatusPill status={b.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </DataGate>
        )}
      </div>
    </AppScreen>
  )
}
