"use client"
import { BizScreen } from "@/components/app/biz"
import { ButtonLink } from "@/components/answerd/Button"
import { SetupChecklist } from "@/components/biz/profile"

/** B-09: Setup checklist. Progress is computed from real data; the same card shows on B-18 until complete. */
export default function SetupPage() {
  return (
    <BizScreen id="B-09" title="Set up your profile" back="/app/biz" ownerOnly={false}>
      {({ biz, listing }) => (
        <div className="space-y-4 px-4 py-5">
          <SetupChecklist businessId={biz!.id} />
          <ButtonLink href={`/app/b/${listing!.slug}`} variant="secondary" block>
            See your listing as customers do
          </ButtonLink>
          <ButtonLink href="/app/biz" variant="ghost" block>
            Go to Today
          </ButtonLink>
        </div>
      )}
    </BizScreen>
  )
}
