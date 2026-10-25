"use client"
import * as React from "react"
import Link from "next/link"
import { AlertTriangle, CalendarCheck, ChevronRight, FileText, Mic, MicOff, PhoneOff, PhoneCall, ShieldAlert, UserRound, Volume2, VolumeX, Ban, MessageSquare, Send } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { SegmentedControl } from "@/components/answerd/Status"
import { CheckRow } from "@/components/answerd/Fields"
import { DeskAvatar, PersonAvatar } from "@/components/answerd/Media"
import { useStore } from "@/lib/store"
import { DESK_EMERGENCIES, DESK_SCRIPTS, type EmergencyKind, type ScriptId } from "@/lib/deskScripts"
import { fmtDateTime, fmtDuration } from "@/lib/time"
import type { Listing } from "@/lib/types"
import { cn } from "@/lib/utils"
import { APP_DESK_LINKS, TranscriptView, type DeskLinks } from "./common"

interface Effect {
  key: string
  icon: typeof CalendarCheck
  label: string
  sub?: string
  href?: string
  tone?: "teal" | "red" | "amber" | "blue"
}

/**
 * B-33 test call: a phone-call screen simulating a customer calling the desk. The transcript streams line by
 * line and side effects (thread, booking, alerts, call log) land in the inbox and diary as they happen.
 * Self-contained so the web dashboard (W-17) can reuse it in a tab or side panel.
 */
export function CallScreen({ listing, onEnd, defaultScript = "D-01", links = APP_DESK_LINKS, stepMs = 1500, compact }: { listing: Listing; onEnd?: () => void; defaultScript?: ScriptId; links?: DeskLinks; stepMs?: number; compact?: boolean }) {
  const runDeskScript = useStore((s) => s.runDeskScript)
  const finishRuns = useStore((s) => s.finishRuns)
  const [scriptId, setScriptId] = React.useState<ScriptId>(defaultScript)
  const [emergency, setEmergency] = React.useState<EmergencyKind>("gas")
  const [outside, setOutside] = React.useState(false)
  const [runId, setRunId] = React.useState<string | null>(null)
  const [startedMs, setStartedMs] = React.useState(0)
  const [nowMs, setNowMs] = React.useState(0)
  const [muted, setMuted] = React.useState(false)
  const [speaker, setSpeaker] = React.useState(true)
  const run = useStore((s) => s.runs.find((r) => r.id === runId))
  const booking = useStore((s) => s.bookings.find((b) => b.id === run?.bookingId))
  const running = !!run && !run.done

  React.useEffect(() => {
    if (!running) return
    const t = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [running])

  const start = () => {
    const id = runDeskScript(scriptId, listing.id, { stepMs, emergency: scriptId === "D-09" ? emergency : undefined, outsideArea: scriptId === "D-01" && outside })
    const t = Date.now()
    setStartedMs(t)
    setNowMs(t)
    setRunId(id)
  }
  const end = () => {
    if (running) finishRuns()
    onEnd?.()
  }

  const meta = DESK_SCRIPTS.find((d) => d.id === (run?.scriptId ?? scriptId))!
  const isCall = (run?.plan.channel ?? meta.channel) === "call"
  const callerName = run?.plan.caller.name ?? "Caller"
  const shown = run ? run.steps.slice(0, run.done ? run.steps.length : run.cursor) : []
  const next = run && !run.done ? run.steps[run.cursor] : undefined
  const elapsed = run ? Math.max(0, Math.round(((run.done ? Math.max(nowMs, startedMs) : nowMs) - startedMs) / 1000)) : 0

  // What the desk did, as it happens
  const effects: Effect[] = []
  if (run) {
    if (run.threadId && run.plan.channel !== "call") effects.push({ key: "thread", icon: MessageSquare, label: run.plan.channel === "sms" ? "Text thread in your inbox" : "Conversation in your inbox", href: links.thread(run.threadId), tone: "blue" })
    shown.forEach((st, i) => {
      if (st.card?.kind === "slot" && st.card.slots.length) effects.push({ key: `slot-${i}`, icon: Send, label: "Offered free times", sub: st.card.slots.map((x) => fmtDateTime(x)).join(" · "), tone: "blue" })
      if (st.effect === "alert_owner") effects.push({ key: `alert-${i}`, icon: ShieldAlert, label: "Safety advice given, owner alerted", sub: "Push and SMS sent now. Nothing booked.", tone: "red" })
      if (st.effect === "handoff") effects.push({ key: `handoff-${i}`, icon: UserRound, label: "Handed to you", sub: run.plan.handoff ?? "Needs a call back", href: run.threadId ? links.thread(run.threadId) : links.inbox, tone: "amber" })
      if (st.effect === "book" && run.bookingId) {
        const requested = booking?.status === "requested"
        effects.push({ key: `book-${i}`, icon: CalendarCheck, label: requested ? "Booking request sent to you" : "Booking made in your diary", sub: booking ? fmtDateTime(booking.startAt) : undefined, href: requested ? links.request(run.bookingId) : links.job(run.bookingId), tone: "teal" })
      }
    })
    if (run.plan.outsideArea && run.done) effects.push({ key: "area", icon: AlertTriangle, label: "Outside your service area", sub: "Nothing booked. Caller sent businesses that cover them.", tone: "amber" })
    if (run.done && run.plan.spam) effects.push({ key: "spam", icon: Ban, label: "Logged as spam", sub: "Hidden from Needs you", href: run.callId ? links.call(run.callId) : undefined, tone: "red" })
    else if (run.done && run.callId && run.plan.channel === "call") effects.push({ key: "log", icon: FileText, label: "Call logged with summary and transcript", href: links.call(run.callId), tone: "blue" })
    if (run.done && run.plan.channel === "digest") effects.push({ key: "digest", icon: Send, label: "Sent to you by SMS", tone: "blue" })
  }

  if (!run) {
    return (
      <div className={cn("space-y-4", compact ? "" : "px-4 py-4")}>
        <div className="card p-4">
          <p className="t-subhead">Pick a test</p>
          <p className="mt-0.5 t-label font-normal text-slate">You play the customer. The desk answers as {listing.name}, using your services, prices, hours and area.</p>
          <fieldset className="mt-3">
            <legend className="sr-only">Test conversation</legend>
            <div className="divide-y divide-line">
              {DESK_SCRIPTS.map((d) => (
                <label key={d.id} className={cn("flex min-h-12 cursor-pointer items-start gap-3 py-2.5", scriptId === d.id && "text-navy")}>
                  <input type="radio" name="script" value={d.id} checked={scriptId === d.id} onChange={() => setScriptId(d.id)} className="mt-1 size-5 shrink-0 accent-blue" />
                  <span className="min-w-0">
                    <span className="block t-label text-navy">
                      <span className="font-mono text-blue">{d.id}</span> {d.title}
                    </span>
                    <span className="block t-caption text-muted-ink">{d.trigger}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {scriptId === "D-09" && (
            <div className="mt-3">
              <SegmentedControl<EmergencyKind> label="Emergency" value={emergency} onChange={setEmergency} options={DESK_EMERGENCIES.map((e) => ({ value: e.id, label: e.label }))} />
            </div>
          )}
          {scriptId === "D-01" && (
            <div className="mt-2">
              <CheckRow label="Caller is outside your service area" checked={outside} onChange={setOutside} />
            </div>
          )}
        </div>
        <Button block onClick={start}>
          <PhoneCall /> {meta.channel === "call" ? "Start test call" : "Start test conversation"}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", compact ? "" : "px-4 py-4")}>
      <div className="overflow-hidden rounded-2xl bg-navy text-white">
        <div className="flex flex-col items-center px-4 pb-4 pt-5 text-center">
          <div className="relative">
            <PersonAvatar name={callerName} size={64} tone="blue" />
            <span className="absolute -bottom-1 -right-1 rounded-full border-2 border-navy">
              <DeskAvatar size={26} />
            </span>
          </div>
          <p className="mt-3 t-subhead text-white">{callerName}</p>
          <p className="t-caption text-white/80 tnum" aria-live="polite">
            {run.done ? `${isCall ? "Call ended" : "Conversation finished"} · ${fmtDuration(elapsed)}` : `${isCall ? "Answered by your Answerd desk" : meta.channel === "sms" ? "Texting your Answerd number" : meta.title} · ${fmtDuration(elapsed)}`}
          </p>
          <p className="mt-0.5 t-caption text-white/60">
            {run.scriptId} · {meta.title}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-white/10 px-4 py-3">
          <button type="button" aria-pressed={muted} onClick={() => setMuted((m) => !m)} disabled={run.done || !isCall} className="flex min-h-11 flex-col items-center gap-1 rounded-xl py-1.5 hover:bg-white/10 disabled:opacity-40">
            <span className={cn("inline-flex size-11 items-center justify-center rounded-full", muted ? "bg-white text-navy" : "bg-white/15")}>{muted ? <MicOff className="size-5" aria-hidden /> : <Mic className="size-5" aria-hidden />}</span>
            <span className="t-caption">{muted ? "Unmute" : "Mute"}</span>
          </button>
          <button type="button" aria-pressed={speaker} onClick={() => setSpeaker((m) => !m)} disabled={run.done || !isCall} className="flex min-h-11 flex-col items-center gap-1 rounded-xl py-1.5 hover:bg-white/10 disabled:opacity-40">
            <span className={cn("inline-flex size-11 items-center justify-center rounded-full", speaker ? "bg-white text-navy" : "bg-white/15")}>{speaker ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}</span>
            <span className="t-caption">Speaker</span>
          </button>
          <button type="button" onClick={end} aria-label={run.done ? "Close test call" : "End call"} className="flex min-h-11 flex-col items-center gap-1 rounded-xl py-1.5 hover:bg-white/10">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-red text-white">
              <PhoneOff className="size-5" aria-hidden />
            </span>
            <span className="t-caption">{run.done ? "Done" : "End"}</span>
          </button>
        </div>
      </div>

      <div className="card p-3">
        <p className="mb-2 t-caption text-muted-ink">Live transcript</p>
        <div data-transcript-scroll className="max-h-[340px] overflow-y-auto pr-1">
          <TranscriptView lines={shown} callerName={callerName} typing={next ? (next.speaker === "desk" ? "desk" : "caller") : null} />
        </div>
      </div>

      <div className="card p-3">
        <p className="mb-1 t-caption text-muted-ink">What the desk did</p>
        {effects.length ? (
          <ul className="divide-y divide-line">
            {effects.map((e) => {
              const inner = (
                <>
                  <span className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full", e.tone === "teal" && "bg-teal-tint text-teal-ink", e.tone === "red" && "bg-red-tint text-red", e.tone === "amber" && "bg-amber-tint text-amber-ink", e.tone === "blue" && "bg-blue-tint text-blue")}>
                    <e.icon className="size-[18px]" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block t-label text-navy">{e.label}</span>
                    {e.sub && <span className="block t-caption text-muted-ink tnum">{e.sub}</span>}
                  </span>
                  {e.href && <ChevronRight className="size-5 shrink-0 text-muted-ink" aria-hidden />}
                </>
              )
              return (
                <li key={e.key} className="animate-fade-in">
                  {e.href ? (
                    <Link href={e.href} className="flex min-h-12 items-center gap-3 py-2 hover:bg-sky">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex min-h-12 items-center gap-3 py-2">{inner}</div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-2 t-label font-normal text-muted-ink">Listening…</p>
        )}
      </div>

      {run.done && (
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setRunId(null)}>
            Run another test
          </Button>
          {onEnd && (
            <Button className="flex-1" onClick={onEnd}>
              Done
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
