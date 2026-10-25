"use client"
import type { SearchFilters, SearchResult } from "@/lib/search"
import type { PriceType } from "@/lib/types"
import { useStore } from "@/lib/store"
import { ResultCard } from "@/components/answerd/ResultCard"
import { listingBadges, openStatus, replyLine } from "@/lib/selectors"

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
 * C-12 / C-13 result card: the compact ResultCard with one Call icon button (Message lives on the listing).
 * The card body links to C-16 / C-17.
 */
export function ResultRow({ r, selected, onSelect, id }: { r: SearchResult; selected?: boolean; onSelect?: () => void; id?: string }) {
  const s = useStore()
  const l = r.listing
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const { line, tone } = useCardLine(r)
  const badges = listingBadges(s, l, s.clock, r.listing.categoryIds[0])
  return (
    <ResultCard
      id={id}
      listing={l}
      href={`/app/b/${l.slug}`}
      callHref={`/app/b/${l.slug}/call`}
      category={cat?.name ?? "Local business"}
      distance={r.distance}
      rating={r.rating}
      count={r.count}
      google={r.google}
      badges={badges}
      line={line}
      lineTone={tone}
      featured={r.featured}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
