"use client"
import * as React from "react"
import Link from "next/link"
import { Check, CheckCircle2, Copy, Loader2, Pause, Play, Rocket } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextArea, ToggleRow } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { ensureGreeting } from "@/lib/deskScripts"
import { availabilityFor, businessById, deskFor, listingById, servicesFor } from "@/lib/selectors"
import { maskPhone } from "@/lib/format"
import { fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { DeskConfig } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CallScreen } from "./CallScreen"
import { HandoffRulesEditor } from "./HandoffRulesEditor"
import { APP_DESK_LINKS, PoweredByAskBridge, ProgressBar, type DeskLinks } from "./common"

export const SETUP_STEPS = ["Your number", "Greeting and voice", "What the desk may do", "Handoff rules", "Test call", "Go live"] as const

const VOICES: { id: DeskConfig["voice"]; sub: string }[] = [
  { id: "Ellie", sub: "Warm, friendly, London accent" },
  { id: "James", sub: "Calm and clear, neutral accent" },
  { id: "Amara", sub: "Bright and upbeat, neutral accent" },
]

const PERMISSIONS: { key: keyof DeskConfig["permissions"]; label: string; sub: string }[] = [
  { key: "calls", label: "Answer calls", sub: "Calls you miss after 15 seconds, or outside your hours" },
  { key: "sms", label: "Reply to texts", sub: "Texts to your Answerd number, within 30 seconds" },
  { key: "book", label: "Book jobs", sub: "Into free time in your diary, using your booking settings" },
  { key: "quotes", label: "Follow up quotes", sub: "A friendly nudge at 2 days and 7 days" },
  { key: "reviews", label: "Ask for reviews", sub: "One request after a job is marked Completed, never twice" },
]

function forwardCodes(number: string) {
  const n = number.replace(/\s/g, "")
  return [
    { code: `**61*${n}#`, label: "When you don't answer" },
    { code: `**67*${n}#`, label: "When you're busy" },
    { code: `**62*${n}#`, label: "When your phone is off or has no signal" },
    { code: `**004*${n}#`, label: "All three at once" },
  ]
}

function VoiceCard({ id, sub, selected, onSelect }: { id: string; sub: string; selected: boolean; onSelect: () => void }) {
  const [playing, setPlaying] = React.useState(false)
  React.useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => setPlaying(false), 2600)
    return () => clearTimeout(t)
  }, [playing])
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border p-3", selected ? "border-blue bg-blue-tint" : "border-line bg-white")}>
      <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? `Stop ${id} sample` : `Play ${id} sample`} className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy text-white hover:bg-navy/90">
        {playing ? <Pause className="size-5" /> : <Play className="ml-0.5 size-5" />}
      </button>
      <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
        <span className="min-w-0 flex-1">
          <span className="block t-label font-semibold text-navy">{id}</span>
          <span className="block t-caption text-muted-ink">{playing ? "Playing sample (no sound in the prototype)" : sub}</span>
        </span>
        {playing && (
          <span className="flex h-6 items-end gap-0.5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="w-1 animate-bounce rounded-full bg-blue" style={{ height: `${8 + ((i * 5) % 14)}px`, animationDelay: `${i * 90}ms` }} />
            ))}
          </span>
        )}
        <input type="radio" name="voice" checked={selected} onChange={onSelect} className="size-5 shrink-0 accent-blue" aria-label={`Use ${id}`} />
      </label>
    </div>
  )
}

/**
 * B-31 desk setup: six steps with a progress bar. Step 5 runs the B-33 test call inline; step 6 sets the desk live.
 * Reused as the W-17 Setup tab.
 */
export function DeskSetup({ businessId, onDone, links = APP_DESK_LINKS }: { businessId: string; onDone?: () => void; links?: DeskLinks }) {
  const s = useStore()
  const biz = businessById(s, businessId)
  const listing = listingById(s, biz?.listingId)
  const desk = deskFor(s, businessId)
  const [step, setStep] = React.useState(() => Math.min(6, Math.max(1, desk?.setupStep || 1)))
  const [greeting, setGreeting] = React.useState(() => desk?.greeting ?? "")
  const [voice, setVoice] = React.useState<DeskConfig["voice"]>(() => desk?.voice ?? "Ellie")
  const [perms, setPerms] = React.useState<DeskConfig["permissions"]>(() => desk?.permissions ?? { calls: true, sms: true, book: true, quotes: true, reviews: true })
  const [checking, setChecking] = React.useState(false)
  const topRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!checking) return
    const t = setTimeout(() => {
      useStore.getState().updateDeskConfig(businessId, { forwardingDetected: true })
      setChecking(false)
      toast("Forwarding detected")
    }, 1600)
    return () => clearTimeout(t)
  }, [checking, businessId])
  if (!biz || !listing || !desk) return null

  if (desk.status === "off") {
    return (
      <div className="card p-4">
        <p className="t-subhead">Start your free trial first</p>
        <p className="mt-1 t-label font-normal text-slate">{desk.trialUsed ? "Your trial has ended. Choose a plan to switch the desk back on." : "Setting up takes a few minutes. The trial is free for 14 days."}</p>
        <ButtonLink href={desk.trialUsed ? links.billing : links.intro} size="md" className="mt-3">
          {desk.trialUsed ? "Plan and billing" : "See the AI desk"}
        </ButtonLink>
        <PoweredByAskBridge className="mt-4" />
      </div>
    )
  }

  const owner = s.members.find((m) => m.businessId === businessId && m.role === "owner")
  const go = (n: number) => {
    const next = Math.min(6, Math.max(1, n))
    setStep(next)
    if (next > desk.setupStep) s.updateDeskConfig(businessId, { setupStep: next })
    topRef.current?.scrollIntoView({ block: "start" })
  }
  const hasServices = servicesFor(s, businessId).some((x) => x.bookable)
  const hasHours = !!availabilityFor(s, businessId)?.weeklyHours.some((h) => !h.closed)

  const nav = (nextLabel = "Next", onNext?: () => void) => (
    <div className="flex gap-2 pt-1">
      {step > 1 && (
        <Button variant="secondary" className="flex-1" onClick={() => go(step - 1)}>
          Back
        </Button>
      )}
      <Button
        className="flex-1"
        onClick={() => {
          onNext?.()
          go(step + 1)
        }}
      >
        {nextLabel}
      </Button>
    </div>
  )

  return (
    <div className="space-y-4" ref={topRef}>
      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="t-label text-navy">
            Step {step} of 6 · {SETUP_STEPS[step - 1]}
          </p>
          <p className="t-caption text-muted-ink tnum">{Math.round((step / 6) * 100)}%</p>
        </div>
        <ProgressBar value={step} max={6} label="Desk setup progress" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="card p-4 text-center">
            <p className="t-caption text-muted-ink">Your Answerd number</p>
            <p className="mt-1 text-[26px] font-bold leading-8 text-navy tnum">{desk.number || "Assigning…"}</p>
            <p className="mt-1 t-label font-normal text-slate">Customers who find you on Answerd call this number. It rings your mobile first.</p>
          </div>
          <div className="card p-4">
            <p className="t-subhead">Forward missed calls from your mobile</p>
            <p className="mt-1 t-label font-normal text-slate">Dial a code on your mobile and press call. These standard codes work on EE, O2, Vodafone and Three.</p>
            <ul className="mt-3 divide-y divide-line">
              {forwardCodes(desk.number).map((c) => (
                <li key={c.code} className="flex items-center gap-2 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono t-label text-navy tnum">{c.code}</span>
                    <span className="block t-caption text-muted-ink">{c.label}</span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Copy ${c.code}`}
                    onClick={() => {
                      void navigator.clipboard?.writeText(c.code).catch(() => undefined)
                      toast("Code copied")
                    }}
                    className="inline-flex size-11 items-center justify-center rounded-full text-blue hover:bg-blue-tint"
                  >
                    <Copy className="size-5" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 t-caption text-muted-ink">Codes can differ on some plans and business lines, so check with your network if one doesn&apos;t work.</p>
          </div>
          {desk.forwardingDetected ? (
            <Banner tone="success" title="Forwarding detected" icon={<CheckCircle2 className="size-5" aria-hidden />}>
              We saw a test call forwarded from {owner?.phone ? maskPhone(owner.phone) : "your mobile"} at {fmtTime(s.clock)}. Missed calls will reach the desk.
            </Banner>
          ) : desk.forwardingDetected === false ? (
            <Banner tone="warning" title="Forwarding not detected">
              The desk can still go live for texts and app messages. Try the codes again when you&apos;re ready.
            </Banner>
          ) : null}
          {!desk.forwardingDetected && (
            <Button block variant="secondary" loading={checking} onClick={() => setChecking(true)}>
              {checking ? "Checking for a forwarded call…" : "I've set it up"}
            </Button>
          )}
          {checking && (
            <p className="flex items-center justify-center gap-2 t-label font-normal text-muted-ink" role="status">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Checking for a forwarded call…
            </p>
          )}
          {nav(desk.forwardingDetected ? "Next" : "Skip for now", () => {
            if (!desk.forwardingDetected) s.updateDeskConfig(businessId, { forwardingDetected: false })
          })}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="card space-y-3 p-4">
            <Field label="Greeting" htmlFor="greeting" hint="The desk always says it's your Answerd assistant and that the call is recorded.">
              <TextArea id="greeting" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
            </Field>
            <div className="rounded-xl bg-teal-tint p-3">
              <p className="t-caption text-teal-ink">What callers hear</p>
              <p className="t-label font-normal text-navy">&ldquo;{ensureGreeting(greeting, listing.name)}&rdquo;</p>
            </div>
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 t-subhead">Voice</legend>
            {VOICES.map((v) => (
              <VoiceCard key={v.id} id={v.id} sub={v.sub} selected={voice === v.id} onSelect={() => setVoice(v.id)} />
            ))}
          </fieldset>
          {nav("Next", () => {
            s.updateDeskConfig(businessId, { greeting: ensureGreeting(greeting, listing.name), voice })
            setGreeting(ensureGreeting(greeting, listing.name))
          })}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="card divide-y divide-line px-4">
            {PERMISSIONS.map((p) => (
              <ToggleRow key={p.key} label={p.label} description={p.sub} checked={perms[p.key]} onChange={(v) => setPerms((x) => ({ ...x, [p.key]: v }))} />
            ))}
          </div>
          <p className="t-caption text-muted-ink">Every action the desk takes shows in your inbox, and you can undo it.</p>
          {nav("Next", () => s.updateDeskConfig(businessId, { permissions: perms }))}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-3">
          <HandoffRulesEditor businessId={businessId} saveLabel="Save and continue" onSaved={() => go(5)} />
          <Button variant="secondary" block onClick={() => go(3)}>
            Back
          </Button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          {(!hasServices || !hasHours) && (
            <Banner tone="warning" title="The desk needs your services and hours to book">
              {!hasServices && (
                <Link href={links.profile.services} className="block text-blue hover:underline">
                  Add services and prices
                </Link>
              )}
              {!hasHours && (
                <Link href={links.profile.hours} className="block text-blue hover:underline">
                  Add your hours
                </Link>
              )}
            </Banner>
          )}
          <CallScreen listing={listing} links={links} compact />
          {nav("Next")}
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4">
          <ul className="card divide-y divide-line px-4">
            {[
              { ok: !!desk.number, label: "Answerd number", sub: desk.number },
              { ok: !!desk.forwardingDetected, label: "Missed-call forwarding", sub: desk.forwardingDetected ? "Detected" : "Not detected: texts and app messages only" },
              { ok: true, label: "Greeting and voice", sub: `${desk.voice}` },
              { ok: true, label: "What the desk may do", sub: PERMISSIONS.filter((p) => desk.permissions[p.key]).map((p) => p.label.toLowerCase()).join(", ") || "Nothing yet" },
              { ok: true, label: "Handoff rules", sub: "Emergencies, complaints, price and named requests" },
            ].map((r) => (
              <li key={r.label} className="flex items-center gap-3 py-3">
                <span className={cn("inline-flex size-7 shrink-0 items-center justify-center rounded-full", r.ok ? "bg-teal-tint text-teal-ink" : "bg-amber-tint text-amber-ink")}>{r.ok ? <Check className="size-4" aria-label="Done" /> : <span aria-label="Needs attention">!</span>}</span>
                <span className="min-w-0">
                  <span className="block t-label text-navy">{r.label}</span>
                  <span className="block t-caption text-muted-ink tnum">{r.sub}</span>
                </span>
              </li>
            ))}
          </ul>
          {!desk.forwardingDetected && (
            <Banner tone="warning" title="Forwarding not detected">
              You can still go live. The desk will answer texts and app messages, and calls once forwarding is on.
            </Banner>
          )}
          {desk.status === "live" ? (
            <Banner tone="success" title="Your desk is live">
              Changes you make here apply straight away.
            </Banner>
          ) : null}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => go(5)}>
              Back
            </Button>
            <Button
              className="flex-[1.6]"
              onClick={() => {
                if (desk.status !== "live") s.setDeskStatus(businessId, "live")
                toast(desk.status === "live" ? "Desk settings saved" : "Your desk is live")
                onDone?.()
              }}
            >
              <Rocket /> {desk.status === "live" ? "Done" : "Go live"}
            </Button>
          </div>
        </div>
      )}
      <PoweredByAskBridge />
    </div>
  )
}
