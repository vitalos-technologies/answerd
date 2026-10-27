// The site's one door to the Answerd API. API mode is on when NEXT_PUBLIC_ANSWERD_API_URL is set; without
// it every page builds from the static fallback data in lib/data/seed.ts, as before.
//
// This is a thin hand-written stand-in for @vitalos/answerd-client, which can't be installed yet (it is a
// private GitHub Package, see issue #2). The functions mirror the client's endpoints one to one, so swapping
// in the package changes this file only.
import type { ApiCategory, ApiListing, ApiProblem, ApiReview, ApiSearchParams, ApiSearchResult, ApiSession } from "./types"

export const API_URL = (process.env.NEXT_PUBLIC_ANSWERD_API_URL ?? "").replace(/\/+$/, "")
export const apiEnabled = API_URL !== ""

/** Pages regenerate at most hourly; a listing change revalidates its tags on demand (app/api/revalidate). */
export const REVALIDATE_SECONDS = 3600
export const tags = {
  listing: (slug: string) => `listing:${slug}`,
  search: "search",
  categories: "categories",
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ApiProblem | null,
  ) {
    super(problem?.detail || problem?.title || `Answerd API error ${status}`)
  }
  get code() {
    return this.problem?.code ?? "UNKNOWN"
  }
}

type NextFetch = RequestInit & { next?: { revalidate?: number | false; tags?: string[] } }

export interface CallOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
  token?: string
  /** Cached for ISR with these tags (server only). Leave out for no-store. */
  cacheTags?: string[]
  timeoutMs?: number
}

// Staging runs on Render's free tier: it sleeps after 15 minutes and takes about a minute to wake.
const DEFAULT_TIMEOUT_MS = 90_000
const WAKING = new Set([502, 503, 504])

export async function call<T>(path: string, o: CallOptions = {}): Promise<T> {
  if (!apiEnabled) throw new Error("Answerd API mode is off (NEXT_PUBLIC_ANSWERD_API_URL is not set)")
  const url = new URL(`${API_URL}${path}`)
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v))
  const init: NextFetch = {
    method: o.method ?? "GET",
    headers: {
      accept: "application/json",
      ...(o.body !== undefined ? { "content-type": "application/json" } : {}),
      ...(o.token ? { authorization: `Bearer ${o.token}` } : {}),
    },
    body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
    ...(o.cacheTags ? { next: { revalidate: REVALIDATE_SECONDS, tags: o.cacheTags } } : { cache: "no-store" }),
  }
  // One retry covers a cold start: the first request can die while Render boots the service.
  for (let attempt = 0; ; attempt++) {
    let res: Response
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(o.timeoutMs ?? DEFAULT_TIMEOUT_MS) })
    } catch (e) {
      if (attempt === 0) continue
      throw e
    }
    if (WAKING.has(res.status) && attempt === 0) continue
    if (res.status === 204) return undefined as T
    const json = (await res.json().catch(() => null)) as unknown
    if (!res.ok) throw new ApiError(res.status, json as ApiProblem | null)
    return json as T
  }
}

// ------------------------------------------------------------------ public reads (cached for ISR)

export function search(p: ApiSearchParams, cached = true) {
  return call<ApiSearchResult>("/v1/search", { query: { ...p }, cacheTags: cached ? [tags.search] : undefined })
}

export function categories() {
  return call<{ items: ApiCategory[] }>("/v1/categories", { cacheTags: [tags.categories] })
}

export function listing(slugOrId: string) {
  return call<ApiListing>(`/v1/listings/${encodeURIComponent(slugOrId)}`, { cacheTags: [tags.listing(slugOrId)] })
}

export function listingReviews(id: string, slug: string) {
  return call<{ items: ApiReview[]; nextCursor?: string | null }>(`/v1/listings/${id}/reviews`, { cacheTags: [tags.listing(slug)] })
}

export function suggest(q: string) {
  return call<{ items: { kind: "service" | "business"; label: string; categorySlug?: string; listingSlug?: string }[] }>("/v1/suggest", { query: { q } })
}

/** The public search tool Chat with Answerd uses. It needs a place in the query ("… near SE25"). */
export function toolSearch(query: string) {
  return call<{ items: ApiSearchResult["items"] }>("/v1/tools/search", { method: "POST", body: { query } })
}

// ------------------------------------------------------------------ phone-code sign-in

export function otpStart(phone: string, deviceId: string) {
  return call<{ expiresAt: string; resendAfterSec: number }>("/v1/auth/otp/start", { method: "POST", body: { phone, deviceId } })
}
export function otpVerify(phone: string, code: string, deviceId: string) {
  return call<ApiSession>("/v1/auth/otp/verify", { method: "POST", body: { phone, code, deviceId } })
}
export function refresh(refreshToken: string) {
  return call<ApiSession>("/v1/auth/refresh", { method: "POST", body: { refreshToken } })
}
export function logout(token: string) {
  return call<void>("/v1/auth/logout", { method: "POST", token, body: {} })
}
export function me(token: string) {
  return call<{ id: string; name?: string | null; phone?: string; businesses?: { id: string; name: string; listingId?: string; listingSlug?: string }[] }>("/v1/me", { token })
}

// ------------------------------------------------------------------ claim (W-11) and billing (W-18)
// Routes confirmed on staging; request bodies follow the prototype's flow until the spec confirms them.

export function startClaim(token: string, listingId: string) {
  return call<{ id: string; status: string; methods?: string[] }>("/v1/claims", { method: "POST", token, body: { listingId } })
}
export function claimVerify(token: string, claimId: string, method: "sms" | "call" | "director" | "document", body: Record<string, unknown> = {}) {
  return call<{ id: string; status: string; businessId?: string }>(`/v1/claims/${claimId}/verify/${method}`, { method: "POST", token, body })
}
export function billing(token: string, businessId: string) {
  return call<import("./types").ApiBilling>(`/v1/businesses/${businessId}/billing`, { token })
}
export function checkoutSession(token: string, businessId: string, plan: "desk" | "featured", returnUrl: string) {
  return call<{ url: string }>(`/v1/businesses/${businessId}/billing/checkout-session`, { method: "POST", token, body: { plan, successUrl: returnUrl, cancelUrl: returnUrl } })
}
export function portalSession(token: string, businessId: string, returnUrl: string) {
  return call<{ url: string }>(`/v1/businesses/${businessId}/billing/portal-session`, { method: "POST", token, body: { returnUrl } })
}
