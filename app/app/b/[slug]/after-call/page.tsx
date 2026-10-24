"use client"
import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarCheck, MessageCircle, PhoneMissed, Search, ThumbsUp } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Field, SelectInput, TextInput } from "@/components/answerd/Fields"
import { Banner } from "@/components/answerd/Feedback"
import { ListingAvatar } from "@/components/answerd/Media"
import { ListingNotFound } from "@/components/app/listing"
import { signInHref, withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { listingBySlug, servicesFor } from "@/lib/selectors"
import { atMinutes, dayKey } from "@/lib/time"
import { toast } from "@/lib/toast"

/** C-21: "Did you get through?" shown once per call. */
function AfterCall({ slug }: { slug: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const callId = sp.get("call") ?? ""
  const s = useStore()
  const listing = listingBySlug(s, slug)
  const call = s.calls.find((c) => c.id === callId)
  const run = s.runs.find((r) => r.callId === callId)
  const answered = call?.afterCall ?? run?.afterCall
  const [step, setStep] = React.useState<"ask" | "booked" | "not_booked" | "no_answer">("ask")
  const services = servicesFor(s, listing?.businessId)
  const [serviceId, setServiceId] = React.useState(services[0]?.id ?? "")
  const [date, setDate] = React.useState(dayKey(s.clock))
  const [time, setTime] = React.useState("10:00")
  const [what, setWhat] = React.useState("")

  if (!listing) return <AppScreen id="C-21"><ListingNotFound /></AppScreen>
  const claimed = listing.layer === "claimed"
  const cat = listing.categoryIds[0]
  const answer = (a: "booked" | "not_booked" | "no_answer") => {
    // "Booked" is recorded once the booking is saved (a guest may need to sign in first)
    if (a !== "booked") s.setAfterCall(callId, a)
    setStep(a)
  }

  if (answered && step === "ask") {
    return (
      <AppScreen id="C-21" header={<TopBar title="After the call" close={`/app/b/${slug}`} />}>
        <div className="p-4">
          <Banner tone="success" title="Thanks, noted">
            We only ask once per call.
          </Banner>
          <ButtonLink href={`/app/b/${slug}`} variant="secondary" block className="mt-4">
            Back to {listing.name}
          </ButtonLink>
        </div>
      </AppScreen>
    )
  }

  return (
    <AppScreen id="C-21" bg="white" header={<TopBar title="After the call" close={`/app/b/${slug}`} tone="clear" />}>
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3">
          <ListingAvatar initials={listing.initials} hue={listing.hue} size={48} />
          <p className="t-subhead">{listing.name}</p>
        </div>

        {step === "ask" && (
          <>
            <h1 className="t-title mt-6">Did you get through?</h1>
            <p className="mt-1 t-body text-slate">It helps other people know who picks up.</p>
            <div className="mt-6 space-y-2">
              <Button block onClick={() => answer("booked")}>
                <CalendarCheck /> Yes, booked it
              </Button>
              <Button block variant="secondary" onClick={() => answer("not_booked")}>
                <ThumbsUp /> Yes, not booked
              </Button>
              <Button block variant="secondary" onClick={() => answer("no_answer")}>
                <PhoneMissed /> No answer
              </Button>
            </div>
          </>
        )}

        {step === "booked" && (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (!s.session.userId) return router.push(signInHref(`/app/b/${slug}/after-call?call=${callId}`))
              const [h, m] = time.split(":").map(Number)
              const res = s.createBooking({
                listingId: listing.id,
                serviceId: claimed ? serviceId : "",
                startAt: atMinutes(date, h! * 60 + m!),
                address: s.customerProfiles.find((p) => p.userId === s.session.userId)?.savedPlaces[0]?.line1 ?? "",
                postcode: s.session.location?.postcode ?? "",
                notes: claimed ? "Booked on the phone" : what || "Booked on the phone",
                createdBy: "customer",
                status: "confirmed",
              })
              if (res.ok) {
                s.setAfterCall(callId, "booked")
                toast("Added to your bookings")
                router.replace(`/app/bookings/${res.bookingId}`)
              }
            }}
          >
            <h1 className="t-title">Great, add the details</h1>
            <p className="t-body text-slate">We&apos;ll keep it in your bookings with reminders.</p>
            {claimed && services.length ? (
              <Field label="Service" htmlFor="svc">
                <SelectInput id="svc" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                  {services.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            ) : (
              <Field label="What's the job?" htmlFor="what">
                <TextInput id="what" value={what} onChange={(e) => setWhat(e.target.value)} placeholder="e.g. Lock change" required />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" htmlFor="date">
                <TextInput id="date" type="date" value={date} min={dayKey(s.clock)} onChange={(e) => setDate(e.target.value)} required />
              </Field>
              <Field label="Time" htmlFor="time">
                <TextInput id="time" type="time" value={time} step={900} onChange={(e) => setTime(e.target.value)} required />
              </Field>
            </div>
            <Button block type="submit">
              Save booking
            </Button>
          </form>
        )}

        {step === "not_booked" && (
          <div className="mt-6">
            <h1 className="t-title">Thanks for letting us know</h1>
            <p className="mt-1 t-body text-slate">{claimed ? "Want to follow up in writing? Messages keep everything in one place." : "You can come back to them any time."}</p>
            <div className="mt-6 space-y-2">
              {claimed && (
                <ButtonLink href={s.session.userId ? `/app/b/${slug}/enquiry` : signInHref(`/app/b/${slug}/enquiry`)} block>
                  <MessageCircle /> Message {listing.name}
                </ButtonLink>
              )}
              <ButtonLink href={`/app/b/${slug}`} variant="secondary" block>
                Back
              </ButtonLink>
            </div>
          </div>
        )}

        {step === "no_answer" && (
          <div className="mt-6">
            <h1 className="t-title">Sorry they didn&apos;t pick up</h1>
            <p className="mt-1 t-body text-slate">{claimed ? "Leave a message and they'll see it in their inbox, or try a similar business." : "This business isn't on Answerd yet, so try one that responds instantly."}</p>
            <div className="mt-6 space-y-2">
              {claimed && (
                <ButtonLink href={s.session.userId ? `/app/b/${slug}/enquiry` : signInHref(`/app/b/${slug}/enquiry`)} block>
                  <MessageCircle /> Message instead
                </ButtonLink>
              )}
              <ButtonLink href={`/app/results?category=${cat}&instant=1`} variant={claimed ? "secondary" : "primary"} block>
                <Search /> Try similar
              </ButtonLink>
            </div>
          </div>
        )}
        <p className="mt-8 text-center">
          <Link href="/app" className="inline-flex min-h-11 items-center t-label text-muted-ink hover:text-navy">
            Back to Home
          </Link>
        </p>
      </div>
    </AppScreen>
  )
}

const A = withSuspense(AfterCall)
export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  return <A slug={slug} />
}
