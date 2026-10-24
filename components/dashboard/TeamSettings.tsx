"use client"
import { useRouter } from "next/navigation"
import { TeamManager } from "@/components/biz/account/TeamManager"
import { BusinessNotificationPrefs } from "@/components/biz/account/BusinessNotificationPrefs"
import { BusinessSettingsPanel } from "@/components/biz/account/BusinessSettingsPanel"
import { useStore } from "@/lib/store"
import { membershipsFor } from "@/lib/selectors"
import { DashPage, LinkTabs } from "./kit"

export const TEAM_TABS = [
  { value: "team", label: "Team" },
  { value: "notifications", label: "Notifications" },
  { value: "settings", label: "Business settings" },
] as const
export type TeamTab = (typeof TEAM_TABS)[number]["value"]

const HREF: Record<TeamTab, string> = { team: "/dashboard/team", notifications: "/dashboard/team?tab=notifications", settings: "/dashboard/settings" }
const SUB: Record<TeamTab, string> = {
  team: "Invite staff by name and mobile. Staff see the shared inbox and their own jobs.",
  notifications: "How Answerd tells you about calls, messages and bookings.",
  settings: "Switch business, transfer ownership, unpublish or delete. Each needs an SMS code.",
}

/** W-19 Team and settings: B-38 team, B-39 notifications and B-40 business settings as tabs. */
export function TeamSettings({ tab }: { tab: TeamTab }) {
  const router = useRouter()
  return (
    <DashPage id="W-19" title="Team and settings" sub={SUB[tab]} ownerOnly>
      {({ biz }) => (
        <div>
          <LinkTabs label="Team and settings" tabs={TEAM_TABS} value={tab} hrefFor={(t) => HREF[t]} />
          <div className="mt-5 max-w-2xl">
            {tab === "team" && <TeamManager businessId={biz.id} />}
            {tab === "notifications" && <BusinessNotificationPrefs businessId={biz.id} />}
            {tab === "settings" && (
              <BusinessSettingsPanel
                businessId={biz.id}
                claimHref="/claim"
                onSwitched={() => router.push("/dashboard")}
                onTransferred={() => router.push("/dashboard")}
                onDeleted={() => {
                  const st = useStore.getState()
                  router.replace(membershipsFor(st, st.session.userId).length ? "/dashboard" : "/account")
                }}
              />
            )}
          </div>
        </div>
      )}
    </DashPage>
  )
}
