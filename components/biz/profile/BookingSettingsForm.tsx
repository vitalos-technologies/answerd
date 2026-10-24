"use client"
import * as React from "react"
import { Field, TextArea, ToggleRow } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { toast } from "@/lib/toast"
import type { Business } from "@/lib/types"
import { ChoiceCard, FormSkeleton, SaveBar, useBizRecord } from "./fields"
import type { EditorProps } from "./DetailsForm"

/** B-17: Instant booking or Request to book (2 hours), cancellation policy, customer reminders, deposit (Phase 3, disabled). */
export function BookingSettingsForm(props: EditorProps) {
  const { hydrated, biz } = useBizRecord(props.businessId)
  if (!hydrated || !biz) return <FormSkeleton rows={4} />
  return <BookingInner key={biz.id} biz={biz} {...props} />
}

function BookingInner({ biz, onSaved, className }: EditorProps & { biz: Business }) {
  const updateBusiness = useStore((s) => s.updateBusiness)
  const [mode, setMode] = React.useState(biz.bookingMode)
  const [policy, setPolicy] = React.useState(biz.cancellationPolicy)
  const [custom, setCustom] = React.useState(biz.cancellationCustom ?? "")
  const [reminders, setReminders] = React.useState(biz.customerReminders)
  const [error, setError] = React.useState("")

  return (
    <form
      className={className ?? "space-y-6 px-4 pt-5"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        if (policy === "custom" && custom.trim().length < 10) return setError("Describe your cancellation policy in a sentence or two")
        setError("")
        updateBusiness(biz.id, { bookingMode: mode, cancellationPolicy: policy, cancellationCustom: policy === "custom" ? custom.trim() : undefined, customerReminders: reminders })
        toast("Booking settings saved")
        onSaved?.()
      }}
    >
      <fieldset className="min-w-0 space-y-2">
        <legend className="mb-2 t-heading">How bookings work</legend>
        <ChoiceCard name="bk-mode" value="instant" checked={mode === "instant"} onSelect={() => setMode("instant")} title="Instant booking" body="Customers pick a free time and it goes straight in your diary." />
        <ChoiceCard name="bk-mode" value="request" checked={mode === "request"} onSelect={() => setMode("request")} title="Request to book" body="You accept or decline each request. You have 2 hours to respond before it expires." />
      </fieldset>

      <fieldset className="min-w-0 space-y-2">
        <legend className="mb-2 t-heading">Cancellation policy</legend>
        <ChoiceCard name="bk-cancel" value="24h" checked={policy === "24h"} onSelect={() => setPolicy("24h")} title="Free until 24 hours before" body="Customers can cancel free up to a day before the job." />
        <ChoiceCard name="bk-cancel" value="48h" checked={policy === "48h"} onSelect={() => setPolicy("48h")} title="Free until 48 hours before" body="Better for longer jobs you plan around." />
        <ChoiceCard name="bk-cancel" value="custom" checked={policy === "custom"} onSelect={() => setPolicy("custom")} title="Custom" body="Write your own, shown on your listing and at checkout." />
        {policy === "custom" && (
          <Field label="Your policy" htmlFor="bk-custom" error={error}>
            <TextArea id="bk-custom" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={300} placeholder="e.g. Free until 12 hours before. After that we charge a £25 callout fee." aria-invalid={!!error} />
          </Field>
        )}
      </fieldset>

      <div className="card divide-y divide-line px-4">
        <ToggleRow label="Remind customers" description="Text and push 24 hours before each job" checked={reminders} onChange={setReminders} />
        <ToggleRow label="Take a deposit" description="Coming in Phase 3" checked={false} onChange={() => {}} disabled />
      </div>
      <SaveBar />
    </form>
  )
}
