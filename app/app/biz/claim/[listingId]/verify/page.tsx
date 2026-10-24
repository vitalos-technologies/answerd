"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { VerifyMethods } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"

/** B-04: Verify ownership. */
function Verify({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  const base = `/app/biz/claim/${listingId}/verify`
  return (
    <ClaimScreen id="B-04" title="Verify ownership" back={`/app/biz/claim/${listingId}`}>
      <VerifyMethods
        listingId={listingId}
        onPick={(m) => router.push(m === "sms" || m === "call" ? `${base}/code?method=${m}` : `${base}/${m}`)}
      />
    </ClaimScreen>
  )
}

export default withSuspense(Verify)
