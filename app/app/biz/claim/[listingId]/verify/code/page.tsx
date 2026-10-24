"use client"
import { use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { CodeEntry, listedIsLandline } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"
import { useStore } from "@/lib/store"

/** B-05: Enter code (texted, or read out on a call for landlines). */
function EnterCode({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  const sp = useSearchParams()
  const listing = useStore((s) => s.listings.find((l) => l.id === listingId))
  // Text a code is never offered for a landline, even from an old link
  const method = sp.get("method") === "call" || (listing && listedIsLandline(listing)) ? "call" : "sms"
  return (
    <ClaimScreen id="B-05" title="Enter code" back={`/app/biz/claim/${listingId}/verify`}>
      <CodeEntry listingId={listingId} method={method} onVerified={() => router.replace(`/app/biz/claim/${listingId}/done`)} onChangeMethod={() => router.push(`/app/biz/claim/${listingId}/verify`)} />
    </ClaimScreen>
  )
}

export default withSuspense(EnterCode)
