"use client"
import * as React from "react"
import { useRouter } from "next/navigation"
import { AppScreen, TopBar } from "@/components/shells/AppScreen"
import { ButtonLink } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { useBiz } from "@/components/app/biz"
import { DeskOverview } from "@/components/biz/desk/DeskOverview"

/** B-32 Desk */
export default function DeskPage() {
  const { s, biz, readOnly } = useBiz()
  const router = useRouter()
  React.useEffect(() => {
    if (s.hydrated && !biz) router.replace("/app/biz/claim")
  }, [s.hydrated, biz, router])
  return (
    <AppScreen id="B-32" biz tabs="business" header={<TopBar title="AI desk" />}>
      <div className="px-4 py-4">
        {biz ? (
          <DeskOverview businessId={biz.id} readOnly={readOnly} />
        ) : (
          <EmptyState title="No business yet" body="Claim or add your business to switch on the desk." action={<ButtonLink href="/app/biz/claim" size="md">Find your business</ButtonLink>} />
        )}
      </div>
    </AppScreen>
  )
}
