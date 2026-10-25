"use client"
import Link from "next/link"
import { ChevronRight, Phone } from "lucide-react"
import type { BadgeKind, Listing } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Badge } from "./Badges"
import { ListingAvatar } from "./Media"
import { Rating } from "./Rating"
import { fmtMiles } from "@/lib/geo"

export interface ResultCardProps {
  listing: Pick<Listing, "name" | "layer" | "initials"> & { categoryIds?: string[] }
  href: string
  /** Shows the single Call icon button on the right (C-12, C-13). */
  callHref?: string
  category: string
  distance: number | null
  rating: number
  count: number
  google?: boolean
  badges: BadgeKind[]
  line: string
  lineTone?: "teal" | "muted"
  featured?: boolean
  selected?: boolean
  onSelect?: () => void
  className?: string
  id?: string
}

// Small badge widths in px (11 px Inter label + icon, padding and border), measured at 390 wide
const BADGE_PX: Record<BadgeKind, number> = {
  responds_instantly: 127,
  verified: 74,
  gas_safe: 82,
  niceic: 72,
  napit: 69,
  insured: 75,
  dbs: 105,
  featured: 78,
  unclaimed: 75,
  open_now: 71,
  new: 57,
  desk: 60,
}

/** Up to two badges that fit on one line in the card's text column (228 px at 390), then "+n" inline. */
export function fitBadges(kinds: BadgeKind[], budget = 226) {
  const shown: BadgeKind[] = []
  let used = 0
  for (const k of kinds.slice(0, 2)) {
    const more = kinds.length - shown.length - 1 > 0 ? 22 : 0
    const w = (BADGE_PX[k] ?? 90) + (shown.length ? 4 : 0)
    if (shown.length && used + w + more > budget) break
    shown.push(k)
    used += w
  }
  return { shown, extra: kinds.length - shown.length }
}

/**
 * Compact result card, about 104 px (design review): avatar 48, name, rating · category · distance,
 * one badge row (2 badges plus "+n"), reply-time line, chevron and an optional Call icon button.
 * Unclaimed cards are flat with an "Unclaimed" chip; Places gap-fill shows "Powered by Google";
 * Featured cards carry an amber ring and a "Featured" tag.
 */
export function ResultCard({ listing, href, callHref, category, distance, rating, count, google, badges, line, lineTone = "muted", featured, selected, onSelect, className, id }: ResultCardProps) {
  const flat = listing.layer !== "claimed"
  const { shown, extra } = fitBadges(badges.filter((b) => b !== "featured"))
  return (
    <div
      id={id}
      onMouseEnter={onSelect}
      className={cn(
        "relative rounded-2xl transition-[box-shadow,border-color] duration-150",
        flat ? "border border-line bg-white/70" : "card",
        featured && "ring-1 ring-amber",
        selected && "ring-2 ring-blue",
        className,
      )}
    >
      <Link href={href} onFocus={onSelect} className={cn("group flex min-h-[104px] gap-3 rounded-2xl px-3 py-2.5 text-left", callHref ? "pr-14" : "pr-9")}>
        <ListingAvatar listing={listing} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5">
            <span className="truncate t-subhead">{listing.name}</span>
            {featured && <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-amber px-2 text-[11px] font-semibold leading-4 text-navy">Featured</span>}
          </p>
          <p className="flex min-w-0 items-center gap-1 t-caption text-muted-ink">
            <Rating value={rating} count={count} google={google} compact className="shrink-0" />
            <span aria-hidden>·</span>
            <span className="truncate">{category}</span>
            {distance !== null && <span className="shrink-0 tnum">· {fmtMiles(distance)}</span>}
          </p>
          {shown.length > 0 && (
            <div className="mt-1 flex items-center gap-1 overflow-hidden">
              {shown.map((k) => (
                <Badge key={k} kind={k} size="sm" />
              ))}
              {extra > 0 && (
                <span className="shrink-0 t-caption text-muted-ink tnum">
                  +{extra}
                  <span className="sr-only"> more</span>
                </span>
              )}
            </div>
          )}
          <p className={cn("mt-0.5 truncate t-caption", lineTone === "teal" ? "text-teal-ink" : "text-slate")}>{line}</p>
          {listing.layer === "places" && <p className="text-[11px] leading-4 text-muted-ink">Powered by Google</p>}
        </div>
        <ChevronRight className={cn("absolute size-5 text-muted-ink transition-transform group-hover:translate-x-0.5", callHref ? "bottom-3 right-4" : "right-3 top-1/2 -translate-y-1/2")} aria-hidden />
      </Link>
      {callHref && (
        <Link href={callHref} aria-label={`Call ${listing.name}`} className="absolute right-1.5 top-1.5 inline-flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-blue">
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-blue-tint text-blue transition-colors hover:bg-[#dbe5ff]">
            <Phone className="size-4" aria-hidden />
          </span>
        </Link>
      )}
    </div>
  )
}
