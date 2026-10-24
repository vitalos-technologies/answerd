"use client"
import { use } from "react"
import { OpsScreen } from "@/components/biz/ops/OpsScreen"
import { JobPanel } from "@/components/biz/ops/JobPanel"

/** B-24 Job. */
export default function JobPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = use(params)
  return (
    <OpsScreen id="B-24" title="Job" back="/app/biz/diary">
      {() => (
        <div className="p-4">
          <JobPanel bookingId={bookingId} />
        </div>
      )}
    </OpsScreen>
  )
}
