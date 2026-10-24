"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Bot, CalendarPlus, ChevronRight, FileText, Hand, Info, Phone, SendHorizontal, UserCheck } from "lucide-react"
import { useStore } from "@/lib/store"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button, IconButton } from "@/components/answerd/Button"
import { BottomSheet } from "@/components/answerd/Sheet"
import { StatusPill } from "@/components/answerd/Status"
import { TextArea } from "@/components/answerd/Fields"
import { PersonAvatar } from "@/components/answerd/Media"
import { MessageList } from "@/components/app/MessageList"
import { deskFor, roleIn, serviceById } from "@/lib/selectors"
import { fmtDateTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Thread } from "@/lib/types"
import { customerBookings } from "./data"
import { useOpsLinks } from "./links"
import { ProposeTimesSheet } from "./ProposeTimesSheet"

const QUICK = ["Thanks, I'll call you shortly.", "Could you send a photo of the problem?", "What's your postcode?", "See you then."]

const CHANNEL: Record<Thread["channel"], string> = { app: "Answerd app", sms: "SMS", call: "Phone call" }

export function customerPhoneFor(s: ReturnType<typeof useStore.getState>, t: Pick<Thread, "customerId" | "customerPhone">) {
  return t.customerPhone || s.users.find((u) => u.id === t.customerId)?.phone || ""
}

/** Past bookings with this business and private notes about the customer. */
export function CustomerPanel({ thread, className }: { thread: Thread; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const [notes, setNotes] = React.useState(thread.notes ?? "")
  const past = customerBookings(s, thread.listingId, thread.customerId, thread.customerName)
  const phone = customerPhoneFor(s, thread)
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-3">
        <PersonAvatar name={thread.customerName} size={44} tone="blue" />
        <div className="min-w-0">
          <p className="t-subhead">{thread.customerName}</p>
          <p className="t-caption text-muted-ink tnum">{phone ? `${phone} · ` : ""}via {CHANNEL[thread.channel]}</p>
        </div>
      </div>
      <section aria-labelledby="cp-bookings">
        <h3 id="cp-bookings" className="t-label text-navy">
          Bookings with you
        </h3>
        {past.length ? (
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {past.map((b) => (
              <li key={b.id}>
                <Link href={b.status === "requested" ? links.request(b.id) : links.job(b.id)} className="flex min-h-14 items-center gap-2 px-3 py-2 hover:bg-sky">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-label text-navy">{serviceById(s, b.serviceId)?.name ?? "Job"}</span>
                    <span className="block t-caption text-muted-ink tnum">{fmtDateTime(b.startAt)}</span>
                  </span>
                  <StatusPill status={b.status} />
                  <ChevronRight className="size-4 text-muted-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 t-caption text-muted-ink">No bookings yet.</p>
        )}
      </section>
      <section aria-labelledby="cp-notes">
        <label id="cp-notes" htmlFor={`notes-${thread.id}`} className="t-label text-navy">
          Notes
        </label>
        <p className="t-caption text-muted-ink">Only your team sees these.</p>
        <TextArea id={`notes-${thread.id}`} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Worcester combi, side gate code 1234" className="mt-1.5" />
        <Button
          size="sm"
          variant="secondary"
          className="mt-2"
          disabled={notes === (thread.notes ?? "")}
          onClick={() => {
            useStore.getState().setThreadNotes(thread.id, notes)
            toast("Notes saved")
          }}
        >
          Save notes
        </Button>
      </section>
    </div>
  )
}

/**
 * B-20 conversation: labelled desk turns, Take over (pauses the desk for this thread),
 * Mark as mine, quick replies, Propose times (SlotCard), Send quote (B-26) and the customer panel.
 * Fills its parent (a flex column with its own scroll area), so it drops into a desktop pane.
 */
export function ConversationView({ threadId, back, customerPanel = "sheet", className }: { threadId: string; back?: string; customerPanel?: "sheet" | "none"; className?: string }) {
  const s = useStore()
  const router = useRouter()
  const links = useOpsLinks()
  const thread = s.threads.find((t) => t.id === threadId)
  const listing = s.listings.find((l) => l.id === thread?.listingId)
  const [text, setText] = React.useState("")
  const [propose, setPropose] = React.useState(false)
  const [info, setInfo] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)
  const count = s.messages.filter((m) => m.threadId === threadId).length
  const { markThreadRead } = s
  const unread = thread?.unreadBusiness ?? 0

  React.useEffect(() => {
    if (unread > 0) markThreadRead(threadId, "business")
  }, [unread, threadId, markThreadRead])
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [count])

  if (!thread || !listing || thread.listingId !== s.listings.find((l) => l.businessId === (s.session.supportViewBusinessId ?? s.session.currentBusinessId))?.id) {
    return <EmptyState title="Conversation not found" body="It may belong to another business." />
  }
  const role = roleIn(s, s.session.userId, listing.businessId ?? null)
  const author = role === "staff" ? "staff" : "owner"
  const readOnly = !role
  const deskLive = deskFor(s, listing.businessId)?.status === "live" && !s.settings.killSwitch
  const deskOn = deskLive && thread.deskActive
  const first = thread.customerName.split(" ")[0]
  const phone = customerPhoneFor(s, thread)
  const mine = thread.assignedTo && thread.assignedTo === s.session.userId
  const assignee = thread.assignedTo ? s.members.find((m) => m.userId === thread.assignedTo)?.name : null

  const send = (body: string) => {
    const b = body.trim()
    if (!b) return
    s.sendMessage(thread.id, author, b)
    setText("")
  }
  const call = () => toast(phone ? `Calling ${first} on ${phone} (prototype dialer)` : `No number for ${first}`)

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <header className="flex min-h-14 shrink-0 items-center gap-1 border-b border-line bg-white px-2">
        {back && (
          <IconButton label="Back" onClick={() => router.push(back)}>
            <ArrowLeft />
          </IconButton>
        )}
        <div className={cn("min-w-0 flex-1", !back && "pl-2")}>
          <h1 className="truncate t-subhead">{thread.customerName}</h1>
          <p className="truncate t-caption text-muted-ink">
            {CHANNEL[thread.channel]}
            {assignee ? ` · ${mine ? "Yours" : `Assigned to ${assignee.split(" ")[0]}`}` : ""}
          </p>
        </div>
        <IconButton label={`Call ${first}`} onClick={call}>
          <Phone />
        </IconButton>
        {customerPanel === "sheet" && (
          <IconButton label="Customer details" onClick={() => setInfo(true)}>
            <Info />
          </IconButton>
        )}
      </header>

      <div className="shrink-0 space-y-2 border-b border-line bg-white px-4 py-2.5">
        {thread.status === "needs_owner" && (
          <Banner tone="error" icon={<Hand className="size-5" aria-hidden />} title={`${first} needs you`}>
            {thread.handoffReason ?? "The desk handed this conversation to you."}
          </Banner>
        )}
        {deskLive ? (
          deskOn ? (
            <div className="flex items-center gap-2">
              <Bot className="size-5 shrink-0 text-teal-ink" aria-hidden />
              <p className="min-w-0 flex-1 t-caption text-slate">The Answerd desk is replying to {first}.</p>
              <Button size="sm" disabled={readOnly} onClick={() => (s.setThreadDesk(thread.id, false), toast("You took over. The desk is paused here."))}>
                Take over
              </Button>
            </div>
          ) : (
            <Banner tone="warning" title="You're replying. The desk is paused for this conversation." action={<Button size="sm" variant="secondary" disabled={readOnly} onClick={() => (s.setThreadDesk(thread.id, true), toast("The desk is back on for this conversation"))}><Bot /> Hand back to the desk</Button>} />
          )
        ) : (
          <p className="t-caption text-muted-ink">Your AI desk is off, so you&apos;re replying.</p>
        )}
        {!mine && (
          <Button size="sm" variant="ghost" className="-ml-2 h-11" disabled={readOnly} onClick={() => (s.markThreadMine(thread.id), toast("Marked as yours"))}>
            <UserCheck /> Mark as mine
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-sky px-4 py-4">
        {customerPanel === "sheet" && (
          <button type="button" onClick={() => setInfo(true)} className="mb-4 flex min-h-12 w-full items-center gap-3 rounded-2xl border border-line bg-white px-3 py-2 text-left hover:border-blue">
            <PersonAvatar name={thread.customerName} size={32} tone="blue" />
            <span className="min-w-0 flex-1">
              <span className="block truncate t-label text-navy">{thread.customerName}</span>
              <span className="block truncate t-caption text-muted-ink">
                {(() => {
                  const n = customerBookings(s, thread.listingId, thread.customerId, thread.customerName).length
                  return n ? `${n} booking${n > 1 ? "s" : ""} with you` : "No bookings with you yet"
                })()}
                {thread.notes ? " · has notes" : ""}
              </span>
            </span>
            <span className="t-caption text-blue">Details</span>
          </button>
        )}
        <MessageList thread={thread} viewer="business" />
        <div ref={endRef} className="h-1" />
      </div>

      {!readOnly && (
        <div className="shrink-0 border-t border-line bg-white px-3 pb-3 pt-2">
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            <button type="button" onClick={() => setPropose(true)} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-blue-tint px-3.5 t-label text-blue hover:bg-[#dbe5ff]">
              <CalendarPlus className="size-4" aria-hidden /> Propose times
            </button>
            <Link href={links.quote(thread.id)} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-blue-tint px-3.5 t-label text-blue hover:bg-[#dbe5ff]">
              <FileText className="size-4" aria-hidden /> Send quote
            </Link>
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => send(q)} className="inline-flex h-11 shrink-0 items-center rounded-full border border-line px-3.5 t-caption text-navy hover:border-blue">
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
            <label className="flex min-h-11 flex-1 items-center rounded-3xl border border-line bg-sky px-4 focus-within:border-blue">
              <span className="sr-only">Reply to {first}</span>
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
                placeholder={`Reply to ${first}`}
                className="max-h-28 w-full resize-none bg-transparent py-2.5 t-body text-navy outline-none placeholder:text-muted-ink"
              />
            </label>
            <button type="submit" aria-label="Send" disabled={!text.trim()} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover disabled:opacity-40">
              <SendHorizontal className="size-5" />
            </button>
          </form>
        </div>
      )}

      <ProposeTimesSheet
        open={propose}
        onClose={() => setPropose(false)}
        listing={listing}
        onSubmit={(slots, serviceId) => {
          s.proposeTime(thread.id, slots, serviceId)
          toast(slots.length > 1 ? `${slots.length} times sent to ${first}` : `Time sent to ${first}`)
        }}
      />
      {customerPanel === "sheet" && (
        <BottomSheet open={info} onClose={() => setInfo(false)} title="Customer">
          <CustomerPanel thread={thread} />
        </BottomSheet>
      )}
    </div>
  )
}
