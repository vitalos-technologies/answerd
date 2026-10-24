"use client"
import * as React from "react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import type { Listing, Service } from "@/lib/types"
import { addDays, atMinutes, dayKey, fmtTime, hhmmToMin, parts } from "@/lib/time"
import { availabilityFor, slotsForDay, windowLabel } from "@/lib/selectors"

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/** Date strip, then time pills (or windows); unavailable slots muted and struck; selected slot blue. */
export function SlotPicker({ listing, service, value, onChange, days = 14, ignoreBookingId, className }: { listing: Listing; service?: Service; value?: string; onChange: (slot: string) => void; days?: number; ignoreBookingId?: string; className?: string }) {
  const s = useStore()
  const avail = availabilityFor(s, listing.businessId)
  const dayList = React.useMemo(() => Array.from({ length: days }, (_, i) => dayKey(addDays(s.clock, i))), [s.clock, days])
  const firstWithSlots = dayList.find((d) => slotsForDay(s, listing, service, d, { ignoreBookingId }).length) ?? dayList[0]!
  const [day, setDay] = React.useState(value ? dayKey(value) : firstWithSlots)

  const free = slotsForDay(s, listing, service, day, { ignoreBookingId })
  const hours = avail?.weeklyHours.find((h) => h.day === parts(atMinutes(day, 720)).dow)
  const step = avail?.slotMode === "windows" ? 240 : avail?.slotLengthMin ?? 60
  const all: string[] = []
  if (hours && !hours.closed) for (let t = hhmmToMin(hours.open); t + Math.min(step, service?.durationMin ?? 60) <= hhmmToMin(hours.close); t += step) all.push(atMinutes(day, t))
  const windows = avail?.slotMode === "windows"

  return (
    <div className={className}>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="listbox" aria-label="Choose a date">
        {dayList.map((d) => {
          const p = parts(atMinutes(d, 720))
          const has = slotsForDay(s, listing, service, d, { ignoreBookingId }).length > 0
          const active = d === day
          return (
            <button
              key={d}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => setDay(d)}
              className={cn(
                "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border t-caption transition-colors",
                active ? "border-blue bg-blue text-white" : has ? "border-line bg-white text-navy hover:border-blue" : "border-line bg-sky text-muted-ink",
              )}
            >
              <span>{DOW[p.dow]}</span>
              <span className="text-[17px] font-semibold tnum">{p.d}</span>
              {!has && <span className="sr-only">No free times</span>}
            </button>
          )
        })}
      </div>
      <div className={cn("mt-4 grid gap-2", windows ? "grid-cols-1" : "grid-cols-3")}>
        {all.length === 0 && <p className="col-span-3 t-label font-normal text-muted-ink">Closed this day.</p>}
        {all.map((slot) => {
          const ok = free.includes(slot)
          const sel = value === slot
          return (
            <button
              key={slot}
              type="button"
              disabled={!ok}
              onClick={() => onChange(slot)}
              aria-pressed={sel}
              aria-label={`${windows ? windowLabel(slot) : fmtTime(slot)}${ok ? "" : ", unavailable"}`}
              className={cn(
                "h-11 rounded-full border t-label tnum transition-colors",
                sel ? "border-blue bg-blue text-white" : ok ? "border-line bg-white text-navy hover:border-blue" : "border-line bg-sky text-muted-ink line-through",
              )}
            >
              {windows ? windowLabel(slot) : fmtTime(slot)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
