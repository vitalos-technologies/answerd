"use client"
import * as React from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { ClaimSuccess } from "@/components/biz/claim"
import { claimState } from "@/components/app/claim"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"

/** B-08: You're in. Reveals the enquiry history; the Business, owner membership and DeskConfig already exist. */
function YoureIn({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  const s = useStore()
  const l = s.listings.find((x) => x.id === listingId)
  const mine = !!l && claimState(s, l) === "mine"
  // A document claim still being checked lands on B-09 with the pending banner instead
  const pending = s.businesses.find((b) => b.listingId === listingId)?.status === "pending"
  React.useEffect(() => {
    if (!s.session.userId) return
    if (!mine) router.replace(`/app/biz/claim/${listingId}/verify`)
    else if (pending) router.replace("/app/biz/setup")
  }, [mine, pending, s.session.userId, listingId, router])
  return (
    <ClaimScreen id="B-08" title="You're in" back="/app/biz/setup">
      {mine && !pending && <ClaimSuccess listingId={listingId} onContinue={() => router.push("/app/biz/setup")} />}
    </ClaimScreen>
  )
}

export default withSuspense(YoureIn)
