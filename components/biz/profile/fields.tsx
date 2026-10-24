"use client"
// Shared building blocks for the business profile editors (B-10 to B-17) and the claim forms.
// Nothing here depends on PhoneFrame or AppScreen, so the web dashboard (W-16) can reuse it.
import * as React from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { inputCls, SelectInput } from "@/components/answerd/Fields"
import { Skeleton } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** SelectInput with a white fill (the kit's chevron background otherwise leaves it transparent on sky screens). */
export function Select({ className, ...props }: React.ComponentProps<typeof SelectInput>) {
  // className sizes the wrapper; the chevron is drawn here because the kit's background chevron doesn't render
  return (
    <span className={cn("relative block w-full", className)}>
      <SelectInput className="[background-color:#fff]" {...props} />
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-navy" aria-hidden />
    </span>
  )
}

/** A compact 44-high input for dense grids (photo captions). */
export const inputClsSm = cn(inputCls, "h-11 px-3 t-label font-normal")

/** The business, its listing and whether the persisted store has loaded. */
export function useBizRecord(businessId: string | null | undefined) {
  const hydrated = useStore((s) => s.hydrated)
  const biz = useStore((s) => s.businesses.find((b) => b.id === businessId))
  const listing = useStore((s) => s.listings.find((l) => l.id === biz?.listingId))
  return { hydrated, biz, listing }
}

export function FormSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-12 w-full rounded-[12px]" />
        </div>
      ))}
    </div>
  )
}

/** Sticky save row at the bottom of an editor. Inside a disabled fieldset it disables itself. */
export function SaveBar({ label = "Save", children, className, disabled }: { label?: string; children?: React.ReactNode; className?: string; disabled?: boolean }) {
  return (
    <div className={cn("sticky bottom-0 z-10 -mx-4 mt-6 border-t border-line bg-white/95 px-4 py-3 backdrop-blur", className)}>
      {children}
      <Button block type="submit" disabled={disabled}>
        {label}
      </Button>
    </div>
  )
}

/** UK phone (mobile or landline): returns a tidy display format or null. */
export function normaliseUkPhone(input: string) {
  let d = input.replace(/[^\d+]/g, "")
  if (d.startsWith("+44")) d = "0" + d.slice(3)
  if (!/^0\d{10}$/.test(d)) return null
  if (d.startsWith("07")) return `${d.slice(0, 5)} ${d.slice(5)}`
  if (d.startsWith("02")) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i
export function isUkPostcode(input: string) {
  return POSTCODE_RE.test(input.trim())
}

export const isEmail = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim())
export const isWebsite = (v: string) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(v.trim())

/** Pounds text ("85" / "85.50") to pence, or null. */
export function poundsToPence(v: string) {
  const t = v.replace(/[£,\s]/g, "")
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null
  return Math.round(parseFloat(t) * 100)
}
export function penceToPounds(p: number) {
  return p % 100 === 0 ? String(p / 100) : (p / 100).toFixed(2)
}

/** Searchable category picker (leaf categories), up to `max`. */
export function CategoryPicker({ value, onChange, max = 3, id, invalid }: { value: string[]; onChange: (ids: string[]) => void; max?: number; id?: string; invalid?: boolean }) {
  const categories = useStore((s) => s.categories)
  const leaves = categories.filter((c) => c.parentId)
  const [q, setQ] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const listId = React.useId()
  const full = value.length >= max
  const matches = q.trim()
    ? leaves.filter((c) => !value.includes(c.id) && (c.name.toLowerCase().includes(q.trim().toLowerCase()) || c.plural.toLowerCase().includes(q.trim().toLowerCase()))).slice(0, 6)
    : leaves.filter((c) => !value.includes(c.id)).slice(0, 6)
  const add = (cid: string) => {
    if (full) return
    onChange([...value, cid])
    setQ("")
    setOpen(max > 1 && value.length + 1 < max)
  }
  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Chosen categories">
          {value.map((cid, i) => {
            const c = categories.find((x) => x.id === cid)
            return (
              <li key={cid}>
                <span className="inline-flex h-9 items-center gap-1 rounded-full border border-blue bg-blue-tint pl-3.5 pr-1 t-label text-blue">
                  {c?.name ?? cid}
                  {i === 0 && max > 1 && <span className="t-caption text-blue/80">· main</span>}
                  <button type="button" onClick={() => onChange(value.filter((x) => x !== cid))} aria-label={`Remove ${c?.name ?? cid}`} className="inline-flex size-8 items-center justify-center rounded-full hover:bg-white/60">
                    <X className="size-4" aria-hidden />
                  </button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {!full && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-ink" aria-hidden />
          <input
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-invalid={invalid || undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (matches[0]) add(matches[0].id)
              }
              if (e.key === "Escape") setOpen(false)
            }}
            placeholder={value.length ? "Add another category" : "Search, e.g. plumber"}
            className={cn(inputCls, "pl-10")}
          />
          {open && matches.length > 0 && (
            <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-white py-1 shadow-overlay">
              {matches.map((c) => (
                <li key={c.id} role="option" aria-selected={false}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => add(c.id)} className="flex min-h-11 w-full items-center justify-between px-3.5 text-left t-body text-navy hover:bg-sky focus-visible:bg-sky">
                    {c.name}
                    <span className="t-caption text-muted-ink">{categories.find((g) => g.id === c.parentId)?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {full && max > 1 && (
        <p className="inline-flex items-center gap-1 t-caption text-muted-ink">
          <Check className="size-3.5" aria-hidden /> {max} categories chosen. Remove one to change it.
        </p>
      )}
    </div>
  )
}

/** A time select in 30-minute steps, "08:00" values shown as "8am". */
export function TimeSelect({ value, onChange, id, label, invalid, disabled }: { value: string; onChange: (v: string) => void; id?: string; label: string; invalid?: boolean; disabled?: boolean }) {
  const opts = React.useMemo(() => {
    const out: string[] = []
    for (let m = 5 * 60; m <= 23 * 60 + 30; m += 30) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
    return out
  }, [])
  const show = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number) as [number, number]
    const suffix = h >= 12 ? "pm" : "am"
    const hh = h % 12 === 0 ? 12 : h % 12
    return m ? `${hh}:${String(m).padStart(2, "0")}${suffix}` : `${hh}${suffix}`
  }
  return (
    <select id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} aria-invalid={invalid || undefined} className={cn(inputCls, "h-11 w-[92px] px-2 t-label font-normal tnum")}>
      {!opts.includes(value) && <option value={value}>{show(value)}</option>}
      {opts.map((o) => (
        <option key={o} value={o}>
          {show(o)}
        </option>
      ))}
    </select>
  )
}

/** Small radio card used for booking mode and policy choices. */
export function ChoiceCard({ checked, onSelect, title, body, name, value, disabled }: { checked: boolean; onSelect: () => void; title: string; body?: string; name: string; value: string; disabled?: boolean }) {
  return (
    <label className={cn("flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors", checked ? "border-blue bg-blue-tint" : "border-line bg-white hover:border-blue/50", disabled && "cursor-not-allowed opacity-60")}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} disabled={disabled} className="mt-0.5 size-5 shrink-0 accent-blue" />
      <span>
        <span className="block t-label text-navy">{title}</span>
        {body && <span className="block t-caption text-slate">{body}</span>}
      </span>
    </label>
  )
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="t-caption text-red" role="alert">
      {children}
    </p>
  )
}
