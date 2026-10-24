"use client"
import * as React from "react"
import { MapPin, Phone, ShieldAlert, Users } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { Banner } from "@/components/answerd/Feedback"
import { ResultCard } from "@/components/answerd/ResultCard"
import { MockMap } from "@/components/answerd/MockMap"
import { claimState, enquiriesThisMonth, sourceHint } from "@/components/app/claim"
import { useStore } from "@/lib/store"
import { listingBadges, listingRating } from "@/lib/selectors"
import { cn } from "@/lib/utils"

/**
 * B-02 body: the listing as customers see it, the enquiries-waiting teaser (from real Enquiry records),
 * Yes, claim it and Not mine.
 */
export function ClaimPreview({ listingId, onClaim, onNotMine, onOpenMine, listingHref, className }: { listingId: string; onClaim: () => void; onNotMine: () => void; onOpenMine?: () => void; listingHref: (slug: string) => string; className?: string }) {
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  if (!l) {
    return (
      <div className={className}>
        <Banner tone="error" title="We couldn't find that listing">
          It may have been merged or removed. Search again to find your business.
        </Banner>
        <Button block variant="secondary" className="mt-4" onClick={onNotMine}>
          Search again
        </Button>
      </div>
    )
  }
  const state = claimState(s, l)
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const r = listingRating(s, l)
  const tried = enquiriesThisMonth(s, l.id).length

  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <h1 className="t-title">Is this you?</h1>
        <p className="mt-1 t-body text-slate">This is how customers see {l.name} on Answerd today.</p>
      </div>
      <ResultCard listing={l} href={listingHref(l.slug)} category={cat?.name ?? "Local service"} distance={null} rating={r.rating} count={r.count} google={r.google} badges={listingBadges(s, l, s.clock)} line={sourceHint(l)} />
      <ul className="space-y-2 t-label font-normal text-slate">
        <li className="flex items-center gap-2">
          <MapPin className="size-4 shrink-0 text-muted-ink" aria-hidden /> {l.address}, {l.postcode}
        </li>
        <li className="flex items-center gap-2">
          <Phone className="size-4 shrink-0 text-muted-ink" aria-hidden /> <span className="tnum">{l.phonePublic}</span>
        </li>
      </ul>
      <MockMap points={[{ id: l.id, lat: l.geo.lat, lng: l.geo.lng, label: l.name }]} center={l.geo} spanMiles={1.5} height={150} showSearchArea={false} ariaLabel={`Map showing ${l.name}`} />

      {state === "taken" ? (
        <Banner tone="warning" icon={<ShieldAlert className="size-5" aria-hidden />} title="Already claimed">
          Someone else has claimed this business. If it&apos;s yours, go back and choose Dispute this claim.
        </Banner>
      ) : state === "mine" ? (
        <Banner tone="success" title="This one's yours">
          You already manage {l.name}.
        </Banner>
      ) : (
        <div className="flex gap-3 rounded-2xl bg-teal-tint p-4">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-teal-ink">
            <Users className="size-5" aria-hidden />
          </span>
          <div>
            <p className="t-subhead tnum">{tried ? `${tried} ${tried === 1 ? "person" : "people"} tried to reach you this month` : "Be ready when customers call"}</p>
            <p className="mt-0.5 t-label font-normal text-slate">{tried ? "Claim it free to see who, when, and what they needed." : "Claim it free so calls, messages and bookings reach you."}</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {state === "free" && (
          <Button block onClick={onClaim}>
            Yes, claim it
          </Button>
        )}
        {state === "mine" && onOpenMine && (
          <Button block onClick={onOpenMine}>
            Open business mode
          </Button>
        )}
        <Button block variant="secondary" onClick={onNotMine}>
          {state === "free" ? "Not mine" : "Back to search"}
        </Button>
      </div>
    </div>
  )
}
