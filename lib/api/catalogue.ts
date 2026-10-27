"use client"
// API mode: replaces the mock catalogue with the API's. Listings, services, hours, service areas, credentials,
// desk status and reviews come from the API. They're matched to the store's listings by slug, so personas and
// their businesses (Sam owns Swift Plumbing & Heating) keep working, and anything the API doesn't return is
// unpublished. Google (places) results are never copied into the store, which is persisted: they stay in the
// live search only.
import { produce, type Draft } from "immer"
import { useStore } from "@/lib/store"
import { CATEGORIES } from "@/lib/categories"
import { AREAS } from "@/lib/geo"
import { initials } from "@/lib/format"
import type { Credential, CredentialType, Listing, Review, Service } from "@/lib/types"
import type { DemoData } from "@/lib/seed"
import * as api from "./client"
import { useApiStatus } from "./status"
import type { ApiListing, ApiListingCard, ApiReview } from "./types"

type D = Draft<DemoData>

const CITY_CENTRES = [
  { city: "london" as const, lat: 51.3975, lng: -0.0745 },
  { city: "birmingham" as const, lat: 52.47, lng: -1.9 },
  { city: "manchester" as const, lat: 53.45, lng: -2.24 },
]
const MAX_PAGES = 10
const PARALLEL = 6
const SYNC_KEY = "answerd-api-synced-at"
const CACHE_KEY = "answerd-api-catalogue"

type Got = { l: ApiListing; reviews: ApiReview[] }
let lastGot: Got[] | null = null

function apply(got: Got[]) {
  const slugs = new Set(got.map((x) => x.l.slug))
  useStore.setState((s) =>
    produce(s, (d) => {
      for (const { l, reviews } of got) applyListing(d as unknown as D, l, reviews)
      // Mock listings the API doesn't have are hidden, not deleted, so "Reset demo data" still restores them
      for (const l of d.listings) if (!slugs.has(l.slug)) l.unpublished = true
    }),
  )
}

/** After "Reset demo data": put the last API catalogue back at once, without refetching. */
export function reapplyCatalogue() {
  if (!lastGot) {
    try {
      lastGot = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? "null") as Got[] | null
    } catch {
      lastGot = null
    }
  }
  if (lastGot) apply(lastGot)
  else void syncCatalogue(true)
}
const SYNC_EVERY_MS = 60 * 60 * 1000

const HUE: Record<string, number> = { "blue-tint": 222, "teal-tint": 174, "amber-tint": 38, sky: 210 }
const CRED_TYPES: CredentialType[] = ["gas_safe", "niceic", "napit", "insurance", "dbs", "qualification"]

function categoryIdFor(name: string) {
  const n = name.toLowerCase()
  return CATEGORIES.find((c) => c.parentId && (c.name.toLowerCase() === n || c.plural.toLowerCase() === n))?.id
}

function areaFor(district: string | null) {
  const all = AREAS.filter((a) => district && a.districts.includes(district))
  return all.find((a) => a.parent) ?? all[0]
}

/** "Usually replies in 1 hour" → 60 */
function replyMins(line: string | null) {
  const m = line?.match(/(\d+)\s*(min|hour)/)
  if (!m) return 240
  return Number(m[1]) * (m[2] === "hour" ? 60 : 1)
}

async function pool<T, R>(items: T[], fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []
  let i = 0
  await Promise.all(
    Array.from({ length: Math.min(PARALLEL, items.length) }, async () => {
      while (i < items.length) {
        const mine = i++
        out[mine] = await fn(items[mine]!)
      }
    }),
  )
  return out
}

async function everyListing(): Promise<ApiListingCard[]> {
  const seen = new Map<string, ApiListingCard>()
  for (const c of CITY_CENTRES) {
    let cursor: string | undefined
    for (let p = 0; p < MAX_PAGES; p++) {
      const res = await api.search({ lat: c.lat, lng: c.lng, radiusMiles: 25, cursor })
      for (const it of res.items) if (it.layer !== "places" && it.slug && !seen.has(it.slug)) seen.set(it.slug, it)
      if (!res.nextCursor) break
      cursor = res.nextCursor
    }
  }
  return [...seen.values()]
}

function applyListing(d: D, a: ApiListing, reviews: ApiReview[]) {
  const district = a.postcodeDistrict ?? ""
  const area = areaFor(district)
  const catId = categoryIdFor(a.categoryName)
  let l = d.listings.find((x) => x.slug === a.slug)
  if (!l) {
    d.listings.push({
      id: `l-${a.slug}`,
      slug: a.slug!,
      name: a.name,
      categoryIds: catId ? [catId] : [],
      layer: a.layer,
      address: a.address ?? "",
      postcode: district,
      postcodeDistrict: district,
      area: area?.slug ?? "",
      city: area?.city ?? "london",
      geo: a.geo,
      phonePublic: (a.phonePublic ?? "").replace(/^\+44/, "0"),
      badges: [],
      sourceRefs: [],
      replyMins: replyMins(a.replyTimeLine),
      hue: HUE[a.avatar?.tint] ?? 222,
      initials: a.avatar?.initials || initials(a.name),
      description: a.description ?? "",
      createdAt: new Date().toISOString(),
    } satisfies Listing)
    l = d.listings.at(-1)!
  }
  l.apiId = a.id ?? undefined
  l.name = a.name
  l.layer = a.layer
  l.description = a.description ?? l.description
  l.address = a.address ?? l.address
  l.postcodeDistrict = district || l.postcodeDistrict
  l.geo = a.geo
  if (a.phonePublic) l.phonePublic = a.phonePublic.replace(/^\+44/, "0")
  if (catId && !l.categoryIds.includes(catId)) l.categoryIds = [catId, ...l.categoryIds]
  l.replyMins = replyMins(a.replyTimeLine)
  l.apiRating = a.reviewSummary ? { average: a.reviewSummary.average, count: a.reviewSummary.count } : { average: a.rating ?? 0, count: a.reviewCount }
  l.unpublished = false

  // Reviews: the API's latest page replaces the mock ones (the rating uses the API's summary above)
  // Kept local: reviews from a booking in this demo, and the moderation queue (flagged or removed), which the
  // public reviews don't carry until admin reads are wired to the API
  d.reviews = d.reviews.filter((r) => r.listingId !== l.id || r.bookingId || r.flagged || r.status === "removed")
  for (const r of reviews)
    d.reviews.push({
      id: `api-${r.id}`,
      listingId: l.id,
      customerId: null,
      authorName: r.authorName,
      stars: r.stars,
      text: r.body,
      photos: [],
      status: "live",
      reply: r.reply ? { body: typeof r.reply === "string" ? r.reply : r.reply.body, at: r.createdAt } : undefined,
      createdAt: r.createdAt,
    } satisfies Review)

  const bizId = l.businessId
  if (!bizId) return
  // Services: matched by name so bookings that point at a service keep working
  const mine = d.services.filter((s) => s.businessId === bizId)
  const next: Service[] = a.services.map((s) => {
    const local = mine.find((m) => m.name.toLowerCase() === s.name.toLowerCase())
    return {
      ...(local ?? {}),
      id: local?.id ?? `api-${s.id}`,
      businessId: bizId,
      name: s.name,
      description: s.description,
      durationMin: s.durationMin,
      priceType: s.priceType,
      pricePence: s.pricePence ?? 0,
      priceToPence: s.priceMaxPence ?? undefined,
      vatIncluded: s.vatIncluded,
      bookable: s.bookable,
      order: s.sort,
    }
  })
  const used = new Set(d.bookings.map((b) => b.serviceId))
  d.services = [...d.services.filter((s) => s.businessId !== bizId || (used.has(s.id) && !next.some((n) => n.id === s.id))), ...next]
  const av = d.availability.find((x) => x.businessId === bizId)
  if (av && a.hours.length) av.weeklyHours = a.hours.map((h) => ({ day: h.day, open: h.open, close: h.close, closed: h.closed }))
  const sa = d.serviceAreas.find((x) => x.businessId === bizId)
  if (sa && a.serviceArea) {
    sa.radiusMiles = a.serviceArea.radiusMiles ?? sa.radiusMiles
    sa.districts = a.serviceArea.districts
    sa.travelNote = a.serviceArea.travelNote ?? ""
  }
  const desk = d.deskConfigs.find((x) => x.businessId === bizId)
  if (desk) {
    if (a.deskLive) desk.status = "live"
    else if (desk.status === "live") desk.status = "off"
  }
  // The public listing only carries verified credentials. Pending and rejected ones (the admin review queue)
  // stay local until admin reads are wired to the API.
  d.credentials = [
    ...d.credentials.filter((c) => c.businessId !== bizId || c.status !== "verified"),
    ...a.credentials
      .filter((c): c is typeof c & { type: CredentialType } => (CRED_TYPES as string[]).includes(c.type))
      .map((c, i) => ({ id: `api-cr-${a.slug}-${i}`, businessId: bizId, type: c.type, label: c.label, number: "", fileUrl: "", expiresAt: c.expiresAt ?? undefined, status: c.status as Credential["status"], submittedAt: new Date().toISOString() })),
  ]
}

/** Pulls the API's catalogue into the store. Runs at most hourly per tab unless forced. */
export async function syncCatalogue(force = false) {
  try {
    const last = Number(sessionStorage.getItem(SYNC_KEY) ?? 0)
    if (!force && Date.now() - last < SYNC_EVERY_MS) {
      const n = useStore.getState().listings.filter((l) => l.apiRating).length
      useApiStatus.setState({ sync: { state: "done", listings: n, at: last } })
      return
    }
  } catch {
    /* storage blocked: sync every load */
  }
  useApiStatus.setState((s) => ({ sync: { ...s.sync, state: "running" } }))
  try {
    if (!(await api.warmUp())) throw new Error("The API didn't wake up")
    const cards = await everyListing()
    const details = await pool(cards, async (c) => {
      const l = await api.listing(c.slug!).catch(() => null)
      const reviews = l?.id ? ((await api.listingReviews(l.id).catch(() => null))?.items ?? []) : []
      return l ? { l, reviews } : null
    })
    const got = details.filter((x): x is Got => !!x)
    lastGot = got
    apply(got)
    try {
      sessionStorage.setItem(SYNC_KEY, String(Date.now()))
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(got))
    } catch {
      /* storage full or blocked: the in-memory copy still covers resets */
    }
    useApiStatus.setState({ sync: { state: "done", listings: got.length, at: Date.now() } })
  } catch (e) {
    useApiStatus.setState((s) => ({ sync: { ...s.sync, state: "error", error: e instanceof Error ? e.message : String(e) } }))
  }
}

/** Re-reads one listing (a realtime listing event, or a listing page opened in API mode). */
export async function refreshListing(slug: string) {
  const l = await api.listing(slug).catch(() => null)
  if (!l?.slug) return
  const reviews = l.id ? ((await api.listingReviews(l.id).catch(() => null))?.items ?? []) : []
  useStore.setState((s) => produce(s, (d) => void applyListing(d as unknown as D, l, reviews)))
}
