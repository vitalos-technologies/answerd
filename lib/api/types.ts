// Answerd API contract, as far as the prototype uses it. Written from live staging responses (Oct 2026) until
// @vitalos/answerd-client can be installed (issue #2). Kept in step with marketing-site/lib/api/types.ts.

export type ApiLayer = "claimed" | "seeded" | "places"

export interface ApiProblem {
  type: string
  title: string
  status: number
  code: string
  detail?: string
  errors?: { path: string; message: string }[]
}

export interface ApiCategory {
  id: string
  slug: string
  name: string
  plural: string
  parentId: string | null
  icon: string
}

/** A search result. Places (Google) results have no id or slug, only a placeId, and poweredByGoogle. */
export interface ApiListingCard {
  id: string | null
  slug: string | null
  placeId: string | null
  layer: ApiLayer
  name: string
  categoryName: string
  distanceMiles: number | null
  rating: number | null
  reviewCount: number
  badges: string[]
  replyTimeLine: string | null
  openStatus: string | null
  featured: boolean
  deskLive: boolean
  reason: string
  poweredByGoogle: boolean
  geo: { lat: number; lng: number }
  phonePublic: string | null
  avatar: { initials: string; tint: string; photoUrl: string | null }
}

export interface ApiService {
  id: string
  name: string
  description: string
  durationMin: number
  priceType: "fixed" | "from" | "hourly" | "quote"
  pricePence: number | null
  priceMaxPence: number | null
  vatIncluded: boolean
  bookable: boolean
  sort: number
}

export interface ApiListing extends ApiListingCard {
  description: string | null
  address: string | null
  postcodeDistrict: string | null
  website: string | null
  claimed: boolean
  bookable: boolean
  backOn: string | null
  attribution: string | null
  hours: { day: number; open: string; close: string; closed: boolean }[]
  reviewSummary: { average: number; count: number; distribution: number[] } | null
  serviceArea: { mode: string; radiusMiles: number | null; districts: string[]; travelNote: string | null } | null
  credentials: { type: string; label: string; status: string; expiresAt: string | null }[]
  photos: { id: string; url: string; caption: string | null; sort: number; isCover: boolean }[]
  services: ApiService[]
}

export interface ApiReview {
  id: string
  listingId: string
  authorName: string
  stars: number
  body: string
  reply: string | { body: string } | null
  createdAt: string
}

export interface ApiSearchResult {
  query: { q: string | null; categorySlug: string | null; location: { lat: number; lng: number }; radiusMiles: number }
  items: ApiListingCard[]
  nextCursor: string | null
  counts: Partial<Record<ApiLayer, number>>
  gapFill: string
}

export interface ApiSearchParams {
  q?: string
  category?: string
  postcode?: string
  lat?: number
  lng?: number
  radiusMiles?: number
  sort?: "best" | "nearest" | "top_rated"
  cursor?: string
  limit?: number
}

export interface ApiSession {
  accessToken: string
  refreshToken: string
  expiresAt?: string
  user?: { id: string; name?: string | null; phone?: string }
}

export interface ApiBilling {
  plan?: string
  gate?: { enquiries: number; required: number; met: boolean }
  [k: string]: unknown
}
