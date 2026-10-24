import type { Metadata } from "next"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { HelpCentre } from "@/components/web/help/HelpCentre"

export const metadata: Metadata = {
  title: "Help centre",
  description: "Answers for customers and businesses on Answerd: booking, cancelling, reviews, claiming your listing, the AI desk and billing.",
  alternates: { canonical: "/help" },
}

/** W-20: Help centre. */
export default function Page() {
  return (
    <>
      <ScreenMeta id="W-20" />
      <HelpCentre />
    </>
  )
}
