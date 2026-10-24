"use client"
import * as React from "react"
import Link from "next/link"
import { Check, ExternalLink, X, CalendarClock } from "lucide-react"
import { AdminPage, KeyValues, Panel, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { DocViewer } from "@/components/admin/DocViewer"
import { slaLabel } from "@/components/admin/data"
import { DataGate } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { useStore } from "@/lib/store"
import { addDays, fmtDate, fmtDateYear, ms, MS_DAY } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Credential } from "@/lib/types"

const REGISTER: Record<Credential["type"], { label: string; href?: string }> = {
  gas_safe: { label: "Check the Gas Safe Register", href: "https://www.gassaferegister.co.uk/" },
  niceic: { label: "Check the NICEIC contractor search", href: "https://www.niceic.com/" },
  napit: { label: "Check the NAPIT member search", href: "https://www.napit.org.uk/" },
  dbs: { label: "Check the DBS Update Service", href: "https://www.gov.uk/dbs-update-service" },
  insurance: { label: "No public register: check the insurer's schedule" },
  qualification: { label: "Check with the awarding body" },
}

function ApproveCredential({ cred, name }: { cred: Credential; name: string }) {
  const [expiry, setExpiry] = React.useState(cred.expiresAt?.slice(0, 10) ?? "")
  return (
    <ReasonButton
      perm="credentials"
      size="md"
      variant="primary"
      label="Approve"
      icon={<Check aria-hidden />}
      showDenied
      title={`Approve ${cred.label.toLowerCase()} for ${name}?`}
      description="The matching badge shows on the listing straight away, until the expiry date."
      presets={["Checked on the register", "Certificate matches the business name"]}
      validate={() => (expiry && ms(`${expiry}T00:00:00.000Z`) < Date.parse("2000-01-01") ? "Enter a valid date." : null)}
      onConfirm={(reason) => {
        useStore.getState().adminDecide("credential", cred.id, "approve", reason, expiry ? { expiresAt: `${expiry}T00:00:00.000Z` } : {})
        toast(`${cred.label} approved`)
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Expiry date</span>
        <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={adminInput} />
      </label>
    </ReasonButton>
  )
}

function SetExpiry({ cred }: { cred: Credential }) {
  const [expiry, setExpiry] = React.useState(cred.expiresAt?.slice(0, 10) ?? "")
  return (
    <ReasonButton
      perm="credentials"
      size="md"
      label="Set expiry"
      icon={<CalendarClock aria-hidden />}
      title="Set expiry date"
      validate={() => (!expiry ? "Choose a date." : null)}
      onConfirm={(reason) => {
        useStore.getState().adminDecide("credential", cred.id, "set_expiry", reason, { expiresAt: `${expiry}T00:00:00.000Z` })
        toast("Expiry updated")
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="t-label text-navy">Expiry date</span>
        <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={adminInput} />
      </label>
    </ReasonButton>
  )
}

interface ExpRow {
  id: string
  business: string
  listingId: string
  label: string
  expiresAt: string
  days: number
  cred: Credential
}

const expColumns: ColumnDef<ExpRow>[] = [
  { accessorKey: "business", meta: { label: "Business" }, header: ({ column }) => <SortHeader label="Business" column={column} />, cell: ({ row }) => <Link href={`/admin/listings/${row.original.listingId}`} className="font-medium text-navy hover:text-blue hover:underline">{row.original.business}</Link> },
  { accessorKey: "label", meta: { label: "Credential" }, header: "Credential" },
  { accessorKey: "expiresAt", meta: { label: "Expires" }, header: ({ column }) => <SortHeader label="Expires" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.expiresAt)}</span> },
  { accessorKey: "days", meta: { label: "Days left" }, header: ({ column }) => <SortHeader label="Days left" column={column} />, cell: ({ row }) => <Pill tone={row.original.days <= 7 ? "bad" : "warn"}>{row.original.days} days</Pill> },
  { id: "actions", enableHiding: false, header: "", cell: ({ row }) => <SetExpiry cred={row.original.cred} /> },
]

/** A-07: Gas Safe, NICEIC/NAPIT, insurance and DBS submissions; register lookups; Approve, Reject, set expiry. */
export default function CredentialsQueue() {
  const s = useStore()
  const pending = s.credentials.filter((c) => c.status === "pending").sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  const [picked, setPicked] = React.useState<string | null>(null)
  const cred = pending.find((c) => c.id === picked) ?? pending[0]
  const biz = s.businesses.find((b) => b.id === cred?.businessId)
  const listing = s.listings.find((l) => l.id === biz?.listingId)
  const owner = biz ? s.members.find((m) => m.businessId === biz.id && m.role === "owner") : undefined
  const current = cred ? s.credentials.find((c) => c.businessId === cred.businessId && c.type === cred.type && c.status === "verified") : undefined
  const expiring: ExpRow[] = s.credentials
    .filter((c) => c.status === "verified" && c.expiresAt && ms(c.expiresAt) > ms(s.clock) && ms(c.expiresAt) <= ms(addDays(s.clock, 30)))
    .map((c) => {
      const b = s.businesses.find((x) => x.id === c.businessId)
      const l = s.listings.find((x) => x.id === b?.listingId)
      return { id: c.id, business: l?.name ?? "—", listingId: l?.id ?? "", label: c.label, expiresAt: c.expiresAt!, days: Math.ceil((ms(c.expiresAt!) - ms(s.clock)) / MS_DAY), cred: c }
    })

  return (
    <AdminPage id="A-07" title="Credentials queue" perm="credentials" description="Verified credentials become listing badges (Gas Safe, NICEIC, Insured, DBS) until they expire.">
      <DataGate isEmpty={pending.length === 0} empty={<EmptyState title="Queue clear" body="No credentials are waiting for a check." />}>
        <div className="grid grid-cols-[340px_1fr] gap-4">
          <ul className="space-y-2" aria-label="Pending credentials">
            {pending.map((c) => {
              const b = s.businesses.find((x) => x.id === c.businessId)
              const l = s.listings.find((x) => x.id === b?.listingId)
              const sla = slaLabel(c.submittedAt, s.clock)
              const active = c.id === cred?.id
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setPicked(c.id)} aria-current={active || undefined} className={cn("w-full rounded-xl border p-3 text-left", active ? "border-blue bg-blue-tint/60" : "border-line bg-white hover:border-blue/50")}>
                    <span className="block truncate t-label text-navy">{l?.name}</span>
                    <span className="block t-caption text-muted-ink">
                      {c.label} · {fmtDate(c.submittedAt)}
                    </span>
                    <span className={cn("t-caption", sla.overdue ? "text-red" : "text-amber-ink")}>{sla.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {cred && listing && (
            <Panel title={`${listing.name} · ${cred.label}`} action={<Link href={`/admin/listings/${listing.id}`} className="inline-flex min-h-11 items-center t-label text-blue hover:underline">Open listing</Link>}>
              <div className="grid grid-cols-[1fr_1.1fr] gap-5">
                <div>
                  <KeyValues
                    rows={[
                      ["Type", cred.label],
                      ["Number", cred.number || "—"],
                      ["Expires", cred.expiresAt ? fmtDateYear(cred.expiresAt) : "No expiry given"],
                      ["Submitted", fmtDate(cred.submittedAt)],
                      ["Owner", owner?.name ?? "—"],
                      ["Currently verified", current ? `Yes, expires ${current.expiresAt ? fmtDateYear(current.expiresAt) : "never"}` : "No"],
                    ]}
                  />
                  <p className="mt-4">
                    {REGISTER[cred.type].href ? (
                      <a href={REGISTER[cred.type].href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-1 t-label text-blue hover:underline">
                        {REGISTER[cred.type].label} <ExternalLink className="size-3.5" aria-hidden />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="t-label font-normal text-slate">{REGISTER[cred.type].label}</span>
                    )}
                  </p>
                  <div className="mt-4 flex flex-wrap items-start gap-2">
                    <ApproveCredential key={cred.id} cred={cred} name={listing.name} />
                    <ReasonButton
                      perm="credentials"
                      size="md"
                      variant="destructive"
                      label="Reject"
                      icon={<X aria-hidden />}
                      title={`Reject ${cred.label.toLowerCase()}?`}
                      description="The owner is told why and can upload a new certificate."
                      presets={["Not on the register", "Certificate has expired", "Name doesn't match the business", "Document is unreadable"]}
                      onConfirm={(reason) => {
                        useStore.getState().adminDecide("credential", cred.id, "reject", reason)
                        toast("Credential rejected. The owner has been told why.")
                      }}
                    />
                    <SetExpiry key={`${cred.id}-exp`} cred={cred} />
                  </div>
                </div>
                <DocViewer
                  kind={cred.label}
                  fileName={cred.fileUrl}
                  name={owner?.name ?? "Policy holder"}
                  business={listing.name}
                  address={listing.address}
                  date={cred.submittedAt}
                  lines={[
                    ["Number", cred.number || "—"],
                    ["Valid until", cred.expiresAt ? fmtDateYear(cred.expiresAt) : "—"],
                  ]}
                />
              </div>
            </Panel>
          )}
        </div>
      </DataGate>
      <h2 className="mb-3 mt-8 text-[19px] font-semibold text-navy">Expiring in 30 days</h2>
      <DataTable label="Credentials expiring in 30 days" data={expiring} columns={expColumns} getRowId={(r) => r.id} pageSize={8} initialSort={[{ id: "days", desc: false }]} searchPlaceholder="Search business" emptyTitle="Nothing expiring soon" emptyBody="No verified credentials expire in the next 30 days." />
    </AdminPage>
  )
}
