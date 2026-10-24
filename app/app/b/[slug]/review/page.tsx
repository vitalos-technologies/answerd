"use client"
import { use } from "react"
import { useSearchParams } from "next/navigation"
import { ReviewForm, ReviewNotAllowed } from "@/components/app/ReviewForm"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { listingBySlug } from "@/lib/selectors"

/** C-34 after a tracked call over 60 seconds (/app/b/[slug]/review?call=…). */
function CallReview({ slug }: { slug: string }) {
  const callId = useSearchParams().get("call") ?? ""
  const s = useStore()
  const l = listingBySlug(s, slug)
  const call = s.calls.find((c) => c.id === callId)
  const back = `/app/b/${slug}`
  if (!l || !call || call.customerId !== s.session.userId) return <ReviewNotAllowed reason="Reviews need a completed booking or a call through Answerd that lasted over a minute." back={back} />
  if (call.durationSec <= 60) return <ReviewNotAllowed reason="Calls under a minute can't be reviewed. Book through Answerd and you can review after the job." back={back} />
  if (s.reviews.some((r) => r.callId === call.id)) return <ReviewNotAllowed reason="You've already reviewed this call. Thank you!" back={back} />
  return <ReviewForm listing={l} callId={call.id} doneHref={`/app/b/${slug}/review/done`} />
}

const C = withSuspense(CallReview)
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <C slug={slug} />
}
