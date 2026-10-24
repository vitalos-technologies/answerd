"use client"
import { use } from "react"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { CallDetail } from "@/components/biz/ops/CallDetail"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"

/** B-21 Call detail. */
export default function CallPage({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = use(params)
  return (
    <OpsScreen id="B-21" title="Call" back="/app/biz/inbox?filter=calls">
      {() => (
        <div className="p-4">
          <DataGate isEmpty={false} empty={<EmptyState title="No call to show" body="Calls to your Answerd number show here with a summary." />} rows={3}>
            <CallDetail callId={callId} />
          </DataGate>
        </div>
      )}
    </OpsScreen>
  )
}
