"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye } from "lucide-react"
import { Panel, Pill, ReasonButton, adminInput, userName } from "@/components/admin/kit"
import { SuperPage } from "@/components/admin/super/ui"
import { SegmentedControl } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"

const DURATIONS = [15, 30, 60]

function ViewAs() {
  const s = useStore()
  const router = useRouter()
  const [kind, setKind] = React.useState<"business" | "customer">("business")
  const businesses = s.businesses.map((b) => ({ id: b.id, label: s.listings.find((l) => l.id === b.listingId)?.name ?? b.tradingName, sub: s.members.filter((m) => m.businessId === b.id && m.joinedAt).map((m) => `${m.name} (${m.role})`).join(", ") })).sort((a, b) => a.label.localeCompare(b.label))
  const customers = s.customerProfiles
    .map((p) => s.users.find((u) => u.id === p.userId))
    .filter((u) => u && !u.deleted && !u.staffRole)
    .map((u) => ({ id: u!.id, label: `${u!.firstName} ${u!.lastName}`, sub: u!.phone }))
    .sort((a, b) => (a.id === "u-tayo" ? -1 : b.id === "u-tayo" ? 1 : a.label.localeCompare(b.label)))
  const options = kind === "business" ? businesses : customers
  const [target, setTarget] = React.useState("")
  const chosen = options.some((o) => o.id === target) ? target : options[0]?.id ?? ""
  const [minutes, setMinutes] = React.useState(30)
  const id = React.useId()
  const picked = options.find((o) => o.id === chosen)
  return (
    <Panel title="View as a customer or business">
      <p className="t-body text-slate">Opens the app as they see it, read only, under a banner. It ends when the time runs out on the demo clock or when you come back to the console. Every view is audited.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_160px]">
        <div>
          <p className="mb-1.5 t-label text-navy">View as</p>
          <SegmentedControl
            label="View as"
            value={kind}
            onChange={setKind}
            options={[
              { value: "business", label: "Business" },
              { value: "customer", label: "Customer" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="t-label text-navy" htmlFor={`${id}-t`}>
            {kind === "business" ? "Business" : "Customer"}
          </label>
          <select id={`${id}-t`} value={chosen} onChange={(e) => setTarget(e.target.value)} className={adminInput}>
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
                {o.sub ? ` · ${o.sub}` : ""}
              </option>
            ))}
          </select>
          {kind === "business" && <span className="t-caption text-muted-ink">Staff members of the business see the same screens.</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="t-label text-navy" htmlFor={`${id}-d`}>
            For
          </label>
          <select id={`${id}-d`} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={adminInput}>
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                {m === 60 ? "1 hour" : `${m} minutes`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4">
        <ReasonButton
          perm="support_view"
          variant="primary"
          size="md"
          label="View read-only"
          icon={<Eye aria-hidden />}
          disabled={!chosen}
          title={`View as ${picked?.label ?? ""}?`}
          description={`Read only for ${minutes === 60 ? "1 hour" : `${minutes} minutes`} on the demo clock. They aren't told; the view is recorded in the security log.`}
          confirmLabel="Open read-only"
          presets={kind === "business" ? ["Owner called about their inbox", "Checking desk settings for a ticket", "Billing question"] : ["Customer can't see a booking", "Investigating a report", "Data request check"]}
          onConfirm={(reason) => {
            const ok = useStore.getState().startImpersonation(kind, chosen, minutes, reason)
            if (!ok) return toast("Couldn't start the view")
            router.push(kind === "business" ? "/app/biz" : "/app")
          }}
        />
      </div>
    </Panel>
  )
}

function DataRequests() {
  const s = useStore()
  const rows = [...s.dataRequests].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0) || b.requestedAt.localeCompare(a.requestedAt))
  return (
    <Panel title="Data requests (UK GDPR)" action={<span className="t-caption text-muted-ink">Answer within one month</span>}>
      <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
        <caption className="sr-only">Data export and deletion requests</caption>
        <thead>
          <tr className="border-b border-line text-left text-navy">
            <th className="py-2 font-semibold">Customer</th>
            <th className="py-2 font-semibold">Request</th>
            <th className="py-2 font-semibold">Received</th>
            <th className="py-2 font-semibold">Status</th>
            <th className="py-2">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const name = userName(s.users, r.userId)
            return (
              <tr key={r.id} className="border-b border-line align-top last:border-0">
                <td className="py-2.5 font-medium text-navy">{name}</td>
                <td className="py-2.5">{r.kind === "export" ? "Export my data" : "Delete my account"}</td>
                <td className="py-2.5 tnum">{fmtDate(r.requestedAt)}</td>
                <td className="py-2.5">
                  {r.status === "pending" ? <Pill tone="warn">Waiting</Pill> : r.status === "approved" ? <Pill tone="good">{r.kind === "export" ? "Sent" : "Deleted"}</Pill> : <Pill tone="bad">Rejected</Pill>}
                  {r.decidedAt && <span className="block t-caption text-muted-ink">{fmtDate(r.decidedAt)} by {userName(s.users, r.decidedBy)}</span>}
                </td>
                <td className="py-2.5">
                  {r.status === "pending" && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <ReasonButton
                        perm="customers"
                        label="Approve"
                        variant={r.kind === "delete" ? "destructive" : "tint"}
                        title={r.kind === "export" ? `Send ${name} their data?` : `Delete ${name}'s account and data?`}
                        description={r.kind === "export" ? "We email them a download link that lasts 7 days." : "This can't be undone. Upcoming bookings are cancelled and the businesses told."}
                        confirmLabel={r.kind === "export" ? "Approve export" : "Delete account"}
                        destructive={r.kind === "delete"}
                        presets={["Identity confirmed by email", "Identity confirmed by phone"]}
                        onConfirm={(reason) => {
                          useStore.getState().decideDataRequest(r.id, true, reason)
                          toast(r.kind === "export" ? "Export sent" : "Account deleted")
                        }}
                      />
                      <ReasonButton
                        perm="customers"
                        label="Reject"
                        variant="ghost"
                        title={`Reject ${name}'s request?`}
                        description="Tell them why in the reason; we email it to them."
                        confirmLabel="Reject request"
                        presets={["We couldn't confirm your identity", "Request is a duplicate"]}
                        onConfirm={(reason) => {
                          useStore.getState().decideDataRequest(r.id, false, reason)
                          toast("Request rejected")
                        }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}

/** S-09: view as any customer or business (time-limited, read only, audited, with a banner); GDPR export and deletion requests. */
export default function ImpersonatePage() {
  const s = useStore()
  const recent = s.audit.filter((a) => a.action.startsWith("impersonate.") || a.action === "tenant.view_as_support").slice(0, 8)
  return (
    <SuperPage id="S-09" title="Impersonate and data requests" description="See exactly what a customer or business sees, without changing anything, and handle data requests.">
      <ViewAs />
      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <DataRequests />
        <Panel title="Recent views" action={<Link href="/admin/super/security" className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Security log</Link>}>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((a) => (
                <li key={a.id} className="py-2 text-[13.5px]">
                  <span className="block text-navy">
                    <span className="font-medium">{userName(s.users, a.actorId)}</span> <span className="font-mono text-[12.5px] text-slate">{a.action}</span> {a.targetType === "business" ? s.listings.find((l) => l.businessId === a.targetId)?.name ?? a.targetId : userName(s.users, a.targetId)}
                  </span>
                  <span className="block t-caption text-muted-ink">
                    {fmtDate(a.at)}, {fmtTime(a.at)} · {a.reason}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-slate">No one has viewed as a customer or business yet.</p>
          )}
        </Panel>
      </div>
    </SuperPage>
  )
}
