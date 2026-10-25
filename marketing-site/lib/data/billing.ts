// Gate facts for the mock billing pages (W-18): the demo business is Swift Plumbing & Heating, as in the prototype.
import { GATE_ENQUIRIES, gateFor, listingBySlug } from "./queries"
import { DEMO_NOW, addDays, fmtDate, fmtDateYear } from "./time"
import type { GateInfo } from "@/components/web/billing"

/** The prototype's desk trial for Swift started on 19 Oct and lasts 14 days. */
const SWIFT_TRIAL_ENDS = addDays("2026-10-19T09:00:00.000Z", 14)

export function demoGate(slug: string): GateInfo {
  const l = listingBySlug(slug)!
  const g = gateFor(l)
  return {
    count: g.count,
    total: GATE_ENQUIRIES,
    date: fmtDate(g.gateDate),
    dateOk: g.daysOk,
    trialEnds: fmtDate(SWIFT_TRIAL_ENDS),
    today: fmtDateYear(DEMO_NOW),
    renews: fmtDate(addDays(DEMO_NOW, 31)),
  }
}
