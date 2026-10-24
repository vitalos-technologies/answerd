"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { DetailsForm } from "@/components/biz/profile"

/** B-10: Business details. Save shows a toast and returns to the setup checklist. */
export default function BusinessDetails() {
  const router = useRouter()
  return (
    <BizScreen id="B-10" title="Business details">
      {({ biz }) => <DetailsForm businessId={biz!.id} onSaved={() => router.push("/app/biz/setup")} />}
    </BizScreen>
  )
}
