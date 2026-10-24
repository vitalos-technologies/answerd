// Entities from docs/answerd-spec.md › Data model, plus prototype-only state.

export type ID = string
export type ISO = string

export type Layer = "claimed" | "seeded" | "places"
export type Mode = "customer" | "business"
export type PersonaId = "guest" | "tayo" | "sam" | "jo" | "ife" | "dan" | "custom"

export interface User {
  id: ID
  phone: string
  email?: string
  firstName: string
  lastName: string
  authProviders: ("phone" | "apple" | "google" | "email")[]
  marketingConsent: boolean
  createdAt: ISO
  staffRole?: "admin" | "support"
  suspended?: boolean
  deleted?: boolean
}

export interface SavedPlace {
  id: ID
  label: string
  postcode: string
  area: string
}

export interface CustomerProfile {
  userId: ID
  savedPlaces: SavedPlace[]
  savedListingIds: ID[]
  referralCode: string
  recentSearches: string[]
  notificationPrefs: {
    bookingPush: boolean
    bookingSms: boolean
    messagesPush: boolean
    reminders: boolean
    reviewRequests: boolean
    offers: boolean
  }
  noShowCount: number
}

export interface Category {
  id: ID
  name: string
  plural: string
  slug: string
  parentId: ID | null
  icon: string
  sicCodes: string[]
  osmTags: string[]
  placesTypes: string[]
}

export type BadgeKind =
  | "responds_instantly"
  | "verified"
  | "gas_safe"
  | "niceic"
  | "napit"
  | "insured"
  | "dbs"
  | "featured"
  | "unclaimed"
  | "open_now"
  | "new"
  | "desk"

export interface SourceRef {
  listingId: ID
  source: "companies_house" | "osm" | "places" | "owner"
  externalId: string
  fetchedAt: ISO
}

export interface Listing {
  id: ID
  slug: string
  name: string
  categoryIds: ID[]
  layer: Layer
  address: string
  postcode: string
  postcodeDistrict: string
  area: string // area slug, e.g. south-norwood
  city: "london" | "birmingham" | "manchester"
  geo: { lat: number; lng: number }
  phonePublic: string
  badges: BadgeKind[] // stored badges (verified); credential and desk badges are derived
  businessId?: ID
  sourceRefs: SourceRef[]
  placeId?: string
  googleRating?: number
  googleCount?: number
  replyMins: number
  hue: number
  initials: string
  description: string
  createdAt: ISO
  suspended?: boolean
  unpublished?: boolean
  mergedInto?: ID
}

export interface Photo {
  id: ID
  caption: string
  hue: number
  icon: string
}

export interface Business {
  id: ID
  listingId: ID
  tenantId: string
  legalType: "sole_trader" | "partnership" | "ltd"
  companyNumber?: string
  tradingName: string
  description: string
  email: string
  website: string
  socials: string
  yearFounded?: number
  verifiedAt?: ISO
  status: "pending" | "live" | "suspended"
  bookingMode: "instant" | "request"
  cancellationPolicy: "24h" | "48h" | "custom"
  cancellationCustom?: string
  customerReminders: boolean
  photos: Photo[]
  coverPhotoId?: ID
  emergencyCallout: boolean
  notificationPrefs: {
    newEnquiry: boolean
    handoff: boolean
    bookingRequest: boolean
    dailyDigest: boolean
    reviewPosted: boolean
    push: boolean
    sms: boolean
    email: boolean
  }
  createdAt: ISO
}

export interface BusinessMember {
  id: ID
  businessId: ID
  userId: ID | null
  name: string
  phone: string
  role: "owner" | "staff"
  invitedAt: ISO
  joinedAt?: ISO
}

export type PriceType = "fixed" | "from" | "hourly" | "quote"

export interface Service {
  id: ID
  businessId: ID
  name: string
  description: string
  durationMin: number
  priceType: PriceType
  pricePence: number
  priceToPence?: number // upper end of the listed range, used by the desk
  vatIncluded: boolean
  bookable: boolean
  order: number
}

export interface DayHours {
  day: number // 0 Sun … 6 Sat
  closed: boolean
  open: string // "08:00"
  close: string // "18:00"
}

export interface Holiday {
  id: ID
  from: string // yyyy-mm-dd
  to: string
  label: string
}

export interface Availability {
  businessId: ID
  weeklyHours: DayHours[]
  slotMode: "slots" | "windows"
  slotLengthMin: number
  leadTimeMin: number
  bufferMin: number
  maxPerDay: number
  holidays: Holiday[]
}

export interface ServiceArea {
  businessId: ID
  basePostcode: string
  mode: "radius" | "districts"
  radiusMiles: number
  districts: string[]
  travelNote: string
}

export type CredentialType = "gas_safe" | "niceic" | "napit" | "insurance" | "dbs" | "qualification"

export interface Credential {
  id: ID
  businessId: ID
  type: CredentialType
  label: string
  number: string
  fileUrl: string
  expiresAt?: ISO
  status: "pending" | "verified" | "rejected" | "expired"
  reason?: string
  submittedAt: ISO
}

export interface Claim {
  id: ID
  listingId: ID
  userId: ID
  method: "sms" | "call" | "director" | "document"
  status: "started" | "pending" | "approved" | "rejected" | "disputed" | "more_info"
  evidenceUrl?: string
  evidenceKind?: string
  details?: string
  decidedBy?: ID
  reason?: string
  createdAt: ISO
  decidedAt?: ISO
}

export interface Thread {
  id: ID
  listingId: ID
  customerId: ID | null
  customerName: string
  customerPhone?: string
  channel: "app" | "sms" | "call"
  status: "open" | "needs_owner" | "closed"
  deskActive: boolean
  spam?: boolean
  handoffReason?: string
  assignedTo?: ID
  createdAt: ISO
  updatedAt: ISO
  unreadCustomer: number
  unreadBusiness: number
  notes?: string
}

export type MessageAuthor = "customer" | "owner" | "staff" | "desk" | "system"

export type MessageCard =
  | { kind: "slot"; slots: ISO[]; serviceId?: ID }
  | { kind: "quote"; quoteId: ID }
  | { kind: "booking"; bookingId: ID }

export interface Message {
  id: ID
  threadId: ID
  author: MessageAuthor
  authorName?: string
  body: string
  attachments: string[]
  card?: MessageCard
  createdAt: ISO
  queued?: boolean
}

export interface TranscriptLine {
  speaker: "caller" | "desk" | "owner"
  text: string
  atSec: number
}

export interface Call {
  id: ID
  listingId: ID
  trackedNumber: string
  callerMasked: string
  customerId?: ID | null
  customerName?: string
  startedAt: ISO
  durationSec: number
  outcome: "owner" | "desk" | "missed"
  recordingUrl?: string
  transcript?: TranscriptLine[]
  summary?: string
  bookingId?: ID
  threadId?: ID
  spam?: boolean
  scriptId?: string
  qa?: "good" | "wrong_info" | "bad_handoff" | "unsafe"
}

export interface Enquiry {
  id: ID
  listingId: ID
  kind: "call" | "message" | "booking" | "profile_view" | "search_appearance"
  at: ISO
  layer: Layer
}

export type BookingStatus =
  | "requested"
  | "confirmed"
  | "on_the_way"
  | "arrived"
  | "completed"
  | "cancelled"
  | "declined"
  | "no_show"

export interface Booking {
  id: ID
  listingId: ID
  customerId: ID | null
  customerName: string
  customerPhone: string
  serviceId: ID
  startAt: ISO
  endAt: ISO
  address: string
  postcode: string
  accessNotes: string
  notes: string
  photos: string[]
  status: BookingStatus
  createdBy: "customer" | "owner" | "desk"
  policy: string
  priceText: string
  requestExpiresAt?: ISO
  assignedTo?: ID
  reviewId?: ID
  changeRequest?: { startAt: ISO; reason: string; at: ISO }
  declineReason?: string
  cancelReason?: string
  cancelledBy?: "customer" | "business"
  reminderSent?: boolean
  reviewRequested?: boolean
  quoteId?: ID
  createdAt: ISO
}

export interface BlockTime {
  id: ID
  businessId: ID
  startAt: ISO
  endAt: ISO
  reason: string
  repeat: "none" | "daily" | "weekly"
}

export interface BookingEvent {
  id: ID
  bookingId: ID
  type:
    | "requested"
    | "confirmed"
    | "declined"
    | "expired"
    | "time_proposed"
    | "change_requested"
    | "change_accepted"
    | "rescheduled"
    | "on_the_way"
    | "arrived"
    | "completed"
    | "cancelled"
    | "no_show"
    | "reminder_sent"
    | "review_requested"
    | "reviewed"
  actor: "customer" | "owner" | "staff" | "desk" | "system"
  at: ISO
  reason?: string
}

export interface QuoteLine {
  id: ID
  label: string
  pricePence: number
}

export interface Quote {
  id: ID
  threadId: ID
  listingId: ID
  lines: QuoteLine[]
  vatIncluded: boolean
  vatPence: number
  totalPence: number
  validUntil: ISO
  message: string
  status: "sent" | "accepted" | "declined" | "expired"
  sentAt: ISO
  followUpsAt: ISO[]
  followUpsSent: number
}

export interface Review {
  id: ID
  listingId: ID
  bookingId?: ID
  callId?: ID
  customerId: ID | null
  authorName: string
  stars: number
  aspects?: { quality?: number; punctuality?: number; value?: number; communication?: number }
  text: string
  photos: string[]
  status: "live" | "removed"
  flagged?: boolean
  flagReason?: string
  reply?: { body: string; at: ISO }
  createdAt: ISO
}

export interface Referral {
  id: ID
  referrerUserId: ID
  kind: "invite" | "recommend"
  listingId?: ID
  code: string
  joinedUserId?: ID
  joinedName?: string
  at: ISO
  joinsAt?: ISO // prototype: when the demo clock should mark the friend as joined
}

export type DeskStatus = "off" | "trial" | "live" | "paused"

export interface QnA {
  id: ID
  q: string
  a: string
}

export interface DeskConfig {
  businessId: ID
  status: DeskStatus
  number: string
  voice: "Ellie" | "James" | "Amara"
  greeting: string
  permissions: { calls: boolean; sms: boolean; book: boolean; quotes: boolean; reviews: boolean }
  handoffRules: {
    emergencies: boolean
    complaints: boolean
    priceNegotiation: boolean
    namedRequests: boolean
    custom: string
  }
  quietHours: { enabled: boolean; from: string; to: string }
  alertWho: ("owner" | "staff")[]
  qna: QnA[]
  neverSay: string[]
  trialEndsAt?: ISO
  trialUsed: boolean
  forwardingDetected?: boolean
  setupStep: number
  pausedFrom?: DeskStatus
}

export interface Subscription {
  id: ID
  businessId: ID
  plan: "free" | "desk" | "featured"
  status: "trialing" | "active" | "past_due" | "cancelled"
  stripeId: string
  currentPeriodEnd: ISO
  pricePence: number
}

export interface Invoice {
  id: ID
  businessId: ID
  at: ISO
  description: string
  amountPence: number
  status: "paid" | "failed" | "refunded"
}

export interface FeaturedSlot {
  id: ID
  categoryId: ID
  areaCode: string
  position: 1 | 2 | 3
  businessId?: ID
  startsAt?: ISO
  waitlist: ID[]
}

export interface Notification {
  id: ID
  userId: ID
  event: string
  mode: Mode
  businessId?: ID
  channels: ("push" | "sms" | "email")[]
  title: string
  body: string
  href: string
  at: ISO
  readAt?: ISO
}

export interface Report {
  id: ID
  target: "listing" | "review" | "user"
  targetId: ID
  reason: string
  details: string
  status: "open" | "resolved"
  reporterId: ID | null
  at: ISO
  resolution?: string
}

export interface AuditEvent {
  id: ID
  actorId: ID
  action: string
  targetType: string
  targetId: ID
  reason: string
  at: ISO
}

export interface SupportTicket {
  id: ID
  userId: ID | null
  subject: string
  body: string
  at: ISO
}

export interface ImportJob {
  id: ID
  source: "companies_house" | "osm"
  ranAt: ISO
  added: number
  updated: number
  errors: number
  status: "ok" | "failed"
}

export interface PlacesDay {
  date: string
  spendPence: number
  calls: number
  cacheHits: number
}

export interface Settings {
  featuredOn: boolean
  gapFillOn: boolean
  voiceProvider: "AskBridge Voice" | "AskBridge Voice (beta)"
  killSwitch: boolean
  placesCapPence: number
  gateOverrides: { businessId: ID; reason: string; at: ISO }[]
  launchDate: ISO
  homeCategoryOrder: ID[]
  homeBanner: string
  seoIntroTemplate: string
}

export interface BookingDraft {
  listingId: ID
  serviceId?: ID
  startAt?: ISO
  address?: string
  postcode?: string
  accessNotes?: string
  notes?: string
  photos?: string[]
  contactPhone?: string
  fromSlotCard?: boolean
}

export interface Session {
  personaId: PersonaId
  userId: ID | null
  mode: Mode
  currentBusinessId: ID | null
  location: { postcode: string; label: string; lat: number; lng: number } | null
  onboarded: boolean
  notificationsAsked: boolean
  pushEnabled: boolean
  askCount: number
  failedCodes: Record<string, number>
  lockedUntil: Record<string, ISO>
  cookieConsent: null | { analytics: boolean; marketing: boolean; at: ISO }
  adminSignedIn: boolean
  supportViewBusinessId: ID | null
  recentAreas: string[]
  guestRecentSearches: string[]
  pendingPhone?: string
}

export interface DeskRun {
  id: ID
  scriptId: string
  listingId: ID
  startedAt: number // real ms timestamp, for streaming in the UI
  lines: TranscriptLine[]
  done: boolean
  callId?: ID
  threadId?: ID
}
