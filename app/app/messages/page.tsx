"use client"
import * as React from "react"
import Link from "next/link"
import { Bot } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ListingAvatar } from "@/components/answerd/Media"
import { EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { DataGate, signInHref } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { fmtAgo } from "@/lib/time"
import { cn } from "@/lib/utils"

/** C-33: threads newest first, unread dots, an "Answerd desk" tag when the desk replied last. */
export default function MessagesPage() {
  const s = useStore()
  const userId = s.session.userId
  const threads = userId ? s.threads.filter((t) => t.customerId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : []

  return (
    <AppScreen id="C-33" tabs="customer" header={<TopBar title="Messages" />}>
      {!userId ? (
        <EmptyState title="Sign in to message businesses" body="Message a business and replies land here." action={<ButtonLink href={signInHref("/app/messages")} size="md">Sign in</ButtonLink>} />
      ) : (
        <DataGate isEmpty={!threads.length} empty={<EmptyState title="No messages yet" body="Message a business and replies land here." action={<ButtonLink href="/app/search" size="md">Find a business</ButtonLink>} />}>
          <ul className="divide-y divide-line bg-white">
            {threads.map((t) => {
              const l = s.listings.find((x) => x.id === t.listingId)
              const msgs = s.messages.filter((m) => m.threadId === t.id && m.author !== "system")
              const last = msgs.at(-1)
              const lastBiz = [...msgs].reverse().find((m) => m.author !== "customer")
              const unread = t.unreadCustomer > 0
              if (!l) return null
              return (
                <li key={t.id}>
                  <Link href={`/app/messages/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-sky">
                    <ListingAvatar initials={l.initials} hue={l.hue} size={48} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("flex-1 truncate t-label", unread ? "font-semibold text-navy" : "text-navy")}>{l.name}</p>
                        <span className="shrink-0 t-caption text-muted-ink tnum">{fmtAgo(t.updatedAt, s.clock)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={cn("flex-1 truncate t-label font-normal", unread ? "text-navy" : "text-muted-ink")}>
                          {last ? `${last.author === "customer" ? "You: " : ""}${last.body}` : "No messages yet"}
                        </p>
                        {unread && <span className="size-2.5 shrink-0 rounded-full bg-blue" aria-label="Unread" />}
                      </div>
                      {lastBiz?.author === "desk" && (
                        <span className="mt-1 inline-flex h-5 items-center gap-1 rounded-full bg-teal-tint px-2 t-caption text-teal-ink">
                          <Bot className="size-3" aria-hidden /> Answerd desk
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </DataGate>
      )}
    </AppScreen>
  )
}
