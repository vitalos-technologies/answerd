// Pure derived data. Every screen reads through these so all surfaces agree.
import type { DemoData } from "./seed"
import type { BadgeKind, Booking, Listing, PlatformSwitches, PricingRules, RuleVersion, Service } from "./types"
import { addDays, addMinutes, atMinutes, dayKey, fmtClock, fmtDate, hhmmToMin, minutesOfDay, ms, parts, MS_DAY } from "./time"
import { districtOf, lookupPostcode, milesBetween, DISTRICTS } from "./geo"

type S = Pick<DemoData, keyof DemoData>

export const ENQUIRY_KINDS = ["call", "message", "booking"] as const
export const GATE_ENQUIRIES = 10
export const GATE_DAYS = 60

export function listingById(s: S, id: string | undefined) {
  return s.listings.find((l) => l.id === id)
}
export function listingBySlug(s: S, slug: string) {
  const l = s.listings.find((x) => x.slug === slug)
  if (l?.mergedInto) return listingById(s, l.mergedInto)
  return l
}
export function businessById(s: S, id: string | undefined | null) {
  return s.businesses.find((b) => b.id === id)
}
export function businessForListing(s: S, listingId: string) {
  return s.businesses.find((b) => b.listingId === listingId)
}
export function deskFor(s: S, businessId: string | undefined | null) {
  return s.deskConfigs.find((d) => d.businessId === businessId)
}
export function availabilityFor(s: S, businessId: string | undefined) {
  return s.availability.find((a) => a.businessId === businessId)
}
export function areaFor(s: S, businessId: string | undefined) {
  return s.serviceAreas.find((a) => a.businessId === businessId)
}
export function servicesFor(s: S, businessId: string | undefined) {
  return s.services.filter((x) => x.businessId === businessId).sort((a, b) => a.order - b.order)
}
export function serviceById(s: S, id: string | undefined) {
  return s.services.find((x) => x.id === id)
}

export function isDeskLive(s: S, listing: Listing | undefined) {
  if (!listing?.businessId || s.settings.killSwitch) return false
  return deskFor(s, listing.businessId)?.status === "live"
}

export function listingRating(s: S, listing: Listing) {
  if (listing.layer === "places") return { rating: listing.googleRating ?? 0, count: listing.googleCount ?? 0, google: true }
  const live = s.reviews.filter((r) => r.listingId === listing.id && r.status === "live")
  if (!live.length) return { rating: 0, count: 0, google: false }
  const avg = live.reduce((a, r) => a + r.stars, 0) / live.length
  return { rating: Math.round(avg * 10) / 10, count: live.length, google: false }
}

export function verifiedCredentials(s: S, businessId: string | undefined, now: string) {
  return s.credentials.filter(
    (c) => c.businessId === businessId && c.status === "verified" && (!c.expiresAt || ms(c.expiresAt) > ms(now)),
  )
}

export function isFeatured(s: S, listing: Listing, categoryId?: string) {
  if (!s.settings.featuredOn || !listing.businessId) return false
  const slots = rulesFor(s).featuredSlotsPerArea
  return s.featuredSlots.some(
    (f) => f.businessId === listing.businessId && f.position <= slots && (!categoryId || f.categoryId === categoryId) && listing.city === "london",
  )
}

export function openStatus(s: S, listing: Listing, now: string): { open: boolean; label: string; holiday?: string } {
  const avail = availabilityFor(s, listing.businessId)
  if (!avail) return { open: false, label: "" }
  const today = dayKey(now)
  const hol = avail.holidays.find((h) => today >= h.from && today <= h.to)
  if (hol) {
    const back = addDays(atMinutes(hol.to, 0), 1)
    return { open: false, label: `Back on ${fmtDate(back)}`, holiday: hol.label }
  }
  const p = parts(now)
  const todayHours = avail.weeklyHours.find((h) => h.day === p.dow)
  const nowMin = minutesOfDay(now)
  if (todayHours && !todayHours.closed && nowMin >= hhmmToMin(todayHours.open) && nowMin < hhmmToMin(todayHours.close)) {
    return { open: true, label: `Open until ${fmtClock(todayHours.close)}` }
  }
  if (todayHours && !todayHours.closed && nowMin < hhmmToMin(todayHours.open)) {
    return { open: false, label: `Opens ${fmtClock(todayHours.open)}` }
  }
  for (let i = 1; i <= 7; i++) {
    const d = addDays(now, i)
    const h = avail.weeklyHours.find((x) => x.day === parts(d).dow)
    if (h && !h.closed) return { open: false, label: `Opens ${i === 1 ? "tomorrow" : fmtDate(d).split(" ")[0]} ${fmtClock(h.open)}` }
  }
  return { open: false, label: "Closed" }
}

export function listingBadges(s: S, listing: Listing, now: string, categoryId?: string): BadgeKind[] {
  const out: BadgeKind[] = []
  if (isFeatured(s, listing, categoryId)) out.push("featured")
  if (isDeskLive(s, listing)) out.push("responds_instantly")
  if (listing.layer === "claimed" && listing.badges.includes("verified")) out.push("verified")
  for (const c of verifiedCredentials(s, listing.businessId, now)) {
    const map: Partial<Record<string, BadgeKind>> = { gas_safe: "gas_safe", niceic: "niceic", napit: "napit", insurance: "insured", dbs: "dbs" }
    const b = map[c.type]
    if (b && !out.includes(b)) out.push(b)
  }
  if (listing.layer !== "claimed") out.push("unclaimed")
  if (listing.layer === "claimed" && ms(now) - ms(listing.createdAt) < 14 * MS_DAY) out.push("new")
  return out
}

export function replyLine(s: S, listing: Listing) {
  if (isDeskLive(s, listing)) return "Usually replies in 1 min"
  const m = listing.replyMins
  if (m < 60) return `Usually replies in ${m} min`
  const h = Math.round(m / 60)
  return `Usually replies in ${h} hour${h > 1 ? "s" : ""}`
}

export function distanceMiles(s: S, listing: Listing) {
  const loc = s.session.location
  if (!loc) return null
  return milesBetween(loc, listing.geo)
}

export function answerdEnquiries(s: S, listingId: string) {
  return s.enquiries.filter((e) => e.listingId === listingId && (ENQUIRY_KINDS as readonly string[]).includes(e.kind))
}

export function gateStatus(s: S, businessId: string | undefined | null) {
  // R2: thresholds come from the S-06 rules (defaults: 10 enquiries, day 60)
  const r = rulesFor(s)
  const target = r.gateEnquiries
  const biz = businessById(s, businessId)
  if (!biz) return { met: false, count: 0, daysOk: false, override: false, gateDate: addDays(s.settings.launchDate, r.gateDays), target, enquiriesOk: false }
  const count = answerdEnquiries(s, biz.listingId).length
  const gateDate = addDays(s.settings.launchDate, r.gateDays)
  const daysOk = ms(s.clock) >= ms(gateDate)
  const override = s.settings.gateOverrides.some((o) => o.businessId === businessId)
  const enquiriesOk = count >= target
  return { met: override || (enquiriesOk && daysOk), count, daysOk, override, gateDate, target, enquiriesOk }
}

/**
 * R2 (B-36, B-37, W-18): the paid-plan button follows whichever half of the gate is missing.
 * Enquiries short: "Available after 10 enquiries" (also when both halves are missing);
 * enquiries met but not the date: "Available from Fri 30 Oct"; both met: the plan's own call to action.
 */
export function gateButtonLabel(g: ReturnType<typeof gateStatus>, metLabel: string) {
  if (g.met) return metLabel
  if (!g.enquiriesOk) return `Available after ${g.target} enquiries`
  return `Available from ${fmtDate(g.gateDate)}`
}

export function coversPostcode(s: S, businessId: string | undefined, postcode: string) {
  const area = areaFor(s, businessId)
  if (!area) return true
  const pc = lookupPostcode(postcode)
  if (!pc) return false
  if (area.mode === "districts") return area.districts.includes(pc.district)
  const base = lookupPostcode(area.basePostcode) ?? (DISTRICTS[districtOf(area.basePostcode)] ? { ...DISTRICTS[districtOf(area.basePostcode)]!, postcode: area.basePostcode, district: districtOf(area.basePostcode) } : null)
  if (!base) return true
  return milesBetween(base, pc) <= area.radiusMiles
}

export function activeBookingsFor(s: S, listingId: string) {
  return s.bookings.filter((b) => b.listingId === listingId && ["requested", "confirmed", "on_the_way", "arrived"].includes(b.status))
}

/**
 * Bookable start times on a London day, honouring weekly hours, holidays,
 * lead time, buffer, max jobs per day, existing bookings and blocked time.
 */
export function slotsForDay(s: S, listing: Listing, service: Service | undefined, day: string, opts: { ignoreBookingId?: string } = {}) {
  const avail = availabilityFor(s, listing.businessId)
  if (!avail) return []
  if (avail.holidays.some((h) => day >= h.from && day <= h.to)) return []
  const dow = parts(atMinutes(day, 12 * 60)).dow
  const hours = avail.weeklyHours.find((h) => h.day === dow)
  if (!hours || hours.closed) return []
  const dur = service?.durationMin ?? 60
  const open = hhmmToMin(hours.open)
  const close = hhmmToMin(hours.close)
  const earliest = ms(s.clock) + avail.leadTimeMin * 60_000
  const existing = activeBookingsFor(s, listing.id).filter((b) => b.id !== opts.ignoreBookingId && dayKey(b.startAt) === day)
  if (existing.length >= avail.maxPerDay) return []
  const blocks = s.blocks.filter((b) => b.businessId === listing.businessId)
  const step = avail.slotMode === "windows" ? 240 : avail.slotLengthMin
  const out: string[] = []
  for (let t = open; t + Math.min(dur, step) <= close; t += step) {
    const start = atMinutes(day, t)
    const end = addMinutes(start, Math.min(dur, avail.slotMode === "windows" ? step : dur))
    if (ms(start) < earliest) continue
    const clash = (a0: string, a1: string) => ms(a0) < ms(addMinutes(end, avail.bufferMin)) && ms(addMinutes(start, -avail.bufferMin)) < ms(a1)
    if (existing.some((b) => clash(b.startAt, b.endAt))) continue
    if (blocks.some((b) => clash(b.startAt, b.endAt) || (b.repeat === "weekly" && parts(b.startAt).dow === dow && clash(atMinutes(day, minutesOfDay(b.startAt)), atMinutes(day, minutesOfDay(b.endAt)))))) continue
    out.push(start)
  }
  return out
}

/** Next n free slots from now, across up to 14 days. */
export function nextSlots(s: S, listing: Listing, service: Service | undefined, n = 2, fromIso?: string) {
  const out: string[] = []
  for (let i = 0; i < 14 && out.length < n; i++) {
    const day = dayKey(addDays(fromIso ?? s.clock, i))
    for (const slot of slotsForDay(s, listing, service, day)) {
      if (fromIso && ms(slot) < ms(fromIso)) continue
      out.push(slot)
      if (out.length >= n) break
    }
  }
  return out
}

export function windowLabel(iso: string) {
  const h = parts(iso).h
  if (h < 12) return "Morning 8–12"
  if (h < 16) return "Afternoon 12–4"
  return "Evening 4–8"
}

export function bookingTitle(s: S, b: Booking) {
  return serviceById(s, b.serviceId)?.name ?? "Booking"
}

export function unreadCount(s: S, userId: string | null) {
  if (!userId) return 0
  return s.notifications.filter((n) => n.userId === userId && !n.readAt).length
}

export function membershipsFor(s: S, userId: string | null) {
  if (!userId) return []
  return s.members.filter((m) => m.userId === userId && m.joinedAt)
}

export function isStaffOnly(s: S, userId: string | null) {
  const ms_ = membershipsFor(s, userId)
  return ms_.length > 0 && ms_.every((m) => m.role === "staff")
}

export function roleIn(s: S, userId: string | null, businessId: string | null) {
  return s.members.find((m) => m.userId === userId && m.businessId === businessId && m.joinedAt)?.role ?? null
}

// P5
/**
 * Up to n similar businesses to offer when a request is declined or expires:
 * same city and category, claimed businesses with a free slot that day first, then other claimed,
 * then seeded and Places listings (call to check), nearest first.
 */
export function alternativesFor(s: S, listingId: string, startAt: string, n = 3) {
  const l = listingById(s, listingId)
  if (!l) return []
  const day = dayKey(startAt)
  const rank = (x: Listing) => {
    if (x.layer === "claimed") {
      const svc = servicesFor(s, x.businessId).find((v) => v.bookable)
      return slotsForDay(s, x, svc, day).length ? 0 : 1
    }
    return x.layer === "seeded" ? 2 : 3
  }
  return s.listings
    .filter((x) => x.id !== l.id && !x.mergedInto && !x.suspended && !x.unpublished && x.city === l.city && x.categoryIds.some((c) => l.categoryIds.includes(c)))
    .map((x) => ({ x, r: rank(x), d: milesBetween(l.geo, x.geo) }))
    .sort((a, b) => a.r - b.r || a.d - b.d)
    .slice(0, n)
    .map((a) => a.x)
}

// ------------------------------------------------------------------ R2 super admin: rules and platform switches

/** S-06 defaults: exactly the behaviour before the rules moved into settings. */
export const DEFAULT_RULES: PricingRules = {
  deskPricePence: 4900,
  featuredPricePence: 2900,
  trialDays: 14,
  gateEnquiries: GATE_ENQUIRIES,
  gateDays: GATE_DAYS,
  featuredSlotsPerArea: 3,
  requestExpiryHours: 2,
  reviewMinChars: 20,
  reviewCallMinSec: 60,
}

/** Versions in the order they take effect (ties: the later version wins). */
export function ruleVersions(s: S): RuleVersion[] {
  return [...(s.settings.ruleVersions ?? [])].sort((a, b) => ms(a.effectiveAt) - ms(b.effectiveAt) || a.version - b.version)
}

/** The version in force on the demo clock (null before the first one, or without any). */
export function currentRuleVersion(s: S): RuleVersion | null {
  const now = ms(s.clock)
  let cur: RuleVersion | null = null
  for (const v of ruleVersions(s)) if (ms(v.effectiveAt) <= now) cur = v
  return cur
}

/** The commercial rules in force now. Every price, threshold and limit reads through here. */
export function rulesFor(s: S): PricingRules {
  const v = currentRuleVersion(s)
  return v ? { ...DEFAULT_RULES, ...v.rules } : DEFAULT_RULES
}

export const DEFAULT_PLATFORM: PlatformSwitches = {
  signups: true,
  claims: true,
  payments: true,
  ask: true,
  maintenance: false,
  maintenanceMessage: "We're making Answerd better. We'll be back by 6am. Calls to businesses still work as normal.",
}

/**
 * S-07 platform switches in one cheap place. Gap-fill is the existing A-23 flag.
 * `platformOn(s, "signups")` etc. is what C-06/C-08, B-01/W-11, checkout, C-38/W-25 and the shells check.
 */
export function platformFor(s: S): PlatformSwitches & { gapFill: boolean } {
  return { ...DEFAULT_PLATFORM, ...s.settings.platform, gapFill: s.settings.gapFillOn }
}

export function platformOn(s: S, key: "signups" | "claims" | "payments" | "ask" | "gapFill") {
  return platformFor(s)[key]
}

export function maintenanceOn(s: S) {
  return platformFor(s).maintenance
}
