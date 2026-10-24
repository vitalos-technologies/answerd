"use client"
import * as React from "react"
import { DeskAvatar, PersonAvatar } from "@/components/answerd/Media"
import { cn } from "@/lib/utils"

/** Every desk screen carries this caption. */
export function PoweredByAskBridge({ className, tone = "default" }: { className?: string; tone?: "default" | "navy" }) {
  return <p className={cn("text-center t-caption", tone === "navy" ? "text-white/70" : "text-muted-ink", className)}>Powered by AskBridge</p>
}

/** Where desk components link to. App routes by default; the web dashboard (W-17) passes its own. */
export interface DeskLinks {
  call: (callId: string) => string
  thread: (threadId: string) => string
  job: (bookingId: string) => string
  request: (bookingId: string) => string
  diary: string
  inbox: string
  billing: string
  setup: string
  testCall: string
  intro: string
  knowledge: string
  handoff: string
  profile: { details: string; services: string; hours: string; area: string; booking: string; credentials: string }
}

export const APP_DESK_LINKS: DeskLinks = {
  call: (id) => `/app/biz/calls/${id}`,
  thread: (id) => `/app/biz/inbox/${id}`,
  job: (id) => `/app/biz/jobs/${id}`,
  request: (id) => `/app/biz/requests/${id}`,
  diary: "/app/biz/diary",
  inbox: "/app/biz/inbox",
  billing: "/app/biz/billing",
  setup: "/app/biz/desk/setup",
  testCall: "/app/biz/desk/test-call",
  intro: "/app/biz/desk/intro",
  knowledge: "/app/biz/desk/knowledge",
  handoff: "/app/biz/desk/handoff",
  profile: {
    details: "/app/biz/profile/details",
    services: "/app/biz/profile/services",
    hours: "/app/biz/profile/hours",
    area: "/app/biz/profile/area",
    booking: "/app/biz/profile/booking",
    credentials: "/app/biz/profile/credentials",
  },
}

export interface TranscriptItem {
  speaker: "caller" | "desk" | "owner"
  text: string
}

/** Call transcript: desk lines in teal-tint with the mark, caller lines in white. */
export function TranscriptView({ lines, callerName, typing, className, emptyText }: { lines: TranscriptItem[]; callerName: string; typing?: "desk" | "caller" | null; className?: string; emptyText?: string }) {
  const endRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!lines.length && !typing) return
    // Scroll the transcript box only, so the call controls stay in view
    const box = endRef.current?.closest<HTMLElement>("[data-transcript-scroll]")
    if (box) box.scrollTo({ top: box.scrollHeight, behavior: "smooth" })
    else endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [lines.length, typing])
  return (
    <div className={cn("space-y-2.5", className)} aria-live="polite" aria-label="Transcript">
      {!lines.length && !typing && emptyText && <p className="py-6 text-center t-label font-normal text-muted-ink">{emptyText}</p>}
      {lines.map((l, i) => {
        const desk = l.speaker === "desk"
        const prev = lines[i - 1]
        const showLabel = !prev || prev.speaker !== l.speaker
        return (
          <div key={i} className="flex animate-fade-in items-start gap-2">
            {showLabel ? desk ? <DeskAvatar size={28} /> : <PersonAvatar name={l.speaker === "owner" ? "Owner" : callerName} size={28} tone="blue" /> : <span className="w-7 shrink-0" aria-hidden />}
            <div className="min-w-0 flex-1">
              {showLabel && <p className={cn("t-caption", desk ? "text-teal-ink" : "text-muted-ink")}>{desk ? "Answerd desk" : l.speaker === "owner" ? "Owner" : callerName}</p>}
              <p className={cn("mt-0.5 inline-block rounded-2xl rounded-tl-md px-3 py-2 t-body", desk ? "bg-teal-tint text-navy" : "border border-line bg-white text-navy")}>{l.text}</p>
            </div>
          </div>
        )
      })}
      {typing && (
        <div className="flex items-center gap-2" role="status">
          {typing === "desk" ? <DeskAvatar size={28} /> : <PersonAvatar name={callerName} size={28} tone="blue" />}
          <span className={cn("inline-flex items-center gap-1 rounded-2xl px-3 py-2.5", typing === "desk" ? "bg-teal-tint" : "border border-line bg-white")}>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("size-1.5 animate-bounce rounded-full", typing === "desk" ? "bg-teal-ink" : "bg-muted-ink")} style={{ animationDelay: `${i * 120}ms` }} />
            ))}
            <span className="sr-only">{typing === "desk" ? "Answerd desk is speaking" : `${callerName} is speaking`}</span>
          </span>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

/** Progress bar with a label, e.g. setup steps and the monetise gate. */
export function ProgressBar({ value, max, label, className }: { value: number; max: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  return (
    <div className={className}>
      <div className="h-2 overflow-hidden rounded-full bg-[#E7ECF3]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
        <div className="h-full rounded-full bg-blue transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
