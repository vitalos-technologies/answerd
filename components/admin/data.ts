// Derived data for the admin console. Pure functions over the demo store.
import type { DemoData } from "@/lib/seed"
import type { Listing } from "@/lib/types"
import { addDays, ms, parts, MS_HOUR, MS_DAY } from "@/lib/time"
import { gateStatus, listingRating, deskFor } from "@/lib/selectors"

type S = Pick<DemoData, keyof DemoData>

/** The 121 UK postcode areas. */
export const POSTCODE_AREAS =
  "AB AL B BA BB BD BH BL BN BR BS BT CA CB CF CH CM CO CR CT CV CW DA DD DE DG DH DL DN DT DY E EC EH EN EX FK FY G GL GU HA HD HG HP HR HS HU HX IG IP IV KA KT KW KY L LA LD LE LL LN LS LU M ME MK ML N NE NG NN NP NR NW OL OX PA PE PH PL PO PR RG RH RM S SA SE SG SK SL SM SN SO SP SR SS ST SW SY TA TD TF TN TQ TR TS TW UB W WA WC WD WF WN WR WS WV YO ZE".split(" ")

/** Areas with real seed data: counts come from the store, not mock values. */
export const SEEDED_AREAS = ["SE", "CR", "B", "M"]

export const CORE_CATEGORIES = ["plumbers", "electricians", "heating-engineers", "locksmiths", "builders", "cleaners", "gardeners", "mobile-mechanics", "barbers", "couriers"]

const BIG = new Set(["E", "EC", "N", "NW", "SE", "SW", "W", "WC", "B", "M", "L", "LS", "G", "EH", "BS", "CF", "NG", "S", "NE", "BN", "CR", "KT", "HA", "UB", "RM", "IG", "EN", "BR", "DA", "TW", "SM"])
const SPARSE = new Set(["ZE", "KW", "HS", "IV", "LD", "TD", "DG", "PH", "PA", "AB", "LA", "CA", "TR", "SY", "LL"])

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

export function postcodeArea(district: string) {
  return district.toUpperCase().match(/^[A-Z]+/)?.[0] ?? district
}

export function visibleListings(s: S) {
  return s.listings.filter((l) => !l.mergedInto)
}

/** Result count for a postcode area and category: real for seeded areas, deterministic mock elsewhere. */
export function coverageCount(s: S, area: string, categoryId: string) {
  if (SEEDED_AREAS.includes(area)) {
    return visibleListings(s).filter((l) => !l.suspended && !l.unpublished && postcodeArea(l.postcodeDistrict) === area && l.categoryIds.includes(categoryId)).length
  }
  const r = hash(`${area}:${categoryId}`)
  const scale = BIG.has(area) ? 48 : SPARSE.has(area) ? 7 : 22
  return Math.floor(r * r * scale + (SPARSE.has(area) ? 0 : r * 4))
}

export function coverageGaps(s: S) {
  let n = 0
  for (const a of POSTCODE_AREAS) for (const c of CORE_CATEGORIES) if (coverageCount(s, a, c) < 5) n++
  return n
}

/** SLA deadline: one working day after submission (weekends skipped). */
export function slaDeadline(createdAt: string) {
  let due = addDays(createdAt, 1)
  while ([0, 6].includes(parts(due).dow)) due = addDays(due, 1)
  return due
}

export function slaLabel(createdAt: string, now: string) {
  const left = ms(slaDeadline(createdAt)) - ms(now)
  const h = Math.round(Math.abs(left) / MS_HOUR)
  if (left >= 0) return { overdue: false, label: h < 1 ? "Due within the hour" : `Due in ${h}h` }
  return { overdue: true, label: `Overdue by ${h < 24 ? `${h}h` : `${Math.round(Math.abs(left) / MS_DAY)}d`}` }
}

export function lastActivity(s: S, l: Listing) {
  let last = l.createdAt
  for (const e of s.enquiries) if (e.listingId === l.id && e.at > last) last = e.at
  for (const r of s.reviews) if (r.listingId === l.id && r.createdAt > last) last = r.createdAt
  return last
}

export interface ListingRow {
  id: string
  name: string
  slug: string
  category: string
  categoryIds: string[]
  area: string
  postcodeArea: string
  district: string
  layer: string
  claimed: string
  verified: string
  desk: string
  rating: number
  count: number
  last: string
  status: string
  listing: Listing
}

export function listingRows(s: S): ListingRow[] {
  return visibleListings(s).map((l) => {
    const r = listingRating(s, l)
    const desk = deskFor(s, l.businessId)
    return {
      id: l.id,
      name: l.name,
      slug: l.slug,
      category: s.categories.find((c) => c.id === l.categoryIds[0])?.name ?? l.categoryIds[0] ?? "",
      categoryIds: l.categoryIds,
      area: l.address.split(",").at(-1)?.trim() ?? l.area,
      postcodeArea: postcodeArea(l.postcodeDistrict),
      district: l.postcodeDistrict,
      layer: l.layer,
      claimed: l.layer === "claimed" ? "Yes" : "No",
      verified: l.badges.includes("verified") ? "Yes" : "No",
      desk: desk ? (s.settings.killSwitch && desk.status === "paused" ? "paused" : desk.status) : "—",
      rating: r.rating,
      count: r.count,
      last: lastActivity(s, l),
      status: l.suspended ? "Suspended" : l.unpublished ? "Unpublished" : "Live",
      listing: l,
    }
  })
}

export function overviewKpis(s: S) {
  const now = s.clock
  const listings = visibleListings(s)
  const weekStart = addDays(now, -((parts(now).dow + 6) % 7))
  const weekKey = weekStart.slice(0, 10)
  const today = now.slice(0, 10)
  const desks = s.deskConfigs
  const paying = s.subscriptions.filter((x) => x.plan !== "free" && x.status === "active")
  const placesToday = s.placesDays.at(-1)
  return {
    claimed: listings.filter((l) => l.layer === "claimed").length,
    seeded: listings.filter((l) => l.layer === "seeded").length,
    places: listings.filter((l) => l.layer === "places").length,
    claimsToday: s.claims.filter((c) => c.createdAt.slice(0, 10) === today).length,
    bookingsWeek: s.bookings.filter((b) => b.createdAt.slice(0, 10) >= weekKey).length,
    desksLive: desks.filter((d) => d.status === "live").length,
    trials: desks.filter((d) => d.status === "trial" || (d.status === "live" && s.subscriptions.some((x) => x.businessId === d.businessId && x.plan === "desk" && x.status === "trialing"))).length,
    payingDesks: paying.filter((x) => x.plan === "desk").length,
    mrr: paying.reduce((a, x) => a + x.pricePence, 0),
    placesSpend: placesToday?.spendPence ?? 0,
    placesCap: s.settings.placesCapPence,
    gaps: coverageGaps(s),
    queues: {
      claims: s.claims.filter((c) => ["pending", "disputed", "more_info"].includes(c.status)).length,
      credentials: s.credentials.filter((c) => c.status === "pending").length,
      reviews: s.reviews.filter((r) => r.flagged && r.status === "live").length,
      reports: s.reports.filter((r) => r.status === "open").length,
      deskQa: s.calls.filter((c) => c.outcome === "desk" && !c.qa).length,
    },
  }
}

export function businessRows(s: S) {
  return s.businesses.map((b) => {
    const l = s.listings.find((x) => x.id === b.listingId)
    const subs = s.subscriptions.filter((x) => x.businessId === b.id && x.status !== "cancelled")
    const plan = subs.find((x) => x.plan === "desk") ?? subs.find((x) => x.plan === "featured") ?? subs[0]
    const g = gateStatus(s, b.id)
    const owner = s.members.find((m) => m.businessId === b.id && m.role === "owner")
    return {
      id: b.id,
      name: l?.name ?? b.tradingName,
      tenantId: b.tenantId,
      owner: owner?.name ?? "—",
      plan: plan ? `${plan.plan === "free" ? "Free" : plan.plan === "desk" ? "AI desk" : "Featured"}${plan.status === "trialing" ? " (trial)" : plan.status === "past_due" ? " (past due)" : ""}` : "Free",
      desk: deskFor(s, b.id)?.status ?? "off",
      gateCount: g.count,
      gateMet: g.met,
      status: b.status,
      business: b,
    }
  })
}

/** Calls and spend by Places SKU for a day, split deterministically from the day's totals. */
export function placesSkus(calls: number, spendPence: number) {
  const split: [string, number, number][] = [
    ["Text Search (Essentials)", 0.46, 3.2],
    ["Place Details (Essentials)", 0.31, 0.5],
    ["Place Details (Pro)", 0.12, 1.7],
    ["Place Photos", 0.11, 0.7],
  ]
  const weight = split.reduce((a, [, share, ppc]) => a + share * ppc, 0)
  return split.map(([sku, share, ppc]) => ({ sku, calls: Math.round(calls * share), pence: Math.round((spendPence * share * ppc) / weight) }))
}

/** A-20 FAQs until an admin saves their own (Settings.faqs). */
export const DEFAULT_FAQS = [
  { id: "faq-1", q: "Is Answerd free for customers?", a: "Yes. Searching, calling, messaging and booking are free." },
  { id: "faq-2", q: "Is listing my business free?", a: "Yes. Listing is free. Nothing is charged before day 60 and 10 Answerd enquiries." },
  { id: "faq-3", q: "What is the AI desk?", a: "An AI assistant, running on Workforce, that answers your calls and texts, books jobs and hands off to you when it matters." },
]
