// Pure derived data for the business ops screens (B-18 to B-29) and the web dashboard.
import type { DemoData } from "@/lib/seed"
import type { Booking, BookingStatus, Call, Message, Thread } from "@/lib/types"
import { dayKey, ms, MS_DAY } from "@/lib/time"
import { deskFor } from "@/lib/selectors"

type S = Pick<DemoData, keyof DemoData>

/** Jobs a viewer may see: all for the owner, only their own for staff. */
export function visibleJobs(s: S, listingId: string, staffUserId: string | null = null) {
  return s.bookings.filter((b) => b.listingId === listingId && (!staffUserId || b.assignedTo === staffUserId))
}

export const DIARY_STATUSES: BookingStatus[] = ["requested", "confirmed", "on_the_way", "arrived", "completed", "no_show", "cancelled"]

export function jobsOn(s: S, listingId: string, day: string, staffUserId: string | null = null) {
  return visibleJobs(s, listingId, staffUserId)
    .filter((b) => dayKey(b.startAt) === day && b.status !== "declined")
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
}

export function threadMessages(s: S, threadId: string) {
  return s.messages.filter((m) => m.threadId === threadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function deskTouched(s: S, threadId: string) {
  return s.messages.some((m) => m.threadId === threadId && m.author === "desk")
}

export function lastMessage(msgs: Message[]) {
  return [...msgs].reverse().find((m) => m.author !== "system" && m.body) ?? msgs.at(-1)
}

export function isCustomerChange(b: Booking) {
  return !!b.changeRequest && b.changeRequest.reason !== "proposed_by_business" && ["confirmed", "requested"].includes(b.status)
}

export function isOpenRequest(b: Booking) {
  return b.status === "requested" && b.changeRequest?.reason !== "proposed_by_business"
}

export type NeedItem =
  | { kind: "thread"; key: string; at: string; thread: Thread }
  | { kind: "request"; key: string; at: string; booking: Booking }
  | { kind: "change"; key: string; at: string; booking: Booking }

/** B-18 "Needs you": handoffs, booking requests and customer change requests. */
export function needsYou(s: S, listingId: string): NeedItem[] {
  const out: NeedItem[] = []
  for (const t of s.threads) if (t.listingId === listingId && t.status === "needs_owner" && !t.spam) out.push({ kind: "thread", key: `t-${t.id}`, at: t.updatedAt, thread: t })
  for (const b of s.bookings) {
    if (b.listingId !== listingId) continue
    if (isOpenRequest(b)) out.push({ kind: "request", key: `r-${b.id}`, at: b.createdAt, booking: b })
    else if (isCustomerChange(b)) out.push({ kind: "change", key: `c-${b.id}`, at: b.changeRequest!.at, booking: b })
  }
  return out.sort((a, b) => b.at.localeCompare(a.at))
}

export type InboxFilter = "all" | "needs" | "desk" | "calls" | "requests"

export interface InboxItem {
  key: string
  kind: "thread" | "call" | "request"
  id: string // threadId, callId or bookingId
  link: "thread" | "call" | "request" | "job"
  linkId: string
  at: string
  channel: "app" | "sms" | "call"
  name: string
  summary: string
  desk: boolean
  needs: boolean
  unread: boolean
  spam?: boolean
  status?: BookingStatus
  outcome?: Call["outcome"]
}

function threadItem(s: S, t: Thread): InboxItem {
  const msgs = threadMessages(s, t.id)
  const last = lastMessage(msgs)
  const call = t.channel === "call" ? s.calls.find((c) => c.threadId === t.id) : undefined
  return {
    key: `t-${t.id}`,
    kind: "thread",
    id: t.id,
    link: call ? "call" : "thread",
    linkId: call ? call.id : t.id,
    at: t.updatedAt,
    channel: t.channel,
    name: t.customerName,
    summary: t.status === "needs_owner" && t.handoffReason ? `Needs you: ${t.handoffReason.toLowerCase()}` : call?.summary ?? last?.body ?? "",
    desk: deskTouched(s, t.id),
    needs: t.status === "needs_owner",
    unread: t.unreadBusiness > 0,
    spam: t.spam,
    outcome: call?.outcome,
  }
}

function callItem(c: Call): InboxItem {
  const outcome = c.outcome === "desk" ? "Answered by desk" : c.outcome === "owner" ? "Answered by you" : "Missed call"
  return {
    key: `c-${c.id}`,
    kind: "call",
    id: c.id,
    link: "call",
    linkId: c.id,
    at: c.startedAt,
    channel: "call",
    name: c.customerName ?? c.callerMasked,
    summary: c.summary ?? outcome,
    desk: c.outcome === "desk",
    needs: false,
    unread: false,
    spam: c.spam,
    outcome: c.outcome,
  }
}

function requestItem(s: S, b: Booking): InboxItem {
  const svc = s.services.find((x) => x.id === b.serviceId)
  const change = isCustomerChange(b)
  return {
    key: `r-${b.id}`,
    kind: "request",
    id: b.id,
    link: change ? "job" : "request",
    linkId: b.id,
    at: change ? b.changeRequest!.at : b.createdAt,
    channel: "app",
    name: b.customerName,
    summary: change ? `Wants to move ${svc?.name.toLowerCase() ?? "their booking"}` : `Booking request: ${svc?.name.toLowerCase() ?? "job"}`,
    desk: b.createdBy === "desk",
    needs: true,
    unread: true,
    status: b.status,
  }
}

/** B-19 rows for a filter, newest first. Calls with a conversation show once, as the call. */
export function inboxItems(s: S, listingId: string, filter: InboxFilter): InboxItem[] {
  const threads = s.threads.filter((t) => t.listingId === listingId)
  const threadIds = new Set(threads.map((t) => t.id))
  const calls = s.calls.filter((c) => c.listingId === listingId)
  const standaloneCalls = calls.filter((c) => !c.threadId || !threadIds.has(c.threadId))
  const requests = s.bookings.filter((b) => b.listingId === listingId && (isOpenRequest(b) || isCustomerChange(b)))
  let items: InboxItem[] = []
  if (filter === "all") items = [...threads.filter((t) => !t.spam).map((t) => threadItem(s, t)), ...standaloneCalls.filter((c) => !c.spam).map(callItem), ...requests.map((b) => requestItem(s, b))]
  if (filter === "needs") items = [...threads.filter((t) => t.status === "needs_owner" && !t.spam).map((t) => threadItem(s, t)), ...requests.map((b) => requestItem(s, b))]
  if (filter === "desk") items = [...threads.filter((t) => !t.spam && deskTouched(s, t.id)).map((t) => threadItem(s, t)), ...standaloneCalls.filter((c) => c.outcome === "desk" && !c.spam).map(callItem)]
  if (filter === "calls") items = [...threads.filter((t) => t.channel === "call" && calls.some((c) => c.threadId === t.id)).map((t) => threadItem(s, t)), ...standaloneCalls.map(callItem)]
  if (filter === "requests") items = requests.map((b) => requestItem(s, b))
  return items.sort((a, b) => b.at.localeCompare(a.at))
}

/** Desk status for the pill: Live, Paused or Off. */
export function deskState(s: S, businessId: string | undefined) {
  const c = deskFor(s, businessId)
  if (s.settings.killSwitch) return { status: "off" as const, label: "Off" }
  if (c?.status === "live") return { status: "live" as const, label: "Live" }
  if (c?.status === "paused") return { status: "paused" as const, label: "Paused" }
  return { status: "off" as const, label: "Off" }
}

/** B-18 stat row, computed from today's records on the demo clock. */
export function todayStats(s: S, listingId: string, staffUserId: string | null = null) {
  const today = dayKey(s.clock)
  const isToday = (iso: string) => dayKey(iso) === today && ms(iso) <= ms(s.clock)
  const enq = s.enquiries.filter((e) => e.listingId === listingId && isToday(e.at))
  const newEnquiries = enq.filter((e) => e.kind === "call" || e.kind === "message" || e.kind === "booking").length
  const profileViews = enq.filter((e) => e.kind === "profile_view").length
  const jobsToday = jobsOn(s, listingId, today, staffUserId).filter((b) => !["cancelled", "no_show"].includes(b.status)).length
  const deskThreads = new Set(s.messages.filter((m) => m.author === "desk" && isToday(m.createdAt)).map((m) => m.threadId))
  const listingThreads = new Set(s.threads.filter((t) => t.listingId === listingId && !t.spam).map((t) => t.id))
  let deskHandled = [...deskThreads].filter((id) => listingThreads.has(id)).length
  deskHandled += s.calls.filter((c) => c.listingId === listingId && c.outcome === "desk" && !c.spam && isToday(c.startedAt) && !(c.threadId && deskThreads.has(c.threadId))).length
  return { newEnquiries, jobsToday, deskHandled, profileViews }
}

/** Minutes from a customer's message to the first reply (owner, staff or desk), median. */
export function medianResponseMin(s: S, listingId: string, sinceIso?: string) {
  const out: number[] = []
  for (const t of s.threads.filter((x) => x.listingId === listingId && !x.spam)) {
    const msgs = threadMessages(s, t.id)
    for (let i = 0; i < msgs.length; i++) {
      const m = msgs[i]!
      if (m.author !== "customer" || (sinceIso && ms(m.createdAt) < ms(sinceIso))) continue
      if (i > 0 && msgs[i - 1]!.author === "customer") continue
      const reply = msgs.slice(i + 1).find((x) => x.author === "owner" || x.author === "staff" || x.author === "desk")
      if (reply) out.push((ms(reply.createdAt) - ms(m.createdAt)) / 60000)
    }
  }
  if (!out.length) return null
  out.sort((a, b) => a - b)
  return out[Math.floor(out.length / 2)]!
}

export function daysOfData(s: S, listingId: string) {
  const first = s.enquiries.filter((e) => e.listingId === listingId).reduce<string | null>((a, e) => (!a || e.at < a ? e.at : a), null)
  return first ? Math.floor((ms(s.clock) - ms(first)) / MS_DAY) : 0
}

export function customerBookings(s: S, listingId: string, customerId: string | null, name: string) {
  return s.bookings
    .filter((b) => b.listingId === listingId && (customerId ? b.customerId === customerId : b.customerName === name))
    .sort((a, b) => b.startAt.localeCompare(a.startAt))
}

/** What is left of a booking request's 2-hour window on the demo clock. */
export function requestCountdown(expiresAt: string | undefined, now: string) {
  if (!expiresAt) return null
  const left = Math.max(0, ms(expiresAt) - ms(now))
  const h = Math.floor(left / 3_600_000)
  const m = Math.floor((left % 3_600_000) / 60_000)
  const label = left <= 0 ? "Expired" : h ? `${h}h ${String(m).padStart(2, "0")}m left` : `${m}m left`
  return { left, label, pct: Math.min(100, (left / (2 * 3_600_000)) * 100), expired: left <= 0 }
}
