import type { Metadata } from "next"
import { pageMeta } from "@/lib/seo"
import { WebPage } from "@/components/web/page"
import { ClaimFlow } from "@/components/web/claim-flow"
import { QrCode } from "@/components/site/qr-code"
import { StoreBadges } from "@/components/site/store-badges"
import { CATEGORY_GROUPS, LEAF_CATEGORIES, claimables } from "@/lib/data/queries"
import { pages } from "@/content/pages"

export const metadata: Metadata = pageMeta({ title: pages.claim.metaTitle, description: pages.claim.metaDescription, path: "/claim" })

/** W-11: claim or add your business, then get the app to run it. Every "List your business" link lands here. */
export default function ClaimPage() {
  const groups = CATEGORY_GROUPS.map((g) => ({ id: g.id, name: g.name, leaves: LEAF_CATEGORIES.filter((c) => c.parentId === g.id).map((c) => ({ id: c.id, name: c.name })) }))
  return (
    <WebPage className="bg-sky">
      <ClaimFlow copy={pages.claim} listings={claimables()} groups={groups} qr={<QrCode size={120} />} badges={<StoreBadges size="sm" block className="justify-center sm:flex-col" />} />
    </WebPage>
  )
}
