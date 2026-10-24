"use client"
import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Check, Clock, MessageSquareMore, X } from "lucide-react"
import { AdminPage, KeyValues, Panel, Pill, ReasonButton, userName } from "@/components/admin/kit"
import { DocViewer } from "@/components/admin/DocViewer"
import { slaLabel } from "@/components/admin/data"
import { DataGate, withSuspense } from "@/components/app/helpers"
import { EmptyState } from "@/components/answerd/Feedback"
import { SegmentedControl } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { fmtDate, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"
import type { Claim } from "@/lib/types"

const OPEN: Claim["status"][] = ["pending", "disputed", "more_info"]
const STATUS_LABEL: Record<Claim["status"], string> = { started: "Started", pending: "Pending", approved: "Approved", rejected: "Rejected", disputed: "Dispute", more_info: "More info asked" }
const STATUS_TONE = { started: "plain", pending: "warn", approved: "good", rejected: "bad", disputed: "bad", more_info: "info" } as const

/** A-06: pending document claims and disputes with a document viewer; Approve, Reject (reason), Ask for more. */
function ClaimsQueue() {
  const s = useStore()
  const params = useSearchParams()
  const [tab, setTab] = React.useState<"open" | "decided">("open")
  const list = s.claims
    .filter((c) => (tab === "open" ? OPEN.includes(c.status) : ["approved", "rejected"].includes(c.status) && c.method === "document"))
    .sort((a, b) => (tab === "open" ? a.createdAt.localeCompare(b.createdAt) : (b.decidedAt ?? b.createdAt).localeCompare(a.decidedAt ?? a.createdAt)))
  const [picked, setPicked] = React.useState<string | null>(params.get("id"))
  const claim = list.find((c) => c.id === picked) ?? list[0]
  const listing = s.listings.find((l) => l.id === claim?.listingId)
  const claimant = s.users.find((u) => u.id === claim?.userId)
  const biz = s.businesses.find((b) => b.listingId === listing?.id)
  const owner = biz ? s.members.find((m) => m.businessId === biz.id && m.role === "owner") : undefined
  const isOpen = claim && OPEN.includes(claim.status)

  const decide = (decision: "approve" | "reject" | "more_info", msg: string) => (reason: string) => {
    if (!claim) return
    useStore.getState().adminDecide("claim", claim.id, decision, reason)
    toast(msg)
  }

  return (
    <AdminPage id="A-06" title="Claims queue" perm="claims" description="Document claims and ownership disputes. Aim to decide within 1 working day.">
      <SegmentedControl
        label="Queue"
        className="mb-4 w-[320px]"
        value={tab}
        onChange={(v) => {
          setTab(v)
          setPicked(null)
        }}
        options={[
          { value: "open", label: `Open (${s.claims.filter((c) => OPEN.includes(c.status)).length})` },
          { value: "decided", label: "Decided" },
        ]}
      />
      <DataGate isEmpty={list.length === 0} empty={<EmptyState title={tab === "open" ? "Queue clear" : "Nothing decided yet"} body={tab === "open" ? "No document claims or disputes are waiting." : "Approved and rejected document claims show here."} />}>
        <div className="grid grid-cols-[340px_1fr] gap-4">
          <ul className="space-y-2" aria-label="Claims">
            {list.map((c) => {
              const l = s.listings.find((x) => x.id === c.listingId)
              const sla = slaLabel(c.createdAt, s.clock)
              const active = c.id === claim?.id
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(c.id)}
                    aria-current={active || undefined}
                    className={cn("w-full rounded-xl border p-3 text-left transition-colors", active ? "border-blue bg-blue-tint/60" : "border-line bg-white hover:border-blue/50")}
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate t-label text-navy">{l?.name}</span>
                      <Pill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Pill>
                    </span>
                    <span className="mt-0.5 block t-caption text-muted-ink">
                      {userName(s.users, c.userId)} · {c.evidenceKind ?? c.method} · {fmtDate(c.createdAt)}
                    </span>
                    {OPEN.includes(c.status) && (
                      <span className={cn("mt-1 inline-flex items-center gap-1 t-caption", sla.overdue ? "text-red" : "text-amber-ink")}>
                        <Clock className="size-3.5" aria-hidden /> {sla.label}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {claim && listing && (
            <div className="space-y-4">
              <Panel
                title={
                  <span className="flex items-center gap-2">
                    {listing.name} <Pill tone={STATUS_TONE[claim.status]}>{STATUS_LABEL[claim.status]}</Pill>
                  </span>
                }
                action={
                  <Link href={`/admin/listings/${listing.id}`} className="inline-flex min-h-11 items-center t-label text-blue hover:underline">
                    Open listing
                  </Link>
                }
              >
                <div className="grid grid-cols-[1fr_1.1fr] gap-5">
                  <div>
                    <KeyValues
                      rows={[
                        ["Claimant", `${claimant ? `${claimant.firstName} ${claimant.lastName}` : "Unknown"}${claimant?.phone ? ` · ${claimant.phone}` : ""}`],
                        ["Method", claim.status === "disputed" ? "Dispute with evidence" : claim.method === "document" ? "Document upload" : claim.method],
                        ["Evidence", claim.evidenceKind ?? "—"],
                        ["Submitted", `${fmtDate(claim.createdAt)}, ${fmtTime(claim.createdAt)}`],
                        ["Listing", `${listing.address} · ${listing.phonePublic}`],
                        ...(claim.status === "disputed" ? ([["Current owner", owner?.name ?? "—"]] as [string, string][]) : []),
                        ...(claim.details ? ([["Their note", claim.details]] as [string, string][]) : []),
                        ...(claim.reason ? ([["Last decision", `${claim.reason}${claim.decidedBy ? ` (${userName(s.users, claim.decidedBy)})` : ""}`]] as [string, string][]) : []),
                      ]}
                    />
                    {isOpen && (
                      <div className="mt-5 flex flex-wrap items-start gap-2">
                        <ReasonButton
                          perm="claims"
                          size="md"
                          variant="primary"
                          label="Approve"
                          icon={<Check aria-hidden />}
                          showDenied
                          title={claim.status === "disputed" ? `Transfer ${listing.name} to ${claimant?.firstName}?` : `Approve ${listing.name}?`}
                          description={claim.status === "disputed" ? "The disputer becomes the owner. The current owner loses access." : "The business goes live and the owner gets a verified notice."}
                          presets={["Name and address match the listing", "Document checked against Companies House"]}
                          onConfirm={decide("approve", `${listing.name} approved`)}
                        />
                        <ReasonButton
                          perm="claims"
                          size="md"
                          variant="destructive"
                          label="Reject"
                          icon={<X aria-hidden />}
                          title={`Reject the claim for ${listing.name}?`}
                          description="The claimant is told why and can upload again."
                          presets={["Name on the document doesn't match", "Document is older than 3 months", "Address doesn't match the listing", "Document is unreadable"]}
                          onConfirm={decide("reject", "Claim rejected. The owner has been told why.")}
                        />
                        <ReasonButton
                          perm="claims"
                          size="md"
                          label="Ask for more"
                          icon={<MessageSquareMore aria-hidden />}
                          title="Ask for more evidence"
                          description="We send this to the claimant as written."
                          confirmLabel="Send request"
                          presets={["Please upload a utility bill or bank letter from the last 3 months in the business name.", "Please send a photo of the document showing the full address."]}
                          onConfirm={decide("more_info", "Request sent")}
                        />
                      </div>
                    )}
                  </div>
                  <DocViewer
                    kind={claim.evidenceKind ?? "Document"}
                    fileName={claim.evidenceUrl}
                    name={claimant ? `${claimant.firstName} ${claimant.lastName}` : "Account holder"}
                    business={listing.name}
                    address={listing.address}
                    date={claim.createdAt}
                    lines={[
                      ["Reference", claim.id.toUpperCase()],
                      ["Account", listing.name],
                      ["Postcode", listing.postcode],
                    ]}
                  />
                </div>
              </Panel>
            </div>
          )}
        </div>
      </DataGate>
    </AdminPage>
  )
}

export default withSuspense(ClaimsQueue)
