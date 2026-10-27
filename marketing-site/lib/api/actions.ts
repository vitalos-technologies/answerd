"use server"
// Server Actions the site's client islands call in API mode. They run on the server, so the browser never
// talks to the API directly (its CORS allows the production origin only) and access tokens stay in
// httpOnly cookies. Nothing here is cached: every call is no-store.
import { cookies } from "next/headers"
import * as api from "./client"
import { ApiError } from "./client"
import type { ApiListing, ApiListingCard, ApiSession } from "./types"

const ACCESS = "answerd_at"
const REFRESH = "answerd_rt"
const DEVICE = "answerd_device"
const COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" }

export type ActionResult<T> = { ok: true; data: T } | { ok: false; code: string; message: string; status: number }

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  if (!api.apiEnabled) return { ok: false, code: "API_OFF", message: "API mode is off", status: 0 }
  try {
    return { ok: true, data: await fn() }
  } catch (e) {
    if (e instanceof ApiError) return { ok: false, code: e.code, message: e.problem?.title ?? e.message, status: e.status }
    return { ok: false, code: "NETWORK", message: "We couldn't reach Answerd. Try again in a minute.", status: 0 }
  }
}

async function deviceId() {
  const jar = await cookies()
  let id = jar.get(DEVICE)?.value
  if (!id) {
    id = `web-${crypto.randomUUID()}`
    jar.set(DEVICE, id, { ...COOKIE, maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

async function keep(s: ApiSession) {
  const jar = await cookies()
  jar.set(ACCESS, s.accessToken, { ...COOKIE, maxAge: 60 * 60 })
  jar.set(REFRESH, s.refreshToken, { ...COOKIE, maxAge: 60 * 60 * 24 * 30 })
}

/** Calls fn with the access token, refreshing it once if the API says it has expired. */
async function authed<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const jar = await cookies()
  const at = jar.get(ACCESS)?.value
  const rt = jar.get(REFRESH)?.value
  if (at) {
    try {
      return await fn(at)
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401) || !rt) throw e
    }
  }
  if (!rt) throw new ApiError(401, { type: "", title: "Sign in to continue", status: 401, code: "UNAUTHENTICATED" })
  const s = await api.refresh(rt)
  await keep(s)
  return fn(s.accessToken)
}

// ------------------------------------------------------------------ live search (never cached)

export interface LiveResult {
  key: string
  slug: string | null
  name: string
  categoryName: string
  initials: string
  rating: number | null
  reviewCount: number
  distanceMiles: number | null
  phone: string | null
  google: boolean
  reason: string
}

function live(i: ApiListingCard): LiveResult {
  return {
    key: i.id ?? i.placeId ?? i.name,
    slug: i.slug,
    name: i.name,
    categoryName: i.categoryName,
    initials: i.avatar?.initials ?? i.name.slice(0, 2).toUpperCase(),
    rating: i.rating,
    reviewCount: i.reviewCount,
    distanceMiles: i.distanceMiles,
    phone: i.phonePublic,
    google: i.poweredByGoogle,
    reason: i.reason,
  }
}

/** Google (places) results for a place and category. Rendered only with attribution, never stored. */
export async function googleResults(q: { lat?: number; lng?: number; postcode?: string; category?: string; q?: string }) {
  return run(async () => (await api.search({ ...q, sort: "best" }, false)).items.filter((i) => i.poweredByGoogle).map(live))
}

/** Chat with Answerd: the public search tool. */
export async function chatSearch(query: string) {
  return run(async () => (await api.toolSearch(query)).items.slice(0, 3).map(live))
}

// ------------------------------------------------------------------ phone-code sign-in (W-12)

/** "07700 900123" → "+447700900123" */
function e164(ukMobile: string) {
  return `+44${ukMobile.replace(/\s/g, "").replace(/^0/, "")}`
}

export async function signInStart(phone: string) {
  return run(async () => api.otpStart(e164(phone), await deviceId()))
}

export interface SignedIn {
  name: string
  business: string
  slug: string
  businessId: string | null
}

async function whoAmI(token: string): Promise<SignedIn> {
  const m = await api.me(token)
  const b = m.businesses?.[0]
  return { name: m.name || m.phone || "", business: b?.name ?? "", slug: b?.listingSlug ?? "", businessId: b?.id ?? null }
}

export async function signInVerify(phone: string, code: string) {
  return run(async () => {
    const s = await api.otpVerify(e164(phone), code, await deviceId())
    await keep(s)
    return whoAmI(s.accessToken)
  })
}

export async function currentUser() {
  return run(() => authed(whoAmI))
}

export async function signOut() {
  return run(async () => {
    const jar = await cookies()
    const at = jar.get(ACCESS)?.value
    if (at) await api.logout(at).catch(() => undefined)
    jar.delete(ACCESS)
    jar.delete(REFRESH)
  })
}

// ------------------------------------------------------------------ claim (W-11)

export async function claimStart(listingId: string) {
  return run(() => authed((t) => api.startClaim(t, listingId)))
}

export async function claimVerify(claimId: string, method: "sms" | "call" | "director" | "document", body: Record<string, unknown> = {}) {
  return run(() => authed((t) => api.claimVerify(t, claimId, method, body)))
}

/** Claim search: Answerd's own listings only (Google places can't be claimed until imported). */
export async function claimSearch(q: string, postcode: string) {
  return run(async () => (await api.search({ q: q || undefined, postcode: postcode || undefined }, false)).items.filter((i) => !i.poweredByGoogle && i.id))
}

/** The listing a "Claim this business" link names (/claim?listing=slug). */
export async function claimLookup(slug: string) {
  return run(() => api.call<ApiListing>(`/v1/listings/${encodeURIComponent(slug)}`))
}

// ------------------------------------------------------------------ billing (W-18): Stripe Checkout and Portal

export async function billingStatus(businessId: string) {
  return run(() => authed((t) => api.billing(t, businessId)))
}

export async function checkout(businessId: string, plan: "desk" | "featured", returnUrl: string) {
  return run(() => authed((t) => api.checkoutSession(t, businessId, plan, returnUrl)))
}

export async function portal(businessId: string, returnUrl: string) {
  return run(() => authed((t) => api.portalSession(t, businessId, returnUrl)))
}
