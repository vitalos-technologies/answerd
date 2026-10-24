"use client"
import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/answerd/Button"
import { Field, TextArea, TextInput, inputCls } from "@/components/answerd/Fields"
import { SegmentedControl } from "@/components/answerd/Status"
import { servicesFor } from "@/lib/selectors"
import { gbp, priceLabel } from "@/lib/format"
import { addDays, atMinutes, dayKey, fmtDate } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface Line {
  id: string
  label: string
  price: string
}

let n = 0
const newLine = (label = "", price = ""): Line => ({ id: `ql-${++n}`, label, price })
const toPence = (v: string) => Math.round((parseFloat(v.replace(/[£,\s]/g, "")) || 0) * 100)

/** Quote totals exactly as the store computes them. */
export function quoteTotals(linesPence: number[], vatIncluded: boolean) {
  const subtotal = linesPence.reduce((a, x) => a + x, 0)
  const vat = vatIncluded ? Math.round(subtotal - subtotal / 1.2) : Math.round(subtotal * 0.2)
  return { subtotal, vat, total: vatIncluded ? subtotal : subtotal + vat }
}

/**
 * B-26: line items, VAT, total, valid until and a message. Sending posts a QuoteCard into the
 * thread and schedules the desk's D-05 follow-ups at +2 and +7 days on the demo clock.
 */
export function QuoteForm({ threadId, onSent, onCancel, className }: { threadId: string; onSent: (quoteId: string) => void; onCancel?: () => void; className?: string }) {
  const s = useStore()
  const thread = s.threads.find((t) => t.id === threadId)
  const listing = s.listings.find((l) => l.id === thread?.listingId)
  const services = servicesFor(s, listing?.businessId).filter((x) => x.priceType !== "quote")
  const [lines, setLines] = React.useState<Line[]>(() => [newLine()])
  const [vatMode, setVatMode] = React.useState<"inc" | "plus">("inc")
  const [valid, setValid] = React.useState(() => dayKey(addDays(s.clock, 14)))
  const [message, setMessage] = React.useState("")
  const [tried, setTried] = React.useState(false)
  if (!thread || !listing) return null
  const first = thread.customerName.split(" ")[0]
  const pence = lines.map((l) => toPence(l.price))
  const t = quoteTotals(pence, vatMode === "inc")
  const filled = lines.filter((l, i) => l.label.trim() && pence[i]! > 0)
  const validIso = atMinutes(valid, 23 * 60 + 59)
  const validOk = !!valid && valid >= dayKey(s.clock)
  const ok = filled.length > 0 && filled.length === lines.filter((l) => l.label.trim() || l.price.trim()).length && validOk
  const set = (id: string, patch: Partial<Line>) => setLines((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const submit = () => {
    setTried(true)
    if (!ok) return
    const id = s.sendQuote(threadId, {
      lines: filled.map((l) => ({ id: l.id, label: l.label.trim(), pricePence: toPence(l.price) })),
      vatIncluded: vatMode === "inc",
      validUntil: validIso,
      message: message.trim() || `Here's your quote, ${first}.`,
    })
    toast(`Quote sent to ${first}: ${gbp(t.total)} inc VAT`)
    onSent(id)
  }

  return (
    <form
      className={cn("space-y-5", className)}
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {services.length > 0 && (
        <div>
          <p className="t-caption text-muted-ink">Add from your services</p>
          <div className="no-scrollbar mt-1.5 flex gap-2 overflow-x-auto pb-1">
            {services.slice(0, 6).map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => {
                  setVatMode(x.vatIncluded ? "inc" : "plus")
                  setLines((xs) => [...xs.filter((l) => l.label.trim() || l.price.trim()), newLine(x.name, String(x.pricePence / 100))])
                }}
                className="inline-flex h-11 shrink-0 items-center gap-1 rounded-full border border-line bg-white px-3.5 t-caption text-navy hover:border-blue"
              >
                <Plus className="size-3.5" aria-hidden /> {x.name} · {priceLabel(x)}
              </button>
            ))}
          </div>
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="t-subhead">Line items</legend>
        {lines.map((l, i) => {
          const bad = tried && (l.label.trim() || l.price.trim() || lines.length === 1) && !(l.label.trim() && pence[i]! > 0)
          return (
            <div key={l.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={`${l.id}-label`} className="sr-only">
                  Item {i + 1}
                </label>
                <TextInput id={`${l.id}-label`} value={l.label} onChange={(e) => set(l.id, { label: e.target.value })} placeholder="e.g. Boiler service" aria-invalid={bad || undefined} />
              </div>
              <div className="w-28 shrink-0">
                <label htmlFor={`${l.id}-price`} className="sr-only">
                  Price for item {i + 1}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 t-body text-muted-ink">£</span>
                  <input id={`${l.id}-price`} inputMode="decimal" value={l.price} onChange={(e) => set(l.id, { price: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="0" className={cn(inputCls, "pl-7 text-right tnum")} aria-invalid={bad || undefined} />
                </div>
              </div>
              <button type="button" aria-label={`Remove item ${i + 1}`} disabled={lines.length === 1} onClick={() => setLines((xs) => xs.filter((x) => x.id !== l.id))} className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-muted-ink hover:bg-sky hover:text-red disabled:opacity-30">
                <Trash2 className="size-5" />
              </button>
            </div>
          )
        })}
        {tried && !filled.length && (
          <p className="t-caption text-red" role="alert">
            Add at least one item with a price.
          </p>
        )}
        <Button type="button" variant="ghost" size="md" className="-ml-3" onClick={() => setLines((xs) => [...xs, newLine()])}>
          <Plus /> Add a line
        </Button>
      </fieldset>

      <div>
        <p className="mb-1.5 t-label text-navy">VAT</p>
        <SegmentedControl
          label="VAT"
          value={vatMode}
          onChange={setVatMode}
          options={[
            { value: "inc", label: "Prices include VAT" },
            { value: "plus", label: "Add 20% VAT" },
          ]}
        />
      </div>

      <dl className="card space-y-1 p-4">
        <div className="flex justify-between t-label font-normal text-slate">
          <dt>{vatMode === "inc" ? "Items (inc VAT)" : "Subtotal"}</dt>
          <dd className="tnum">{gbp(t.subtotal)}</dd>
        </div>
        <div className="flex justify-between t-caption text-muted-ink">
          <dt>VAT at 20%{vatMode === "inc" ? " (included)" : ""}</dt>
          <dd className="tnum">{gbp(t.vat)}</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-2">
          <dt className="t-label text-navy">Total inc VAT</dt>
          <dd className="t-heading tnum">{gbp(t.total)}</dd>
        </div>
      </dl>

      <Field label="Valid until" htmlFor="q-valid" error={tried && !validOk ? "Pick a date from today on." : undefined} hint={valid ? `Customers can accept until ${fmtDate(validIso)}.` : undefined}>
        <TextInput id="q-valid" type="date" value={valid} min={dayKey(s.clock)} onChange={(e) => setValid(e.target.value)} />
      </Field>
      <Field label="Message" htmlFor="q-msg" optional>
        <TextArea id="q-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Here's your quote, ${first}.`} />
      </Field>
      <p className="t-caption text-muted-ink">If {first} hasn&apos;t replied, your Answerd desk follows up after 2 days and 7 days.</p>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1">
          Send quote · {gbp(t.total)}
        </Button>
      </div>
    </form>
  )
}
