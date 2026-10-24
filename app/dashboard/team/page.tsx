"use client"
import { useSearchParams } from "next/navigation"
import { withSuspense } from "@/components/app/helpers"
import { TeamSettings } from "@/components/dashboard/TeamSettings"

/** W-19 Dashboard team and settings: Team (B-38) and Notifications (B-39) tabs. */
function TeamPage() {
  const sp = useSearchParams()
  return <TeamSettings tab={sp.get("tab") === "notifications" ? "notifications" : "team"} />
}

export default withSuspense(TeamPage)
