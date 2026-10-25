// Entities from the prototype's lib/types.ts, trimmed to what the public site renders.

export type Layer = "claimed" | "seeded" | "places"
export type City = "london" | "birmingham" | "manchester"

export interface Category {
  id: string
  name: string
  plural: string
  slug: string
  parentId: string | null
  icon: string
}

export type BadgeKind = "responds_instantly" | "verified" | "gas_safe" | "niceic" | "napit" | "insured" | "dbs" | "unclaimed" | "new"

export interface Listing {
  id: string
  slug: string
  name: string
  categoryIds: string[]
  layer: Layer
  address: string
  postcode: string
  postcodeDistrict: string
  area: string
  city: City
  geo: { lat: number; lng: number }
  phonePublic: string
  verified: boolean
  businessId?: string
  googleRating?: number
  googleCount?: number
  replyMins: number
  initials: string
  description: string
  createdAt: string
}

export interface Business {
  id: string
  listingId: string
  legalType: "sole_trader" | "partnership" | "ltd"
  website: string
  yearFounded?: number
  bookingMode: "instant" | "request"
}

export type PriceType = "fixed" | "from" | "hourly" | "quote"

export interface Service {
  id: string
  businessId: string
  name: string
  description: string
  durationMin: number
  priceType: PriceType
  pricePence: number
  priceToPence?: number
  vatIncluded: boolean
  bookable: boolean
  order: number
}

export interface DayHours {
  day: number // 0 Sun … 6 Sat
  closed: boolean
  open: string
  close: string
}

export interface Availability {
  businessId: string
  weeklyHours: DayHours[]
  holidays: { from: string; to: string; label: string }[]
}

export interface ServiceArea {
  businessId: string
  basePostcode: string
  radiusMiles: number
  travelNote: string
}

export type CredentialType = "gas_safe" | "niceic" | "napit" | "insurance" | "dbs" | "qualification"

export interface Credential {
  id: string
  businessId: string
  type: CredentialType
  label: string
  number: string
  expiresAt?: string
  status: "pending" | "verified" | "rejected" | "expired"
}

export interface Desk {
  businessId: string
  status: "off" | "live" | "paused"
  number: string
}

export interface Review {
  id: string
  listingId: string
  authorName: string
  stars: number
  text: string
  reply?: string
  createdAt: string
}

/** Calls, messages and bookings Answerd sent a business (the monetise gate counts these). */
export interface Enquiry {
  listingId: string
  kind: "call" | "message" | "booking"
  at: string
}
