// Pure helpers for the claim and verification flow (B-01 to B-08, and W-11 later).
import type { DemoData } from "@/lib/seed"
import type { Claim, Listing } from "@/lib/types"
import { findCompany } from "@/lib/companiesHouse"
import { ENQUIRY_KINDS } from "@/lib/selectors"
import { isLandline } from "@/lib/format"
import { fmtDayMonth, london, ms, parts } from "@/lib/time"
import { useStore } from "@/lib/store"

type S = Pick<DemoData, keyof DemoData>

/** The signed-in user's open claim on a listing (status started), newest first. */
export function openClaim(s: S, listingId: string): Claim | undefined {
  return s.claims
    .filter((c) => c.listingId === listingId && c.userId === s.session.userId && c.status === "started")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

/** The signed-in user's most recent claim on a listing, whatever its status. */
export function latestClaim(s: S, listingId: string): Claim | undefined {
  return s.claims.filter((c) => c.listingId === listingId && c.userId === s.session.userId && c.status !== "disputed").sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
}

/** Returns the open claim id for a listing, starting one if needed (store action). */
export function ensureClaim(listingId: string, method: Claim["method"]) {
  const s = useStore.getState()
  const existing = openClaim(s, listingId)
  if (existing) return existing.id
  const prev = latestClaim(s, listingId)
  const id = s.claimListing(listingId, method)
  // Carry the legal type from an earlier claim on the same listing (e.g. a rejected document)
  if (prev?.legalType) s.setClaimDetails(id, { legalType: prev.legalType, companyNumber: prev.companyNumber })
  return id
}

/** "020 7946 0456" → "0207 … 456" (the listed number, partly hidden). */
export function maskListed(phone: string) {
  const d = phone.replace(/\D/g, "")
  if (d.length < 7) return phone
  return `${d.slice(0, 4)} … ${d.slice(-3)}`
}

export function listedIsLandline(l: Listing) {
  return isLandline(l.phonePublic)
}

/** Director check is offered for limited companies only. */
export function isLimitedCompany(s: S, l: Listing) {
  const claim = openClaim(s, l.id) ?? latestClaim(s, l.id)
  if (claim?.legalType) return claim.legalType === "ltd"
  const biz = s.businesses.find((b) => b.listingId === l.id)
  if (biz) return biz.legalType === "ltd"
  return !!findCompany(l.name) || l.sourceRefs.some((r) => r.source === "companies_house")
}

export function companyFor(s: S, l: Listing) {
  const claim = openClaim(s, l.id) ?? latestClaim(s, l.id)
  return findCompany(claim?.companyNumber || l.name)
}

export interface EnquiryHistory {
  calls: number
  messages: number
  bookings: number
  total: number
  since: string | null
  items: { id: string; kind: "call" | "message" | "booking"; at: string }[]
}

/** B-08: everything Answerd has logged for this listing, counted from the 1st of the month of the earliest one. */
export function enquiryHistory(s: S, listingId: string): EnquiryHistory {
  const list = s.enquiries
    .filter((e) => e.listingId === listingId && (ENQUIRY_KINDS as readonly string[]).includes(e.kind) && ms(e.at) <= ms(s.clock))
    .sort((a, b) => b.at.localeCompare(a.at)) as EnquiryHistory["items"]
  const earliest = list.at(-1)
  let since: string | null = null
  if (earliest) {
    const p = parts(earliest.at)
    since = london(p.y, p.m, 1)
  }
  return {
    calls: list.filter((e) => e.kind === "call").length,
    messages: list.filter((e) => e.kind === "message").length,
    bookings: list.filter((e) => e.kind === "booking").length,
    total: list.length,
    since,
    items: list.map((e) => ({ id: e.id, kind: e.kind, at: e.at })),
  }
}

/** "6 calls and 3 messages from Answerd since 1 Oct" */
export function historyLine(h: EnquiryHistory) {
  const bits: string[] = []
  if (h.calls) bits.push(`${h.calls} call${h.calls === 1 ? "" : "s"}`)
  if (h.messages) bits.push(`${h.messages} message${h.messages === 1 ? "" : "s"}`)
  if (h.bookings) bits.push(`${h.bookings} booking request${h.bookings === 1 ? "" : "s"}`)
  if (!bits.length) return "No enquiries yet. New ones will land in your inbox."
  const list = bits.length > 1 ? `${bits.slice(0, -1).join(", ")} and ${bits.at(-1)}` : bits[0]
  return `${list} from Answerd${h.since ? ` since ${fmtDayMonth(h.since)}` : ""}`
}

export const DOCUMENT_KINDS = ["Utility bill", "Bank letter", "Insurance schedule", "HMRC letter"] as const
