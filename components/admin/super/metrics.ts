// Owner metrics for S-01 to S-10: pure functions over the demo store.
// "Live" figures are counted from store records. Where the demo has no data (installs, unit costs, the price test),
// the figure is modelled deterministically (lib/prng) and the screens label it "Modelled" or "Simulated".
import type { DemoData } from "@/lib/seed"
import type { AuditEvent, Listing } from "@/lib/types"
import { Rng } from "@/lib/prng"
import { addDays, fmtDayMonth, ms, parts, startOfDay, MS_DAY, MS_HOUR } from "@/lib/time"
import { gateStatus, rulesFor, platformFor } from "@/lib/selectors"
import { setupProgress, setupSteps } from "@/components/app/biz"

type S = Pick<DemoData, keyof DemoData>

/** Brand chart colours (design review): calls blue, messages teal, bookings navy; amber only for highlights. */
export const C = { blue: "#2563FF", teal: "#14B8A6", navy: "#0F2D5B", amber: "#F59E0B", grid: "#E2E8F0", axis: "#5B6B80", sky: "#C7D6FF" }

export const CITIES = [
  { id: "london", name: "London" },
  { id: "birmingham", name: "Birmingham" },
  { id: "manchester", name: "Manchester" },
] as const

const within = (iso: string, from: number, to: number) => {
  const t = ms(iso)
  return t >= from && t < to
}

/** Monday 00:00 London of the week containing iso. */
export function weekStart(iso: string) {
  return startOfDay(addDays(iso, -((parts(iso).dow + 6) % 7)))
}

// ------------------------------------------------------------------ activity

export function enquiryWeeks(s: S, n = 8, listings?: Set<string>) {
  const thisWeek = weekStart(s.clock)
  return Array.from({ length: n }, (_, i) => {
    const from = ms(addDays(thisWeek, (i - n + 1) * 7))
    const to = from + 7 * MS_DAY
    const es = s.enquiries.filter((e) => (!listings || listings.has(e.listingId)) && within(e.at, from, to))
    return {
      label: fmtDayMonth(new Date(from).toISOString()),
      calls: es.filter((e) => e.kind === "call").length,
      messages: es.filter((e) => e.kind === "message").length,
      bookings: es.filter((e) => e.kind === "booking").length,
    }
  })
}

/** Distinct customers who booked, messaged, called or reviewed in the window. */
export function activeCustomers(s: S, days: number, endIso = s.clock) {
  const to = ms(endIso)
  const from = to - days * MS_DAY
  const ids = new Set<string>()
  for (const b of s.bookings) if (b.customerId && within(b.createdAt, from, to)) ids.add(b.customerId)
  for (const r of s.reviews) if (r.customerId && within(r.createdAt, from, to)) ids.add(r.customerId)
  for (const t of s.threads) if (t.customerId && within(t.updatedAt, from, to)) ids.add(t.customerId)
  for (const c of s.calls) if (c.customerId && within(c.startedAt, from, to)) ids.add(c.customerId)
  return ids.size
}

export function activeWeeks(s: S, n = 8) {
  const thisWeek = weekStart(s.clock)
  return Array.from({ length: n }, (_, i) => {
    const end = addDays(thisWeek, (i - n + 2) * 7)
    const capped = ms(end) > ms(s.clock) ? s.clock : end
    return { label: fmtDayMonth(addDays(thisWeek, (i - n + 1) * 7)), weekly: activeCustomers(s, 7, capped), monthly: activeCustomers(s, 30, capped) }
  })
}

/** Search to contact to booking to review, last 30 days, from Enquiry and Review records. */
export function funnel(s: S, days = 30) {
  const to = ms(s.clock)
  const from = to - days * MS_DAY
  const es = s.enquiries.filter((e) => within(e.at, from, to))
  const appear = es.filter((e) => e.kind === "search_appearance").length
  const views = es.filter((e) => e.kind === "profile_view").length
  const contacts = es.filter((e) => e.kind === "call" || e.kind === "message").length
  const bookings = es.filter((e) => e.kind === "booking").length
  // Reviews tied to a booking or a tracked call, so the step follows from the ones before it
  const reviews = s.reviews.filter((r) => (r.bookingId || r.callId) && within(r.createdAt, from, to)).length
  return [
    { step: "Shown in search", n: appear },
    { step: "Listing viewed", n: views },
    { step: "Called or messaged", n: contacts },
    { step: "Booked", n: bookings },
    { step: "Reviewed", n: reviews },
  ]
}

export const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0)

// ------------------------------------------------------------------ revenue

export function revenue(s: S) {
  const rules = rulesFor(s)
  const now = ms(s.clock)
  const paid = s.subscriptions.filter((x) => x.plan !== "free" && (x.status === "active" || x.status === "past_due"))
  const deskMrr = paid.filter((x) => x.plan === "desk").reduce((a, x) => a + x.pricePence, 0)
  const featMrr = paid.filter((x) => x.plan === "featured").reduce((a, x) => a + x.pricePence, 0)
  const mrr = deskMrr + featMrr
  const trials = s.subscriptions.filter((x) => x.plan === "desk" && x.status === "trialing" && s.deskConfigs.find((d) => d.businessId === x.businessId)?.status !== "off")
  const endingWeek = trials.filter((x) => ms(x.currentPeriodEnd) - now <= 7 * MS_DAY)
  const paidDesks = paid.filter((x) => x.plan === "desk").length
  const endedTrials = s.subscriptions.filter((x) => x.plan === "desk" && x.status === "cancelled").length
  const cancelledPaid = s.subscriptions.filter((x) => x.plan === "featured" && x.status === "cancelled").length
  const finished = paidDesks + endedTrials
  return {
    rules,
    mrr,
    runRate: mrr * 12,
    deskMrr,
    featMrr,
    paying: new Set(paid.map((x) => x.businessId)).size,
    paidDesks,
    pastDue: paid.filter((x) => x.status === "past_due").length,
    trials,
    endingWeek,
    potentialMrr: trials.length * rules.deskPricePence,
    trialFinished: finished,
    trialToPaid: finished ? pct(paidDesks, finished) : null,
    churned: endedTrials + cancelledPaid,
    churnRate: paid.length + cancelledPaid ? pct(cancelledPaid, paid.length + cancelledPaid) : 0,
    refunds: s.invoices.filter((i) => i.status === "refunded"),
    failedInvoices: s.invoices.filter((i) => i.status === "failed"),
  }
}

export function gateBreakdown(s: S) {
  const rows = s.businesses.map((b) => ({ b, g: gateStatus(s, b.id) }))
  return {
    rows,
    open: rows.filter((r) => r.g.met).length,
    enquiriesOnly: rows.filter((r) => !r.g.met && r.g.enquiriesOk && !r.g.daysOk).length,
    dateOnly: rows.filter((r) => !r.g.met && !r.g.enquiriesOk && r.g.daysOk).length,
    neither: rows.filter((r) => !r.g.met && !r.g.enquiriesOk && !r.g.daysOk).length,
    overrides: rows.filter((r) => r.g.override).length,
  }
}

/** Simulated price test: arms are deterministic from the seed (Rng), never real results. */
export function priceTest(s: S) {
  const rng = new Rng(20261025)
  const base = Math.max(30, s.businesses.length * 4)
  return [3900, 4900, 6900].map((price, i) => {
    const shown = base + rng.int(-4, 6)
    const startRate = [0.42, 0.36, 0.24][i]! + rng.int(-2, 2) / 100
    const trials = Math.round(shown * startRate)
    const payRate = [0.58, 0.55, 0.47][i]! + rng.int(-2, 2) / 100
    const paid = Math.round(trials * payRate)
    return { price, shown, trials, paid, conversion: pct(paid, shown), mrrPerHundred: Math.round(((paid / shown) * 100 * price) / 100) * 100 }
  })
}

// ------------------------------------------------------------------ costs

/** Unit-cost assumptions for the cost model (shown on S-03). Places spend is the recorded A-16 figure. */
export const UNIT_COSTS = {
  numberMonthlyPence: 100,
  voicePerMinPence: 2,
  smsPence: 4,
  aiPerTurnPence: 1,
  hostingMonthlyPence: 18000,
}

export const COST_LINES = [
  { key: "telephony", label: "Telephony numbers and minutes", color: C.blue },
  { key: "sms", label: "SMS", color: C.teal },
  { key: "ai", label: "AI reasoning", color: C.navy },
  { key: "places", label: "Google Places", color: C.sky },
  { key: "hosting", label: "Hosting", color: C.axis },
] as const

export type CostKey = (typeof COST_LINES)[number]["key"]

function deskActivity(s: S, businessId: string, from: number, to: number) {
  const listing = s.listings.find((l) => l.businessId === businessId)
  if (!listing) return { minutes: 0, sms: 0, turns: 0 }
  const calls = s.calls.filter((c) => c.listingId === listing.id && c.outcome === "desk" && within(c.startedAt, from, to))
  const minutes = calls.reduce((a, c) => a + Math.ceil(c.durationSec / 60), 0)
  const threads = new Map(s.threads.filter((t) => t.listingId === listing.id).map((t) => [t.id, t]))
  const deskMsgs = s.messages.filter((m) => m.author === "desk" && threads.has(m.threadId) && within(m.createdAt, from, to))
  const sms = deskMsgs.filter((m) => threads.get(m.threadId)?.channel === "sms").length
  const turns = deskMsgs.length + calls.reduce((a, c) => a + (c.transcript?.filter((l) => l.speaker === "desk").length ?? Math.ceil(c.durationSec / 20)), 0)
  return { minutes, sms, turns }
}

/** Monthly cost by line (last 30 days) and cost and margin per desk at the S-06 desk price. */
export function costs(s: S) {
  const to = ms(s.clock)
  const from = to - 30 * MS_DAY
  const rules = rulesFor(s)
  const desks = s.deskConfigs.filter((d) => d.status !== "off" || s.subscriptions.some((x) => x.businessId === d.businessId && x.plan === "desk" && x.status === "active"))
  const perDesk = desks.map((d) => {
    const a = deskActivity(s, d.businessId, from, to)
    const telephony = (d.number ? UNIT_COSTS.numberMonthlyPence : 0) + a.minutes * UNIT_COSTS.voicePerMinPence
    const sms = a.sms * UNIT_COSTS.smsPence
    const ai = a.turns * UNIT_COSTS.aiPerTurnPence
    const cost = telephony + sms + ai
    const sub = s.subscriptions.find((x) => x.businessId === d.businessId && x.plan === "desk")
    const revenue = sub?.status === "active" ? sub.pricePence : 0
    const name = s.listings.find((l) => l.businessId === d.businessId)?.name ?? d.businessId
    return { businessId: d.businessId, name, status: d.status, ...a, telephony, sms, ai, cost, revenue, marginAtList: rules.deskPricePence - cost }
  })
  const places = s.placesDays.filter((p) => within(`${p.date}T12:00:00.000Z`, from, to + MS_DAY)).reduce((a, p) => a + p.spendPence, 0)
  const lines: Record<CostKey, number> = {
    telephony: perDesk.reduce((a, d) => a + d.telephony, 0),
    sms: perDesk.reduce((a, d) => a + d.sms, 0),
    ai: perDesk.reduce((a, d) => a + d.ai, 0),
    places,
    hosting: UNIT_COSTS.hostingMonthlyPence,
  }
  const total = Object.values(lines).reduce((a, b) => a + b, 0)
  const avgDeskCost = perDesk.length ? Math.round(perDesk.reduce((a, d) => a + d.cost, 0) / perDesk.length) : 0
  const grossMarginPerDesk = rules.deskPricePence ? pct(rules.deskPricePence - avgDeskCost, rules.deskPricePence) : 0
  return { lines, total, perDesk, avgDeskCost, grossMarginPerDesk, budgets: { telephony: 15000, sms: 5000, ai: 20000, places: 60000, hosting: 25000, ...(s.settings.budgets ?? {}) } as Record<CostKey, number> }
}

// ------------------------------------------------------------------ growth

export function customerCount(s: S) {
  return s.customerProfiles.filter((p) => !s.users.find((u) => u.id === p.userId)?.deleted).length
}

/** Modelled weekly installs: accounts are real; installs per week are modelled from them (lib/prng). */
export function installWeeks(s: S, n = 8) {
  const rng = new Rng(20261026)
  const accounts = customerCount(s)
  const thisWeek = weekStart(s.clock)
  return Array.from({ length: n }, (_, i) => ({ label: fmtDayMonth(addDays(thisWeek, (i - n + 1) * 7)), installs: Math.round((accounts / n) * (0.7 + i * 0.08) + rng.int(0, 4)) }))
}

export function claimFunnel(s: S, filter: (l: Listing) => boolean = () => true) {
  const listings = s.listings.filter((l) => !l.mergedInto && filter(l))
  const claimed = listings.filter((l) => l.layer === "claimed" && l.businessId)
  const bizIds = new Set(claimed.map((l) => l.businessId!))
  const setup = claimed.filter((l) => {
    const b = s.businesses.find((x) => x.id === l.businessId)
    return b ? setupProgress(setupSteps(s, b, l)) === 100 : false
  }).length
  const trial = s.deskConfigs.filter((d) => bizIds.has(d.businessId) && d.trialUsed).length
  const paid = s.subscriptions.filter((x) => bizIds.has(x.businessId) && x.plan === "desk" && x.status === "active").length
  return [
    { step: "Unclaimed", n: listings.length - claimed.length },
    { step: "Claimed", n: claimed.length },
    { step: "Setup done", n: setup },
    { step: "Desk trial", n: trial },
    { step: "Paid", n: paid },
  ]
}

export function growthBy(s: S, key: "city" | "category") {
  const to = ms(s.clock)
  const from = to - 30 * MS_DAY
  const groups =
    key === "city"
      ? CITIES.map((c) => ({ id: c.id as string, name: c.name, match: (l: Listing) => l.city === c.id }))
      : ["plumbers", "electricians", "cleaners", "locksmiths", "barbers", "mobile-mechanics", "gardeners", "heating-engineers"].map((id) => ({ id, name: s.categories.find((c) => c.id === id)?.plural ?? id, match: (l: Listing) => l.categoryIds.includes(id) }))
  return groups.map((g) => {
    const ls = s.listings.filter((l) => !l.mergedInto && g.match(l))
    const ids = new Set(ls.map((l) => l.id))
    const es = s.enquiries.filter((e) => ids.has(e.listingId) && within(e.at, from, to))
    const views = es.filter((e) => e.kind === "profile_view").length
    const contacts = es.filter((e) => e.kind === "call" || e.kind === "message").length
    const bookings = es.filter((e) => e.kind === "booking").length
    const f = claimFunnel(s, g.match)
    return { id: g.id, name: g.name, listings: ls.length, claimed: f[1]!.n, trial: f[3]!.n, paid: f[4]!.n, views, contacts, bookings, contactRate: pct(contacts, views), bookingRate: pct(bookings, contacts) }
  })
}

// ------------------------------------------------------------------ alerts and security

export function alerts(s: S) {
  const out: { tone: "bad" | "warn" | "good"; title: string; body: string; href: string }[] = []
  const r = revenue(s)
  if (r.pastDue || r.failedInvoices.length) out.push({ tone: "bad", title: "Failed payments", body: `${r.pastDue} subscription${r.pastDue === 1 ? "" : "s"} past due`, href: "/admin/billing" })
  else out.push({ tone: "good", title: "Payments", body: "No failed payments", href: "/admin/billing" })
  const rated = s.calls.filter((c) => c.outcome === "desk" && c.qa)
  const bad = rated.filter((c) => c.qa !== "good").length
  const unrated = s.calls.filter((c) => c.outcome === "desk" && !c.qa).length
  out.push({ tone: bad ? "warn" : "good", title: "Desk error rate", body: rated.length ? `${pct(bad, rated.length)}% of ${rated.length} rated desk calls flagged in QA` : `No desk calls rated yet (${unrated} waiting in Desk QA)`, href: "/admin/desk-qa" })
  const today = s.placesDays.at(-1)
  const capPct = today ? Math.round((today.spendPence / Math.max(1, s.settings.placesCapPence)) * 100) : 0
  out.push({ tone: capPct >= 100 ? "bad" : capPct >= 80 ? "warn" : "good", title: "Places cap", body: `${capPct}% of today's cap used`, href: "/admin/places" })
  out.push({ tone: s.settings.killSwitch ? "bad" : "good", title: "Desk kill switch", body: s.settings.killSwitch ? "On: every desk is paused" : "Off: desks answering", href: "/admin/settings" })
  const p = platformFor(s)
  const off = (["signups", "claims", "payments", "ask", "gapFill"] as const).filter((k) => !p[k])
  if (p.maintenance || off.length) out.push({ tone: "warn", title: "Platform switches", body: [p.maintenance ? "Maintenance mode on" : "", off.length ? `Off: ${off.map((k) => SWITCH_NAMES[k]).join(", ")}` : ""].filter(Boolean).join(" · "), href: "/admin/super/switches" })
  const ints = (s.settings.integrations ?? []).filter((i) => i.status !== "ok")
  if (ints.length) out.push({ tone: ints.some((i) => i.status === "down") ? "bad" : "warn", title: "Integrations", body: ints.map((i) => `${i.name} ${i.status}`).join(", "), href: "/admin/super/integrations" })
  const unusual = unusualActivity(s)
  if (unusual.length) out.push({ tone: "warn", title: "Unusual activity", body: `${unusual.length} alert${unusual.length === 1 ? "" : "s"} in the security log`, href: "/admin/super/security" })
  return out
}

export const SWITCH_NAMES = { signups: "New sign-ups", claims: "Claims", payments: "Payments", ask: "Ask Answerd", gapFill: "Google gap-fill" } as const

export type SecurityKind = "sign_in" | "impersonation" | "export" | "role" | "switch" | "rules" | "other"

export function securityKind(a: Pick<AuditEvent, "action" | "targetId">): SecurityKind {
  const x = a.action
  if (x.startsWith("impersonate.") || x === "tenant.view_as_support") return "impersonation"
  if (x.startsWith("export.") || x.startsWith("data_request.export")) return "export"
  if (x.startsWith("admin_user.") || x.startsWith("permissions.") || x.startsWith("access_review.")) return "role"
  if (x.startsWith("switch.") || x.startsWith("desk.kill_switch") || (x === "settings.update" && /gapFillOn|featuredOn/.test(a.targetId))) return "switch"
  if (x.startsWith("rules.") || x.startsWith("budget.") || x.startsWith("integration.")) return "rules"
  return "other"
}

export const SECURITY_LABEL: Record<SecurityKind, string> = { sign_in: "Sign-in", impersonation: "Impersonation", export: "Export", role: "Role change", switch: "Switch flip", rules: "Rules and secrets", other: "Other admin write" }

export interface SecurityRow {
  id: string
  at: string
  kind: SecurityKind
  actorId: string | null
  who: string
  what: string
  target: string
  detail: string
  ok: boolean
}

export function securityRows(s: S): SecurityRow[] {
  const name = (id: string | null | undefined) => {
    const u = s.users.find((x) => x.id === id)
    return u ? `${u.firstName} ${u.lastName}` : id === "system" ? "System" : "Unknown"
  }
  const signIns: SecurityRow[] = s.signIns.map((x) => ({ id: x.id, at: x.at, kind: "sign_in", actorId: x.userId, who: x.userId ? name(x.userId) : x.email, what: x.ok ? "Signed in" : "Sign-in refused", target: x.method, detail: x.ok ? x.email : `${x.email}: ${x.detail ?? "refused"}`, ok: x.ok }))
  const audit: SecurityRow[] = s.audit.map((a) => ({ id: a.id, at: a.at, kind: securityKind(a), actorId: a.actorId, who: name(a.actorId), what: a.action, target: `${a.targetType} ${a.targetId}`, detail: a.reason, ok: true }))
  return [...signIns, ...audit].sort((a, b) => ms(b.at) - ms(a.at))
}

/** Simple rules: refused sign-ins, sign-ins between 10pm and 6am London, more than 2 exports in a day, long impersonations. */
export function unusualActivity(s: S) {
  const out: { id: string; at: string; title: string; body: string }[] = []
  for (const x of s.signIns) {
    const h = parts(x.at).h
    if (!x.ok) out.push({ id: `a-${x.id}`, at: x.at, title: "Refused sign-in", body: `${x.email}: ${x.detail ?? "refused"}` })
    else if (h >= 22 || h < 6) out.push({ id: `a-${x.id}`, at: x.at, title: "Sign-in at night", body: `${x.email} signed in at an unusual hour` })
  }
  const byDay = new Map<string, number>()
  for (const a of s.audit) if (securityKind(a) === "export") byDay.set(a.at.slice(0, 10), (byDay.get(a.at.slice(0, 10)) ?? 0) + 1)
  for (const [d, n] of byDay) if (n > 2) out.push({ id: `a-exp-${d}`, at: `${d}T12:00:00.000Z`, title: "Many exports", body: `${n} exports on one day` })
  const imp = s.session.impersonation
  if (imp && ms(imp.until) - ms(imp.startedAt) > 2 * MS_HOUR) out.push({ id: "a-imp", at: imp.startedAt, title: "Long impersonation", body: `Viewing as ${imp.label} for more than 2 hours` })
  return out.sort((a, b) => ms(b.at) - ms(a.at))
}

export function lastSignIn(s: S, userId: string) {
  return s.signIns.find((x) => x.userId === userId && x.ok)?.at ?? null
}
