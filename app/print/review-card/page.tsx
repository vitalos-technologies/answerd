"use client"
import Link from "next/link"
import { Printer } from "lucide-react"
import { useBiz } from "@/components/app/biz"
import { ReviewUsCard, profileUrl } from "@/components/biz/ops/ShareProfile"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { ScreenMeta } from "@/components/shells/ScreenMeta"

/** Print-styled "Review us on Answerd" card (opened from B-29). */
export default function PrintReviewCard() {
  const { s, biz, listing } = useBiz()
  if (!s.hydrated) return null
  return (
    <main className="min-h-dvh bg-sky px-4 py-8 print:bg-white print:p-0">
      <ScreenMeta id="B-29" />
      <style>{`@page { size: A6 portrait; margin: 8mm; } @media print { .print-card { border-width: 1px; max-width: none; } [data-screen-id] { display: none !important; } }`}</style>
      {!biz || !listing ? (
        <EmptyState title="No business to print for" body="Open this from Share your profile in business mode." action={<Link href="/app/biz/share" className="t-label text-blue hover:underline">Share your profile</Link>} />
      ) : (
        <>
          <div className="no-print mx-auto mb-6 flex max-w-[420px] flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="t-heading">Review card</h1>
              <p className="t-caption text-muted-ink">A6, prints one per page.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/app/biz/share" className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky">
                Back
              </Link>
              <Button size="md" onClick={() => window.print()}>
                <Printer /> Print
              </Button>
            </div>
          </div>
          <ReviewUsCard listing={listing} url={profileUrl(listing, biz)} className="print-card shadow-card print:shadow-none" />
        </>
      )}
    </main>
  )
}
