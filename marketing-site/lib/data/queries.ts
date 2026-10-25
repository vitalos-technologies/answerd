// Derived data for the public pages, ported from the prototype's lib/selectors.ts, lib/search.ts and
// components/web/data.ts. Server-only (it reads the seed). Pages pass plain view models to components.
import { seed } from "./seed"
import { CATEGORIES, CATEGORY_GROUPS, LEAF_CATEGORIES, categoryById } from "./categories"
import { AREAS, areaBySlug, type Area } from "./geo"
import { DEMO_NOW, LAUNCH_DATE, MS_DAY, addDays, ms } from "./time"
import { gbp, isLandline, maskPhone } from "./format"
import { findCompany } from "./companies-house"
import type { BadgeKind, Category, Listing } from "./types"

export const GATE_ENQUIRIES = 10
export const GATE_DAYS = 60

// ------------------------------------------------------------------ lookups

export function listingBySlug(slug: string) {
  return seed().listings.find((l) => l.slug === slug)
}
export function businessFor(l: Listing) {
  return seed().businesses.find((b) => b.listingId === l.id)
}
export function deskFor(l: Listing) {
  return seed().desks.find((d) => d.businessId === l.businessId)
}
export function isDeskLive(l: Listing) {
  return deskFor(l)?.status === "live"
}
export function servicesFor(l: Listing) {
  return seed()
    .services.filter((s) => s.businessId === l.businessId)
    .sort((a, b) => a.order - b.order)
}
export function availabilityFor(l: Listing) {
  return seed().availability.find((a) => a.businessId === l.businessId)
}
export function serviceAreaFor(l: Listing) {
  return seed().serviceAreas.find((a) => a.businessId === l.businessId)
}
export function primaryCategory(l: Listing) {
  return categoryById(l.categoryIds[0]!)!
}
export function groupOf(cat: Category) {
  return CATEGORY_GROUPS.find((g) => g.id === cat.parentId)
}

export function listingRating(l: Listing) {
  if (l.layer === "places") return { rating: l.googleRating ?? 0, count: l.googleCount ?? 0, google: true }
  const live = seed().reviews.filter((r) => r.listingId === l.id)
  if (!live.length) return { rating: 0, count: 0, google: false }
  const avg = live.reduce((a, r) => a + r.stars, 0) / live.length
  return { rating: Math.round(avg * 10) / 10, count: live.length, google: false }
}

export function reviewsFor(l: Listing) {
  return seed()
    .reviews.filter((r) => r.listingId === l.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function verifiedCredentials(l: Listing) {
  return seed().credentials.filter((c) => c.businessId === l.businessId && c.status === "verified" && (!c.expiresAt || ms(c.expiresAt) > ms(DEMO_NOW)))
}

const CRED_BADGE: Partial<Record<string, BadgeKind>> = { gas_safe: "gas_safe", niceic: "niceic", napit: "napit", insurance: "insured", dbs: "dbs" }

export function listingBadges(l: Listing): BadgeKind[] {
  const out: BadgeKind[] = []
  if (isDeskLive(l)) out.push("responds_instantly")
  if (l.layer === "claimed" && l.verified) out.push("verified")
  for (const c of verifiedCredentials(l)) {
    const b = CRED_BADGE[c.type]
    if (b && !out.includes(b)) out.push(b)
  }
  if (l.layer !== "claimed") out.push("unclaimed")
  if (l.layer === "claimed" && ms(DEMO_NOW) - ms(l.createdAt) < 14 * MS_DAY) out.push("new")
  return out
}

export function replyLine(l: Listing) {
  if (isDeskLive(l)) return "Usually replies in 1 min"
  const m = l.replyMins
  if (m < 60) return `Usually replies in ${m} min`
  const h = Math.round(m / 60)
  return `Usually replies in ${h} hour${h > 1 ? "s" : ""}`
}

/** The Answerd number calls go through: the desk number if there is one, else the shared tracking line. */
export function trackedNumber(l: Listing) {
  return deskFor(l)?.number || "020 7946 0800"
}

/** Brand tint for a listing's avatar and cover band, chosen by category group so it is stable. */
export type Tone = "blue" | "teal" | "amber" | "sky"
const GROUP_TONE: Record<string, Tone> = { "home-trades": "blue", "cleaning-domestic": "teal", "auto-delivery": "amber", "personal-beauty": "sky", "everything-else": "teal" }
export function toneFor(cat: Category): Tone {
  return GROUP_TONE[cat.parentId ?? ""] ?? "blue"
}

// ------------------------------------------------------------------ areas and lists

export const CITY_AREAS = AREAS.filter((a) => !a.parent)

export function childAreas(area: Area) {
  return AREAS.filter((a) => a.parent === area.slug)
}
export function parentArea(area: Area) {
  return area.parent ? areaBySlug(area.parent) : undefined
}
/** Neighbours, parent and children: for "Nearby areas" and thin areas. */
export function nearbyAreas(area: Area): Area[] {
  const out: Area[] = []
  const add = (a?: Area) => {
    if (a && a.slug !== area.slug && !out.some((x) => x.slug === a.slug)) out.push(a)
  }
  area.neighbours.forEach((n) => add(areaBySlug(n)))
  add(parentArea(area))
  childAreas(area).forEach(add)
  return out
}

export function listingsInArea(area: Area) {
  return seed().listings.filter((l) => area.districts.includes(l.postcodeDistrict))
}
export function categoryListings(categoryId: string, area?: Area) {
  return seed().listings.filter((l) => l.categoryIds.includes(categoryId) && (!area || area.districts.includes(l.postcodeDistrict)))
}

/** Search ranking from C-12 without a location: desk-enabled and verified first, then claimed, seeded and Places; rating breaks ties. */
export function rank(list: Listing[]) {
  const tier = (l: Listing) => (isDeskLive(l) && l.verified ? 0 : l.layer === "claimed" ? 1 : l.layer === "seeded" ? 2 : 3)
  return [...list].sort((a, b) => tier(a) - tier(b) || listingRating(b).rating - listingRating(a).rating || a.name.localeCompare(b.name))
}

// ------------------------------------------------------------------ view models

export interface CardData {
  slug: string
  name: string
  initials: string
  tone: Tone
  categoryName: string
  place: string
  layer: Listing["layer"]
  rating: number
  count: number
  google: boolean
  badges: BadgeKind[]
  reply: string
  desk: boolean
}

export function cardData(l: Listing): CardData {
  const cat = primaryCategory(l)
  const r = listingRating(l)
  return {
    slug: l.slug,
    name: l.name,
    initials: l.initials,
    tone: toneFor(cat),
    categoryName: cat.name,
    place: l.address.split(", ").at(-1) ?? l.postcodeDistrict,
    layer: l.layer,
    rating: r.rating,
    count: r.count,
    google: r.google,
    badges: listingBadges(l),
    reply: l.layer === "claimed" ? replyLine(l) : "Call to check availability",
    desk: isDeskLive(l),
  }
}

/** W-01 "Businesses that respond instantly near you": desk-live listings, best rated first. */
export function instantResponders(n = 6) {
  return rank(seed().listings.filter(isDeskLive)).slice(0, n).map(cardData)
}

// ------------------------------------------------------------------ prices (only what businesses list)

export interface PriceRow {
  name: string
  low: number
  high: number
  businesses: number
  vat: "inc" | "ex" | "mixed"
  hourly: boolean
}

export function priceGuide(categoryId: string, area?: Area): PriceRow[] {
  const listings = categoryListings(categoryId, area).filter((l) => l.layer === "claimed")
  const rows = new Map<string, { low: number; high: number; biz: Set<string>; inc: number; ex: number; hourly: boolean }>()
  for (const l of listings) {
    for (const svc of servicesFor(l)) {
      if (svc.priceType === "quote") continue
      const r = rows.get(svc.name) ?? { low: Infinity, high: 0, biz: new Set<string>(), inc: 0, ex: 0, hourly: false }
      r.low = Math.min(r.low, svc.pricePence)
      r.high = Math.max(r.high, svc.priceToPence ?? svc.pricePence)
      r.biz.add(l.id)
      if (svc.vatIncluded) r.inc++
      else r.ex++
      if (svc.priceType === "hourly") r.hourly = true
      rows.set(svc.name, r)
    }
  }
  return [...rows.entries()]
    .map(([name, r]) => ({ name, low: r.low, high: r.high, businesses: r.biz.size, vat: r.inc && r.ex ? "mixed" : r.inc ? "inc" : "ex", hourly: r.hourly }) as PriceRow)
    .sort((a, b) => b.businesses - a.businesses || a.low - b.low)
    .slice(0, 6)
}

export function priceText(r: PriceRow) {
  const unit = r.hourly ? "/hour" : ""
  const range = r.low === r.high ? `${gbp(r.low)}${unit}` : `${gbp(r.low)} to ${gbp(r.high)}${unit}`
  const vat = r.vat === "inc" ? "inc VAT" : r.vat === "ex" ? "ex VAT" : "VAT shown by each business"
  return `${range} ${vat}`
}

// ------------------------------------------------------------------ FAQs (generated per page, as in the prototype)

export interface Faq {
  q: string
  a: string
}

export function categoryFaqs(cat: Category, area?: Area): Faq[] {
  const where = area ? ` in ${area.name}` : " near me"
  const plural = cat.plural.toLowerCase()
  return [
    { q: `How do I find ${plural}${where}?`, a: `Search the Answerd app for “${cat.name.toLowerCase()}” with your postcode. You'll see businesses${area ? ` covering ${area.name}` : " near you"}, their prices, reviews and how quickly they reply. Call, message or book in two taps.` },
    { q: `How much do ${plural} cost${area ? ` in ${area.name}` : ""}?`, a: "Prices are set by each business and shown on their listing with VAT stated. Where a job needs a look first, they'll send a quote in the chat before you agree to anything." },
    { q: "What does “Responds instantly” mean?", a: "The business has an Answerd front desk. If they can't pick up, the desk answers calls and messages straight away, says it's an AI, and can offer times or hand you to the owner." },
    { q: "Are the businesses checked?", a: "Claimed businesses verify they own the listing. Credentials such as Gas Safe, NICEIC, insurance and DBS show a badge only after Answerd has checked them, and the badge disappears if it expires." },
    { q: "Can I leave a review?", a: "Yes, after a completed booking or a tracked call of more than a minute. That keeps reviews to real customers." },
  ]
}

export function areaFaqs(area: Area): Faq[] {
  return [
    { q: `What services can I find in ${area.name}?`, a: `Everything from plumbers and electricians to cleaners, mechanics and barbers. Pick a category to see who covers ${area.name}.` },
    { q: "Is Answerd free to use?", a: "Yes. Searching, calling, messaging and booking are free for customers. You pay the business directly for the job." },
    { q: "Can businesses list for free?", a: "Yes. Any business can claim or add a free listing and see the enquiries Answerd sends them." },
  ]
}

// ------------------------------------------------------------------ Chat with Answerd suggestions (W-25 placeholder)

export interface Suggestion {
  slug: string
  name: string
  initials: string
  tone: Tone
  meta: string
  why: string
}

const CHIP_CATEGORY: Record<string, string> = {
  "Boiler not working": "heating-engineers",
  "End of tenancy clean": "end-of-tenancy-cleaners",
  "Car won't start": "mobile-mechanics",
  "Haircut today": "barbers",
}

const CRED_SHORT: Record<string, string> = { gas_safe: "Gas Safe", niceic: "NICEIC", napit: "NAPIT", insurance: "Insured", dbs: "DBS checked" }

/** Up to three businesses per chip, ranked like Q-03, each with a one-line reason built from its real badges. */
export function askSuggestions(chips: readonly string[]): Record<string, Suggestion[]> {
  const out: Record<string, Suggestion[]> = {}
  for (const chip of chips) {
    const cat = CHIP_CATEGORY[chip]
    if (!cat) continue
    out[chip] = rank(categoryListings(cat))
      .slice(0, 3)
      .map((l) => {
        const c = cardData(l)
        const creds = [...new Set(verifiedCredentials(l).map((x) => CRED_SHORT[x.type]).filter(Boolean))]
        const why = [...creds, l.layer === "claimed" ? replyLine(l).replace("Usually replies", "replies") : "not on Answerd yet, call only"].join(", ")
        return { slug: c.slug, name: c.name, initials: c.initials, tone: c.tone, meta: `${c.categoryName} · ${c.place}${c.count ? ` · ${c.rating.toFixed(1)}★` : ""}`, why: why.charAt(0).toUpperCase() + why.slice(1) }
      })
  }
  return out
}

// ------------------------------------------------------------------ claim flow (W-11)

export interface Claimable {
  id: string
  slug: string
  name: string
  initials: string
  tone: Tone
  categoryName: string
  address: string
  district: string
  layer: Listing["layer"]
  masked: string
  landline: boolean
  ltd: boolean
  /** Calls, messages and bookings Answerd logged for it this month (the prototype's "people tried to reach you"). */
  triedThisMonth: number
  source: string
}

export function enquiriesThisMonth(l: Listing) {
  const month = DEMO_NOW.slice(0, 7)
  return seed().enquiries.filter((e) => e.listingId === l.id && e.at.slice(0, 7) === month).length
}

/** Every listing as the claim flow needs it. Claimed listings come back as "taken" (dispute only). */
export function claimables(): Claimable[] {
  return seed().listings.map((l) => {
    const cat = primaryCategory(l)
    return {
      id: l.id,
      slug: l.slug,
      name: l.name,
      initials: l.initials,
      tone: toneFor(cat),
      categoryName: cat.name,
      address: `${l.address}, ${l.postcode}`,
      district: l.postcodeDistrict,
      layer: l.layer,
      masked: maskPhone(l.phonePublic),
      landline: isLandline(l.phonePublic),
      ltd: /\b(ltd|limited)\b/i.test(l.name) || !!findCompany(l.name),
      triedThisMonth: enquiriesThisMonth(l),
      source: l.layer === "claimed" ? "On Answerd" : l.layer === "places" ? "From Google" : "From Companies House",
    }
  })
}

export function gateFor(l: Listing) {
  const count = seed().enquiries.filter((e) => e.listingId === l.id).length
  const gateDate = addDays(LAUNCH_DATE, GATE_DAYS)
  return { count, gateDate, daysOk: ms(DEMO_NOW) >= ms(gateDate) }
}

export { CATEGORIES, LEAF_CATEGORIES, CATEGORY_GROUPS, AREAS, areaBySlug }
