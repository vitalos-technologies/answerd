import type { Metadata } from "next"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { WebBooking } from "@/components/web/booking/WebBooking"

export const metadata: Metadata = { title: "Book", robots: { index: false } }

/** W-06 Book: the C-24 to C-28 steps in a desktop layout. */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <>
      <ScreenMeta id="W-06" />
      <WebBooking slug={slug} />
    </>
  )
}
