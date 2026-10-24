"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { ClaimPreview, ensureClaim } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"

/** B-02: Is this you? */
function IsThisYou({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  return (
    <ClaimScreen id="B-02" title="Claim your business" back="/app/biz/claim">
      <ClaimPreview
        listingId={listingId}
        listingHref={(slug) => `/app/b/${slug}`}
        onClaim={() => {
          ensureClaim(listingId, "sms")
          router.push(`/app/biz/claim/${listingId}/verify`)
        }}
        onNotMine={() => router.push("/app/biz/claim")}
        onOpenMine={() => {
          const l = useStore.getState().listings.find((x) => x.id === listingId)
          useStore.getState().setMode("business", l?.businessId)
          router.push("/app/biz")
        }}
      />
    </ClaimScreen>
  )
}

export default withSuspense(IsThisYou)
