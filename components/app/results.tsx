"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, MessageCircle, Phone } from "lucide-react"
import type { SearchFilters, SearchResult } from "@/lib/search"
import type { PriceType } from "@/lib/types"
import { useStore } from "@/lib/store"
import { BadgeRow } from "@/components/answerd/Badges"
import { ListingAvatar } from "@/components/answerd/Media"
import { Rating } from "@/components/answerd/Rating"
import { fmtMiles } from "@/lib/geo"
import { listingBadges, openStatus, replyLine } from "@/lib/selectors"
import { cn } from "@/lib/utils"
import { signInHref } from "./helpers"

// ------------------------------------------------------------------ URL <-> filters

export interface ResultsQuery {
  q: string
  category: string | null
  filters: SearchFilters
}

export function parseResultsParams(sp: URLSearchParams): ResultsQuery {
  const list = (k: string) => (sp.get(k) ? sp.get(k)!.split(",").filter(Boolean) : [])
  const bbox = sp.get("bbox")?.split(",").map(Number)
  return {
    q: sp.get("q") ?? "",
    category: sp.get("category"),
    filters: {
      categoryId: sp.get("category"),
      openNow: sp.get("open") === "1",
      respondsInstantly: sp.get("instant") === "1",
      verified: sp.get("verified") === "1",
      minRating: sp.get("rating") ? Number(sp.get("rating")) : undefined,
      withinMiles: sp.get("within") ? Number(sp.get("within")) : undefined,
      availability: (sp.get("avail") as SearchFilters["availability"]) || null,
      credentials: list("creds") as SearchFilters["credentials"],
      priceTypes: list("price") as PriceType[],
      sort: (sp.get("sort") as SearchFilters["sort"]) || "best",
      bbox: bbox && bbox.length === 4 ? { north: bbox[0]!, south: bbox[1]!, east: bbox[2]!, west: bbox[3]! } : null,
    },
  }
}

export function buildResultsParams(q: ResultsQuery) {
  const p = new URLSearchParams()
  const f = q.filters
  if (q.q) p.set("q", q.q)
  if (q.category) p.set("category", q.category)
  if (f.openNow) p.set("open", "1")
  if (f.respondsInstantly) p.set("instant", "1")
  if (f.verified) p.set("verified", "1")
  if (f.minRating) p.set("rating", String(f.minRating))
  if (f.withinMiles) p.set("within", String(f.withinMiles))
  if (f.availability) p.set("avail", f.availability)
  if (f.credentials?.length) p.set("creds", f.credentials.join(","))
  if (f.priceTypes?.length) p.set("price", f.priceTypes.join(","))
  if (f.sort && f.sort !== "best") p.set("sort", f.sort)
  if (f.bbox) p.set("bbox", [f.bbox.north, f.bbox.south, f.bbox.east, f.bbox.west].map((n) => n.toFixed(4)).join(","))
  const s = p.toString()
  return s ? `?${s}` : ""
}

export function activeFilterCount(f: SearchFilters) {
  return [f.openNow, f.respondsInstantly, f.verified, !!f.minRating, !!f.withinMiles, !!f.availability, !!f.credentials?.length, !!f.priceTypes?.length].filter(Boolean).length
}

// ------------------------------------------------------------------ result row

export function useCardLine(r: SearchResult) {
  const s = useStore()
  const l = r.listing
  if (l.layer !== "claimed") return { line: "Hasn't joined Answerd yet", tone: "muted" as const }
  if (r.desk) return { line: "Replies in under a minute", tone: "teal" as const }
  const os = openStatus(s, l, s.clock)
  return { line: os.label ? `${os.label} · ${replyLine(s, l).replace("Usually replies", "replies")}` : replyLine(s, l), tone: os.open ? ("teal" as const) : ("muted" as const) }
}

/**
 * Result card with quick Call and Message for claimed listings (two taps to a human).
 * The card body links to C-16 / C-17.
 */
export function ResultRow({ r, selected, onSelect, id, compact }: { r: SearchResult; selected?: boolean; onSelect?: () => void; id?: string; compact?: boolean }) {
  const s = useStore()
  const router = useRouter()
  const l = r.listing
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const { line, tone } = useCardLine(r)
  const badges = listingBadges(s, l, s.clock, r.listing.categoryIds[0])
  const flat = l.layer !== "claimed"
  const href = `/app/b/${l.slug}`
  return (
    <div
      id={id}
      onMouseEnter={onSelect}
      className={cn(
        "rounded-2xl transition-[box-shadow,border-color] duration-150",
        flat ? "border border-line bg-white/70" : "card",
        r.featured && "ring-1 ring-amber",
        selected && "ring-2 ring-blue",
      )}
    >
      <Link href={href} onFocus={onSelect} className="group flex gap-3 p-3.5 pb-3 text-left">
        <ListingAvatar initials={l.initials} hue={l.hue} />
        <div className="min-w-0 flex-1">
          {r.featured && <p className="t-caption text-amber-ink">Featured</p>}
          <p className="t-subhead truncate">{l.name}</p>
          <p className="t-caption text-muted-ink">
            {cat?.name ?? "Local business"}
            {r.distance !== null && <span className="tnum"> · {fmtMiles(r.distance)}</span>}
          </p>
          <Rating value={r.rating} count={r.count} google={r.google} className="mt-1" />
          {!compact && <BadgeRow kinds={badges.filter((b) => b !== "featured")} max={3} className="mt-1.5" />}
          <p className={cn("mt-1.5 t-caption", tone === "teal" ? "text-teal-ink" : "text-slate")}>{line}</p>
          {l.layer === "places" && <p className="mt-1 text-[11px] leading-4 text-muted-ink">Powered by Google</p>}
        </div>
        <ChevronRight className="mt-4 size-5 shrink-0 text-muted-ink transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
      {!compact && (
        <div className="flex gap-2 border-t border-line px-3.5 py-2">
          <Link href={`/app/b/${l.slug}/call`} className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full t-label text-navy hover:bg-sky" aria-label={`Call ${l.name}`}>
            <Phone className="size-4 text-blue" aria-hidden /> Call
          </Link>
          {l.layer === "claimed" ? (
            <button
              type="button"
              onClick={() => router.push(s.session.userId ? `/app/b/${l.slug}/enquiry` : signInHref(`/app/b/${l.slug}/enquiry`))}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full t-label text-navy hover:bg-sky"
              aria-label={`Message ${l.name}`}
            >
              <MessageCircle className="size-4 text-blue" aria-hidden /> Message
            </button>
          ) : (
            <Link href={href} className="inline-flex h-11 flex-1 items-center justify-center rounded-full t-label text-muted-ink hover:bg-sky">
              See details
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
