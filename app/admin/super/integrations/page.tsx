"use client"
import * as React from "react"
import { CheckCircle2, EyeOff, RefreshCw, RotateCw } from "lucide-react"
import { Kpi, Panel, Pill, ReasonButton } from "@/components/admin/kit"
import { SuperPage } from "@/components/admin/super/ui"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { fmtDate, fmtDateYear, fmtTime, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"

const ROTATE_AFTER_DAYS = 90

/** S-08: status, last error, owner and last-rotated date for every integration. Secrets are never shown. */
export default function Integrations() {
  const s = useStore()
  const list = s.settings.integrations ?? []
  const [checked, setChecked] = React.useState<string | null>(null)
  const age = (iso: string) => Math.floor((ms(s.clock) - ms(iso)) / MS_DAY)
  const due = list.filter((i) => age(i.lastRotatedAt) >= ROTATE_AFTER_DAYS)
  return (
    <SuperPage
      id="S-08"
      title="Integrations"
      description="Who owns each connection and how healthy it is. Keys live in the secrets store: this console can rotate them but never shows them."
      actions={
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setChecked(s.clock)
            toast(`Health check done: ${list.filter((i) => i.status === "ok").length} of ${list.length} healthy`)
          }}
        >
          <RefreshCw aria-hidden /> Run health check
        </Button>
      }
    >
      <div className="mb-4 grid grid-cols-4 gap-3">
        <Kpi label="Healthy" value={`${list.filter((i) => i.status === "ok").length} of ${list.length}`} sub={checked ? `Checked ${fmtTime(checked)}` : "From the last automatic check"} />
        <Kpi label="Degraded" value={list.filter((i) => i.status === "degraded").length} tone={list.some((i) => i.status === "degraded") ? "warn" : "plain"} sub="Working with errors" />
        <Kpi label="Down" value={list.filter((i) => i.status === "down").length} tone={list.some((i) => i.status === "down") ? "bad" : "plain"} sub="Not working" />
        <Kpi label="Keys due a rotation" value={due.length} tone={due.length ? "warn" : "plain"} sub={`Older than ${ROTATE_AFTER_DAYS} days`} />
      </div>
      <Panel title="Connections">
        <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
          <caption className="sr-only">Integrations</caption>
          <thead>
            <tr className="border-b border-line text-left text-navy">
              <th className="py-2 font-semibold">Integration</th>
              <th className="py-2 font-semibold">Status</th>
              <th className="py-2 font-semibold">Last error</th>
              <th className="py-2 font-semibold">Owner</th>
              <th className="py-2 font-semibold">Secret</th>
              <th className="py-2 font-semibold">Last rotated</th>
              <th className="py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((i) => {
              const days = age(i.lastRotatedAt)
              return (
                <tr key={i.id} className="border-b border-line align-top last:border-0">
                  <td className="py-2.5">
                    <span className="block font-medium text-navy">{i.name}</span>
                    <span className="block t-caption text-muted-ink">{i.purpose}</span>
                  </td>
                  <td className="py-2.5">
                    <Pill tone={i.status === "ok" ? "good" : i.status === "degraded" ? "warn" : "bad"} icon={i.status === "ok" ? <CheckCircle2 aria-hidden /> : undefined}>
                      {i.status === "ok" ? "Healthy" : i.status === "degraded" ? "Degraded" : "Down"}
                    </Pill>
                  </td>
                  <td className="max-w-[260px] py-2.5">
                    {i.lastError ? (
                      <>
                        <span className="block text-navy">{i.lastError}</span>
                        <span className="block t-caption text-muted-ink">{i.lastErrorAt ? `${fmtDate(i.lastErrorAt)}, ${fmtTime(i.lastErrorAt)}` : ""}</span>
                      </>
                    ) : (
                      <span className="text-muted-ink">None in 30 days</span>
                    )}
                  </td>
                  <td className="py-2.5 text-navy">{i.owner}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12.5px] text-slate">
                      <EyeOff className="size-3.5" aria-hidden /> •••••••• <span className="sr-only">hidden</span>
                    </span>
                    <span className="block t-caption text-muted-ink">Never shown</span>
                  </td>
                  <td className="whitespace-nowrap py-2.5 tnum">
                    {fmtDateYear(i.lastRotatedAt)}
                    <span className="block">{days >= ROTATE_AFTER_DAYS ? <Pill tone="warn">Due</Pill> : <span className="t-caption text-muted-ink">{days} days ago</span>}</span>
                  </td>
                  <td className="py-2.5 text-right">
                    <ReasonButton
                      perm="settings"
                      label="Rotate"
                      icon={<RotateCw aria-hidden />}
                      title={`Rotate the ${i.name} key?`}
                      description="A new key is issued to the secrets store and the old one stops working in 10 minutes. Nobody sees either key."
                      confirmLabel="Rotate key"
                      presets={["Scheduled rotation", "Staff member left", "Suspected leak"]}
                      onConfirm={(r) => {
                        useStore.getState().rotateSecret(i.id, r)
                        toast(`${i.name} key rotated`)
                      }}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>
    </SuperPage>
  )
}
