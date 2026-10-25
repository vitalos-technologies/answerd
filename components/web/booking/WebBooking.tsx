"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarClock, CalendarPlus, Check, CheckCircle2, ChevronRight, Clock, ImagePlus, MapPin, MessageCircle, Receipt, Smartphone, Store, X, Zap } from "lucide-react"
import { ScreenMeta } from "@/components/shells/ScreenMeta"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { Stepper, StatusPill } from "@/components/answerd/Status"
import { SlotPicker } from "@/components/answerd/SlotPicker"
import { Field, TextArea, TextInput } from "@/components/answerd/Fields"
import { ListingAvatar } from "@/components/answerd/Media"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { atPremises } from "@/components/app/listing"
import { useStore } from "@/lib/store"
import { businessById, coversPostcode, listingBySlug, nextSlots, serviceById, servicesFor } from "@/lib/selectors"
import { durationLabel, normaliseUkMobile, priceWithVat } from "@/lib/format"
import { lookupPostcode } from "@/lib/geo"
import { fmtDate, fmtDateTime, fmtTime, icsFile, ms, MS_DAY } from "@/lib/time"
import { cn } from "@/lib/utils"
import { Container } from "../ui"

const STEPS = ["service", "time", "details", "confirm"] as const
type Step = (typeof STEPS)[number]
const LABELS = ["Service", "Time", "Details", "Confirm"]

/**
 * Web booking at /b/[slug]/book: the C-24 to C-28 steps with the same store actions
 * (setDraft, patchDraft, createBooking) in a desktop layout with a summary card.
 */
function BookingInner({ slug }: { slug: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const userId = s.session.userId
  const draft = s.draft && listing && s.draft.listingId === listing.id ? s.draft : null
  const doneId = sp.get("booked")
  const threadId = sp.get("thread") ?? undefined
  const requested = (sp.get("step") as Step) || "service"
  // Never skip ahead of what the draft has
  const step: Step = requested === "time" && !draft?.serviceId ? "service" : (requested === "details" || requested === "confirm") && !draft?.startAt ? (draft?.serviceId ? "time" : "service") : requested === "confirm" && !draft?.address && !(listing && atPremises(listing)) ? "details" : STEPS.includes(requested) ? requested : "service"
  const go = (st: Step) => router.push(`/b/${slug}/book?step=${st}${threadId ? `&thread=${threadId}` : ""}`, { scroll: true })

  React.useEffect(() => {
    if (!s.hydrated) return
    if (!userId) {
      router.replace(`/sign-in?next=${encodeURIComponent(`/b/${slug}/book`)}`)
      return
    }
    if (listing && listing.layer !== "claimed") {
      router.replace(`/b/${slug}`)
      return
    }
    if (listing && !draft && !doneId) s.setDraft({ listingId: listing.id, contactPhone: s.users.find((u) => u.id === userId)?.phone })
  }, [s, userId, listing, draft, doneId, router, slug])

  if (!listing) {
    return (
      <Container className="py-16">
        <div className="card">
          <EmptyState title="We can't find that business" body="It may have moved or merged with another listing." action={<ButtonLink href="/search" size="md">Search again</ButtonLink>} />
        </div>
      </Container>
    )
  }
  if (!s.hydrated || !userId) return <Container className="py-16" aria-busy="true"><p className="t-body text-slate">Loading…</p></Container>
  if (doneId) return <Booked bookingId={doneId} slug={slug} />

  const biz = businessById(s, listing.businessId)
  const services = servicesFor(s, listing.businessId).filter((x) => x.bookable)
  const svc = serviceById(s, draft?.serviceId)
  const idx = STEPS.indexOf(step)

  return (
    <Container className="py-8 md:py-10">
      <Link href={`/b/${slug}`} className="inline-flex min-h-11 items-center gap-1 t-label text-blue hover:underline">
        <ChevronRight className="size-4 rotate-180" aria-hidden /> Back to {listing.name}
      </Link>
      <h1 className="t-title mt-2">Book {listing.name}</h1>
      <Stepper steps={LABELS} current={idx} className="mt-6 max-w-2xl" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {step === "service" && <ServiceStep services={services} selected={draft?.serviceId} onContinue={(id) => (s.patchDraft({ serviceId: id, startAt: draft?.serviceId === id ? draft?.startAt : undefined }), go("time"))} slug={slug} />}
          {step === "time" && draft && <TimeStep slug={slug} onContinue={() => go("details")} />}
          {step === "details" && draft && <DetailsStep slug={slug} onContinue={() => go("confirm")} />}
          {step === "confirm" && draft && <ConfirmStep slug={slug} threadId={threadId} onEdit={go} />}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <ListingAvatar listing={listing} size={44} />
              <div className="min-w-0">
                <p className="truncate t-subhead">{listing.name}</p>
                <p className="t-caption text-muted-ink">{biz?.bookingMode === "instant" ? "Instant booking" : "Request to book · they confirm within 2 hours"}</p>
              </div>
            </div>
            <dl className="mt-4 divide-y divide-line">
              <SummaryRow icon={Receipt} label="Service" value={svc ? `${svc.name} · ${durationLabel(svc.durationMin)}` : "Not chosen yet"} />
              <SummaryRow icon={CalendarClock} label="When" value={draft?.startAt ? `${fmtDate(draft.startAt)}, ${fmtTime(draft.startAt)}` : "Not chosen yet"} />
              <SummaryRow icon={MapPin} label="Where" value={atPremises(listing) ? `At ${listing.name}` : draft?.address ? `${draft.address}, ${draft.postcode}` : "Not added yet"} />
              <SummaryRow icon={Receipt} label="Price" value={svc ? priceWithVat(svc) : "–"} />
            </dl>
            <p className="mt-3 t-caption text-muted-ink">You pay the business directly after the job.</p>
          </div>
        </aside>
      </div>
    </Container>
  )
}

function SummaryRow({ icon: I, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <I className="mt-0.5 size-4 shrink-0 text-blue" aria-hidden />
      <div className="min-w-0">
        <dt className="t-caption text-muted-ink">{label}</dt>
        <dd className="t-label text-navy">{value}</dd>
      </div>
    </div>
  )
}

function ServiceStep({ services, selected, onContinue, slug }: { services: ReturnType<typeof servicesFor>; selected?: string; onContinue: (id: string) => void; slug: string }) {
  const [picked, setPicked] = React.useState<string | undefined>(selected)
  if (!services.length) return <EmptyState title="Nothing to book online" body="This business arranges jobs by message." action={<ButtonLink href={`/b/${slug}?message=1`} size="md">Message instead</ButtonLink>} />
  return (
    <section aria-labelledby="svc-h">
      <h2 id="svc-h" className="t-heading">
        What do you need?
      </h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2" role="radiogroup" aria-label="Services">
        {services.map((x) => {
          const on = picked === x.id
          return (
            <li key={x.id}>
              <button type="button" role="radio" aria-checked={on} onClick={() => setPicked(x.id)} className={cn("flex h-full w-full items-start gap-3 rounded-2xl border bg-white p-4 text-left transition-colors", on ? "border-blue bg-blue-tint" : "border-line hover:border-blue/50")}>
                <span className={cn("mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-blue bg-blue text-white" : "border-line")}>{on && <Check className="size-4" aria-hidden />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy">{x.name}</span>
                  {x.description && <span className="block t-caption text-slate">{x.description}</span>}
                  <span className="mt-1 block t-caption text-muted-ink">{durationLabel(x.durationMin)}</span>
                </span>
                <span className="shrink-0 t-label text-navy tnum">{priceWithVat(x)}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <Button className="mt-6" disabled={!picked} onClick={() => picked && onContinue(picked)}>
        Continue
      </Button>
    </section>
  )
}

function TimeStep({ slug, onContinue }: { slug: string; onContinue: () => void }) {
  const s = useStore()
  const listing = listingBySlug(s, slug)!
  const draft = s.draft!
  const svc = serviceById(s, draft.serviceId)
  const next = nextSlots(s, listing, svc, 1)[0]
  const nothingThisWeek = !next || ms(next) - ms(s.clock) > 7 * MS_DAY
  return (
    <section aria-labelledby="time-h">
      <h2 id="time-h" className="t-heading">
        Pick a time
      </h2>
      <p className="mt-1 t-caption text-muted-ink">Times shown in the business&apos;s availability</p>
      {nothingThisWeek && (
        <Banner tone="info" className="mt-3" title={next ? `Nothing free this week. Next available: ${fmtDateTime(next)}` : "Nothing free in the next two weeks"} action={<ButtonLink href={`/b/${slug}?message=1`} size="sm" variant="secondary">Message instead</ButtonLink>} />
      )}
      <div className="card mt-4 p-4 md:p-5">
        <SlotPicker listing={listing} service={svc} value={draft.startAt} onChange={(slot) => s.patchDraft({ startAt: slot })} />
      </div>
      <Button className="mt-6" disabled={!draft.startAt} onClick={onContinue}>
        Continue
      </Button>
    </section>
  )
}

function DetailsStep({ slug, onContinue }: { slug: string; onContinue: () => void }) {
  const s = useStore()
  const listing = listingBySlug(s, slug)!
  const draft = s.draft!
  const profile = s.customerProfiles.find((p) => p.userId === s.session.userId)
  const places = profile?.savedPlaces ?? []
  const [placeId, setPlaceId] = React.useState<string>(places[0]?.id ?? "new")
  const [line1, setLine1] = React.useState("")
  const [postcode, setPostcode] = React.useState(s.session.location?.postcode ?? "")
  const [access, setAccess] = React.useState(draft.accessNotes ?? "")
  const [notes, setNotes] = React.useState(draft.notes ?? "")
  const [photos, setPhotos] = React.useState<string[]>(draft.photos ?? [])
  const [phone, setPhone] = React.useState(draft.contactPhone ?? "")
  const [errors, setErrors] = React.useState<{ line1?: string; postcode?: string; phone?: string }>({})
  const [outside, setOutside] = React.useState<string | null>(null)
  const shop = atPremises(listing)
  const alternatives = outside ? s.listings.filter((l) => l.id !== listing.id && l.layer === "claimed" && l.categoryIds.some((c) => listing.categoryIds.includes(c)) && coversPostcode(s, l.businessId, outside)).slice(0, 3) : []

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
    onContinue()
  }

  return (
    <form className="space-y-5" onSubmit={submit} noValidate aria-labelledby="det-h">
      <h2 id="det-h" className="t-heading">
        Your details
      </h2>
      {outside && (
        <Banner tone="error" title={`${listing.name} doesn't cover ${outside}`}>
          <p>Their service area doesn&apos;t reach this address. These businesses do:</p>
          <ul className="mt-2 space-y-2">
            {alternatives.map((l) => (
              <li key={l.id}>
                <Link href={`/b/${l.slug}`} className="flex items-center gap-2 rounded-xl bg-white p-2 hover:bg-sky">
                  <ListingAvatar listing={l} size={32} />
                  <span className="flex-1 t-label text-navy">{l.name}</span>
                  <ChevronRight className="size-4 text-muted-ink" aria-hidden />
                </Link>
              </li>
            ))}
            {!alternatives.length && <li>No one on Answerd covers it yet. Try Chat with Answerd.</li>}
          </ul>
        </Banner>
      )}
      <div className="card space-y-5 p-5">
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
            <div className="mt-2 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Address">
              {places.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={placeId === p.id} onClick={() => (setPlaceId(p.id), setOutside(null))} className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left", placeId === p.id ? "border-blue bg-blue-tint" : "border-line")}>
                  <MapPin className="size-5 text-blue" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block t-label text-navy">{p.label}</span>
                    <span className="block truncate t-caption text-muted-ink">
                      {p.line1 ? `${p.line1}, ` : ""}
                      {p.postcode}
                    </span>
                  </span>
                </button>
              ))}
              <button type="button" role="radio" aria-checked={placeId === "new"} onClick={() => (setPlaceId("new"), setOutside(null))} className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left", placeId === "new" ? "border-blue bg-blue-tint" : "border-line")}>
                <MapPin className="size-5 text-muted-ink" aria-hidden />
                <span className="flex-1 t-label text-navy">A different address</span>
              </button>
            </div>
            {placeId === "new" && (
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px]">
                <Field label="First line" htmlFor="wl1" error={errors.line1}>
                  <TextInput id="wl1" value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" aria-invalid={!!errors.line1} />
                </Field>
                <Field label="Postcode" htmlFor="wpc" error={errors.postcode}>
                  <TextInput id="wpc" value={postcode} onChange={(e) => (setPostcode(e.target.value), setOutside(null))} className="uppercase" autoComplete="postal-code" aria-invalid={!!errors.postcode} />
                </Field>
              </div>
            )}
          </fieldset>
        )}
        {!shop && (
          <Field label="Access notes" htmlFor="waccess" optional>
            <TextInput id="waccess" value={access} onChange={(e) => setAccess(e.target.value)} placeholder="e.g. Side gate, parking on the drive" />
          </Field>
        )}
        <Field label="Describe the job" htmlFor="wnotes" optional>
          <TextArea id="wnotes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything they should know before they arrive" />
        </Field>
        <div>
          <p className="t-label text-navy">
            Photos <span className="font-normal text-muted-ink">(optional)</span>
          </p>
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
        <Field label="Contact phone" htmlFor="wph" error={errors.phone} className="max-w-xs">
          <TextInput id="wph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} className="tnum" />
        </Field>
      </div>
      <Button type="submit">Continue</Button>
    </form>
  )
}

function ConfirmStep({ slug, threadId, onEdit }: { slug: string; threadId?: string; onEdit: (s: Step) => void }) {
  const router = useRouter()
  const s = useStore()
  const listing = listingBySlug(s, slug)!
  const draft = s.draft!
  const [taken, setTaken] = React.useState<string[] | null>(null)
  const [loading, setLoading] = React.useState(false)
  const biz = businessById(s, listing.businessId)
  const svc = serviceById(s, draft.serviceId)
  const instant = biz?.bookingMode === "instant"
  const shop = atPremises(listing)
  const address = shop ? `${listing.name}, ${listing.address}` : draft.address
  const policy = biz?.cancellationPolicy === "48h" ? "Free to cancel until 48 hours before" : biz?.cancellationPolicy === "custom" ? (biz.cancellationCustom ?? "") : "Free to cancel until 24 hours before"

  const confirm = (startAt: string) => {
    setLoading(true)
    const res = s.createBooking({ listingId: listing.id, serviceId: draft.serviceId ?? "", startAt, address: address ?? "", postcode: shop ? listing.postcode : (draft.postcode ?? ""), accessNotes: draft.accessNotes, notes: draft.notes, photos: draft.photos, contactPhone: draft.contactPhone, threadId })
    setLoading(false)
    if (!res.ok) {
      setTaken(res.alternatives)
      return
    }
    router.replace(`/b/${slug}/book?booked=${res.bookingId}`)
  }

  return (
    <section aria-labelledby="conf-h">
      <h2 id="conf-h" className="t-heading">
        Check and confirm
      </h2>
      <dl className="card mt-4 divide-y divide-line">
        {(
          [
            ["Service", svc ? `${svc.name} · ${durationLabel(svc.durationMin)}` : "Booking", "service"],
            ["When", draft.startAt ? `${fmtDate(draft.startAt)}, ${fmtTime(draft.startAt)}` : "", "time"],
            ["Where", address ? `${address}${shop ? "" : `, ${draft.postcode}`}` : "Add your address", shop ? null : "details"],
            ["Price", svc ? priceWithVat(svc) : "Agreed with the business", null],
          ] as [string, string, Step | null][]
        ).map(([label, value, edit]) => (
          <div key={label} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <dt className="t-caption text-muted-ink">{label}</dt>
              <dd className="t-label text-navy">{value}</dd>
            </div>
            {edit && (
              <Button variant="ghost" size="sm" onClick={() => onEdit(edit)} aria-label={`Change ${label.toLowerCase()}`}>
                Change
              </Button>
            )}
          </div>
        ))}
      </dl>
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
        <p className="flex items-center gap-2 t-label text-navy">
          {instant ? <Zap className="size-4 text-teal-ink" aria-hidden /> : <Clock className="size-4 text-amber-ink" aria-hidden />}
          {instant ? "Instant: you're booked straight away" : "Request: they'll confirm within 2 hours"}
        </p>
        <p className="mt-1 t-caption text-slate">{policy}. You pay the business directly after the job.</p>
      </div>
      <Button className="mt-6" loading={loading} disabled={!address} onClick={() => confirm(draft.startAt!)}>
        {instant ? "Confirm booking" : "Send booking request"}
      </Button>

      <Dialog open={!!taken} onOpenChange={(v) => !v && setTaken(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl border-0 bg-white p-6 shadow-overlay sm:max-w-md">
          <DialogTitle className="t-heading">That time was just taken</DialogTitle>
          <DialogDescription className="t-body text-slate">Someone booked {draft.startAt ? fmtTime(draft.startAt) : "it"} a moment ago. Your details are saved; pick one of the next free times.</DialogDescription>
          <div className="grid gap-2">
            {taken?.map((t) => (
              <Button
                key={t}
                variant="secondary"
                onClick={() => {
                  s.patchDraft({ startAt: t })
                  setTaken(null)
                  confirm(t)
                }}
              >
                {fmtDateTime(t)}
              </Button>
            ))}
            {!taken?.length && <p className="t-label text-muted-ink">No other times this week.</p>}
            <Button variant="ghost" onClick={() => (setTaken(null), onEdit("time"))}>
              See all times
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

/** C-28 on the web: "You're booked" or "Request sent". */
function Booked({ bookingId, slug }: { bookingId: string; slug: string }) {
  const s = useStore()
  const b = s.bookings.find((x) => x.id === bookingId)
  const listing = listingBySlug(s, slug)!
  if (!b || b.customerId !== s.session.userId) {
    return (
      <Container className="py-16">
        <div className="card">
          <EmptyState title="Booking not found" body="It may belong to another account." action={<ButtonLink href={`/b/${slug}`} size="md">Back to the business</ButtonLink>} />
        </div>
      </Container>
    )
  }
  const svc = serviceById(s, b.serviceId)
  const requested = b.status === "requested"
  const ics = () => {
    const blob = new Blob([icsFile({ uid: b.id, start: b.startAt, end: b.endAt, title: `${svc?.name ?? "Booking"} with ${listing.name}`, location: b.address, description: b.priceText })], { type: "text/calendar" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `answerd-${b.id}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <Container className="py-12 md:py-16">
      <ScreenMeta id="W-06" />
      <div className="card mx-auto max-w-xl p-6 text-center md:p-10">
        <span className="mx-auto inline-flex size-16 items-center justify-center rounded-full bg-teal-tint text-teal-ink">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>
        <h1 className="t-title mt-4">{requested ? "Request sent" : "You're booked"}</h1>
        <p className="mt-2 t-body text-slate">{requested ? `${listing.name} will confirm within 2 hours. We'll text you as soon as they do.` : `${listing.name} is expecting you.`}</p>
        <div className="mt-6 rounded-2xl bg-sky p-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <p className="t-subhead">{svc?.name ?? "Booking"}</p>
            <StatusPill status={b.status} />
          </div>
          <p className="mt-1 t-label font-normal text-slate">
            {fmtDate(b.startAt)}, {fmtTime(b.startAt)} · {b.address}
          </p>
          <p className="t-label font-normal text-slate tnum">{b.priceText}</p>
        </div>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button variant="secondary" onClick={ics}>
            <CalendarPlus /> Add to calendar
          </Button>
          <ButtonLink href={`/b/${slug}?message=1`} variant="secondary">
            <MessageCircle /> Message business
          </ButtonLink>
          <ButtonLink href="/account">Done</ButtonLink>
        </div>
        <Link href={`/app/bookings/${b.id}`} className="mt-5 inline-flex min-h-11 items-center gap-2 t-label text-blue hover:underline">
          <Smartphone className="size-4" aria-hidden /> Track it in the app
        </Link>
      </div>
    </Container>
  )
}

export function WebBooking({ slug }: { slug: string }) {
  return (
    <React.Suspense fallback={null}>
      <BookingInner slug={slug} />
    </React.Suspense>
  )
}
