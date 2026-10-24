"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { DeskSetup } from "@/components/biz/desk/DeskSetup"

/** B-31 Desk setup */
export default function DeskSetupPage() {
  const router = useRouter()
  return (
    <BizScreen id="B-31" title="Set up your desk" back="/app/biz/desk">
      {({ biz }) => (
        <div className="px-4 py-4">
          <DeskSetup businessId={biz!.id} onDone={() => router.push("/app/biz/desk")} />
        </div>
      )}
    </BizScreen>
  )
}
