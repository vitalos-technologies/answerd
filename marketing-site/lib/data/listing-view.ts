// What the listing page (W-06, W-07) and the result cards render, built from either source: the static
// fallback data (lib/data/seed.ts) or the Answerd API (lib/api). Pages only ever see these view models.
import { CATEGORIES, LEAF_CATEGORIES } from "./categories"
import { AREAS, DISTRICTS, areaBySlug, type Area } from "./geo"
import {
  availabilityFor,
  businessFor,
  cardData,
  isDeskLive,
  listingBadges,
  listingBySlug,
  listingRating,
  primaryCategory,
  replyLine,
  reviewsFor,
  serviceAreaFor,
  servicesFor,
  toneFor,
  trackedNumber,
  verifiedCredentials,
  type CardData,
  type Tone,
} from "./queries"
import { DEMO_NOW, addDays } from "./time"
import { initials as initialsOf, slugify } from "./format"
import type { BadgeKind, Category, DayHours, Layer, PriceType } from "./types"
import type { ApiListing, ApiListingCard, ApiReview } from "@/lib/api/types"

export interface ServiceView {
  id: string
  name: string
  description: string
  durationMin: number
  priceType: PriceType
  pricePence: number
  priceToPence?: number
  vatIncluded: boolean
  bookable: boolean
}

export interface ListingView {
  id: string
  slug: string
  name: string
  initials: string
  layer: Layer
  category: Category
  tone: Tone
  area?: Area
  /** Street and locality, then postcode: "10 Portland Road, South Norwood, SE25 4AA" */
  addressLine: string
  street: string
  locality: string
  postcode: string
  geo: { lat: number; lng: number }
  phonePublic: string
  description: string
  website?: string
  yearFounded?: number
  bookingMode?: "instant" | "request"
  rating: { rating: number; count: number; google: boolean }
  badges: BadgeKind[]
  desk: boolean
  reply: string
  trackedNumber: string
  services: ServiceView[]
  reviews: { id: string; stars: number; authorName: string; createdAt: string; text: string; reply?: string }[]
  /** Review counts for 5, 4, 3, 2 and 1 stars */
  distribution: { n: number; count: number }[]
  credentials: { id: string; label: string; number?: string; expiresAt?: string }[]
  serviceArea?: { radiusMiles: number; district: string; travelNote: string }
  hours: DayHours[]
  away?: { label: string; backOn: string }
}

const BADGES: BadgeKind[] = ["responds_instantly", "verified", "gas_safe", "niceic", "napit", "insured", "dbs", "unclaimed", "new"]

// ------------------------------------------------------------------ static fallback

export function seedListingView(slug: string): ListingView | undefined {
  const l = listingBySlug(slug)
  if (!l) return undefined
  const cat = primaryCategory(l)
  const reviews = reviewsFor(l)
  const avail = availabilityFor(l)
  const sa = serviceAreaFor(l)
  const biz = businessFor(l)
  const today = DEMO_NOW.slice(0, 10)
  const holiday = avail?.holidays.find((h) => today >= h.from && today <= h.to)
  const [street = l.address, locality = l.postcodeDistrict] = l.address.split(", ")
  return {
    id: l.id,
    slug: l.slug,
    name: l.name,
    initials: l.initials,
    layer: l.layer,
    category: cat,
    tone: toneFor(cat),
    area: areaBySlug(l.area),
    addressLine: `${l.address}, ${l.postcode}`,
    street,
    locality,
    postcode: l.postcode,
    geo: l.geo,
    phonePublic: l.phonePublic,
    description: l.description,
    website: biz?.website,
    yearFounded: biz?.yearFounded,
    bookingMode: biz?.bookingMode,
    rating: listingRating(l),
    badges: listingBadges(l),
    desk: isDeskLive(l),
    reply: replyLine(l),
    trackedNumber: trackedNumber(l),
    services: servicesFor(l),
    reviews,
    distribution: [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((x) => x.stars === n).length })),
    credentials: verifiedCredentials(l),
    serviceArea: sa && { radiusMiles: sa.radiusMiles, district: sa.basePostcode.split(" ")[0]!, travelNote: sa.travelNote },
    hours: avail?.weeklyHours ?? [],
    away: holiday && { label: holiday.label, backOn: addDays(`${holiday.to}T12:00:00.000Z`, 1) },
  }
}

export function seedCard(slug: string): CardData | undefined {
  const l = listingBySlug(slug)
  return l && cardData(l)
}

// ------------------------------------------------------------------ Answerd API

/** The site's category for an API category name ("Plumber"), so links and icons stay on the site's taxonomy. */
export function categoryForName(name: string): Category {
  const n = name.toLowerCase()
  return (
    LEAF_CATEGORIES.find((c) => c.name.toLowerCase() === n || c.plural.toLowerCase() === n) ??
    CATEGORIES.find((c) => c.name.toLowerCase() === n) ?? { id: `api-${slugify(name)}`, name, plural: `${name}s`, slug: slugify(`${name}s`), parentId: null, icon: "Store" }
  )
}

/** The most specific area covering a postcode district: a child area (South Norwood) before its city (Croydon). */
export function areaForDistrict(district: string | null | undefined): Area | undefined {
  if (!district) return undefined
  const all = AREAS.filter((a) => a.districts.includes(district))
  return all.find((a) => a.parent) ?? all[0]
}

/** The centre of an area, for API searches: the mean of its districts' centroids. */
export function areaCentre(area: Area) {
  const pts = area.districts.map((d) => DISTRICTS[d]).filter(Boolean) as { lat: number; lng: number }[]
  return { lat: pts.reduce((a, p) => a + p.lat, 0) / pts.length, lng: pts.reduce((a, p) => a + p.lng, 0) / pts.length }
}

function badgesOf(b: string[]): BadgeKind[] {
  return b.filter((x): x is BadgeKind => (BADGES as string[]).includes(x))
}

/** "+447700900321" → "07700 900321"; "+442079460502" → "020 7946 0502" */
export function ukPhone(e164: string | null) {
  if (!e164) return ""
  const d = e164.replace(/^\+44/, "0").replace(/\s/g, "")
  if (/^02/.test(d)) return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}`
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

const TINT_TONE: Record<string, Tone> = { "blue-tint": "blue", "teal-tint": "teal", "amber-tint": "amber", sky: "sky" }

/**
 * A result card from an API search item. Google (places) items are never passed here for cached pages:
 * they render only in the live, attributed GoogleResults island.
 */
export function apiCard(i: ApiListingCard): CardData {
  const cat = categoryForName(i.categoryName)
  return {
    slug: i.slug ?? "",
    name: i.name,
    initials: i.avatar?.initials || initialsOf(i.name),
    tone: TINT_TONE[i.avatar?.tint] ?? toneFor(cat),
    categoryName: cat.name,
    place: i.distanceMiles != null ? `${i.distanceMiles.toFixed(1)} mi` : "",
    layer: i.layer,
    rating: i.rating ?? 0,
    count: i.rating == null ? 0 : i.reviewCount,
    google: i.poweredByGoogle,
    badges: badgesOf(i.badges),
    reply: i.layer === "claimed" && i.replyTimeLine ? i.replyTimeLine : "Call to check availability",
    desk: i.deskLive,
  }
}

function replyText(r: ApiReview["reply"]) {
  if (!r) return undefined
  return typeof r === "string" ? r : r.body
}

export function apiListingView(l: ApiListing, reviews: ApiReview[]): ListingView {
  const cat = categoryForName(l.categoryName)
  const [street = l.address ?? "", locality = l.postcodeDistrict ?? ""] = (l.address ?? "").split(", ")
  const dist = l.reviewSummary?.distribution ?? [0, 0, 0, 0, 0] // index 0 is 1 star
  // Google-derived ratings are not cached into pages: a listing marked poweredByGoogle shows no rating here.
  const google = l.poweredByGoogle
  return {
    id: l.id ?? l.slug ?? "",
    slug: l.slug ?? "",
    name: l.name,
    initials: l.avatar?.initials || initialsOf(l.name),
    layer: l.layer,
    category: cat,
    tone: TINT_TONE[l.avatar?.tint] ?? toneFor(cat),
    area: areaForDistrict(l.postcodeDistrict),
    addressLine: [l.address, l.postcodeDistrict].filter(Boolean).join(", "),
    street,
    locality,
    postcode: l.postcodeDistrict ?? "",
    geo: l.geo,
    phonePublic: l.phonePublic ?? "",
    description: l.description ?? "",
    website: l.website ?? undefined,
    rating: google ? { rating: 0, count: 0, google: false } : { rating: l.reviewSummary?.average ?? l.rating ?? 0, count: l.reviewSummary?.count ?? l.reviewCount, google: false },
    badges: badgesOf(l.badges),
    desk: l.deskLive,
    reply: l.replyTimeLine ?? "Call to check availability",
    trackedNumber: ukPhone(l.phonePublic),
    services: [...l.services]
      .sort((a, b) => a.sort - b.sort)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        priceType: s.priceType,
        pricePence: s.pricePence ?? 0,
        priceToPence: s.priceMaxPence ?? undefined,
        vatIncluded: s.vatIncluded,
        bookable: s.bookable,
      })),
    reviews: google ? [] : reviews.map((r) => ({ id: r.id, stars: r.stars, authorName: r.authorName, createdAt: r.createdAt, text: r.body, reply: replyText(r.reply) })),
    distribution: [5, 4, 3, 2, 1].map((n) => ({ n, count: dist[n - 1] ?? 0 })),
    credentials: l.credentials.filter((c) => c.status === "verified").map((c) => ({ id: c.type, label: c.label, expiresAt: c.expiresAt ?? undefined })),
    serviceArea: l.serviceArea?.radiusMiles ? { radiusMiles: l.serviceArea.radiusMiles, district: l.postcodeDistrict ?? "", travelNote: l.serviceArea.travelNote ?? "" } : undefined,
    hours: l.hours,
    away: l.backOn ? { label: "Away", backOn: l.backOn } : undefined,
  }
}
