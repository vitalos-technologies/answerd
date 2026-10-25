import type { Metadata } from "next"
import { ClaimStepper } from "@/components/web/claim/ClaimStepper"
import { ClaimsGate } from "@/components/admin/super/live"

export const metadata: Metadata = {
  title: "Claim or add your business",
  description: "Claim your free Answerd listing or add your business in a few minutes. See who's been trying to reach you.",
  alternates: { canonical: "/claim" },
}

/** W-11: Claim or add. */
export default function Page() {
  return (
    <ClaimsGate>
      <ClaimStepper />
    </ClaimsGate>
  )
}
