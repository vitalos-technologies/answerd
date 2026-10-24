"use client"
import * as React from "react"
import { Flag, MessageSquareReply, Pencil } from "lucide-react"
import { useStore } from "@/lib/store"
import { Stars } from "@/components/answerd/Rating"
import { Button } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { Chip, TextArea } from "@/components/answerd/Fields"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { listingRating } from "@/lib/selectors"
import { fmtDateYear } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Review } from "@/lib/types"

const REPORT_REASONS = ["Not a real customer", "Offensive or abusive", "About a different business", "Contains personal information"]

/** B-27: average, distribution, list; one public reply per review (shown on C-19 and W-06); Report. */
export function ReviewsPanel({ listingId, className }: { listingId: string; className?: string }) {
  const s = useStore()
  const listing = s.listings.find((l) => l.id === listingId)
  const [filter, setFilter] = React.useState<"all" | "unreplied">("all")
  const [reporting, setReporting] = React.useState<Review | null>(null)
  const [reason, setReason] = React.useState(REPORT_REASONS[0]!)
  const [details, setDetails] = React.useState("")
  if (!listing) return null
  const all = s.reviews.filter((r) => r.listingId === listingId && r.status === "live").sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const shown = filter === "unreplied" ? all.filter((r) => !r.reply) : all
  const rating = listingRating(s, listing)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: all.filter((r) => r.stars === n).length }))
  return (
    <div className={cn("space-y-4", className)}>
      <section className="card flex gap-4 p-4" aria-label="Rating summary">
        <div className="flex shrink-0 flex-col items-center justify-center">
          <p className="t-display tnum">{rating.count ? rating.rating.toFixed(1) : "–"}</p>
          <Stars value={rating.rating} size={16} />
          <p className="mt-1 t-caption text-muted-ink tnum">
            {rating.count} review{rating.count === 1 ? "" : "s"}
          </p>
        </div>
        <ul className="min-w-0 flex-1 space-y-1" aria-label="Reviews by stars">
          {dist.map((d) => (
            <li key={d.n} className="flex items-center gap-2 t-caption text-slate">
              <span className="w-6 tnum">{d.n}★</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
                <span className="block h-full rounded-full bg-amber" style={{ width: `${all.length ? (d.c / all.length) * 100 : 0}%` }} />
              </span>
              <span className="w-8 text-right tnum">{d.c}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2" role="radiogroup" aria-label="Filter reviews">
        <Chip active={filter === "all"} role="radio" aria-checked={filter === "all"} aria-pressed={undefined} className="h-11" onClick={() => setFilter("all")}>
          All
        </Chip>
        <Chip active={filter === "unreplied"} role="radio" aria-checked={filter === "unreplied"} aria-pressed={undefined} className="h-11" onClick={() => setFilter("unreplied")}>
          Not replied <span className="tnum">{all.filter((r) => !r.reply).length}</span>
        </Chip>
      </div>

      <DataGate isEmpty={!shown.length} empty={<EmptyState title={filter === "unreplied" ? "All replied to" : "No reviews yet"} body={filter === "unreplied" ? "Every review has your reply." : "Share your profile and ask happy customers for a review."} />}>
        <ul className="space-y-3">
          {shown.map((r) => (
            <ReviewItem key={r.id} r={r} businessName={listing.name} onReport={() => (setReporting(r), setReason(REPORT_REASONS[0]!), setDetails(""))} />
          ))}
        </ul>
      </DataGate>

      <BottomSheet
        open={!!reporting}
        onClose={() => setReporting(null)}
        title="Report this review"
        footer={
          <Button
            block
            onClick={() => {
              if (!reporting) return
              s.report("review", reporting.id, reason, details.trim())
              toast("Reported. Our team will look at it within 2 working days.")
              setReporting(null)
            }}
          >
            Send report
          </Button>
        }
      >
        <p className="t-body text-slate">Answerd reviews it against our review rules. The review stays up while we check.</p>
        <fieldset className="mt-3 space-y-1">
          <legend className="t-label text-navy">Reason</legend>
          {REPORT_REASONS.map((x) => (
            <label key={x} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input type="radio" name="report-reason" checked={reason === x} onChange={() => setReason(x)} className="size-5 accent-blue" />
              <span className="t-body text-navy">{x}</span>
            </label>
          ))}
        </fieldset>
        <label htmlFor="report-details" className="mt-2 block t-label text-navy">
          Details <span className="font-normal text-muted-ink">(optional)</span>
        </label>
        <TextArea id="report-details" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} className="mt-1.5" />
      </BottomSheet>
    </div>
  )
}

function ReviewItem({ r, businessName, onReport }: { r: Review; businessName: string; onReport: () => void }) {
  const s = useStore()
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState(r.reply?.body ?? "")
  const reported = s.reports.some((x) => x.target === "review" && x.targetId === r.id && x.status === "open")
  const first = r.authorName.split(" ")[0]
  return (
    <li className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="t-label text-navy">{r.authorName}</p>
          <div className="flex items-center gap-2">
            <Stars value={r.stars} />
            <span className="t-caption text-muted-ink">{fmtDateYear(r.createdAt)}</span>
          </div>
        </div>
        <button type="button" onClick={onReport} disabled={reported} aria-label={reported ? "Reported" : `Report ${first}'s review`} className="inline-flex min-h-11 items-center gap-1 rounded-full px-2 t-caption text-muted-ink hover:bg-sky hover:text-navy disabled:opacity-70">
          <Flag className="size-4" aria-hidden /> {reported ? "Reported" : "Report"}
        </button>
      </div>
      {r.text && <p className="mt-2 t-body text-slate">{r.text}</p>}
      {r.reply && !editing && (
        <div className="mt-3 rounded-xl bg-sky p-3">
          <div className="flex items-center justify-between">
            <p className="t-caption text-navy">Your public reply</p>
            <button type="button" onClick={() => (setText(r.reply!.body), setEditing(true))} className="inline-flex min-h-11 items-center gap-1 px-1 t-caption text-blue hover:underline">
              <Pencil className="size-3.5" aria-hidden /> Edit
            </button>
          </div>
          <p className="t-label font-normal text-slate">{r.reply.body}</p>
        </div>
      )}
      {!r.reply && !editing && (
        <Button size="sm" variant="secondary" className="mt-3 h-11" onClick={() => setEditing(true)}>
          <MessageSquareReply /> Reply
        </Button>
      )}
      {editing && (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            s.replyToReview(r.id, text.trim())
            setEditing(false)
            toast(r.reply ? "Reply updated" : `Reply posted. ${first} has been told.`)
          }}
        >
          <label htmlFor={`reply-${r.id}`} className="t-label text-navy">
            Public reply from {businessName}
          </label>
          <TextArea id={`reply-${r.id}`} rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Thanks ${first}, …`} className="mt-1.5" autoFocus />
          <p className="mt-1 t-caption text-muted-ink">Everyone can see it on your listing. One reply per review.</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="secondary" className="h-11" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-11" disabled={!text.trim()}>
              {r.reply ? "Save reply" : "Post reply"}
            </Button>
          </div>
        </form>
      )}
    </li>
  )
}
