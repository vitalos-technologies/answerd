"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { DirectorCheck } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"

/** B-06: Director check against Companies House (mock). */
function Director({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  return (
    <ClaimScreen id="B-06" title="Director check" back={`/app/biz/claim/${listingId}/verify`}>
      <DirectorCheck listingId={listingId} onVerified={() => router.replace(`/app/biz/claim/${listingId}/done`)} onNoMatch={() => router.push(`/app/biz/claim/${listingId}/verify/document`)} />
    </ClaimScreen>
  )
}

export default withSuspense(Director)
