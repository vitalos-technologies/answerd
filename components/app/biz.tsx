"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { Banner, EmptyState } from "@/components/answerd/Feedback"
import { ButtonLink } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import type { DemoData } from "@/lib/seed"
import type { Business, Listing } from "@/lib/types"
import { availabilityFor, areaFor, deskFor, roleIn, rulesFor, servicesFor } from "@/lib/selectors"

type S = Pick<DemoData, keyof DemoData>

/** The business the session is working in, plus the viewer's role. */
export function useBiz() {
  const s = useStore()
  const id = s.session.supportViewBusinessId ?? s.session.currentBusinessId
  const biz = s.businesses.find((b) => b.id === id)
  const listing = s.listings.find((l) => l.id === biz?.listingId)
  const role = s.session.supportViewBusinessId ? "support" : roleIn(s, s.session.userId, biz?.id ?? null)
  return { s, biz, listing, role, owner: role === "owner", readOnly: role !== "owner" }
}

export interface SetupStep {
  key: string
  label: string
  done: boolean
  href: string
  sub: string
  optional?: boolean
}

/** B-09 progress, computed from real data: a step is done when its fields are filled. */
export function setupSteps(s: S, biz: Business, listing: Listing): SetupStep[] {
  const svcs = servicesFor(s, biz.id)
  const avail = availabilityFor(s, biz.id)
  const area = areaFor(s, biz.id)
  const creds = s.credentials.filter((c) => c.businessId === biz.id)
  const desk = deskFor(s, biz.id)
  return [
    { key: "details", label: "Details", done: !!(listing.name && listing.phonePublic && listing.categoryIds.length), href: "/app/biz/profile/details", sub: "Name, phone, description and categories" },
    { key: "services", label: "Services", done: svcs.length > 0, href: "/app/biz/profile/services", sub: svcs.length ? `${svcs.length} service${svcs.length > 1 ? "s" : ""}` : "What you do and what it costs" },
    { key: "hours", label: "Hours", done: !!avail?.weeklyHours.some((h) => !h.closed), href: "/app/biz/profile/hours", sub: avail?.weeklyHours.some((h) => !h.closed) ? `Open ${avail.weeklyHours.filter((h) => !h.closed).length} days a week` : "When customers can book" },
    { key: "area", label: "Service area", done: !!area && (area.mode === "districts" ? area.districts.length > 0 : !!area.basePostcode), href: "/app/biz/profile/area", sub: !area ? "Where you work" : area.mode === "districts" ? `${area.districts.length} postcode district${area.districts.length === 1 ? "" : "s"}` : `Within ${area.radiusMiles} mile${area.radiusMiles === 1 ? "" : "s"} of ${area.basePostcode.split(" ")[0]}` },
    { key: "photos", label: "Photos", done: biz.photos.length > 0, href: "/app/biz/profile/photos", sub: biz.photos.length ? `${biz.photos.length} photo${biz.photos.length > 1 ? "s" : ""}` : "Show your work" },
    { key: "credentials", label: "Credentials", done: creds.length > 0, href: "/app/biz/profile/credentials", sub: creds.length ? `${creds.filter((c) => c.status === "verified").length} verified, ${creds.filter((c) => c.status === "pending").length} pending` : "Gas Safe, NICEIC, insurance, DBS" },
    { key: "booking", label: "Booking settings", done: true, href: "/app/biz/profile/booking", sub: `${biz.bookingMode === "instant" ? "Instant booking" : "Request to book"} · free to cancel until ${biz.cancellationPolicy === "48h" ? "48" : "24"} hours` },
    { key: "desk", label: "Try the AI desk", done: !!desk?.trialUsed, href: "/app/biz/desk/intro", sub: `Optional: ${rulesFor(s).trialDays}-day free trial`, optional: true },
  ]
}

export function setupProgress(steps: SetupStep[]) {
  const req = steps.filter((x) => !x.optional)
  return Math.round((req.filter((x) => x.done).length / req.length) * 100)
}

/** Profile and setup screens: navy business header, back arrow, no tab bar. */
export function BizScreen({ id, title, back = "/app/biz/setup", children, footer, ownerOnly = true }: { id: string; title: string; back?: string; children: (ctx: ReturnType<typeof useBiz>) => React.ReactNode; footer?: React.ReactNode; ownerOnly?: boolean }) {
  const ctx = useBiz()
  const router = useRouter()
  React.useEffect(() => {
    if (ctx.s.hydrated && !ctx.biz) router.replace("/app/biz/claim")
  }, [ctx.s.hydrated, ctx.biz, router])
  if (!ctx.biz || !ctx.listing) {
    return (
      <AppScreen id={id} header={<TopBar title={title} back={back} />}>
        <EmptyState title="No business yet" body="Claim or add your business to set it up." action={<ButtonLink href="/app/biz/claim" size="md">Find your business</ButtonLink>} />
      </AppScreen>
    )
  }
  return (
    <AppScreen id={id} biz header={<TopBar title={title} back={back} />} footer={ctx.readOnly && ownerOnly ? undefined : footer}>
      {ctx.readOnly && ownerOnly && (
        <div className="px-4 pt-4">
          <Banner tone="info" icon={<Lock className="size-5" aria-hidden />} title={ctx.role === "support" ? "Read only for support" : "Only the owner can edit this"}>
            {ctx.role === "support" ? "Support can view but not change business details." : "Ask the owner if something needs changing."}
          </Banner>
        </div>
      )}
      <fieldset disabled={ctx.readOnly && ownerOnly} className="min-w-0">
        {children(ctx)}
      </fieldset>
    </AppScreen>
  )
}
