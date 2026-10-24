"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { bookingTitle, businessById } from "@/lib/selectors"
import { fmtDateTime, ms, MS_HOUR } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const REASONS = ["My plans changed", "I found someone else", "The job is no longer needed", "I booked by mistake", "Something else"]

/** C-32: reason, policy reminder and a destructive confirm. */
export default function CancelBooking({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const l = s.listings.find((x) => x.id === b?.listingId)
  const [reason, setReason] = React.useState(REASONS[0]!)
  if (!b || !l) return <AppScreen id="C-32" header={<TopBar title="Cancel booking" back />}><EmptyState title="Booking not found" body="It may already be cancelled." /></AppScreen>
  const biz = businessById(s, l.businessId)
  const windowH = biz?.cancellationPolicy === "48h" ? 48 : 24
  const inside = ms(b.startAt) - ms(s.clock) < windowH * MS_HOUR

  return (
    <AppScreen
      id="C-32"
      bg="white"
      header={<TopBar title="Cancel booking" back={`/app/bookings/${b.id}`} />}
      footer={
        <div className="space-y-2 border-t border-line bg-white px-4 py-3">
          <Button
            block
            variant="destructive"
            onClick={() => {
              s.cancelBooking(b.id, "customer", reason)
              toast("Booking cancelled")
              router.replace(`/app/bookings/${b.id}`)
            }}
          >
            Cancel booking
          </Button>
          <Button block variant="ghost" onClick={() => router.back()}>
            Keep booking
          </Button>
        </div>
      }
    >
      <div className="space-y-5 px-4 py-4">
        <div>
          <h1 className="t-title">Cancel {bookingTitle(s, b).toLowerCase()}?</h1>
          <p className="mt-1 t-body text-slate">
            With {l.name} on {fmtDateTime(b.startAt)}.
          </p>
        </div>
        <Banner tone={inside ? "warning" : "info"} title={b.policy}>
          {inside ? `This booking is less than ${windowH} hours away, so ${l.name} may ask for a late cancellation fee.` : "You're inside the free cancellation window."}
        </Banner>
        <fieldset>
          <legend className="t-subhead">Why are you cancelling?</legend>
          <div className="mt-3 space-y-2" role="radiogroup">
            {REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className={cn("flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left t-label", reason === r ? "border-blue bg-blue-tint text-navy" : "border-line text-navy")}>
                <span className={cn("inline-flex size-5 items-center justify-center rounded-full border-2", reason === r ? "border-blue bg-blue text-white" : "border-line")}>{reason === r && <Check className="size-3" aria-hidden />}</span>
                {r}
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </AppScreen>
  )
}
