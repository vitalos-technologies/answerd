"use client"
import { use } from "react"
import { ReviewDone } from "@/components/app/ReviewDone"
import { useStore } from "@/lib/store"
import { listingBySlug } from "@/lib/selectors"

/** C-35 after a call review. */
export default function CallReviewDone({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const s = useStore()
  return <ReviewDone listing={listingBySlug(s, slug)} doneHref={`/app/b/${slug}`} />
}
