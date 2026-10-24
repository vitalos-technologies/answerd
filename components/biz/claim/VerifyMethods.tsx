"use client"
import * as React from "react"
import { Building2, ChevronRight, FileUp, MessageSquareText, PhoneIncoming } from "lucide-react"
import { Banner } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import type { Claim } from "@/lib/types"
import { isLimitedCompany, latestClaim, listedIsLandline, maskListed } from "./helpers"

export type VerifyMethod = Claim["method"]

/**
 * B-04 body: Text a code to the listed number (hidden for landlines), Call me with a code,
 * Confirm as a company director (Ltd only), Upload a document.
 */
export function VerifyMethods({ listingId, onPick }: { listingId: string; onPick: (m: VerifyMethod) => void }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  if (!l) return null
  const landline = listedIsLandline(l)
  const ltd = isLimitedCompany(s, l)
  const prev = latestClaim(s, listingId)
  const masked = maskListed(l.phonePublic)
  const methods: { key: VerifyMethod; title: string; body: string; icon: typeof Building2; show: boolean }[] = [
    { key: "sms", title: `Text a code to ${masked}`, body: "The number listed for your business. Fastest.", icon: MessageSquareText, show: !landline },
    { key: "call", title: "Call me with a code", body: `We'll ring ${masked} and read out a 6-digit code.`, icon: PhoneIncoming, show: true },
    { key: "director", title: "Confirm as a company director", body: "We'll match you against Companies House.", icon: Building2, show: ltd },
    { key: "document", title: "Upload a document", body: "A bill or letter in the business name. Checked within 1 working day.", icon: FileUp, show: true },
  ]
  return (
    <div className="space-y-4">
      <div>
        <h1 className="t-title">Verify ownership</h1>
        <p className="mt-1 t-body text-slate">Show us {l.name} is yours. Pick whichever is easiest.</p>
      </div>
      {prev?.status === "rejected" && (
        <Banner tone="error" title="Your last document wasn't approved">
          {prev.reason ?? "We couldn't match it to the business."} Try another method or upload a different document.
        </Banner>
      )}
      {prev?.status === "pending" && (
        <Banner tone="warning" title="Verification pending">
          We&apos;re checking the document you sent. You can still verify another way now.
        </Banner>
      )}
      {landline && <p className="t-caption text-muted-ink">Your listed number is a landline, so we can&apos;t text it. Choose Call me with a code instead.</p>}
      <ul className="space-y-2">
        {methods
          .filter((m) => m.show)
          .map((m) => (
            <li key={m.key}>
              <button type="button" onClick={() => onPick(m.key)} className="flex w-full items-center gap-3 rounded-2xl border border-line bg-white p-4 text-left transition-colors hover:border-blue focus-visible:border-blue">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
                  <m.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy tnum">{m.title}</span>
                  <span className="block t-caption text-slate">{m.body}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
