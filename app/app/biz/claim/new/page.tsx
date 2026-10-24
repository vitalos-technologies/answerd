"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { ClaimScreen } from "@/components/biz/claim/ClaimScreen"
import { AddBusinessForm } from "@/components/biz/claim"
import { withSuspense } from "@/components/app/helpers"

/** B-03: Add your business, with a duplicate check first. */
function AddBusiness() {
  const router = useRouter()
  const sp = useSearchParams()
  return (
    <ClaimScreen id="B-03" title="Add your business" back="/app/biz/claim">
      <AddBusinessForm
        initialName={sp.get("name") ?? ""}
        initialPostcode={sp.get("postcode") ?? ""}
        onPickExisting={(id) => router.push(`/app/biz/claim/${id}`)}
        onCreated={(id) => router.push(`/app/biz/claim/${id}/verify`)}
      />
    </ClaimScreen>
  )
}

export default withSuspense(AddBusiness)
