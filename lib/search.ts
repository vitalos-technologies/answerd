import type { DemoData } from "./seed"
import type { Listing, PriceType } from "./types"
import { categoriesForText } from "./keywords"
import { milesBetween } from "./geo"
import { addDays, dayKey } from "./time"
import {
  distanceMiles,
  isDeskLive,
  isFeatured,
  listingBadges,
  listingRating,
  openStatus,
  servicesFor,
  slotsForDay,
  verifiedCredentials,
} from "./selectors"

export interface SearchFilters {
  openNow?: boolean
  respondsInstantly?: boolean
  verified?: boolean
  minRating?: number
  withinMiles?: number
  availability?: "today" | "this_week" | null
  credentials?: ("gas_safe" | "niceic" | "insurance" | "dbs")[]
  priceTypes?: PriceType[]
  categoryId?: string | null
  sort?: "best" | "nearest" | "top"
  bbox?: { north: number; south: number; east: number; west: number } | null
}

export interface SearchResult {
  listing: Listing
  distance: number | null
  featured: boolean
  desk: boolean
  rating: number
  count: number
  google: boolean
  tier: number
}

type S = Pick<DemoData, keyof DemoData>

export function placesHidden(s: S) {
  const today = s.placesDays.at(-1)
  return !s.settings.gapFillOn || (today ? today.spendPence >= s.settings.placesCapPence : false)
}

export function queryCategories(s: S, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const fromKeywords = categoriesForText(q)
  const direct = s.categories.filter(
    (c) => c.parentId && (c.name.toLowerCase().includes(q) || c.plural.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()) || q.includes(c.plural.toLowerCase())),
  )
  return [...new Set([...fromKeywords, ...direct.map((c) => c.id)])]
}

/** Ranks featured first, then desk-enabled and verified, then claimed, seeded and Places; distance breaks ties. */
export function search(s: S, query: string, filters: SearchFilters = {}): SearchResult[] {
  const q = query.trim().toLowerCase().replace(/\bnear\b.*$/, "").trim()
  const cats = filters.categoryId ? [filters.categoryId] : queryCategories(s, q)
  const now = s.clock
  const hidePlaces = placesHidden(s)
  const radius = filters.withinMiles ?? 25

  let pool = s.listings.filter((l) => !l.suspended && !l.unpublished && !l.mergedInto)
  if (hidePlaces) pool = pool.filter((l) => l.layer !== "places")
  if (q || filters.categoryId) {
    pool = pool.filter((l) => {
      if (l.categoryIds.some((c) => cats.includes(c))) return true
      if (!q) return false
      if (l.name.toLowerCase().includes(q)) return true
      return servicesFor(s, l.businessId).some((x) => x.name.toLowerCase().includes(q))
    })
  }

  const results: SearchResult[] = pool.map((l) => {
    const r = listingRating(s, l)
    const featured = isFeatured(s, l, filters.categoryId ?? cats[0])
    const desk = isDeskLive(s, l)
    const verified = l.layer === "claimed" && l.badges.includes("verified")
    const tier = featured ? 0 : desk && verified ? 1 : l.layer === "claimed" ? 2 : l.layer === "seeded" ? 3 : 4
    return { listing: l, distance: distanceMiles(s, l), featured, desk, rating: r.rating, count: r.count, google: r.google, tier }
  })

  const loc = s.session.location
  let out = results.filter((r) => {
    if (loc && r.distance !== null && r.distance > radius) return false
    if (filters.bbox) {
      const { lat, lng } = r.listing.geo
      const b = filters.bbox
      if (lat > b.north || lat < b.south || lng > b.east || lng < b.west) return false
    }
    if (filters.openNow && !openStatus(s, r.listing, now).open) return false
    if (filters.respondsInstantly && !r.desk) return false
    if (filters.verified && !(r.listing.layer === "claimed" && r.listing.badges.includes("verified"))) return false
    if (filters.minRating && r.rating < filters.minRating) return false
    if (filters.credentials?.length) {
      const badges = listingBadges(s, r.listing, now)
      const map = { gas_safe: "gas_safe", niceic: "niceic", insurance: "insured", dbs: "dbs" } as const
      if (!filters.credentials.every((c) => badges.includes(map[c]))) return false
    }
    if (filters.priceTypes?.length) {
      const svcs = servicesFor(s, r.listing.businessId)
      if (!svcs.some((x) => filters.priceTypes!.includes(x.priceType))) return false
    }
    if (filters.availability) {
      if (!r.listing.businessId) return false
      const days = filters.availability === "today" ? 1 : 7
      const svc = servicesFor(s, r.listing.businessId).find((x) => x.bookable)
      let any = false
      for (let i = 0; i < days && !any; i++) any = slotsForDay(s, r.listing, svc, dayKey(addDays(now, i))).length > 0
      if (!any) return false
    }
    return true
  })

  const sort = filters.sort ?? "best"
  const d = (r: SearchResult) => r.distance ?? 999
  out = out.sort((a, b) => {
    if (sort === "nearest") return d(a) - d(b)
    if (sort === "top") return b.rating - a.rating || d(a) - d(b)
    return a.tier - b.tier || d(a) - d(b)
  })
  return out
}

/** Desk-live listings within n miles of the active location. */
export function respondsInstantlyNear(s: S, miles = 5) {
  const loc = s.session.location
  return s.listings
    .filter((l) => isDeskLive(s, l) && !l.suspended)
    .map((l) => ({ l, d: loc ? milesBetween(loc, l.geo) : null }))
    .filter((x) => x.d === null || x.d <= miles)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    .map((x) => x.l)
}

export function hasVerifiedCredential(s: S, listing: Listing, type: string) {
  return verifiedCredentials(s, listing.businessId, s.clock).some((c) => c.type === type)
}
