"use client"
import * as React from "react"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import Link from "next/link"
import { ChevronRight, Phone, SendHorizontal, X } from "lucide-react"
import { Mark } from "@/components/brand/Mark"
import { GetAppButton } from "./get-app"
import type { AskbridgeCopy, Suggestions } from "./askbridge-placeholder"
import { apiEnabled } from "@/lib/api/client"
import { chatSearch, type LiveResult } from "@/lib/api/actions"

/*
 * The Askbridge placeholder's chat panel. Loaded on the first tap of the pill (see askbridge-placeholder.tsx),
 * which keeps Motion and the panel out of the first-load bundle. It stays mounted after that, so the
 * conversation survives closing and reopening.
 */

const PANEL_ID = "askbridge-panel"
const TITLE_ID = "askbridge-title"
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"

type Msg = { from: "user" | "assistant"; text: string; cta?: boolean; chip?: string; results?: LiveResult[] }

const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)(\s*\d[A-Z]{2})?\b/i

const TONES: Record<string, string> = { blue: "bg-blue-tint text-blue-hover", teal: "bg-teal-tint text-teal-ink", amber: "bg-amber-tint text-amber-ink", sky: "bg-sky text-navy" }

export default function AskbridgePanel({ copy, suggestions, open, close }: { copy: AskbridgeCopy; suggestions: Suggestions; open: boolean; close: (returnFocus?: boolean) => void }) {
  const [messages, setMessages] = React.useState<Msg[]>([])
  const panelRef = React.useRef<HTMLDivElement>(null)
  const logRef = React.useRef<HTMLDivElement>(null)
  const timer = React.useRef<number | undefined>(undefined)
  const [text, setText] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  // API mode: a query waiting for a postcode, and the postcode once given (used for later questions too)
  const pending = React.useRef<string | null>(null)
  const postcode = React.useRef<string | null>(null)

  // Escape closes the chat, unless it was pressed inside another dialog (e.g. Get the app), which handles its own.
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      const t = e.target instanceof Element ? e.target.closest('[role="dialog"], [role="alertdialog"]') : null
      if (t && t.id !== PANEL_ID) return
      close()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, close])

  // Move focus into the panel when it opens (it's non-modal, so Tab can still leave it).
  React.useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true })
  }, [open])

  React.useEffect(() => () => window.clearTimeout(timer.current), [])

  React.useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [messages])

  async function ask(input: string) {
    const say = (m: Msg) => setMessages((all) => [...all, m])
    say({ from: "user", text: input })
    panelRef.current?.focus({ preventScroll: true })
    const typed = input.match(POSTCODE)?.[0]
    let query = input
    if (pending.current) {
      if (!typed) return say({ from: "assistant", text: copy.live.askPostcode })
      postcode.current = typed.toUpperCase()
      query = pending.current
      pending.current = null
    } else if (typed) {
      postcode.current = typed.toUpperCase()
    } else if (!postcode.current) {
      pending.current = input
      return say({ from: "assistant", text: copy.live.askPostcode })
    }
    setBusy(true)
    const r = await chatSearch(/\bnear\b/i.test(query) ? query : `${query} near ${postcode.current}`)
    setBusy(false)
    if (!r.ok) return say({ from: "assistant", text: copy.live.error })
    say(r.data.length ? { from: "assistant", text: copy.matches, results: r.data, cta: true } : { from: "assistant", text: copy.live.none, cta: true })
  }

  function pick(chip: string) {
    if (apiEnabled) return void ask(chip)
    setMessages((m) => [...m, { from: "user", text: chip }])
    // The chips go away once one is picked, so keep focus in the panel rather than losing it to <body>.
    panelRef.current?.focus({ preventScroll: true })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      const found = suggestions[chip]?.length
      setMessages((m) => [...m, found ? { from: "assistant", text: copy.matches, cta: true, chip } : { from: "assistant", text: copy.reply, cta: true }])
    }, 450)
  }

  const picked = messages.length > 0

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            key="panel"
            id={PANEL_ID}
            role="dialog"
            aria-modal="false"
            aria-labelledby={TITLE_ID}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="absolute right-0 bottom-[calc(100%+12px)] flex max-h-[min(600px,calc(100dvh-104px-var(--offset)))] w-[calc(100vw-32px)] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-overlay outline-none md:w-[380px]"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-blue-tint">
                <Mark size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={TITLE_ID} className="text-base leading-6 font-semibold text-navy">
                  {copy.title}
                </h2>
                <p className="flex items-center gap-1.5 text-[13px] leading-5 text-muted-ink">
                  <span className="size-2 rounded-full bg-teal" aria-hidden />
                  {apiEnabled ? "Online" : "Preview"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => close()}
                aria-label={copy.close}
                className={`-mr-1 inline-flex size-11 items-center justify-center rounded-full text-navy hover:bg-sky ${focusRing}`}
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>

            <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-sky/50 px-4 py-4">
              <AssistantBubble>{copy.opening}</AssistantBubble>
              {!picked && (
                <ul className="flex flex-wrap gap-2 pl-9" aria-label="Suggestions">
                  {copy.chips.map((chip) => (
                    <li key={chip}>
                      <button
                        type="button"
                        onClick={() => pick(chip)}
                        className={`h-10 rounded-full border border-line bg-white px-4 text-[14px] font-medium text-navy transition-colors duration-150 hover:border-blue hover:text-blue ${focusRing}`}
                      >
                        {chip}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {messages.map((m, i) =>
                m.from === "user" ? (
                  <p key={i} className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-blue px-4 py-2.5 text-[15px] leading-6 text-white">
                    <span className="sr-only">You: </span>
                    {m.text}
                  </p>
                ) : (
                  <AssistantBubble key={i}>
                    {m.text}
                    {m.chip && (
                      <ul className="mt-3 flex flex-col gap-2" aria-label={m.chip}>
                        {suggestions[m.chip]!.map((s) => (
                          <li key={s.slug}>
                            <Link href={`/b/${s.slug}`} onClick={() => close(false)} className={`flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left hover:border-blue/40 ${focusRing}`}>
                              <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-lg text-[14px] font-bold ${TONES[s.tone]}`}>
                                {s.initials}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[15px] leading-5 font-semibold text-navy">{s.name}</span>
                                <span className="block truncate text-[13px] leading-5 text-muted-ink">{s.meta}</span>
                                <span className="block text-[13px] leading-5 text-teal-ink">{s.why}</span>
                              </span>
                              <ChevronRight className="size-4 shrink-0 text-muted-ink" aria-hidden />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.results && (
                      <ul className="mt-3 flex flex-col gap-2" aria-label={copy.matches}>
                        {m.results.map((s) => (
                          <li key={s.key}>
                            {s.google || !s.slug ? (
                              <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left">
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[15px] leading-5 font-semibold text-navy">{s.name}</span>
                                  <span className="block truncate text-[13px] leading-5 text-muted-ink">
                                    {s.categoryName}
                                    {s.rating != null && ` · ${s.rating.toFixed(1)}★`}
                                  </span>
                                  {s.google && <span className="block text-[12px] leading-4 font-medium text-slate">{copy.live.google}</span>}
                                </span>
                                {s.phone && (
                                  <a href={`tel:${s.phone}`} aria-label={`${copy.live.call} ${s.name}`} className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-navy hover:border-blue ${focusRing}`}>
                                    <Phone className="size-4" aria-hidden />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <Link href={`/b/${s.slug}`} onClick={() => close(false)} className={`flex items-center gap-3 rounded-xl border border-line bg-white p-3 text-left hover:border-blue/40 ${focusRing}`}>
                                <span aria-hidden className={`grid size-10 shrink-0 place-items-center rounded-lg text-[14px] font-bold ${TONES.blue}`}>
                                  {s.initials}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-[15px] leading-5 font-semibold text-navy">{s.name}</span>
                                  <span className="block truncate text-[13px] leading-5 text-muted-ink">
                                    {s.categoryName}
                                    {s.distanceMiles != null && ` · ${s.distanceMiles.toFixed(1)} mi`}
                                    {s.rating != null && s.reviewCount > 0 && ` · ${s.rating.toFixed(1)}★`}
                                  </span>
                                  <span className="block text-[13px] leading-5 text-teal-ink">{s.reason}</span>
                                </span>
                                <ChevronRight className="size-4 shrink-0 text-muted-ink" aria-hidden />
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.cta && (
                      <span className="mt-3 block">
                        <GetAppButton size="sm" icon />
                      </span>
                    )}
                  </AssistantBubble>
                ),
              )}
            </div>

            <div className="border-t border-line px-4 pt-3 pb-2">
              {apiEnabled ? (
                <form
                  className="flex items-center gap-2 rounded-full border border-line bg-white px-4 focus-within:border-blue"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const t = text.trim()
                    if (!t || busy) return
                    setText("")
                    void ask(t)
                  }}
                >
                  <label htmlFor="askbridge-input" className="sr-only">
                    Message
                  </label>
                  <input
                    id="askbridge-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={200}
                    placeholder={busy ? copy.live.searching : copy.live.placeholder}
                    className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-navy outline-none placeholder:text-muted-ink"
                  />
                  <button type="submit" disabled={busy} aria-label={copy.live.send} className={`-mr-2 inline-flex size-9 items-center justify-center rounded-full text-blue hover:bg-blue-tint disabled:text-muted-ink ${focusRing}`}>
                    <SendHorizontal className="size-[18px]" aria-hidden />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-line bg-sky px-4" aria-disabled="true">
                  <label htmlFor="askbridge-input" className="sr-only">
                    Message
                  </label>
                  <input
                    id="askbridge-input"
                    disabled
                    placeholder={copy.comingSoon}
                    className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-navy placeholder:text-muted-ink disabled:cursor-not-allowed"
                  />
                  <button type="button" disabled aria-label={`Send (${copy.comingSoon.toLowerCase()})`} className="-mr-2 inline-flex size-9 items-center justify-center rounded-full text-muted-ink disabled:cursor-not-allowed">
                    <SendHorizontal className="size-[18px]" aria-hidden />
                  </button>
                </div>
              )}
              <p className="mt-2 text-center text-xs leading-5 text-muted-ink">{copy.footer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  )
}

function AssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-line" aria-hidden>
        <Mark size={18} />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-teal-tint px-4 py-2.5 text-[15px] leading-6 text-navy">
        <span className="sr-only">Answerd: </span>
        {children}
      </div>
    </div>
  )
}
