"use client"
import * as React from "react"
import { Check } from "lucide-react"
import { Chip, Field, TextInput } from "@/components/answerd/Fields"
import { MockMap } from "@/components/answerd/MockMap"
import { SegmentedControl } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { DISTRICTS, districtOf, lookupPostcode, milesBetween, normalisePostcode } from "@/lib/geo"
import { toast } from "@/lib/toast"
import type { Listing, ServiceArea } from "@/lib/types"
import { FormError, FormSkeleton, SaveBar, useBizRecord } from "./fields"
import type { EditorProps } from "./DetailsForm"

/** Resolve a base postcode or district to a point on the mock map. */
export function basePoint(postcode: string) {
  const pc = lookupPostcode(postcode)
  if (pc) return { lat: pc.lat, lng: pc.lng, district: pc.district }
  const d = DISTRICTS[districtOf(postcode)]
  return d ? { lat: d.lat, lng: d.lng, district: districtOf(postcode) } : null
}

/** B-14: radius from a base postcode (slider) or postcode districts picked on the map; travel charge note. */
export function AreaForm(props: EditorProps) {
  const { hydrated, biz, listing } = useBizRecord(props.businessId)
  const area = useStore((s) => s.serviceAreas.find((a) => a.businessId === props.businessId))
  if (!hydrated || !biz || !listing) return <FormSkeleton rows={4} />
  return <AreaInner key={biz.id} area={area} listing={listing} {...props} />
}

function AreaInner({ businessId, area, listing, onSaved, className }: EditorProps & { area?: ServiceArea; listing: Listing }) {
  const setServiceArea = useStore((s) => s.setServiceArea)
  const [mode, setMode] = React.useState<ServiceArea["mode"]>(area?.mode ?? "radius")
  const [base, setBase] = React.useState(area?.basePostcode || listing.postcode)
  const [radius, setRadius] = React.useState(area?.radiusMiles ?? 5)
  const [districts, setDistricts] = React.useState<string[]>(area?.districts.length ? area.districts : [listing.postcodeDistrict])
  const [note, setNote] = React.useState(area?.travelNote ?? "")
  const [error, setError] = React.useState("")
  const point = basePoint(base)
  const centre = point ?? listing.geo
  const nearby = Object.entries(DISTRICTS)
    .map(([code, d]) => ({ code, ...d, miles: milesBetween(centre, d) }))
    .filter((d) => d.miles <= 12)
    .sort((a, b) => a.miles - b.miles)
  const toggle = (code: string) => setDistricts((ds) => (ds.includes(code) ? ds.filter((x) => x !== code) : [...ds, code]))

  return (
    <form
      className={className ?? "space-y-5 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (!point) return setError("We don't recognise that postcode. Try one like SE25 4AA or a district like SE25.")
        if (mode === "districts" && !districts.length) return setError("Pick at least one postcode district")
        setError("")
        setServiceArea(businessId, { mode, basePostcode: normalisePostcode(base), radiusMiles: radius, districts: mode === "districts" ? districts : [], travelNote: note.trim() })
        toast("Service area saved")
        onSaved?.()
      }}
    >
      <SegmentedControl
        label="How you set your area"
        value={mode}
        onChange={setMode}
        options={[
          { value: "radius", label: "Radius" },
          { value: "districts", label: "Postcode districts" },
        ]}
      />
      <Field label="Base postcode" htmlFor="ar-base" hint="Where you start from. Customers don't see your full address.">
        <TextInput id="ar-base" value={base} onChange={(e) => setBase(e.target.value)} className="uppercase" aria-invalid={!point || undefined} autoComplete="postal-code" />
      </Field>

      {mode === "radius" ? (
        <>
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="ar-radius" className="t-label text-navy">
                Distance
              </label>
              <span className="t-subhead tnum" aria-hidden>
                {radius} mile{radius === 1 ? "" : "s"}
              </span>
            </div>
            <input id="ar-radius" type="range" aria-valuetext={`${radius} miles`} min={1} max={25} step={1} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="h-11 w-full cursor-pointer accent-blue" />
            <div className="flex justify-between t-caption text-muted-ink tnum" aria-hidden>
              <span>1 mi</span>
              <span>25 mi</span>
            </div>
          </div>
          <MockMap points={[]} circle={{ lat: centre.lat, lng: centre.lng, radiusMiles: radius }} height={220} showSearchArea={false} ariaLabel={`Service area: ${radius} miles around ${normalisePostcode(base)}`} />
        </>
      ) : (
        <>
          <MockMap
            points={nearby.map((d) => ({ id: d.code, lat: d.lat, lng: d.lng, label: `${d.code} ${d.label}${districts.includes(d.code) ? ", in your area" : ", not in your area"}. Tap to ${districts.includes(d.code) ? "remove" : "add"}`, desk: districts.includes(d.code) }))}
            onSelect={toggle}
            center={centre}
            spanMiles={9}
            height={240}
            showSearchArea={false}
            ariaLabel="Postcode districts near your base"
          />
          <fieldset className="min-w-0">
            <legend className="mb-2 t-label text-navy">Districts you cover ({districts.length})</legend>
            <div className="flex flex-wrap gap-2">
              {nearby.map((d) => (
                <Chip key={d.code} active={districts.includes(d.code)} onClick={() => toggle(d.code)} aria-label={`${d.code} ${d.label}`}>
                  {districts.includes(d.code) && <Check aria-hidden />}
                  {d.code} <span className="font-normal">{d.label}</span>
                </Chip>
              ))}
            </div>
          </fieldset>
        </>
      )}

      <Field label="Travel charge note" htmlFor="ar-note" optional hint="Shown on your listing, e.g. £10 travel charge outside SE25">
        <TextInput id="ar-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="No travel charge inside the area." />
      </Field>
      {error && <FormError>{error}</FormError>}
      <SaveBar />
    </form>
  )
}
