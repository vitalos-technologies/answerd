"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { ChatBubble, SlotCard, QuoteCard, BookingCard } from "@/components/answerd/Chat"
import { useStore } from "@/lib/store"
import type { Message, Thread } from "@/lib/types"
import { fmtRelDay, fmtTime, sameDay } from "@/lib/time"
import { serviceById } from "@/lib/selectors"
import { toast } from "@/lib/toast"

/** Renders a thread's messages with connected inline cards. */
export function MessageList({ thread, viewer }: { thread: Thread; viewer: "customer" | "business" }) {
  const router = useRouter()
  const s = useStore()
  const messages = s.messages.filter((m) => m.threadId === thread.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const listing = s.listings.find((l) => l.id === thread.listingId)

  const pickSlot = (m: Message, slot: string) => {
    if (viewer !== "customer" || !listing || m.card?.kind !== "slot") return
    if (m.card.bookingId) {
      s.acceptProposal(m.card.bookingId, slot)
      toast("New time accepted")
      router.push(`/app/bookings/${m.card.bookingId}`)
      return
    }
    const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
    const home = profile?.savedPlaces.find((p) => /home/i.test(p.label)) ?? profile?.savedPlaces[0]
    s.setDraft({
      listingId: listing.id,
      serviceId: m.card.serviceId,
      startAt: slot,
      address: home?.line1 ? `${home.line1}, London` : undefined,
      postcode: home?.postcode ?? s.session.location?.postcode,
      contactPhone: s.users.find((u) => u.id === s.session.userId)?.phone,
      notes: messages.filter((x) => x.author === "customer").at(-1)?.body,
      fromSlotCard: true,
    })
    router.push(`/app/b/${listing.slug}/book/confirm?thread=${thread.id}`)
  }

  return (
    <div className="space-y-3">
      {messages.map((m, i) => {
        const prev = messages[i - 1]
        // Label above the first bubble of each turn
        const showLabel = !prev || prev.author === "system" || prev.author !== m.author || (prev.authorName ?? "") !== (m.authorName ?? "")
        const dayChange = !prev || !sameDay(prev.createdAt, m.createdAt)
        let card: React.ReactNode = null
        if (m.card?.kind === "slot") {
          const svc = serviceById(s, m.card.serviceId)
          card = <SlotCard slots={m.card.slots} serviceName={svc?.name} onPick={viewer === "customer" ? (slot) => pickSlot(m, slot) : undefined} disabled={viewer !== "customer"} />
        } else if (m.card?.kind === "quote") {
          const q = s.quotes.find((x) => x.id === (m.card as { quoteId: string }).quoteId)
          if (q)
            card = (
              <QuoteCard
                lines={q.lines}
                totalPence={q.totalPence}
                vatPence={q.vatPence}
                vatIncluded={q.vatIncluded}
                validUntil={q.validUntil}
                status={q.status}
                canRespond={viewer === "customer"}
                onAccept={() => {
                  s.respondToQuote(q.id, true)
                  toast("Quote accepted")
                }}
                onDecline={() => {
                  s.respondToQuote(q.id, false)
                  toast("Quote declined")
                }}
              />
            )
        } else if (m.card?.kind === "booking") {
          const b = s.bookings.find((x) => x.id === (m.card as { bookingId: string }).bookingId)
          if (b)
            card = (
              <BookingCard
                service={serviceById(s, b.serviceId)?.name ?? "Booking"}
                startAt={b.startAt}
                status={b.status}
                priceText={b.priceText}
                onOpen={() => router.push(viewer === "customer" ? `/app/bookings/${b.id}` : b.status === "requested" ? `/app/biz/requests/${b.id}` : `/app/biz/jobs/${b.id}`)}
              />
            )
        }
        const name = m.author === "customer" ? thread.customerName : m.authorName ?? listing?.name
        return (
          <React.Fragment key={m.id}>
            {dayChange && <p className="pt-1 text-center t-caption text-muted-ink">{fmtRelDay(m.createdAt, s.clock)}</p>}
            <ChatBubble author={m.author} authorName={name} time={fmtTime(m.createdAt)} showLabel={showLabel} queued={m.queued} card={card} viewer={viewer}>
              {m.body ? (
                <>
                  {m.body}
                  {m.attachments.length > 0 && <span className="mt-1 block text-[12px] opacity-80">📎 {m.attachments.join(", ")}</span>}
                </>
              ) : null}
            </ChatBubble>
          </React.Fragment>
        )
      })}
    </div>
  )
}
