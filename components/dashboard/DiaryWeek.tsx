"use client"
import * as React from "react"
import { ChevronLeft, ChevronRight, GripVertical, Lock } from "lucide-react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { useStore } from "@/lib/store"
import { Banner } from "@/components/answerd/Feedback"
import { IconButton } from "@/components/answerd/Button"
import { STATUS_LABEL } from "@/components/answerd/Status"
import { blocksOn, JOB_TONE, mondayOf, shiftDay } from "@/components/biz/ops/Diary"
import { visibleJobs } from "@/components/biz/ops/data"
import { serviceById } from "@/lib/selectors"
import { atMinutes, dayKey, fmtDate, fmtDateTime, fmtDayMonth, fmtDow, fmtHM, fmtTime, minutesOfDay, ms, parts } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Booking, BookingStatus } from "@/lib/types"

const START_H = 7
const END_H = 20
const H = 56 // px per hour
const HALF = H / 2
const ACTIVE: BookingStatus[] = ["requested", "confirmed", "on_the_way", "arrived"]

type S = ReturnType<typeof useStore.getState>

/** Only confirmed jobs move by drag; requests are answered first and jobs under way stay put. */
export function canDrag(b: Booking) {
  return b.status === "confirmed"
}

/**
 * Where a job would land if dropped at `min` minutes on `day`, and why it can't
 * (a clash with another job or blocked time, the past, or outside the diary's hours).
 */
export function checkMove(s: S, b: Booking, businessId: string, day: string, min: number) {
  const dur = Math.round((ms(b.endAt) - ms(b.startAt)) / 60_000)
  const startAt = atMinutes(day, min)
  const endAt = new Date(ms(startAt) + dur * 60_000).toISOString()
  let problem: string | null = null
  if (min < START_H * 60 || min + Math.min(dur, 30) > END_H * 60) problem = `Pick a time between ${fmtHM(START_H, 0)} and ${fmtHM(END_H, 0)}.`
  else if (ms(startAt) < ms(s.clock)) problem = "That time has already passed."
  else {
    const job = s.bookings.find((x) => x.id !== b.id && x.listingId === b.listingId && ACTIVE.includes(x.status) && ms(x.startAt) < ms(endAt) && ms(startAt) < ms(x.endAt))
    const block = blocksOn(s.blocks, businessId, day).find((x) => x.start < min + dur && min < x.end)
    if (job) problem = `It clashes with ${serviceById(s, job.serviceId)?.name ?? "a job"} for ${job.customerName} at ${fmtTime(job.startAt)}.`
    else if (block) problem = `It clashes with blocked time: ${block.reason}.`
  }
  return { startAt, endAt, dur, problem }
}

interface DragState {
  id: string
  day: string
  min: number
  problem: string | null
}

/**
 * W-15 week calendar. Confirmed jobs drag to a new day and time (@dnd-kit, pointer or keyboard);
 * a drop onto a clash shows a warning and the job snaps back, otherwise the job moves and the
 * customer is told (store `reschedule`, the same action as B-24's Move). Tapping a job or empty time
 * calls `onOpen` / `onAdd` so the page can show the job side panel or Add to diary.
 */
export function DiaryWeek({
  listingId,
  businessId,
  staffUserId = null,
  canAdd = true,
  weekStart,
  onWeekChange,
  selectedId,
  onOpen,
  onAdd,
  className,
}: {
  listingId: string
  businessId: string
  staffUserId?: string | null
  canAdd?: boolean
  weekStart: string
  onWeekChange: (monday: string) => void
  selectedId?: string | null
  onOpen: (b: Booking) => void
  onAdd: (at: string) => void
  className?: string
}) {
  const s = useStore()
  const today = dayKey(s.clock)
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(weekStart, i))
  const [drag, setDrag] = React.useState<DragState | null>(null)
  const [warning, setWarning] = React.useState<{ title: string; body: string } | null>(null)
  const colWidth = React.useRef(120)
  // A pointer drag ends with a click on the job; ignore it so the panel doesn't open after a move
  const lastDrag = React.useRef(0)
  const ignoreClick = React.useCallback(() => Date.now() - lastDrag.current < 400, [])
  const gridRef = React.useRef<HTMLDivElement>(null)

  // Keyboard moves count whole steps (30 minutes up or down, a day left or right), so page scrolling can't skew them
  const kb = React.useRef<{ x: number; y: number } | null>(null)
  const keyboardGetter = React.useCallback<KeyboardCoordinateGetter>((e, { currentCoordinates: c }) => {
    const step = ({ ArrowDown: [0, 1], ArrowUp: [0, -1], ArrowRight: [1, 0], ArrowLeft: [-1, 0] } as Record<string, [number, number]>)[e.code]
    if (!step) return undefined
    if (kb.current) kb.current = { x: kb.current.x + step[0]!, y: kb.current.y + step[1]! }
    return { x: c.x + step[0]! * colWidth.current, y: c.y + step[1]! * HALF }
  }, [])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardGetter, keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] } }),
  )
  // Pointer: the day column under the pointer. Keyboard: the nearest column.
  const collision = React.useCallback<CollisionDetection>((args) => (args.pointerCoordinates ? pointerWithin(args) : closestCenter(args)), [])

  const bookingOf = (id: UniqueIdentifier) => s.bookings.find((b) => b.id === String(id))
  const candidate = (e: Pick<DragMoveEvent, "active" | "over" | "delta">): DragState | null => {
    const b = bookingOf(e.active.id)
    if (!b) return null
    if (kb.current) {
      const kday = shiftDay(dayKey(b.startAt), kb.current.x)
      if (!days.includes(kday)) return null
      const kmin = minutesOfDay(b.startAt) + kb.current.y * 30
      return { id: b.id, day: kday, min: kmin, problem: checkMove(s, b, businessId, kday, kmin).problem }
    }
    if (!e.over) return null
    const day = String(e.over.id).replace(/^day:/, "")
    // The job's top edge against the day column gives the start time (both rects are scroll-adjusted by dnd-kit)
    const top = e.active.rect.current.translated?.top
    const min = top !== undefined ? START_H * 60 + Math.round((top - 1 - e.over.rect.top) / HALF) * 30 : minutesOfDay(b.startAt) + Math.round(e.delta.y / HALF) * 30
    return { id: b.id, day, min, problem: checkMove(s, b, businessId, day, min).problem }
  }
  const onMove = (e: DragMoveEvent) => {
    const c = candidate(e)
    setDrag((d) => (c && d && d.id === c.id && d.day === c.day && d.min === c.min ? d : c))
  }
  const onEnd = (e: DragEndEvent) => {
    setDrag(null)
    lastDrag.current = Date.now()
    const b = bookingOf(e.active.id)
    const c = candidate(e)
    if (!b || !c) return
    if (c.day === dayKey(b.startAt) && c.min === minutesOfDay(b.startAt)) return
    const first = b.customerName.split(" ")[0]
    const when = `${fmtDate(atMinutes(c.day, c.min))}, ${fmtTime(atMinutes(c.day, c.min))}`
    if (c.problem) {
      // Nothing changes in the store, so the job snaps back to where it was
      setWarning({ title: `Can't move to ${when}`, body: `${c.problem} The job stays at ${fmtDateTime(b.startAt)}.` })
      toast(`Not moved: ${c.problem.replace(/\.$/, "")}`)
      return
    }
    s.reschedule(b.id, atMinutes(c.day, c.min), "business")
    setWarning(null)
    toast(`Moved to ${when}. ${first} has been told.`)
  }

  const label = (id: UniqueIdentifier) => {
    const b = bookingOf(id)
    return b ? `${serviceById(s, b.serviceId)?.name ?? "Job"} for ${b.customerName}` : "Job"
  }
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${label(active.id)}. Up and down move it by 30 minutes, left and right by a day.`,
    onDragOver: ({ active, over }) => (over ? `${label(active.id)} is over ${fmtDate(atMinutes(String(over.id).replace(/^day:/, ""), 720))}.` : `${label(active.id)} is outside the diary.`),
    onDragEnd: ({ active, over }) => (over ? `Dropped ${label(active.id)}.` : `${label(active.id)} was dropped outside the diary and stays where it was.`),
    onDragCancel: ({ active }) => `Cancelled. ${label(active.id)} stays where it was.`,
  }

  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i)
  const weekLabel = `${fmtDayMonth(atMinutes(weekStart, 720))} to ${fmtDayMonth(atMinutes(shiftDay(weekStart, 6), 720))}`
  const thisWeek = mondayOf(today)

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <IconButton label="Previous week" onClick={() => onWeekChange(shiftDay(weekStart, -7))}>
            <ChevronLeft />
          </IconButton>
          <IconButton label="Next week" onClick={() => onWeekChange(shiftDay(weekStart, 7))}>
            <ChevronRight />
          </IconButton>
          <button type="button" onClick={() => onWeekChange(thisWeek)} disabled={weekStart === thisWeek} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 t-label text-navy hover:bg-sky disabled:opacity-50">
            This week
          </button>
        </div>
        <p className="t-subhead tnum" aria-live="polite">
          {weekLabel}
        </p>
        <ul className="ml-auto flex flex-wrap gap-x-3 gap-y-1" aria-label="Key">
          {(
            [
              ["Confirmed", JOB_TONE.confirmed],
              ["On the way / Arrived", JOB_TONE.on_the_way],
              ["Requested", JOB_TONE.requested],
              ["Completed", JOB_TONE.completed],
            ] as const
          ).map(([l, c]) => (
            <li key={l} className="flex items-center gap-1.5 t-caption text-muted-ink">
              <span className={cn("h-3 w-4 rounded-sm border-l-[3px]", c)} aria-hidden /> {l}
            </li>
          ))}
          <li className="flex items-center gap-1.5 t-caption text-muted-ink">
            <span className="hatched h-3 w-4 rounded-sm border border-line" aria-hidden /> Blocked
          </li>
        </ul>
      </div>
      <p className="mt-1 t-caption text-muted-ink">Drag a confirmed job to move it. We tell the customer the new time.</p>

      {warning && (
        <div role="alert" className="mt-3">
          <Banner tone="warning" title={warning.title} action={<button type="button" onClick={() => setWarning(null)} className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Dismiss</button>}>
            {warning.body}
          </Banner>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={collision}
        accessibility={{ announcements, screenReaderInstructions: { draggable: "To move a confirmed job, press Space, then use the arrow keys: up and down move it by 30 minutes, left and right by a day. Press Space to drop or Escape to cancel. Press Enter to open the job." } }}
        onDragStart={(e) => {
          kb.current = typeof KeyboardEvent !== "undefined" && e.activatorEvent instanceof KeyboardEvent ? { x: 0, y: 0 } : null
          const w = gridRef.current?.querySelector<HTMLElement>("[data-day-col]")?.getBoundingClientRect().width
          if (w) colWidth.current = w
          setWarning(null)
        }}
        onDragMove={onMove}
        onDragEnd={onEnd}
        onDragCancel={() => {
          setDrag(null)
          lastDrag.current = Date.now()
        }}
      >
        <div className="mt-3 overflow-x-auto rounded-2xl border border-line bg-white">
          <div ref={gridRef} className="min-w-[680px]">
            <div className="sticky top-0 z-30 grid grid-cols-[52px_repeat(7,minmax(0,1fr))] border-b border-line bg-white">
              <span />
              {days.map((d) => (
                <div key={d} className={cn("flex min-h-12 flex-col items-center justify-center py-1 border-l border-line", d === today && "text-blue")}>
                  <span className="t-caption">{fmtDow(atMinutes(d, 720))}</span>
                  <span className={cn("inline-flex size-7 items-center justify-center rounded-full text-[14px] font-semibold tnum", d === today && "bg-blue text-white")}>{parts(atMinutes(d, 720)).d}</span>
                </div>
              ))}
            </div>
            <div className="relative grid grid-cols-[52px_repeat(7,minmax(0,1fr))]" style={{ height: hours.length * H }}>
              <div className="relative">
                {hours.map((h, i) => (
                  <span key={h} className="absolute right-2 t-caption text-muted-ink tnum" style={{ top: i * H + 2 }}>
                    {fmtHM(h, 0)}
                  </span>
                ))}
              </div>
              {days.map((d) => (
                <DayColumn
                  key={d}
                  day={d}
                  isToday={d === today}
                  jobs={visibleJobs(s, listingId, staffUserId)
                    .filter((b) => dayKey(b.startAt) === d && b.status !== "declined")
                    .sort((a, b) => a.startAt.localeCompare(b.startAt))}
                  blocks={blocksOn(s.blocks, businessId, d)}
                  nowMin={d === today ? minutesOfDay(s.clock) : null}
                  canAdd={canAdd}
                  drag={drag}
                  selectedId={selectedId ?? null}
                  onOpen={onOpen}
                  onAdd={onAdd}
                  ignoreClick={ignoreClick}
                />
              ))}
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  )
}

const y = (min: number) => ((min - START_H * 60) / 60) * H

function DayColumn({
  day,
  isToday,
  jobs,
  blocks,
  nowMin,
  canAdd,
  drag,
  selectedId,
  onOpen,
  onAdd,
  ignoreClick,
}: {
  day: string
  isToday: boolean
  jobs: Booking[]
  blocks: ReturnType<typeof blocksOn>
  nowMin: number | null
  canAdd: boolean
  drag: DragState | null
  selectedId: string | null
  onOpen: (b: Booking) => void
  onAdd: (at: string) => void
  ignoreClick: () => boolean
}) {
  const s = useStore()
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` })
  const slots = Array.from({ length: (END_H - START_H) * 2 }, (_, i) => START_H * 60 + i * 30)
  const lanes = new Map<string, { lane: number; of: number }>()
  for (const b of jobs) {
    const overl = jobs.filter((x) => ms(x.startAt) < ms(b.endAt) && ms(b.startAt) < ms(x.endAt))
    lanes.set(b.id, { lane: overl.indexOf(b), of: overl.length })
  }
  const dragged = drag ? s.bookings.find((b) => b.id === drag.id) : undefined
  const ghost = drag && dragged && drag.day === day ? { top: y(drag.min), h: Math.max(HALF, ((ms(dragged.endAt) - ms(dragged.startAt)) / 3_600_000) * H) } : null
  return (
    <div ref={setNodeRef} data-day-col className={cn("relative border-l border-line", isToday && "bg-blue-tint/30", isOver && drag && "bg-blue-tint/50")}>
      {slots.map((m, i) => {
        const at = atMinutes(day, m)
        return canAdd ? (
          <button
            key={m}
            type="button"
            tabIndex={-1}
            onClick={() => onAdd(at)}
            aria-label={`Add to diary ${fmtDate(at)} at ${fmtTime(at)}`}
            className={cn("absolute inset-x-0 hover:bg-blue-tint/60", i % 2 === 0 ? "border-t border-line" : "border-t border-dashed border-line/60")}
            style={{ top: i * HALF, height: HALF }}
          />
        ) : (
          <span key={m} className={cn("absolute inset-x-0", i % 2 === 0 ? "border-t border-line" : "border-t border-dashed border-line/60")} style={{ top: i * HALF, height: HALF }} aria-hidden />
        )
      })}
      {blocks.map((b) => (
        <div key={b.id} className="hatched pointer-events-none absolute inset-x-0.5 z-[5] flex items-start gap-1 overflow-hidden rounded border border-line px-1.5 py-1" style={{ top: y(Math.max(b.start, START_H * 60)), height: Math.max(14, y(Math.min(b.end, END_H * 60)) - y(Math.max(b.start, START_H * 60))) }}>
          <Lock className="mt-0.5 size-3 shrink-0 text-slate" aria-hidden />
          <span className="truncate text-[11px] leading-4 text-slate">Blocked: {b.reason}</span>
        </div>
      ))}
      {ghost && (
        <div
          className={cn("pointer-events-none absolute inset-x-1 z-20 flex items-start rounded-lg border-2 border-dashed px-1.5 py-0.5", drag!.problem ? "border-red bg-red-tint/70" : "border-blue bg-blue-tint/70")}
          style={{ top: ghost.top, height: ghost.h }}
          aria-hidden
        >
          <span className={cn("text-[11px] font-semibold leading-4 tnum", drag!.problem ? "text-red" : "text-blue")}>
            {fmtTime(atMinutes(day, drag!.min))}
            {drag!.problem ? " · clash" : ""}
          </span>
        </div>
      )}
      {jobs.map((b) => {
        const l = lanes.get(b.id)!
        const top = y(Math.max(minutesOfDay(b.startAt), START_H * 60))
        const h = Math.max(HALF - 2, y(Math.min(minutesOfDay(b.endAt) || 24 * 60, END_H * 60)) - top - 2)
        return <JobCard key={b.id} b={b} top={top + 1} height={h} lane={l.lane} of={l.of} selected={selectedId === b.id} onOpen={(x) => !ignoreClick() && onOpen(x)} />
      })}
      {nowMin !== null && nowMin >= START_H * 60 && nowMin <= END_H * 60 && (
        <div className="pointer-events-none absolute inset-x-0 z-[25] flex items-center" style={{ top: y(nowMin) - 4 }} aria-hidden>
          <span className="-ml-1 size-2.5 rounded-full bg-red" />
          <span className="h-0.5 flex-1 bg-red" />
        </div>
      )}
    </div>
  )
}

function JobCard({ b, top, height, lane, of, selected, onOpen }: { b: Booking; top: number; height: number; lane: number; of: number; selected: boolean; onOpen: (b: Booking) => void }) {
  const s = useStore()
  const movable = canDrag(b)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: b.id, disabled: !movable })
  const svc = serviceById(s, b.serviceId)?.name ?? "Job"
  const tall = height >= 44
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-roledescription={movable ? "draggable job" : undefined}
      onClick={() => onOpen(b)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e)
        if (e.key === "Enter" && !isDragging && !e.defaultPrevented) onOpen(b)
        if (e.key === " " && !movable) {
          e.preventDefault()
          onOpen(b)
        }
      }}
      className={cn(
        "group absolute z-10 overflow-hidden rounded-lg border-l-[3px] px-1.5 py-1 text-left text-navy shadow-card outline-none hover:ring-2 hover:ring-blue focus-visible:ring-2 focus-visible:ring-blue",
        JOB_TONE[b.status],
        movable ? "cursor-grab touch-none" : "cursor-pointer",
        isDragging && "z-40 cursor-grabbing opacity-90 shadow-overlay ring-2 ring-blue",
        selected && "ring-2 ring-navy",
      )}
      style={{
        top,
        height,
        left: `calc(2px + (100% - 4px) * ${lane / of})`,
        width: `calc((100% - 4px) / ${of} - 2px)`,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      }}
    >
      <span className="flex items-center gap-0.5">
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold leading-4 tnum">
          {fmtTime(b.startAt)} {svc}
          <span className="sr-only">
            , {fmtDate(b.startAt)} to {fmtTime(b.endAt)}
            {tall ? "" : `, ${b.customerName}`}
          </span>
        </span>
        {movable && <GripVertical className="size-3 shrink-0 text-slate opacity-60 group-hover:opacity-100" aria-hidden />}
      </span>
      {tall && <span className="block truncate text-[11px] leading-4 text-slate">{b.customerName}</span>}
      <span className={cn("block truncate text-[10px] font-medium leading-3 text-slate", ["cancelled", "no_show"].includes(b.status) && "line-through")}>{STATUS_LABEL[b.status]}</span>
    </div>
  )
}
