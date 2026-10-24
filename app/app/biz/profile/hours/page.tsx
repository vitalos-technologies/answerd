"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { HoursForm } from "@/components/biz/profile"

/** B-13: Hours and availability. Save shows a toast and returns to the setup checklist. */
export default function HoursAvailability() {
  const router = useRouter()
  return (
    <BizScreen id="B-13" title="Hours and availability">
      {({ biz }) => <HoursForm businessId={biz!.id} onSaved={() => router.push("/app/biz/setup")} />}
    </BizScreen>
  )
}
