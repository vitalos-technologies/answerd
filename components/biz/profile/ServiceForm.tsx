"use client"
import * as React from "react"
import { Camera, Trash2, X } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Field, TextArea, TextInput, ToggleRow } from "@/components/answerd/Fields"
import { PhotoTile } from "@/components/answerd/Media"
import { SegmentedControl } from "@/components/answerd/Status"
import { BottomSheet } from "@/components/answerd/Sheet"
import { useStore } from "@/lib/store"
import { uid } from "@/lib/prng"
import { durationLabel, priceWithVat } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { PriceType, Service } from "@/lib/types"
import { FormSkeleton, Select, SaveBar, penceToPounds, poundsToPence, useBizRecord } from "./fields"

const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 360, 480]
const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: "fixed", label: "Fixed £" },
  { value: "from", label: "From £" },
  { value: "hourly", label: "Hourly £" },
  { value: "quote", label: "Quote only" },
]
const PHOTO_ICONS = ["Wrench", "Sparkles", "Hammer", "Flame", "Truck", "Scissors"]

/**
 * B-12: name, description, duration, price type (Fixed, From, Hourly, Quote only), VAT included,
 * bookable online, photo and Delete. `serviceId` "new" (or null) creates a service.
 */
export function ServiceForm({ businessId, serviceId, onSaved, onDeleted, className }: { businessId: string; serviceId: string | null; onSaved?: (serviceId: string) => void; onDeleted?: () => void; className?: string }) {
  const { hydrated, biz } = useBizRecord(businessId)
  const svc = useStore((s) => s.services.find((x) => x.id === serviceId && x.businessId === businessId))
  if (!hydrated || !biz) return <FormSkeleton rows={6} />
  const isNew = !serviceId || serviceId === "new"
  if (!isNew && !svc)
    return (
      <div className="p-4">
        <Banner tone="error" title="Service not found">
          It may have been deleted. Go back to your services list.
        </Banner>
      </div>
    )
  return <ServiceInner key={svc?.id ?? "new"} businessId={businessId} svc={isNew ? undefined : svc} onSaved={onSaved} onDeleted={onDeleted} className={className} />
}

function ServiceInner({ businessId, svc, onSaved, onDeleted, className }: { businessId: string; svc?: Service; onSaved?: (id: string) => void; onDeleted?: () => void; className?: string }) {
  const s = useStore()
  const [name, setName] = React.useState(svc?.name ?? "")
  const [description, setDescription] = React.useState(svc?.description ?? "")
  const [duration, setDuration] = React.useState(svc?.durationMin ?? 60)
  const [priceType, setPriceType] = React.useState<PriceType>(svc?.priceType ?? "fixed")
  const [price, setPrice] = React.useState(svc && svc.priceType !== "quote" ? penceToPounds(svc.pricePence) : "")
  const [vat, setVat] = React.useState(svc?.vatIncluded ?? true)
  const [bookable, setBookable] = React.useState(svc?.bookable ?? true)
  const [photo, setPhoto] = React.useState(svc?.photo)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = React.useState(false)
  const [picker, setPicker] = React.useState(false)
  const closeDelete = React.useCallback(() => setConfirmDelete(false), [])
  const closePicker = React.useCallback(() => setPicker(false), [])
  const pence = poundsToPence(price)
  const preview = priceType === "quote" ? "Quote on request" : pence !== null ? priceWithVat({ priceType, pricePence: pence, vatIncluded: vat }) : null

  return (
    <form
      className={className ?? "space-y-5 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const errs: Record<string, string> = {}
        if (name.trim().length < 2) errs.name = "Give the service a name"
        if (description.length > 300) errs.description = "Keep it to 300 characters"
        if (priceType !== "quote" && (pence === null || pence <= 0)) errs.price = "Enter a price in pounds, like 85 or 85.50"
        if (priceType === "quote" && bookable) errs.bookable = "Quote-only services can't be booked online. Turn off Bookable online or set a price."
        setErrors(errs)
        if (Object.keys(errs).length) return
        const id = s.upsertService(businessId, {
          id: svc?.id,
          name: name.trim(),
          description: description.trim(),
          durationMin: duration,
          priceType,
          pricePence: priceType === "quote" ? 0 : pence!,
          // Keep an upper "to" price for From only while it still makes sense
          priceToPence: priceType === "from" && svc?.priceToPence && svc.priceToPence > pence! ? svc.priceToPence : undefined,
          vatIncluded: vat,
          bookable,
          photo,
        })
        toast(svc ? "Service saved" : `${name.trim()} added`)
        onSaved?.(id)
      }}
    >
      <Field label="Service name" htmlFor="sv-name" error={errors.name}>
        <TextInput id="sv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Boiler service" aria-invalid={!!errors.name} />
      </Field>
      <Field label="Description" htmlFor="sv-desc" optional error={errors.description} hint={`${description.length} of 300 characters`}>
        <TextArea id="sv-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included" aria-invalid={!!errors.description} />
      </Field>
      <Field label="Duration" htmlFor="sv-dur" hint="How long to block in your diary">
        <Select id="sv-dur" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {DURATIONS.map((d) => (
            <option key={d} value={d}>
              {durationLabel(d)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="space-y-3">
        <p className="t-label text-navy" id="sv-pt">
          Price type
        </p>
        <SegmentedControl label="Price type" value={priceType} onChange={(v) => {
            setPriceType(v)
            if (v === "quote") setBookable(false)
          }} options={PRICE_TYPES} className="[&>button]:px-1.5 [&>button]:text-[13px]" />
        {priceType !== "quote" ? (
          <Field label={priceType === "hourly" ? "Price per hour" : priceType === "from" ? "Starting price" : "Price"} htmlFor="sv-price" error={errors.price} hint={preview ? `Customers see: ${preview}` : undefined}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 t-body text-navy">£</span>
              <TextInput id="sv-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="85" className="pl-8 tnum" aria-invalid={!!errors.price} />
            </div>
          </Field>
        ) : (
          <p className="rounded-xl bg-sky p-3 t-label font-normal text-slate">Customers see &quot;Quote on request&quot; and can message you for a price.</p>
        )}
      </div>
      <div className="card divide-y divide-line px-4">
        {priceType !== "quote" && <ToggleRow label="VAT included" description={vat ? "Prices shown include VAT" : "Prices shown are plus VAT"} checked={vat} onChange={setVat} />}
        <ToggleRow label="Bookable online" description={bookable ? "Customers can pick a time and book" : "Customers message or call to arrange"} checked={bookable} onChange={setBookable} />
      </div>
      {errors.bookable && (
        <p className="t-caption text-red" role="alert">
          {errors.bookable}
        </p>
      )}
      <div>
        <p className="mb-1.5 t-label text-navy">
          Photo <span className="font-normal text-muted-ink">(optional)</span>
        </p>
        {photo ? (
          <div className="flex items-center gap-3">
            <PhotoTile hue={photo.hue} icon={photo.icon} className="size-20" label={photo.caption || "Service photo"} />
            <Button size="sm" variant="secondary" onClick={() => setPicker(true)}>
              Change
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPhoto(undefined)}>
              <X /> Remove
            </Button>
          </div>
        ) : (
          <button type="button" onClick={() => setPicker(true)} className="flex min-h-20 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white t-label text-navy hover:border-blue">
            <Camera className="size-5 text-blue" aria-hidden /> Add a photo
          </button>
        )}
      </div>
      {svc && (
        <Button variant="ghost" block className="text-red hover:bg-red-tint" onClick={() => setConfirmDelete(true)}>
          <Trash2 /> Delete service
        </Button>
      )}
      <SaveBar label={svc ? "Save" : "Add service"} />

      <BottomSheet open={picker} onClose={closePicker} title="Add a photo">
        <p className="t-body text-slate">Choose from your camera roll (prototype: pick a placeholder).</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {PHOTO_ICONS.map((icon, i) => (
            <button
              key={icon}
              type="button"
              aria-label={`Use photo ${i + 1}`}
              onClick={() => {
                setPhoto({ id: uid("svp"), caption: name.trim() || "Service photo", hue: (i * 53 + 20) % 360, icon })
                setPicker(false)
              }}
              className="rounded-xl focus-visible:outline-2 focus-visible:outline-blue"
            >
              <PhotoTile hue={(i * 53 + 20) % 360} icon={icon} className="aspect-square w-full" />
            </button>
          ))}
        </div>
      </BottomSheet>
      <BottomSheet open={confirmDelete} onClose={closeDelete} title="Delete this service?">
        <p className="t-body text-slate">{svc?.name} will disappear from your listing and the AI desk won&apos;t offer it. Existing bookings stay in your diary.</p>
        <div className="mt-5 space-y-2">
          <Button
            block
            variant="destructive"
            onClick={() => {
              if (!svc) return
              s.deleteService(svc.id)
              toast(`${svc.name} deleted`)
              setConfirmDelete(false)
              onDeleted?.()
            }}
          >
            Delete service
          </Button>
          <Button block variant="secondary" onClick={closeDelete}>
            Keep it
          </Button>
        </div>
      </BottomSheet>
    </form>
  )
}
