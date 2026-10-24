// Ask Answerd (Q-01 to Q-06): a scripted concierge that turns free text into a category, urgency and
// location, asks at most two follow-ups, then matches up to three businesses with a reason for each.
import type { DemoData } from "./seed"
import type { Listing } from "./types"
import { matchKeywords, emergencyIn } from "./keywords"
import { lookupPostcode } from "./geo"
import { search } from "./search"
import { isDeskLive, listingRating, nextSlots, servicesFor, verifiedCredentials } from "./selectors"
import { fmtRelDay, fmtTime } from "./time"

type S = Pick<DemoData, keyof DemoData>

export const ASK_OPENING = "Need a local service? I'll help you find the right business."
export const ASK_CHIPS = ["Boiler not working", "End of tenancy clean", "Car won't start", "Haircut today"]
export const GUEST_LIMIT = 5

export interface AskContext {
  categories: string[]
  description: string[]
  postcode?: string
  urgent?: boolean
  leaking?: boolean
  asked: ("postcode" | "leak")[]
  pending?: "postcode" | "leak"
  radius: number
}

export interface AskMatch {
  listingId: string
  reason: string
  bookable: boolean
  claimed: boolean
}

export interface AskReply {
  text: string
  matches?: AskMatch[]
  online?: boolean
  safety?: "gas" | "life" | "power" | "flood"
  chips?: string[]
  /** Pre-filled enquiry text for Q-04 (Message opens C-23 with it). */
  summary?: string
}

/** What the understanding step extracts; the optional Claude route returns the same shape. */
export interface Understanding {
  categories: string[]
  postcode?: string
  urgent: boolean
  emergency: AskReply["safety"] | null
  leaking?: boolean
  offTopic?: "medical" | "legal" | "financial" | null
}

export function emptyContext(): AskContext {
  return { categories: [], description: [], asked: [], radius: 10 }
}

export function understand(text: string): Understanding {
  const t = text.toLowerCase()
  const rules = matchKeywords(t)
  const categories: string[] = []
  for (const r of rules) for (const c of r.categories) if (!categories.includes(c)) categories.push(c)
  const pc = text.toUpperCase().match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?)(\s*\d[A-Z]{2})?\b/)
  const postcode = pc && lookupPostcode(pc[0]) ? lookupPostcode(pc[0])!.postcode : undefined
  const offTopic = /\b(doctor|gp|medicine|medical|symptom|prescription)\b/.test(t)
    ? "medical"
    : /\b(lawyer|solicitor|legal advice|sue|tribunal)\b/.test(t)
      ? "legal"
      : /\b(invest|mortgage|loan|pension|crypto|tax advice)\b/.test(t)
        ? "financial"
        : null
  const yes = /^(yes|yeah|yep|it is|it's leaking|leaking|water everywhere)\b/.test(t.trim())
  const no = /^(no|nope|not now|not really|it's not|its not)\b/.test(t.trim())
  return {
    categories,
    postcode,
    urgent: rules.some((r) => r.urgent) || /\b(urgent|asap|today|now|emergency|right away)\b/.test(t),
    emergency: emergencyIn(t),
    leaking: yes ? true : no ? false : undefined,
    offTopic,
  }
}

const SAFETY: Record<NonNullable<AskReply["safety"]>, string> = {
  gas: "Please leave the property now and call the National Gas Emergency Service on 0800 111 999. Don't use light switches or anything electrical. If anyone feels unwell or life is at risk, call 999.",
  life: "If anyone is hurt or in danger, call 999 now. Keep away from anything sparking and switch off at the fuse box only if it's safe to do so.",
  power: "For a power cut, call 105 to reach your local network operator. If anyone relies on medical equipment, call 999.",
  flood: "If water is near electrics, keep clear and switch off at the fuse box only if it's safe. Turn off the water at the stopcock if you can. If anyone is in danger, call 999.",
}

/** One-line reason built from real fields: "Gas Safe, replies in a minute, free tomorrow 9am". */
export function reasonFor(s: S, l: Listing) {
  const parts: string[] = []
  const creds = verifiedCredentials(s, l.businessId, s.clock).map((c) => ({ gas_safe: "Gas Safe", niceic: "NICEIC approved", napit: "NAPIT", insurance: "insured", dbs: "DBS checked", qualification: "qualified" })[c.type])
  if (creds[0]) parts.push(creds[0].charAt(0).toUpperCase() + creds[0].slice(1))
  if (isDeskLive(s, l)) parts.push("replies in a minute")
  else if (l.layer === "claimed") parts.push(l.replyMins < 60 ? `replies in about ${l.replyMins} min` : "usually replies the same day")
  const r = listingRating(s, l)
  if (r.count && parts.length < 2) parts.push(`${r.rating.toFixed(1)}★ from ${r.count}${r.google ? " Google" : ""} reviews`)
  if (l.layer === "claimed") {
    const svc = servicesFor(s, l.businessId).find((x) => x.bookable)
    const slot = nextSlots(s, l, svc, 1)[0]
    if (slot) parts.push(`free ${fmtRelDay(slot, s.clock).toLowerCase().replace(/^(mon|tue|wed|thu|fri|sat|sun)/, (d) => d.charAt(0).toUpperCase() + d.slice(1))} ${fmtTime(slot)}`)
  } else parts.push("not on Answerd yet, call only")
  const out = parts.slice(0, 3).join(", ")
  return out.charAt(0).toUpperCase() + out.slice(1)
}

function match(s: S, ctx: AskContext): { matches: AskMatch[]; online: boolean } {
  const pc = ctx.postcode ? lookupPostcode(ctx.postcode) : null
  const view: S = pc ? { ...s, session: { ...s.session, location: { postcode: pc.postcode, label: pc.label, lat: pc.lat, lng: pc.lng } } } : s
  const seen = new Set<string>()
  const pool = ctx.categories.flatMap((c) => search(view, "", { categoryId: c, withinMiles: ctx.radius })).filter((r) => (seen.has(r.listing.id) ? false : (seen.add(r.listing.id), true)))
  // Q-03: desk-enabled and verified first (Featured placement doesn't apply to recommendations)
  const tier = (r: (typeof pool)[number]) => (r.desk && r.listing.badges.includes("verified") ? 0 : r.listing.layer === "claimed" ? 1 : r.listing.layer === "seeded" ? 2 : 3)
  pool.sort((a, b) => tier(a) - tier(b) || (ctx.urgent ? Number(b.desk) - Number(a.desk) : 0) || (a.distance ?? 99) - (b.distance ?? 99))
  const top = pool.slice(0, 3)
  return {
    matches: top.map((r) => ({
      listingId: r.listing.id,
      reason: reasonFor(view, r.listing),
      claimed: r.listing.layer === "claimed",
      bookable: r.listing.layer === "claimed" && servicesFor(view, r.listing.businessId).some((x) => x.bookable),
    })),
    online: top.some((r) => r.desk),
  }
}

/** One turn of the conversation. Returns the updated context and Answerd's reply. */
export function askTurn(s: S, ctxIn: AskContext, text: string, pre?: Understanding): { ctx: AskContext; reply: AskReply } {
  const ctx: AskContext = { ...ctxIn, categories: [...ctxIn.categories], description: [...ctxIn.description], asked: [...ctxIn.asked] }
  const u = pre ?? understand(text)

  // Q-05 safety first: no business cards, no booking buttons
  if (u.emergency) return { ctx, reply: { text: SAFETY[u.emergency], safety: u.emergency } }
  if (u.offTopic)
    return {
      ctx,
      reply: { text: `I can't give ${u.offTopic} advice, sorry: please speak to a qualified professional${u.offTopic === "medical" ? " (call NHS 111, or 999 in an emergency)" : ""}. I can help you find a local service business though.`, chips: ASK_CHIPS },
    }

  // Answers to a pending follow-up
  if (ctx.pending === "postcode") {
    if (!u.postcode && !/^(skip|anywhere|don't know|dont know)/i.test(text.trim())) {
      return { ctx, reply: { text: "I didn't recognise that postcode. Could you type it like SE25 4AA, or just the first part, like CR0?" } }
    }
  }
  if (ctx.pending === "leak" && u.leaking !== undefined) ctx.leaking = u.leaking
  ctx.pending = undefined

  for (const c of u.categories) if (!ctx.categories.includes(c)) ctx.categories.push(c)
  if (u.postcode) ctx.postcode = u.postcode
  if (u.urgent) ctx.urgent = true
  if (u.categories.length || !ctxIn.categories.length) ctx.description.push(text.trim())
  if (/widen|further|wider/i.test(text)) ctx.radius = 25

  if (!ctx.categories.length) {
    return { ctx, reply: { text: "I couldn't match that to a service yet. Tell me a bit about the job, like “leaking tap”, “end of tenancy clean” or “car won't start”.", chips: ASK_CHIPS } }
  }

  // Q-02: at most two follow-ups (postcode if unknown; leak check for plumbing)
  if (!ctx.postcode && !s.session.location && !ctx.asked.includes("postcode")) {
    ctx.asked.push("postcode")
    ctx.pending = "postcode"
    return { ctx, reply: { text: "What's your postcode? I'll look for businesses near you." } }
  }
  if (ctx.categories[0] === "plumbers" && ctx.leaking === undefined && !ctx.asked.includes("leak") && ctx.asked.length < 2) {
    ctx.asked.push("leak")
    ctx.pending = "leak"
    return { ctx, reply: { text: "Is water leaking right now?", chips: ["Yes, it's leaking", "No"] } }
  }
  if (ctx.leaking) ctx.urgent = true
  if (!ctx.postcode && s.session.location) ctx.postcode = s.session.location.postcode

  const { matches, online } = match(s, ctx)
  const where = ctx.postcode ? ctx.postcode.split(" ")[0] : "you"
  const cat = s.categories.find((c) => c.id === ctx.categories[0])
  const summary = [ctx.description.join(". "), ctx.leaking ? "Water is leaking now." : "", ctx.urgent && !ctx.leaking ? "Fairly urgent." : ""].filter(Boolean).join(" ")
  if (!matches.length) {
    return {
      ctx,
      reply: {
        text: `I couldn't find ${cat?.plural.toLowerCase() ?? "anyone"} within ${ctx.radius} miles of ${where}. ${ctx.radius < 25 ? "Want me to widen the search?" : "Try a nearby postcode."}`,
        chips: ctx.radius < 25 ? ["Widen the search"] : undefined,
      },
    }
  }
  return {
    ctx,
    reply: {
      text: `${ctx.leaking ? "Turn off the water at the stopcock if you can. " : ""}Here ${matches.length === 1 ? "is the best match" : `are ${matches.length} good matches`} for ${cat?.plural.toLowerCase() ?? "that"} near ${where}${ctx.urgent ? ", starting with who can respond fastest" : ""}.`,
      matches,
      online,
      summary,
    },
  }
}
