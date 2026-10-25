// Server-safe data helpers for the public website (W-01 to W-27).
// SEO pages render from the deterministic seed; interactive parts read the client store.
import { createSeed, type DemoData } from "@/lib/seed"
import { LEAF_CATEGORIES, CATEGORY_GROUPS } from "@/lib/categories"
import { AREAS, areaBySlug, type Area } from "@/lib/geo"
import { listingRating, servicesFor } from "@/lib/selectors"
import { gbp } from "@/lib/format"
import type { Category, Listing } from "@/lib/types"

export const SITE = "https://answerd.vitalos.co.uk"
export const SITE_HOST = "answerd.vitalos.co.uk"

type S = Pick<DemoData, keyof DemoData>

let cached: DemoData | null = null
/** The seed, built once per server process (createSeed is deterministic). */
export function seed(): DemoData {
  if (!cached) cached = createSeed()
  return cached
}

export function categoryBySlug(slug: string): Category | undefined {
  return LEAF_CATEGORIES.find((c) => c.slug === slug)
}

export function groupOf(cat: Category) {
  return CATEGORY_GROUPS.find((g) => g.id === cat.parentId)
}

export const CITY_AREAS = AREAS.filter((a) => !a.parent)

export function childAreas(area: Area) {
  return AREAS.filter((a) => a.parent === area.slug)
}

export function parentArea(area: Area) {
  return area.parent ? areaBySlug(area.parent) : undefined
}

/** Neighbours, parent and children: used when an area is thin and for "Nearby areas". */
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

export function isLive(l: Listing) {
  return !l.suspended && !l.unpublished && !l.mergedInto
}

export function listingsInArea(s: S, area: Area) {
  return s.listings.filter((l) => isLive(l) && area.districts.includes(l.postcodeDistrict))
}

export function categoryListings(s: S, categoryId: string, area?: Area) {
  return s.listings.filter((l) => isLive(l) && l.categoryIds.includes(categoryId) && (!area || area.districts.includes(l.postcodeDistrict)))
}

const LAYER_ORDER = { claimed: 0, seeded: 1, places: 2 } as const

/** Stable order for server-rendered lists: claimed first, then rating. */
export function rankForSeo(s: S, list: Listing[]) {
  return [...list].sort((a, b) => LAYER_ORDER[a.layer] - LAYER_ORDER[b.layer] || listingRating(s, b).rating - listingRating(s, a).rating || a.name.localeCompare(b.name))
}

export interface PriceRow {
  name: string
  low: number
  high: number
  businesses: number
  vat: "inc" | "ex" | "mixed"
  hourly: boolean
}

/** Price ranges from the services businesses in this category actually list (no made-up figures). */
export function priceGuide(s: S, categoryId: string, area?: Area): PriceRow[] {
  const listings = categoryListings(s, categoryId, area).filter((l) => l.layer === "claimed" && l.businessId)
  const rows = new Map<string, { low: number; high: number; biz: Set<string>; inc: number; ex: number; hourly: boolean }>()
  for (const l of listings) {
    for (const svc of servicesFor(s, l.businessId)) {
      if (svc.priceType === "quote") continue
      const r = rows.get(svc.name) ?? { low: Infinity, high: 0, biz: new Set<string>(), inc: 0, ex: 0, hourly: false }
      r.low = Math.min(r.low, svc.pricePence)
      r.high = Math.max(r.high, svc.priceToPence ?? svc.pricePence)
      r.biz.add(l.businessId!)
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

export interface Faq {
  q: string
  a: string
}

export function categoryFaqs(cat: Category, area?: Area): Faq[] {
  const where = area ? ` in ${area.name}` : " near me"
  const plural = cat.plural.toLowerCase()
  return [
    {
      q: `How do I find ${plural}${where}?`,
      a: `Search Answerd for “${cat.name.toLowerCase()}” with your postcode. You'll see businesses${area ? ` covering ${area.name}` : " near you"}, their prices, reviews and how quickly they reply. Call, message or book in two taps.`,
    },
    {
      q: `How much do ${plural} cost${area ? ` in ${area.name}` : ""}?`,
      a: "Prices are set by each business and shown on their listing with VAT stated. Where a job needs a look first, they'll send a quote in the chat before you agree to anything.",
    },
    {
      q: "What does “Responds instantly” mean?",
      a: "The business has an Answerd front desk. If they can't pick up, the desk answers calls and messages straight away, says it's an AI, and can offer times or hand you to the owner.",
    },
    {
      q: "Are the businesses checked?",
      a: "Claimed businesses verify they own the listing. Credentials such as Gas Safe, NICEIC, insurance and DBS show a badge only after Answerd has checked them, and the badge disappears if it expires.",
    },
    {
      q: "Can I leave a review?",
      a: "Yes, after a completed booking or a tracked call of more than a minute. That keeps reviews to real customers.",
    },
  ]
}

export function areaFaqs(area: Area): Faq[] {
  return [
    { q: `What services can I find in ${area.name}?`, a: `Everything from plumbers and electricians to cleaners, mechanics and barbers. Pick a category below to see who covers ${area.name}.` },
    { q: "Is Answerd free to use?", a: "Yes. Searching, calling, messaging and booking are free for customers. You pay the business directly for the job." },
    { q: "Can businesses list for free?", a: "Yes. Any business can claim or add a free listing and see the enquiries Answerd sends them." },
  ]
}

// ------------------------------------------------------------------ JSON-LD builders

export function breadcrumbLd(items: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE}${it.href}` })),
  }
}

export function faqLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  }
}

export function itemListLd(name: string, listings: Listing[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: listings.length,
    itemListElement: listings.map((l, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/b/${l.slug}`, name: l.name })),
  }
}

export function localBusinessLd(s: S, l: Listing) {
  const cat = s.categories.find((c) => c.id === l.categoryIds[0])
  const r = listingRating(s, l)
  const [street, locality] = l.address.split(", ")
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE}/b/${l.slug}`,
    name: l.name,
    url: `${SITE}/b/${l.slug}`,
    telephone: l.phonePublic,
    description: l.description || `${cat?.name ?? "Local business"} in ${locality ?? l.postcodeDistrict}`,
    address: { "@type": "PostalAddress", streetAddress: street, addressLocality: locality, postalCode: l.postcode, addressCountry: "GB" },
    geo: { "@type": "GeoCoordinates", latitude: l.geo.lat, longitude: l.geo.lng },
    ...(l.layer !== "places" && r.count > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: r.rating, reviewCount: r.count, bestRating: 5 } } : {}),
  }
}
