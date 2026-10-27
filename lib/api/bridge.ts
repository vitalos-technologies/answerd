"use client"
// API mode: every store action that has a matching endpoint also calls it. The store still runs the action
// locally first (the UI stays instant and every journey keeps working), then the bridge mirrors it to the API
// and records the result in the hub's log. Routes are confirmed on staging; request bodies follow the store's own
// inputs until the backend spec or @vitalos/answerd-client confirms them (issue #2), so a 400 in the hub's log is
// a field-name mismatch to fix here, in one place.
//
// IDs: listings carry their API id (apiId, set by the catalogue sync). Things created through the API (threads,
// bookings, quotes, claims) get theirs from the response and are remembered in useApiStatus.ids.
import { useStore, type Store } from "@/lib/store"
import { call } from "./client"
import { connectRealtime, disconnectRealtime, type RealtimeEvent } from "./realtime"
import { refreshListing } from "./catalogue"
import { useApiStatus } from "./status"
import { getSession } from "./session"

type Args = unknown[]
interface Ctx {
  args: Args
  before: Store
  after: Store
  result: unknown
}
interface Req {
  method: "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  body?: unknown
  /** The local id the response's id belongs to */
  adopt?: string
}
/** null: nothing to send for these arguments. "no-id": the thing has no API id (mock data), so it stays local. */
type Route = (c: Ctx) => Req | null | "no-id"

const ids = () => useApiStatus.getState().ids
const remember = (local: string, remote: string) => useApiStatus.setState((s) => ({ ids: { ...s.ids, [local]: remote } }))

/** API id for a local id: listings by apiId, things the API created by the id map, API-sourced ids by prefix. */
function apiId(s: Store, local: string | undefined | null): string | null {
  if (!local) return null
  if (local.startsWith("api-")) return local.slice(4)
  const l = s.listings.find((x) => x.id === local)
  if (l) return l.apiId ?? null
  return ids()[local] ?? null
}
/** API business id: learned at sign-in (GET /v1/me) and keyed by the local business id. */
function bizId(local: string | undefined | null) {
  return local ? (ids()[local] ?? null) : null
}

function need(a: string | null, b: string | null): boolean {
  return !!a && !!b
}

const a = <T>(c: Ctx, i: number) => c.args[i] as T

const ROUTES: Partial<Record<keyof Store, Route>> = {
  // ---------------------------------------------------------- customer
  toggleSave: (c) => {
    const l = apiId(c.before, a(c, 0))
    return l ? { method: "POST", path: `/v1/listings/${l}/save`, body: { saved: c.result } } : "no-id"
  },
  startThread: (c) => {
    const l = apiId(c.before, a(c, 0))
    const input = a<{ body: string; postcode?: string; when?: string; photos?: string[] }>(c, 1)
    return l ? { method: "POST", path: "/v1/threads", body: { listingId: l, ...input }, adopt: c.result as string } : "no-id"
  },
  sendMessage: (c) => {
    const author = a<string>(c, 1)
    if (author !== "customer" && author !== "owner" && author !== "staff") return null // desk and system messages come from the server
    const t = apiId(c.before, a(c, 0))
    return t ? { method: "POST", path: `/v1/threads/${t}/messages`, body: { body: a(c, 2), ...(a<object | undefined>(c, 3) ?? {}) } } : "no-id"
  },
  createBooking: (c) => {
    const r = c.result as { ok: boolean; bookingId?: string }
    if (!r.ok) return null
    const input = a<{ listingId: string; serviceId: string; threadId?: string } & Record<string, unknown>>(c, 0)
    const l = apiId(c.before, input.listingId)
    const svc = apiId(c.before, input.serviceId)
    if (!need(l, svc)) return "no-id"
    const { startAt, address, postcode, accessNotes, notes, contactPhone } = input
    return { method: "POST", path: "/v1/bookings", body: { listingId: l, serviceId: svc, startAt, address, postcode, accessNotes, notes, contactPhone, threadId: apiId(c.before, input.threadId) ?? undefined }, adopt: r.bookingId }
  },
  cancelBooking: (c) => {
    const b = apiId(c.before, a(c, 0))
    return b ? { method: "POST", path: `/v1/bookings/${b}/cancel`, body: { reason: a(c, 2) } } : "no-id"
  },
  reschedule: (c) => {
    const b = apiId(c.before, a(c, 0))
    return b ? { method: "POST", path: `/v1/bookings/${b}/reschedule`, body: { startAt: a(c, 1), reason: a(c, 3) } } : "no-id"
  },
  respondToBooking: (c) => {
    const b = apiId(c.before, a(c, 0))
    const action = a<"accept" | "decline" | "suggest">(c, 1)
    const opts = a<{ reason?: string; startAt?: string } | undefined>(c, 2) ?? {}
    if (!b) return "no-id"
    if (action === "accept") return { method: "POST", path: `/v1/bookings/${b}/accept`, body: {} }
    if (action === "decline") return { method: "POST", path: `/v1/bookings/${b}/decline`, body: { reason: opts.reason } }
    return { method: "POST", path: `/v1/bookings/${b}/reschedule`, body: { startAt: opts.startAt, reason: opts.reason } }
  },
  markNoShow: (c) => {
    const b = apiId(c.before, a(c, 0))
    return b ? { method: "POST", path: `/v1/bookings/${b}/no-show`, body: {} } : "no-id"
  },
  updateBookingStatus: (c) => {
    const b = apiId(c.before, a(c, 0))
    return b ? { method: "POST", path: `/v1/bookings/${b}/status`, body: { status: a(c, 1) } } : "no-id"
  },
  sendQuote: (c) => {
    const t = apiId(c.before, a(c, 0))
    return t ? { method: "POST", path: `/v1/threads/${t}/quotes`, body: a(c, 1), adopt: c.result as string } : "no-id"
  },
  respondToQuote: (c) => {
    const q = apiId(c.before, a(c, 0))
    return q ? { method: "POST", path: `/v1/quotes/${q}/${a(c, 1) ? "accept" : "decline"}`, body: {} } : "no-id"
  },
  postReview: (c) => {
    const input = a<{ listingId: string; bookingId?: string; callId?: string; stars: number; aspects?: object; text: string }>(c, 0)
    const l = apiId(c.before, input.listingId)
    return l ? { method: "POST", path: "/v1/reviews", body: { listingId: l, bookingId: apiId(c.before, input.bookingId) ?? undefined, stars: input.stars, aspects: input.aspects, body: input.text }, adopt: c.result as string } : "no-id"
  },
  replyToReview: (c) => {
    const r = apiId(c.before, a(c, 0))
    return r ? { method: "POST", path: `/v1/reviews/${r}/reply`, body: { body: a(c, 1) } } : "no-id"
  },
  report: (c) => {
    if (a(c, 0) !== "listing") return null
    const l = apiId(c.before, a(c, 1))
    return l ? { method: "POST", path: `/v1/listings/${l}/report`, body: { reason: a(c, 2), details: a(c, 3) } } : "no-id"
  },
  recommend: (c) => {
    const l = apiId(c.before, a(c, 0))
    return l ? { method: "POST", path: `/v1/listings/${l}/recommend`, body: {} } : "no-id"
  },
  createAccount: (c) => {
    const i = a<{ firstName: string; lastName: string; email?: string; marketing: boolean }>(c, 0)
    return getSession() ? { method: "PATCH", path: "/v1/me", body: { firstName: i.firstName, lastName: i.lastName, email: i.email || undefined, marketingConsent: i.marketing } } : null
  },
  updateProfile: (c) => (getSession() ? { method: "PATCH", path: "/v1/me", body: a(c, 0) } : null),
  deleteAccount: (c) => ((c.result as { ok: boolean }).ok && getSession() ? { method: "DELETE", path: "/v1/me" } : null),
  markNotificationRead: (c) => {
    const n = apiId(c.before, a(c, 0))
    return n ? { method: "POST", path: `/v1/notifications/${n}/read`, body: {} } : "no-id"
  },

  // ---------------------------------------------------------- claim
  claimListing: (c) => {
    const l = apiId(c.before, a(c, 0))
    return l ? { method: "POST", path: "/v1/claims", body: { listingId: l, method: a(c, 1) }, adopt: c.result as string } : "no-id"
  },
  verifyClaim: (c) => {
    const id = apiId(c.before, a(c, 0))
    return id ? { method: "POST", path: `/v1/claims/${id}/verify/${a(c, 1)}`, body: a<object | undefined>(c, 2) ?? {} } : "no-id"
  },

  // ---------------------------------------------------------- business
  updateBusiness: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "PATCH", path: `/v1/businesses/${b}`, body: a(c, 1) } : "no-id"
  },
  upsertService: (c) => {
    const b = bizId(a(c, 0))
    const svc = a<{ id?: string }>(c, 1)
    if (!b) return "no-id"
    const existing = svc.id ? apiId(c.before, svc.id) : null
    return existing ? { method: "PATCH", path: `/v1/businesses/${b}/services/${existing}`, body: svc } : { method: "POST", path: `/v1/businesses/${b}/services`, body: svc, adopt: c.result as string }
  },
  deleteService: (c) => {
    const svc = c.before.services.find((s) => s.id === a(c, 0))
    const b = bizId(svc?.businessId)
    const s = apiId(c.before, a(c, 0))
    return need(b, s) ? { method: "DELETE", path: `/v1/businesses/${b}/services/${s}` } : "no-id"
  },
  setAvailability: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "PUT", path: `/v1/businesses/${b}/availability`, body: c.after.availability.find((x) => x.businessId === a(c, 0)) } : "no-id"
  },
  setServiceArea: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "PUT", path: `/v1/businesses/${b}/service-area`, body: c.after.serviceAreas.find((x) => x.businessId === a(c, 0)) } : "no-id"
  },
  uploadCredential: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "POST", path: `/v1/businesses/${b}/credentials`, body: a(c, 1) } : "no-id"
  },
  startDeskTrial: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "POST", path: `/v1/businesses/${b}/desk/trial`, body: {} } : "no-id"
  },
  setDeskStatus: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "PATCH", path: `/v1/businesses/${b}/desk`, body: { status: a(c, 1) } } : "no-id"
  },
  updateDeskConfig: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "PATCH", path: `/v1/businesses/${b}/desk`, body: a(c, 1) } : "no-id"
  },
  upsertQna: (c) => {
    const b = bizId(a(c, 0))
    const q = a<{ id: string; q: string; a: string }>(c, 1)
    if (!b) return "no-id"
    const existing = apiId(c.before, q.id)
    return existing ? { method: "PATCH", path: `/v1/businesses/${b}/desk/qna/${existing}`, body: { q: q.q, a: q.a } } : { method: "POST", path: `/v1/businesses/${b}/desk/qna`, body: { q: q.q, a: q.a }, adopt: q.id }
  },
  deleteQna: (c) => {
    const b = bizId(a(c, 0))
    const q = apiId(c.before, a(c, 1))
    return need(b, q) ? { method: "DELETE", path: `/v1/businesses/${b}/desk/qna/${q}` } : "no-id"
  },
  inviteStaff: (c) => {
    const b = bizId(a(c, 0))
    return b ? { method: "POST", path: `/v1/businesses/${b}/members`, body: { name: a(c, 1), phone: a(c, 2) } } : "no-id"
  },
  acceptInvite: (c) => {
    const m = apiId(c.before, a(c, 0))
    return m ? { method: "POST", path: `/v1/invites/${m}/accept`, body: {} } : "no-id"
  },
  removeMember: (c) => {
    const mem = c.before.members.find((m) => m.id === a(c, 0))
    const b = bizId(mem?.businessId)
    const m = apiId(c.before, a(c, 0))
    return need(b, m) ? { method: "DELETE", path: `/v1/businesses/${b}/members/${m}` } : "no-id"
  },
  transferOwnership: (c) => {
    const b = bizId(a(c, 0))
    const m = apiId(c.before, a(c, 1))
    return need(b, m) ? { method: "POST", path: `/v1/businesses/${b}/transfer`, body: { memberId: m } } : "no-id"
  },

  // ---------------------------------------------------------- admin
  adminDecide: (c) => {
    if (a(c, 0) !== "claim") return "no-id"
    const id = apiId(c.before, a(c, 1))
    return id ? { method: "POST", path: `/v1/admin/claims/${id}/decide`, body: { decision: a(c, 2), reason: a(c, 3), ...(a<object | undefined>(c, 4) ?? {}) } } : "no-id"
  },
}

/** Actions that only move the demo around (personas, clock, UI, drafts, the scripted desk): never sent anywhere. */
const DEMO_ONLY = new Set<string>([
  "setPersona", "signIn", "signInByPhone", "signOut", "setMode", "setLocation", "setOnboarded", "setNotificationsAsked",
  "recordFailedCode", "clearFailedCodes", "search", "recordSearch", "clearRecentSearches", "recordProfileView", "setDraft", "patchDraft",
  "incrementAsk", "resetAsk", "advanceClock", "setOffline", "setShowScreenIds", "setStateOverride", "triggerMonetiseGate", "setCookieConsent",
  "resetDemo", "runDeskScript", "setAfterCall", "finishRuns", "deskAutoReply", "setSupportView", "startImpersonation", "endImpersonation",
  "adminSignIn", "ensureThread", "setClaimDetails", "markAllNotificationsRead", "setThreadNotes", "recordSignInAttempt",
])

export const BRIDGE_ROUTES = Object.keys(ROUTES)

let depth = 0
let installed = false

async function send(action: string, req: Req) {
  try {
    const res = await call<{ id?: string } | undefined>(req.path, { method: req.method, body: req.body, action })
    if (req.adopt && res && typeof res === "object" && typeof res.id === "string") remember(req.adopt, res.id)
  } catch {
    /* logged by the client; the local action already ran */
  }
}

/** Wraps every store action once. Mapped actions mirror to the API; other data actions are counted as local only. */
export function installBridge() {
  if (installed) return
  installed = true
  const state = useStore.getState() as unknown as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const [name, fn] of Object.entries(state)) {
    if (typeof fn !== "function" || DEMO_ONLY.has(name)) continue
    const route = ROUTES[name as keyof Store]
    patch[name] = (...args: Args) => {
      const before = useStore.getState()
      depth++
      let result: unknown
      try {
        result = (fn as (...x: Args) => unknown)(...args)
      } finally {
        depth--
      }
      if (depth > 0) return result // a nested call: the outer action speaks for it
      const req = route?.({ args, before, after: useStore.getState(), result })
      if (req && req !== "no-id") void send(name, req)
      else if (!route || req === "no-id") useApiStatus.setState((s) => ({ localOnly: { ...s.localOnly, [name]: (s.localOnly[name] ?? 0) + 1 } }))
      return result
    }
  }
  useStore.setState(patch as Partial<Store>)
}

// ------------------------------------------------------------------ realtime → store

/** Event names and fields follow the backend's realtime contract; unknown events are only logged. */
function onEvent(e: RealtimeEvent) {
  useApiStatus.setState((s) => ({ events: [{ at: Date.now(), type: e.type }, ...s.events].slice(0, 20) }))
  const data = (e.data ?? e) as Record<string, unknown>
  if (e.type.startsWith("listing.") && typeof data.slug === "string") void refreshListing(data.slug)
  const local = (remote: unknown) => Object.entries(ids()).find(([, r]) => r === remote)?.[0]
  if (e.type === "booking.updated" && typeof data.status === "string") {
    const id = local(data.id)
    if (id) useStore.setState((s) => ({ bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: data.status as typeof b.status } : b)) }))
  }
  if (e.type === "message.created" && typeof data.body === "string") {
    const threadId = local(data.threadId)
    if (threadId && !useStore.getState().messages.some((m) => m.id === `api-${String(data.id)}`)) {
      useStore.setState((s) => ({
        messages: [...s.messages, { id: `api-${String(data.id)}`, threadId, author: (data.author as never) ?? "owner", body: data.body as string, attachments: [], createdAt: (data.createdAt as string) ?? s.clock }],
      }))
    }
  }
}

export function startRealtime() {
  if (getSession()) connectRealtime(onEvent)
}
export function stopRealtime() {
  disconnectRealtime()
}

/** After sign-in: remember which local businesses are the user's API businesses (matched by listing). */
export async function learnBusinesses() {
  const me = await call<{ businesses?: { id: string; listingId?: string; listingSlug?: string }[] }>("/v1/me").catch(() => null)
  const s = useStore.getState()
  for (const b of me?.businesses ?? []) {
    const l = s.listings.find((x) => (b.listingId && x.apiId === b.listingId) || (b.listingSlug && x.slug === b.listingSlug))
    if (l?.businessId) remember(l.businessId, b.id)
  }
}
