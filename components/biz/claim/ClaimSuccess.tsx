"use client"
import * as React from "react"
import { CalendarCheck, CheckCircle2, MessageCircle, Phone } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime } from "@/lib/time"
import { enquiryHistory, historyLine } from "./helpers"

const KIND = {
  call: { label: "Tracked call", icon: Phone },
  message: { label: "Message", icon: MessageCircle },
  booking: { label: "Booking request", icon: CalendarCheck },
} as const

/** B-08 body: confetti-free success and the enquiry history the marketplace has already logged. */
export function ClaimSuccess({ listingId, onContinue, maxItems = 6 }: { listingId: string; onContinue: () => void; maxItems?: number }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  if (!l) return null
  const h = enquiryHistory(s, listingId)
  const shortName = l.name.replace(/\s*(&|and)\s.*$/i, "").trim() || l.name
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center pt-4 text-center">
        <span className="inline-flex size-20 items-center justify-center rounded-full bg-teal-tint">
          <CheckCircle2 className="size-10 text-teal-ink" aria-hidden />
        </span>
        <h1 className="mt-5 t-title">{shortName} is yours</h1>
        <p className="mt-2 t-body text-slate">You&apos;re verified and live on Answerd. Customers can now message and book you, and you&apos;ll see every enquiry.</p>
      </div>

      <section className="card p-4" aria-labelledby="eh-title">
        <p className="t-caption text-muted-ink">Your enquiry history</p>
        <h2 id="eh-title" className="mt-1 t-subhead tnum">
          {historyLine(h)}
        </h2>
        {h.items.length > 0 && (
          <ul className="mt-3 divide-y divide-line">
            {h.items.slice(0, maxItems).map((e) => {
              const k = KIND[e.kind]
              return (
                <li key={e.id} className="flex items-center gap-3 py-2.5">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
                    <k.icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1 t-label text-navy">{k.label}</span>
                  <span className="t-caption text-slate tnum">
                    {fmtDate(e.at)}, {fmtTime(e.at)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {h.items.length > maxItems && <p className="mt-2 t-caption text-muted-ink tnum">And {h.items.length - maxItems} more. They&apos;re all in Stats.</p>}
        {h.total > 0 && <p className="mt-3 t-label font-normal text-slate">Switch on the AI desk and none of these go unanswered again.</p>}
      </section>

      <Button block onClick={onContinue}>
        Set up your profile
      </Button>
    </div>
  )
}
