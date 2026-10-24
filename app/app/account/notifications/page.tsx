"use client"
import * as React from "react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ToggleRow } from "@/components/answerd/Fields"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"

/** C-42: toggles save instantly. */
export default function NotificationSettings() {
  const s = useStore()
  const p = s.customerProfiles.find((x) => x.userId === s.session.userId)
  if (!p) return <AppScreen id="C-42" header={<TopBar title="Notifications" back="/app/account" />}><EmptyState title="Sign in first" body="Notification settings belong to your account." /></AppScreen>
  const set = (k: keyof typeof p.notificationPrefs) => (v: boolean) => {
    s.updateCustomerPrefs({ [k]: v })
    toast("Saved")
  }
  const n = p.notificationPrefs
  return (
    <AppScreen id="C-42" header={<TopBar title="Notifications" back="/app/account" />}>
      <div className="space-y-4 p-4">
        <section className="card px-4" aria-label="Booking updates">
          <h2 className="pt-4 t-subhead">Booking updates</h2>
          <div className="divide-y divide-line">
            <ToggleRow label="Push" description="Confirmations, on-the-way and changes" checked={n.bookingPush} onChange={set("bookingPush")} />
            <ToggleRow label="SMS" description="Time-critical updates by text" checked={n.bookingSms} onChange={set("bookingSms")} />
          </div>
        </section>
        <section className="card divide-y divide-line px-4" aria-label="Other notifications">
          <ToggleRow label="Messages" description="Push when a business replies" checked={n.messagesPush} onChange={set("messagesPush")} />
          <ToggleRow label="Reminders" description="24 hours before a booking" checked={n.reminders} onChange={set("reminders")} />
          <ToggleRow label="Review requests" description="Once, after a job is done" checked={n.reviewRequests} onChange={set("reviewRequests")} />
          <ToggleRow label="Offers and news" description="Off unless you turn it on" checked={n.offers} onChange={set("offers")} />
        </section>
      </div>
    </AppScreen>
  )
}
