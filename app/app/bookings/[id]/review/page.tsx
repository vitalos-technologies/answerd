"use client"
import { use } from "react"
import { ReviewForm, ReviewNotAllowed } from "@/components/app/ReviewForm"
import { useStore } from "@/lib/store"

/** C-34 for a booking: only once it's completed and not yet reviewed. */
export default function BookingReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const l = s.listings.find((x) => x.id === b?.listingId)
  if (!b || !l || b.customerId !== s.session.userId) return <ReviewNotAllowed reason="Sign in with the account that made the booking." back="/app/bookings" />
  if (b.reviewId) return <ReviewNotAllowed reason="You've already reviewed this booking. Thank you!" back={`/app/bookings/${b.id}`} />
  if (b.status !== "completed") return <ReviewNotAllowed reason="Reviews open once the job is marked as completed." back={`/app/bookings/${b.id}`} />
  return <ReviewForm listing={l} bookingId={b.id} doneHref={`/app/bookings/${b.id}/review/done`} />
}
