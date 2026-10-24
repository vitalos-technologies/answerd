"use client"
import * as React from "react"
import { X } from "lucide-react"
import { BottomSheet } from "@/components/answerd/Sheet"
import { SlotPicker } from "@/components/answerd/SlotPicker"
import { Button } from "@/components/answerd/Button"
import { Field, SelectInput } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { servicesFor } from "@/lib/selectors"
import { fmtDate, fmtTime } from "@/lib/time"
import type { Listing } from "@/lib/types"

/**
 * Slot picker sheet. mode "multi" picks up to 3 times (Propose times on B-20);
 * mode "single" picks one (Suggest another time on B-22, Reschedule on B-24).
 */
export function ProposeTimesSheet({
  open,
  onClose,
  listing,
  title = "Propose times",
  mode = "multi",
  initialServiceId,
  ignoreBookingId,
  lockService,
  submitLabel,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  listing: Listing
  title?: string
  mode?: "multi" | "single"
  initialServiceId?: string
  ignoreBookingId?: string
  lockService?: boolean
  submitLabel?: (n: number) => string
  onSubmit: (slots: string[], serviceId?: string) => void
}) {
  const s = useStore()
  const services = servicesFor(s, listing.businessId).filter((x) => x.bookable)
  const [serviceId, setServiceId] = React.useState(initialServiceId ?? services[0]?.id)
  const [slots, setSlots] = React.useState<string[]>([])
  const service = services.find((x) => x.id === serviceId) ?? s.services.find((x) => x.id === serviceId)
  const pick = (slot: string) => {
    if (mode === "single") return setSlots([slot])
    setSlots((xs) => (xs.includes(slot) ? xs.filter((x) => x !== slot) : xs.length >= 3 ? [...xs.slice(1), slot] : [...xs, slot].sort()))
  }
  const close = () => {
    setSlots([])
    onClose()
  }
  const label = submitLabel ? submitLabel(slots.length) : slots.length > 1 ? `Send ${slots.length} times` : "Send time"
  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={title}
      footer={
        <Button
          block
          disabled={!slots.length}
          onClick={() => {
            onSubmit(slots, serviceId)
            close()
          }}
        >
          {label}
        </Button>
      }
    >
      {!lockService && services.length > 0 && (
        <Field label="Service" htmlFor="pt-svc" className="mb-4">
          <SelectInput id="pt-svc" value={serviceId} onChange={(e) => (setServiceId(e.target.value), setSlots([]))}>
            {services.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      <p className="mb-2 t-caption text-muted-ink">{mode === "multi" ? "Pick up to 3 free times. The customer taps one to book." : "Pick a free time."}</p>
      <SlotPicker listing={listing} service={service} value={slots.at(-1)} onChange={pick} ignoreBookingId={ignoreBookingId} />
      {mode === "multi" && slots.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Chosen times">
          {slots.map((x) => (
            <li key={x} className="inline-flex h-9 items-center gap-1 rounded-full bg-blue-tint pl-3 pr-1 t-caption text-blue">
              {fmtDate(x)}, {fmtTime(x)}
              <button type="button" aria-label={`Remove ${fmtDate(x)} ${fmtTime(x)}`} onClick={() => setSlots((xs) => xs.filter((y) => y !== x))} className="inline-flex size-7 items-center justify-center rounded-full hover:bg-white">
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
