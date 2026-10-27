"use client"
// The prototype's door to the Answerd API in API mode. A thin stand-in for @vitalos/answerd-client, which can't
// be installed yet (a private GitHub Package, issue #2): the functions mirror its endpoints, so swapping the
// package in changes this file only. Calls go through the same-origin proxy, carry the session's bearer token,
// refresh it once on 401, and wait out a cold start on staging (Render's free tier sleeps).
import { PROXY_BASE, apiMode } from "./config"
import { clearSession, deviceId, getSession, setSession, updateTokens } from "./session"
import { logCall, useApiStatus } from "./status"
import type { ApiCategory, ApiListing, ApiProblem, ApiReview, ApiSearchParams, ApiSearchResult, ApiSession } from "./types"

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

export interface CallOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  query?: Record<string, string | number | boolean | undefined | null>
  body?: unknown
  /** Send the session's token (default true when signed in) */
  auth?: boolean
  /** The store action this call mirrors, for the hub's log */
  action?: string
  timeoutMs?: number
}

const TIMEOUT_MS = 90_000
const WAKING = new Set([502, 503, 504])

async function once(path: string, o: CallOptions, token: string | null) {
  const url = new URL(`${PROXY_BASE}${path}`, window.location.origin)
  for (const [k, v] of Object.entries(o.query ?? {})) if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v))
  const started = performance.now()
  const method = o.method ?? "GET"
  try {
    const res = await fetch(url, {
      method,
      headers: {
        accept: "application/json",
        ...(o.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(o.timeoutMs ?? TIMEOUT_MS),
    })
    logCall({ at: Date.now(), method, path, status: res.status, ms: Math.round(performance.now() - started), action: o.action })
    return res
  } catch (e) {
    logCall({ at: Date.now(), method, path, status: "network", ms: Math.round(performance.now() - started), action: o.action })
    throw e
  }
}

export async function call<T>(path: string, o: CallOptions = {}): Promise<T> {
  if (!apiMode) throw new Error("Answerd API mode is off (NEXT_PUBLIC_ANSWERD_API_URL is not set)")
  const session = o.auth === false ? null : getSession()
  let res: Response
  try {
    res = await once(path, o, session?.accessToken ?? null)
  } catch {
    res = await once(path, o, session?.accessToken ?? null) // one retry for a cold start
  }
  if (WAKING.has(res.status)) res = await once(path, o, session?.accessToken ?? null)
  if (res.status === 401 && session?.refreshToken) {
    try {
      updateTokens(await refresh(session.refreshToken))
      res = await once(path, o, getSession()?.accessToken ?? null)
    } catch {
      clearSession()
      useApiStatus.setState({ user: null })
    }
  }
  if (res.status === 204) return undefined as T
  const json = (await res.json().catch(() => null)) as unknown
  if (!res.ok) throw new ApiError(res.status, json as ApiProblem | null)
  return json as T
}

/** Wakes staging up (it sleeps after 15 minutes idle). Resolves true once the API answers. */
export async function warmUp() {
  try {
    await call("/v1/categories", { auth: false, timeoutMs: 120_000 })
    return true
  } catch {
    return false
  }
}

// ------------------------------------------------------------------ public reads

export const categories = () => call<{ items: ApiCategory[] }>("/v1/categories", { auth: false })
export const search = (p: ApiSearchParams) => call<ApiSearchResult>("/v1/search", { query: { ...p } })
export const listing = (slugOrId: string) => call<ApiListing>(`/v1/listings/${encodeURIComponent(slugOrId)}`)
export const listingReviews = (id: string) => call<{ items: ApiReview[]; nextCursor?: string | null }>(`/v1/listings/${id}/reviews`)
export const availability = (id: string, serviceId: string, from: string, to: string) =>
  call<{ serviceId: string; days: { date: string; slots: { startAt: string; endAt: string; label: string; window: string | null }[] }[] }>(`/v1/listings/${id}/availability`, { query: { serviceId, from, to } })
export const suggest = (q: string) => call<{ items: { kind: string; label: string; categorySlug?: string; listingSlug?: string }[] }>("/v1/suggest", { query: { q } })

// ------------------------------------------------------------------ phone-code sign-in (staging: allowlisted test numbers, code 123456)

/** "07700 900123" → "+447700900123" */
export const e164 = (ukMobile: string) => `+44${ukMobile.replace(/\s/g, "").replace(/^0/, "")}`

export const otpStart = (phone: string) => call<{ expiresAt: string; resendAfterSec: number }>("/v1/auth/otp/start", { method: "POST", auth: false, body: { phone: e164(phone), deviceId: deviceId() } })

export async function otpVerify(phone: string, code: string) {
  const s = await call<ApiSession>("/v1/auth/otp/verify", { method: "POST", auth: false, body: { phone: e164(phone), code, deviceId: deviceId() } })
  const stored = setSession(s, phone)
  const me = await call<{ id: string; phone?: string; name?: string | null }>("/v1/me").catch(() => null)
  useApiStatus.setState({ user: { id: me?.id ?? stored.userId, phone, name: me?.name } })
  return s
}

export function refresh(refreshToken: string) {
  return call<ApiSession>("/v1/auth/refresh", { method: "POST", auth: false, body: { refreshToken } })
}

export async function logout() {
  if (getSession()) await call("/v1/auth/logout", { method: "POST", body: {}, action: "signOut" }).catch(() => undefined)
  clearSession()
  useApiStatus.setState({ user: null })
}
