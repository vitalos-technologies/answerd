"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, Briefcase, CalendarCheck, MessageCircle, Star } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { DataGate, signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { fmtAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

function iconFor(event: string) {
  if (/message|desk|quote/.test(event)) return MessageCircle
  if (/review/.test(event)) return Star
  if (/booking|reminder|way|arrived|completed|cancel|resched|change|time/.test(event)) return CalendarCheck
  return Bell
}

/** C-46: activity feed; business notifications switch to business mode first. */
export default function NotificationsPage() {
  const router = useRouter()
  const s = useStore()
  const list = s.notifications.filter((n) => n.userId === s.session.userId).sort((a, b) => b.at.localeCompare(a.at))
  const unread = list.filter((n) => !n.readAt).length
  return (
    <AppScreen
      id="C-46"
      header={<TopBar title="Notifications" back actions={unread ? <button type="button" onClick={s.markAllNotificationsRead} className="inline-flex min-h-11 items-center px-2 t-label text-blue">Mark all read</button> : undefined} />}
    >
      {!s.session.userId ? (
        <EmptyState title="Sign in to see notifications" body="Replies, confirmations and reminders land here." action={<ButtonLink href={signInHref("/app/notifications")} size="md">Sign in</ButtonLink>} />
      ) : (
        <DataGate isEmpty={!list.length} empty={<EmptyState title="All quiet" body="Replies, confirmations and reminders land here." />}>
          <ul className="divide-y divide-line bg-white">
            {list.map((n) => {
              const I = n.mode === "business" ? Briefcase : iconFor(n.event)
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      s.markNotificationRead(n.id)
                      if (n.mode === "business") s.setMode("business", n.businessId)
                      else if (s.session.mode === "business") s.setMode("customer")
                      router.push(n.href)
                    }}
                    className={cn("flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-sky", !n.readAt && "bg-blue-tint/50")}
                  >
                    <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", n.mode === "business" ? "bg-navy text-white" : "bg-blue-tint text-blue")}>
                      <I className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="flex-1 t-label text-navy">{n.title}</span>
                        <span className="t-caption text-muted-ink tnum">{fmtAgo(n.at, s.clock)}</span>
                      </span>
                      <span className="block t-label font-normal text-slate">{n.body}</span>
                      {n.mode === "business" && <span className="mt-1 inline-block rounded-full bg-navy/10 px-2 py-0.5 t-caption text-navy">Business</span>}
                    </span>
                    {!n.readAt && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-blue" aria-label="Unread" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </DataGate>
      )}
    </AppScreen>
  )
}
