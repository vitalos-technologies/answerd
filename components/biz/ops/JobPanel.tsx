"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarClock, CalendarSync, Camera, KeyRound, MapPin, MessageCircle, Navigation, Phone, Receipt, StickyNote, UserRound, UserX, Wrench, XCircle } from "lucide-react"
import { useStore } from "@/lib/store"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { StatusPill, Stepper } from "@/components/answerd/Status"
import { PhotoTile } from "@/components/answerd/Media"
import { TextArea } from "@/components/answerd/Fields"
import { roleIn, serviceById } from "@/lib/selectors"
import { fmtDateLong, fmtDateTime, fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { BookingEvent, BookingStatus } from "@/lib/types"
import { useOpsLinks } from "./links"
import { ProposeTimesSheet } from "./ProposeTimesSheet"

export const JOB_STEPS: { status: BookingStatus; label: string; action: string }[] = [
  { status: "confirmed", label: "Confirmed", action: "Confirmed" },
  { status: "on_the_way", label: "On my way", action: "I'm on my way" },
  { status: "arrived", label: "Arrived", action: "I've arrived" },
  { status: "completed", label: "Completed", action: "Mark completed" },
]

const EVENT_LABEL: Record<BookingEvent["type"], string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  declined: "Declined",
  expired: "Request expired",
  time_proposed: "New time suggested",
  change_requested: "Customer asked to move",
  change_accepted: "Move accepted",
  rescheduled: "Moved",
  on_the_way: "On my way",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Marked as a no-show",
  reminder_sent: "Reminder sent",
  review_requested: "Review requested by the desk",
  reviewed: "Customer left a review",
}
const ACTOR: Record<BookingEvent["actor"], string> = { customer: "Customer", owner: "Owner", staff: "Staff", desk: "Answerd desk", system: "Answerd" }

/**
 * B-24: customer, phone, address with Navigate, service, price, notes, photos, the status stepper
 * (each step notifies the customer; Completed queues the D-06 review request), Reschedule, Cancel and Mark no-show.
 */
export function JobPanel({ bookingId, className }: { bookingId: string; className?: string }) {
  const s = useStore()
  const router = useRouter()
  const links = useOpsLinks()
  const [resched, setResched] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("")
  const [noShow, setNoShow] = React.useState(false)
  const b = s.bookings.find((x) => x.id === bookingId)
  const listing = s.listings.find((l) => l.id === b?.listingId)
  const bizId = s.session.supportViewBusinessId ?? s.session.currentBusinessId
  if (!b || !listing || listing.businessId !== bizId) return <EmptyState title="Job not found" body="It may belong to another business." />
  const role = roleIn(s, s.session.userId, bizId)
  const staff = role === "staff"
  if (staff && b.assignedTo !== s.session.userId) {
    return <EmptyState title="Not one of your jobs" body="Staff see the jobs assigned to them. Ask the owner if you need this one." action={<ButtonLink href={links.diary} size="md">Your diary</ButtonLink>} />
  }
  const readOnly = !role
  const actor = staff ? "staff" : "owner"
  const svc = serviceById(s, b.serviceId)
  const first = b.customerName.split(" ")[0]
  const thread = s.threads.find((t) => t.listingId === listing.id && t.channel === "app" && (b.customerId ? t.customerId === b.customerId : t.customerName === b.customerName))
  const events = s.bookingEvents.filter((e) => e.bookingId === b.id).sort((x, y) => x.at.localeCompare(y.at))
  const idx = JOB_STEPS.findIndex((x) => x.status === b.status)
  const next = idx >= 0 ? JOB_STEPS[idx + 1] : undefined
  const active = ["confirmed", "on_the_way", "arrived"].includes(b.status)
  const ended = ["cancelled", "no_show", "declined"].includes(b.status)
  const change = b.changeRequest && b.changeRequest.reason !== "proposed_by_business" ? b.changeRequest : null
  const assignee = b.assignedTo ? s.members.find((m) => m.userId === b.assignedTo)?.name : null
  const started = ms(b.startAt) <= ms(s.clock)

  const message = () => {
    const id = thread?.id ?? s.ensureThread(listing.id, { customerId: b.customerId, name: b.customerName, phone: b.customerPhone })
    router.push(links.thread(id))
  }
  const advance = () => {
    if (!next) return
    s.updateBookingStatus(b.id, next.status, actor)
    toast(next.status === "completed" ? `Job completed. ${first} gets a review request from the desk.` : `${first} has been told: ${next.label.toLowerCase()}`)
  }

  return (
    <div className={cn("space-y-3", className)}>
      {b.status === "requested" && (
        <Banner tone="warning" title="Still a request" action={<ButtonLink href={links.request(b.id)} size="sm">Reply to the request</ButtonLink>}>
          Accept it to add it to your diary.
        </Banner>
      )}
      {b.status === "cancelled" && (
        <Banner tone="error" icon={<XCircle className="size-5" aria-hidden />} title={`Cancelled by ${b.cancelledBy === "customer" ? first : "you"}`}>
          {b.cancelReason ? `Reason: ${b.cancelReason}. ` : ""}This job is read only.
        </Banner>
      )}
      {b.status === "no_show" && (
        <Banner tone="error" icon={<UserX className="size-5" aria-hidden />} title="Marked as a no-show">
          {first} can dispute this within 48 hours.
        </Banner>
      )}
      {change && active && (
        <Banner
          tone="info"
          icon={<CalendarSync className="size-5" aria-hidden />}
          title={`${first} asked to move to ${fmtDateTime(change.startAt)}`}
          action={
            !readOnly && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => (s.respondToChange(b.id, true), toast(`Moved to ${fmtDateTime(change.startAt)}. ${first} has been told.`))}>
                  Accept
                </Button>
                <Button size="sm" variant="secondary" onClick={() => (s.respondToChange(b.id, false), toast(`${first} has been told it stays at ${fmtTime(b.startAt)}`))}>
                  Keep current time
                </Button>
              </div>
            )
          }
        >
          {change.reason || "No reason given."}
        </Banner>
      )}

      <section className="card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="t-heading">{svc?.name ?? "Job"}</h2>
            <p className="t-label font-normal text-slate tnum">
              {fmtDateLong(b.startAt)}, {fmtTime(b.startAt)} to {fmtTime(b.endAt)}
            </p>
          </div>
          <StatusPill status={b.status} />
        </div>
        {(b.status === "confirmed" || idx > 0) && (
          <Stepper className="mt-4" steps={JOB_STEPS.map((x) => x.label)} current={idx + 1} />
        )}
        {next && active && !readOnly && (
          <Button block className="mt-4" onClick={advance}>
            {next.action}
          </Button>
        )}
        {b.status === "completed" && (
          <p className="mt-3 t-caption text-muted-ink">{b.reviewId ? `${first} left a review.` : b.reviewRequested ? `The desk sent ${first} a review request.` : ""}</p>
        )}
      </section>

      <section className="card divide-y divide-line">
        <div className="flex items-center gap-3 p-4">
          <UserRound className="size-5 shrink-0 text-blue" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="t-caption text-muted-ink">Customer</p>
            <p className="t-label text-navy">{b.customerName}</p>
            <p className="t-caption text-muted-ink tnum">{b.customerPhone}</p>
          </div>
          <Button size="sm" variant="secondary" aria-label={`Call ${first}`} className="h-11 w-11 px-0" onClick={() => toast(`Calling ${first} on ${b.customerPhone} (prototype dialer)`)}>
            <Phone />
          </Button>
          <Button size="sm" variant="secondary" aria-label={`Message ${first}`} className="h-11 w-11 px-0" onClick={message} disabled={readOnly}>
            <MessageCircle />
          </Button>
        </div>
        <div className="flex items-center gap-3 p-4">
          <MapPin className="size-5 shrink-0 text-blue" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="t-caption text-muted-ink">Address</p>
            <p className="t-label text-navy">
              {b.address}
              {b.postcode ? `, ${b.postcode}` : ""}
            </p>
          </div>
          <Button size="sm" variant="secondary" className="h-11" onClick={() => toast(`Directions to ${b.postcode || b.address} opened in Maps (prototype)`)}>
            <Navigation /> Navigate
          </Button>
        </div>
        {b.accessNotes && <Info icon={KeyRound} label="Access" value={b.accessNotes} />}
        <Info icon={Wrench} label="Service" value={svc?.name ?? "Job"} />
        <Info icon={Receipt} label="Price" value={b.priceText || "Agreed with the customer"} />
        {b.notes && <Info icon={StickyNote} label="Notes" value={b.notes} />}
        {assignee && <Info icon={UserRound} label="Assigned to" value={assignee} />}
        {b.photos.length > 0 && (
          <div className="p-4">
            <p className="flex items-center gap-1.5 t-caption text-muted-ink">
              <Camera className="size-4" aria-hidden /> Photos
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {b.photos.map((p, i) => (
                <PhotoTile key={p} hue={(listing.hue + i * 40) % 360} icon="Image" label={p} className="aspect-square" />
              ))}
            </div>
          </div>
        )}
      </section>

      {active && !readOnly && (
        <div className="grid grid-cols-3 gap-2">
          <Button variant="secondary" size="md" className="px-2" onClick={() => setResched(true)}>
            <CalendarClock /> Move
          </Button>
          <Button variant="secondary" size="md" className="px-2 text-red" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
          <Button variant="secondary" size="md" className="px-2" onClick={() => setNoShow(true)}>
            <UserX /> No-show
          </Button>
        </div>
      )}

      <section className="card p-4" aria-labelledby="job-timeline">
        <h3 id="job-timeline" className="t-subhead">
          Timeline
        </h3>
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

      {ended && thread && (
        <Link href={links.thread(thread.id)} className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
          Open the conversation with {first}
        </Link>
      )}

      <ProposeTimesSheet
        open={resched}
        onClose={() => setResched(false)}
        listing={listing}
        title="Move this job"
        mode="single"
        initialServiceId={b.serviceId}
        ignoreBookingId={b.id}
        lockService
        submitLabel={() => "Move and tell " + first}
        onSubmit={(slots) => {
          s.reschedule(b.id, slots[0]!, "business")
          toast(`Moved to ${fmtDateTime(slots[0]!)}. ${first} has been told.`)
        }}
      />
      <BottomSheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this job?"
        footer={
          <Button
            block
            variant="destructive"
            disabled={!cancelReason.trim()}
            onClick={() => {
              s.cancelBooking(b.id, "business", cancelReason.trim())
              setCancelOpen(false)
              toast(`Cancelled. ${first} has been told.`)
            }}
          >
            Cancel job
          </Button>
        }
      >
        <p className="t-body text-slate">We&apos;ll text and email {first} that their {fmtDateTime(b.startAt)} booking was cancelled.</p>
        <label htmlFor="cancel-reason" className="mt-3 block t-label text-navy">
          Reason for {first}
        </label>
        <TextArea id="cancel-reason" rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. Van broken down, sorry" className="mt-1.5" />
      </BottomSheet>
      <BottomSheet
        open={noShow}
        onClose={() => setNoShow(false)}
        title="Mark as a no-show?"
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setNoShow(false)}>
              Not now
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                s.markNoShow(b.id)
                setNoShow(false)
                toast(`Marked as a no-show. ${first} has been told.`)
              }}
            >
              Mark no-show
            </Button>
          </div>
        }
      >
        <p className="t-body text-slate">
          Only do this if {first} wasn&apos;t there at {fmtTime(b.startAt)}. They can dispute it within 48 hours, and repeated no-shows are flagged to Answerd.
        </p>
        {!started && <p className="mt-2 t-label text-amber-ink">This job hasn&apos;t started yet.</p>}
      </BottomSheet>
    </div>
  )
}

function Info({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4">
      <I className="mt-0.5 size-5 shrink-0 text-blue" aria-hidden />
      <div className="min-w-0">
        <p className="t-caption text-muted-ink">{label}</p>
        <p className="t-label text-navy">{value}</p>
      </div>
    </div>
  )
}
