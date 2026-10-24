"use client"
import * as React from "react"
import { ToggleRow } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { businessById } from "@/lib/selectors"
import { toast } from "@/lib/toast"
import type { Business } from "@/lib/types"

type Prefs = Business["notificationPrefs"]

const EVENTS: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: "newEnquiry", label: "New enquiry", sub: "Calls, messages and texts from customers" },
  { key: "handoff", label: "Desk handoff", sub: "When the desk needs you to call back or reply" },
  { key: "bookingRequest", label: "Booking request", sub: "Reply within 2 hours" },
  { key: "dailyDigest", label: "Daily digest at 7am", sub: "Today's jobs, overnight enquiries, what needs you" },
  { key: "reviewPosted", label: "Review posted", sub: "New reviews and replies" },
]
const CHANNELS: { key: keyof Prefs; label: string; sub: string }[] = [
  { key: "push", label: "Push", sub: "On this phone" },
  { key: "sms", label: "SMS", sub: "For handoffs, booking requests and the digest" },
  { key: "email", label: "Email", sub: "Receipts and weekly review roundup" },
]

/** B-39 business notifications: events and channels, saved instantly. Reused by W-19. */
export function BusinessNotificationPrefs({ businessId, readOnly }: { businessId: string; readOnly?: boolean }) {
  const s = useStore()
  const biz = businessById(s, businessId)
  if (!biz) return null
  const prefs = biz.notificationPrefs
  const set = (key: keyof Prefs, v: boolean) => {
    if (!v && CHANNELS.some((c) => c.key === key) && CHANNELS.filter((c) => c.key !== key).every((c) => !prefs[c.key])) {
      toast("Keep at least one channel on so you don't miss customers")
      return
    }
    s.updateBusiness(businessId, { notificationPrefs: { ...prefs, [key]: v } })
    toast("Saved")
  }
  return (
    <fieldset disabled={readOnly} className="min-w-0 space-y-4">
      <section aria-labelledby="bn-events">
        <h2 id="bn-events" className="mb-2 t-heading">
          Tell me about
        </h2>
        <div className="card divide-y divide-line px-4">
          {EVENTS.map((e) => (
            <ToggleRow key={e.key} label={e.label} description={e.sub} checked={prefs[e.key]} onChange={(v) => set(e.key, v)} />
          ))}
        </div>
      </section>
      <section aria-labelledby="bn-channels">
        <h2 id="bn-channels" className="mb-2 t-heading">
          How
        </h2>
        <div className="card divide-y divide-line px-4">
          {CHANNELS.map((c) => (
            <ToggleRow key={c.key} label={c.label} description={c.sub} checked={prefs[c.key]} onChange={(v) => set(c.key, v)} />
          ))}
        </div>
      </section>
      <p className="t-caption text-muted-ink">Emergencies from the desk always reach you by push and SMS.</p>
    </fieldset>
  )
}
