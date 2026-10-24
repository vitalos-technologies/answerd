"use client"
import * as React from "react"
import Link from "next/link"
import { AlertTriangle, CalendarPlus, MessageCircle, Phone, SendHorizontal } from "lucide-react"
import { useStore } from "@/lib/store"
import { askTurn, emptyContext, ASK_CHIPS, ASK_OPENING, GUEST_LIMIT, type AskContext, type AskReply, type Understanding } from "@/lib/askAnswerd"
import { listingRating, isDeskLive } from "@/lib/selectors"
import { fmtMiles, milesBetween, lookupPostcode } from "@/lib/geo"
import { DeskAvatar, ListingAvatar } from "./Media"
import { Rating } from "./Rating"
import { TypingIndicator } from "./Chat"
import { cn } from "@/lib/utils"

type Turn = { id: number; role: "user" | "answerd"; text: string; reply?: AskReply }

export interface AskLinks {
  call: (slug: string) => string
  message: (slug: string, text: string, postcode?: string) => string
  book: (slug: string) => string
  listing: (slug: string) => string
}

let turnId = 0

/** The Ask Answerd conversation (C-38 in the app, W-25 on the web). Runs Q-01 to Q-06. */
export function AskChat({ links, onGuestLimit, initial, className, compact }: { links: AskLinks; onGuestLimit: () => void; initial?: string | null; className?: string; compact?: boolean }) {
  const s = useStore()
  const [turns, setTurns] = React.useState<Turn[]>([])
  const ctxRef = React.useRef<AskContext>(emptyContext())
  const [text, setText] = React.useState("")
  const [typing, setTyping] = React.useState(false)
  const [claude, setClaude] = React.useState(false)
  const endRef = React.useRef<HTMLDivElement>(null)
  const sentInitial = React.useRef(false)
  const guest = !s.session.userId

  React.useEffect(() => {
    let live = true
    fetch("/api/ask")
      .then((r) => (r.ok ? r.json() : { enabled: false }))
      .then((j: { enabled?: boolean }) => live && setClaude(!!j.enabled))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" })
  }, [turns, typing])

  const send = React.useCallback(
    async (raw: string) => {
      const body = raw.trim()
      if (!body || typing) return
      const st = useStore.getState()
      // Q-06: guests get 5 messages, then sign in
      if (!st.session.userId && st.session.askCount >= GUEST_LIMIT) {
        onGuestLimit()
        return
      }
      st.incrementAsk()
      setText("")
      setTurns((t) => [...t, { id: ++turnId, role: "user", text: body }])
      setTyping(true)
      let pre: Understanding | undefined
      if (claude) {
        try {
          const r = await fetch("/api/ask", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: body }) })
          if (r.ok) pre = ((await r.json()) as { understanding: Understanding }).understanding
        } catch {
          /* stay scripted */
        }
      }
      await new Promise((res) => setTimeout(res, 700))
      const { ctx: next, reply } = askTurn(useStore.getState(), ctxRef.current, body, pre)
      ctxRef.current = next
      setTurns((t) => [...t, { id: ++turnId, role: "answerd", text: reply.text, reply }])
      setTyping(false)
    },
    [claude, onGuestLimit, typing],
  )

  React.useEffect(() => {
    if (initial && !sentInitial.current) {
      sentInitial.current = true
      void send(initial)
    }
  }, [initial, send])

  const lastChips = [...turns].reverse().find((t) => t.role === "answerd")?.reply?.chips
  const chips = turns.length === 0 ? ASK_CHIPS : lastChips

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className="flex items-end gap-2">
          <DeskAvatar size={32} />
          <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-teal-tint px-3.5 py-2.5 t-body text-navy">{ASK_OPENING}</div>
        </div>
        <div className="mt-4 space-y-4">
          {turns.map((t) =>
            t.role === "user" ? (
              <div key={t.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-md bg-blue px-3.5 py-2.5 t-body text-white">{t.text}</div>
              </div>
            ) : (
              <AnswerdTurn key={t.id} turn={t} links={links} compact={compact} />
            ),
          )}
          {typing && <TypingIndicator label="Answerd is looking…" />}
        </div>
        {guest && s.session.askCount > 0 && <p className="mt-4 text-center t-caption text-muted-ink tnum">{Math.max(0, GUEST_LIMIT - s.session.askCount)} of {GUEST_LIMIT} guest messages left</p>}
        <div ref={endRef} className="h-1" />
      </div>
      <div className="border-t border-line bg-white px-3 pb-3 pt-2">
        {chips && chips.length > 0 && (
          <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
            {chips.map((c) => (
              <button key={c} type="button" onClick={() => void send(c)} className="inline-flex h-9 shrink-0 items-center rounded-full border border-line bg-white px-3.5 t-label text-navy hover:border-blue">
                {c}
              </button>
            ))}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void send(text)
          }}
        >
          <label className="flex h-11 flex-1 items-center rounded-full border border-line bg-sky px-4 focus-within:border-blue">
            <span className="sr-only">Describe what you need</span>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the job…" className="h-full w-full bg-transparent t-body text-navy outline-none placeholder:text-muted-ink" />
          </label>
          <button type="submit" disabled={!text.trim() || typing} aria-label="Send" className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover disabled:opacity-40">
            <SendHorizontal className="size-5" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[11px] leading-4 text-muted-ink">Powered by AskBridge · Answerd&apos;s assistant, not a business{claude ? " · Claude understanding on" : ""}</p>
      </div>
    </div>
  )
}

function AnswerdTurn({ turn, links, compact }: { turn: Turn; links: AskLinks; compact?: boolean }) {
  const s = useStore()
  const r = turn.reply
  if (r?.safety) {
    const gas = r.safety === "gas"
    return (
      <div role="alert" className="rounded-2xl border-2 border-red bg-red-tint p-4">
        <p className="flex items-center gap-2 t-subhead text-red">
          <AlertTriangle className="size-5" aria-hidden /> Safety first
        </p>
        <p className="mt-2 t-body text-navy">{turn.text}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {gas && (
            <a href="tel:0800111999" className="inline-flex h-11 items-center gap-2 rounded-full bg-red px-4 t-label font-semibold text-white">
              <Phone className="size-4" aria-hidden /> Call 0800 111 999
            </a>
          )}
          {r.safety === "power" && (
            <a href="tel:105" className="inline-flex h-11 items-center gap-2 rounded-full bg-red px-4 t-label font-semibold text-white">
              <Phone className="size-4" aria-hidden /> Call 105
            </a>
          )}
          <a href="tel:999" className={cn("inline-flex h-11 items-center gap-2 rounded-full px-4 t-label font-semibold", gas || r.safety === "power" ? "border border-red bg-white text-red" : "bg-red text-white")}>
            <Phone className="size-4" aria-hidden /> Call 999
          </a>
        </div>
      </div>
    )
  }
  const loc = s.session.location
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <DeskAvatar size={32} />
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-teal-tint px-3.5 py-2.5 t-body text-navy">{turn.text}</div>
      </div>
      {r?.matches && r.matches.length > 0 && (
        <div className={cn("space-y-2", !compact && "pl-10")}>
          {r.online && (
            <p className="flex items-center gap-1.5 t-caption text-teal-ink">
              <span className="size-2 rounded-full bg-teal animate-pulse-dot" aria-hidden /> Businesses are online
            </p>
          )}
          {r.matches.map((m) => {
            const l = s.listings.find((x) => x.id === m.listingId)
            if (!l) return null
            const rating = listingRating(s, l)
            const cat = s.categories.find((c) => c.id === l.categoryIds[0])
            const d = loc ? milesBetween(loc, l.geo) : null
            const postcode = r.summary ? lookupPostcode(r.summary.match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?(\s*\d[A-Z]{2})?\b/)?.[0] ?? "")?.postcode : undefined
            return (
              <div key={m.listingId} className="card p-3">
                <Link href={links.listing(l.slug)} className="flex items-start gap-3">
                  <ListingAvatar initials={l.initials} hue={l.hue} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate t-label font-semibold text-navy">{l.name}</p>
                    <p className="t-caption text-muted-ink">
                      {cat?.name}
                      {d !== null && <span className="tnum"> · {fmtMiles(d)}</span>}
                      {isDeskLive(s, l) && <span className="text-teal-ink"> · Responds instantly</span>}
                    </p>
                    <Rating value={rating.rating} count={rating.count} google={rating.google} compact className="mt-0.5" />
                    <p className="mt-1 t-caption text-slate">{m.reason}</p>
                  </div>
                </Link>
                <div className="mt-2 flex gap-2">
                  <Link href={links.call(l.slug)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line t-label text-navy hover:bg-sky" aria-label={`Call ${l.name}`}>
                    <Phone className="size-4" aria-hidden /> Call
                  </Link>
                  {m.claimed && (
                    <Link href={links.message(l.slug, r.summary ?? "", postcode)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-line t-label text-navy hover:bg-sky" aria-label={`Message ${l.name}`}>
                      <MessageCircle className="size-4" aria-hidden /> Message
                    </Link>
                  )}
                  {m.bookable && (
                    <Link href={links.book(l.slug)} className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-blue t-label font-semibold text-white hover:bg-blue-hover" aria-label={`Book ${l.name}`}>
                      <CalendarPlus className="size-4" aria-hidden /> Book
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
