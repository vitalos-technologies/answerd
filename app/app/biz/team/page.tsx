"use client"
import { BizScreen } from "@/components/app/biz"
import { TeamManager } from "@/components/biz/account/TeamManager"

/** B-38 Team */
export default function TeamPage() {
  return (
    <BizScreen id="B-38" title="Team" back="/app/biz/more">
      {({ biz, readOnly }) => (
        <div className="px-4 py-4">
          <TeamManager businessId={biz!.id} readOnly={readOnly} />
        </div>
      )}
    </BizScreen>
  )
}
