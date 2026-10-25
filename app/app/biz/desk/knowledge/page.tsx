"use client"
import { BizScreen } from "@/components/app/biz"
import { KnowledgeEditor } from "@/components/biz/desk/KnowledgeEditor"

/** B-34 What the desk knows */
export default function KnowledgePage() {
  return (
    <BizScreen id="B-34" title="What the desk knows" back="/app/biz/desk">
      {({ biz, readOnly }) => (
        <div className="space-y-4 px-4 py-4">
          <p className="t-label font-normal text-slate">The desk only knows your profile, your diary and the answers below. It never makes things up.</p>
          <KnowledgeEditor businessId={biz!.id} readOnly={readOnly} />
        </div>
      )}
    </BizScreen>
  )
}
