"use client"
import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, ImagePlus, MapPin, Store, X } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Stepper } from "@/components/answerd/Status"
import { Field, TextArea, TextInput } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { ListingMini, ListingNotFound, atPremises } from "@/components/app/listing"
import { useBookingDraft, BOOK_STEPS } from "@/components/app/booking"
import { coversPostcode, serviceById } from "@/lib/selectors"
import { lookupPostcode } from "@/lib/geo"
import { normaliseUkMobile } from "@/lib/format"
import { fmtDateTime } from "@/lib/time"
import { cn } from "@/lib/utils"

/** C-26: address (saved or new), access notes, job description, photos, contact phone. */
export default function BookDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { listing, draft, s } = useBookingDraft(slug, "details")
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const places = profile?.savedPlaces ?? []
  const [placeId, setPlaceId] = React.useState<string>(places[0]?.id ?? "new")
  const [line1, setLine1] = React.useState("")
  const [postcode, setPostcode] = React.useState(s.session.location?.postcode ?? "")
  const [access, setAccess] = React.useState(draft?.accessNotes ?? "")
  const [notes, setNotes] = React.useState(draft?.notes ?? "")
  const [photos, setPhotos] = React.useState<string[]>(draft?.photos ?? [])
  const [phone, setPhone] = React.useState(draft?.contactPhone ?? "")
  const [errors, setErrors] = React.useState<{ line1?: string; postcode?: string; phone?: string }>({})
  const [outside, setOutside] = React.useState<string | null>(null)

  if (!listing) return <AppScreen id="C-26"><ListingNotFound /></AppScreen>
  const shop = atPremises(listing)
  const svc = serviceById(s, draft?.serviceId)
  const alternatives = outside
    ? s.listings.filter((l) => l.id !== listing.id && l.layer === "claimed" && l.categoryIds.some((c) => listing.categoryIds.includes(c)) && coversPostcode(s, l.businessId, outside)).slice(0, 3)
    : []

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    const place = places.find((p) => p.id === placeId)
    const pc = shop ? listing.postcode : place ? place.postcode : postcode
    const addr = shop ? `${listing.name}, ${listing.address}` : place ? `${place.line1 ?? place.label}, ${place.area}` : line1
    if (!shop && !place && !line1.trim()) errs.line1 = "Enter the first line of the address"
    if (!shop && !lookupPostcode(pc)) errs.postcode = "We don't recognise that postcode"
    if (!normaliseUkMobile(phone)) errs.phone = "Enter a UK mobile so they can reach you"
    setErrors(errs)
    if (Object.keys(errs).length) return
    if (!shop && !coversPostcode(s, listing.businessId, pc)) {
      setOutside(lookupPostcode(pc)!.postcode)
      return
    }
    s.patchDraft({ address: addr, postcode: lookupPostcode(pc)?.postcode ?? pc, accessNotes: access, notes, photos, contactPhone: normaliseUkMobile(phone)! })
    router.push(`/app/b/${slug}/book/confirm`)
  }

  return (
    <AppScreen
      id="C-26"
      bg="white"
      header={<TopBar title="Book" back />}
      footer={
        // Sticky like C-24, C-25 and C-27; submits the form below
        <div className="border-t border-line bg-white px-4 py-3">
          <Button block type="submit" form="book-details">
            Continue
          </Button>
        </div>
      }
    >
      <ListingMini listing={listing} subtitle={svc && draft?.startAt ? `${svc.name} · ${fmtDateTime(draft.startAt)}` : undefined} />
      <form id="book-details" className="space-y-5 px-4 py-4" onSubmit={submit} noValidate>
        <Stepper steps={BOOK_STEPS} current={2} />
        <h1 className="t-title">Your details</h1>

        {outside && (
          <Banner tone="error" title={`${listing.name} doesn't cover ${outside}`}>
            <p>Their service area doesn&apos;t reach this address. These businesses do:</p>
            <ul className="mt-2 space-y-2">
              {alternatives.map((l) => (
                <li key={l.id}>
                  <Link href={`/app/b/${l.slug}`} className="flex items-center gap-2 rounded-xl bg-white p-2 hover:bg-sky">
                    <ListingAvatar listing={l} size={32} />
                    <span className="flex-1 t-label text-navy">{l.name}</span>
                    <ChevronRight className="size-4 text-muted-ink" aria-hidden />
                  </Link>
                </li>
              ))}
              {!alternatives.length && <li>No one on Answerd covers it yet. Try Ask Answerd.</li>}
            </ul>
          </Banner>
        )}

        {shop ? (
          <div className="flex items-start gap-3 rounded-2xl bg-sky p-4">
            <Store className="mt-0.5 size-5 text-blue" aria-hidden />
            <div>
              <p className="t-label text-navy">At {listing.name}</p>
              <p className="t-caption text-muted-ink">
                {listing.address}, {listing.postcode}
              </p>
            </div>
          </div>
        ) : (
          <fieldset>
            <legend className="t-label text-navy">Address</legend>
            <div className="mt-2 space-y-2" role="radiogroup">
              {places.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={placeId === p.id} onClick={() => (setPlaceId(p.id), setOutside(null))} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", placeId === p.id ? "border-blue bg-blue-tint" : "border-line")}>
                  <MapPin className="size-5 text-blue" aria-hidden />
                  <span className="flex-1">
                    <span className="block t-label text-navy">{p.label}</span>
                    <span className="block t-caption text-muted-ink">
                      {p.line1 ? `${p.line1}, ` : ""}
                      {p.postcode}
                    </span>
                  </span>
                  {placeId === p.id && <Check className="size-5 text-blue" aria-hidden />}
                </button>
              ))}
              <button type="button" role="radio" aria-checked={placeId === "new"} onClick={() => (setPlaceId("new"), setOutside(null))} className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left", placeId === "new" ? "border-blue bg-blue-tint" : "border-line")}>
                <MapPin className="size-5 text-muted-ink" aria-hidden />
                <span className="flex-1 t-label text-navy">A different address</span>
              </button>
            </div>
            {placeId === "new" && (
              <div className="mt-3 grid grid-cols-[1fr_120px] gap-2">
                <Field label="First line" htmlFor="l1" error={errors.line1}>
                  <TextInput id="l1" value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" aria-invalid={!!errors.line1} />
                </Field>
                <Field label="Postcode" htmlFor="pc" error={errors.postcode}>
                  <TextInput id="pc" value={postcode} onChange={(e) => (setPostcode(e.target.value), setOutside(null))} className="uppercase" autoComplete="postal-code" aria-invalid={!!errors.postcode} />
                </Field>
              </div>
            )}
          </fieldset>
        )}
        {!shop && (
          <Field label="Access notes" htmlFor="access" optional>
            <TextInput id="access" value={access} onChange={(e) => setAccess(e.target.value)} placeholder="e.g. Side gate, parking on the drive" />
          </Field>
        )}
        <Field label="Describe the job" htmlFor="notes" optional>
          <TextArea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything they should know before they arrive" />
        </Field>
        <div>
          <p className="t-label text-navy">Photos <span className="font-normal text-muted-ink">(optional)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <span key={p} className="relative inline-flex size-14 items-center justify-center rounded-xl bg-blue-tint t-caption text-blue">
                {p.replace(".jpg", "")}
                <button type="button" aria-label={`Remove ${p}`} onClick={() => setPhotos((x) => x.filter((y) => y !== p))} className="absolute -right-1.5 -top-1.5 inline-flex size-6 items-center justify-center rounded-full bg-navy text-white">
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => setPhotos((x) => [...x, `photo-${x.length + 1}.jpg`])} className="inline-flex size-14 items-center justify-center rounded-xl border border-dashed border-line text-slate hover:border-blue" aria-label="Add a photo">
                <ImagePlus className="size-5" />
              </button>
            )}
          </div>
        </div>
        <Field label="Contact phone" htmlFor="ph" error={errors.phone}>
          <TextInput id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} className="tnum" />
        </Field>
      </form>
    </AppScreen>
  )
}
