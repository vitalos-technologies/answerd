"use client"
import * as React from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { useStore } from "@/lib/store"
import { SegmentedControl, StatusPill, STATUS_LABEL } from "@/components/answerd/Status"
import { EmptyState } from "@/components/answerd/Feedback"
import { IconButton } from "@/components/answerd/Button"
import { serviceById } from "@/lib/selectors"
import { addDays, atMinutes, dayKey, fmtDate, fmtDayMonth, fmtDow, fmtHM, fmtTime, minutesOfDay, ms, parts } from "@/lib/time"
import { cn } from "@/lib/utils"
import type { BlockTime, Booking, BookingStatus } from "@/lib/types"
import { visibleJobs } from "./data"
import { useOpsLinks } from "./links"

export type DiaryView = "day" | "week" | "list"

const START_H = 7
const END_H = 20

/** Job colours by status; every block also carries the status as text. */
export const JOB_TONE: Record<BookingStatus, string> = {
  requested: "bg-amber-tint border-amber-ink",
  confirmed: "bg-teal-tint border-teal-ink",
  on_the_way: "bg-blue-tint border-blue",
  arrived: "bg-blue-tint border-blue",
  completed: "bg-white border-muted-ink",
  cancelled: "bg-red-tint border-red opacity-70",
  no_show: "bg-red-tint border-red opacity-70",
  declined: "bg-red-tint border-red opacity-70",
}

export function mondayOf(day: string) {
  const noon = atMinutes(day, 12 * 60)
  return dayKey(addDays(noon, -((parts(noon).dow + 6) % 7)))
}

export function shiftDay(day: string, n: number) {
  return dayKey(addDays(atMinutes(day, 12 * 60), n))
}

/** Blocked time falling on a day, with daily and weekly repeats expanded. */
export function blocksOn(blocks: BlockTime[], businessId: string, day: string) {
  const out: { id: string; reason: string; start: number; end: number; repeat: BlockTime["repeat"] }[] = []
  const dow = parts(atMinutes(day, 12 * 60)).dow
  for (const b of blocks) {
    if (b.businessId !== businessId) continue
    const first = dayKey(b.startAt)
    if (day < first) continue
    const on = b.repeat === "none" ? first === day : b.repeat === "daily" ? true : parts(b.startAt).dow === dow
    if (!on) continue
    const start = minutesOfDay(b.startAt)
    const end = dayKey(b.endAt) === first ? minutesOfDay(b.endAt) : 24 * 60
    out.push({ id: `${b.id}-${day}`, reason: b.reason, start, end, repeat: b.repeat })
  }
  return out
}

function jobsFor(s: ReturnType<typeof useStore.getState>, listingId: string, staffUserId: string | null, day: string) {
  return visibleJobs(s, listingId, staffUserId)
    .filter((b) => dayKey(b.startAt) === day && b.status !== "declined")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

/**
 * B-23 diary: Day, Week and List. Jobs are blocks coloured by status with text labels,
 * blocked time is hatched, a line marks the demo clock, and tapping empty space opens B-25 at that time.
 */
export function Diary({
  listingId,
  businessId,
  staffUserId = null,
  canAdd = true,
  initialView = "day",
  initialDay,
  className,
}: {
  listingId: string
  businessId: string
  staffUserId?: string | null
  canAdd?: boolean
  initialView?: DiaryView
  initialDay?: string
  className?: string
}) {
  const clock = useStore((s) => s.clock)
  const today = dayKey(clock)
  const [view, setView] = React.useState<DiaryView>(initialView)
  const [day, setDay] = React.useState(initialDay ?? today)
  const step = view === "week" ? 7 : 1
  const weekStart = mondayOf(day)
  const label = view === "week" ? `${fmtDayMonth(atMinutes(weekStart, 720))} to ${fmtDayMonth(atMinutes(shiftDay(weekStart, 6), 720))}` : view === "list" ? `From ${fmtDate(atMinutes(day, 720))}` : day === today ? `Today, ${fmtDate(atMinutes(day, 720))}` : fmtDate(atMinutes(day, 720))
  return (
    <div className={className}>
      <SegmentedControl
        label="Diary view"
        value={view}
        onChange={setView}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "list", label: "List" },
        ]}
      />
      <div className="mt-3 flex items-center gap-1">
        <IconButton label={view === "week" ? "Previous week" : "Previous day"} onClick={() => setDay(shiftDay(day, -step))}>
          <ChevronLeft />
        </IconButton>
        <p className="min-w-0 flex-1 text-center t-subhead tnum" aria-live="polite">
          {label}
        </p>
        <IconButton label={view === "week" ? "Next week" : "Next day"} onClick={() => setDay(shiftDay(day, step))}>
          <ChevronRight />
        </IconButton>
        <button type="button" onClick={() => setDay(today)} disabled={day === today} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-3.5 t-label text-navy hover:bg-sky disabled:opacity-50">
          Today
        </button>
      </div>
      <Legend />
      {view === "day" && <DayGrid listingId={listingId} businessId={businessId} staffUserId={staffUserId} day={day} canAdd={canAdd} />}
      {view === "week" && <WeekGrid listingId={listingId} businessId={businessId} staffUserId={staffUserId} weekStart={weekStart} canAdd={canAdd} onPickDay={(d) => (setDay(d), setView("day"))} />}
      {view === "list" && <DiaryList listingId={listingId} businessId={businessId} staffUserId={staffUserId} from={day} />}
    </div>
  )
}

function Legend() {
  const items: [string, string][] = [
    ["Confirmed", JOB_TONE.confirmed],
    ["On the way / Arrived", JOB_TONE.on_the_way],
    ["Requested", JOB_TONE.requested],
    ["Completed", JOB_TONE.completed],
  ]
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1" aria-label="Key">
      {items.map(([l, c]) => (
        <li key={l} className="flex items-center gap-1.5 t-caption text-muted-ink">
          <span className={cn("h-3 w-4 rounded-sm border-l-[3px]", c)} aria-hidden /> {l}
        </li>
      ))}
      <li className="flex items-center gap-1.5 t-caption text-muted-ink">
        <span className="hatched h-3 w-4 rounded-sm border border-line" aria-hidden /> Blocked
      </li>
    </ul>
  )
}

function JobBlock({ b, style, compact }: { b: Booking; style: React.CSSProperties; compact?: boolean }) {
  const s = useStore()
  const links = useOpsLinks()
  const svc = serviceById(s, b.serviceId)?.name ?? "Job"
  const href = b.status === "requested" ? links.request(b.id) : links.job(b.id)
  return (
    <Link
      href={href}
      style={style}
      className={cn("absolute z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-navy shadow-card hover:ring-2 hover:ring-blue", JOB_TONE[b.status])}
    >
      {compact ? (
        <>
          <span className="block truncate text-[10px] font-semibold leading-3 tnum">{fmtTime(b.startAt)}</span>
          <span className="block truncate text-[10px] leading-3">{svc}</span>
          <span className="block truncate text-[10px] leading-3 text-slate">{STATUS_LABEL[b.status]}</span>
          <span className="sr-only">, {b.customerName}</span>
        </>
      ) : (
        <>
          <span className="flex items-center justify-between gap-1">
            <span className={cn("truncate t-caption font-semibold", ["cancelled", "no_show"].includes(b.status) && "line-through")}>{svc}</span>
            <span className="shrink-0 text-[11px] font-medium text-slate">{STATUS_LABEL[b.status]}</span>
          </span>
          <span className="block truncate text-[11px] leading-4 text-slate tnum">
            {fmtTime(b.startAt)} to {fmtTime(b.endAt)} · {b.customerName}
          </span>
        </>
      )}
    </Link>
  )
}

function DayGrid({ listingId, businessId, staffUserId, day, canAdd }: { listingId: string; businessId: string; staffUserId: string | null; day: string; canAdd: boolean }) {
  const s = useStore()
  const links = useOpsLinks()
  const H = 56
  const jobs = jobsFor(s, listingId, staffUserId, day)
  const blocks = blocksOn(s.blocks, businessId, day)
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const y = (min: number) => ((min - START_H * 60) / 60) * H
  const nowMin = dayKey(s.clock) === day ? minutesOfDay(s.clock) : null
  // Overlapping jobs share the width
  const lanes = new Map<string, { lane: number; of: number }>()
  jobs.forEach((b, i) => {
    const overl = jobs.filter((x) => ms(x.startAt) < ms(b.endAt) && ms(b.startAt) < ms(x.endAt))
    lanes.set(b.id, { lane: overl.indexOf(b), of: overl.length })
    void i
  })
  return (
    <div className="relative mt-3 rounded-2xl border border-line bg-white" style={{ height: hours.length * H + 8 }}>
      {hours.map((h, i) => (
        <div key={h} className="absolute inset-x-0 border-t border-line" style={{ top: i * H }}>
          <span className="absolute left-2 -top-px bg-white pr-1 t-caption text-muted-ink tnum">{fmtHM(h, 0)}</span>
          {canAdd &&
            [0, 30].map((m) => {
              const at = atMinutes(day, h * 60 + m)
              const from = h * 60 + m
              const busy = jobs.some((b) => minutesOfDay(b.startAt) < from + 30 && from < (minutesOfDay(b.endAt) || 24 * 60)) || blocks.some((b) => b.start < from + 30 && from < b.end)
              if (busy) return null
              return (
                <Link
                  key={m}
                  href={links.newDiary(at)}
                  aria-label={`Add to diary at ${fmtTime(at)}`}
                  className="absolute left-14 right-1 rounded-md hover:bg-blue-tint/60 focus-visible:bg-blue-tint"
                  style={{ top: (m / 60) * H, height: H / 2 }}
                />
              )
            })}
        </div>
      ))}
      {blocks.map((b) => (
        <div key={b.id} className="hatched absolute left-14 right-1 z-[5] flex items-start gap-1 rounded-lg border border-line px-2 py-1" style={{ top: y(Math.max(b.start, START_H * 60)), height: Math.max(20, y(Math.min(b.end, END_H * 60)) - y(Math.max(b.start, START_H * 60))) }}>
          <Lock className="mt-0.5 size-3 shrink-0 text-slate" aria-hidden />
          <span className="truncate t-caption text-slate">
            Blocked: {b.reason}
            {b.repeat !== "none" ? ` (${b.repeat})` : ""}
          </span>
        </div>
      ))}
      {jobs.map((b) => {
        const l = lanes.get(b.id)!
        const top = y(Math.max(minutesOfDay(b.startAt), START_H * 60))
        const h = Math.max(30, y(Math.min(minutesOfDay(b.endAt) || 24 * 60, END_H * 60)) - top - 2)
        return <JobBlock key={b.id} b={b} style={{ top: top + 1, height: h, left: `calc(56px + (100% - 60px) * ${l.lane / l.of})`, width: `calc((100% - 60px) / ${l.of} - 2px)` }} />
      })}
      {nowMin !== null && nowMin >= START_H * 60 && nowMin <= END_H * 60 && (
        <div className="pointer-events-none absolute left-12 right-0 z-20 flex items-center" style={{ top: y(nowMin) - 4 }} role="img" aria-label={`Now, ${fmtTime(s.clock)}`}>
          <span className="size-2.5 rounded-full bg-red" />
          <span className="h-0.5 flex-1 bg-red" />
        </div>
      )}
      {!jobs.length && !blocks.length && <p className="pointer-events-none absolute inset-x-14 top-2 z-[1] text-center t-caption text-muted-ink">Nothing booked. Tap a time to add a job or block time.</p>}
    </div>
  )
}

function WeekGrid({ listingId, businessId, staffUserId, weekStart, canAdd, onPickDay }: { listingId: string; businessId: string; staffUserId: string | null; weekStart: string; canAdd: boolean; onPickDay: (d: string) => void }) {
  const s = useStore()
  const links = useOpsLinks()
  const H = 40
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(weekStart, i))
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const y = (min: number) => ((min - START_H * 60) / 60) * H
  const today = dayKey(s.clock)
  return (
    <div className="mt-3 rounded-2xl border border-line bg-white">
      <div className="grid grid-cols-[32px_repeat(7,minmax(0,1fr))] border-b border-line">
        <span />
        {days.map((d) => (
          <button key={d} type="button" onClick={() => onPickDay(d)} aria-label={`Open ${fmtDate(atMinutes(d, 720))}`} className={cn("flex min-h-11 flex-col items-center justify-center py-1 hover:bg-sky", d === today && "text-blue")}>
            <span className="text-[11px] font-medium leading-4">{fmtDow(atMinutes(d, 720))}</span>
            <span className={cn("inline-flex size-6 items-center justify-center rounded-full text-[13px] font-semibold tnum", d === today && "bg-blue text-white")}>{parts(atMinutes(d, 720)).d}</span>
          </button>
        ))}
      </div>
      <div className="relative grid grid-cols-[32px_repeat(7,minmax(0,1fr))]" style={{ height: hours.length * H }}>
        <div className="relative">
          {hours.map((h, i) => (
            <span key={h} className="absolute right-1 text-[10px] leading-3 text-muted-ink tnum" style={{ top: i * H + 2 }}>
              {fmtHM(h, 0)}
            </span>
          ))}
        </div>
        {days.map((d) => {
          const jobs = jobsFor(s, listingId, staffUserId, d)
          const blocks = blocksOn(s.blocks, businessId, d)
          const nowMin = d === today ? minutesOfDay(s.clock) : null
          return (
            <div key={d} className={cn("relative border-l border-line", d === today && "bg-blue-tint/30")}>
              {hours.map((h, i) =>
                canAdd ? (
                  <Link key={h} href={links.newDiary(atMinutes(d, h * 60))} aria-label={`Add to diary ${fmtDate(atMinutes(d, 720))} at ${fmtHM(h, 0)}`} className="absolute inset-x-0 border-t border-line hover:bg-blue-tint/60 focus-visible:bg-blue-tint" style={{ top: i * H, height: H }} />
                ) : (
                  <span key={h} className="absolute inset-x-0 border-t border-line" style={{ top: i * H, height: H }} />
                ),
              )}
              {blocks.map((b) => (
                <div key={b.id} title={`Blocked: ${b.reason}`} aria-label={`Blocked: ${b.reason}`} className="hatched absolute inset-x-0.5 z-[5] rounded border border-line" style={{ top: y(Math.max(b.start, START_H * 60)), height: Math.max(10, y(Math.min(b.end, END_H * 60)) - y(Math.max(b.start, START_H * 60))) }} />
              ))}
              {jobs.map((b) => {
                const top = y(Math.max(minutesOfDay(b.startAt), START_H * 60))
                return <JobBlock key={b.id} b={b} compact style={{ top: top + 1, height: Math.max(36, y(Math.min(minutesOfDay(b.endAt) || 24 * 60, END_H * 60)) - top - 2), left: 2, right: 2 }} />
              })}
              {nowMin !== null && nowMin >= START_H * 60 && nowMin <= END_H * 60 && <span className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-red" style={{ top: y(nowMin) }} aria-hidden />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DiaryList({ listingId, businessId, staffUserId, from }: { listingId: string; businessId: string; staffUserId: string | null; from: string }) {
  const s = useStore()
  const links = useOpsLinks()
  const days = Array.from({ length: 14 }, (_, i) => shiftDay(from, i))
  const groups = days.map((d) => ({ d, jobs: jobsFor(s, listingId, staffUserId, d), blocks: blocksOn(s.blocks, businessId, d) })).filter((g) => g.jobs.length || g.blocks.length)
  if (!groups.length) return <EmptyState className="mt-3" title="Nothing in the next 2 weeks" body="Jobs and blocked time show here as they're booked." />
  return (
    <div className="mt-3 space-y-4">
      {groups.map((g) => (
        <section key={g.d} aria-labelledby={`dl-${g.d}`}>
          <h3 id={`dl-${g.d}`} className="mb-1.5 t-label text-navy">
            {g.d === dayKey(s.clock) ? "Today, " : ""}
            {fmtDate(atMinutes(g.d, 720))}
          </h3>
          <ul className="card divide-y divide-line overflow-hidden">
            {g.blocks.map((b) => (
              <li key={b.id} className="hatched flex min-h-12 items-center gap-3 px-4 py-2">
                <span className="w-16 shrink-0 t-caption text-navy tnum">{fmtHM(Math.floor(b.start / 60), b.start % 60)}</span>
                <span className="flex-1 t-label font-normal text-slate">Blocked: {b.reason}</span>
              </li>
            ))}
            {g.jobs.map((b) => (
              <li key={b.id}>
                <Link href={b.status === "requested" ? links.request(b.id) : links.job(b.id)} className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-sky">
                  <span className="w-16 shrink-0 t-caption text-navy tnum">{fmtTime(b.startAt)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate t-label text-navy">{serviceById(s, b.serviceId)?.name ?? "Job"}</span>
                    <span className="block truncate t-caption text-muted-ink">
                      {b.customerName} · {b.postcode}
                    </span>
                  </span>
                  <StatusPill status={b.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
