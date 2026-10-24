"use client"
import { use } from "react"
import { useRouter } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { DocumentUpload } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"

/** B-07: Upload a document; the claim goes to pending and the owner lands on B-09. */
function UploadDocument({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params)
  const router = useRouter()
  return (
    <ClaimScreen id="B-07" title="Upload a document" back={`/app/biz/claim/${listingId}/verify`}>
      <DocumentUpload listingId={listingId} onDone={() => router.replace("/app/biz/setup")} />
    </ClaimScreen>
  )
}

export default withSuspense(UploadDocument)
