"use client"
import * as React from "react"
import Link from "next/link"
import { BookOpen, Bot, ChevronRight, MessageSquare, Pause, Phone, PhoneCall, Play, Settings2, Smartphone, UserRound } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { BottomSheet } from "@/components/answerd/Sheet"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { businessById, deskFor, listingById } from "@/lib/selectors"
import { dayKey, fmtAgo, fmtDate, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { DeskStatus } from "@/lib/types"
import { cn } from "@/lib/utils"
import { APP_DESK_LINKS, type DeskLinks } from "./common"

const STATUS: Record<DeskStatus, { label: string; cls: string; dot: string }> = {
  live: { label: "Live", cls: "bg-teal-tint text-teal-ink", dot: "bg-teal animate-pulse-dot" },
  paused: { label: "Paused", cls: "bg-amber-tint text-amber-ink", dot: "bg-amber" },
  trial: { label: "Setting up", cls: "bg-blue-tint text-blue", dot: "bg-blue" },
  off: { label: "Off", cls: "bg-sky text-muted-ink", dot: "bg-muted-ink" },
}

export function DeskStatusPill({ status, className }: { status: DeskStatus; className?: string }) {
  const m = STATUS[status]
  return (
    <span className={cn("inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 t-caption", m.cls, className)}>
      <span className={cn("size-2 rounded-full", m.dot)} aria-hidden />
      {m.label}
    </span>
  )
}

/** Trial days left, from the DeskConfig and the desk subscription. */
export function useDeskTrial(businessId: string | undefined) {
  const s = useStore()
  const desk = deskFor(s, businessId)
  const sub = s.subscriptions.find((x) => x.businessId === businessId && x.plan === "desk")
  const trialing = !!desk?.trialEndsAt && sub?.status === "trialing" && desk.status !== "off"
  const daysLeft = trialing ? Math.max(0, Math.ceil((ms(desk!.trialEndsAt!) - ms(s.clock)) / MS_DAY)) : 0
  return { trialing, daysLeft, endsAt: desk?.trialEndsAt, paid: sub?.status === "active" }
}

/** Today's desk activity from real records. */
export function deskToday(s: ReturnType<typeof useStore.getState>, listingId: string) {
  const today = dayKey(s.clock)
  const threads = s.threads.filter((t) => t.listingId === listingId)
  const tIds = new Set(threads.filter((t) => t.channel !== "call").map((t) => t.id))
  return {
    calls: s.calls.filter((c) => c.listingId === listingId && c.outcome === "desk" && !c.spam && dayKey(c.startedAt) === today).length,
    messages: new Set(s.messages.filter((m) => m.author === "desk" && tIds.has(m.threadId) && dayKey(m.createdAt) === today).map((m) => m.threadId)).size,
    booked: s.bookings.filter((b) => b.listingId === listingId && b.createdBy === "desk" && dayKey(b.createdAt) === today).length,
    handed: threads.filter((t) => t.status === "needs_owner" && !t.spam && dayKey(t.updatedAt) === today).length,
  }
}

/**
 * B-32 desk overview: status with Pause and Resume (confirm sheet), today's counts, recent desk conversations
 * and the trial banner. Reused as the W-17 Overview tab.
 */
export function DeskOverview({ businessId, links = APP_DESK_LINKS, showLinks = true, readOnly }: { businessId: string; links?: DeskLinks; showLinks?: boolean; readOnly?: boolean }) {
  const s = useStore()
  const biz = businessById(s, businessId)
  const listing = listingById(s, biz?.listingId)
  const desk = deskFor(s, businessId)
  const trial = useDeskTrial(businessId)
  const [sheet, setSheet] = React.useState<"pause" | "resume" | null>(null)
  if (!biz || !listing || !desk) return null
  const counts = deskToday(s, listing.id)
  const killed = s.settings.killSwitch

  const recent = [
    ...s.calls.filter((c) => c.listingId === listing.id && c.outcome === "desk").map((c) => ({ id: c.id, kind: "call" as const, at: c.startedAt, name: c.customerName || c.callerMasked, line: c.summary ?? "Answered by the desk", spam: !!c.spam, needs: !!c.threadId && s.threads.find((t) => t.id === c.threadId)?.status === "needs_owner", href: links.call(c.id) })),
    ...s.threads
      .filter((t) => t.listingId === listing.id && t.channel !== "call" && s.messages.some((m) => m.threadId === t.id && m.author === "desk"))
      .map((t) => {
        const last = s.messages.filter((m) => m.threadId === t.id && m.author !== "system").at(-1)
        return { id: t.id, kind: t.channel === "sms" ? ("sms" as const) : ("app" as const), at: t.updatedAt, name: t.customerName, line: last?.body ?? "", spam: !!t.spam, needs: t.status === "needs_owner", href: links.thread(t.id) }
      }),
  ]
    .sort((a, b) => ms(b.at) - ms(a.at))
    .slice(0, 8)

  const confirm = () => {
    if (sheet === "pause") {
      s.setDeskStatus(businessId, "paused")
      toast("Desk paused. Calls and messages come to you only.")
    } else {
      s.setDeskStatus(businessId, desk.pausedFrom && desk.pausedFrom !== "paused" && desk.pausedFrom !== "off" ? desk.pausedFrom : "live")
      toast("Desk is back on")
    }
    setSheet(null)
  }

  return (
    <div className="space-y-4">
      {killed && (
        <Banner tone="error" title="The desk is switched off for everyone">
          Answerd has paused all desks for a moment. Calls and messages come to you directly.
        </Banner>
      )}
      {desk.status === "paused" && (
        <Banner tone="warning" title="Your desk is paused">
          Customers see your normal reply times and you don&apos;t get the Responds instantly badge until you resume.
        </Banner>
      )}
      {trial.trialing && (
        <Banner tone={trial.daysLeft <= 3 ? "warning" : "info"} title={trial.daysLeft <= 3 ? `Trial ending: ${trial.daysLeft} day${trial.daysLeft === 1 ? "" : "s"} left` : `${trial.daysLeft} days left on your free trial`} action={readOnly ? undefined : <Link href={links.billing} className="t-label text-blue hover:underline">Choose a plan</Link>}>
          Your trial ends on {fmtDate(trial.endsAt!)}. You won&apos;t pay anything before you&apos;ve had 10 enquiries from Answerd.
        </Banner>
      )}
      {desk.status === "off" && (
        desk.trialUsed ? (
          <Banner tone="warning" title="Your desk is off" action={readOnly ? undefined : <Link href={links.billing} className="t-label text-blue hover:underline">Upgrade</Link>}>
            Your free trial has ended. Customers see your normal reply times.
          </Banner>
        ) : (
          <div className="card p-4">
            <p className="t-subhead">Switch on your AI front desk</p>
            <p className="mt-1 t-label font-normal text-slate">It answers calls and texts you miss, books jobs into your diary and hands anything tricky to you.</p>
            {!readOnly && (
              <ButtonLink href={links.intro} size="md" className="mt-3">
                See how it works
              </ButtonLink>
            )}
          </div>
        )
      )}

      <div className="card p-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue">
            <Bot className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="t-subhead">Answerd desk</p>
              <DeskStatusPill status={desk.status} />
            </div>
            <p className="t-label font-normal text-slate tnum">{desk.number ? <>Your Answerd number <span className="whitespace-nowrap">{desk.number}</span></> : "No Answerd number yet"}</p>
          </div>
        </div>
        {!readOnly && (desk.status === "live" || desk.status === "paused") && (
          <Button block variant={desk.status === "live" ? "secondary" : "primary"} className="mt-3" onClick={() => setSheet(desk.status === "live" ? "pause" : "resume")}>
            {desk.status === "live" ? (
              <>
                <Pause /> Pause desk
              </>
            ) : (
              <>
                <Play /> Resume desk
              </>
            )}
          </Button>
        )}
        {!readOnly && desk.status === "trial" && (
          <ButtonLink href={links.setup} block className="mt-3">
            Finish setting up
          </ButtonLink>
        )}
      </div>

      <section aria-labelledby="desk-today">
        <h2 id="desk-today" className="mb-2 t-heading">
          Today
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Calls answered", value: counts.calls },
            { label: "Messages replied", value: counts.messages },
            { label: "Jobs booked", value: counts.booked },
            { label: "Handed to you", value: counts.handed },
          ].map((x) => (
            <div key={x.label} className="card p-3.5">
              <p className="t-caption text-muted-ink">{x.label}</p>
              <p className="t-title tnum">{x.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="desk-recent">
        <h2 id="desk-recent" className="mb-2 t-heading">
          Recent conversations
        </h2>
        <DataGate isEmpty={!recent.length} rows={3} empty={<div className="card"><EmptyState title="No desk conversations yet" body="When the desk answers a call or message, it shows up here." action={readOnly ? undefined : <ButtonLink href={links.testCall} size="md">Run a test call</ButtonLink>} /></div>}>
          <ul className="card divide-y divide-line overflow-hidden">
            {recent.map((r) => {
              const I = r.kind === "call" ? Phone : r.kind === "sms" ? Smartphone : MessageSquare
              return (
                <li key={`${r.kind}-${r.id}`}>
                  <Link href={r.href} className="flex min-h-16 items-start gap-3 px-4 py-3 hover:bg-sky">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-sky text-navy">
                      <I className="size-[18px]" aria-label={r.kind === "call" ? "Call" : r.kind === "sms" ? "Text" : "App message"} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate t-label font-semibold text-navy">{r.name}</span>
                        {r.needs && <span className="shrink-0 rounded-full bg-amber-tint px-2 py-0.5 t-caption text-amber-ink">Needs you</span>}
                        {r.spam && <span className="shrink-0 rounded-full bg-sky px-2 py-0.5 t-caption text-muted-ink">Spam</span>}
                        <span className="ml-auto shrink-0 t-caption text-muted-ink tnum">{fmtAgo(r.at, s.clock)}</span>
                      </span>
                      <span className="line-clamp-2 t-label font-normal text-slate">{r.line}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </DataGate>
      </section>

      {showLinks && !readOnly && (
        <ul className="card divide-y divide-line overflow-hidden">
          {[
            { href: links.testCall, icon: PhoneCall, label: "Test call", sub: "Hear how the desk answers" },
            { href: links.knowledge, icon: BookOpen, label: "What the desk knows", sub: "Services, prices, hours, Q&A" },
            { href: links.handoff, icon: UserRound, label: "Handoff rules", sub: "When it hands over, quiet hours" },
            { href: links.setup, icon: Settings2, label: "Number, greeting and voice", sub: "Desk setup" },
          ].map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="flex min-h-14 items-center gap-3 px-4 py-2.5 hover:bg-sky">
                <r.icon className="size-5 text-blue" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy">{r.label}</span>
                  <span className="block t-caption text-muted-ink">{r.sub}</span>
                </span>
                <ChevronRight className="size-5 text-muted-ink" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet === "pause" ? "Pause your desk?" : "Resume your desk?"}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setSheet(null)}>
              Cancel
            </Button>
            <Button variant={sheet === "pause" ? "destructive" : "primary"} className="flex-1" onClick={confirm}>
              {sheet === "pause" ? "Pause desk" : "Resume desk"}
            </Button>
          </div>
        }
      >
        <p className="t-body text-slate">
          {sheet === "pause"
            ? "Calls and messages will come to you only. Customers see your normal reply times, and your listing loses the Responds instantly badge until you resume."
            : "The desk will answer calls and messages you miss again, and your listing gets the Responds instantly badge back."}
        </p>
      </BottomSheet>
    </div>
  )
}
