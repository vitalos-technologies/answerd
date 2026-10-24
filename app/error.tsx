"use client"
import { ErrorState } from "@/components/answerd/Feedback"
import { ScreenMeta } from "@/components/shells/ScreenMeta"

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16">
      <ScreenMeta id="W-24" />
      <ErrorState title="Something went wrong" body="That didn't load. It's not you; try again in a moment." onRetry={reset} />
    </div>
  )
}
