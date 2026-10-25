"use client"
import * as React from "react"
import { CheckCircle2, ExternalLink, Lock, Star } from "lucide-react"
import { Button, ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { AREAS } from "@/lib/geo"
import { categoryById } from "@/lib/categories"
import { businessById, gateButtonLabel, gateStatus, listingById, platformOn, rulesFor } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import { fmtDate } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import { CHECKOUT_HREF, planCta } from "./PlanBilling"
import { SmsConfirmSheet } from "./SmsConfirmSheet"

/** Featured availability for the business's categories and areas, from FeaturedSlot records. */
export function featuredRows(s: ReturnType<typeof useStore.getState>, businessId: string) {
  const biz = businessById(s, businessId)
  const listing = listingById(s, biz?.listingId)
  if (!listing) return []
  const areas = AREAS.filter((a) => !a.parent && a.districts.includes(listing.postcodeDistrict))
  const open = rulesFor(s).featuredSlotsPerArea // R2: slots per category and area, from S-06
  return listing.categoryIds.flatMap((cat) =>
    (areas.length ? areas : [{ slug: listing.area, name: listing.area }]).map((a) => {
      const slots = s.featuredSlots.filter((f) => f.categoryId === cat && f.areaCode === a.slug && f.position <= open)
      const catName = categoryById(cat, s.categories)?.name ?? cat
      return { key: `${cat}-${a.slug}`, label: `${catName} · ${a.name}`, total: slots.length, free: slots.filter((f) => !f.businessId).length, mine: slots.find((f) => f.businessId === businessId)?.position }
    }),
  )
}

/** B-37 Featured: slot availability, what you get, £29/month. Get Featured opens W-18 checkout (gated). */
export function FeaturedAvailability({ businessId, checkoutHref = CHECKOUT_HREF, readOnly }: { businessId: string; checkoutHref?: (plan: "desk" | "featured") => string; readOnly?: boolean }) {
  const s = useStore()
  const g = gateStatus(s, businessId)
  const price = rulesFor(s).featuredPricePence
  const payments = platformOn(s, "payments")
  const rows = featuredRows(s, businessId)
  const featSub = s.subscriptions.find((x) => x.businessId === businessId && x.plan === "featured" && x.status === "active")
  const anyFree = rows.some((r) => r.free > 0)
  const [cancel, setCancel] = React.useState(false)

  return (
    <div className="space-y-4">
      <section aria-labelledby="feat-avail">
        <h2 id="feat-avail" className="mb-2 t-heading">
          Availability
        </h2>
        <DataGate isEmpty={!rows.length} rows={2} empty={<div className="card"><EmptyState title="Coming when your area has 20+ businesses" body="Featured opens in an area once enough businesses list there, so it's worth something." /></div>}>
          <ul className="card divide-y divide-line">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center gap-3 px-4 py-3">
                <Star className={cn("size-5 shrink-0", r.mine ? "fill-amber text-amber" : "text-muted-ink")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block t-label text-navy">{r.label}</span>
                  <span className="block t-caption text-muted-ink tnum">
                    {r.mine ? `You're Featured here (position ${r.mine})` : r.total ? (r.free ? `${r.free} of ${r.total} slots free` : `All ${r.total} slots taken`) : "Coming when your area has 20+ businesses"}
                  </span>
                </span>
                {r.mine && <CheckCircle2 className="size-5 text-teal-ink" aria-label="Featured" />}
              </li>
            ))}
          </ul>
        </DataGate>
      </section>

      <div className="card p-4">
        <p className="t-subhead">What you get</p>
        <ul className="mt-1 list-disc pl-4 t-label font-normal text-slate">
          <li>One of 3 Featured places at the top of your category and area</li>
          <li>The Featured badge on results and the map</li>
        </ul>
        <p className="mt-2 t-label text-navy tnum">
          {gbp(price)}/month <span className="font-normal text-muted-ink">ex VAT ({gbp(Math.round(price * 1.2))} inc VAT). Cancel any time.</span>
        </p>
      </div>

      {!readOnly &&
        (featSub ? (
          <Button variant="secondary" block onClick={() => setCancel(true)}>
            Cancel Featured
          </Button>
        ) : !g.met ? (
          <div>
            <Button block disabled>
              <Lock /> {gateButtonLabel(g, "Get Featured")}
            </Button>
            <p className="mt-1.5 text-center t-caption text-muted-ink">{g.enquiriesOk ? `You've had ${g.count} enquiries from Answerd. Paid plans open on ${fmtDate(g.gateDate)}.` : `You won't pay anything before you've had ${g.target} enquiries from Answerd.`}</p>
          </div>
        ) : !payments ? (
          <div>
            <Button block disabled>
              <Lock /> Payments paused
            </Button>
            <p className="mt-1.5 text-center t-caption text-muted-ink">Answerd has paused new payments for a short while. Try again later.</p>
          </div>
        ) : anyFree ? (
          <ButtonLink href={checkoutHref("featured")} block>
            {planCta("featured", price, false)} <ExternalLink />
          </ButtonLink>
        ) : (
          <p className="text-center t-label font-normal text-muted-ink">No Featured slots free in your areas right now.</p>
        ))}

      <SmsConfirmSheet
        open={cancel}
        onClose={() => setCancel(false)}
        title="Cancel Featured?"
        body="You lose your Featured slot at once and it goes to the next business on the waitlist."
        confirmLabel="Cancel Featured"
        destructive
        onConfirm={() => {
          s.cancelSubscription(businessId, "featured")
          toast("Featured cancelled")
          setCancel(false)
        }}
      />
    </div>
  )
}
