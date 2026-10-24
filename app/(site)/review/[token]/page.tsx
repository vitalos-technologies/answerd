import type { Metadata } from "next"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { ReviewFromLink } from "@/components/web/review/ReviewFromLink"

export const metadata: Metadata = { title: "Leave a review", robots: { index: false } }

/** W-27: Review from link. */
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return (
    <>
      <ScreenMeta id="W-27" />
      <ReviewFromLink token={token} />
    </>
  )
}
