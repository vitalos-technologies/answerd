"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, TextArea } from "@/components/answerd/Fields"
import { SlotPicker } from "@/components/answerd/SlotPicker"
import { useStore } from "@/lib/store"
import { bookingTitle, serviceById } from "@/lib/selectors"
import { fmtDateTime } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-31: pick a new slot; the business answers the change request in business mode. */
export default function Reschedule({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const l = s.listings.find((x) => x.id === b?.listingId)
  const [slot, setSlot] = React.useState<string>()
  const [reason, setReason] = React.useState("")
  if (!b || !l) return <AppScreen id="C-31" header={<TopBar title="Reschedule" back />}><EmptyState title="Booking not found" body="It may have been cancelled." /></AppScreen>

  return (
    <AppScreen
      id="C-31"
      bg="white"
      header={<TopBar title="Reschedule" subtitle={`${bookingTitle(s, b)} · now ${fmtDateTime(b.startAt)}`} back={`/app/bookings/${b.id}`} />}
      footer={
        <div className="border-t border-line bg-white px-4 py-3">
          <Button
            block
            disabled={!slot}
            onClick={() => {
              s.reschedule(b.id, slot!, "customer", reason)
              toast("Change requested")
              router.replace(`/app/bookings/${b.id}`)
            }}
          >
            Send request
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-4 py-4">
        <div>
          <h1 className="t-title">Pick a new time</h1>
          <p className="mt-1 t-body text-slate">{l.name} will confirm the change. Your current time stays booked until they do.</p>
        </div>
        <SlotPicker listing={l} service={serviceById(s, b.serviceId)} value={slot} onChange={setSlot} ignoreBookingId={b.id} />
        <Field label="Reason" htmlFor="reason" optional>
          <TextArea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. I'm working late that day" />
        </Field>
      </div>
    </AppScreen>
  )
}
