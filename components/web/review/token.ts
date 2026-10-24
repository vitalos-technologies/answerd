// W-27 review links. In the prototype the signed token is the booking ID of a completed booking
// (for example bk-tayo-swift-past). Links last 30 days from the job; anything else counts as expired.
import type { DemoData } from "@/lib/seed"
import { ms, MS_DAY } from "@/lib/time"

export const REVIEW_LINK_DAYS = 30

export type ReviewTokenState = "valid" | "reviewed" | "expired"

export function reviewTokenState(s: Pick<DemoData, "bookings" | "reviews" | "clock">, token: string): ReviewTokenState {
  const b = s.bookings.find((x) => x.id === token)
  if (!b || b.status !== "completed") return "expired"
  if (b.reviewId || s.reviews.some((r) => r.bookingId === b.id && r.status === "live")) return "reviewed"
  if (ms(s.clock) - ms(b.endAt) > REVIEW_LINK_DAYS * MS_DAY) return "expired"
  return "valid"
}
