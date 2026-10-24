"use client"
import * as React from "react"
import Link from "next/link"
import { CalendarClock, Camera, Check, ChevronRight, Clock, MapPin, MessageCircle, StickyNote, Wrench, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { StatusPill } from "@/components/answerd/Status"
import { PersonAvatar, PhotoTile } from "@/components/answerd/Media"
import { TextArea } from "@/components/answerd/Fields"
import { alternativesFor, serviceById } from "@/lib/selectors"
import { fmtDateLong, fmtDateTime, fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { requestCountdown } from "./data"
import { useOpsLinks } from "./links"
import { ProposeTimesSheet } from "./ProposeTimesSheet"

const REASONS = ["Fully booked that day", "Outside my service area", "Not a job I do", "Other"]

/** Countdown bar for the 2-hour reply window, on the demo clock. */
export function RequestCountdown({ expiresAt, className }: { expiresAt?: string; className?: string }) {
  const clock = useStore((s) => s.clock)
  const c = requestCountdown(expiresAt, clock)
  if (!c) return null
  const low = c.left < 30 * 60_000
  return (
    <div className={cn("rounded-xl p-3", low ? "bg-red-tint" : "bg-amber-tint", className)}>
      <div className="flex items-center gap-2">
        <Clock className={cn("size-5", low ? "text-red" : "text-amber-ink")} aria-hidden />
        <p className="flex-1 t-label text-navy">
          <span className="tnum">{c.label}</span> to reply
        </p>
        <span className="t-caption text-slate tnum">by {fmtTime(expiresAt!)}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Time left to reply" aria-valuemin={0} aria-valuemax={120} aria-valuenow={Math.round(c.left / 60_000)} aria-valuetext={c.label}>
        <div className={cn("h-full rounded-full", low ? "bg-red" : "bg-amber")} style={{ width: `${c.pct}%` }} />
      </div>
      <p className="mt-1.5 t-caption text-slate">If you don&apos;t reply, the request expires and we offer the customer 3 others.</p>
    </div>
  )
}

/**
 * B-22: customer, service, requested time, address, notes and photos; Accept, Decline with a reason,
 * Suggest another time. Callbacks let the app and the dashboard decide where to go next.
 */
export function BookingRequestCard({ bookingId, onAccepted, onDeclined, className }: { bookingId: string; onAccepted?: (id: string) => void; onDeclined?: (id: string) => void; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const [declineOpen, setDeclineOpen] = React.useState(false)
  const [reason, setReason] = React.useState(REASONS[0]!)
  const [other, setOther] = React.useState("")
  const [suggest, setSuggest] = React.useState(false)
  const b = s.bookings.find((x) => x.id === bookingId)
  const listing = s.listings.find((l) => l.id === b?.listingId)
  const bizId = s.session.supportViewBusinessId ?? s.session.currentBusinessId
  if (!b || !listing || listing.businessId !== bizId) return <EmptyState title="Request not found" body="It may belong to another business." />
  const svc = serviceById(s, b.serviceId)
  const first = b.customerName.split(" ")[0]
  const thread = s.threads.find((t) => t.listingId === listing.id && t.channel === "app" && (b.customerId ? t.customerId === b.customerId : t.customerName === b.customerName))
  const events = s.bookingEvents.filter((e) => e.bookingId === b.id)
  const expired = events.some((e) => e.type === "expired")
  const proposed = b.changeRequest?.reason === "proposed_by_business" ? b.changeRequest : null
  const open = b.status === "requested" && !proposed
  const clash = s.bookings.find((x) => x.id !== b.id && x.listingId === b.listingId && ["confirmed", "on_the_way", "arrived"].includes(x.status) && ms(x.startAt) < ms(b.endAt) && ms(b.startAt) < ms(x.endAt))
  const alts = b.status === "declined" ? alternativesFor(s, listing.id, b.startAt) : []

  return (
    <div className={cn("space-y-3", className)}>
      {open && <RequestCountdown expiresAt={b.requestExpiresAt} />}
      {expired && (
        <Banner tone="error" title="This request expired">
          No one replied within 2 hours, so we told {first} and offered {alts.length} others free that day: {alts.map((a) => a.name).join(", ")}.
        </Banner>
      )}
      {b.status === "declined" && !expired && (
        <Banner tone="error" title="You declined this request">
          Reason: {b.declineReason}. We offered {first} {alts.length} others free that day.
        </Banner>
      )}
      {proposed && b.status === "requested" && (
        <Banner tone="info" title={`You suggested ${fmtDateTime(proposed.startAt)}`}>
          Waiting for {first} to accept the new time.
        </Banner>
      )}
      {b.status !== "requested" && b.status !== "declined" && (
        <Banner tone="success" title="Accepted" action={<Link href={links.job(b.id)} className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Open the job</Link>}>
          This booking is in your diary.
        </Banner>
      )}

      <section className="card p-4">
        <div className="flex items-center gap-3">
          <PersonAvatar name={b.customerName} size={44} tone="blue" />
          <div className="min-w-0 flex-1">
            <h2 className="t-subhead">{b.customerName}</h2>
            <p className="t-caption text-muted-ink">
              {b.createdBy === "desk" ? "Booked through your Answerd desk" : "Requested on Answerd"} · {fmtDateTime(b.createdAt)}
            </p>
          </div>
          <StatusPill status={b.status} />
        </div>
        <dl className="mt-3 divide-y divide-line border-t border-line">
          <Row icon={Wrench} label="Service" value={`${svc?.name ?? "Job"}${b.priceText ? ` · ${b.priceText}` : ""}`} />
          <Row icon={CalendarClock} label="Requested time" value={`${fmtDateLong(b.startAt)}, ${fmtTime(b.startAt)} to ${fmtTime(b.endAt)}`} />
          <Row icon={MapPin} label="Address" value={`${b.address}${b.postcode ? `, ${b.postcode}` : ""}${b.accessNotes ? `. ${b.accessNotes}` : ""}`} />
          {b.notes && <Row icon={StickyNote} label="Notes" value={b.notes} />}
        </dl>
        {b.photos.length > 0 && (
          <div className="mt-2">
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

      {clash && open && (
        <Banner tone="warning" title="Clashes with another job">
          {serviceById(s, clash.serviceId)?.name ?? "A job"} for {clash.customerName} at {fmtTime(clash.startAt)}. You can still accept, or suggest another time.
        </Banner>
      )}

      {thread && (
        <Link href={links.thread(thread.id)} className="card flex min-h-12 items-center gap-2 px-4 py-3 t-label text-navy hover:border-blue">
          <MessageCircle className="size-5 text-blue" aria-hidden /> <span className="flex-1">Message {first}</span>
          <ChevronRight className="size-4 text-muted-ink" aria-hidden />
        </Link>
      )}

      {open && (
        <div className="space-y-2 pt-1">
          <Button
            block
            onClick={() => {
              s.respondToBooking(b.id, "accept")
              toast(`Accepted. ${first} has been told.`)
              onAccepted?.(b.id)
            }}
          >
            <Check /> Accept
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setSuggest(true)}>
              Suggest another time
            </Button>
            <Button variant="secondary" className="text-red" onClick={() => setDeclineOpen(true)}>
              <X /> Decline
            </Button>
          </div>
        </div>
      )}

      <BottomSheet
        open={declineOpen}
        onClose={() => setDeclineOpen(false)}
        title="Decline this request?"
        footer={
          <Button
            block
            variant="destructive"
            disabled={reason === "Other" && !other.trim()}
            onClick={() => {
              s.respondToBooking(b.id, "decline", { reason: reason === "Other" ? other.trim() : reason })
              setDeclineOpen(false)
              toast(`Declined. We offered ${first} 3 others.`)
              onDeclined?.(b.id)
            }}
          >
            Decline request
          </Button>
        }
      >
        <p className="t-body text-slate">We&apos;ll tell {first} and suggest 3 similar businesses free that day.</p>
        <fieldset className="mt-3 space-y-1">
          <legend className="t-label text-navy">Reason</legend>
          {REASONS.map((r) => (
            <label key={r} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="radio" name="decline-reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-5 accent-blue" />
              <span className="t-body text-navy">{r}</span>
            </label>
          ))}
        </fieldset>
        {reason === "Other" && (
          <>
            <label htmlFor="decline-other" className="sr-only">
              Your reason
            </label>
            <TextArea id="decline-other" rows={2} value={other} onChange={(e) => setOther(e.target.value)} placeholder="Tell the customer why" className="mt-2" />
          </>
        )}
      </BottomSheet>

      <ProposeTimesSheet
        open={suggest}
        onClose={() => setSuggest(false)}
        listing={listing}
        title="Suggest another time"
        mode="single"
        initialServiceId={b.serviceId}
        ignoreBookingId={b.id}
        lockService
        submitLabel={() => "Send to " + first}
        onSubmit={(slots) => {
          s.respondToBooking(b.id, "suggest", { startAt: slots[0] })
          toast(`Suggested ${fmtDateTime(slots[0]!)} to ${first}`)
        }}
      />
    </div>
  )
}

function Row({ icon: I, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="relative min-w-0 py-3 pl-8">
      <dt className="t-caption text-muted-ink">
        <I className="absolute left-0 top-3.5 size-5 text-blue" aria-hidden />
        {label}
      </dt>
      <dd className="t-label text-navy">{value}</dd>
    </div>
  )
}
