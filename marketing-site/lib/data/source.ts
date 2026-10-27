// Where the SEO and listing pages get their data. With NEXT_PUBLIC_ANSWERD_API_URL set they read the Answerd
// API, cached for ISR (hourly, or on demand through app/api/revalidate). Without it they build from the static
// fallback data, exactly as before. Google (places) results are never part of what's returned here: those are
// fetched live in the browser and rendered with attribution (components/web/google-results.tsx).
import * as api from "@/lib/api/client"
import { ApiError } from "@/lib/api/client"
import type { ApiListingCard } from "@/lib/api/types"
import { apiCard, apiListingView, areaCentre, seedListingView, type ListingView } from "./listing-view"
import { cardData, categoryListings, listingsInArea, nearbyAreas, priceGuide, rank, type CardData, type PriceRow } from "./queries"
import { LEAF_CATEGORIES } from "./categories"
import type { Area } from "./geo"
import type { Category } from "./types"

export const apiMode = api.apiEnabled

export async function getListingView(slug: string): Promise<ListingView | undefined> {
  if (!apiMode) return seedListingView(slug)
  try {
    const l = await api.listing(slug)
    if (!l.slug || l.layer === "places") return undefined
    const reviews = l.id && !l.poweredByGoogle ? (await api.listingReviews(l.id, l.slug)).items : []
    return apiListingView(l, reviews)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined
    throw e
  }
}

const PAGES = 4

/** Answerd's own results (claimed and seeded) for a search, following cursors up to PAGES pages. */
async function ownResults(p: Parameters<typeof api.search>[0]): Promise<ApiListingCard[]> {
  const out: ApiListingCard[] = []
  let cursor: string | undefined
  for (let i = 0; i < PAGES; i++) {
    let res
    try {
      res = await api.search({ ...p, cursor })
    } catch (e) {
      // A category the API doesn't carry yet is an empty page, not a broken one.
      if (e instanceof ApiError && e.status === 400) return out
      throw e
    }
    for (const it of res.items) if (it.layer !== "places" && it.slug && !out.some((x) => x.id === it.id)) out.push(it)
    if (!res.nextCursor) break
    cursor = res.nextCursor
  }
  return out
}

export interface CategoryAreaData {
  cards: CardData[]
  /** For the ItemList JSON-LD */
  items: { slug: string; name: string }[]
  /** Thin areas: businesses in nearby areas (static data only; API searches already cover a radius) */
  near: { card: CardData; area: Area }[]
  prices: { local: PriceRow[]; wider: PriceRow[] }
}

export async function getCategoryArea(cat: Category, area: Area): Promise<CategoryAreaData> {
  if (!apiMode) {
    const listings = rank(categoryListings(cat.id, area))
    const near =
      listings.length < 3
        ? nearbyAreas(area)
            .flatMap((n) => rank(categoryListings(cat.id, n)).map((l) => ({ l, n })))
            .filter((x, i, all) => !listings.some((l) => l.id === x.l.id) && all.findIndex((y) => y.l.id === x.l.id) === i)
            .slice(0, 6)
            .map(({ l, n }) => ({ card: cardData(l), area: n }))
        : []
    return { cards: listings.map(cardData), items: listings, near, prices: { local: priceGuide(cat.id, area), wider: priceGuide(cat.id) } }
  }
  const results = await ownResults({ ...areaCentre(area), category: cat.slug, sort: "best" })
  return { cards: results.map(apiCard), items: results.map((r) => ({ slug: r.slug!, name: r.name })), near: [], prices: { local: await apiPriceGuide(results), wider: [] } }
}

/** "What it costs" from the services the top claimed businesses list (no invented figures). */
async function apiPriceGuide(results: ApiListingCard[]): Promise<PriceRow[]> {
  const claimed = results.filter((r) => r.layer === "claimed").slice(0, 8)
  const details = await Promise.all(claimed.map((r) => api.listing(r.slug!).catch(() => null)))
  const rows = new Map<string, { low: number; high: number; biz: Set<string>; inc: number; ex: number; hourly: boolean }>()
  for (const l of details) {
    if (!l) continue
    for (const s of l.services) {
      if (s.priceType === "quote" || s.pricePence == null) continue
      const r = rows.get(s.name) ?? { low: Infinity, high: 0, biz: new Set<string>(), inc: 0, ex: 0, hourly: false }
      r.low = Math.min(r.low, s.pricePence)
      r.high = Math.max(r.high, s.priceMaxPence ?? s.pricePence)
      r.biz.add(l.slug!)
      if (s.vatIncluded) r.inc++
      else r.ex++
      if (s.priceType === "hourly") r.hourly = true
      rows.set(s.name, r)
    }
  }
  return [...rows.entries()]
    .map(([name, r]) => ({ name, low: r.low, high: r.high, businesses: r.biz.size, vat: r.inc && r.ex ? "mixed" : r.inc ? "inc" : "ex", hourly: r.hourly }) as PriceRow)
    .sort((a, b) => b.businesses - a.businesses || a.low - b.low)
    .slice(0, 6)
}

/** Area hub (W-05): businesses in the area, and how many per category. */
export async function getAreaCounts(area: Area): Promise<{ total: number; byCategory: Record<string, number> }> {
  if (!apiMode) {
    return { total: listingsInArea(area).length, byCategory: Object.fromEntries(LEAF_CATEGORIES.map((c) => [c.id, categoryListings(c.id, area).length])) }
  }
  const results = await ownResults({ ...areaCentre(area), sort: "best" })
  const byCategory: Record<string, number> = {}
  for (const r of results) {
    const c = apiCard(r).categoryName
    const cat = LEAF_CATEGORIES.find((x) => x.name === c)
    if (cat) byCategory[cat.id] = (byCategory[cat.id] ?? 0) + 1
  }
  return { total: results.length, byCategory }
}

/** W-02 search: Answerd's own results for a query and place. Not cached (query-driven). */
export async function getSearch(q: string, postcode: string): Promise<{ cards: CardData[]; error?: string }> {
  if (!apiMode) return { cards: [] }
  try {
    const res = await api.search({ q, postcode, sort: "best" }, false)
    return { cards: res.items.filter((i) => i.layer !== "places" && i.slug).map(apiCard) }
  } catch (e) {
    if (e instanceof ApiError && e.status < 500) return { cards: [], error: e.problem?.title ?? e.message }
    throw e
  }
}
