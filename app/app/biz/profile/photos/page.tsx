"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { PhotosForm } from "@/components/biz/profile"

/** B-15: Photos. Save shows a toast and returns to the setup checklist. */
export default function PhotosPage() {
  const router = useRouter()
  return (
    <BizScreen id="B-15" title="Photos">
      {({ biz }) => <PhotosForm businessId={biz!.id} onSaved={() => router.push("/app/biz/setup")} />}
    </BizScreen>
  )
}
