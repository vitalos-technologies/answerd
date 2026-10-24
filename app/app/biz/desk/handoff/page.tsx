"use client"
import { BizScreen } from "@/components/app/biz"
import { HandoffRulesEditor } from "@/components/biz/desk/HandoffRulesEditor"
import { PoweredByAskBridge } from "@/components/biz/desk/common"

/** B-35 Handoff rules */
export default function HandoffPage() {
  return (
    <BizScreen id="B-35" title="Handoff rules" back="/app/biz/desk">
      {({ biz, readOnly }) => (
        <div className="space-y-4 px-4 py-4">
          <HandoffRulesEditor businessId={biz!.id} readOnly={readOnly} />
          <PoweredByAskBridge />
        </div>
      )}
    </BizScreen>
  )
}
