"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check } from "lucide-react"
import { AppScreen } from "@/components/shells/AppScreen"
import { RouteSheet } from "@/components/app/RouteSheet"
import { Button } from "@/components/answerd/Button"
import { Field, TextArea } from "@/components/answerd/Fields"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

const REASONS = ["Wrong information", "Closed", "Fake", "Offensive", "Safety concern"]

/** C-45: one report sheet for listings, reviews and users; it lands in admin (A-09). */
function ReportSheet() {
  const router = useRouter()
  const sp = useSearchParams()
  const target = (sp.get("target") as "listing" | "review" | "user") ?? "listing"
  const id = sp.get("id") ?? ""
  const s = useStore()
  const [reason, setReason] = React.useState<string | null>(null)
  const [details, setDetails] = React.useState("")
  const what = target === "review" ? "review" : target === "user" ? "problem" : s.listings.find((l) => l.id === id)?.name ?? "business"
  const close = () => (window.history.length > 1 ? router.back() : router.push("/app"))
  return (
    <AppScreen id="C-45">
      <RouteSheet title={target === "user" ? "Report a problem" : `Report ${target === "review" ? "this review" : what}`} onClose={close} backdrop={<div className="h-full bg-sky" />}>
        <fieldset>
          <legend className="t-label text-navy">What&apos;s wrong?</legend>
          <div className="mt-2 space-y-2" role="radiogroup">
            {REASONS.map((r) => (
              <button key={r} type="button" role="radio" aria-checked={reason === r} onClick={() => setReason(r)} className={cn("flex min-h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left t-label text-navy", reason === r ? "border-blue bg-blue-tint" : "border-line")}>
                <span className={cn("inline-flex size-5 items-center justify-center rounded-full border-2", reason === r ? "border-blue bg-blue text-white" : "border-line")}>{reason === r && <Check className="size-3" aria-hidden />}</span>
                {r}
              </button>
            ))}
          </div>
        </fieldset>
        <Field label="Details" htmlFor="details" optional className="mt-4">
          <TextArea id="details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything that helps us check" />
        </Field>
        <Button
          block
          className="mt-4"
          disabled={!reason}
          onClick={() => {
            s.report(target, id, reason!, details.trim())
            toast("Thanks, we'll review it")
            close()
          }}
        >
          Send
        </Button>
      </RouteSheet>
    </AppScreen>
  )
}

export default withSuspense(ReportSheet)
