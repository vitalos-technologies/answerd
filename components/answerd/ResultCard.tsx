"use client"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { BadgeKind, Listing } from "@/lib/types"
import { cn } from "@/lib/utils"
import { BadgeRow } from "./Badges"
import { ListingAvatar } from "./Media"
import { Rating } from "./Rating"
import { fmtMiles } from "@/lib/geo"

export interface ResultCardProps {
  listing: Pick<Listing, "name" | "layer" | "initials" | "hue">
  href: string
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

/**
 * Photo or initials avatar 56, name, category · distance, rating, badges, one line, chevron.
 * Unclaimed cards are flat with an "Unclaimed" chip; Places gap-fill shows "Powered by Google".
 */
export function ResultCard({ listing, href, category, distance, rating, count, google, badges, line, lineTone = "muted", featured, selected, onSelect, className, id }: ResultCardProps) {
  const flat = listing.layer !== "claimed"
  return (
    <Link
      id={id}
      href={href}
      onFocus={onSelect}
      onMouseEnter={onSelect}
      className={cn(
        "group flex gap-3 rounded-2xl p-3.5 text-left transition-[box-shadow,border-color] duration-150",
        flat ? "border border-line bg-white/70" : "card",
        featured && "ring-1 ring-amber",
        selected && "ring-2 ring-blue",
        className,
      )}
    >
      <ListingAvatar initials={listing.initials} hue={listing.hue} />
      <div className="min-w-0 flex-1">
        {featured && <p className="t-caption text-amber-ink">Featured</p>}
        <p className="t-subhead truncate">{listing.name}</p>
        <p className="t-caption text-muted-ink">
          {category}
          {distance !== null && <span className="tnum"> · {fmtMiles(distance)}</span>}
        </p>
        <Rating value={rating} count={count} google={google} className="mt-1" />
        <BadgeRow kinds={badges.filter((b) => b !== "featured")} max={3} className="mt-1.5" />
        <p className={cn("mt-1.5 t-caption", lineTone === "teal" ? "text-teal-ink" : "text-slate")}>{line}</p>
        {listing.layer === "places" && <p className="mt-1 text-[11px] leading-4 text-muted-ink">Powered by Google</p>}
      </div>
      <ChevronRight className="mt-4 size-5 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}
