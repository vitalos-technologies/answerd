"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Stepper } from "@/components/answerd/Status"
import { EmptyState } from "@/components/answerd/Feedback"
import { ListingMini, ListingNotFound } from "@/components/app/listing"
import { useBookingDraft, BOOK_STEPS } from "@/components/app/booking"
import { servicesFor, businessById } from "@/lib/selectors"
import { durationLabel, priceWithVat } from "@/lib/format"
import { cn } from "@/lib/utils"

/** C-24: choose a bookable service. */
export default function BookService({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { listing, draft, s } = useBookingDraft(slug, "service")
  const [picked, setPicked] = React.useState<string | undefined>(draft?.serviceId)
  if (!listing) return <AppScreen id="C-24"><ListingNotFound /></AppScreen>
  const services = servicesFor(s, listing.businessId).filter((x) => x.bookable)
  const biz = businessById(s, listing.businessId)
  const sel = picked ?? draft?.serviceId

  return (
    <AppScreen
      id="C-24"
      bg="white"
      header={<TopBar title="Book" close={`/app/b/${slug}`} />}
      footer={
        services.length ? (
          <div className="border-t border-line bg-white px-4 py-3">
            <Button
              block
              disabled={!sel}
              onClick={() => {
                s.patchDraft({ serviceId: sel, startAt: draft?.serviceId === sel ? draft?.startAt : undefined })
                router.push(`/app/b/${slug}/book/time`)
              }}
            >
              Continue
            </Button>
          </div>
        ) : undefined
      }
    >
      <ListingMini listing={listing} subtitle={biz?.bookingMode === "instant" ? "Instant booking" : "Request to book · they confirm within 2 hours"} />
      <div className="px-4 py-4">
        <Stepper steps={BOOK_STEPS} current={0} />
        <h1 className="t-title mt-5">What do you need?</h1>
        {services.length ? (
          <ul className="mt-4 space-y-2" role="radiogroup" aria-label="Services">
            {services.map((x) => {
              const on = sel === x.id
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPicked(x.id)}
                    className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors", on ? "border-blue bg-blue-tint" : "border-line bg-white hover:border-blue/50")}
                  >
                    <span className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-blue bg-blue text-white" : "border-line")}>{on && <Check className="size-4" aria-hidden />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block t-label text-navy">{x.name}</span>
                      <span className="block t-caption text-muted-ink">{durationLabel(x.durationMin)}</span>
                    </span>
                    <span className="shrink-0 t-label text-navy tnum">{priceWithVat(x)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="Nothing to book online" body={`${listing.name} arranges jobs by message.`} action={<ButtonLink href={`/app/b/${slug}/enquiry`} size="md">Message instead</ButtonLink>} />
        )}
      </div>
    </AppScreen>
  )
}
