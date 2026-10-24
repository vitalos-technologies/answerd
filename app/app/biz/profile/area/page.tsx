"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { AreaForm } from "@/components/biz/profile"

/** B-14: Service area. Save shows a toast and returns to the setup checklist. */
export default function ServiceAreaPage() {
  const router = useRouter()
  return (
    <BizScreen id="B-14" title="Service area">
      {({ biz }) => <AreaForm businessId={biz!.id} onSaved={() => router.push("/app/biz/setup")} />}
    </BizScreen>
  )
}
