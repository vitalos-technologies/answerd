"use client"
import * as React from "react"
import { CalendarOff, Minus, Plus, Trash2 } from "lucide-react"
import { Button, IconButton } from "@/components/answerd/Button"
import { Field, TextInput } from "@/components/answerd/Fields"
import { SegmentedControl } from "@/components/answerd/Status"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/lib/store"
import { uid } from "@/lib/prng"
import { atMinutes, dayKey, fmtDate, hhmmToMin } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Availability, DayHours, Holiday } from "@/lib/types"
import { FormError, FormSkeleton, SaveBar, Select, TimeSelect } from "./fields"
import type { EditorProps } from "./DetailsForm"

const ORDER = [1, 2, 3, 4, 5, 6, 0] // Monday first
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const LEAD = [
  { v: 0, l: "No notice" },
  { v: 30, l: "30 minutes" },
  { v: 60, l: "1 hour" },
  { v: 120, l: "2 hours" },
  { v: 240, l: "4 hours" },
  { v: 1440, l: "1 day" },
  { v: 2880, l: "2 days" },
]
const BUFFER = [0, 15, 30, 45, 60]
const SLOT = [30, 60, 90, 120]

export const DEFAULT_WEEK: DayHours[] = Array.from({ length: 7 }, (_, day) => ({ day, closed: day === 0, open: day === 6 ? "09:00" : "08:00", close: day === 6 ? "14:00" : "18:00" }))

/** Errors for weekly hours (closing at or before opening) and holidays (end before start, overlapping). */
export function validateHours(week: DayHours[], holidays: Holiday[]) {
  const dayErrors: Record<number, string> = {}
  for (const h of week) if (!h.closed && hhmmToMin(h.close) <= hhmmToMin(h.open)) dayErrors[h.day] = "Closing time must be after opening time"
  const holErrors: Record<string, string> = {}
  const sorted = [...holidays].sort((a, b) => a.from.localeCompare(b.from))
  for (const h of sorted) if (h.to < h.from) holErrors[h.id] = "Ends before it starts"
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const cur = sorted[i]!
    if (cur.from <= prev.to) holErrors[cur.id] = `Overlaps with ${prev.label || "another holiday"}`
  }
  return { dayErrors, holErrors }
}

/** B-13: weekly opening hours, booking windows or fixed slots, lead time, buffer, max jobs per day, holidays. */
export function HoursForm(props: EditorProps) {
  const hydrated = useStore((s) => s.hydrated)
  const avail = useStore((s) => s.availability.find((a) => a.businessId === props.businessId))
  if (!hydrated || !avail) return <FormSkeleton rows={7} />
  return <HoursInner key={props.businessId} avail={avail} {...props} />
}

function HoursInner({ businessId, avail, onSaved, className }: EditorProps & { avail: Availability }) {
  const setAvailability = useStore((s) => s.setAvailability)
  const clock = useStore((s) => s.clock)
  const [week, setWeek] = React.useState<DayHours[]>(() => ORDER.map((d) => avail.weeklyHours.find((h) => h.day === d) ?? DEFAULT_WEEK[d]!))
  const [slotMode, setSlotMode] = React.useState(avail.slotMode)
  const [slotLength, setSlotLength] = React.useState(avail.slotLengthMin)
  const [lead, setLead] = React.useState(avail.leadTimeMin)
  const [buffer, setBuffer] = React.useState(avail.bufferMin)
  const [maxPerDay, setMaxPerDay] = React.useState(avail.maxPerDay)
  const [holidays, setHolidays] = React.useState<Holiday[]>(avail.holidays)
  const [hFrom, setHFrom] = React.useState("")
  const [hTo, setHTo] = React.useState("")
  const [hLabel, setHLabel] = React.useState("")
  const [hError, setHError] = React.useState("")
  const today = dayKey(clock)
  const { dayErrors, holErrors } = validateHours(week, holidays)
  const hasErrors = Object.keys(dayErrors).length + Object.keys(holErrors).length > 0
  const patchDay = (day: number, p: Partial<DayHours>) => setWeek((w) => w.map((h) => (h.day === day ? { ...h, ...p } : h)))

  const addHoliday = () => {
    if (!hFrom || !hTo) return setHError("Choose a start and end date")
    if (hTo < hFrom) return setHError("The end date is before the start date")
    if (hTo < today) return setHError("That holiday is already over")
    const next: Holiday = { id: uid("hol"), from: hFrom, to: hTo, label: hLabel.trim() || "Holiday" }
    const clash = holidays.find((h) => next.from <= h.to && h.from <= next.to)
    if (clash) return setHError(`Overlaps with ${clash.label} (${fmtDate(atMinutes(clash.from, 720))} to ${fmtDate(atMinutes(clash.to, 720))})`)
    setHolidays((hs) => [...hs, next].sort((a, b) => a.from.localeCompare(b.from)))
    setHFrom("")
    setHTo("")
    setHLabel("")
    setHError("")
  }

  return (
    <form
      className={className ?? "space-y-6 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (hasErrors) {
          toast("Fix the overlapping or invalid hours first")
          return
        }
        setAvailability(businessId, { weeklyHours: [...week].sort((a, b) => a.day - b.day), slotMode, slotLengthMin: slotLength, leadTimeMin: lead, bufferMin: buffer, maxPerDay, holidays })
        toast("Hours and availability saved")
        onSaved?.()
      }}
    >
      <section aria-labelledby="hrs-week">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="hrs-week" className="t-heading">
            Opening hours
          </h2>
          <Button
            size="sm"
            variant="ghost"
            className="h-11"
            onClick={() => {
              const mon = week.find((h) => h.day === 1)!
              setWeek((w) => w.map((h) => (h.day >= 2 && h.day <= 5 ? { ...h, closed: mon.closed, open: mon.open, close: mon.close } : h)))
              toast("Monday's hours copied to Tue to Fri")
            }}
          >
            Copy Mon to weekdays
          </Button>
        </div>
        <ul className="card divide-y divide-line overflow-hidden">
          {week.map((h) => {
            const err = dayErrors[h.day]
            return (
              <li key={h.day} className={cn("px-3 py-2.5", err && "bg-red-tint/50")}>
                <div className="flex min-h-11 items-center gap-2">
                  <label className="flex min-h-11 w-[84px] shrink-0 cursor-pointer items-center gap-2">
                    <Switch checked={!h.closed} onCheckedChange={(v) => patchDay(h.day, { closed: !v })} aria-label={`Open on ${DAY[h.day]}`} className="data-[state=checked]:bg-blue" />
                    <span className="t-label text-navy">{DAY[h.day]!.slice(0, 3)}</span>
                  </label>
                  {h.closed ? (
                    <span className="t-label font-normal text-muted-ink">Closed</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <TimeSelect label={`${DAY[h.day]} opens`} value={h.open} onChange={(v) => patchDay(h.day, { open: v })} invalid={!!err} />
                      <span className="t-caption text-muted-ink">to</span>
                      <TimeSelect label={`${DAY[h.day]} closes`} value={h.close} onChange={(v) => patchDay(h.day, { close: v })} invalid={!!err} />
                    </div>
                  )}
                </div>
                {err && <FormError>{err}</FormError>}
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-labelledby="hrs-book" className="space-y-4">
        <h2 id="hrs-book" className="t-heading">
          How customers book
        </h2>
        <SegmentedControl
          label="Booking times"
          value={slotMode}
          onChange={setSlotMode}
          options={[
            { value: "slots", label: "Fixed slots" },
            { value: "windows", label: "Booking windows" },
          ]}
        />
        <p className="-mt-2 t-caption text-muted-ink">{slotMode === "slots" ? "Customers pick an exact start time, like 9am or 9:30am." : "Customers pick a morning, afternoon or evening window."}</p>
        {slotMode === "slots" && (
          <Field label="Slot length" htmlFor="hrs-slot">
            <Select id="hrs-slot" value={slotLength} onChange={(e) => setSlotLength(Number(e.target.value))}>
              {SLOT.map((m) => (
                <option key={m} value={m}>
                  Every {m < 60 ? `${m} minutes` : m === 60 ? "hour" : `${m / 60} hours`}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Lead time" htmlFor="hrs-lead" hint="The least notice you need before a booking">
          <Select id="hrs-lead" value={lead} onChange={(e) => setLead(Number(e.target.value))}>
            {LEAD.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Buffer between jobs" htmlFor="hrs-buf" hint="Travel and tidy-up time">
          <Select id="hrs-buf" value={buffer} onChange={(e) => setBuffer(Number(e.target.value))}>
            {BUFFER.map((m) => (
              <option key={m} value={m}>
                {m ? `${m} minutes` : "No buffer"}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="t-label text-navy" id="hrs-max">
              Max jobs per day
            </p>
            <p className="t-caption text-muted-ink">We stop offering times once you hit it</p>
          </div>
          <div className="flex items-center gap-1" role="group" aria-labelledby="hrs-max">
            <IconButton label="Fewer jobs per day" tone="tint" onClick={() => setMaxPerDay((n) => Math.max(1, n - 1))} disabled={maxPerDay <= 1}>
              <Minus />
            </IconButton>
            <output className="w-8 text-center t-subhead tnum" aria-live="polite">
              {maxPerDay}
            </output>
            <IconButton label="More jobs per day" tone="tint" onClick={() => setMaxPerDay((n) => Math.min(30, n + 1))} disabled={maxPerDay >= 30}>
              <Plus />
            </IconButton>
          </div>
        </div>
      </section>

      <section aria-labelledby="hrs-hol" className="space-y-3">
        <h2 id="hrs-hol" className="t-heading">
          Holidays
        </h2>
        <p className="-mt-1 t-caption text-muted-ink">Booking turns off and your listing says when you&apos;re back. Messages still reach you.</p>
        {holidays.length > 0 ? (
          <ul className="card divide-y divide-line overflow-hidden">
            {holidays.map((h) => (
              <li key={h.id} className={cn("flex items-center gap-3 px-4 py-2.5", holErrors[h.id] && "bg-red-tint/50")}>
                <CalendarOff className="size-5 shrink-0 text-muted-ink" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy">{h.label}</span>
                  <span className="block t-caption text-muted-ink tnum">
                    {fmtDate(atMinutes(h.from, 720))} to {fmtDate(atMinutes(h.to, 720))}
                  </span>
                  {holErrors[h.id] && <FormError>{holErrors[h.id]}</FormError>}
                </span>
                <IconButton label={`Remove ${h.label}`} onClick={() => setHolidays((hs) => hs.filter((x) => x.id !== h.id))}>
                  <Trash2 />
                </IconButton>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white p-3 t-label font-normal text-slate">No holidays booked.</p>
        )}
        <div className="card space-y-3 p-4">
          <p className="t-subhead">Add a holiday</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" htmlFor="hol-from">
              <TextInput id="hol-from" type="date" min={today} value={hFrom} onChange={(e) => setHFrom(e.target.value)} className="px-2.5 tnum" />
            </Field>
            <Field label="To" htmlFor="hol-to">
              <TextInput id="hol-to" type="date" min={hFrom || today} value={hTo} onChange={(e) => setHTo(e.target.value)} className="px-2.5 tnum" />
            </Field>
          </div>
          <Field label="Name" htmlFor="hol-label" optional>
            <TextInput id="hol-label" value={hLabel} onChange={(e) => setHLabel(e.target.value)} placeholder="e.g. Christmas break" />
          </Field>
          {hError && <FormError>{hError}</FormError>}
          <Button variant="secondary" block onClick={addHoliday}>
            <Plus /> Add holiday
          </Button>
        </div>
      </section>
      <SaveBar />
    </form>
  )
}
