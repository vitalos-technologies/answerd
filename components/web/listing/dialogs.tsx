"use client"
import * as React from "react"
import { Flag, Phone, PhoneCall } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/answerd/Button"
import { Field, TextArea } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { isDeskLive } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import type { Listing } from "@/lib/types"
import { cn } from "@/lib/utils"

const dialogCls = "max-w-[calc(100%-2rem)] rounded-3xl border-0 bg-white p-6 shadow-overlay sm:max-w-md"

/**
 * C-20 and C-21 on the web: call through an Answerd number, then "Did you get through?".
 * Props: listing, open, onOpenChange, onMessage (opens the message panel for "No answer").
 */
export function CallDialog({ listing, open, onOpenChange, onMessage }: { listing: Listing; open: boolean; onOpenChange: (v: boolean) => void; onMessage?: () => void }) {
  const s = useStore()
  const desk = isDeskLive(s, listing)
  const tracked = s.deskConfigs.find((c) => c.businessId === listing.businessId)?.number || "020 7946 0800"
  const [callId, setCallId] = React.useState<string | null>(null)
  const [answered, setAnswered] = React.useState<string | null>(null)
  const close = (v: boolean) => {
    if (!v) {
      setCallId(null)
      setAnswered(null)
    }
    onOpenChange(v)
  }
  const call = () => {
    const id = s.logCall(listing.id, desk ? "desk" : listing.layer === "claimed" ? "owner" : "missed", desk || listing.layer === "claimed" ? 95 : 0)
    setCallId(id)
  }
  const answer = (a: "booked" | "not_booked" | "no_answer") => {
    if (callId) s.setAfterCall(callId, a)
    setAnswered(a)
    if (a === "booked") toast("Thanks. We've noted the booking.")
  }
  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={dialogCls}>
        {!callId ? (
          <>
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-blue-tint text-blue">
              <Phone className="size-6" aria-hidden />
            </span>
            <DialogTitle className="t-heading">Call {listing.name}</DialogTitle>
            <DialogDescription className="t-body text-slate">You&apos;ll call via an Answerd number so they know you found them here.</DialogDescription>
            {desk && <p className="rounded-xl bg-teal-tint p-3 t-label font-normal text-navy">If they&apos;re busy, their Answerd desk will pick up. It says it&apos;s an AI and the call is recorded.</p>}
            <p className="t-label text-navy">
              Answerd number: <span className="tnum">{tracked}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={`tel:${tracked.replace(/\s/g, "")}`} onClick={call} className="inline-flex h-12 shrink-0 sm:flex-1 items-center justify-center gap-2 rounded-full bg-blue px-6 t-label font-semibold text-white hover:bg-blue-hover">
                <PhoneCall className="size-5" aria-hidden /> Call now
              </a>
              <Button variant="secondary" className="sm:flex-1" onClick={() => close(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : !answered ? (
          <>
            <DialogTitle className="t-heading">Did you get through?</DialogTitle>
            <DialogDescription className="t-body text-slate">It helps us show who picks up.</DialogDescription>
            <div className="grid gap-2">
              <Button variant="secondary" onClick={() => answer("booked")}>
                Yes, booked it
              </Button>
              <Button variant="secondary" onClick={() => answer("not_booked")}>
                Yes, not booked
              </Button>
              <Button variant="secondary" onClick={() => answer("no_answer")}>
                No answer
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogTitle className="t-heading">{answered === "booked" ? "Great, you're sorted" : answered === "no_answer" ? "Sorry they didn't pick up" : "Thanks for letting us know"}</DialogTitle>
            <DialogDescription className="t-body text-slate">
              {answered === "booked" ? "You can review them after the job." : listing.layer === "claimed" ? "You can send them a message instead and they'll reply here." : "Try a similar business, or ask Answerd to find someone."}
            </DialogDescription>
            <div className="flex flex-col gap-2 sm:flex-row">
              {answered !== "booked" && listing.layer === "claimed" && onMessage && (
                <Button className="sm:flex-1" onClick={() => (close(false), onMessage())}>
                  Message
                </Button>
              )}
              <Button variant="secondary" className="sm:flex-1" onClick={() => close(false)}>
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

const REASONS = ["Wrong information", "Business has closed", "Fake or spam listing", "Offensive content", "Safety concern"]

/** C-45 on the web: report a listing. */
export function ReportDialog({ listing, open, onOpenChange }: { listing: Listing; open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useStore()
  const [reason, setReason] = React.useState("")
  const [details, setDetails] = React.useState("")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogCls}>
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-red-tint text-red">
          <Flag className="size-6" aria-hidden />
        </span>
        <DialogTitle className="t-heading">Report {listing.name}</DialogTitle>
        <DialogDescription className="t-body text-slate">Tell us what&apos;s wrong. Our team reviews every report.</DialogDescription>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!reason) return
            s.report("listing", listing.id, reason, details.trim())
            toast("Thanks, we'll review it")
            setReason("")
            setDetails("")
            onOpenChange(false)
          }}
        >
          <div role="radiogroup" aria-label="Reason" className="grid gap-2">
            {REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className={cn("flex min-h-11 items-center rounded-xl border px-3 text-left t-label", reason === r ? "border-blue bg-blue-tint text-navy" : "border-line text-navy hover:border-blue/50")}>
                {r}
              </button>
            ))}
          </div>
          <Field label="Details" htmlFor="rep-details" optional>
            <TextArea id="rep-details" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} />
          </Field>
          <Button type="submit" block disabled={!reason}>
            Send report
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
