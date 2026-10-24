// The AI front desk (D-01 to D-10) as scripted, timed behaviours, plus the in-chat reply used by D-03.
// Scripts read the business's real services, prices, hours and area, so they work for any claimed listing.
// Hard rules (spec): greet as the business's Answerd assistant with a recording notice on every call; never quote
// outside the listed price ranges; never confirm a job outside the service area; never share the owner's number.
import type { DemoData } from "./seed"
import type { Listing, MessageCard, Service, TranscriptLine } from "./types"
import { POSTCODES, lookupPostcode, districtOf } from "./geo"
import { emergencyIn, categoriesForText } from "./keywords"
import { fmtDate, fmtDateTime, fmtTime, fmtClock, addDays, addHours, dayKey, addMinutes, spokenSlot } from "./time"
import { priceRange } from "./format"
import { uid } from "./prng"
import {
  areaFor,
  availabilityFor,
  businessById,
  coversPostcode,
  deskFor,
  membershipsFor,
  nextSlots,
  openStatus,
  servicesFor,
} from "./selectors"

type S = Pick<DemoData, keyof DemoData>

export const DESK_SCRIPTS = [
  { id: "D-01", title: "Missed call answered", trigger: "Call unanswered after 15 s, or outside hours", channel: "call" },
  { id: "D-02", title: "Text message", trigger: "Inbound SMS to the Answerd number", channel: "sms" },
  { id: "D-03", title: "In-app message", trigger: "Owner hasn't replied in 2 minutes", channel: "app" },
  { id: "D-04", title: "Customer agrees a time", trigger: "Customer says yes to a slot", channel: "sms" },
  { id: "D-05", title: "Quote follow-up", trigger: "Owner sent a quote 2 days ago", channel: "app" },
  { id: "D-06", title: "Review request", trigger: "Job marked Completed", channel: "sms" },
  { id: "D-07", title: "Daily digest", trigger: "7:00 each day", channel: "sms" },
  { id: "D-08", title: "Handoff to owner", trigger: "Price negotiation or named request", channel: "call" },
  { id: "D-09", title: "Emergency", trigger: "Gas smell, danger to life or power cut", channel: "call" },
  { id: "D-10", title: "Spam or sales call", trigger: "Sales call", channel: "call" },
] as const

export type ScriptId = (typeof DESK_SCRIPTS)[number]["id"]

export type EmergencyKind = "gas" | "life" | "power"
export const DESK_EMERGENCIES: { id: EmergencyKind; label: string }[] = [
  { id: "gas", label: "Gas smell" },
  { id: "life", label: "Danger to life" },
  { id: "power", label: "Power cut" },
]

/** The exact safety lines from the spec (D-09). */
export const SAFETY_LINES: Record<EmergencyKind, string> = {
  gas: "Please leave the property and call the National Gas Emergency Service on 0800 111 999 now.",
  life: "Please call 999.",
  power: "Call 105.",
}

export interface ScriptStep {
  speaker: "caller" | "desk" | "owner"
  text: string
  card?: MessageCard
  effect?: "alert_owner" | "book" | "handoff"
}

export interface ScriptPlan {
  scriptId: ScriptId
  channel: "call" | "sms" | "app" | "digest"
  caller: { name: string; phone: string; postcode: string; customerId: string | null }
  service?: Service
  booking?: { serviceId: string; startAt: string; endAt: string; address: string; postcode: string; priceText: string; status?: "confirmed" | "requested" }
  handoff?: string
  emergency?: EmergencyKind | null
  spam?: boolean
  outsideArea?: boolean
  summary: string
  ownerPush: { event: string; title: string; body: string; channels: ("push" | "sms" | "email")[] }
  quote?: { label: string; pricePence: number }
  reviewBookingId?: string
  /** D-06 when no finished job is waiting: the simulated job the owner just marked Completed. */
  completedJob?: { id: string; serviceId: string; startAt: string; endAt: string; address: string; postcode: string }
}

export interface BuiltScript {
  plan: ScriptPlan
  steps: ScriptStep[]
}

const CALLERS = [
  { name: "Amir K.", phone: "07700 900301" },
  { name: "Lucy E.", phone: "07700 900302" },
  { name: "Femi A.", phone: "07700 900303" },
  { name: "Holly C.", phone: "07700 900304" },
  { name: "Raj K.", phone: "07700 900305" },
  { name: "Megan W.", phone: "07700 900306" },
]

const JOB_LINES: Record<string, string> = {
  plumbers: "my kitchen tap won't stop dripping",
  "heating-engineers": "my boiler needs a service, it's making a banging noise",
  electricians: "half my sockets stopped working after the trip switch went",
  locksmiths: "I need the locks changed on my front door",
  cleaners: "I'd like a deep clean of a two-bed flat",
  "end-of-tenancy-cleaners": "I need an end of tenancy clean",
  "oven-cleaners": "my oven needs a proper clean",
  "carpet-cleaners": "the living room carpet needs cleaning",
  gardeners: "the garden's overgrown and needs a tidy",
  "mobile-mechanics": "my car's brakes are squealing",
  couriers: "I need a parcel taken across London today",
  "man-and-van": "I need a man and van to move a sofa",
  barbers: "I'd like a skin fade",
  "nail-technicians": "I'd like a gel manicure",
  handymen: "I need some shelves put up",
  "painters-decorators": "I need a bedroom painted",
}

const EMERGENCY_CALLER: Record<EmergencyKind, string> = {
  gas: "I can smell gas in the kitchen, it's quite strong.",
  life: "There are sparks coming out of the fuse box and my dad's collapsed on the floor.",
  power: "All the power's gone off, the whole street's dark.",
}

function ownerFirstName(s: S, listing: Listing) {
  const owner = s.members.find((m) => m.businessId === listing.businessId && m.role === "owner")
  return owner?.name.split(" ")[0] ?? "the owner"
}

const tokens = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/(ing|es|s)$/, ""))

/** The service the caller is asking about: matched from the job they describe, else the first bookable one. */
function pickService(s: S, listing: Listing, job: string): Service | undefined {
  const svcs = servicesFor(s, listing.businessId).filter((x) => x.bookable && !/emergency/i.test(x.name))
  const cat = listing.categoryIds[0]
  if (cat === "heating-engineers") {
    const m = svcs.find((x) => /boiler service/i.test(x.name))
    if (m) return m
  }
  if (cat === "plumbers") {
    const m = svcs.find((x) => /tap/i.test(x.name))
    if (m) return m
  }
  const jw = new Set(tokens(job))
  const scored = svcs.map((x) => ({ x, score: tokens(x.name).filter((w) => jw.has(w)).length })).sort((a, b) => b.score - a.score)
  return scored[0]?.score ? scored[0].x : svcs[0]
}

/** Is a postcode inside the business's service area? With no area set, only the listing's own district counts. */
export function deskCovers(s: S, listing: Listing, postcode: string) {
  if (!areaFor(s, listing.businessId)) {
    const pc = lookupPostcode(postcode)
    return !!pc && pc.district === listing.postcodeDistrict
  }
  return coversPostcode(s, listing.businessId, postcode)
}

function callerPostcode(s: S, listing: Listing) {
  const inArea = POSTCODES.filter((p) => p.district === listing.postcodeDistrict && deskCovers(s, listing, p.postcode))
  const any = POSTCODES.filter((p) => deskCovers(s, listing, p.postcode))
  return inArea[1]?.postcode ?? inArea[0]?.postcode ?? any[0]?.postcode ?? listing.postcode
}

/** A real postcode the business does not cover, nearest first (for the "outside the area" test call). */
export function outsidePostcode(s: S, listing: Listing) {
  const near = POSTCODES.filter((p) => !deskCovers(s, listing, p.postcode)).sort(
    (a, b) => Math.hypot(a.lat - listing.geo.lat, a.lng - listing.geo.lng) - Math.hypot(b.lat - listing.geo.lat, b.lng - listing.geo.lng),
  )
  return near[0]?.postcode ?? "M1 1AE"
}

/** "within 5 miles of SE25" or "SE25, SE19 and CR0" */
export function areaText(s: S, listing: Listing) {
  const area = areaFor(s, listing.businessId)
  if (!area || (!area.basePostcode && !area.districts.length)) return `${listing.postcodeDistrict} only (no service area set yet)`
  if (area.mode === "districts" && area.districts.length) {
    const d = area.districts
    return d.length === 1 ? d[0]! : `${d.slice(0, -1).join(", ")} and ${d.at(-1)}`
  }
  return `within ${area.radiusMiles} miles of ${districtOf(area.basePostcode)}`
}

/** Weekly hours as lines: "Mon to Fri 8am to 6pm". */
export function hoursLines(s: S, listing: Listing) {
  const avail = availabilityFor(s, listing.businessId)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  if (!avail?.weeklyHours.length) return []
  const order = [1, 2, 3, 4, 5, 6, 0]
  const rows = order.map((d) => {
    const h = avail.weeklyHours.find((x) => x.day === d)
    return { d, label: !h || h.closed ? "Closed" : `${fmtClock(h.open)} to ${fmtClock(h.close)}` }
  })
  const out: string[] = []
  let i = 0
  while (i < rows.length) {
    let j = i
    while (j + 1 < rows.length && rows[j + 1]!.label === rows[i]!.label) j++
    const span = i === j ? days[rows[i]!.d] : `${days[rows[i]!.d]} to ${days[rows[j]!.d]}`
    out.push(`${span}: ${rows[i]!.label}`)
    i = j + 1
  }
  return out
}

/** What the desk may say about a price: only the listed range, never an invented figure. */
export function deskPriceLine(svc: Service | undefined, owner: string) {
  if (!svc) return `${owner} will confirm the price.`
  if (svc.priceType === "quote") return `${svc.name} is priced after ${owner} has had a look, so ${owner} will send you a quote.`
  return `${svc.name} is ${priceRange(svc)}.`
}

/** The greeting always says it is the business's Answerd assistant and that the call is recorded. */
export function ensureGreeting(greeting: string | undefined, businessName: string) {
  const g = greeting?.trim() || `Hi, you've reached ${businessName}. I'm their Answerd assistant and this call is recorded. How can I help?`
  const ai = /answerd assistant/i.test(g)
  const rec = /recorded/i.test(g)
  if (ai && rec) return g
  if (!ai && !rec) return `${g} I'm ${businessName}'s Answerd assistant and this call is recorded.`
  return ai ? `${g} This call is recorded.` : `${g} I'm ${businessName}'s Answerd assistant.`
}

export function greetingFor(s: S, listing: Listing) {
  return ensureGreeting(deskFor(s, listing.businessId)?.greeting, listing.name)
}

export interface ScriptOptions {
  caller?: { name: string; phone: string; customerId: string | null; postcode?: string }
  /** The caller books in the app afterwards (C-20 → C-21), so the desk shares times but doesn't book. */
  noBook?: boolean
  /** D-09 variant (default gas). */
  emergency?: EmergencyKind
  /** D-01: the caller gives a postcode outside the service area. */
  outsideArea?: boolean
}

const cap = (t: string) => t.replace(/^./, (c) => c.toUpperCase())

export function buildScript(s: S, scriptId: ScriptId, listing: Listing, runIndex = 0, opts: ScriptOptions = {}): BuiltScript {
  const base = opts.caller ?? { ...CALLERS[runIndex % CALLERS.length]!, customerId: null as string | null }
  const givenPc = opts.outsideArea ? outsidePostcode(s, listing) : opts.caller?.postcode ? lookupPostcode(opts.caller.postcode)?.postcode : undefined
  const caller = { ...base, postcode: givenPc ?? callerPostcode(s, listing) }
  const inArea = deskCovers(s, listing, caller.postcode)
  const desk = deskFor(s, listing.businessId)
  const biz = businessById(s, listing.businessId)
  const canBook = desk?.permissions.book !== false
  const owner = ownerFirstName(s, listing)
  const listed = servicesFor(s, listing.businessId)
  const job0 = JOB_LINES[listing.categoryIds[0]!] ?? ""
  const svc = pickService(s, listing, job0)
  // The caller asks for something the business lists
  const matches = !!svc && tokens(svc.name).some((w) => tokens(job0).includes(w))
  const job = svc ? (matches ? job0 : `I'm calling about ${svc.name.toLowerCase()}`) : job0 || "I need some help with a job"
  const slots = nextSlots(s, listing, svc, 2)
  const status = openStatus(s, listing, s.clock)
  const greeting = greetingFor(s, listing)
  const price = deskPriceLine(svc, owner)
  const first = caller.name.split(" ")[0]!
  const district = lookupPostcode(caller.postcode)?.district ?? districtOf(caller.postcode)
  const bookingFor = (slot: string | undefined) =>
    svc && slot
      ? { serviceId: svc.id, startAt: slot, endAt: addMinutes(slot, svc.durationMin), address: `${10 + runIndex} ${caller.postcode.startsWith("SE") ? "Elmers Road" : "Station Road"}, London`, postcode: caller.postcode, priceText: svc.priceType === "quote" ? "Quote" : priceRange(svc) }
      : undefined
  const pushBase = { channels: ["push"] as ("push" | "sms" | "email")[] }
  const busyLine = status.holiday ? `${listing.name} is away at the moment (${status.label.toLowerCase()}), but I can help.` : status.open ? `${owner} is on a job right now, but I can help.` : `${listing.name} is closed right now (${status.label.replace(/^Opens/, "opens")}), but I can help.`
  const spoken = slots.map((x) => spokenSlot(x, s.clock))

  // Shared "can't book this" endings
  const outsideSteps = (): ScriptStep[] => [
    { speaker: "desk", text: `Thanks. I'm sorry, ${caller.postcode} is outside ${listing.name}'s service area (${areaText(s, listing)}), so I can't book that. I'll text you a link to businesses on Answerd that cover ${district}.` },
    { speaker: "caller", text: "Oh, OK. Thanks anyway." },
    { speaker: "desk", text: `Sorry we couldn't help this time. Thanks for calling ${listing.name}.` },
  ]
  const outsidePlan = (): BuiltScript["plan"] => ({
    scriptId, channel: "call", caller, service: svc, outsideArea: true,
    summary: `${first}, ${caller.postcode}: ${job}. Outside your service area, so nothing booked. Sent a link to businesses that cover ${district}.`,
    ownerPush: { ...pushBase, event: "desk_call", title: "Your desk took a call", body: `Your desk took a call from ${first}: ${svc?.name.toLowerCase() ?? "new job"}, ${district}. Outside your area, nothing booked.` },
  })

  switch (scriptId) {
    case "D-01": {
      const intro: ScriptStep[] = [
        { speaker: "desk", text: greeting },
        { speaker: "caller", text: `Hi, ${job}.` },
        { speaker: "desk", text: `${busyLine} What's your postcode?` },
        { speaker: "caller", text: `It's ${caller.postcode}.` },
      ]
      if (!inArea) return { plan: outsidePlan(), steps: [...intro, ...outsideSteps()] }
      if (!svc) {
        return {
          plan: {
            scriptId, channel: "call", caller, handoff: "Job not in your listed services",
            summary: `${first}, ${caller.postcode}: ${job}. Not in your listed services, so the desk didn't quote or book. Call back within the hour.`,
            ownerPush: { event: "handoff", title: `${first} needs you`, body: `${first} needs you: a job that isn't in your listed services. Call back within the hour.`, channels: ["push", "sms"] },
          },
          steps: [
            ...intro,
            { speaker: "desk", text: `Thanks, that's in ${listing.name}'s area. I don't have a price for that, so I'll get ${owner} to call you back within the hour. Is this the best number?`, effect: "handoff" },
            { speaker: "caller", text: "Yes, this number's fine." },
            { speaker: "desk", text: `Thanks ${first}. I'll text you to confirm ${owner} has your details.` },
          ],
        }
      }
      if (opts.noBook) {
        return {
          plan: {
            scriptId, channel: "call", caller, service: svc,
            summary: `${first}, ${caller.postcode}: ${job}. Shared prices and free times (${spoken.join(", ") || "none in the next two weeks"}); ${first} will book in the app.`,
            ownerPush: { ...pushBase, event: "desk_call", title: "Your desk took a call", body: `Your desk took a call from ${first}: ${svc.name.toLowerCase()}, ${district}. Shared prices and times.` },
          },
          steps: [
            ...intro,
            { speaker: "desk", text: `Thanks, that's in ${listing.name}'s area. ${price} ${slots.length ? `The next free times are ${spoken.join(" or ")}.` : `There's nothing free in the next two weeks, so ${owner} will call you back.`}` },
            { speaker: "caller", text: "Thanks, I'll book in the app." },
            { speaker: "desk", text: `Lovely. I've texted you the details. Thanks for calling ${listing.name}.` },
          ],
        }
      }
      const b = canBook ? bookingFor(slots[0]) : undefined
      const steps: ScriptStep[] = [
        ...intro,
        { speaker: "desk", text: `Thanks, that's in ${listing.name}'s area. ${price} Is it urgent, or is this week fine?` },
        { speaker: "caller", text: "This week is fine." },
      ]
      let handoff: string | undefined
      if (!slots.length) {
        handoff = "No free times: call back"
        steps.push({ speaker: "desk", text: `${status.holiday ? `${listing.name} is away until ${status.label.replace(/^Back on /, "")}` : `${owner}'s diary is full for the next two weeks`}, so I'll get ${owner} to call you back today to find a time.`, effect: "handoff" })
      } else if (!canBook) {
        handoff = "Wants a booking: confirm a time"
        steps.push(
          { speaker: "desk", text: `The next free times are ${spoken.join(" or ")}. Which suits you?` },
          { speaker: "caller", text: `${cap(spoken[0]!)} please.` },
          { speaker: "desk", text: `Thanks. ${owner} confirms bookings personally, so I'll ask ${owner} to confirm ${spoken[0]} and text you within the hour.`, effect: "handoff" },
        )
      } else {
        steps.push(
          { speaker: "desk", text: `The next two free times are ${spoken.join(" or ")}. Which suits you?` },
          { speaker: "caller", text: `${cap(spoken[0]!)} please.` },
          { speaker: "desk", text: `You're booked for ${spoken[0]} (${fmtDate(slots[0]!)}). I'll text you a confirmation now with what happens next. Thanks for calling ${listing.name}.`, effect: "book" },
        )
      }
      return {
        plan: {
          scriptId, channel: "call", caller, service: svc, booking: b, handoff,
          summary: `${first}, ${caller.postcode}: ${job}. ${b ? `Booked ${svc.name.toLowerCase()} ${fmtDateTime(b.startAt)}.` : handoff === "Wants a booking: confirm a time" ? `Wants ${spoken[0]}: confirm with ${first}.` : "No free times: call back today."}`,
          ownerPush: { ...pushBase, event: "desk_call", title: "Your desk took a call", body: `Your desk took a call from ${first}: ${svc.name.toLowerCase()}, ${district}.${b ? ` Booked ${fmtDate(b.startAt).split(" ")[0]} ${fmtTime(b.startAt)}.` : " Needs you to call back."}` },
        },
        steps,
      }
    }
    case "D-02":
    case "D-04": {
      const requestMode = scriptId === "D-04" && biz?.bookingMode === "request"
      const raw = canBook ? bookingFor(slots[0]) : undefined
      const b = raw ? { ...raw, status: requestMode ? ("requested" as const) : ("confirmed" as const) } : undefined
      const first1 = scriptId === "D-04" ? `Hi, you offered me ${slots[0] ? fmtDateTime(slots[0]) : "a time"} earlier. Yes please, that works.` : `Hi, how much for ${svc?.name.toLowerCase() ?? "a visit"} and when are you free? I'm in ${caller.postcode}.`
      const steps: ScriptStep[] = [{ speaker: "caller", text: first1 }]
      if (!svc || !slots.length) {
        steps.push({ speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant. ${svc ? `${price} There's nothing free in the next two weeks, so` : "I don't have a price for that, so"} I'll get ${owner} to reply within the hour.`, effect: "handoff" })
        return {
          plan: { scriptId, channel: "sms", caller, service: svc, handoff: svc ? "No free times" : "Job not in your listed services", summary: `${first} texted about ${svc?.name.toLowerCase() ?? "a job"}. Nothing booked: needs a reply.`, ownerPush: { event: "handoff", title: `${first} needs you`, body: `${first} needs you: ${svc ? "no free times this fortnight" : "a job that isn't in your listed services"}. Reply within the hour.`, channels: ["push", "sms"] } },
          steps,
        }
      }
      if (scriptId === "D-02") {
        steps.push(
          { speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant. ${caller.postcode} is in our area. ${price} These times are free:`, card: { kind: "slot", slots, serviceId: svc.id } },
          { speaker: "caller", text: "The first one please." },
        )
      }
      if (!b) {
        steps.push({ speaker: "desk", text: `Thanks. ${owner} confirms bookings personally, so I'll ask ${owner} to confirm ${fmtDateTime(slots[0]!)} and text you within the hour.`, effect: "handoff" })
      } else if (b.status === "requested") {
        steps.push({ speaker: "desk", text: `Thanks ${first}. ${listing.name} confirms each booking, so I've sent ${owner} a request for ${fmtDateTime(b.startAt)}. You'll get a text within 2 hours.`, effect: "book" })
      } else {
        steps.push({ speaker: "desk", text: `Done: you're booked for ${fmtDateTime(b.startAt)} at ${b.postcode}. A confirmation and calendar invite are on the way.`, effect: "book" })
      }
      return {
        plan: {
          scriptId, channel: "sms", caller, service: svc, booking: b, handoff: b ? undefined : "Wants a booking: confirm a time",
          summary: `${first} texted about ${svc.name.toLowerCase()}. ${b ? (b.status === "requested" ? `Sent you a request for ${fmtDateTime(b.startAt)}.` : `Booked ${fmtDateTime(b.startAt)}.`) : `Wants ${fmtDateTime(slots[0]!)}: confirm with ${first}.`}`,
          ownerPush: b?.status === "requested"
            ? { event: "booking_request", title: "New booking request", body: `New booking request: ${svc.name.toLowerCase()}, ${fmtDate(b.startAt).split(" ")[0]} ${fmtTime(b.startAt)}. Reply within 2 hours.`, channels: ["push", "sms"] }
            : b
              ? { ...pushBase, event: "desk_booking", title: "Your desk booked a job", body: `Your desk booked ${first}: ${svc.name.toLowerCase()}, ${fmtDateTime(b.startAt)}.` }
              : { event: "handoff", title: `${first} needs you`, body: `${first} needs you: wants ${fmtDateTime(slots[0]!)}. Confirm within the hour.`, channels: ["push", "sms"] },
        },
        steps,
      }
    }
    case "D-03": {
      const b = canBook ? bookingFor(slots[0]) : undefined
      const steps: ScriptStep[] = [{ speaker: "caller", text: `Hi, ${job}. Are you free this week?` }]
      if (!svc || !slots.length) {
        steps.push({ speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant: ${owner} is busy right now. ${svc ? `${price} There's nothing free in the next two weeks, so` : "I don't have a price for that, so"} I'll ask ${owner} to reply within the hour.`, effect: "handoff" })
        return {
          plan: { scriptId, channel: "app", caller, service: svc, handoff: svc ? "No free times" : "Job not in your listed services", summary: `${first} messaged in the app; the desk replied after 2 minutes and asked you to follow up.`, ownerPush: { event: "handoff", title: `${first} needs you`, body: `${first} needs you: ${svc ? "no free times this fortnight" : "a job that isn't in your listed services"}. Reply within the hour.`, channels: ["push", "sms"] } },
          steps,
        }
      }
      steps.push(
        { speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant: ${owner} is busy right now. ${price} Here are the next free times:`, card: { kind: "slot", slots, serviceId: svc.id } },
        { speaker: "caller", text: "The first one is perfect." },
        b
          ? { speaker: "desk", text: `Booked: ${fmtDateTime(b.startAt)}. ${owner} will see it in the diary.`, effect: "book" }
          : { speaker: "desk", text: `Thanks. I'll ask ${owner} to confirm ${fmtDateTime(slots[0]!)} with you shortly.`, effect: "handoff" },
      )
      return {
        plan: {
          scriptId, channel: "app", caller, service: svc, booking: b, handoff: b ? undefined : "Wants a booking: confirm a time",
          summary: `${first} messaged in the app; the desk replied after 2 minutes and ${b ? `booked ${fmtDateTime(b.startAt)}` : "asked you to confirm a time"}.`,
          ownerPush: { ...pushBase, event: "desk_booking", title: b ? "Your desk replied and booked" : "Your desk replied", body: b ? `Your desk replied to ${first} in the app and booked ${fmtDateTime(b.startAt)}.` : `Your desk replied to ${first} in the app. ${first} wants ${fmtDateTime(slots[0]!)}.` },
        },
        steps,
      }
    }
    case "D-05": {
      // The owner's quote, at the top of the service's listed range
      const priced = svc && svc.priceType !== "quote" ? svc : listed.find((x) => x.priceType !== "quote")
      const qPrice = priced ? priced.priceToPence ?? priced.pricePence : 15000
      const b = canBook ? bookingFor(slots[0]) : undefined
      const label = svc?.name ?? priced?.name ?? "Job as discussed"
      const steps: ScriptStep[] = [
        { speaker: "desk", text: `Hi ${first}, just checking you got ${listing.name}'s quote for the ${label.toLowerCase()}. Happy to book a time?` },
        { speaker: "caller", text: "Yes, sorry, been busy. When can you do it?" },
      ]
      if (slots.length) {
        steps.push(
          { speaker: "desk", text: "Here are the next free times:", card: { kind: "slot", slots, serviceId: svc?.id } },
          { speaker: "caller", text: "The first one works." },
          b ? { speaker: "desk", text: `Lovely, booked for ${fmtDateTime(b.startAt)}.`, effect: "book" } : { speaker: "desk", text: `Thanks. I'll ask ${owner} to confirm ${fmtDateTime(slots[0]!)} with you.`, effect: "handoff" },
        )
      } else {
        steps.push({ speaker: "desk", text: `There's nothing free in the next two weeks, so I'll ask ${owner} to call you to find a time.`, effect: "handoff" })
      }
      return {
        plan: {
          scriptId, channel: "app", caller, service: svc, booking: b, handoff: b ? undefined : "Quote accepted: find a time",
          quote: { label, pricePence: qPrice },
          summary: `Followed up ${first}'s quote after 2 days; ${first} accepted${b ? ` and booked ${fmtDateTime(b.startAt)}` : ": needs a time"}.`,
          ownerPush: { ...pushBase, event: "quote_accepted", title: "Quote accepted", body: `${first} accepted your quote after the desk followed up.` },
        },
        steps,
      }
    }
    case "D-06": {
      const recent = s.bookings.filter((x) => x.listingId === listing.id && x.status === "completed" && !x.reviewRequested).at(-1)
      // Trigger: a job marked Completed. If none is waiting, the simulation completes one for this caller.
      const jobSvc = svc ?? listed[0]
      const completedJob = !recent && jobSvc ? { id: uid("bk"), serviceId: jobSvc.id, startAt: addHours(s.clock, -3), endAt: addMinutes(addHours(s.clock, -3), jobSvc.durationMin), address: `${10 + runIndex} Elmers Road, London`, postcode: caller.postcode } : undefined
      const name = recent?.customerName ?? caller.name
      const bookingId = recent?.id ?? completedJob?.id
      if (!bookingId) {
        return {
          plan: { scriptId, channel: "digest", caller, summary: "No completed jobs to ask about yet.", ownerPush: { event: "", title: "", body: "", channels: [] } },
          steps: [{ speaker: "desk", text: `When you mark a job Completed, I'll send the customer one review request. I never ask twice.` }],
        }
      }
      return {
        plan: {
          scriptId, channel: "sms", caller: recent ? { ...caller, name: recent.customerName, customerId: recent.customerId, phone: recent.customerPhone || caller.phone } : caller, reviewBookingId: bookingId, completedJob,
          summary: `Sent one review request to ${name} by SMS.`,
          ownerPush: { ...pushBase, event: "review_request_sent", title: "Review request sent", body: `Your desk asked ${name} for a review.` },
        },
        steps: [{ speaker: "desk", text: `Hi ${name.split(" ")[0]}, thanks for choosing ${listing.name}. How did we do? It takes 30 seconds: answerd.vitalos.co.uk/review/${bookingId}` }],
      }
    }
    case "D-07": {
      const today = s.bookings.filter((x) => x.listingId === listing.id && dayKey(x.startAt) === dayKey(s.clock) && ["confirmed", "on_the_way", "arrived"].includes(x.status)).sort((a, b) => a.startAt.localeCompare(b.startAt))
      const overnight = s.enquiries.filter((e) => e.listingId === listing.id && ["call", "message", "booking"].includes(e.kind) && new Date(e.at).getTime() > new Date(s.clock).getTime() - 14 * 3_600_000).length
      const needs = s.threads.filter((t) => t.listingId === listing.id && t.status === "needs_owner" && !t.spam).length
      const body = `Morning ${owner}. Today: ${today.length} job${today.length === 1 ? "" : "s"}${today[0] ? `, first at ${fmtTime(today[0].startAt)}` : ""}. Overnight: ${overnight} new enquir${overnight === 1 ? "y" : "ies"}. Needs you: ${needs}.`
      return {
        plan: { scriptId, channel: "digest", caller, summary: body, ownerPush: { event: "daily_digest", title: "Daily digest", body, channels: ["sms"] } },
        steps: [{ speaker: "desk", text: body }],
      }
    }
    case "D-08": {
      return {
        plan: {
          scriptId, channel: "call", caller, service: svc, handoff: "Wants to talk about price",
          summary: `${first}, ${caller.postcode}: wants a discount on ${svc?.name.toLowerCase() ?? "the job"}. Handed to ${owner}: call back within the hour.`,
          ownerPush: { event: "handoff", title: `${first} needs you`, body: `${first} needs you: wants to talk about price. Call back within the hour.`, channels: ["push", "sms"] },
        },
        steps: [
          { speaker: "desk", text: greeting },
          { speaker: "caller", text: `How much is ${svc?.name.toLowerCase() ?? "a visit"}? Can you do it cheaper if I pay cash?` },
          { speaker: "desk", text: `${price} I can't change prices myself, so I'll get ${owner} to call you back within the hour. Is this the best number?`, effect: "handoff" },
          { speaker: "caller", text: "Yes, this number's fine." },
          { speaker: "desk", text: `Thanks ${first}. I've sent ${owner} your details and what you need.` },
        ],
      }
    }
    case "D-09": {
      const kind: EmergencyKind = opts.emergency ?? "gas"
      const emergencySvc = listed.find((x) => /emergency|call-?out/i.test(x.name))
      const offersCallout = !!emergencySvc || !!biz?.emergencyCallout
      const what = kind === "gas" ? "smells gas" : kind === "life" ? "reports sparks and someone collapsed" : "has a power cut"
      const advice = kind === "gas" ? "Told to leave and call 0800 111 999" : kind === "life" ? "Told to call 999" : "Told to call 105"
      const steps: ScriptStep[] = [
        { speaker: "desk", text: greeting },
        { speaker: "caller", text: EMERGENCY_CALLER[kind] },
        { speaker: "desk", text: SAFETY_LINES[kind], effect: "alert_owner" },
      ]
      if (kind === "gas") steps.push({ speaker: "desk", text: "Don't use light switches or anything electrical, and open doors and windows on your way out if it's safe to." })
      if (kind === "life") steps.push({ speaker: "desk", text: "Don't touch the fuse box or anyone who may be in contact with it. Stay on with 999 until help arrives." })
      if (kind === "power") steps.push({ speaker: "desk", text: "105 is the free power cut line. They'll tell you what's happening and when it's back on." })
      steps.push(
        { speaker: "caller", text: kind === "power" ? "OK, I'll call them." : "OK, I'm doing that now." },
        {
          speaker: "desk",
          text: offersCallout
            ? `I've alerted ${owner} now. Once it's safe, ${listing.name} offers an emergency callout${emergencySvc ? ` (${priceRange(emergencySvc)})` : ""}. ${owner} will call you to arrange it.`
            : `I've alerted ${owner} now and they'll call you once you're safe.`,
        },
      )
      return {
        plan: {
          scriptId, channel: "call", caller, emergency: kind, handoff: kind === "gas" ? "Emergency: gas smell" : kind === "life" ? "Emergency: danger to life" : "Emergency: power cut",
          summary: `${first}, ${caller.postcode}: ${what}. Safety advice given first (${SAFETY_LINES[kind]}). Owner alerted. Nothing booked.`,
          ownerPush: { event: "emergency", title: `Emergency: ${first} ${what}`, body: `${first} (${caller.postcode}) ${what}. ${advice}. Call them when safe.`, channels: ["push", "sms"] },
        },
        steps,
      }
    }
    case "D-10": {
      return {
        plan: { scriptId, channel: "call", caller: { ...caller, name: "Unknown caller", phone: "020 7946 0999" }, spam: true, summary: "Sales call about card machines. Ended politely, logged as spam.", ownerPush: { event: "spam", title: "", body: "", channels: [] } },
        steps: [
          { speaker: "desk", text: greeting },
          { speaker: "caller", text: "Hi, I'm calling from a payments company about cheaper card machines. Is the owner available?" },
          { speaker: "desk", text: `Thanks for calling. ${listing.name} doesn't take sales calls on this number, so I'll end the call here. Have a good day.` },
        ],
      }
    }
  }
}

export function stepsToTranscript(steps: ScriptStep[]): TranscriptLine[] {
  let t = 0
  return steps.map((st) => {
    const line = { speaker: st.speaker, text: st.text, atSec: t }
    t += Math.max(3, Math.round(st.text.length / 14))
    return line
  })
}

// ---------------------------------------------------------------- D-03 in-chat reply

export interface DeskReply {
  body: string
  card?: MessageCard
  intent: "price" | "availability" | "area" | "emergency" | "booking" | "general" | "handoff"
  handoff?: string
}

/** What the desk says in C-22 when the owner hasn't replied. Never quotes outside listed ranges. */
export function deskReply(s: S, listing: Listing, fullText: string, customerFirstName = ""): DeskReply {
  // Enquiries (C-23) append "Postcode: … · When: …"; read intent from the message itself
  const [customerText = "", meta = ""] = fullText.split("\n\n")
  const metaPostcode = meta.match(/Postcode: ([A-Z0-9 ]+)/i)?.[1]?.trim()
  const t = customerText.toLowerCase()
  const svcs = servicesFor(s, listing.businessId)
  const owner = ownerFirstName(s, listing)
  const hi = customerFirstName ? `Hi ${customerFirstName}, ` : "Hi, "
  const intro = `${hi}I'm ${listing.name}'s Answerd assistant.`

  const emergency = emergencyIn(t)
  if (emergency === "gas") return { intent: "emergency", body: `${SAFETY_LINES.gas} I've alerted the owner.`, handoff: "Emergency: gas smell" }
  if (emergency === "life") return { intent: "emergency", body: `${SAFETY_LINES.life} I've alerted the owner.`, handoff: "Emergency: danger to life" }
  if (emergency === "power") return { intent: "emergency", body: "Call 105. That's the free power cut line. I've let the owner know.", handoff: "Emergency: power cut" }
  if (emergency === "flood") return { intent: "emergency", body: `If you can do it safely, turn off the water at the stopcock and keep away from electrics near the water. I've alerted ${owner}, who'll call you back now.`, handoff: "Emergency: flooding" }

  if (/(cheaper|discount|cash|best price|negotiat|complain|refund|unhappy)/.test(t)) {
    return { intent: "handoff", body: `${intro} I can't change prices or handle complaints myself, so I'll get ${owner} to reply within the hour.`, handoff: /complain|refund|unhappy/.test(t) ? "Complaint" : "Wants to talk about price" }
  }

  // Which service are they asking about?
  const words = t.replace(/[^a-z0-9 ]/g, " ")
  const scored = svcs
    .map((x) => {
      const name = x.name.toLowerCase()
      let score = 0
      for (const w of name.split(/[^a-z0-9]+/)) if (w.length > 2 && words.includes(w)) score += 1
      if (/3|three|4|four/.test(words) && /3 to 4/.test(name)) score += 2
      if (/1|one|2|two/.test(words) && /1 to 2/.test(name)) score += 1
      return { x, score }
    })
    .sort((a, b) => b.score - a.score)
  const svc = scored[0]?.score ? scored[0].x : svcs.find((x) => x.bookable)
  const slots = nextSlots(s, listing, svc, 2)
  const status = openStatus(s, listing, s.clock)

  if (metaPostcode) {
    const pc = lookupPostcode(metaPostcode)
    if (pc && !coversPostcode(s, listing.businessId, pc.postcode)) {
      return { intent: "area", body: `${intro} Sorry, ${pc.postcode} is outside ${listing.name}'s service area, so I can't book that. Answerd can show you businesses that cover it.` }
    }
  }

  // The owner's custom answers (B-34) come first when the question clearly matches
  const STOP = new Set(["you", "the", "and", "for", "your", "what", "how", "can", "doe", "are", "any", "with", "that", "this", "have"])
  const tw = new Set(tokens(customerText))
  const hit = (deskFor(s, listing.businessId)?.qna ?? [])
    .map((x) => ({ x, n: tokens(x.q).filter((w) => !STOP.has(w) && tw.has(w)).length }))
    .sort((a, b) => b.n - a.n)[0]
  if (hit && hit.n >= 2) return { intent: "general", body: `${intro} ${hit.x.a}` }

  const pcMatch = customerText.toUpperCase().match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)(\s*\d[A-Z]{2})?\b/)
  if (pcMatch && /(cover|area|come to|travel|postcode)/.test(t)) {
    const pc = lookupPostcode(pcMatch[0])
    if (pc && !coversPostcode(s, listing.businessId, pc.postcode)) {
      return { intent: "area", body: `${intro} Sorry, ${pc.postcode} is outside ${listing.name}'s service area, so I can't book that. Answerd can show you businesses that cover it.` }
    }
    return { intent: "area", body: `${intro} Yes, ${pc?.postcode ?? pcMatch[0]} is in our area.${slots.length ? " Here are the next free times:" : ""}`, card: slots.length ? { kind: "slot", slots, serviceId: svc?.id } : undefined }
  }

  const asksPrice = /(how much|price|cost|quote|charge|£)/.test(t)
  const asksTime = /(free|available|when|today|tomorrow|this week|slot|book|appointment|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/.test(t)

  if (asksPrice && svc) {
    const priceLine = svc.priceType === "quote" ? `${svc.name} is priced after ${owner} has a look, so I'll ask ${owner} to send a quote.` : `${svc.name} is ${priceRange(svc)}.`
    return {
      intent: "price",
      body: `${intro} ${priceLine}${slots.length && svc.bookable ? " These times are free:" : ""}`,
      card: slots.length && svc.bookable ? { kind: "slot", slots, serviceId: svc.id } : undefined,
    }
  }
  if (asksTime || categoriesForText(t).some((c) => listing.categoryIds.includes(c))) {
    if (!slots.length) return { intent: "availability", body: `${intro} ${status.holiday ? `${listing.name} is away (${status.label}).` : `There's nothing free in the next two weeks.`} I'll ask ${owner} to reply.` }
    return { intent: "availability", body: `${intro} ${svc ? `${svc.name} is ${priceRange(svc)}. ` : ""}The next free times are below.`, card: { kind: "slot", slots, serviceId: svc?.id } }
  }
  return { intent: "general", body: `${intro} ${owner} usually replies within the hour. If you tell me the job and your postcode I can share prices and free times now.` }
}

export function ownerUserIds(s: S, businessId: string | undefined, includeStaff = false) {
  return s.members.filter((m) => m.businessId === businessId && m.userId && m.joinedAt && (includeStaff || m.role === "owner")).map((m) => m.userId!) as string[]
}

export function isBusinessUser(s: S, userId: string | null) {
  return membershipsFor(s, userId).length > 0
}

export { addDays }
