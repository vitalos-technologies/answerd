// The AI front desk (D-01 to D-10) as scripted, timed behaviours, plus the in-chat reply used by D-03.
// Scripts read the business's real services, prices, hours and area, so they work for any claimed listing.
import type { DemoData } from "./seed"
import type { Listing, MessageCard, Service, TranscriptLine } from "./types"
import { POSTCODES, lookupPostcode } from "./geo"
import { emergencyIn, categoriesForText } from "./keywords"
import { fmtDate, fmtDateTime, fmtTime, addDays, dayKey, addMinutes, spokenSlot } from "./time"
import { priceRange } from "./format"
import {
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
  { id: "D-09", title: "Emergency (gas)", trigger: "Caller smells gas", channel: "call" },
  { id: "D-10", title: "Spam or sales call", trigger: "Sales call", channel: "call" },
] as const

export type ScriptId = (typeof DESK_SCRIPTS)[number]["id"]

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
  booking?: { serviceId: string; startAt: string; endAt: string; address: string; postcode: string; priceText: string }
  handoff?: string
  emergency?: "gas" | "life" | "power" | "flood" | null
  spam?: boolean
  summary: string
  ownerPush: { event: string; title: string; body: string; channels: ("push" | "sms" | "email")[] }
  quote?: { label: string; pricePence: number }
  reviewBookingId?: string
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

function ownerFirstName(s: S, listing: Listing) {
  const owner = s.members.find((m) => m.businessId === listing.businessId && m.role === "owner")
  return owner?.name.split(" ")[0] ?? "the owner"
}

function pickService(s: S, listing: Listing): Service | undefined {
  const svcs = servicesFor(s, listing.businessId).filter((x) => x.bookable)
  const cat = listing.categoryIds[0]
  if (cat === "heating-engineers" || listing.slug.startsWith("swift")) return svcs.find((x) => /boiler service/i.test(x.name)) ?? svcs[0]
  return svcs[0]
}

function callerPostcode(s: S, listing: Listing) {
  const inArea = POSTCODES.filter((p) => p.district === listing.postcodeDistrict && coversPostcode(s, listing.businessId, p.postcode))
  return inArea[1]?.postcode ?? inArea[0]?.postcode ?? listing.postcode
}

export function greetingFor(s: S, listing: Listing) {
  return deskFor(s, listing.businessId)?.greeting || `Hi, you've reached ${listing.name}. I'm their Answerd assistant and this call is recorded. How can I help?`
}

export function buildScript(s: S, scriptId: ScriptId, listing: Listing, runIndex = 0): BuiltScript {
  const caller = { ...CALLERS[runIndex % CALLERS.length]!, postcode: callerPostcode(s, listing), customerId: null as string | null }
  const owner = ownerFirstName(s, listing)
  const svc = pickService(s, listing)
  const slots = nextSlots(s, listing, svc, 2)
  const greeting = greetingFor(s, listing)
  const job = JOB_LINES[listing.categoryIds[0]!] ?? "I need some help with a job"
  const range = svc ? priceRange(svc) : "a price after a quick look"
  const first = caller.name.split(" ")[0]!
  // The desk books straight into free diary time (Core flow), whatever the business's booking mode
  const bookingFor = (slot: string | undefined) =>
    svc && slot
      ? { serviceId: svc.id, startAt: slot, endAt: addMinutes(slot, svc.durationMin), address: `${10 + runIndex} ${caller.postcode.startsWith("SE") ? "Elmers Road" : "Station Road"}`, postcode: caller.postcode, priceText: svc.priceType === "quote" ? "Quote" : range }
      : undefined
  const pushBase = { channels: ["push"] as ("push" | "sms" | "email")[] }

  switch (scriptId) {
    case "D-01": {
      const b = bookingFor(slots[0])
      return {
        plan: {
          scriptId, channel: "call", caller, service: svc, booking: b,
          summary: `${first}, ${caller.postcode}: ${job}. ${b ? `Booked ${svc!.name.toLowerCase()} ${fmtDateTime(b.startAt)}.` : "No free slots: owner to call back."}`,
          ownerPush: { ...pushBase, event: "desk_call", title: "Your desk took a call", body: `Your desk took a call from ${first}: ${svc?.name.toLowerCase() ?? "new job"}, ${caller.postcode.split(" ")[0]}.${b ? ` Booked ${fmtDate(b.startAt).split(" ")[0]} ${fmtTime(b.startAt)}.` : ""}` },
        },
        steps: [
          { speaker: "desk", text: greeting },
          { speaker: "caller", text: `Hi, ${job}.` },
          { speaker: "desk", text: "I can help with that. What's your postcode?" },
          { speaker: "caller", text: `It's ${caller.postcode}.` },
          { speaker: "desk", text: `Thanks, that's in ${listing.name}'s area. ${svc ? `${svc.name} is ${range}.` : ""} Is it urgent, or is this week fine?` },
          { speaker: "caller", text: "This week is fine." },
          slots.length
            ? { speaker: "desk", text: `The next two free times are ${slots.map((x) => spokenSlot(x, s.clock)).join(" or ")}. Which suits you?` }
            : { speaker: "desk", text: `${owner}'s diary is full this week, so I'll get ${owner} to call you back today.`, effect: "handoff" },
          ...(slots.length
            ? ([
                { speaker: "caller", text: `${spokenSlot(slots[0]!, s.clock).replace(/^./, (c) => c.toUpperCase())} please.` },
                { speaker: "desk", text: `You're booked for ${spokenSlot(slots[0]!, s.clock)} (${fmtDate(slots[0]!)}). I'll text you a confirmation now with what happens next. Thanks for calling ${listing.name}.`, effect: "book" },
              ] as ScriptStep[])
            : []),
        ],
      }
    }
    case "D-02":
    case "D-04": {
      const b = bookingFor(slots[0])
      const channel = "sms"
      return {
        plan: {
          scriptId, channel, caller, service: svc, booking: b,
          summary: `${first} texted about ${svc?.name.toLowerCase() ?? "a job"}. ${b ? `Booked ${fmtDateTime(b.startAt)}.` : ""}`,
          ownerPush: { ...pushBase, event: "desk_booking", title: "Your desk booked a job", body: `Your desk booked ${first}: ${svc?.name.toLowerCase()}, ${b ? fmtDateTime(b.startAt) : ""}.` },
        },
        steps: [
          { speaker: "caller", text: scriptId === "D-04" ? `Hi, you offered me ${slots[0] ? fmtDateTime(slots[0]) : "a slot"} earlier. Yes please, that works.` : `Hi, how much for ${svc?.name.toLowerCase() ?? "a visit"} and when are you free?` },
          ...(scriptId === "D-02"
            ? ([
                { speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant. ${svc?.name ?? "That"} is ${range}. These times are free:`, card: { kind: "slot", slots, serviceId: svc?.id } },
                { speaker: "caller", text: "The first one please." },
              ] as ScriptStep[])
            : []),
          { speaker: "desk", text: b ? `Done: you're booked for ${fmtDateTime(b.startAt)} at ${b.postcode}. A confirmation and calendar invite are on the way.` : `I'll get ${owner} to confirm a time.`, effect: b ? "book" : "handoff" },
        ],
      }
    }
    case "D-03": {
      const b = bookingFor(slots[0])
      return {
        plan: {
          scriptId, channel: "app", caller, service: svc, booking: b,
          summary: `${first} messaged in the app; the desk replied after 2 minutes and booked ${b ? fmtDateTime(b.startAt) : ""}.`,
          ownerPush: { ...pushBase, event: "desk_booking", title: "Your desk replied and booked", body: `Your desk replied to ${first} in the app and booked ${b ? fmtDateTime(b.startAt) : "a time"}.` },
        },
        steps: [
          { speaker: "caller", text: `Hi, ${job}. Are you free this week?` },
          { speaker: "desk", text: `Hi ${first}, I'm ${listing.name}'s Answerd assistant: ${owner} is busy right now. ${svc?.name ?? "That"} is ${range}. Here are the next free times:`, card: { kind: "slot", slots, serviceId: svc?.id } },
          { speaker: "caller", text: "The first one is perfect." },
          { speaker: "desk", text: b ? `Booked: ${fmtDateTime(b.startAt)}. ${owner} will see it in the diary.` : `I'll ask ${owner} to confirm.`, effect: b ? "book" : "handoff" },
        ],
      }
    }
    case "D-05": {
      const qPrice = svc && svc.priceType !== "quote" ? svc.priceToPence ?? svc.pricePence : 15000
      const b = bookingFor(slots[0])
      return {
        plan: {
          scriptId, channel: "app", caller, service: svc, booking: b,
          quote: { label: svc?.name ?? "Job as discussed", pricePence: qPrice },
          summary: `Followed up ${first}'s quote after 2 days; ${first} accepted and booked ${b ? fmtDateTime(b.startAt) : ""}.`,
          ownerPush: { ...pushBase, event: "quote_accepted", title: "Quote accepted", body: `${first} accepted your quote after the desk followed up.` },
        },
        steps: [
          { speaker: "desk", text: `Hi ${first}, just checking you got ${listing.name}'s quote for the ${svc?.name.toLowerCase() ?? "job"}. Happy to book a time?` },
          { speaker: "caller", text: "Yes, sorry, been busy. When can you do it?" },
          { speaker: "desk", text: "Here are the next free times:", card: { kind: "slot", slots, serviceId: svc?.id } },
          { speaker: "caller", text: "The first one works." },
          { speaker: "desk", text: b ? `Lovely, booked for ${fmtDateTime(b.startAt)}.` : `I'll ask ${owner} to confirm.`, effect: b ? "book" : "handoff" },
        ],
      }
    }
    case "D-06": {
      const recent = s.bookings.filter((x) => x.listingId === listing.id && x.status === "completed" && !x.reviewRequested).at(-1)
      return {
        plan: {
          scriptId, channel: "sms", caller: recent ? { ...caller, name: recent.customerName, customerId: recent.customerId } : caller, reviewBookingId: recent?.id,
          summary: `Sent one review request to ${recent?.customerName ?? first} by SMS.`,
          ownerPush: { ...pushBase, event: "review_request_sent", title: "Review request sent", body: `Your desk asked ${recent?.customerName ?? first} for a review.` },
        },
        steps: [{ speaker: "desk", text: `Hi ${(recent?.customerName ?? first).split(" ")[0]}, thanks for choosing ${listing.name}. How did we do? It takes 30 seconds: answerd.vitalos.co.uk/review/${recent?.id ?? "demo"}` }],
      }
    }
    case "D-07": {
      const today = s.bookings.filter((x) => x.listingId === listing.id && dayKey(x.startAt) === dayKey(s.clock) && ["confirmed", "on_the_way", "arrived"].includes(x.status))
      const overnight = s.enquiries.filter((e) => e.listingId === listing.id && ["call", "message", "booking"].includes(e.kind) && new Date(e.at).getTime() > new Date(s.clock).getTime() - 14 * 3_600_000).length
      const needs = s.threads.filter((t) => t.listingId === listing.id && t.status === "needs_owner").length
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
          { speaker: "desk", text: `${svc?.name ?? "That"} is ${range}. I can't change prices myself, so I'll get ${owner} to call you back within the hour. Is this the best number?`, effect: "handoff" },
          { speaker: "caller", text: "Yes, this number's fine." },
          { speaker: "desk", text: `Thanks ${first}. I've sent ${owner} your details and what you need.` },
        ],
      }
    }
    case "D-09": {
      const emergencySvc = servicesFor(s, listing.businessId).find((x) => /emergency/i.test(x.name))
      return {
        plan: {
          scriptId, channel: "call", caller, emergency: "gas",
          summary: `${first}, ${caller.postcode}: smells gas. Safety advice given (0800 111 999). Owner alerted. Nothing booked.`,
          ownerPush: { event: "emergency", title: `Emergency: ${first} smells gas`, body: `${first} (${caller.postcode}) smells gas. Told to leave and call 0800 111 999. Call them when safe.`, channels: ["push", "sms"] },
        },
        steps: [
          { speaker: "desk", text: greeting },
          { speaker: "caller", text: "I can smell gas in the kitchen, it's quite strong." },
          { speaker: "desk", text: "Please leave the property and call the National Gas Emergency Service on 0800 111 999 now.", effect: "alert_owner" },
          { speaker: "desk", text: "Don't use light switches or anything electrical, and open doors and windows on your way out if it's safe. If anyone feels unwell, please call 999." },
          { speaker: "caller", text: "OK, I'm going outside now." },
          {
            speaker: "desk",
            text: emergencySvc
              ? `I've alerted ${owner} now. Once the gas network says it's safe, ${listing.name} offers an emergency callout (${priceRange(emergencySvc)}). ${owner} will call you to arrange it.`
              : `I've alerted ${owner} now and they'll call you once you're safe.`,
          },
        ],
      }
    }
    case "D-10": {
      return {
        plan: { scriptId, channel: "call", caller: { ...caller, name: "Unknown caller", phone: "020 7946 0999" }, spam: true, summary: "Sales call about card machines. Ended politely, logged as spam.", ownerPush: { event: "spam", title: "", body: "", channels: [] } },
        steps: [
          { speaker: "desk", text: greeting },
          { speaker: "caller", text: "Hi, I'm calling from a payments company about cheaper card machines. Is the owner available?" },
          { speaker: "desk", text: `Thanks for calling, but ${listing.name} doesn't take sales calls on this line. Goodbye.` },
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
export function deskReply(s: S, listing: Listing, customerText: string, customerFirstName = ""): DeskReply {
  const t = customerText.toLowerCase()
  const svcs = servicesFor(s, listing.businessId)
  const owner = ownerFirstName(s, listing)
  const hi = customerFirstName ? `Hi ${customerFirstName}, ` : "Hi, "
  const intro = `${hi}I'm ${listing.name}'s Answerd assistant.`

  const emergency = emergencyIn(t)
  if (emergency === "gas") return { intent: "emergency", body: "Please leave the property and call the National Gas Emergency Service on 0800 111 999 now. I've alerted the owner.", handoff: "Emergency: gas" }
  if (emergency === "life") return { intent: "emergency", body: "Please call 999. I've alerted the owner.", handoff: "Emergency" }
  if (emergency === "power") return { intent: "emergency", body: "For a power cut, call 105. I've let the owner know.", handoff: "Power cut" }

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
