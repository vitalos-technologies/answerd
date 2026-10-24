"use client"
import * as React from "react"
import { Button } from "@/components/answerd/Button"
import { Field, SelectInput, TextArea, ToggleRow, CheckRow } from "@/components/answerd/Fields"
import { useStore } from "@/lib/store"
import { deskFor } from "@/lib/selectors"
import { fmtClock } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { DeskConfig } from "@/lib/types"

const TIMES = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`)

/**
 * B-35 handoff rules and quiet hours, prefilled from the spec: always hand over emergencies, complaints,
 * price negotiation and named requests. Used on its own screen, inside B-31 step 4 and in the W-17 Handoff tab.
 */
export function HandoffRulesEditor({ businessId, onSaved, saveLabel = "Save", readOnly }: { businessId: string; onSaved?: () => void; saveLabel?: string; readOnly?: boolean }) {
  const s = useStore()
  const desk = deskFor(s, businessId)
  const owner = s.members.find((m) => m.businessId === businessId && m.role === "owner")?.name.split(" ")[0] ?? "the owner"
  const staff = s.members.filter((m) => m.businessId === businessId && m.role === "staff" && m.joinedAt)
  const [rules, setRules] = React.useState<DeskConfig["handoffRules"]>(() => desk?.handoffRules ?? { emergencies: true, complaints: true, priceNegotiation: true, namedRequests: true, custom: "" })
  const [quiet, setQuiet] = React.useState<DeskConfig["quietHours"]>(() => desk?.quietHours ?? { enabled: true, from: "21:00", to: "07:00" })
  const [alertStaff, setAlertStaff] = React.useState(() => !!desk?.alertWho.includes("staff"))
  if (!desk) return null

  const save = () => {
    s.updateDeskConfig(businessId, { handoffRules: { ...rules, emergencies: true, custom: rules.custom.trim() }, quietHours: quiet, alertWho: alertStaff ? ["owner", "staff"] : ["owner"] })
    toast("Handoff rules saved")
    onSaved?.()
  }

  return (
    <fieldset disabled={readOnly} className="min-w-0 space-y-4">
      <div className="card px-4 py-2">
        <p className="pt-2 t-subhead">Always hand over</p>
        <p className="t-caption text-muted-ink">The desk tells the customer &ldquo;I&apos;ll get {owner} to call you back within the hour&rdquo; and alerts you by push and SMS.</p>
        <div className="divide-y divide-line">
          <ToggleRow label="Emergencies" description="Always on. Safety advice first, then it alerts you at once and books nothing." checked onChange={() => toast("Emergencies always go to you")} disabled />
          <ToggleRow label="Complaints" description="Unhappy customers, refunds, problems with a job" checked={rules.complaints} onChange={(v) => setRules((r) => ({ ...r, complaints: v }))} />
          <ToggleRow label="Price negotiation" description="Discounts, cash prices, anything outside your listed prices" checked={rules.priceNegotiation} onChange={(v) => setRules((r) => ({ ...r, priceNegotiation: v }))} />
          <ToggleRow label="Named requests" description={`Callers who ask for ${owner} by name`} checked={rules.namedRequests} onChange={(v) => setRules((r) => ({ ...r, namedRequests: v }))} />
        </div>
        <Field label="Anything else" htmlFor="custom-rule" optional hint="For example: jobs over £1,000, commercial work" className="pb-3 pt-2">
          <TextArea id="custom-rule" value={rules.custom} onChange={(e) => setRules((r) => ({ ...r, custom: e.target.value }))} className="min-h-16" placeholder="Hand over when…" />
        </Field>
      </div>

      <div className="card px-4 py-2">
        <ToggleRow label="Quiet hours" description="The desk still answers, but alerts wait until the morning unless it's an emergency" checked={quiet.enabled} onChange={(v) => setQuiet((q) => ({ ...q, enabled: v }))} />
        {quiet.enabled && (
          <div className="grid grid-cols-2 gap-3 pb-3">
            <Field label="From" htmlFor="quiet-from">
              <SelectInput id="quiet-from" value={quiet.from} onChange={(e) => setQuiet((q) => ({ ...q, from: e.target.value }))}>
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {fmtClock(t)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="To" htmlFor="quiet-to">
              <SelectInput id="quiet-to" value={quiet.to} onChange={(e) => setQuiet((q) => ({ ...q, to: e.target.value }))}>
                {TIMES.map((t) => (
                  <option key={t} value={t}>
                    {fmtClock(t)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        )}
      </div>

      <div className="card px-4 py-3">
        <p className="t-subhead">Who gets alerts</p>
        <CheckRow label={`${owner} (owner)`} description="Always alerted" checked onChange={() => toast("The owner always gets alerts")} />
        <CheckRow label="Staff" description={staff.length ? staff.map((m) => m.name).join(", ") : "No staff yet. Invite them in Team."} checked={alertStaff} onChange={setAlertStaff} />
      </div>

      {!readOnly && (
        <Button block onClick={save}>
          {saveLabel}
        </Button>
      )}
    </fieldset>
  )
}
