"use client"
import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Phone, Plus, Trash2 } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { Mark, AppIcon } from "@/components/brand/Mark"
import { Button, IconButton } from "@/components/answerd/Button"
import { ActionBar } from "@/components/answerd/ActionBar"
import { SearchBar, CategoryTile } from "@/components/answerd/Search"
import { ResultCard } from "@/components/answerd/ResultCard"
import { Badge, BADGE_KINDS } from "@/components/answerd/Badges"
import { Rating } from "@/components/answerd/Rating"
import { ChatBubble, SlotCard, QuoteCard, BookingCard, TypingIndicator } from "@/components/answerd/Chat"
import { SlotPicker } from "@/components/answerd/SlotPicker"
import { BottomSheet } from "@/components/answerd/Sheet"
import { Banner, EmptyState, ErrorState, ListSkeleton, OfflineBanner, Skeleton } from "@/components/answerd/Feedback"
import { StatTile, StatusPill, Stepper, SegmentedControl } from "@/components/answerd/Status"
import { OTPInput, ResendTimer } from "@/components/answerd/OTPInput"
import { MockMap } from "@/components/answerd/MockMap"
import { Field, TextInput, ToggleRow, Chip, CheckRow } from "@/components/answerd/Fields"
import { ScreenIdBadge } from "@/components/shells/ScreenMeta"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import { listingBySlug, servicesFor, nextSlots, isDeskLive } from "@/lib/selectors"
import type { BookingStatus } from "@/lib/types"
import { london } from "@/lib/time"

const L = london(2026, 10, 30, 14)

function Block({ title, children, note }: { title: string; children: React.ReactNode; note?: string }) {
  return (
    <section className="card min-w-0 p-5">
      <h2 className="t-heading">{title}</h2>
      {note && <p className="mt-0.5 t-caption text-muted-ink">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function ComponentsPage() {
  const s = useStore()
  const swift = listingBySlug(s, "swift-plumbing-heating")!
  const svc = servicesFor(s, swift.businessId).find((x) => x.bookable)
  const [sheet, setSheet] = React.useState(false)
  const [otp, setOtp] = React.useState("12")
  const [seg, setSeg] = React.useState<"day" | "week" | "list">("week")
  const [slot, setSlot] = React.useState<string | undefined>()
  const [loading, setLoading] = React.useState(false)
  const [toggle, setToggle] = React.useState(true)
  const [chip, setChip] = React.useState(true)
  const [sel, setSel] = React.useState<string | null>(null)
  const pts = s.listings.filter((l) => l.city === "london").map((l) => ({ id: l.id, lat: l.geo.lat, lng: l.geo.lng, desk: isDeskLive(s, l), label: l.name }))
  const statuses: BookingStatus[] = ["requested", "confirmed", "on_the_way", "arrived", "completed", "cancelled", "declined", "no_show"]

  return (
    <div className="min-h-dvh bg-sky">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-6 py-5">
          <Link href="/hub" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-sky" aria-label="Back to the hub">
            <ArrowLeft className="size-5 text-navy" />
          </Link>
          <h1 className="t-title">Components</h1>
          <span className="t-label font-normal text-muted-ink">Every variant and state from the spec&apos;s Core components table</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1200px] gap-5 px-6 py-6 lg:grid-cols-2">
        <Block title="Brand" note="Lockups from the brand board. Clear space equals the mark's height.">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-center rounded-xl border border-line bg-white p-6">
              <Logo tagline size={34} />
            </div>
            <div className="flex items-center justify-center rounded-xl border border-line bg-white p-6">
              <Logo variant="stacked" tagline size={28} />
            </div>
            <div className="flex items-center justify-center rounded-xl border border-line bg-white p-6">
              <Logo variant="mono" tagline size={26} />
            </div>
            <div className="flex items-center justify-center rounded-xl bg-navy p-6">
              <Logo variant="reversed" tagline size={26} />
            </div>
            <div className="col-span-2 flex items-center justify-center gap-6 rounded-xl border border-line bg-white p-6">
              <Mark size={72} title="Answerd mark" />
              <AppIcon size={72} />
              <AppIcon size={72} dark />
              <AppIcon size={32} />
            </div>
          </div>
        </Block>

        <Block title="Button">
          <div className="flex flex-wrap gap-2">
            <Button>Book</Button>
            <Button variant="secondary">Message</Button>
            <Button variant="ghost">Not now</Button>
            <Button variant="destructive">
              <Trash2 /> Cancel booking
            </Button>
            <Button
              loading={loading}
              onClick={() => {
                setLoading(true)
                setTimeout(() => setLoading(false), 1500)
              }}
            >
              Confirm booking
            </Button>
            <Button disabled>Disabled</Button>
            <Button size="md" variant="tint">
              <Plus /> Add service
            </Button>
            <IconButton label="Call Swift Plumbing" tone="tint">
              <Phone />
            </IconButton>
          </div>
          <Button block className="mt-3">
            Full width on mobile forms
          </Button>
        </Block>

        <Block title="Action bar" note="Claimed and unclaimed variants">
          <div className="overflow-hidden rounded-xl border border-line">
            <ActionBar businessName="Swift Plumbing" callHref="/app/b/swift-plumbing-heating/call" messageHref="/app/b/swift-plumbing-heating/enquiry" bookHref="/app/b/swift-plumbing-heating/book" />
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            <ActionBar variant="unclaimed" businessName="Norwood Locksmiths" callHref="/app/b/norwood-locksmiths/call" claimHref="/app/biz/claim/l-norwood-locksmiths" />
          </div>
        </Block>

        <Block title="Search bar and category tiles">
          <SearchBar value="" onChange={() => {}} onSubmit={(v) => toast(`Search: ${v || "(empty)"}`)} locationLabel="SE25 · 2 mi" onLocationClick={() => toast("Location picker")} />
          <div className="mt-4 grid grid-cols-4 gap-3">
            <CategoryTile icon="Wrench" label="Plumbers" href="/app/results?category=plumbers" />
            <CategoryTile icon="Zap" label="Electricians" href="/app/results?category=electricians" />
            <CategoryTile icon="Sparkles" label="Cleaners" href="/app/results?category=cleaners" />
            <CategoryTile icon="Scissors" label="Barbers" href="/app/results?category=barbers" />
          </div>
        </Block>

        <Block title="Result card" note="Claimed, featured, unclaimed and Places gap-fill">
          <div className="space-y-3">
            <ResultCard listing={swift} href="/app/b/swift-plumbing-heating" category="Plumber" distance={0.4} rating={4.9} count={132} badges={["responds_instantly", "verified", "gas_safe", "insured"]} line="Replies in under a minute" lineTone="teal" />
            <ResultCard listing={{ name: "Croydon Heating Pros", layer: "claimed", initials: "CH", hue: 200 }} href="/app/b/croydon-heating-pros" category="Heating engineer" distance={1.8} rating={4.7} count={7} badges={["featured", "verified", "gas_safe"]} line="Opens 8am" featured />
            <ResultCard listing={{ name: "Norwood Locksmiths", layer: "seeded", initials: "NL", hue: 30 }} href="/app/b/norwood-locksmiths" category="Locksmith" distance={0.6} rating={0} count={0} badges={["unclaimed"]} line="Hasn't joined Answerd yet" />
            <ResultCard listing={{ name: "Rapid Response Plumbing Ltd", layer: "places", initials: "RR", hue: 120 }} href="/app/b/rapid-response-plumbing-ltd" category="Plumber" distance={2.3} rating={4.3} count={87} google badges={["unclaimed"]} line="Hasn't joined Answerd yet" />
          </div>
        </Block>

        <Block title="Badges and rating">
          <div className="flex flex-wrap gap-2">
            {BADGE_KINDS.map((k) => (
              <Badge key={k} kind={k} />
            ))}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Rating value={4.9} count={132} />
            <Rating value={4.3} count={87} google />
            <Rating value={0} count={0} />
          </div>
        </Block>

        <Block title="Chat bubbles" note="Customer, owner, staff, desk and system, with inline cards">
          <div className="space-y-3 rounded-xl bg-sky p-3">
            <ChatBubble author="customer" time="6:38pm">
              Hi, our kitchen tap&apos;s been dripping for a week. Are you free this week?
            </ChatBubble>
            <ChatBubble
              author="desk"
              time="6:38pm"
              card={<SlotCard slots={svc ? nextSlots(s, swift, svc, 2) : []} serviceName={svc?.name} onPick={(x) => toast(`Picked ${x}`)} />}
            >
              Hi Tayo, I&apos;m Swift Plumbing &amp; Heating&apos;s Answerd assistant. A leaking tap repair is £60 to £90 including VAT.
            </ChatBubble>
            <ChatBubble author="system">Booking requested</ChatBubble>
            <ChatBubble author="owner" authorName="Sam Okafor" time="7:02pm">
              Thanks Tayo, that&apos;s confirmed for Thursday at 2pm. Sam
            </ChatBubble>
            <ChatBubble author="staff" authorName="Jo Reid" time="7:05pm">
              I&apos;ll bring the cartridge.
            </ChatBubble>
            <ChatBubble
              author="owner"
              authorName="Sam Okafor"
              card={<QuoteCard lines={[{ id: "a", label: "Boiler service and flue check", pricePence: 9500 }]} totalPence={9500} vatPence={1583} vatIncluded validUntil={L} status="sent" canRespond onAccept={() => toast("Accepted")} onDecline={() => toast("Declined")} />}
            />
            <ChatBubble author="system" card={<BookingCard service="Leaking tap repair" startAt={L} status="confirmed" priceText="From £60 inc VAT" onOpen={() => toast("Open booking")} />} />
            <ChatBubble author="customer" queued>
              Sent while offline
            </ChatBubble>
            <TypingIndicator />
          </div>
        </Block>

        <Block title="Slot picker" note="Live from Swift Plumbing's real availability">
          <SlotPicker listing={swift} service={svc} value={slot} onChange={setSlot} />
        </Block>

        <Block title="Bottom sheet">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open a bottom sheet
          </Button>
          <BottomSheet open={sheet} onClose={() => setSheet(false)} title="Call Swift Plumbing" footer={<Button block onClick={() => setSheet(false)}>Call now</Button>}>
            <p className="t-body text-slate">You&apos;ll call via an Answerd number so they know you found them here.</p>
          </BottomSheet>
          <div className="mt-4">
            <BottomSheet inline open onClose={() => toast("Close")} title="Filters">
              <p className="t-body text-slate">Inline preview of the sheet chrome.</p>
            </BottomSheet>
          </div>
        </Block>

        <Block title="Banners">
          <div className="space-y-2">
            <Banner tone="info" title="Times shown in the business's availability" />
            <Banner tone="success" title="You're booked">
              Thu 30 Oct, 2pm with Swift Plumbing.
            </Banner>
            <Banner tone="warning" title="Verification pending">
              We&apos;ll check your document within 1 working day.
            </Banner>
            <Banner tone="error" title="That code didn't match" onDismiss={() => toast("Dismissed")}>
              Check the 6 digits and try again.
            </Banner>
          </div>
        </Block>

        <Block title="Empty, error, offline and loading">
          <EmptyState title="No bookings yet" body="When you book a local business it shows up here." action={<Button size="md">Find a service</Button>} />
          <ErrorState onRetry={() => toast("Retrying")} />
          <OfflineBanner className="rounded-xl" />
          <div className="mt-4">
            <ListSkeleton rows={2} />
            <Skeleton className="mt-3 h-24 w-full rounded-2xl" />
          </div>
        </Block>

        <Block title="Toast">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => toast("Saved")}>
              Show toast
            </Button>
            <Button variant="secondary" onClick={() => toast("Removed from saved", () => toast("Restored"))}>
              Toast with Undo
            </Button>
          </div>
        </Block>

        <Block title="Stat tiles">
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="New enquiries" value={9} delta="+3 this week" />
            <StatTile label="Jobs today" value={2} />
            <StatTile label="Desk handled" value="64%" delta="+12 pts" />
            <StatTile label="Profile views" value={182} delta="−4%" deltaTone="down" />
          </div>
        </Block>

        <Block title="OTP input" note="Paste fills all boxes; 000000 is the wrong code in the prototype">
          <OTPInput value={otp} onChange={setOtp} autoFocus={false} onComplete={(v) => toast(`Code ${v}`)} />
          <div className="mt-3">
            <ResendTimer seconds={30} onResend={() => toast("Code sent")} />
          </div>
          <div className="mt-4">
            <OTPInput value="000000" onChange={() => {}} autoFocus={false} error />
          </div>
        </Block>

        <Block title="Status pills and stepper">
          <div className="flex flex-wrap gap-2">
            {statuses.map((x) => (
              <StatusPill key={x} status={x} />
            ))}
          </div>
          <Stepper className="mt-5" steps={["Confirmed", "On my way", "Arrived", "Completed"]} current={1} />
        </Block>

        <Block title="Segmented control, chips and fields">
          <SegmentedControl
            value={seg}
            onChange={setSeg}
            label="Diary view"
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "list", label: "List" },
            ]}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Chip active={chip} onClick={() => setChip(!chip)}>
              Open now
            </Chip>
            <Chip>Responds instantly</Chip>
            <Chip>4★ and up</Chip>
          </div>
          <div className="mt-4 space-y-3">
            <Field label="First name" htmlFor="fn">
              <TextInput id="fn" placeholder="Tayo" />
            </Field>
            <Field label="Mobile number" htmlFor="ph" error="Enter a UK mobile number, like 07700 900123">
              <TextInput id="ph" defaultValue="0123" aria-invalid />
            </Field>
            <ToggleRow label="Booking updates by SMS" checked={toggle} onChange={setToggle} />
            <CheckRow label="Send me offers from Answerd" checked={false} onChange={() => {}} />
          </div>
        </Block>

        <Block title="Mock map" note="Mark pins for desk-enabled listings, blue dots for the rest, clusters with counts">
          <MockMap points={pts} selectedId={sel} onSelect={setSel} onSearchArea={() => toast("Search this area")} height={360} />
          <div className="mt-3">
            <MockMap points={[]} circle={{ lat: swift.geo.lat, lng: swift.geo.lng, radiusMiles: 3 }} height={220} showSearchArea={false} ariaLabel="Service area" />
          </div>
        </Block>

        <Block title="Screen ID badge">
          <div className="relative h-16 rounded-xl border border-dashed border-line bg-sky">
            <ScreenIdBadge className="absolute left-2 top-2" idOverride="C-16" />
          </div>
        </Block>
      </div>
    </div>
  )
}
