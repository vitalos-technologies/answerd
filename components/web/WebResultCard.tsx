"use client"
import * as React from "react"
import Link from "next/link"
import { CalendarPlus, ChevronRight, MessageCircle, Phone } from "lucide-react"
import type { SearchResult } from "@/lib/search"
import { useStore } from "@/lib/store"
import { BadgeRow } from "@/components/answerd/Badges"
import { ListingAvatar } from "@/components/answerd/Media"
import { Rating } from "@/components/answerd/Rating"
import { useCardLine } from "@/components/app/results"
import { listingBadges, servicesFor } from "@/lib/selectors"
import { fmtMiles } from "@/lib/geo"
import { cn } from "@/lib/utils"

/**
 * Web result card (W-02, W-03, W-04): the C-12 card with Call, Message and Book on claimed listings.
 * Props: r (a search result), selected/onSelect to sync with the map, id for scroll targets.
 */
export function WebResultCard({ r, selected, onSelect, id }: { r: SearchResult; selected?: boolean; onSelect?: () => void; id?: string }) {
  const s = useStore()
  const l = r.listing
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const { line, tone } = useCardLine(r)
  const badges = listingBadges(s, l, s.clock, l.categoryIds[0]).filter((b) => b !== "featured")
  const flat = l.layer !== "claimed"
  const bookable = !flat && servicesFor(s, l.businessId).some((x) => x.bookable)
  const action = "inline-flex h-11 items-center justify-center gap-1.5 rounded-full px-4 t-label text-navy hover:bg-sky"
  return (
    <article
      id={id}
      onMouseEnter={onSelect}
      className={cn("rounded-2xl transition-[box-shadow,border-color] duration-150", flat ? "border border-line bg-white/70" : "card", r.featured && "ring-1 ring-amber", selected && "ring-2 ring-blue")}
      aria-label={l.name}
    >
      <Link href={`/b/${l.slug}`} onFocus={onSelect} className="group flex gap-4 p-4 pb-3">
        <ListingAvatar initials={l.initials} hue={l.hue} />
        <div className="min-w-0 flex-1">
          {r.featured && <p className="t-caption text-amber-ink">Featured</p>}
          <h3 className="t-subhead truncate group-hover:underline">{l.name}</h3>
          <p className="t-caption text-muted-ink">
            {cat?.name ?? "Local business"}
            {r.distance !== null && <span className="tnum"> · {fmtMiles(r.distance)}</span>}
            <span> · {l.address.split(", ").at(-1)}</span>
          </p>
          <Rating value={r.rating} count={r.count} google={r.google} className="mt-1" />
          <BadgeRow kinds={badges} max={4} className="mt-1.5" />
          <p className={cn("mt-1.5 t-caption", tone === "teal" ? "text-teal-ink" : "text-slate")}>{line}</p>
          {l.layer === "places" && <p className="mt-1 text-[11px] leading-4 text-muted-ink">Powered by Google</p>}
        </div>
        <ChevronRight className="mt-4 size-5 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
      <div className="flex flex-wrap gap-1 border-t border-line px-3 py-2">
        <Link href={`/b/${l.slug}?call=1`} className={action} aria-label={`Call ${l.name}`}>
          <Phone className="size-4 text-blue" aria-hidden /> Call
        </Link>
        {flat ? (
          <Link href={`/b/${l.slug}`} className={cn(action, "text-muted-ink")}>
            See details
          </Link>
        ) : (
          <>
            <Link href={`/b/${l.slug}?message=1`} className={action} aria-label={`Message ${l.name}`}>
              <MessageCircle className="size-4 text-blue" aria-hidden /> Message
            </Link>
            {bookable && (
              <Link href={`/b/${l.slug}/book`} className={action} aria-label={`Book ${l.name}`}>
                <CalendarPlus className="size-4 text-blue" aria-hidden /> Book
              </Link>
            )}
          </>
        )}
      </div>
    </article>
  )
}
