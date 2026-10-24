"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ImagePlus, SendHorizontal, X } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { ChatBubble, SlotCard, QuoteCard, BookingCard, TypingIndicator } from "@/components/answerd/Chat"
import { ListingAvatar } from "@/components/answerd/Media"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextArea, TextInput, Chip } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { isDeskLive, replyLine, serviceById } from "@/lib/selectors"
import { lookupPostcode } from "@/lib/geo"
import { fmtRelDay, fmtTime, sameDay } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { Listing, Message } from "@/lib/types"

const QUICK = ["Are you free this week?", "Can you send a quote?"]
const WHEN = ["ASAP", "This week", "Flexible"]

/**
 * W-06 Message: the C-22 thread in a side panel. Props: listing, open, onOpenChange, initialText (from Ask Answerd).
 * First message uses the C-23 enquiry template (what, postcode, when) through startThread.
 */
export function MessagePanel({ listing, open, onOpenChange, initialText }: { listing: Listing; open: boolean; onOpenChange: (v: boolean) => void; initialText?: string }) {
  const s = useStore()
  const router = useRouter()
  const userId = s.session.userId
  const thread = s.threads.find((t) => t.listingId === listing.id && t.customerId === userId && userId && t.channel === "app")
  const messages = thread ? s.messages.filter((m) => m.threadId === thread.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []
  const desk = isDeskLive(s, listing) && (thread ? thread.deskActive : true)
  const [text, setText] = React.useState(initialText ?? "")
  const [postcode, setPostcode] = React.useState(s.session.location?.postcode ?? "")
  const [when, setWhen] = React.useState("This week")
  const [photos, setPhotos] = React.useState<string[]>([])
  const [error, setError] = React.useState("")
  const [typing, setTyping] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([])
  React.useEffect(() => () => timers.current.forEach(clearTimeout), [])
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [messages.length, typing, open])
  React.useEffect(() => {
    if (open && thread && thread.unreadCustomer > 0) useStore.getState().markThreadRead(thread.id, "customer")
  }, [open, thread])

  const deskReply = (threadId: string) => {
    if (!desk || useStore.getState().offline) return
    timers.current.push(setTimeout(() => setTyping(true), 600))
    timers.current.push(
      setTimeout(() => {
        setTyping(false)
        const last = useStore.getState().messages.filter((m) => m.threadId === threadId).at(-1)
        if (last?.author === "customer") useStore.getState().deskAutoReply(threadId)
      }, 2000),
    )
  }

  const send = (body: string) => {
    const b = body.trim()
    if (!thread) {
      if (b.length < 5) return setError("Tell them a little about the job")
      if (postcode.trim() && !lookupPostcode(postcode)) return setError("We don't recognise that postcode")
      setError("")
      const id = s.startThread(listing.id, { body: b, photos, postcode: lookupPostcode(postcode)?.postcode, when })
      setText("")
      setPhotos([])
      deskReply(id)
      return
    }
    if (!b && !photos.length) return
    s.sendMessage(thread.id, "customer", b || "Photo", { attachments: photos })
    setText("")
    setPhotos([])
    deskReply(thread.id)
  }

  const pickSlot = (m: Message, slot: string) => {
    if (m.card?.kind !== "slot") return
    if (m.card.bookingId) {
      s.acceptProposal(m.card.bookingId, slot)
      toast("New time accepted")
      return
    }
    const profile = s.customerProfiles.find((p) => p.userId === userId)
    const home = profile?.savedPlaces.find((p) => /home/i.test(p.label)) ?? profile?.savedPlaces[0]
    s.setDraft({
      listingId: listing.id,
      serviceId: m.card.serviceId,
      startAt: slot,
      address: home?.line1 ? `${home.line1}, London` : undefined,
      postcode: home?.postcode ?? s.session.location?.postcode,
      contactPhone: s.users.find((u) => u.id === userId)?.phone,
      notes: messages.filter((x) => x.author === "customer").at(-1)?.body,
      fromSlotCard: true,
    })
    router.push(`/b/${listing.slug}/book?step=details${thread ? `&thread=${thread.id}` : ""}`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full gap-0 bg-white p-0 sm:max-w-[440px]">
        <div className="flex items-center gap-3 border-b border-line px-4 py-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={40} />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate t-subhead">{listing.name}</SheetTitle>
            <SheetDescription className={desk ? "t-caption text-teal-ink" : "t-caption text-muted-ink"}>{desk ? "Answerd desk online · replies in a minute" : replyLine(s, listing)}</SheetDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close messages" className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky">
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-sky px-4 py-4">
          {!thread ? (
            <div className="space-y-3">
              <p className="t-subhead">What do you need?</p>
              <p className="t-label font-normal text-slate">Describe the job and {listing.name} will reply here. {desk ? "Their Answerd desk replies straight away if they're busy." : ""}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((m, i) => {
                const prev = messages[i - 1]
                const showLabel = !prev || prev.author === "system" || prev.author !== m.author
                let card: React.ReactNode = null
                if (m.card?.kind === "slot") card = <SlotCard slots={m.card.slots} serviceName={serviceById(s, m.card.serviceId)?.name} onPick={(slot) => pickSlot(m, slot)} />
                else if (m.card?.kind === "quote") {
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
                        canRespond
                        onAccept={() => (s.respondToQuote(q.id, true), toast("Quote accepted"))}
                        onDecline={() => (s.respondToQuote(q.id, false), toast("Quote declined"))}
                      />
                    )
                } else if (m.card?.kind === "booking") {
                  const b = s.bookings.find((x) => x.id === (m.card as { bookingId: string }).bookingId)
                  if (b) card = <BookingCard service={serviceById(s, b.serviceId)?.name ?? "Booking"} startAt={b.startAt} status={b.status} priceText={b.priceText} onOpen={() => router.push("/account")} />
                }
                return (
                  <React.Fragment key={m.id}>
                    {(!prev || !sameDay(prev.createdAt, m.createdAt)) && <p className="pt-1 text-center t-caption text-muted-ink">{fmtRelDay(m.createdAt, s.clock)}</p>}
                    <ChatBubble author={m.author} authorName={m.author === "customer" ? thread.customerName : (m.authorName ?? listing.name)} time={fmtTime(m.createdAt)} showLabel={showLabel} queued={m.queued} card={card}>
                      {m.body || null}
                    </ChatBubble>
                  </React.Fragment>
                )
              })}
              {typing && <TypingIndicator />}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-line bg-white px-4 pb-4 pt-3">
          {error && <Banner tone="error" className="mb-2" title={error} />}
          {!thread ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault()
                send(text)
              }}
            >
              <Field label="Your message" htmlFor="mp-text">
                <TextArea id="mp-text" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Kitchen tap is dripping. Could you fix it this week?" />
              </Field>
              <div className="grid grid-cols-[120px_1fr] items-end gap-3">
                <Field label="Postcode" htmlFor="mp-pc">
                  <TextInput id="mp-pc" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="uppercase" />
                </Field>
                <div role="group" aria-label="When" className="flex flex-wrap gap-1.5 pb-1.5">
                  {WHEN.map((w) => (
                    <Chip key={w} active={when === w} onClick={() => setWhen(w)}>
                      {w}
                    </Chip>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPhotos((x) => (x.length < 5 ? [...x, `photo-${x.length + 1}.jpg`] : x))} aria-label="Add a photo" className="inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky">
                  <ImagePlus className="size-5" />
                </button>
                {photos.length > 0 && <span className="t-caption text-muted-ink">{photos.length} photo{photos.length > 1 ? "s" : ""} attached</span>}
                <Button type="submit" className="ml-auto" size="md">
                  Send
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)} className="inline-flex h-9 shrink-0 items-center rounded-full border border-line px-3 t-caption text-navy hover:border-blue">
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  send(text)
                }}
              >
                <button type="button" onClick={() => setPhotos((x) => (x.length < 5 ? [...x, `photo-${x.length + 1}.jpg`] : x))} aria-label="Attach a photo" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-sky">
                  <ImagePlus className="size-5" />
                </button>
                <label className="flex min-h-11 flex-1 items-center rounded-3xl border border-line bg-sky px-4 focus-within:border-blue">
                  <span className="sr-only">Message</span>
                  <textarea
                    rows={1}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        send(text)
                      }
                    }}
                    placeholder="Message"
                    className="max-h-28 w-full resize-none bg-transparent py-2.5 t-body text-navy outline-none placeholder:text-muted-ink"
                  />
                </label>
                <button type="submit" aria-label="Send" disabled={!text.trim() && !photos.length} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover disabled:opacity-40">
                  <SendHorizontal className="size-5" />
                </button>
              </form>
            </>
          )}
          <p className="mt-2 text-center t-caption text-muted-ink">
            Also in the app:{" "}
            <Link href={thread ? `/app/messages/${thread.id}` : `/app/b/${listing.slug}/enquiry`} className="text-blue hover:underline">
              open this conversation in Answerd
            </Link>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
