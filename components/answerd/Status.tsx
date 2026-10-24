import { Ban, CalendarCheck, Check, CheckCircle2, CircleDashed, MapPin, Truck, UserX, XCircle } from "lucide-react"
import type { BookingStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const MAP: Record<BookingStatus, { label: string; icon: typeof Check; cls: string }> = {
  requested: { label: "Requested", icon: CircleDashed, cls: "bg-amber-tint text-amber-ink" },
  confirmed: { label: "Confirmed", icon: CalendarCheck, cls: "bg-teal-tint text-teal-ink" },
  on_the_way: { label: "On the way", icon: Truck, cls: "bg-blue-tint text-blue" },
  arrived: { label: "Arrived", icon: MapPin, cls: "bg-blue-tint text-blue" },
  completed: { label: "Completed", icon: CheckCircle2, cls: "bg-sky text-navy border border-line" },
  cancelled: { label: "Cancelled", icon: XCircle, cls: "bg-red-tint text-red" },
  declined: { label: "Declined", icon: Ban, cls: "bg-red-tint text-red" },
  no_show: { label: "No-show", icon: UserX, cls: "bg-red-tint text-red" },
}

export const STATUS_LABEL = Object.fromEntries(Object.entries(MAP).map(([k, v]) => [k, v.label])) as Record<BookingStatus, string>

/** Status never by colour alone: icon plus text. */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  const m = MAP[status]
  const I = m.icon
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full px-2.5 t-caption whitespace-nowrap", m.cls, className)}>
      <I className="size-3.5" aria-hidden />
      {m.label}
    </span>
  )
}

export function Stepper({ steps, current, className }: { steps: string[]; current: number; className?: string }) {
  return (
    <ol className={cn("flex items-start", className)} aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? "step" : undefined}>
            {i > 0 && <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-blue" : "bg-line")} aria-hidden />}
            <span
              className={cn(
                "relative z-10 inline-flex size-7 items-center justify-center rounded-full border-2 t-caption tnum",
                done && "border-blue bg-blue text-white",
                active && "border-blue bg-white text-blue",
                !done && !active && "border-line bg-white text-muted-ink",
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn("mt-1.5 px-1 t-caption leading-tight", active ? "text-navy" : "text-muted-ink")}>
              {s}
              {done && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange, className, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; className?: string; label?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex w-full rounded-full bg-[#E7ECF3] p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("h-9 flex-1 rounded-full px-3 t-label transition-colors duration-150", value === o.value ? "bg-white text-navy shadow-card" : "text-slate hover:text-navy")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function StatTile({ label, value, delta, deltaTone = "up", className, href }: { label: string; value: string | number; delta?: string; deltaTone?: "up" | "down"; className?: string; href?: string }) {
  const inner = (
    <>
      <p className="t-caption text-muted-ink">{label}</p>
      <p className="t-title tnum">{value}</p>
      {delta && <p className={cn("t-caption tnum", deltaTone === "up" ? "text-teal-ink" : "text-red")}>{delta}</p>}
    </>
  )
  if (href)
    return (
      <a href={href} className={cn("card block p-3.5 hover:border-blue", className)}>
        {inner}
      </a>
    )
  return <div className={cn("card p-3.5", className)}>{inner}</div>
}
