"use client"
import { use } from "react"
import { ReviewDone } from "@/components/app/ReviewDone"
import { useStore } from "@/lib/store"

/** C-35 after a booking review. */
export default function BookingReviewDone({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const s = useStore()
  const b = s.bookings.find((x) => x.id === id)
  const l = s.listings.find((x) => x.id === b?.listingId)
  return <ReviewDone listing={l} doneHref={`/app/bookings/${id}`} />
}
