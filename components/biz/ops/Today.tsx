"use client"
import * as React from "react"
import Link from "next/link"
import { CalendarClock, CalendarPlus, CalendarSync, ChevronRight, Hand, MapPin, Sparkles } from "lucide-react"
import { useStore } from "@/lib/store"
import { StatusPill } from "@/components/answerd/Status"
import { ButtonLink } from "@/components/answerd/Button"
import { gateStatus, serviceById } from "@/lib/selectors"
import { dayKey, fmtTime, ms } from "@/lib/time"
import { cn } from "@/lib/utils"
import { deskState, jobsOn, needsYou, requestCountdown, todayStats, type NeedItem } from "./data"
import { useOpsLinks } from "./links"

/** Desk status pill (Live, Paused, Off) linking to the desk screen. */
export function DeskPill({ businessId, className }: { businessId: string; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const d = deskState(s, businessId)
  return (
    <Link
      href={links.desk}
      aria-label={`AI desk: ${d.label}. Open the desk`}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-full px-3.5 t-label",
        d.status === "live" && "bg-teal-tint text-teal-ink",
        d.status === "paused" && "bg-amber-tint text-amber-ink",
        d.status === "off" && "border border-line bg-white text-slate",
        className,
      )}
    >
      <span className="relative inline-flex size-2.5" aria-hidden>
        {d.status === "live" && <span className="absolute inset-0 animate-ping rounded-full bg-teal opacity-60" />}
        <span className={cn("relative inline-flex size-2.5 rounded-full", d.status === "live" ? "bg-teal" : d.status === "paused" ? "bg-amber" : "bg-muted-ink")} />
      </span>
      Desk {d.label.toLowerCase()}
      <ChevronRight className="size-4" aria-hidden />
    </Link>
  )
}

/** B-18 stat row: New enquiries, Jobs today, Desk handled, Profile views. */
export function TodayStatRow({ listingId, staffUserId = null, className }: { listingId: string; staffUserId?: string | null; className?: string }) {
  const s = useStore()
  const t = todayStats(s, listingId, staffUserId)
  const tiles = [
    { label: "New enquiries", value: t.newEnquiries },
    { label: "Jobs today", value: t.jobsToday },
    { label: "Desk handled", value: t.deskHandled },
    { label: "Profile views", value: t.profileViews },
  ]
  return (
    <dl className={cn("grid grid-cols-4 gap-2", className)} aria-label="Today so far">
      {tiles.map((x) => (
        <div key={x.label} className="card flex flex-col-reverse justify-end gap-0.5 px-2.5 py-3">
          <dt className="t-caption leading-tight text-muted-ink">{x.label}</dt>
          <dd className="t-title tnum">{x.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function needRow(s: ReturnType<typeof useStore.getState>, n: NeedItem, links: ReturnType<typeof useOpsLinks>) {
  if (n.kind === "thread") {
    const first = n.thread.customerName.split(" ")[0]
    return { href: links.thread(n.thread.id), icon: Hand, tone: "bg-red-tint text-red", title: `${first} needs you`, sub: n.thread.handoffReason ?? "Waiting for a reply", right: n.thread.channel === "sms" ? "SMS" : n.thread.channel === "call" ? "Call" : "App" }
  }
  const b = n.booking
  const svc = serviceById(s, b.serviceId)?.name ?? "Job"
  if (n.kind === "request") {
    const c = requestCountdown(b.requestExpiresAt, s.clock)
    return { href: links.request(b.id), icon: CalendarClock, tone: "bg-amber-tint text-amber-ink", title: `Booking request: ${b.customerName}`, sub: `${svc}, ${fmtTime(b.startAt)} ${dayLabel(b.startAt, s.clock)}`, right: c?.label ?? "" }
  }
  return { href: links.job(b.id), icon: CalendarSync, tone: "bg-blue-tint text-blue", title: `${b.customerName} wants to move`, sub: `${svc} to ${fmtTime(b.changeRequest!.startAt)} ${dayLabel(b.changeRequest!.startAt, s.clock)}`, right: "Change" }
}

function dayLabel(iso: string, now: string) {
  const diff = Math.round((ms(iso) - ms(now)) / 86_400_000)
  if (dayKey(iso) === dayKey(now)) return "today"
  if (diff <= 1 && dayKey(iso) !== dayKey(now)) return "tomorrow"
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" }).format(new Date(iso)).replace(",", "")
}

/** Threads handed to the owner, booking requests and change requests. */
export function NeedsYouList({ listingId, limit, className }: { listingId: string; limit?: number; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const items = needsYou(s, listingId)
  const shown = limit ? items.slice(0, limit) : items
  if (!items.length)
    return (
      <p className={cn("card flex items-center gap-2 p-4 t-label font-normal text-slate", className)}>
        <Sparkles className="size-5 text-teal-ink" aria-hidden /> Nothing needs you right now.
      </p>
    )
  return (
    <ul className={cn("card divide-y divide-line overflow-hidden", className)}>
      {shown.map((n) => {
        const r = needRow(s, n, links)
        const I = r.icon
        return (
          <li key={n.key}>
            <Link href={r.href} className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-sky">
              <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-full", r.tone)}>
                <I className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate t-label text-navy">{r.title}</span>
                <span className="block truncate t-caption text-muted-ink">{r.sub}</span>
              </span>
              {r.right && <span className="shrink-0 t-caption text-muted-ink tnum">{r.right}</span>}
              <ChevronRight className="size-4 shrink-0 text-muted-ink" aria-hidden />
            </Link>
          </li>
        )
      })}
      {limit && items.length > limit && (
        <li>
          <Link href={links.inbox} className="flex min-h-11 items-center justify-center t-label text-blue hover:bg-sky">
            See all {items.length}
          </Link>
        </li>
      )}
    </ul>
  )
}

/** Today's jobs on a timeline, with a line at the demo clock's time. */
export function JobsTimeline({ listingId, staffUserId = null, day, className }: { listingId: string; staffUserId?: string | null; day?: string; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const d = day ?? dayKey(s.clock)
  const jobs = jobsOn(s, listingId, d, staffUserId).filter((b) => b.status !== "requested")
  const isToday = d === dayKey(s.clock)
  if (!jobs.length)
    return (
      <div className={cn("card flex flex-col items-center p-6 text-center", className)}>
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <p className="mt-3 t-subhead">Clear day</p>
        <p className="mt-1 t-body text-slate">No jobs in the diary{isToday ? " today" : ""}.</p>
        {!staffUserId && (
          <ButtonLink href={links.newDiary()} size="md" variant="secondary" className="mt-4">
            <CalendarPlus /> Add to diary
          </ButtonLink>
        )}
      </div>
    )
  const nowIdx = isToday ? jobs.findIndex((b) => ms(b.startAt) > ms(s.clock)) : -2
  const rows: React.ReactNode[] = []
  jobs.forEach((b, i) => {
    if (i === nowIdx) rows.push(<NowLine key="now" time={fmtTime(s.clock)} />)
    const svc = serviceById(s, b.serviceId)?.name ?? "Job"
    const assignee = b.assignedTo ? s.members.find((m) => m.userId === b.assignedTo)?.name.split(" ")[0] : null
    rows.push(
      <li key={b.id} className="relative pl-16">
        <span className="absolute left-0 top-3 w-12 text-right t-caption text-navy tnum">{fmtTime(b.startAt)}</span>
        <span className={cn("absolute left-[54px] top-[18px] size-2.5 rounded-full border-2 border-white", b.status === "completed" ? "bg-muted-ink" : "bg-blue")} aria-hidden />
        <Link href={links.job(b.id)} className={cn("card block p-3 hover:border-blue", ["cancelled", "no_show"].includes(b.status) && "opacity-70")}>
          <div className="flex items-start justify-between gap-2">
            <p className="t-label text-navy">{svc}</p>
            <StatusPill status={b.status} />
          </div>
          <p className="t-caption text-muted-ink tnum">
            {fmtTime(b.startAt)} to {fmtTime(b.endAt)} · {b.customerName}
            {assignee ? ` · ${assignee}` : ""}
          </p>
          <p className="mt-0.5 flex items-center gap-1 t-caption text-muted-ink">
            <MapPin className="size-3.5" aria-hidden /> {b.postcode || b.address}
          </p>
        </Link>
      </li>,
    )
  })
  if (isToday && nowIdx === -1) rows.push(<NowLine key="now" time={fmtTime(s.clock)} />)
  return <ol className={cn("relative space-y-3 before:absolute before:bottom-2 before:left-[58px] before:top-2 before:w-0.5 before:bg-line", className)}>{rows}</ol>
}

function NowLine({ time }: { time: string }) {
  return (
    <li className="relative flex items-center gap-2 pl-16" aria-label={`Now, ${time}`}>
      <span className="absolute left-0 w-12 text-right t-caption font-semibold text-red tnum">{time}</span>
      <span className="absolute left-[53px] size-3 rounded-full bg-red" aria-hidden />
      <span className="h-0.5 flex-1 bg-red" aria-hidden />
      <span className="t-caption font-semibold text-red">Now</span>
    </li>
  )
}

/** Shown once the monetise gate rule is met (10 Answerd enquiries and day 60, or an admin override). */
export function GateCard({ businessId, className }: { businessId: string; className?: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const g = gateStatus(s, businessId)
  if (!g.met) return null
  return (
    <section className={cn("rounded-2xl bg-navy p-4 text-white", className)} aria-labelledby="gate-card">
      <p className="t-caption text-white/80">Your Answerd enquiries</p>
      <h2 id="gate-card" className="mt-1 t-subhead text-white">
        Answerd sent you {g.count} enquiries. Keep your desk for £49/month.
      </h2>
      <p className="mt-1 t-label font-normal text-white/90">Prices exclude VAT. Your listing stays free whatever you choose.</p>
      <ButtonLink href={links.billing} size="md" className="mt-3">
        See plans
      </ButtonLink>
    </section>
  )
}
