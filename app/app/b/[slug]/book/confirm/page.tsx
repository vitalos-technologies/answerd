"use client"
import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarClock, Clock, MapPin, Pencil, Receipt, Zap } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Stepper } from "@/components/answerd/Status"
import { BottomSheet } from "@/components/answerd/Sheet"
import { ListingMini, ListingNotFound, atPremises } from "@/components/app/listing"
import { useBookingDraft, BOOK_STEPS } from "@/components/app/booking"
import { withSuspense } from "@/components/app/helpers"
import { businessById, serviceById } from "@/lib/selectors"
import { durationLabel, priceWithVat } from "@/lib/format"
import { fmtDate, fmtDateTime, fmtTime } from "@/lib/time"

/** C-27: summary, policy, instant or request, Confirm booking; handles a slot taken mid-booking. */
function Confirm({ slug }: { slug: string }) {
  const router = useRouter()
  const threadId = useSearchParams().get("thread") ?? undefined
  const { listing, draft, s } = useBookingDraft(slug, "confirm")
  const [taken, setTaken] = React.useState<string[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  if (!listing) return <AppScreen id="C-27"><ListingNotFound /></AppScreen>
  if (!draft?.startAt) return <AppScreen id="C-27">{null}</AppScreen>
  const biz = businessById(s, listing.businessId)
  const svc = serviceById(s, draft.serviceId)
  const instant = biz?.bookingMode === "instant"
  const shop = atPremises(listing)
  const address = shop ? `${listing.name}, ${listing.address}` : draft.address
  const policy = biz?.cancellationPolicy === "48h" ? "Free to cancel until 48 hours before" : biz?.cancellationPolicy === "custom" ? biz.cancellationCustom ?? "" : "Free to cancel until 24 hours before"

  const confirm = (startAt: string) => {
    setLoading(true)
    const res = s.createBooking({
      listingId: listing.id,
      serviceId: draft.serviceId ?? "",
      startAt,
      address: address ?? "",
      postcode: shop ? listing.postcode : draft.postcode ?? "",
      accessNotes: draft.accessNotes,
      notes: draft.notes,
      photos: draft.photos,
      contactPhone: draft.contactPhone,
      threadId,
    })
    setLoading(false)
    if (!res.ok) {
      setTaken(res.alternatives)
      return
    }
    router.replace(`/app/bookings/${res.bookingId}/booked`)
  }

  return (
    <AppScreen
      id="C-27"
      bg="white"
      header={<TopBar title="Book" back />}
      footer={
        <div className="border-t border-line bg-white px-4 py-3">
          <Button block loading={loading} disabled={!address} onClick={() => confirm(draft.startAt!)}>
            {instant ? "Confirm booking" : "Send booking request"}
          </Button>
        </div>
      }
    >
      <ListingMini listing={listing} />
      <div className="space-y-4 px-4 py-4">
        <Stepper steps={BOOK_STEPS} current={3} />
        <h1 className="t-title">Check and confirm</h1>
        <dl className="card divide-y divide-line">
          <Row icon={Receipt} label="Service" value={svc ? `${svc.name} · ${durationLabel(svc.durationMin)}` : "Booking"} edit={`/app/b/${slug}/book`} />
          <Row icon={CalendarClock} label="When" value={`${fmtDate(draft.startAt)}, ${fmtTime(draft.startAt)}`} edit={`/app/b/${slug}/book/time`} />
          <Row icon={MapPin} label="Where" value={address ? `${address}${shop ? "" : `, ${draft.postcode}`}` : "Add your address"} edit={shop ? undefined : `/app/b/${slug}/book/details`} />
          <Row icon={Receipt} label="Price" value={svc ? priceWithVat(svc) : "Agreed with the business"} />
        </dl>
        {!address && (
          <Banner tone="warning" title="Add the address for the job" action={<Link href={`/app/b/${slug}/book/details`} className="t-label text-blue underline">Add address</Link>} />
        )}
        <div className="rounded-2xl bg-sky p-4">
          <p className="flex items-center gap-2 t-label text-navy">
            {instant ? <Zap className="size-4 text-teal-ink" aria-hidden /> : <Clock className="size-4 text-amber-ink" aria-hidden />}
            {instant ? "Instant: you're booked straight away" : "Request: they'll confirm within 2 hours"}
          </p>
          <p className="mt-1 t-caption text-slate">{policy}. You pay the business directly after the job.</p>
        </div>
      </div>

      <BottomSheet open={!!taken} onClose={() => setTaken(null)} title="That time was just taken">
        <p className="t-body text-slate">Someone booked {fmtTime(draft.startAt)} a moment ago. Your details are saved; pick one of the next free times.</p>
        <div className="mt-4 space-y-2">
          {taken?.map((t) => (
            <Button
              key={t}
              block
              variant="secondary"
              onClick={() => {
                s.patchDraft({ startAt: t })
                setTaken(null)
                confirm(t)
              }}
            >
              {fmtDateTime(t)}
            </Button>
          ))}
          {!taken?.length && <p className="t-label text-muted-ink">No other times this week.</p>}
          <Button block variant="ghost" onClick={() => router.push(`/app/b/${slug}/book/time`)}>
            See all times
          </Button>
        </div>
      </BottomSheet>
    </AppScreen>
  )
}

function Row({ icon: I, label, value, edit }: { icon: typeof Clock; label: string; value: string; edit?: string }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <I className="size-5 shrink-0 text-blue" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="t-caption text-muted-ink">{label}</dt>
        <dd className="t-label text-navy">{value}</dd>
      </div>
      {edit && (
        <Link href={edit} aria-label={`Change ${label.toLowerCase()}`} className="inline-flex size-11 items-center justify-center rounded-full text-blue hover:bg-blue-tint">
          <Pencil className="size-4" />
        </Link>
      )}
    </div>
  )
}

const C = withSuspense(Confirm)
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <C slug={slug} />
}
