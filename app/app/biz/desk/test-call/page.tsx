"use client"
import { useRouter } from "next/navigation"
import { BizScreen } from "@/components/app/biz"
import { CallScreen } from "@/components/biz/desk/CallScreen"

/** B-33 Test call */
export default function TestCallPage() {
  const router = useRouter()
  return (
    <BizScreen id="B-33" title="Test call" back="/app/biz/desk">
      {({ listing }) => <CallScreen listing={listing!} onEnd={() => router.push("/app/biz/desk")} />}
    </BizScreen>
  )
}
