"use client"
import Link from "next/link"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { ErrorState } from "@/components/answerd/Feedback"

/** W-24: error boundary for public pages, inside the site header and footer. */
export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-16 max-sm:px-4">
      <ScreenMeta id="W-24" />
      <div className="card mx-auto max-w-lg">
        <ErrorState title="Something went wrong" body="That page didn't load. It's not you; try again in a moment." onRetry={reset} />
        <p className="pb-6 text-center t-label font-normal text-slate">
          Still stuck?{" "}
          <Link href="/help#contact" className="text-blue underline underline-offset-2">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  )
}
