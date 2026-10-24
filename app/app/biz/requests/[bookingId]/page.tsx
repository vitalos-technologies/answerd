"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { BookingRequestCard } from "@/components/biz/ops/RequestCard"

/** B-22 Booking request: Accept → B-24, Decline → B-19, Suggest → slot picker. */
export default function RequestPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  const router = useRouter()
  return (
    <OpsScreen id="B-22" title="Booking request" back="/app/biz/inbox?filter=requests">
      {() => (
        <div className="p-4">
          <BookingRequestCard bookingId={bookingId} onAccepted={(id) => router.push(`/app/biz/jobs/${id}`)} onDeclined={() => router.push("/app/biz/inbox")} />
        </div>
      )}
    </OpsScreen>
  )
}
