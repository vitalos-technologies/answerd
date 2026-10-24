"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, X } from "lucide-react"
import { useStore } from "@/lib/store"
import { EmptyState } from "@/components/answerd/Feedback"
import { IconButton } from "@/components/answerd/Button"
import { InboxFilters, InboxList, INBOX_FILTERS } from "@/components/biz/ops/Inbox"
import { ConversationView } from "@/components/biz/ops/Conversation"
import { CallDetail } from "@/components/biz/ops/CallDetail"
import { BookingRequestCard } from "@/components/biz/ops/RequestCard"
import { JobPanel } from "@/components/biz/ops/JobPanel"
import { QuoteForm } from "@/components/biz/ops/QuoteForm"
import { inboxItems, type InboxFilter, type InboxItem } from "@/components/biz/ops/data"
import { cn } from "@/lib/utils"

type Sel = { kind: "thread" | "call" | "request" | "job"; id: string } | null

const KINDS = ["thread", "call", "request", "job"] as const

/** Which row is open, from the URL (?thread=, ?call=, ?request= or ?job=). */
function readSel(sp: URLSearchParams): Sel {
  for (const k of KINDS) {
    const id = sp.get(k)
    if (id) return { kind: k, id }
  }
  return null
}

/**
 * W-14: three panes. Filters (as B-19), the thread list (B-19 rows) and the open item:
 * a conversation (B-20, with Take over, Propose times, Send quote and the customer panel),
 * a call with its recording and transcript (B-21), a booking request (B-22) or a job (B-24).
 * Below 1280 px the filters become chips; below 1024 px one pane shows at a time.
 */
export function InboxPanes({ listingId }: { listingId: string }) {
  const s = useStore()
  const sp = useSearchParams()
  const router = useRouter()
  const raw = sp.get("f")
  const filter: InboxFilter = INBOX_FILTERS.some((f) => f.value === raw) ? (raw as InboxFilter) : "all"
  const sel = readSel(sp)
  const quote = sp.get("quote") === "1"

  const go = (next: { f?: InboxFilter; sel?: Sel; quote?: boolean }) => {
    const p = new URLSearchParams()
    const f = next.f ?? filter
    if (f !== "all") p.set("f", f)
    const target = next.sel === undefined ? sel : next.sel
    if (target) p.set(target.kind, target.id)
    if (next.quote && target?.kind === "thread") p.set("quote", "1")
    const q = p.toString()
    router.replace(`/dashboard/inbox${q ? `?${q}` : ""}`, { scroll: false })
  }

  // Counts follow the hub's Preview states, like the list does
  const counts = Object.fromEntries(INBOX_FILTERS.map((f) => [f.value, s.stateOverride === "none" ? inboxItems(s, listingId, f.value).length : 0])) as Record<InboxFilter, number>
  const selectedKey = keyFor(s, sel)
  const onSelect = (i: InboxItem) => go({ sel: { kind: i.link, id: i.linkId } })

  return (
    <div className="grid gap-4 lg:h-[calc(100dvh-112px)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[200px_320px_minmax(0,1fr)]">
      {/* Pane 1: filters (from 1280 px) */}
      <nav aria-label="Filter the inbox" className="card hidden h-full overflow-y-auto p-2 xl:block">
        <ul className="space-y-0.5">
          {INBOX_FILTERS.map((f) => (
            <li key={f.value}>
              <button
                type="button"
                onClick={() => go({ f: f.value })}
                aria-pressed={filter === f.value}
                className={cn("flex h-11 w-full items-center gap-2 rounded-xl px-3 text-left t-label", filter === f.value ? "bg-blue-tint text-blue" : "text-slate hover:bg-sky hover:text-navy")}
              >
                <span className="flex-1">{f.label}</span>
                {counts[f.value] > 0 && <span className={cn("t-caption tnum", filter === f.value ? "text-blue" : "text-muted-ink")}>{counts[f.value]}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Pane 2: thread list */}
      <div className={cn("min-h-0 min-w-0 flex-col gap-3 lg:flex", sel ? "hidden" : "flex")}>
        <InboxFilters value={filter} onChange={(f) => go({ f })} counts={counts} className="xl:hidden" />
        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl lg:pr-0.5">
          <InboxList listingId={listingId} filter={filter} selectedKey={selectedKey} onSelect={onSelect} />
        </div>
      </div>

      {/* Pane 3: the open conversation, call, request or job */}
      <div className={cn("card min-h-0 min-w-0 flex-col overflow-hidden lg:flex", sel ? "flex h-[calc(100dvh-150px)] min-h-[520px] lg:h-auto lg:min-h-0" : "hidden")}>
        {sel ? (
          <>
            <div className="flex h-12 shrink-0 items-center gap-1 border-b border-line px-1 lg:hidden">
              <IconButton label="Back to the inbox" onClick={() => go({ sel: null })}>
                <ArrowLeft />
              </IconButton>
              <span className="t-label text-navy">Inbox</span>
            </div>
            <OpenItem sel={sel} quote={quote} onQuote={(open) => go({ quote: open })} onClose={() => go({ sel: null })} />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState title="Pick a conversation" body="Calls, texts, app messages and booking requests open here." className="max-w-sm" />
          </div>
        )}
      </div>
    </div>
  )
}

function keyFor(s: ReturnType<typeof useStore.getState>, sel: Sel) {
  if (!sel) return undefined
  if (sel.kind === "thread") return `t-${sel.id}`
  if (sel.kind === "request" || sel.kind === "job") return `r-${sel.id}`
  const call = s.calls.find((c) => c.id === sel.id)
  return call?.threadId && s.threads.some((t) => t.id === call.threadId) ? `t-${call.threadId}` : `c-${sel.id}`
}

function PaneHeader({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) {
  return (
    <div className="flex min-h-14 shrink-0 items-center gap-2 border-b border-line bg-white pl-4 pr-1">
      <div className="min-w-0 flex-1">
        <h2 className="truncate t-subhead">{title}</h2>
        {sub && <p className="truncate t-caption text-muted-ink">{sub}</p>}
      </div>
      <IconButton label="Close" onClick={onClose} className="max-lg:hidden">
        <X />
      </IconButton>
    </div>
  )
}

function OpenItem({ sel, quote, onQuote, onClose }: { sel: NonNullable<Sel>; quote: boolean; onQuote: (open: boolean) => void; onClose: () => void }) {
  const s = useStore()
  if (sel.kind === "thread") {
    const t = s.threads.find((x) => x.id === sel.id)
    if (quote && t) {
      return (
        <>
          <PaneHeader title={`Send a quote to ${t.customerName.split(" ")[0]}`} sub="Line items, VAT, total and valid until" onClose={() => onQuote(false)} />
          <div className="min-h-0 flex-1 overflow-y-auto bg-sky p-4">
            <div className="card mx-auto max-w-xl p-4">
              <QuoteForm key={t.id} threadId={t.id} onSent={() => onQuote(false)} onCancel={() => onQuote(false)} />
            </div>
          </div>
        </>
      )
    }
    return <ConversationView key={sel.id} threadId={sel.id} className="min-h-0 flex-1" />
  }
  if (sel.kind === "call") {
    const c = s.calls.find((x) => x.id === sel.id)
    return (
      <>
        <PaneHeader title={c?.customerName ?? c?.callerMasked ?? "Call"} sub="Call detail" onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto bg-sky p-4">
          <CallDetail key={sel.id} callId={sel.id} className="mx-auto max-w-2xl" />
        </div>
      </>
    )
  }
  const b = s.bookings.find((x) => x.id === sel.id)
  return (
    <>
      <PaneHeader title={b ? b.customerName : sel.kind === "request" ? "Booking request" : "Job"} sub={sel.kind === "request" ? "Booking request" : "Job"} onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto bg-sky p-4">
        <div className="mx-auto max-w-2xl">{sel.kind === "request" ? <BookingRequestCard key={sel.id} bookingId={sel.id} /> : <JobPanel key={sel.id} bookingId={sel.id} />}</div>
      </div>
    </>
  )
}
