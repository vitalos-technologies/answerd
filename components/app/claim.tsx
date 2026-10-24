"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import type { Listing } from "@/lib/types"
import { membershipsFor } from "@/lib/selectors"
import { signInHref } from "./helpers"

/** Claiming needs an account: send guests to C-05 first. */
export function useClaimAuth(next: string) {
  const router = useRouter()
  const userId = useStore((s) => s.session.userId)
  const hydrated = useStore((s) => s.hydrated)
  React.useEffect(() => {
    if (hydrated && !userId) router.replace(signInHref(next))
  }, [hydrated, userId, router, next])
  return userId
}

export function sourceHint(l: Listing) {
  if (l.layer === "claimed") return "On Answerd"
  if (l.layer === "places") return "From Google"
  return l.sourceRefs.some((r) => r.source === "companies_house") ? "From Companies House" : "From OpenStreetMap"
}

/** Who owns a listing relative to the signed-in user. */
export function claimState(s: ReturnType<typeof useStore.getState>, l: Listing): "free" | "mine" | "taken" {
  if (!l.businessId) return "free"
  return membershipsFor(s, s.session.userId).some((m) => m.businessId === l.businessId) ? "mine" : "taken"
}

const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["the", "and", "ltd", "co", "services", "service"].includes(w))
    .map((w) => w.replace(/(ing|ers|er|s)$/, ""))

/** Name similarity 0..1 by shared word stems. */
export function nameSimilarity(a: string, b: string) {
  const A = new Set(words(a))
  const B = new Set(words(b))
  if (!A.size || !B.size) return 0
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / Math.min(A.size, B.size)
}

/** Enquiries this calendar month (the B-02 teaser). */
export function enquiriesThisMonth(s: ReturnType<typeof useStore.getState>, listingId: string) {
  const month = s.clock.slice(0, 7)
  return s.enquiries.filter((e) => e.listingId === listingId && ["call", "message", "booking"].includes(e.kind) && e.at.slice(0, 7) === month)
}
