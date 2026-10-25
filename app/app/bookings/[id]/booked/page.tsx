"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus, Check, Clock, MessageCircle } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { ListingAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { serviceById } from "@/lib/selectors"
import { fmtDateLong, fmtTime, icsFile } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-28: "You're booked" or "Request sent", Add to calendar, Message business, Done. */
export default function BookedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const clearDraft = s.setDraft
  React.useEffect(() => {
    clearDraft(null)
  }, [clearDraft])
  const listing = s.listings.find((l) => l.id === b?.listingId)
  if (!b || !listing) return <AppScreen id="C-28"><EmptyState title="Booking not found" body="It may have been cancelled." /></AppScreen>
  const svc = serviceById(s, b.serviceId)
  const request = b.status === "requested"
  const thread = s.threads.find((t) => t.listingId === listing.id && t.customerId === b.customerId && t.channel === "app")

  const addToCalendar = () => {
    const ics = icsFile({ uid: b.id, start: b.startAt, end: b.endAt, title: `${svc?.name ?? "Booking"} with ${listing.name}`, location: `${b.address}, ${b.postcode}`, description: `Booked on Answerd. ${b.policy}.` })
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `answerd-${b.id}.ics`
    a.click()
    URL.revokeObjectURL(url)
    toast("Calendar file downloaded")
  }
  const done = () => {
    const next = `/app/bookings/${b.id}`
    router.replace(s.session.notificationsAsked ? next : `/app/onboarding/notifications?next=${encodeURIComponent(next)}`)
  }

  return (
    <AppScreen id="C-28" bg="white">
      <div className="flex min-h-full flex-col px-6 pb-6 pt-10">
        <div className="flex flex-col items-center text-center">
          <span className={`inline-flex size-24 items-center justify-center rounded-full animate-tick ${request ? "bg-amber-tint text-amber-ink" : "bg-teal-tint text-teal-ink"}`}>
            {request ? <Clock className="size-12" aria-hidden /> : <Check className="size-12" strokeWidth={2.5} aria-hidden />}
          </span>
          <h1 className="t-display mt-6">{request ? "Request sent" : "You're booked"}</h1>
          <p className="mt-2 t-body text-slate">{request ? `${listing.name} will confirm within 2 hours. We'll let you know.` : `${listing.name} has your booking and details.`}</p>
        </div>
        <div className="card mt-8 flex items-center gap-3 p-4">
          <ListingAvatar listing={listing} size={48} />
          <div className="min-w-0">
            <p className="t-subhead">{svc?.name ?? "Booking"}</p>
            <p className="t-label font-normal text-slate">{listing.name}</p>
            <p className="t-label text-navy tnum">
              {fmtDateLong(b.startAt)}, {fmtTime(b.startAt)}
            </p>
            <p className="t-caption text-muted-ink">{b.priceText}</p>
          </div>
        </div>
        <div className="mt-auto space-y-2 pt-8">
          <Button block variant="secondary" onClick={addToCalendar}>
            <CalendarPlus /> Add to calendar
          </Button>
          <Button block variant="secondary" onClick={() => router.push(thread ? `/app/messages/${thread.id}` : `/app/b/${listing.slug}/enquiry`)}>
            <MessageCircle /> Message {listing.name}
          </Button>
          <Button block onClick={done}>
            Done
          </Button>
        </div>
      </div>
    </AppScreen>
  )
}
