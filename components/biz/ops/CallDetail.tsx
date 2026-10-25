"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarCheck, ChevronRight, MessageCircle, MicOff, Pause, Phone, PhoneIncoming, PhoneMissed, Play, ShieldAlert } from "lucide-react"
import { DeskIcon } from "@/components/brand/DeskIcon"
import { useStore } from "@/lib/store"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Button } from "@/components/answerd/Button"
import { StatusPill } from "@/components/answerd/Status"
import { serviceById } from "@/lib/selectors"
import { fmtDateTime, fmtDuration } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Call, TranscriptLine } from "@/lib/types"
import { useOpsLinks } from "./links"

const SPEAKER: Record<TranscriptLine["speaker"], string> = { desk: "Answerd desk", caller: "Caller", owner: "You" }

/**
 * Mock recording player: play, pause, scrub and 1x / 1.5x. There is no real audio;
 * a timer moves the playhead and the transcript highlights the line being spoken.
 */
export function RecordingPlayer({ durationSec, transcript, className }: { durationSec: number; transcript: TranscriptLine[]; className?: string }) {
  const [playing, setPlaying] = React.useState(false)
  const [t, setT] = React.useState(0)
  const [speed, setSpeed] = React.useState<1 | 1.5>(1)
  const activeRef = React.useRef<HTMLLIElement>(null)
  React.useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setT((prev) => {
        const next = prev + 0.25 * speed
        if (next >= durationSec) {
          setPlaying(false)
          return durationSec
        }
        return next
      })
    }, 250)
    return () => clearInterval(id)
  }, [playing, speed, durationSec])
  let active = -1
  transcript.forEach((l, i) => {
    if (l.atSec <= t) active = i
  })
  React.useEffect(() => {
    if (playing) activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }, [active, playing])
  const toggle = () => {
    if (!playing && t >= durationSec) setT(0)
    setPlaying((p) => !p)
  }
  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} aria-label={playing ? "Pause recording" : "Play recording"} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-blue text-white hover:bg-blue-hover">
          {playing ? <Pause className="size-5" /> : <Play className="size-5 translate-x-px" />}
        </button>
        <div className="min-w-0 flex-1">
          <input
            type="range"
            min={0}
            max={durationSec}
            step={1}
            value={Math.floor(t)}
            onChange={(e) => setT(Number(e.target.value))}
            aria-label="Seek"
            aria-valuetext={`${fmtDuration(Math.floor(t))} of ${fmtDuration(durationSec)}`}
            className="h-11 w-full cursor-pointer accent-blue"
          />
          <div className="-mt-2 flex justify-between t-caption text-muted-ink tnum">
            <span>{fmtDuration(Math.floor(t))}</span>
            <span>{fmtDuration(durationSec)}</span>
          </div>
        </div>
        <div role="radiogroup" aria-label="Playback speed" className="flex shrink-0 rounded-full bg-sky p-0.5">
          {([1, 1.5] as const).map((v) => (
            <button key={v} type="button" role="radio" aria-checked={speed === v} onClick={() => setSpeed(v)} className={cn("h-11 min-w-11 rounded-full px-2 t-caption tnum", speed === v ? "bg-white text-navy shadow-card" : "text-slate hover:text-navy")}>
              {v}x
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 t-caption text-muted-ink">Recording: prototype only, no audio plays.</p>
      <ol className="mt-3 max-h-80 space-y-1 overflow-y-auto rounded-xl border border-line p-1" aria-label="Transcript">
        {transcript.map((l, i) => (
          <li key={i} ref={i === active ? activeRef : undefined} aria-current={i === active ? "true" : undefined}>
            <button
              type="button"
              onClick={() => setT(l.atSec)}
              className={cn("flex w-full gap-3 rounded-lg px-2.5 py-2 text-left transition-colors", i === active ? "bg-blue-tint" : "hover:bg-sky")}
            >
              <span className="w-10 shrink-0 pt-0.5 t-caption text-muted-ink tnum">{fmtDuration(l.atSec)}</span>
              <span className="min-w-0">
                <span className={cn("block t-caption", l.speaker === "desk" ? "text-teal-ink" : "text-muted-ink")}>{SPEAKER[l.speaker]}</span>
                <span className={cn("block t-label font-normal", i === active ? "text-navy" : "text-slate")}>{l.text}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function OutcomePill({ outcome }: { outcome: Call["outcome"] }) {
  const m = {
    desk: { label: "Answered by desk", icon: DeskIcon, cls: "bg-teal-tint text-teal-ink" },
    owner: { label: "Answered by you", icon: PhoneIncoming, cls: "bg-blue-tint text-blue" },
    missed: { label: "Missed", icon: PhoneMissed, cls: "bg-red-tint text-red" },
  }[outcome]
  const I = m.icon
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 t-caption", m.cls)}>
      <I className="size-3.5" aria-hidden /> {m.label}
    </span>
  )
}

/** B-21: caller, outcome, desk summary, recording with transcript, Booked link, Call back and Message. */
export function CallDetail({ callId, className }: { callId: string; className?: string }) {
  const s = useStore()
  const router = useRouter()
  const links = useOpsLinks()
  const call = s.calls.find((c) => c.id === callId)
  const listing = s.listings.find((l) => l.id === call?.listingId)
  const bizId = s.session.supportViewBusinessId ?? s.session.currentBusinessId
  if (!call || !listing || listing.businessId !== bizId) return <EmptyState title="Call not found" body="It may belong to another business." />
  const booking = call.bookingId ? s.bookings.find((b) => b.id === call.bookingId) : undefined
  const name = call.customerName ?? "Caller"
  const first = name.split(" ")[0]
  const message = () => {
    if (call.threadId && s.threads.some((t) => t.id === call.threadId && t.channel !== "call")) return router.push(links.thread(call.threadId))
    const id = s.ensureThread(listing.id, { customerId: call.customerId ?? null, name, phone: s.users.find((u) => u.id === call.customerId)?.phone })
    router.push(links.thread(id))
  }
  return (
    <div className={cn("space-y-3", className)}>
      <section className="card p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-sky text-navy">
            <Phone className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="t-subhead">{name}</h2>
            <p className="t-caption text-muted-ink tnum">{call.callerMasked}</p>
          </div>
          <OutcomePill outcome={call.outcome} />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
          <div>
            <dt className="t-caption text-muted-ink">When</dt>
            <dd className="t-label text-navy tnum">{fmtDateTime(call.startedAt)}</dd>
          </div>
          <div>
            <dt className="t-caption text-muted-ink">Duration</dt>
            <dd className="t-label text-navy tnum">{call.durationSec ? fmtDuration(call.durationSec) : "Not answered"}</dd>
          </div>
        </dl>
      </section>

      {call.spam && (
        <Banner tone="warning" icon={<ShieldAlert className="size-5" aria-hidden />} title="Logged as spam">
          The desk ended this call politely. It&apos;s hidden from Needs you.
        </Banner>
      )}

      {call.summary && (
        <section className="rounded-2xl bg-teal-tint p-4" aria-labelledby="summary">
          <h3 id="summary" className="flex items-center gap-1.5 t-caption text-teal-ink">
            <DeskIcon className="size-4" aria-hidden /> {call.outcome === "desk" ? "Answerd desk summary" : "Summary"}
          </h3>
          <p className="mt-1 t-body text-navy">{call.summary}</p>
        </section>
      )}

      {booking ? (
        <Link href={links.job(booking.id)} className="card flex min-h-16 items-center gap-3 p-4 hover:border-blue">
          <CalendarCheck className="size-6 shrink-0 text-teal-ink" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block t-label text-navy">Booked: {serviceById(s, booking.serviceId)?.name ?? "Job"}</span>
            <span className="block t-caption text-muted-ink tnum">{fmtDateTime(booking.startAt)}</span>
          </span>
          <StatusPill status={booking.status} />
          <ChevronRight className="size-4 text-muted-ink" aria-hidden />
        </Link>
      ) : (
        !call.spam && (
          <p className="card flex items-center gap-3 p-4 t-label font-normal text-slate">
            <CalendarCheck className="size-5 shrink-0 text-muted-ink" aria-hidden /> No booking from this call yet.
          </p>
        )
      )}

      <section className="card p-4" aria-labelledby="rec">
        <h3 id="rec" className="t-subhead">
          Recording and transcript
        </h3>
        {call.recordingUrl && call.transcript?.length ? (
          <RecordingPlayer durationSec={Math.max(call.durationSec, (call.transcript.at(-1)?.atSec ?? 0) + 5)} transcript={call.transcript} className="mt-3" />
        ) : (
          <p className="mt-2 flex items-start gap-2 t-label font-normal text-slate">
            <MicOff className="mt-0.5 size-5 shrink-0 text-muted-ink" aria-hidden /> No recording. Calls are recorded only when the Answerd desk answers.
          </p>
        )}
      </section>

      {!call.spam && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => toast(`Calling ${first} back (prototype dialer)`)}>
            <Phone /> Call back
          </Button>
          <Button variant="secondary" onClick={message}>
            <MessageCircle /> Message
          </Button>
        </div>
      )}
    </div>
  )
}
