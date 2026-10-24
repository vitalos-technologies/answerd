"use client"
import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarClock, ChevronRight, CircleHelp, Flag, MapPin, MessageCircle, Navigation, Phone, Receipt, Star, StickyNote } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { ListingAvatar } from "@/components/answerd/Media"
import { MockMap } from "@/components/answerd/MockMap"
import { StatusPill } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { alternativesFor, bookingTitle } from "@/lib/selectors"
import { lookupPostcode } from "@/lib/geo"
import { fmtDateLong, fmtDateTime, fmtTime, ms, MS_HOUR } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { BookingEvent } from "@/lib/types"

const EVENT_LABEL: Record<BookingEvent["type"], string> = {
  requested: "Request sent",
  confirmed: "Confirmed",
  declined: "Declined",
  expired: "Request expired",
  time_proposed: "New time suggested",
  change_requested: "Change requested",
  change_accepted: "New time confirmed",
  rescheduled: "Moved",
  on_the_way: "On the way",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Marked as a no-show",
  reminder_sent: "Reminder sent",
  review_requested: "Review requested",
  reviewed: "You left a review",
}
const ACTOR: Record<BookingEvent["actor"], string> = { customer: "You", owner: "Business", staff: "Business", desk: "Answerd desk", system: "Answerd" }

/** C-30: status timeline, details and actions. */
export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const l = s.listings.find((x) => x.id === b?.listingId)
  if (!b || !l || (s.session.userId && b.customerId !== s.session.userId)) {
    return (
      <AppScreen id="C-30" header={<TopBar title="Booking" back="/app/bookings" />}>
        <EmptyState title="Booking not found" body="It may belong to another account." action={<ButtonLink href="/app/bookings" size="md">Your bookings</ButtonLink>} />
      </AppScreen>
    )
  }
  const events = s.bookingEvents.filter((e) => e.bookingId === b.id).sort((x, y) => x.at.localeCompare(y.at))
  const active = ["requested", "confirmed"].includes(b.status) && ms(b.startAt) > ms(s.clock)
  const pc = lookupPostcode(b.postcode)
  const thread = s.threads.find((t) => t.listingId === l.id && t.customerId === b.customerId && t.channel === "app")
  const canReview = b.status === "completed" && !b.reviewId
  const proposal = b.changeRequest?.reason === "proposed_by_business" ? b.changeRequest : null
  const myChange = b.changeRequest && !proposal ? b.changeRequest : null
  const similar = b.status === "declined" ? alternativesFor(s, l.id, b.startAt) : []
  const noShowRecent = b.status === "no_show" && ms(s.clock) - ms(events.find((e) => e.type === "no_show")?.at ?? b.startAt) < 48 * MS_HOUR

  return (
    <AppScreen id="C-30" header={<TopBar title="Booking" back="/app/bookings" />}>
      <div className="space-y-3 p-4">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <ListingAvatar initials={l.initials} hue={l.hue} size={52} />
            <div className="min-w-0 flex-1">
              <p className="t-subhead">{bookingTitle(s, b)}</p>
              <Link href={`/app/b/${l.slug}`} className="t-label text-blue hover:underline">
                {l.name}
              </Link>
            </div>
            <StatusPill status={b.status} />
          </div>
        </div>

        {proposal && (
          <Banner tone="info" title={`${l.name} suggested ${fmtDateTime(proposal.startAt)}`} action={<div className="flex gap-2"><Button size="sm" onClick={() => (s.acceptProposal(b.id, proposal.startAt), toast("New time accepted"))}>Accept</Button><ButtonLink size="sm" variant="secondary" href={thread ? `/app/messages/${thread.id}` : `/app/b/${l.slug}/enquiry`}>Message</ButtonLink></div>}>
            They can&apos;t do {fmtTime(b.startAt)}.
          </Banner>
        )}
        {myChange && (
          <Banner tone="warning" title="Change requested">
            You asked to move to {fmtDateTime(myChange.startAt)}. {l.name} will reply soon.
          </Banner>
        )}
        {b.status === "requested" && b.requestExpiresAt && (
          <Banner tone="warning" title="Waiting for the business">
            {l.name} will confirm by {fmtTime(b.requestExpiresAt)}. If they can&apos;t, we&apos;ll suggest others free at the same time.
          </Banner>
        )}
        {b.status === "declined" && (
          <Banner tone="error" title={`${l.name} can't make it`}>
            <p>{b.declineReason}. These businesses are free around that time:</p>
            <ul className="mt-2 space-y-2">
              {similar.map((x) => (
                <li key={x.id}>
                  <Link href={`/app/b/${x.slug}`} className="flex items-center gap-2 rounded-xl bg-white p-2 hover:bg-sky">
                    <ListingAvatar initials={x.initials} hue={x.hue} size={32} />
                    <span className="flex-1 t-label text-navy">{x.name}</span>
                    <ChevronRight className="size-4 text-muted-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Banner>
        )}
        {noShowRecent && (
          <Banner tone="warning" title="Marked as a no-show" action={<Button size="sm" variant="secondary" onClick={() => (s.report("user", b.id, "No-show dispute", "Customer disputes the no-show"), toast("Thanks, our team will look into it"))}>Dispute this</Button>}>
            If you were there, you can dispute this within 48 hours.
          </Banner>
        )}
        {canReview && (
          <Link href={`/app/bookings/${b.id}/review`} className="flex items-center gap-3 rounded-2xl bg-blue p-4 text-white hover:bg-blue-hover">
            <Star className="size-6 fill-white" aria-hidden />
            <span className="flex-1">
              <span className="block t-subhead text-white">How did {l.name} do?</span>
              <span className="block t-label font-normal text-white/90">Leave a review to help your neighbours.</span>
            </span>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        )}

        <dl className="card divide-y divide-line">
          <Detail icon={CalendarClock} label="When" value={`${fmtDateLong(b.startAt)}, ${fmtTime(b.startAt)} to ${fmtTime(b.endAt)}`} />
          <Detail icon={MapPin} label="Where" value={`${b.address}${b.postcode ? `, ${b.postcode}` : ""}`} />
          <Detail icon={Receipt} label="Price" value={b.priceText || "Agreed with the business"} />
          {b.notes && <Detail icon={StickyNote} label="Notes" value={b.notes} />}
          <Detail icon={CircleHelp} label="Cancellation" value={b.policy} />
        </dl>
        {pc && <MockMap points={[{ id: b.id, lat: pc.lat, lng: pc.lng, label: "Job address" }]} center={pc} spanMiles={1.2} height={150} showSearchArea={false} ariaLabel="Map of the job address" />}

        <div className="grid grid-cols-2 gap-2">
          <ButtonLink variant="secondary" href={thread ? `/app/messages/${thread.id}` : `/app/b/${l.slug}/enquiry`}>
            <MessageCircle /> Message
          </ButtonLink>
          <ButtonLink variant="secondary" href={`/app/b/${l.slug}/call`}>
            <Phone /> Call
          </ButtonLink>
          {active && (
            <ButtonLink variant="secondary" href={`/app/bookings/${b.id}/reschedule`}>
              <CalendarClock /> Reschedule
            </ButtonLink>
          )}
          {active && (
            <ButtonLink variant="secondary" href={`/app/bookings/${b.id}/cancel`} className="text-red">
              Cancel
            </ButtonLink>
          )}
          <Button variant="secondary" onClick={() => toast(`Directions to ${b.postcode || l.postcode} opened in Maps (prototype)`)}>
            <Navigation /> Get directions
          </Button>
          <ButtonLink variant="secondary" href="/app/help">
            <CircleHelp /> Get help
          </ButtonLink>
        </div>

        <section className="card p-4" aria-labelledby="timeline">
          <h2 id="timeline" className="t-subhead">
            Timeline
          </h2>
          <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-white bg-blue" aria-hidden />
                <p className="t-label text-navy">{EVENT_LABEL[e.type]}</p>
                <p className="t-caption text-muted-ink">
                  {ACTOR[e.actor]} · {fmtDateTime(e.at)}
                  {e.reason ? ` · ${e.reason}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>
        <button type="button" onClick={() => router.push(`/app/report?target=listing&id=${l.id}`)} className="inline-flex min-h-11 items-center gap-1.5 t-label text-muted-ink hover:text-navy">
          <Flag className="size-4" aria-hidden /> Report a problem
        </button>
      </div>
    </AppScreen>
  )
}

function Detail({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="relative py-4 pl-12 pr-4">
      <dt className="t-caption text-muted-ink">
        <I className="absolute left-4 top-4.5 size-5 text-blue" aria-hidden />
        {label}
      </dt>
      <dd className="t-label text-navy">{value}</dd>
    </div>
  )
}
