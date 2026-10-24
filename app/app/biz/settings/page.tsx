"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { useBiz } from "@/components/app/biz"
import { BusinessSettingsPanel } from "@/components/biz/account/BusinessSettingsPanel"
import { useStore } from "@/lib/store"

/** B-40 Business settings */
export default function BizSettingsPage() {
  const router = useRouter()
  const { s, biz, readOnly } = useBiz()
  const leaving = React.useRef(false)
  React.useEffect(() => {
    if (s.hydrated && !biz && !leaving.current) router.replace("/app/biz/claim")
  }, [s.hydrated, biz, router])
  return (
    <AppScreen id="B-40" biz header={<TopBar title="Business settings" back="/app/biz/more" />}>
      {biz && (
        <div className="px-4 py-4">
          <BusinessSettingsPanel
            businessId={biz.id}
            readOnly={readOnly}
            onSwitched={() => router.push("/app/biz")}
            onTransferred={() => router.push("/app/biz")}
            onDeleted={() => {
              leaving.current = true
              router.replace(useStore.getState().session.mode === "business" ? "/app/biz" : "/app")
            }}
          />
        </div>
      )}
    </AppScreen>
  )
}
