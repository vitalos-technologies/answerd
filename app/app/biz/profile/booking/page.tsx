"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { BookingSettingsForm } from "@/components/biz/profile"

/** B-17: Booking settings. Save shows a toast and returns to the setup checklist. */
export default function BookingSettings() {
  const router = useRouter()
  return (
    <BizScreen id="B-17" title="Booking settings">
      {({ biz }) => <BookingSettingsForm businessId={biz!.id} onSaved={() => router.push("/app/biz/setup")} />}
    </BizScreen>
  )
}
