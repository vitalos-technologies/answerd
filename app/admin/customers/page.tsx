"use client"
import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Download, Trash2, UserX, UserCheck } from "lucide-react"
import { AdminPage, KeyValues, Panel, Pill, ReasonButton, download } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { withSuspense } from "@/components/app/helpers"
import { StatusPill } from "@/components/answerd/Status"
import { useStore } from "@/lib/store"
import { bookingTitle } from "@/lib/selectors"
import { fmtDate, fmtTime } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { User } from "@/lib/types"

interface Row {
  id: string
  name: string
  phone: string
  email: string
  joined: string
  bookings: number
  noShows: number
  reports: number
  status: string
  user: User
}

/** A-10: search customers by phone or name; profile, bookings, reports; Suspend; data export and deletion requests. */
function AdminCustomers() {
  const s = useStore()
  const params = useSearchParams()
  const [selected, setSelected] = React.useState<string | null>(null)
  const staffIds = new Set(s.users.filter((u) => u.staffRole).map((u) => u.id))
  const rows: Row[] = s.users
    .filter((u) => !staffIds.has(u.id))
    .map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim() || "No name",
      phone: u.phone,
      email: u.email ?? "",
      joined: u.createdAt,
      bookings: s.bookings.filter((b) => b.customerId === u.id).length,
      noShows: s.customerProfiles.find((p) => p.userId === u.id)?.noShowCount ?? 0,
      reports: s.reports.filter((r) => r.target === "user" && r.targetId === u.id).length,
      status: u.deleted ? "Deleted" : u.suspended ? "Suspended" : "Active",
      user: u,
    }))
  const sel = s.users.find((u) => u.id === selected)
  const selBookings = sel ? s.bookings.filter((b) => b.customerId === sel.id).sort((a, b) => b.startAt.localeCompare(a.startAt)) : []
  const selReports = sel ? s.reports.filter((r) => r.reporterId === sel.id || (r.target === "user" && r.targetId === sel.id)) : []
  const requests = [
    ...s.tickets.filter((t) => /data|delet|export|gdpr|privacy/i.test(`${t.subject} ${t.body}`)).map((t) => ({ id: t.id, userId: t.userId, kind: /delet/i.test(`${t.subject} ${t.body}`) ? "Deletion" : "Export", at: t.at, status: "Open", note: t.subject })),
    ...s.users.filter((u) => u.deleted && !u.staffRole).map((u) => ({ id: `del-${u.id}`, userId: u.id, kind: "Deletion", at: u.createdAt, status: "Completed", note: "Deleted from the app (C-47)" })),
  ]

  const exportData = (u: User, reason: string) => {
    const st = useStore.getState()
    const data = {
      user: u,
      profile: st.customerProfiles.find((p) => p.userId === u.id),
      bookings: st.bookings.filter((b) => b.customerId === u.id),
      reviews: st.reviews.filter((r) => r.customerId === u.id),
      threads: st.threads.filter((t) => t.customerId === u.id),
      messages: st.messages.filter((m) => st.threads.some((t) => t.id === m.threadId && t.customerId === u.id)),
      notifications: st.notifications.filter((n) => n.userId === u.id),
    }
    download(`answerd-export-${u.id}.json`, JSON.stringify(data, null, 2), "application/json")
    st.adminAudit("customer.export", "customer", u.id, reason)
    toast("Export downloaded")
  }

  const columns: ColumnDef<Row>[] = [
    {
      accessorKey: "name",
      meta: { label: "Name" },
      enableHiding: false,
      header: ({ column }) => <SortHeader label="Name" column={column} />,
      cell: ({ row }) => (
        <button type="button" onClick={() => setSelected(row.original.id)} className="min-h-9 font-medium text-navy hover:text-blue hover:underline">
          {row.original.name}
        </button>
      ),
    },
    { accessorKey: "phone", meta: { label: "Phone" }, header: "Phone", cell: ({ row }) => <span className="tnum">{row.original.phone || "—"}</span> },
    { accessorKey: "email", meta: { label: "Email" }, header: "Email" },
    { accessorKey: "joined", meta: { label: "Joined" }, header: ({ column }) => <SortHeader label="Joined" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDate(row.original.joined)}</span> },
    { accessorKey: "bookings", meta: { label: "Bookings" }, header: ({ column }) => <SortHeader label="Bookings" column={column} />, cell: ({ row }) => <span className="tnum">{row.original.bookings}</span> },
    { accessorKey: "noShows", meta: { label: "No-shows" }, header: ({ column }) => <SortHeader label="No-shows" column={column} />, cell: ({ row }) => (row.original.noShows >= 2 ? <Pill tone="bad">{row.original.noShows} · flagged</Pill> : <span className="tnum">{row.original.noShows}</span>) },
    { accessorKey: "reports", meta: { label: "Reports" }, header: "Reports" },
    { accessorKey: "status", meta: { label: "Status" }, header: "Status", cell: ({ row }) => <Pill tone={row.original.status === "Active" ? "good" : "bad"}>{row.original.status}</Pill> },
  ]

  return (
    <AdminPage id="A-10" title="Customers" perm="customers" description="Search by phone or name. Repeated no-shows are flagged.">
      {sel && (
        <Panel
          className="mb-4"
          title={
            <span className="flex items-center gap-2">
              {sel.firstName} {sel.lastName} <Pill tone={sel.deleted ? "bad" : sel.suspended ? "bad" : "good"}>{sel.deleted ? "Deleted" : sel.suspended ? "Suspended" : "Active"}</Pill>
            </span>
          }
          action={
            <div className="flex flex-wrap gap-2">
              {!sel.deleted &&
                (sel.suspended ? (
                  <ReasonButton perm="customers" label="Unsuspend" icon={<UserCheck aria-hidden />} title={`Unsuspend ${sel.firstName}?`} onConfirm={(r) => { useStore.getState().adminDecide("customer", sel.id, "unsuspend", r); toast(`${sel.firstName} unsuspended`) }} />
                ) : (
                  <ReasonButton perm="customers" label="Suspend" variant="destructive" icon={<UserX aria-hidden />} title={`Suspend ${sel.firstName}?`} description="They can't message, book or review until unsuspended." presets={["Repeated no-shows", "Abusive messages", "Fraud check"]} onConfirm={(r) => { useStore.getState().adminDecide("customer", sel.id, "suspend", r); toast(`${sel.firstName} suspended`) }} />
                ))}
              <ReasonButton perm="customers" label="Export data" icon={<Download aria-hidden />} title={`Export ${sel.firstName}'s data`} description="Downloads everything we hold as JSON for a subject access request." confirmLabel="Download" presets={["Subject access request"]} onConfirm={(r) => exportData(sel, r)} />
              {!sel.deleted && (
                <ReasonButton perm="customers" label="Delete account" variant="destructive" icon={<Trash2 aria-hidden />} title={`Delete ${sel.firstName}'s account?`} description="Future bookings are cancelled with notice. Reviews stay anonymised." confirmLabel="Delete account" presets={["Deletion request by email"]} onConfirm={(r) => { useStore.getState().adminDeleteCustomer(sel.id, r); toast("Account deleted") }} />
              )}
              <button type="button" onClick={() => setSelected(null)} className="min-h-10 rounded-full px-3 t-label text-blue hover:underline">
                Close
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-[280px_1fr_1fr] gap-6">
            <KeyValues rows={[["Phone", sel.phone || "—"], ["Email", sel.email ?? "—"], ["Signs in with", sel.authProviders.join(", ")], ["Joined", fmtDate(sel.createdAt)], ["Marketing", sel.marketingConsent ? "Opted in" : "Off"]]} />
            <div>
              <h3 className="mb-2 t-label text-navy">Bookings ({selBookings.length})</h3>
              <ul className="space-y-1.5 text-[13px]">
                {selBookings.slice(0, 5).map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate">
                      {bookingTitle(s, b)} · {s.listings.find((l) => l.id === b.listingId)?.name} · {fmtDate(b.startAt)} {fmtTime(b.startAt)}
                    </span>
                    <StatusPill status={b.status} />
                  </li>
                ))}
                {!selBookings.length && <li className="text-muted-ink">No bookings.</li>}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 t-label text-navy">Reports ({selReports.length})</h3>
              <ul className="space-y-1.5 text-[13px]">
                {selReports.map((r) => (
                  <li key={r.id}>
                    {r.reporterId === sel.id ? "Reported" : "Reported by someone"}: {r.reason} · {r.status}
                  </li>
                ))}
                {!selReports.length && <li className="text-muted-ink">No reports.</li>}
              </ul>
            </div>
          </div>
        </Panel>
      )}
      <DataTable
        key={params.get("q") ?? ""}
        label="Customers"
        data={rows}
        columns={columns}
        getRowId={(r) => r.id}
        initialSearch={params.get("q") ?? ""}
        searchPlaceholder="Search by phone or name"
        searchKey={(r) => `${r.name} ${r.phone} ${r.phone.replace(/\s/g, "")} ${r.email}`}
        initialSort={[{ id: "joined", desc: true }]}
        initialHidden={{ email: false }}
        facets={[{ column: "status", label: "Status", options: ["Active", "Suspended", "Deleted"].map((v) => ({ value: v, label: v })) }]}
        emptyTitle="No customers found"
        emptyBody="Try a different phone number or name."
      />
      <h2 className="mb-3 mt-8 text-[19px] font-semibold text-navy">Data export and deletion requests</h2>
      <Panel>
        {requests.length ? (
          <ul className="divide-y divide-line text-[13.5px]">
            {requests.map((r) => {
              const u = s.users.find((x) => x.id === r.userId)
              return (
                <li key={r.id} className="flex min-h-12 items-center gap-3 py-2">
                  <Pill tone={r.kind === "Deletion" ? "bad" : "info"}>{r.kind}</Pill>
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-navy">{u ? `${u.firstName} ${u.lastName}` : "Guest"}</span> · {r.note} · {fmtDate(r.at)}
                  </span>
                  <Pill tone={r.status === "Completed" ? "good" : "warn"}>{r.status}</Pill>
                  {u && r.status === "Open" && (
                    <button type="button" onClick={() => setSelected(u.id)} className="min-h-10 rounded-full px-3 t-label text-blue hover:underline">
                      Open profile
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="t-label font-normal text-muted-ink">No open requests. Requests sent from Help or Privacy and data show here, and accounts deleted in the app are listed as completed.</p>
        )}
      </Panel>
    </AdminPage>
  )
}

export default withSuspense(AdminCustomers)
