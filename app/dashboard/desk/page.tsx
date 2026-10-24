"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { withSuspense } from "@/components/app/helpers"
import { DeskOverview, DeskStatusPill } from "@/components/biz/desk/DeskOverview"
import { DeskSetup } from "@/components/biz/desk/DeskSetup"
import { KnowledgeEditor } from "@/components/biz/desk/KnowledgeEditor"
import { HandoffRulesEditor } from "@/components/biz/desk/HandoffRulesEditor"
import { PoweredByAskBridge } from "@/components/biz/desk/common"
import { DashPage, LinkTabs } from "@/components/dashboard/kit"
import { DeskIntroPanel, TestCallTab } from "@/components/dashboard/DeskTabs"
import { DESK_TABS, dashDeskLinks, deskHref, type DeskTab } from "@/components/dashboard/links"
import { deskFor } from "@/lib/selectors"

/** W-17 Dashboard AI desk: B-31 to B-35 as tabs Overview, Setup, Knowledge, Handoff and Test call (plus the B-30 intro). */
function DeskPage() {
  const sp = useSearchParams()
  const router = useRouter()
  const raw = sp.get("tab")
  const tab: DeskTab = raw === "intro" || DESK_TABS.some((t) => t.value === raw) ? (raw as DeskTab) : "overview"
  return (
    <DashPage
      id="W-17"
      title="AI desk"
      ownerOnly
      sub={({ s, biz }) => {
        const d = deskFor(s, biz.id)
        return (
          <span className="flex flex-wrap items-center gap-2">
            Your AI front desk answers calls and texts you miss.
            {d && <DeskStatusPill status={d.status} />}
          </span>
        )
      }}
    >
      {({ biz, listing }) => (
        <div>
          <LinkTabs label="AI desk sections" tabs={DESK_TABS} value={tab === "intro" ? "overview" : tab} hrefFor={deskHref} />
          <div className="mt-5">
            {tab === "intro" && <DeskIntroPanel listing={listing} />}
            {tab === "overview" && (
              <div className="max-w-3xl">
                <DeskOverview businessId={biz.id} links={dashDeskLinks} />
              </div>
            )}
            {tab === "setup" && (
              <div className="max-w-2xl">
                <DeskSetup businessId={biz.id} links={dashDeskLinks} onDone={() => router.push(deskHref("overview"))} />
              </div>
            )}
            {tab === "knowledge" && (
              <div className="max-w-3xl">
                <KnowledgeEditor businessId={biz.id} links={dashDeskLinks} />
              </div>
            )}
            {tab === "handoff" && (
              <div className="max-w-2xl">
                <HandoffRulesEditor businessId={biz.id} />
              </div>
            )}
            {tab === "test" && <TestCallTab listing={listing} />}
          </div>
          <PoweredByAskBridge className="mt-8" />
        </div>
      )}
    </DashPage>
  )
}

export default withSuspense(DeskPage)
