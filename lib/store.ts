"use client"
// One shared client store for every surface (app, web, dashboard, admin).
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { produce, type Draft } from "immer"
import { createSeed, SEED_VERSION, PERSONAS, type DemoData } from "./seed"
import type {
  Booking,
  BookingEvent,
  BookingStatus,
  Business,
  Credential,
  DeskConfig,
  DeskStatus,
  Message,
  MessageAuthor,
  MessageCard,
  Mode,
  Notification,
  PersonaId,
  QuoteLine,
  Report,
  Review,
  Service,
  Availability,
  ServiceArea,
  Listing,
  Claim,
  User,
  BookingDraft,
  QnA,
  Settings,
} from "./types"
import { uid } from "./prng"
import { addDays, addHours, addMinutes, fmtDate, fmtDateTime, fmtRelDay, fmtTime, ms, dayKey, MS_HOUR, MS_DAY } from "./time"
import { search as runSearch, type SearchFilters } from "./search"
import {
  availabilityFor,
  businessById,
  gateStatus,
  isStaffOnly,
  listingById,
  membershipsFor,
  nextSlots,
  serviceById,
  servicesFor,
} from "./selectors"
import { buildScript, deskReply as computeDeskReply, ownerUserIds, stepsToTranscript, type ScriptId, type ScriptOptions, type ScriptPlan, type ScriptStep } from "./deskScripts"
import { initials, slugify, gbp, priceWithVat } from "./format"
import { DISTRICTS, lookupPostcode } from "./geo"
import { toast } from "./toast"
import { findCompany, matchDirector } from "./companiesHouse"

export type StateOverride = "none" | "loading" | "empty" | "error"

export interface DeskRunState {
  id: string
  scriptId: ScriptId
  listingId: string
  plan: ScriptPlan
  steps: ScriptStep[]
  cursor: number
  done: boolean
  threadId?: string
  callId?: string
  bookingId?: string
  startedAt: string
  afterCall?: "booked" | "not_booked" | "no_answer"
}

interface UiState {
  offline: boolean
  showScreenIds: boolean
  stateOverride: StateOverride
  hydrated: boolean
  lastModeByUser: Record<string, Mode>
  runs: DeskRunState[]
  builtIds: string[]
}

type Data = DemoData & UiState

export interface Actions {
  // session
  setPersona: (personaId: PersonaId) => void
  signIn: (personaId: PersonaId, method?: "phone" | "apple" | "google" | "email") => void
  signInByPhone: (phone: string) => { existing: boolean; userId: string }
  createAccount: (input: { phone?: string; firstName: string; lastName: string; email?: string; marketing: boolean; method: "phone" | "apple" | "google" | "email" }) => string
  signOut: () => void
  setMode: (mode: Mode, businessId?: string | null) => void
  setLocation: (postcode: string) => boolean
  setOnboarded: () => void
  setNotificationsAsked: (enabled: boolean) => void
  recordFailedCode: (phone: string) => { attempts: number; locked: boolean }
  clearFailedCodes: (phone: string) => void
  // discovery
  search: (query: string, filters?: SearchFilters) => ReturnType<typeof runSearch>
  recordSearch: (query: string) => void
  clearRecentSearches: () => void
  recordProfileView: (listingId: string) => void
  toggleSave: (listingId: string) => boolean
  // messaging
  startThread: (listingId: string, input: { body: string; photos?: string[]; postcode?: string; when?: string }) => string
  sendMessage: (threadId: string, author: MessageAuthor, body: string, opts?: { card?: MessageCard; attachments?: string[]; authorName?: string }) => string
  deskAutoReply: (threadId: string) => void
  setThreadDesk: (threadId: string, active: boolean) => void
  markThreadMine: (threadId: string) => void
  markThreadRead: (threadId: string, side: "customer" | "business") => void
  // bookings
  setDraft: (draft: BookingDraft | null) => void
  patchDraft: (patch: Partial<BookingDraft>) => void
  createBooking: (input: {
    listingId: string
    serviceId: string
    startAt: string
    address: string
    postcode: string
    accessNotes?: string
    notes?: string
    photos?: string[]
    contactPhone?: string
    createdBy?: Booking["createdBy"]
    customerName?: string
    customerId?: string | null
    status?: BookingStatus
    threadId?: string
  }) => { ok: true; bookingId: string } | { ok: false; reason: "slot_taken"; alternatives: string[] }
  proposeTime: (threadId: string, slots: string[], serviceId?: string, bookingId?: string) => void
  respondToBooking: (bookingId: string, action: "accept" | "decline" | "suggest", opts?: { reason?: string; startAt?: string }) => void
  acceptProposal: (bookingId: string, startAt: string) => void
  updateBookingStatus: (bookingId: string, status: BookingStatus, actor?: BookingEvent["actor"]) => void
  reschedule: (bookingId: string, startAt: string, by: "customer" | "business", reason?: string) => void
  respondToChange: (bookingId: string, accept: boolean) => void
  cancelBooking: (bookingId: string, by: "customer" | "business", reason: string) => void
  markNoShow: (bookingId: string) => void
  addBlock: (businessId: string, startAt: string, endAt: string, reason: string, repeat: "none" | "daily" | "weekly") => void
  // quotes
  sendQuote: (threadId: string, input: { lines: QuoteLine[]; vatIncluded: boolean; validUntil: string; message: string }) => string
  respondToQuote: (quoteId: string, accept: boolean) => void
  // calls
  logCall: (listingId: string, outcome: "owner" | "desk" | "missed", durationSec?: number) => string
  // reviews and referrals
  postReview: (input: { listingId: string; bookingId?: string; callId?: string; stars: number; aspects?: Review["aspects"]; text: string; photos?: string[]; authorName?: string; customerId?: string | null }) => string
  replyToReview: (reviewId: string, body: string) => void
  report: (target: Report["target"], targetId: string, reason: string, details: string) => void
  inviteFriend: () => void
  recommend: (listingId: string) => void
  // account
  updateProfile: (patch: Partial<Pick<User, "firstName" | "lastName" | "email" | "phone" | "marketingConsent">>) => void
  updateCustomerPrefs: (patch: Partial<import("./types").CustomerProfile["notificationPrefs"]>) => void
  addSavedPlace: (label: string, postcode: string) => boolean
  removeSavedPlace: (id: string) => void
  deleteAccount: () => { ok: boolean; reason?: string }
  submitTicket: (subject: string, body: string) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  // ask answerd
  incrementAsk: () => number
  resetAsk: () => void
  // claim and setup
  createListing: (input: { name: string; categoryId: string; phone: string; postcode: string; legalType: Business["legalType"]; companyNumber?: string }) => string
  claimListing: (listingId: string, method: Claim["method"]) => string
  verifyClaim: (claimId: string, method: Claim["method"], input?: { code?: string; directorName?: string; dob?: string; companyNumber?: string; document?: string; documentKind?: string }) => { ok: boolean; pending?: boolean; businessId?: string; error?: string }
  disputeClaim: (listingId: string, details: string, evidence: string) => void
  updateBusiness: (businessId: string, patch: Partial<Business> & { name?: string; phonePublic?: string; categoryIds?: string[] }) => void
  upsertService: (businessId: string, service: Partial<Service> & { name: string }) => string
  deleteService: (serviceId: string) => void
  reorderServices: (businessId: string, ids: string[]) => void
  setAvailability: (businessId: string, patch: Partial<Availability>) => void
  setServiceArea: (businessId: string, patch: Partial<ServiceArea>) => void
  uploadCredential: (businessId: string, input: { type: Credential["type"]; label: string; number: string; fileName: string; expiresAt?: string }) => void
  // desk
  startDeskTrial: (businessId: string) => void
  setDeskStatus: (businessId: string, status: DeskStatus) => void
  updateDeskConfig: (businessId: string, patch: Partial<DeskConfig>) => void
  upsertQna: (businessId: string, qna: QnA) => void
  deleteQna: (businessId: string, id: string) => void
  runDeskScript: (scriptId: ScriptId, listingId: string, opts?: { instant?: boolean; stepMs?: number } & ScriptOptions) => string
  setAfterCall: (callId: string, answer: "booked" | "not_booked" | "no_answer") => void
  finishRuns: () => void
  // billing and team
  startSubscription: (businessId: string, plan: "desk" | "featured") => void
  cancelSubscription: (businessId: string, plan: "desk" | "featured") => void
  inviteStaff: (businessId: string, name: string, phone: string) => void
  acceptInvite: (memberId: string) => void
  removeMember: (memberId: string) => void
  transferOwnership: (businessId: string, memberId: string) => void
  deleteBusiness: (businessId: string) => void
  // admin
  adminSignIn: () => void
  adminDecide: (queue: "claim" | "credential" | "review" | "report" | "listing" | "customer" | "desk_qa" | "gate" | "featured", id: string, decision: string, reason: string, extra?: Record<string, unknown>) => void
  adminAudit: (action: string, targetType: string, targetId: string, reason: string) => void
  mergeListings: (survivorId: string, otherId: string, fields: Partial<Listing>, reason: string) => void
  runImport: (reason: string) => void
  updateSettings: (patch: Partial<Settings>, reason: string) => void
  setSupportView: (businessId: string | null) => void
  // prototype controls
  advanceClock: (hours: number) => void
  setOffline: (v: boolean) => void
  setShowScreenIds: (v: boolean) => void
  setStateOverride: (v: StateOverride) => void
  triggerMonetiseGate: (businessId?: string) => void
  setCookieConsent: (c: { analytics: boolean; marketing: boolean } | null) => void
  resetDemo: () => void
  // P6
  setListingPublished: (businessId: string, published: boolean) => void
}

export type Store = Data & Actions

const initialUi: UiState = {
  offline: false,
  showScreenIds: true,
  stateOverride: "none",
  hydrated: false,
  lastModeByUser: {},
  runs: [],
  builtIds: [],
}

// ------------------------------------------------------------------ helpers (operate on drafts)

type D = Draft<Data>

function notify(d: D, n: Omit<Notification, "id" | "at" | "channels"> & { channels?: Notification["channels"]; userIds?: string[] }) {
  const ids = n.userIds ?? [n.userId]
  for (const userId of ids) {
    if (!userId) continue
    d.notifications.unshift({ id: uid("n"), at: d.clock, channels: n.channels ?? ["push"], userId, event: n.event, mode: n.mode, businessId: n.businessId, title: n.title, body: n.body, href: n.href } as Notification)
  }
}

function enquiry(d: D, listingId: string, kind: "call" | "message" | "booking" | "profile_view") {
  const l = d.listings.find((x) => x.id === listingId)
  if (!l) return
  const before = l.businessId ? gateStatus(d as DemoData, l.businessId).met : false
  d.enquiries.push({ id: uid("e"), listingId, kind, at: d.clock, layer: l.layer })
  if (l.businessId && kind !== "profile_view") {
    const after = gateStatus(d as DemoData, l.businessId).met
    if (!before && after) gateReached(d, l.businessId)
  }
}

function gateReached(d: D, businessId: string) {
  notify(d, {
    userId: "",
    userIds: ownerUserIds(d as DemoData, businessId),
    event: "gate_reached",
    mode: "business",
    businessId,
    title: "Monetise gate reached",
    body: "Answerd sent you 10 enquiries. Keep your desk for £49/month.",
    href: "/app/biz/billing",
    channels: ["push", "email"],
  })
}

function event(d: D, bookingId: string, type: BookingEvent["type"], actor: BookingEvent["actor"], reason?: string) {
  d.bookingEvents.push({ id: uid("be"), bookingId, type, actor, at: d.clock, reason })
}

function bizOfListing(d: D, listingId: string) {
  return d.listings.find((l) => l.id === listingId)?.businessId
}

function listingName(d: D, listingId: string) {
  return d.listings.find((l) => l.id === listingId)?.name ?? "The business"
}

function currentUser(d: D) {
  return d.users.find((u) => u.id === d.session.userId)
}

function customerFirst(d: D, customerId: string | null, fallback: string) {
  return d.users.find((u) => u.id === customerId)?.firstName ?? fallback.split(" ")[0]!
}

function threadFor(d: D, listingId: string, customerId: string | null, customerName: string, channel: "app" | "sms" | "call" = "app") {
  let t = d.threads.find((x) => x.listingId === listingId && x.customerId === customerId && customerId !== null && x.channel === "app")
  if (!t) {
    const l = d.listings.find((x) => x.id === listingId)
    t = {
      id: uid("t"),
      listingId,
      customerId,
      customerName,
      channel,
      status: "open",
      deskActive: !!l?.businessId && d.deskConfigs.find((c) => c.businessId === l.businessId)?.status === "live",
      createdAt: d.clock,
      updatedAt: d.clock,
      unreadCustomer: 0,
      unreadBusiness: 0,
    }
    d.threads.unshift(t)
    t = d.threads[0]!
  }
  return t
}

function pushMessage(d: D, threadId: string, author: MessageAuthor, body: string, opts: { card?: MessageCard; attachments?: string[]; authorName?: string; queued?: boolean } = {}) {
  const msg: Message = { id: uid("msg"), threadId, author, body, attachments: opts.attachments ?? [], card: opts.card, createdAt: d.clock, authorName: opts.authorName, queued: opts.queued }
  d.messages.push(msg)
  const t = d.threads.find((x) => x.id === threadId)
  if (t) {
    t.updatedAt = d.clock
    if (author === "customer") t.unreadBusiness += 1
    else if (author !== "system") t.unreadCustomer += 1
    if (t.status === "closed") t.status = "open"
  }
  return msg.id
}

function bookingCustomerHref(id: string) {
  return `/app/bookings/${id}`
}

function deskPriceText(svc?: Service) {
  return svc ? priceWithVat(svc) : ""
}

function similarFree(d: D, listingId: string, startAt: string, n = 3) {
  const l = d.listings.find((x) => x.id === listingId)
  if (!l) return []
  return d.listings
    .filter((x) => x.id !== listingId && x.businessId && x.city === l.city && x.categoryIds.some((c) => l.categoryIds.includes(c)))
    .filter((x) => nextSlots(d as DemoData, x, servicesFor(d as DemoData, x.businessId).find((s) => s.bookable), 1, addHours(startAt, -2)).length)
    .slice(0, n)
    .map((x) => x.name)
}

function finaliseClaim(d: D, claim: Claim, pending: boolean) {
  const l = d.listings.find((x) => x.id === claim.listingId)!
  const user = d.users.find((u) => u.id === claim.userId)
  let biz = d.businesses.find((b) => b.listingId === l.id)
  if (!biz) {
    const bizId = `biz-${l.slug}`
    d.businesses.push({
      id: bizId,
      listingId: l.id,
      tenantId: `wf-tenant-${2000 + d.businesses.length}`,
      legalType: "sole_trader",
      tradingName: l.name,
      description: l.description,
      email: user?.email ?? "",
      website: "",
      socials: "",
      status: pending ? "pending" : "live",
      verifiedAt: pending ? undefined : d.clock,
      bookingMode: "request",
      cancellationPolicy: "24h",
      customerReminders: true,
      photos: [],
      emergencyCallout: false,
      notificationPrefs: { newEnquiry: true, handoff: true, bookingRequest: true, dailyDigest: true, reviewPosted: true, push: true, sms: true, email: true },
      createdAt: d.clock,
    })
    d.members.push({ id: uid("m"), businessId: bizId, userId: claim.userId, name: user ? `${user.firstName} ${user.lastName}` : "Owner", phone: user?.phone ?? "", role: "owner", invitedAt: d.clock, joinedAt: d.clock })
    d.deskConfigs.push({
      businessId: bizId,
      status: "off",
      number: "",
      voice: "Ellie",
      greeting: `Hi, you've reached ${l.name}. I'm their Answerd assistant and this call is recorded. How can I help?`,
      permissions: { calls: true, sms: true, book: true, quotes: true, reviews: true },
      handoffRules: { emergencies: true, complaints: true, priceNegotiation: true, namedRequests: true, custom: "" },
      quietHours: { enabled: true, from: "21:00", to: "07:00" },
      alertWho: ["owner"],
      qna: [],
      neverSay: [],
      trialUsed: false,
      setupStep: 0,
    })
    d.availability.push({
      businessId: bizId,
      weeklyHours: [],
      slotMode: "slots",
      slotLengthMin: 60,
      leadTimeMin: 120,
      bufferMin: 30,
      maxPerDay: 5,
      holidays: [],
    })
    d.subscriptions.push({ id: uid("sub"), businessId: bizId, plan: "free", status: "active", stripeId: "", currentPeriodEnd: addDays(d.clock, 30), pricePence: 0 })
    biz = d.businesses.at(-1)!
  }
  l.layer = "claimed"
  l.businessId = biz.id
  l.sourceRefs = l.sourceRefs.filter((r) => r.source !== "places")
  l.sourceRefs.push({ listingId: l.id, source: "owner", externalId: biz.id, fetchedAt: d.clock })
  l.placeId = undefined
  if (!pending && !l.badges.includes("verified")) l.badges.push("verified")
  if (!pending) {
    biz.status = "live"
    biz.verifiedAt = d.clock
  }
  claim.status = pending ? "pending" : "approved"
  if (!pending) claim.decidedAt = d.clock
  d.session.mode = "business"
  d.session.currentBusinessId = biz.id
  if (d.session.userId) d.lastModeByUser[d.session.userId] = "business"
  if (!pending) {
    notify(d, { userId: claim.userId, event: "claim_verified", mode: "business", businessId: biz.id, title: "You're verified", body: `You're verified. ${l.name} is live on Answerd.`, href: "/app/biz/setup", channels: ["push", "sms", "email"] })
  }
  return biz.id
}

function approveClaim(d: D, claim: Claim, actorId: string, reason: string) {
  const l = d.listings.find((x) => x.id === claim.listingId)!
  if (claim.status === "disputed") {
    // Transfer: the disputer becomes owner
    const biz = d.businesses.find((b) => b.listingId === l.id)
    if (biz) {
      d.members = d.members.filter((m) => !(m.businessId === biz.id && m.role === "owner"))
      const u = d.users.find((x) => x.id === claim.userId)
      d.members.push({ id: uid("m"), businessId: biz.id, userId: claim.userId, name: u ? `${u.firstName} ${u.lastName}` : "Owner", phone: u?.phone ?? "", role: "owner", invitedAt: d.clock, joinedAt: d.clock })
    }
    claim.status = "approved"
    claim.decidedAt = d.clock
  } else {
    const keepMode = d.session.mode
    const keepBiz = d.session.currentBusinessId
    finaliseClaim(d, claim, false)
    // An admin approving shouldn't flip the admin's own session
    if (d.session.userId !== claim.userId) {
      d.session.mode = keepMode
      d.session.currentBusinessId = keepBiz
    }
  }
  claim.decidedBy = actorId
  claim.reason = reason
}

/** Who the desk alerts: the owner, plus staff when B-35 says so. */
function deskAlertIds(d: D, businessId: string | undefined) {
  const c = d.deskConfigs.find((x) => x.businessId === businessId)
  return ownerUserIds(d as DemoData, businessId, !!c?.alertWho.includes("staff"))
}

function applyStep(d: D, run: Draft<DeskRunState>, index: number) {
  const step = run.steps[index]
  if (!step) return
  const plan = run.plan
  const listing = d.listings.find((l) => l.id === run.listingId)
  if (!listing) return
  const businessId = listing.businessId
  // Thread-based channels stream each line as a message
  if (run.threadId && (plan.channel === "sms" || plan.channel === "app")) {
    const author: MessageAuthor = step.speaker === "caller" ? "customer" : step.speaker === "owner" ? "owner" : "desk"
    pushMessage(d, run.threadId, author, step.text, { card: step.card })
  }
  if (step.effect === "alert_owner") {
    notify(d, { userId: "", userIds: deskAlertIds(d, businessId), event: plan.ownerPush.event, mode: "business", businessId, title: plan.ownerPush.title, body: plan.ownerPush.body, href: run.callId ? `/app/biz/calls/${run.callId}` : run.threadId ? `/app/biz/inbox/${run.threadId}` : "/app/biz/inbox", channels: plan.ownerPush.channels })
    if (run.threadId) {
      const t = d.threads.find((x) => x.id === run.threadId)
      if (t) {
        t.status = "needs_owner"
        t.handoffReason = plan.handoff ?? "Emergency"
      }
    }
  }
  if (step.effect === "handoff" && run.threadId) {
    const t = d.threads.find((x) => x.id === run.threadId)
    if (t) {
      t.status = "needs_owner"
      t.handoffReason = plan.handoff ?? "Needs a call back"
    }
  }
  if (step.effect === "book" && plan.booking && !run.bookingId) {
    const b = plan.booking
    const id = uid("bk")
    const requested = b.status === "requested"
    d.bookings.push({
      id,
      listingId: listing.id,
      customerId: plan.caller.customerId,
      customerName: plan.caller.name,
      customerPhone: plan.caller.phone,
      serviceId: b.serviceId,
      startAt: b.startAt,
      endAt: b.endAt,
      address: b.address,
      postcode: b.postcode,
      accessNotes: "",
      notes: plan.summary,
      photos: [],
      status: requested ? "requested" : "confirmed",
      createdBy: "desk",
      policy: "Free to cancel until 24 hours before",
      priceText: deskPriceText(serviceById(d as DemoData, b.serviceId)),
      requestExpiresAt: requested ? addHours(d.clock, 2) : undefined,
      createdAt: d.clock,
    })
    event(d, id, requested ? "requested" : "confirmed", "desk")
    enquiry(d, listing.id, "booking")
    run.bookingId = id
    if (run.threadId) pushMessage(d, run.threadId, "system", requested ? "Booking request sent by the Answerd desk" : "Booked by the Answerd desk", { card: { kind: "booking", bookingId: id } })
    // D-04: confirmation (and calendar invite) to a customer with the app
    if (plan.caller.customerId && !requested) notify(d, { userId: plan.caller.customerId, event: "booking_confirmed", mode: "customer", title: "You're booked", body: `You're booked with ${listing.name}, ${fmtDate(b.startAt)}, ${fmtTime(b.startAt)}`, href: bookingCustomerHref(id), channels: ["push", "sms", "email"] })
  }
}

function completeRun(d: D, run: Draft<DeskRunState>) {
  const plan = run.plan
  const listing = d.listings.find((l) => l.id === run.listingId)
  if (!listing) return
  const businessId = listing.businessId
  const transcript = stepsToTranscript(run.steps as ScriptStep[])
  if (plan.channel === "call") {
    const durationSec = (transcript.at(-1)?.atSec ?? 0) + 8
    const callId = run.callId ?? uid("call")
    run.callId = callId
    d.calls.unshift({
      id: callId,
      listingId: listing.id,
      trackedNumber: d.deskConfigs.find((c) => c.businessId === businessId)?.number ?? "",
      callerMasked: `${plan.caller.phone.slice(0, 5)} •••${plan.caller.phone.slice(-3)}`,
      customerId: plan.caller.customerId,
      customerName: plan.caller.name,
      startedAt: run.startedAt,
      durationSec,
      outcome: "desk",
      recordingUrl: `recording-${callId}.mp3`,
      transcript,
      summary: plan.summary,
      bookingId: run.bookingId,
      threadId: run.threadId,
      spam: plan.spam,
      scriptId: plan.scriptId,
      afterCall: run.afterCall,
    })
    if (!plan.spam) enquiry(d, listing.id, "call")
    if (run.threadId) {
      const t = d.threads.find((x) => x.id === run.threadId)
      if (t) {
        const m = d.messages.find((x) => x.threadId === t.id && x.author === "system" && x.body.startsWith("Call in progress"))
        if (m) m.body = `Call answered by the Answerd desk · ${Math.floor(durationSec / 60)}:${String(durationSec % 60).padStart(2, "0")}`
        pushMessage(d, t.id, "desk", plan.summary)
      }
    }
  }
  if (plan.scriptId === "D-05" && run.threadId) {
    const q = d.quotes.find((x) => x.threadId === run.threadId)
    if (q) q.status = "accepted"
  }
  if (plan.scriptId === "D-06" && plan.reviewBookingId) {
    const b = d.bookings.find((x) => x.id === plan.reviewBookingId)
    if (b) {
      b.reviewRequested = true
      event(d, b.id, "review_requested", "desk")
      if (b.customerId) notify(d, { userId: b.customerId, event: "review_request", mode: "customer", title: `How did ${listing.name} do?`, body: "Tap to leave a quick review.", href: `/app/bookings/${b.id}/review`, channels: ["push"] })
    }
  }
  // Owner push (not for spam; emergencies already alerted)
  if (!plan.spam && plan.scriptId !== "D-09" && plan.ownerPush.body) {
    const requested = plan.booking?.status === "requested" && run.bookingId
    const href = requested ? `/app/biz/requests/${run.bookingId}` : run.callId ? `/app/biz/calls/${run.callId}` : run.threadId ? `/app/biz/inbox/${run.threadId}` : "/app/biz"
    notify(d, { userId: "", userIds: plan.scriptId === "D-07" ? ownerUserIds(d as DemoData, businessId) : deskAlertIds(d, businessId), event: plan.ownerPush.event, mode: "business", businessId, title: plan.ownerPush.title, body: plan.ownerPush.body, href, channels: plan.ownerPush.channels })
  }
  if (plan.handoff && run.threadId) {
    const t = d.threads.find((x) => x.id === run.threadId)
    if (t) {
      t.status = "needs_owner"
      t.handoffReason = plan.handoff
    }
  }
  if (plan.spam && run.threadId) {
    const t = d.threads.find((x) => x.id === run.threadId)
    if (t) {
      t.spam = true
      t.status = "closed"
    }
  }
  run.done = true
  run.cursor = run.steps.length
}

function startRun(d: D, scriptId: ScriptId, listingId: string, opts: ScriptOptions = {}): Draft<DeskRunState> | null {
  const listing = d.listings.find((l) => l.id === listingId)
  if (!listing) return null
  const built = buildScript(d as DemoData, scriptId, listing as Listing, d.runs.length, opts)
  const run: DeskRunState = { id: uid("run"), scriptId, listingId, plan: built.plan, steps: built.steps, cursor: 0, done: false, startedAt: d.clock }
  const plan = built.plan
  if (plan.channel === "sms" || plan.channel === "app" || (plan.channel === "call" && !plan.spam)) {
    const t = {
      id: uid("t"),
      listingId,
      customerId: plan.caller.customerId,
      customerName: plan.caller.name,
      customerPhone: plan.caller.phone,
      channel: plan.channel === "app" ? ("app" as const) : plan.channel === "sms" ? ("sms" as const) : ("call" as const),
      status: "open" as const,
      deskActive: true,
      createdAt: d.clock,
      updatedAt: d.clock,
      unreadCustomer: 0,
      unreadBusiness: 1,
    }
    d.threads.unshift(t)
    run.threadId = t.id
    if (plan.channel === "call") pushMessage(d, t.id, "system", "Call in progress: answered by the Answerd desk")
    // Outbound follow-ups (D-05 quote, D-06 review request) aren't enquiries
    if (plan.channel !== "call" && plan.scriptId !== "D-05" && plan.scriptId !== "D-06") enquiry(d, listingId, "message")
  }
  if (plan.channel === "call") run.callId = uid("call")
  if (plan.scriptId === "D-06" && plan.completedJob) {
    // The trigger: the owner has just marked this job Completed
    const j = plan.completedJob
    const svc = serviceById(d as DemoData, j.serviceId)
    d.bookings.push({ id: j.id, listingId, customerId: plan.caller.customerId, customerName: plan.caller.name, customerPhone: plan.caller.phone, serviceId: j.serviceId, startAt: j.startAt, endAt: j.endAt, address: j.address, postcode: j.postcode, accessNotes: "", notes: "", photos: [], status: "completed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: deskPriceText(svc), createdAt: addDays(d.clock, -3) })
    event(d, j.id, "completed", "owner")
  }
  if (plan.scriptId === "D-05" && run.threadId && plan.quote) {
    const qid = uid("q")
    const total = plan.quote.pricePence
    d.quotes.push({ id: qid, threadId: run.threadId, listingId, lines: [{ id: uid("ql"), label: plan.quote.label, pricePence: total }], vatIncluded: true, vatPence: Math.round(total / 6), totalPence: total, validUntil: addDays(d.clock, 28), message: "Quote as discussed.", status: "sent", sentAt: addDays(d.clock, -2), followUpsAt: [d.clock, addDays(d.clock, 5)], followUpsSent: 1 })
    d.messages.push({ id: uid("msg"), threadId: run.threadId, author: "owner", body: "Here's your quote.", attachments: [], card: { kind: "quote", quoteId: qid }, createdAt: addDays(d.clock, -2) })
  }
  d.runs.push(run)
  return d.runs.at(-1)!
}

// ------------------------------------------------------------------ store

const timers = new Map<string, ReturnType<typeof setTimeout>[]>()

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      const mut = (fn: (d: D) => void) => set((s) => produce(s, (d) => void fn(d as D)))

      return {
        ...createSeed(),
        ...initialUi,

        // ---------------------------------------------------------- session
        setPersona: (personaId) => get().signIn(personaId),
        signIn: (personaId, method = "phone") =>
          mut((d) => {
            const p = PERSONAS.find((x) => x.id === personaId)
            d.session.personaId = personaId
            d.session.userId = p ? p.userId : d.session.userId
            const u = currentUser(d)
            if (u && method && !u.authProviders.includes(method)) u.authProviders.push(method)
            const mems = membershipsFor(d as DemoData, d.session.userId)
            d.session.currentBusinessId = mems[0]?.businessId ?? null
            if (isStaffOnly(d as DemoData, d.session.userId)) d.session.mode = "business"
            else d.session.mode = (d.session.userId && d.lastModeByUser[d.session.userId]) || "customer"
            if (d.session.mode === "business" && !d.session.currentBusinessId) d.session.mode = "customer"
            if (personaId === "tayo" || personaId === "sam" || personaId === "jo") {
              d.session.onboarded = true
              if (!d.session.location) d.session.location = { postcode: "SE25 4AA", label: "South Norwood", lat: 51.3978, lng: -0.0742 }
            }
            d.session.adminSignedIn = personaId === "ife" || personaId === "dan" ? d.session.adminSignedIn : false
            d.session.askCount = 0
          }),
        signInByPhone: (phone) => {
          const s = get()
          const existing = s.users.find((u) => u.phone.replace(/\s/g, "") === phone.replace(/\s/g, "") && !u.deleted)
          if (existing) {
            const persona = PERSONAS.find((p) => p.userId === existing.id)
            mut((d) => {
              d.session.personaId = persona?.id ?? "custom"
              d.session.userId = existing.id
              d.session.currentBusinessId = membershipsFor(d as DemoData, existing.id)[0]?.businessId ?? null
              d.session.mode = isStaffOnly(d as DemoData, existing.id) ? "business" : d.lastModeByUser[existing.id] ?? "customer"
            })
            return { existing: true, userId: existing.id }
          }
          mut((d) => {
            d.session.pendingPhone = phone
          })
          return { existing: false, userId: "" }
        },
        createAccount: (input) => {
          const id = uid("u")
          mut((d) => {
            d.users.push({
              id,
              phone: input.phone ?? d.session.pendingPhone ?? "",
              email: input.email || undefined,
              firstName: input.firstName,
              lastName: input.lastName,
              authProviders: [input.method],
              marketingConsent: input.marketing,
              createdAt: d.clock,
            })
            d.customerProfiles.push({
              userId: id,
              savedPlaces: [],
              savedListingIds: [],
              referralCode: `${input.firstName.toUpperCase().slice(0, 4)}-${id.slice(-3).toUpperCase()}`,
              recentSearches: [],
              notificationPrefs: { bookingPush: true, bookingSms: true, messagesPush: true, reminders: true, reviewRequests: true, offers: input.marketing },
              noShowCount: 0,
            })
            d.session.personaId = "custom"
            d.session.userId = id
            d.session.mode = "customer"
            d.session.currentBusinessId = null
            d.session.pendingPhone = undefined
          })
          return id
        },
        signOut: () =>
          mut((d) => {
            d.session.personaId = "guest"
            d.session.userId = null
            d.session.mode = "customer"
            d.session.currentBusinessId = null
            d.session.adminSignedIn = false
            d.session.askCount = 0
          }),
        setMode: (mode, businessId) =>
          mut((d) => {
            const mems = membershipsFor(d as DemoData, d.session.userId)
            if (mode === "business" && !mems.length) return
            if (mode === "customer" && isStaffOnly(d as DemoData, d.session.userId)) return
            d.session.mode = mode
            if (businessId) d.session.currentBusinessId = businessId
            else if (mode === "business" && !d.session.currentBusinessId) d.session.currentBusinessId = mems[0]!.businessId
            if (d.session.userId) d.lastModeByUser[d.session.userId] = mode
          }),
        setLocation: (postcode) => {
          const pc = lookupPostcode(postcode)
          if (!pc) return false
          mut((d) => {
            d.session.location = { postcode: pc.postcode, label: pc.label, lat: pc.lat, lng: pc.lng }
            const label = `${pc.district} · ${pc.label}`
            d.session.recentAreas = [label, ...d.session.recentAreas.filter((a) => a !== label)].slice(0, 5)
          })
          return true
        },
        setOnboarded: () => mut((d) => void (d.session.onboarded = true)),
        setNotificationsAsked: (enabled) =>
          mut((d) => {
            d.session.notificationsAsked = true
            d.session.pushEnabled = enabled
          }),
        recordFailedCode: (phone) => {
          let attempts = 0
          let locked = false
          mut((d) => {
            attempts = (d.session.failedCodes[phone] ?? 0) + 1
            d.session.failedCodes[phone] = attempts
            if (attempts >= 5) {
              d.session.lockedUntil[phone] = addMinutes(d.clock, 15)
              locked = true
            }
          })
          return { attempts, locked }
        },
        clearFailedCodes: (phone) =>
          mut((d) => {
            delete d.session.failedCodes[phone]
            delete d.session.lockedUntil[phone]
          }),

        // ---------------------------------------------------------- discovery
        search: (query, filters) => runSearch(get(), query, filters),
        recordSearch: (query) =>
          mut((d) => {
            const q = query.trim()
            if (!q) return
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (p) p.recentSearches = [q, ...p.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6)
            else d.session.guestRecentSearches = [q, ...d.session.guestRecentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6)
          }),
        clearRecentSearches: () =>
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (p) p.recentSearches = []
            else d.session.guestRecentSearches = []
          }),
        recordProfileView: (listingId) => mut((d) => enquiry(d, listingId, "profile_view")),
        toggleSave: (listingId) => {
          let saved = false
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (!p) return
            saved = !p.savedListingIds.includes(listingId)
            p.savedListingIds = saved ? [...p.savedListingIds, listingId] : p.savedListingIds.filter((x) => x !== listingId)
          })
          return saved
        },

        // ---------------------------------------------------------- messaging
        startThread: (listingId, input) => {
          let id = ""
          mut((d) => {
            const u = currentUser(d)
            const name = u ? `${u.firstName} ${u.lastName[0] ?? ""}.` : "Guest"
            const t = threadFor(d, listingId, d.session.userId, name)
            id = t.id
            const extra = [input.postcode && `Postcode: ${input.postcode}`, input.when && `When: ${input.when}`].filter(Boolean).join(" · ")
            pushMessage(d, t.id, "customer", extra ? `${input.body}\n\n${extra}` : input.body, { attachments: input.photos, queued: d.offline })
            enquiry(d, listingId, "message")
            const biz = bizOfListing(d, listingId)
            if (biz) notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz, true), event: "new_message", mode: "business", businessId: biz, title: name, body: `${name.split(" ")[0]}: ${input.body.slice(0, 80)}`, href: `/app/biz/inbox/${t.id}` })
          })
          return id
        },
        sendMessage: (threadId, author, body, opts = {}) => {
          let id = ""
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t) return
            const name = opts.authorName ?? (author === "owner" || author === "staff" ? (currentUser(d) ? `${currentUser(d)!.firstName} ${currentUser(d)!.lastName}` : undefined) : undefined)
            id = pushMessage(d, threadId, author, body, { ...opts, authorName: name, queued: d.offline })
            const lname = listingName(d, t.listingId)
            if (author === "customer") {
              enquiry(d, t.listingId, "message")
              const biz = bizOfListing(d, t.listingId)
              if (biz) notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz, true), event: "new_message", mode: "business", businessId: biz, title: t.customerName, body: `${t.customerName.split(" ")[0]}: ${body.slice(0, 80)}`, href: `/app/biz/inbox/${t.id}` })
            } else if (t.customerId && author !== "system") {
              notify(d, { userId: t.customerId, event: "new_message", mode: "customer", title: lname, body: `${lname}: ${body.slice(0, 80)}`, href: `/app/messages/${t.id}` })
              if (t.status === "needs_owner" && (author === "owner" || author === "staff")) t.status = "open"
            }
          })
          return id
        },
        deskAutoReply: (threadId) =>
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t || !t.deskActive) return
            const l = d.listings.find((x) => x.id === t.listingId)
            if (!l || d.settings.killSwitch || d.deskConfigs.find((c) => c.businessId === l.businessId)?.status !== "live") return
            const msgs = d.messages.filter((m) => m.threadId === threadId)
            const last = msgs.at(-1)
            if (!last || last.author !== "customer") return
            const reply = computeDeskReply(d as DemoData, l as Listing, last.body, customerFirst(d, t.customerId, t.customerName))
            pushMessage(d, threadId, "desk", reply.body, { card: reply.card })
            if (reply.handoff) {
              t.status = "needs_owner"
              t.handoffReason = reply.handoff
              notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, l.businessId, true), event: "handoff", mode: "business", businessId: l.businessId, title: `${t.customerName.split(" ")[0]} needs you`, body: `${t.customerName.split(" ")[0]} needs you: ${reply.handoff.toLowerCase()}. Reply within the hour.`, href: `/app/biz/inbox/${t.id}`, channels: ["push", "sms"] })
            }
            if (t.customerId) notify(d, { userId: t.customerId, event: "desk_replied", mode: "customer", title: `${l.name}'s Answerd desk replied`, body: reply.body.slice(0, 90), href: `/app/messages/${t.id}` })
          }),
        setThreadDesk: (threadId, active) =>
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t) return
            t.deskActive = active
            pushMessage(d, threadId, "system", active ? "The Answerd desk is back on for this conversation" : `${currentUser(d)?.firstName ?? "The owner"} took over from the Answerd desk`)
          }),
        markThreadMine: (threadId) =>
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (t) {
              t.assignedTo = d.session.userId ?? undefined
              if (t.status === "needs_owner") t.status = "open"
            }
          }),
        markThreadRead: (threadId, side) =>
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t) return
            if (side === "customer") t.unreadCustomer = 0
            else t.unreadBusiness = 0
          }),

        // ---------------------------------------------------------- bookings
        setDraft: (draft) => mut((d) => void (d.draft = draft)),
        patchDraft: (patch) =>
          mut((d) => {
            if (d.draft) Object.assign(d.draft, patch)
          }),
        createBooking: (input) => {
          const s = get()
          const contested = s.contested.find((c) => c.listingId === input.listingId && c.startAt === input.startAt)
          if (contested) {
            const l = listingById(s, input.listingId)!
            const svc = serviceById(s, input.serviceId)
            mut((d) => {
              d.contested = d.contested.filter((c) => c !== contested && !(c.listingId === contested.listingId && c.startAt === contested.startAt))
              const bid = uid("bk")
              d.bookings.push({ id: bid, listingId: input.listingId, customerId: "u-c12", customerName: "Kofi M.", customerPhone: "07700 900212", serviceId: input.serviceId, startAt: input.startAt, endAt: addMinutes(input.startAt, svc?.durationMin ?? 30), address: l.address, postcode: l.postcode, accessNotes: "", notes: "", photos: [], status: "confirmed", createdBy: "customer", policy: "Free to cancel until 24 hours before", priceText: svc ? priceWithVat(svc) : "", createdAt: d.clock })
            })
            const alternatives = nextSlots(get(), l, svc, 3, input.startAt)
            return { ok: false, reason: "slot_taken", alternatives }
          }
          let bookingId = ""
          mut((d) => {
            const l = d.listings.find((x) => x.id === input.listingId)!
            const biz = d.businesses.find((b) => b.id === l.businessId)
            const svc = d.services.find((x) => x.id === input.serviceId)
            const u = currentUser(d)
            const customerId = input.customerId !== undefined ? input.customerId : d.session.userId
            const customerName = input.customerName ?? (u ? `${u.firstName} ${u.lastName[0] ?? ""}.` : "Customer")
            const instant = input.createdBy === "owner" || input.createdBy === "desk" || biz?.bookingMode === "instant"
            const status: BookingStatus = input.status ?? (instant ? "confirmed" : "requested")
            const policy = biz?.cancellationPolicy === "48h" ? "Free to cancel until 48 hours before" : biz?.cancellationPolicy === "custom" ? biz.cancellationCustom || "Custom policy" : "Free to cancel until 24 hours before"
            bookingId = uid("bk")
            d.bookings.push({
              id: bookingId,
              listingId: l.id,
              customerId,
              customerName,
              customerPhone: input.contactPhone ?? u?.phone ?? "",
              serviceId: input.serviceId,
              startAt: input.startAt,
              endAt: addMinutes(input.startAt, svc?.durationMin ?? 60),
              address: input.address,
              postcode: input.postcode,
              accessNotes: input.accessNotes ?? "",
              notes: input.notes ?? "",
              photos: input.photos ?? [],
              status,
              createdBy: input.createdBy ?? "customer",
              policy,
              priceText: svc ? priceWithVat(svc) : "",
              requestExpiresAt: status === "requested" ? addHours(d.clock, 2) : undefined,
              createdAt: d.clock,
            })
            event(d, bookingId, status === "requested" ? "requested" : "confirmed", input.createdBy === "desk" ? "desk" : input.createdBy === "owner" ? "owner" : "customer")
            enquiry(d, l.id, "booking")
            const when = `${fmtDate(input.startAt).split(" ")[0]} ${fmtTime(input.startAt)}`
            if (biz) {
              if (status === "requested") {
                notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz.id), event: "booking_request", mode: "business", businessId: biz.id, title: "New booking request", body: `New booking request: ${(svc?.name ?? "job").toLowerCase()}, ${when}. Reply within 2 hours.`, href: `/app/biz/requests/${bookingId}`, channels: ["push", "sms"] })
              } else if (input.createdBy !== "owner") {
                notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz.id, true), event: "new_booking", mode: "business", businessId: biz.id, title: "New booking", body: `${customerName} booked ${(svc?.name ?? "a job").toLowerCase()}, ${when}.`, href: `/app/biz/jobs/${bookingId}` })
              }
            }
            if (status === "confirmed" && customerId) {
              notify(d, { userId: customerId, event: "booking_confirmed", mode: "customer", title: "You're booked", body: `You're booked with ${l.name}, ${fmtDate(input.startAt)}, ${fmtTime(input.startAt)}`, href: bookingCustomerHref(bookingId), channels: ["push", "sms", "email"] })
            }
            if (customerId) {
              const t = input.threadId ? d.threads.find((x) => x.id === input.threadId) : threadFor(d, l.id, customerId, customerName)
              if (t) pushMessage(d, t.id, "system", status === "requested" ? "Booking requested" : "Booked", { card: { kind: "booking", bookingId } })
            }
          })
          return { ok: true, bookingId }
        },
        proposeTime: (threadId, slots, serviceId, bookingId) =>
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t) return
            const u = currentUser(d)
            pushMessage(d, threadId, d.session.mode === "business" ? (membershipsFor(d as DemoData, d.session.userId).find((m) => m.businessId === bizOfListing(d, t.listingId))?.role === "staff" ? "staff" : "owner") : "owner", "Here are some times that work:", { card: { kind: "slot", slots, serviceId }, authorName: u ? `${u.firstName} ${u.lastName}` : undefined })
            if (t.customerId) notify(d, { userId: t.customerId, event: "time_proposed", mode: "customer", title: listingName(d, t.listingId), body: `${listingName(d, t.listingId)} suggested ${fmtDate(slots[0]!).split(" ")[0]} ${fmtTime(slots[0]!)}${slots.length > 1 ? " or another time" : " instead"}`, href: `/app/messages/${t.id}` })
            void bookingId
          }),
        respondToBooking: (bookingId, action, opts = {}) =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            const lname = listingName(d, b.listingId)
            if (action === "accept") {
              b.status = "confirmed"
              b.requestExpiresAt = undefined
              event(d, b.id, "confirmed", "owner")
              if (b.customerId) notify(d, { userId: b.customerId, event: "booking_confirmed", mode: "customer", title: "You're booked", body: `You're booked with ${lname}, ${fmtDate(b.startAt)}, ${fmtTime(b.startAt)}`, href: bookingCustomerHref(b.id), channels: ["push", "sms", "email"] })
            } else if (action === "decline") {
              b.status = "declined"
              b.declineReason = opts.reason || "Not available"
              b.requestExpiresAt = undefined
              event(d, b.id, "declined", "owner", b.declineReason)
              const others = similarFree(d, b.listingId, b.startAt)
              if (b.customerId) notify(d, { userId: b.customerId, event: "booking_declined", mode: "customer", title: `${lname} can't make it`, body: `${lname} can't make it. Here are ${others.length || 3} others free that day.`, href: bookingCustomerHref(b.id), channels: ["push", "sms"] })
            } else if (action === "suggest" && opts.startAt) {
              event(d, b.id, "time_proposed", "owner", fmtDateTime(opts.startAt))
              b.changeRequest = { startAt: opts.startAt, reason: "proposed_by_business", at: d.clock }
              const t = threadFor(d, b.listingId, b.customerId, b.customerName)
              pushMessage(d, t.id, "owner", `I can't do ${fmtDateTime(b.startAt)}. How about this instead?`, { card: { kind: "slot", slots: [opts.startAt], serviceId: b.serviceId }, authorName: currentUser(d) ? `${currentUser(d)!.firstName} ${currentUser(d)!.lastName}` : undefined })
              if (b.customerId) notify(d, { userId: b.customerId, event: "time_proposed", mode: "customer", title: lname, body: `${lname} suggested ${fmtDate(opts.startAt).split(" ")[0]} ${fmtTime(opts.startAt)} instead`, href: `/app/messages/${t.id}` })
            }
          }),
        acceptProposal: (bookingId, startAt) =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            const dur = ms(b.endAt) - ms(b.startAt)
            b.startAt = startAt
            b.endAt = new Date(ms(startAt) + dur).toISOString()
            b.status = "confirmed"
            b.changeRequest = undefined
            b.requestExpiresAt = undefined
            event(d, b.id, "confirmed", "customer")
            const biz = bizOfListing(d, b.listingId)
            notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz), event: "booking_confirmed", mode: "business", businessId: biz, title: "Time accepted", body: `${b.customerName} accepted ${fmtDateTime(startAt)}.`, href: `/app/biz/jobs/${b.id}` })
            if (b.customerId) notify(d, { userId: b.customerId, event: "booking_confirmed", mode: "customer", title: "You're booked", body: `You're booked with ${listingName(d, b.listingId)}, ${fmtDate(startAt)}, ${fmtTime(startAt)}`, href: bookingCustomerHref(b.id), channels: ["push", "sms", "email"] })
          }),
        updateBookingStatus: (bookingId, status, actor = "owner") =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            b.status = status
            event(d, b.id, status as BookingEvent["type"], actor)
            const lname = listingName(d, b.listingId)
            const ownerFirst = currentUser(d)?.firstName ?? "Your pro"
            if (!b.customerId) return
            if (status === "on_the_way") notify(d, { userId: b.customerId, event: "on_the_way", mode: "customer", title: "On the way", body: `${ownerFirst} from ${lname} is on the way`, href: bookingCustomerHref(b.id), channels: ["push", "sms"] })
            if (status === "arrived") notify(d, { userId: b.customerId, event: "arrived", mode: "customer", title: "Arrived", body: `${ownerFirst} from ${lname} has arrived`, href: bookingCustomerHref(b.id) })
            if (status === "completed") {
              notify(d, { userId: b.customerId, event: "completed", mode: "customer", title: "Job completed", body: `${lname} marked your job as done.`, href: bookingCustomerHref(b.id) })
              if (!b.reviewRequested) {
                b.reviewRequested = true
                event(d, b.id, "review_requested", "desk")
                notify(d, { userId: b.customerId, event: "review_request", mode: "customer", title: `How did ${lname} do?`, body: "Tap to leave a quick review.", href: `/app/bookings/${b.id}/review` })
              }
            }
          }),
        reschedule: (bookingId, startAt, by, reason = "") =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            if (by === "customer") {
              b.changeRequest = { startAt, reason, at: d.clock }
              event(d, b.id, "change_requested", "customer", reason)
              const biz = bizOfListing(d, b.listingId)
              notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz, true), event: "change_requested", mode: "business", businessId: biz, title: "Change requested", body: `${b.customerName} asked to move to ${fmtDateTime(startAt)}.`, href: `/app/biz/jobs/${b.id}`, channels: ["push", "sms"] })
            } else {
              const dur = ms(b.endAt) - ms(b.startAt)
              const old = b.startAt
              b.startAt = startAt
              b.endAt = new Date(ms(startAt) + dur).toISOString()
              b.reminderSent = false
              event(d, b.id, "rescheduled", "owner", `${fmtDateTime(old)} → ${fmtDateTime(startAt)}`)
              if (b.customerId) notify(d, { userId: b.customerId, event: "rescheduled", mode: "customer", title: "Booking moved", body: `${listingName(d, b.listingId)} moved your booking to ${fmtDate(startAt)}, ${fmtTime(startAt)}`, href: bookingCustomerHref(b.id), channels: ["push", "sms"] })
            }
          }),
        respondToChange: (bookingId, accept) =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b?.changeRequest) return
            const cr = b.changeRequest
            b.changeRequest = undefined
            if (accept) {
              const dur = ms(b.endAt) - ms(b.startAt)
              b.startAt = cr.startAt
              b.endAt = new Date(ms(cr.startAt) + dur).toISOString()
              b.reminderSent = false
              event(d, b.id, "change_accepted", "owner")
            }
            if (b.customerId) notify(d, { userId: b.customerId, event: "change_response", mode: "customer", title: accept ? "Change accepted" : "Change not possible", body: accept ? `${listingName(d, b.listingId)} moved your booking to ${fmtDateTime(cr.startAt)}` : `${listingName(d, b.listingId)} can't move your booking. It stays at ${fmtDateTime(b.startAt)}.`, href: bookingCustomerHref(b.id) })
          }),
        cancelBooking: (bookingId, by, reason) =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            b.status = "cancelled"
            b.cancelledBy = by
            b.cancelReason = reason
            event(d, b.id, "cancelled", by === "customer" ? "customer" : "owner", reason)
            const body = `Your ${fmtDate(b.startAt).split(" ")[0]} ${fmtTime(b.startAt)} booking was cancelled`
            if (by === "customer") {
              const biz = bizOfListing(d, b.listingId)
              notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz, true), event: "cancelled", mode: "business", businessId: biz, title: "Booking cancelled", body: `${b.customerName}: ${body.charAt(0).toLowerCase()}${body.slice(1)}`, href: `/app/biz/jobs/${b.id}`, channels: ["push", "sms", "email"] })
            } else if (b.customerId) {
              notify(d, { userId: b.customerId, event: "cancelled", mode: "customer", title: "Booking cancelled", body, href: bookingCustomerHref(b.id), channels: ["push", "sms", "email"] })
            }
          }),
        markNoShow: (bookingId) =>
          mut((d) => {
            const b = d.bookings.find((x) => x.id === bookingId)
            if (!b) return
            b.status = "no_show"
            event(d, b.id, "no_show", "owner")
            const p = d.customerProfiles.find((x) => x.userId === b.customerId)
            if (p) p.noShowCount += 1
            if (b.customerId) notify(d, { userId: b.customerId, event: "no_show", mode: "customer", title: "Marked as a no-show", body: `${listingName(d, b.listingId)} marked your ${fmtDate(b.startAt)} booking as a no-show. You can dispute this within 48 hours.`, href: bookingCustomerHref(b.id) })
          }),
        addBlock: (businessId, startAt, endAt, reason, repeat) => mut((d) => void d.blocks.push({ id: uid("blk"), businessId, startAt, endAt, reason, repeat })),

        // ---------------------------------------------------------- quotes
        sendQuote: (threadId, input) => {
          const id = uid("q")
          mut((d) => {
            const t = d.threads.find((x) => x.id === threadId)
            if (!t) return
            const subtotal = input.lines.reduce((a, l) => a + l.pricePence, 0)
            const vatPence = input.vatIncluded ? Math.round(subtotal - subtotal / 1.2) : Math.round(subtotal * 0.2)
            const totalPence = input.vatIncluded ? subtotal : subtotal + vatPence
            d.quotes.push({ id, threadId, listingId: t.listingId, lines: input.lines, vatIncluded: input.vatIncluded, vatPence, totalPence, validUntil: input.validUntil, message: input.message, status: "sent", sentAt: d.clock, followUpsAt: [addDays(d.clock, 2), addDays(d.clock, 7)], followUpsSent: 0 })
            const u = currentUser(d)
            pushMessage(d, threadId, "owner", input.message || "Here's your quote.", { card: { kind: "quote", quoteId: id }, authorName: u ? `${u.firstName} ${u.lastName}` : undefined })
            if (t.customerId) notify(d, { userId: t.customerId, event: "quote", mode: "customer", title: listingName(d, t.listingId), body: `${listingName(d, t.listingId)} sent you a quote: ${gbp(totalPence)}${input.vatIncluded ? " inc VAT" : " inc VAT"}`, href: `/app/messages/${threadId}` })
          })
          return id
        },
        respondToQuote: (quoteId, accept) =>
          mut((d) => {
            const q = d.quotes.find((x) => x.id === quoteId)
            if (!q) return
            q.status = accept ? "accepted" : "declined"
            const t = d.threads.find((x) => x.id === q.threadId)
            pushMessage(d, q.threadId, "system", accept ? `Quote accepted: ${gbp(q.totalPence)}` : "Quote declined")
            const l = d.listings.find((x) => x.id === q.listingId)
            const biz = l?.businessId
            notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz), event: "quote_response", mode: "business", businessId: biz, title: accept ? "Quote accepted" : "Quote declined", body: `${t?.customerName ?? "Customer"} ${accept ? "accepted" : "declined"} your quote for ${gbp(q.totalPence)}.`, href: `/app/biz/inbox/${q.threadId}` })
            // D-04: on acceptance the desk offers times
            if (accept && l && t?.deskActive && d.deskConfigs.find((c) => c.businessId === biz)?.status === "live" && !d.settings.killSwitch) {
              const svc = servicesFor(d as DemoData, biz).find((s) => s.bookable)
              const slots = nextSlots(d as DemoData, l as Listing, svc, 2)
              if (slots.length) pushMessage(d, q.threadId, "desk", "Great, thanks for accepting. When would suit you? These times are free:", { card: { kind: "slot", slots, serviceId: svc?.id } })
            }
          }),

        // ---------------------------------------------------------- calls
        logCall: (listingId, outcome, durationSec) => {
          const id = uid("call")
          mut((d) => {
            const u = currentUser(d)
            d.calls.unshift({
              id,
              listingId,
              trackedNumber: d.deskConfigs.find((c) => c.businessId === bizOfListing(d, listingId))?.number || "020 7946 0800",
              callerMasked: u ? `${u.phone.slice(0, 5)} •••${u.phone.slice(-3)}` : "07700 •••000",
              customerId: d.session.userId,
              customerName: u ? `${u.firstName} ${u.lastName[0] ?? ""}.` : "Guest caller",
              startedAt: d.clock,
              durationSec: durationSec ?? (outcome === "missed" ? 0 : 95),
              outcome,
              summary: outcome === "owner" ? "Answered by the owner." : outcome === "missed" ? "Missed call." : undefined,
            })
            enquiry(d, listingId, "call")
            const biz = bizOfListing(d, listingId)
            if (biz && outcome === "missed") notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz), event: "missed_call", mode: "business", businessId: biz, title: "Missed call", body: `You missed a call from ${u?.firstName ?? "a customer"} via Answerd.`, href: `/app/biz/calls/${id}` })
          })
          return id
        },

        // ---------------------------------------------------------- reviews and referrals
        postReview: (input) => {
          const id = uid("r")
          mut((d) => {
            const u = currentUser(d)
            const authorName = input.authorName ?? (u ? `${u.firstName} ${u.lastName[0] ?? ""}.` : "Customer")
            d.reviews.unshift({ id, listingId: input.listingId, bookingId: input.bookingId, callId: input.callId, customerId: input.customerId !== undefined ? input.customerId : d.session.userId, authorName, stars: input.stars, aspects: input.aspects, text: input.text, photos: input.photos ?? [], status: "live", createdAt: d.clock })
            if (input.bookingId) {
              const b = d.bookings.find((x) => x.id === input.bookingId)
              if (b) {
                b.reviewId = id
                event(d, b.id, "reviewed", "customer")
              }
            }
            const biz = bizOfListing(d, input.listingId)
            if (biz) notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz), event: "new_review", mode: "business", businessId: biz, title: "New review", body: `New ${input.stars}★ review from ${authorName.split(" ")[0]}`, href: "/app/biz/reviews" })
          })
          return id
        },
        replyToReview: (reviewId, body) =>
          mut((d) => {
            const r = d.reviews.find((x) => x.id === reviewId)
            if (!r) return
            r.reply = { body, at: d.clock }
            const l = d.listings.find((x) => x.id === r.listingId)
            if (r.customerId) notify(d, { userId: r.customerId, event: "review_reply", mode: "customer", title: l?.name ?? "", body: `${l?.name} replied to your review`, href: `/app/b/${l?.slug}/reviews` })
          }),
        report: (target, targetId, reason, details) =>
          mut((d) => {
            d.reports.unshift({ id: uid("rep"), target, targetId, reason, details, status: "open", reporterId: d.session.userId, at: d.clock })
            if (target === "review") {
              const r = d.reviews.find((x) => x.id === targetId)
              if (r) {
                r.flagged = true
                r.flagReason = reason
              }
            }
          }),
        inviteFriend: () =>
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (!p || !d.session.userId) return
            d.referrals.push({ id: uid("ref"), referrerUserId: d.session.userId, kind: "invite", code: p.referralCode, at: d.clock })
          }),
        recommend: (listingId) =>
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            d.referrals.push({ id: uid("ref"), referrerUserId: d.session.userId ?? "guest", kind: "recommend", listingId, code: p?.referralCode ?? "GUEST", at: d.clock })
          }),

        // ---------------------------------------------------------- account
        updateProfile: (patch) =>
          mut((d) => {
            const u = currentUser(d)
            if (u) Object.assign(u, patch)
          }),
        updateCustomerPrefs: (patch) =>
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (p) Object.assign(p.notificationPrefs, patch)
          }),
        addSavedPlace: (label, postcode) => {
          const pc = lookupPostcode(postcode)
          if (!pc) return false
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (p) p.savedPlaces.push({ id: uid("sp"), label, postcode: pc.postcode, area: pc.label })
          })
          return true
        },
        removeSavedPlace: (id) =>
          mut((d) => {
            const p = d.customerProfiles.find((x) => x.userId === d.session.userId)
            if (p) p.savedPlaces = p.savedPlaces.filter((x) => x.id !== id)
          }),
        deleteAccount: () => {
          const s = get()
          const uidv = s.session.userId
          const today = s.bookings.find((b) => b.customerId === uidv && ["confirmed", "on_the_way", "arrived", "requested"].includes(b.status) && dayKey(b.startAt) === dayKey(s.clock))
          if (today) return { ok: false, reason: "You have a booking today. You can delete your account once it's done." }
          mut((d) => {
            for (const b of d.bookings.filter((x) => x.customerId === uidv && ["confirmed", "requested"].includes(x.status) && ms(x.startAt) > ms(d.clock))) {
              b.status = "cancelled"
              b.cancelledBy = "customer"
              b.cancelReason = "Account deleted"
              event(d, b.id, "cancelled", "customer", "Account deleted")
              const biz = bizOfListing(d, b.listingId)
              notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, biz, true), event: "cancelled", mode: "business", businessId: biz, title: "Booking cancelled", body: `${b.customerName} closed their account: ${fmtDate(b.startAt)} ${fmtTime(b.startAt)} cancelled.`, href: `/app/biz/jobs/${b.id}` })
            }
            const u = d.users.find((x) => x.id === uidv)
            if (u) {
              u.deleted = true
              u.phone = ""
            }
            d.session.personaId = "guest"
            d.session.userId = null
            d.session.mode = "customer"
            d.session.currentBusinessId = null
            d.session.onboarded = false
          })
          return { ok: true }
        },
        submitTicket: (subject, body) => mut((d) => void d.tickets.push({ id: uid("tk"), userId: d.session.userId, subject, body, at: d.clock })),
        markNotificationRead: (id) =>
          mut((d) => {
            const n = d.notifications.find((x) => x.id === id)
            if (n && !n.readAt) n.readAt = d.clock
          }),
        markAllNotificationsRead: () =>
          mut((d) => {
            for (const n of d.notifications) if (n.userId === d.session.userId && !n.readAt) n.readAt = d.clock
          }),

        incrementAsk: () => {
          let c = 0
          mut((d) => {
            d.session.askCount += 1
            c = d.session.askCount
          })
          return c
        },
        resetAsk: () => mut((d) => void (d.session.askCount = 0)),

        // ---------------------------------------------------------- claim and setup
        createListing: (input) => {
          const pc = lookupPostcode(input.postcode)
          const district = pc?.district ?? input.postcode.toUpperCase().split(" ")[0]!
          const geo = pc ? { lat: pc.lat, lng: pc.lng } : DISTRICTS[district] ?? { lat: 51.3975, lng: -0.0745 }
          let slug = slugify(input.name)
          const s = get()
          if (s.listings.some((l) => l.slug === slug)) slug = `${slug}-${district.toLowerCase()}`
          const id = `l-${slug}`
          mut((d) => {
            d.listings.push({
              id,
              slug,
              name: input.name,
              categoryIds: [input.categoryId],
              layer: "seeded",
              address: pc?.label ?? district,
              postcode: pc?.postcode ?? input.postcode.toUpperCase(),
              postcodeDistrict: district,
              area: district === "SE25" ? "south-norwood" : district === "SE19" ? "upper-norwood" : district === "CR0" ? "croydon-town" : district.startsWith("M") ? "manchester-city-centre" : district.startsWith("B") ? "birmingham-city-centre" : "croydon",
              city: district.startsWith("M") ? "manchester" : district.startsWith("B") && !district.startsWith("BR") ? "birmingham" : "london",
              geo,
              phonePublic: input.phone,
              badges: [],
              sourceRefs: [{ listingId: id, source: "owner", externalId: d.session.userId ?? "", fetchedAt: d.clock }],
              replyMins: 120,
              hue: (d.listings.length * 47) % 360,
              initials: initials(input.name),
              description: "",
              createdAt: d.clock,
            })
          })
          return id
        },
        claimListing: (listingId, method) => {
          const id = uid("cl")
          mut((d) => {
            d.claims.push({ id, listingId, userId: d.session.userId ?? "", method, status: "started", createdAt: d.clock })
          })
          return id
        },
        verifyClaim: (claimId, method, input = {}) => {
          const s = get()
          const claim = s.claims.find((c) => c.id === claimId)
          if (!claim) return { ok: false, error: "Claim not found" }
          if (method === "sms" || method === "call") {
            if (input.code === "000000") return { ok: false, error: "That code didn't match" }
          }
          if (method === "director") {
            const listing = s.listings.find((l) => l.id === claim.listingId)
            const company = findCompany(input.companyNumber || listing?.name || "")
            if (!matchDirector(company, input.directorName ?? "", input.dob ?? "")) return { ok: false, error: "We couldn't match that to a director at Companies House." }
          }
          let businessId = ""
          mut((d) => {
            const c = d.claims.find((x) => x.id === claimId)!
            c.method = method
            if (method === "document") {
              c.evidenceUrl = input.document
              c.evidenceKind = input.documentKind
              businessId = finaliseClaim(d, c, true)
            } else {
              businessId = finaliseClaim(d, c, false)
            }
          })
          return { ok: true, pending: method === "document", businessId }
        },
        disputeClaim: (listingId, details, evidence) =>
          mut((d) => {
            d.claims.push({ id: uid("cl"), listingId, userId: d.session.userId ?? "", method: "document", status: "disputed", details, evidenceUrl: evidence, evidenceKind: "Supporting document", createdAt: d.clock })
          }),
        updateBusiness: (businessId, patch) =>
          mut((d) => {
            const b = d.businesses.find((x) => x.id === businessId)
            if (!b) return
            const { name, phonePublic, categoryIds, ...rest } = patch
            Object.assign(b, rest)
            const l = d.listings.find((x) => x.id === b.listingId)
            if (l) {
              if (name) {
                l.name = name
                l.initials = initials(name)
                b.tradingName = name
              }
              if (phonePublic) l.phonePublic = phonePublic
              if (categoryIds?.length) l.categoryIds = categoryIds
              if (patch.description !== undefined) l.description = patch.description
            }
          }),
        upsertService: (businessId, service) => {
          const id = service.id ?? uid("s")
          mut((d) => {
            const existing = d.services.find((x) => x.id === id)
            if (existing) Object.assign(existing, service)
            else
              d.services.push({
                id,
                businessId,
                name: service.name,
                description: service.description ?? "",
                durationMin: service.durationMin ?? 60,
                priceType: service.priceType ?? "fixed",
                pricePence: service.pricePence ?? 0,
                priceToPence: service.priceToPence,
                vatIncluded: service.vatIncluded ?? true,
                bookable: service.bookable ?? true,
                order: d.services.filter((x) => x.businessId === businessId).length,
              })
          })
          return id
        },
        deleteService: (serviceId) => mut((d) => void (d.services = d.services.filter((x) => x.id !== serviceId))),
        reorderServices: (businessId, ids) =>
          mut((d) => {
            ids.forEach((id, i) => {
              const s = d.services.find((x) => x.id === id && x.businessId === businessId)
              if (s) s.order = i
            })
          }),
        setAvailability: (businessId, patch) =>
          mut((d) => {
            const a = d.availability.find((x) => x.businessId === businessId)
            if (a) Object.assign(a, patch)
          }),
        setServiceArea: (businessId, patch) =>
          mut((d) => {
            const a = d.serviceAreas.find((x) => x.businessId === businessId)
            if (a) Object.assign(a, patch)
            else d.serviceAreas.push({ businessId, basePostcode: "", mode: "radius", radiusMiles: 5, districts: [], travelNote: "", ...patch })
          }),
        uploadCredential: (businessId, input) =>
          mut((d) => {
            d.credentials.push({ id: uid("cr"), businessId, type: input.type, label: input.label, number: input.number, fileUrl: input.fileName, expiresAt: input.expiresAt, status: "pending", submittedAt: d.clock })
          }),

        // ---------------------------------------------------------- desk
        startDeskTrial: (businessId) =>
          mut((d) => {
            const c = d.deskConfigs.find((x) => x.businessId === businessId)
            if (!c) return
            c.status = "trial"
            c.trialUsed = true
            c.trialEndsAt = addDays(d.clock, 14)
            c.setupStep = 1
            if (!c.number) c.number = `020 7946 0${String(720 + d.deskConfigs.indexOf(c)).padStart(3, "0")}`
            const sub = d.subscriptions.find((x) => x.businessId === businessId && x.plan === "desk")
            if (sub) Object.assign(sub, { status: "trialing", currentPeriodEnd: c.trialEndsAt })
            else d.subscriptions.push({ id: uid("sub"), businessId, plan: "desk", status: "trialing", stripeId: `sub_test_${businessId.slice(4, 14)}`, currentPeriodEnd: c.trialEndsAt, pricePence: 4900 })
            notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, businessId), event: "trial_started", mode: "business", businessId, title: "AI desk trial started", body: "Your 14-day AI desk trial has started. Set it up in a few minutes.", href: "/app/biz/desk/setup", channels: ["push", "email"] })
          }),
        setDeskStatus: (businessId, status) =>
          mut((d) => {
            const c = d.deskConfigs.find((x) => x.businessId === businessId)
            if (!c) return
            if (status === "paused") c.pausedFrom = c.status
            c.status = status
            if (status === "live") c.setupStep = 6
          }),
        updateDeskConfig: (businessId, patch) =>
          mut((d) => {
            const c = d.deskConfigs.find((x) => x.businessId === businessId)
            if (c) Object.assign(c, patch)
          }),
        upsertQna: (businessId, qna) =>
          mut((d) => {
            const c = d.deskConfigs.find((x) => x.businessId === businessId)
            if (!c) return
            const i = c.qna.findIndex((x) => x.id === qna.id)
            if (i >= 0) c.qna[i] = qna
            else c.qna.push(qna)
          }),
        deleteQna: (businessId, id) =>
          mut((d) => {
            const c = d.deskConfigs.find((x) => x.businessId === businessId)
            if (c) c.qna = c.qna.filter((x) => x.id !== id)
          }),
        runDeskScript: (scriptId, listingId, opts = {}) => {
          let runId = ""
          mut((d) => {
            const run = startRun(d, scriptId, listingId, { caller: opts.caller, noBook: opts.noBook, emergency: opts.emergency, outsideArea: opts.outsideArea })
            if (run) runId = run.id
          })
          if (!runId) return ""
          const run = get().runs.find((r) => r.id === runId)!
          if (opts.instant || typeof window === "undefined") {
            mut((d) => {
              const r = d.runs.find((x) => x.id === runId)!
              for (let i = r.cursor; i < r.steps.length; i++) applyStep(d, r, i)
              completeRun(d, r)
            })
            return runId
          }
          const stepMs = opts.stepMs ?? 1400
          const handles: ReturnType<typeof setTimeout>[] = []
          run.steps.forEach((_, i) => {
            handles.push(
              setTimeout(() => {
                mut((d) => {
                  const r = d.runs.find((x) => x.id === runId)
                  if (!r || r.done || r.cursor > i) return
                  applyStep(d, r, i)
                  r.cursor = i + 1
                  if (r.cursor >= r.steps.length) completeRun(d, r)
                })
              }, 400 + i * stepMs),
            )
          })
          timers.set(runId, handles)
          return runId
        },
        setAfterCall: (callId, answer) =>
          mut((d) => {
            const c = d.calls.find((x) => x.id === callId)
            if (c) c.afterCall = answer
            // A desk call may still be playing; remember the answer for when its record lands
            const r = d.runs.find((x) => x.callId === callId)
            if (r) r.afterCall = answer
          }),
        finishRuns: () =>
          mut((d) => {
            for (const r of d.runs) {
              if (r.done) continue
              for (let i = r.cursor; i < r.steps.length; i++) applyStep(d, r, i)
              completeRun(d, r)
              timers.get(r.id)?.forEach(clearTimeout)
            }
          }),

        // ---------------------------------------------------------- billing and team
        startSubscription: (businessId, plan) =>
          mut((d) => {
            const price = plan === "desk" ? 4900 : 2900
            const sub = d.subscriptions.find((x) => x.businessId === businessId && x.plan === plan)
            if (sub) Object.assign(sub, { status: "active", currentPeriodEnd: addDays(d.clock, 30), pricePence: price })
            else d.subscriptions.push({ id: uid("sub"), businessId, plan, status: "active", stripeId: `sub_test_${uid("x").slice(-8)}`, currentPeriodEnd: addDays(d.clock, 30), pricePence: price })
            d.invoices.unshift({ id: uid("inv"), businessId, at: d.clock, description: plan === "desk" ? "AI desk · monthly" : "Featured · monthly", amountPence: Math.round(price * 1.2), status: "paid" })
            if (plan === "desk") {
              const c = d.deskConfigs.find((x) => x.businessId === businessId)
              if (c && c.status !== "live") {
                c.status = c.setupStep >= 6 || c.status === "paused" ? "live" : c.status === "off" ? "trial" : c.status
                c.trialUsed = true
              }
            }
            if (plan === "featured") {
              const l = d.listings.find((x) => x.businessId === businessId)
              const slot = d.featuredSlots.find((f) => !f.businessId && l?.categoryIds.includes(f.categoryId))
              if (slot) {
                slot.businessId = businessId
                slot.startsAt = d.clock
              }
            }
          }),
        cancelSubscription: (businessId, plan) =>
          mut((d) => {
            const sub = d.subscriptions.find((x) => x.businessId === businessId && x.plan === plan)
            if (sub) sub.status = "cancelled"
            if (plan === "desk") {
              const c = d.deskConfigs.find((x) => x.businessId === businessId)
              if (c) c.status = "off"
            }
            if (plan === "featured") for (const f of d.featuredSlots) if (f.businessId === businessId) f.businessId = undefined
          }),
        inviteStaff: (businessId, name, phone) =>
          mut((d) => {
            const existingUser = d.users.find((u) => u.phone.replace(/\s/g, "") === phone.replace(/\s/g, ""))
            d.members.push({ id: uid("m"), businessId, userId: existingUser?.id ?? null, name, phone, role: "staff", invitedAt: d.clock })
          }),
        acceptInvite: (memberId) =>
          mut((d) => {
            const m = d.members.find((x) => x.id === memberId)
            if (!m) return
            m.joinedAt = d.clock
            if (!m.userId) {
              const id = uid("u")
              const [f, ...rest] = m.name.split(" ")
              d.users.push({ id, phone: m.phone, firstName: f ?? m.name, lastName: rest.join(" "), authProviders: ["phone"], marketingConsent: false, createdAt: d.clock })
              m.userId = id
            }
          }),
        removeMember: (memberId) => mut((d) => void (d.members = d.members.filter((x) => x.id !== memberId))),
        transferOwnership: (businessId, memberId) =>
          mut((d) => {
            for (const m of d.members) if (m.businessId === businessId && m.role === "owner") m.role = "staff"
            const m = d.members.find((x) => x.id === memberId)
            if (m) m.role = "owner"
          }),
        deleteBusiness: (businessId) =>
          mut((d) => {
            const b = d.businesses.find((x) => x.id === businessId)
            if (!b) return
            const l = d.listings.find((x) => x.id === b.listingId)
            if (l) {
              l.layer = "seeded"
              l.businessId = undefined
              l.badges = []
            }
            d.businesses = d.businesses.filter((x) => x.id !== businessId)
            d.members = d.members.filter((x) => x.businessId !== businessId)
            d.session.currentBusinessId = membershipsFor(d as DemoData, d.session.userId)[0]?.businessId ?? null
            if (!d.session.currentBusinessId) d.session.mode = "customer"
          }),

        // ---------------------------------------------------------- admin
        adminSignIn: () => mut((d) => void (d.session.adminSignedIn = true)),
        adminAudit: (action, targetType, targetId, reason) => mut((d) => void d.audit.unshift({ id: uid("au"), actorId: d.session.userId ?? "", action, targetType, targetId, reason, at: d.clock })),
        adminDecide: (queue, id, decision, reason, extra = {}) =>
          mut((d) => {
            const actor = d.session.userId ?? ""
            d.audit.unshift({ id: uid("au"), actorId: actor, action: `${queue}.${decision}`, targetType: queue, targetId: id, reason, at: d.clock })
            if (queue === "claim") {
              const c = d.claims.find((x) => x.id === id)
              if (!c) return
              const l = d.listings.find((x) => x.id === c.listingId)
              if (decision === "approve") approveClaim(d, c, actor, reason)
              else if (decision === "reject") {
                c.status = "rejected"
                c.reason = reason
                c.decidedBy = actor
                c.decidedAt = d.clock
                const biz = d.businesses.find((b) => b.listingId === c.listingId && b.status === "pending")
                notify(d, { userId: c.userId, event: "claim_rejected", mode: biz ? "business" : "customer", businessId: biz?.id, title: "Verification not approved", body: `We couldn't verify ${l?.name}: ${reason}`, href: biz ? "/app/biz/setup" : "/app/biz/claim", channels: ["push", "sms", "email"] })
              } else if (decision === "more_info") {
                c.status = "more_info"
                c.reason = reason
                notify(d, { userId: c.userId, event: "claim_more_info", mode: "business", title: "We need a bit more", body: `To verify ${l?.name}: ${reason}`, href: "/app/biz/setup", channels: ["push", "email"] })
              }
            }
            if (queue === "credential") {
              const c = d.credentials.find((x) => x.id === id)
              if (!c) return
              if (decision === "approve") {
                c.status = "verified"
                if (extra.expiresAt) c.expiresAt = String(extra.expiresAt)
                // A newer certificate supersedes older ones of the same type
                for (const o of d.credentials) if (o.id !== c.id && o.businessId === c.businessId && o.type === c.type && o.status === "verified") o.status = "expired"
              } else if (decision === "reject") {
                c.status = "rejected"
                c.reason = reason
              } else if (decision === "set_expiry" && extra.expiresAt) c.expiresAt = String(extra.expiresAt)
              notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, c.businessId), event: "credential", mode: "business", businessId: c.businessId, title: decision === "approve" ? "Credential verified" : "Credential update", body: decision === "approve" ? `Your ${c.label.toLowerCase()} is verified and shows on your listing.` : decision === "reject" ? `We couldn't verify your ${c.label.toLowerCase()}: ${reason}` : `Expiry date updated for ${c.label.toLowerCase()}.`, href: "/app/biz/profile/credentials", channels: ["push", "email"] })
            }
            if (queue === "review") {
              const r = d.reviews.find((x) => x.id === id)
              if (!r) return
              if (decision === "remove") r.status = "removed"
              r.flagged = false
              for (const rep of d.reports) if (rep.target === "review" && rep.targetId === id) {
                rep.status = "resolved"
                rep.resolution = decision === "remove" ? "Review removed" : "Review kept"
              }
            }
            if (queue === "report") {
              const rep = d.reports.find((x) => x.id === id)
              if (rep) {
                rep.status = "resolved"
                rep.resolution = decision
              }
            }
            if (queue === "listing") {
              const l = d.listings.find((x) => x.id === id)
              if (!l) return
              if (decision === "suspend") l.suspended = true
              if (decision === "unsuspend") l.suspended = false
              if (decision === "unpublish") l.unpublished = true
              if (decision === "republish") l.unpublished = false
              if (decision === "recategorise" && extra.categoryId) l.categoryIds = [String(extra.categoryId)]
              if (decision === "edit" && extra.patch) Object.assign(l, extra.patch as Partial<Listing>)
            }
            if (queue === "customer") {
              const u = d.users.find((x) => x.id === id)
              if (u) u.suspended = decision === "suspend"
            }
            if (queue === "desk_qa") {
              const c = d.calls.find((x) => x.id === id)
              if (c) c.qa = decision as NonNullable<typeof c.qa>
            }
            if (queue === "gate") {
              if (decision === "override") d.settings.gateOverrides.push({ businessId: id, reason, at: d.clock })
              if (decision === "remove_override") d.settings.gateOverrides = d.settings.gateOverrides.filter((o) => o.businessId !== id)
            }
            if (queue === "featured") {
              const f = d.featuredSlots.find((x) => x.id === id)
              if (f && decision === "release") f.businessId = undefined
            }
          }),
        mergeListings: (survivorId, otherId, fields, reason) =>
          mut((d) => {
            const s = d.listings.find((x) => x.id === survivorId)
            const o = d.listings.find((x) => x.id === otherId)
            if (!s || !o) return
            Object.assign(s, fields)
            for (const r of d.reviews) if (r.listingId === otherId) r.listingId = survivorId
            for (const e of d.enquiries) if (e.listingId === otherId) e.listingId = survivorId
            for (const t of d.threads) if (t.listingId === otherId) t.listingId = survivorId
            for (const c of d.calls) if (c.listingId === otherId) c.listingId = survivorId
            o.mergedInto = survivorId
            d.audit.unshift({ id: uid("au"), actorId: d.session.userId ?? "", action: "listing.merge", targetType: "listing", targetId: survivorId, reason: `${reason} (merged ${o.name})`, at: d.clock })
          }),
        runImport: (reason) =>
          mut((d) => {
            const names = ["Norwood Glaziers", "SE25 Pest Solutions", "Croydon Tile & Grout", "Palace Piano Tuning", "Selhurst Smart Repairs"]
            const cats = ["handymen", "pest-control", "builders", "everything-else", "computer-repair"]
            const n = d.imports.length
            names.forEach((name, i) => {
              const slug = `${slugify(name)}${n > 4 ? `-${n}` : ""}`
              if (d.listings.some((l) => l.slug === slug)) return
              const base = DISTRICTS[i % 2 ? "SE25" : "CR0"]!
              d.listings.push({ id: `l-${slug}`, slug, name, categoryIds: [cats[i] === "everything-else" ? "tutors" : cats[i]!], layer: "seeded", address: `${20 + i} High Street, ${base.label}`, postcode: i % 2 ? "SE25 5QQ" : "CR0 2RB", postcodeDistrict: i % 2 ? "SE25" : "CR0", area: i % 2 ? "south-norwood" : "croydon-town", city: "london", geo: { lat: base.lat + (i - 2) * 0.002, lng: base.lng + (i - 2) * 0.003 }, phonePublic: `020 7946 0${600 + i + n * 5}`, badges: [], sourceRefs: [{ listingId: `l-${slug}`, source: "companies_house", externalId: String(12000000 + i + n * 10), fetchedAt: d.clock }], replyMins: 240, hue: (i * 61) % 360, initials: initials(name), description: "", createdAt: d.clock })
            })
            d.imports.unshift({ id: uid("imp"), source: "companies_house", ranAt: d.clock, added: 5, updated: 0, errors: 0, status: "ok" })
            d.audit.unshift({ id: uid("au"), actorId: d.session.userId ?? "", action: "import.run", targetType: "import", targetId: "companies_house", reason, at: d.clock })
          }),
        updateSettings: (patch, reason) =>
          mut((d) => {
            Object.assign(d.settings, patch)
            d.audit.unshift({ id: uid("au"), actorId: d.session.userId ?? "", action: "settings.update", targetType: "settings", targetId: Object.keys(patch).join(","), reason, at: d.clock })
          }),
        setSupportView: (businessId) =>
          mut((d) => {
            d.session.supportViewBusinessId = businessId
            if (businessId) d.audit.unshift({ id: uid("au"), actorId: d.session.userId ?? "", action: "tenant.view_as_support", targetType: "business", targetId: businessId, reason: "Support view", at: d.clock })
          }),

        // ---------------------------------------------------------- prototype controls
        advanceClock: (hours) => {
          get().finishRuns()
          mut((d) => {
            const target = ms(d.clock) + hours * MS_HOUR
            const stepH = 1
            let t = ms(d.clock)
            while (t < target) {
              t = Math.min(target, t + stepH * MS_HOUR)
              d.clock = new Date(t).toISOString()
              tick(d)
            }
          })
        },
        setOffline: (v) => mut((d) => {
          d.offline = v
          if (!v) for (const m of d.messages) if (m.queued) m.queued = false
        }),
        setShowScreenIds: (v) => mut((d) => void (d.showScreenIds = v)),
        setStateOverride: (v) => mut((d) => void (d.stateOverride = v)),
        triggerMonetiseGate: (businessId = "biz-swift-plumbing-heating") =>
          mut((d) => {
            const biz = d.businesses.find((b) => b.id === businessId)
            if (!biz) return
            const g = gateStatus(d as DemoData, businessId)
            if (g.met) return
            if (g.count < 10) for (let i = g.count; i < 10; i++) d.enquiries.push({ id: uid("e"), listingId: biz.listingId, kind: "message", at: d.clock, layer: "claimed" })
            if (!g.daysOk) d.settings.gateOverrides.push({ businessId, reason: "Prototype: monetise gate triggered from the hub", at: d.clock })
            gateReached(d, businessId)
          }),
        setCookieConsent: (c) => mut((d) => void (d.session.cookieConsent = c ? { ...c, at: d.clock } : null)),
        resetDemo: () => {
          for (const hs of timers.values()) hs.forEach(clearTimeout)
          timers.clear()
          set((s) => ({ ...s, ...createSeed(), ...initialUi, hydrated: true, builtIds: s.builtIds }))
          toast("Demo data reset")
        },
        // P6
        setListingPublished: (businessId, published) =>
          mut((d) => {
            const l = d.listings.find((x) => x.businessId === businessId)
            if (l) l.unpublished = !published
          }),
      }
    },
    {
      name: "answerd-demo-v1",
      version: SEED_VERSION,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hydrated, ...rest } = s
        return Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as Partial<Store>
      },
      migrate: () => ({ ...createSeed(), ...initialUi }) as unknown as Store,
      onRehydrateStorage: () => (state) => {
        state?.finishRuns()
        useStore.setState({ hydrated: true })
      },
    },
  ),
)

/** Clock-driven automation: reminders, expiries, quote follow-ups, trial ends, referral joins, auto-approvals. */
function tick(d: D) {
  const now = ms(d.clock)
  // 24-hour reminders
  for (const b of d.bookings) {
    // Sent once, about 24 hours before; jobs booked for the same day don't get a reminder
    if (b.status === "confirmed" && !b.reminderSent && ms(b.startAt) - now <= MS_DAY && ms(b.startAt) - now > 3 * MS_HOUR) {
      b.reminderSent = true
      event(d, b.id, "reminder_sent", "system")
      const l = d.listings.find((x) => x.id === b.listingId)
      const street = b.address.split(",")[0]
      const when = `${fmtRelDay(b.startAt, d.clock)} ${fmtTime(b.startAt)}`
      if (b.customerId) notify(d, { userId: b.customerId, event: "reminder", mode: "customer", title: "Reminder", body: `${when}: ${l?.name} at ${street}`, href: bookingCustomerHref(b.id), channels: ["push", "sms"] })
      const assignees = b.assignedTo ? [b.assignedTo] : []
      notify(d, { userId: "", userIds: [...ownerUserIds(d as DemoData, l?.businessId), ...assignees], event: "reminder", mode: "business", businessId: l?.businessId, title: "Reminder", body: `${when}: ${b.customerName} at ${street}`, href: `/app/biz/jobs/${b.id}` })
    }
    // Expire requests unanswered after 2 hours
    if (b.status === "requested" && b.requestExpiresAt && ms(b.requestExpiresAt) <= now) {
      b.status = "declined"
      b.declineReason = "Request expired: no reply within 2 hours"
      b.requestExpiresAt = undefined
      event(d, b.id, "expired", "system")
      const lname = listingName(d, b.listingId)
      const others = similarFree(d, b.listingId, b.startAt)
      if (b.customerId) notify(d, { userId: b.customerId, event: "booking_expired", mode: "customer", title: `${lname} can't make it`, body: `${lname} can't make it. Here are ${Math.max(3, others.length)} others free that day.`, href: bookingCustomerHref(b.id), channels: ["push", "sms"] })
    }
  }
  // D-05 quote follow-ups at 2 and 7 days
  for (const q of d.quotes) {
    if (q.status !== "sent") continue
    while (q.followUpsSent < q.followUpsAt.length && ms(q.followUpsAt[q.followUpsSent]!) <= now) {
      const t = d.threads.find((x) => x.id === q.threadId)
      const l = d.listings.find((x) => x.id === q.listingId)
      const first = t ? customerFirst(d, t.customerId, t.customerName) : "there"
      const label = q.lines[0]?.label.toLowerCase() ?? "job"
      pushMessage(d, q.threadId, "desk", `Hi ${first}, just checking you got ${l?.name}'s quote for the ${label}. Happy to book a time?`)
      if (t?.customerId) notify(d, { userId: t.customerId, event: "desk_replied", mode: "customer", title: `${l?.name}'s Answerd desk`, body: `Just checking you got ${l?.name}'s quote. Happy to book a time?`, href: `/app/messages/${t.id}` })
      q.followUpsSent += 1
    }
    if (ms(q.validUntil) <= now) q.status = "expired"
  }
  // Trials: 3 days left, ended
  for (const c of d.deskConfigs) {
    if (!c.trialEndsAt || !["trial", "live", "paused"].includes(c.status)) continue
    const sub = d.subscriptions.find((x) => x.businessId === c.businessId && x.plan === "desk")
    if (sub?.status === "active") continue
    const left = ms(c.trialEndsAt) - now
    if (left <= 3 * MS_DAY && left > 3 * MS_DAY - MS_HOUR) notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, c.businessId), event: "trial_3_days", mode: "business", businessId: c.businessId, title: "3 days left", body: "3 days left on your AI desk trial", href: "/app/biz/billing", channels: ["push", "email"] })
    if (left <= 0) {
      c.status = "off"
      if (sub) sub.status = "cancelled"
      notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, c.businessId), event: "trial_ended", mode: "business", businessId: c.businessId, title: "Trial ended", body: "Your AI desk trial has ended. Customers now see your normal reply times.", href: "/app/biz/billing", channels: ["push", "email"] })
    }
  }
  // Referral joins
  for (const r of d.referrals) {
    if (r.joinsAt && !r.joinedUserId && ms(r.joinsAt) <= now) {
      r.joinedUserId = "u-c39"
      notify(d, { userId: r.referrerUserId, event: "friend_joined", mode: "customer", title: "Friend joined", body: `${r.joinedName ?? "A friend"} joined Answerd from your invite`, href: "/app/account/invite" })
    }
  }
  // Document claims auto-approve after a working day (prototype)
  for (const c of d.claims) {
    if (c.status === "pending" && now - ms(c.createdAt) >= MS_DAY) approveClaim(d, c, "u-ife", "Auto-approved after 1 working day (prototype)")
  }
  // Gate crossing by date
  for (const b of d.businesses) {
    const g = gateStatus(d as DemoData, b.id)
    const prev = gateStatus({ ...(d as DemoData), clock: new Date(now - MS_HOUR).toISOString() }, b.id)
    if (g.met && !prev.met) gateReached(d, b.id)
  }
  // Daily digest at 7am (D-07)
  const hour = new Date(now).getUTCHours()
  if (hour === 7) {
    for (const b of d.businesses) {
      const c = d.deskConfigs.find((x) => x.businessId === b.id)
      if (c?.status !== "live") continue
      const today = d.bookings.filter((x) => x.listingId === b.listingId && dayKey(x.startAt) === dayKey(d.clock) && ["confirmed"].includes(x.status)).length
      notify(d, { userId: "", userIds: ownerUserIds(d as DemoData, b.id), event: "daily_digest", mode: "business", businessId: b.id, title: "Daily digest", body: `Morning. Today: ${today} job${today === 1 ? "" : "s"}. Needs you: ${d.threads.filter((t) => t.listingId === b.listingId && t.status === "needs_owner").length}.`, href: "/app/biz", channels: ["sms"] })
    }
  }
}

// ------------------------------------------------------------------ hooks

export function useNow() {
  return useStore((s) => s.clock)
}

export function useSession() {
  return useStore((s) => s.session)
}

export function useCurrentUser() {
  const userId = useStore((s) => s.session.userId)
  const users = useStore((s) => s.users)
  return users.find((u) => u.id === userId)
}

export function useCurrentBusiness() {
  const id = useStore((s) => s.session.supportViewBusinessId ?? s.session.currentBusinessId)
  const businesses = useStore((s) => s.businesses)
  return businesses.find((b) => b.id === id)
}

export function getState() {
  return useStore.getState()
}

export { businessById, availabilityFor }
