"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { Stepper } from "@/components/answerd/Status"
import { SlotPicker } from "@/components/answerd/SlotPicker"
import { ListingMini, ListingNotFound } from "@/components/app/listing"
import { useBookingDraft, BOOK_STEPS } from "@/components/app/booking"
import { nextSlots, serviceById } from "@/lib/selectors"
import { fmtDateTime, ms, MS_DAY } from "@/lib/time"
import { priceWithVat } from "@/lib/format"

/** C-25: date strip and time pills from the business's availability. */
export default function BookTime({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  const { listing, draft, s } = useBookingDraft(slug, "time")
  if (!listing) return <AppScreen id="C-25"><ListingNotFound /></AppScreen>
  const svc = serviceById(s, draft?.serviceId)
  const next = nextSlots(s, listing, svc, 1)[0]
  const nothingThisWeek = !next || ms(next) - ms(s.clock) > 7 * MS_DAY

  return (
    <AppScreen
      id="C-25"
      bg="white"
      header={<TopBar title="Book" back />}
      footer={
        <div className="border-t border-line bg-white px-4 py-3">
          <Button block disabled={!draft?.startAt} onClick={() => router.push(`/app/b/${slug}/book/details`)}>
            Continue
          </Button>
        </div>
      }
    >
      <ListingMini listing={listing} subtitle={svc ? `${svc.name} · ${priceWithVat(svc)}` : undefined} />
      <div className="px-4 py-4">
        <Stepper steps={BOOK_STEPS} current={1} />
        <h1 className="t-title mt-5">Pick a time</h1>
        <p className="mt-1 t-caption text-muted-ink">Times shown in the business&apos;s availability</p>
        {nothingThisWeek && (
          <Banner tone="info" className="mt-3" title={next ? `Nothing free this week. Next available: ${fmtDateTime(next)}` : "Nothing free in the next two weeks"} action={<ButtonLink href={`/app/b/${slug}/enquiry`} size="sm" variant="secondary">Message instead</ButtonLink>} />
        )}
        {draft && <SlotPicker className="mt-4" listing={listing} service={svc} value={draft.startAt} onChange={(slot) => s.patchDraft({ startAt: slot })} />}
      </div>
    </AppScreen>
  )
}
