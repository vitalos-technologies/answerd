"use client"
import * as React from "react"
import { UserPlus } from "lucide-react"
import { AdminPage, Pill, ReasonButton, adminInput } from "@/components/admin/kit"
import { DataTable, SortHeader, type ColumnDef } from "@/components/admin/DataTable"
import { useStore } from "@/lib/store"
import { fmtDateYear } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { User } from "@/lib/types"

function Invite() {
  const [first, setFirst] = React.useState("")
  const [last, setLast] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<"admin" | "support">("support")
  const users = useStore((s) => s.users)
  return (
    <ReasonButton
      perm="users"
      size="md"
      variant="primary"
      label="Invite"
      icon={<UserPlus aria-hidden />}
      title="Invite an admin user"
      description="They sign in with their vitalos.co.uk Google account and an authenticator app."
      confirmLabel="Send invite"
      presets={["New support starter", "New ops lead"]}
      validate={() => {
        if (!first.trim()) return "Enter a first name."
        if (!/^[^@\s]+@vitalos\.co\.uk$/i.test(email.trim())) return "Use a vitalos.co.uk email address."
        if (users.some((u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.staffRole)) return "That person is already an admin user."
        return null
      }}
      onConfirm={(reason) => {
        useStore.getState().adminStaff("invite", { firstName: first.trim(), lastName: last.trim(), email: email.trim().toLowerCase(), role }, reason)
        toast(`Invite sent to ${email.trim()}`)
        setFirst("")
        setLast("")
        setEmail("")
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="t-label text-navy">First name</span>
          <input value={first} onChange={(e) => setFirst(e.target.value)} className={adminInput} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="t-label text-navy">Last name</span>
          <input value={last} onChange={(e) => setLast(e.target.value)} className={adminInput} />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="t-label text-navy">Work email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@vitalos.co.uk" className={adminInput} />
        </label>
        <fieldset className="col-span-2">
          <legend className="t-label text-navy">Role</legend>
          <div className="mt-1 flex gap-4">
            {(["support", "admin"] as const).map((r) => (
              <label key={r} className="inline-flex min-h-11 items-center gap-2 t-label font-normal text-navy">
                <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="size-4 accent-blue" />
                {r === "admin" ? "Admin: full access" : "Support: read-only, reviews"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </ReasonButton>
  )
}

/** A-21: staff with role Admin or Support; invite, remove. */
export default function AdminUsers() {
  const s = useStore()
  const me = s.session.userId
  const staff = s.users.filter((u) => u.staffRole)
  const columns: ColumnDef<User>[] = [
    { id: "name", accessorFn: (u) => `${u.firstName} ${u.lastName}`, meta: { label: "Name" }, header: ({ column }) => <SortHeader label="Name" column={column} />, cell: ({ row }) => <span className="font-medium text-navy">{row.original.firstName} {row.original.lastName}{row.original.id === me ? " (you)" : ""}</span> },
    { accessorKey: "email", meta: { label: "Email" }, header: "Email" },
    { accessorKey: "staffRole", meta: { label: "Role" }, header: "Role", cell: ({ row }) => <Pill tone={row.original.staffRole === "admin" ? "navy" : "warn"}>{row.original.staffRole === "admin" ? "Admin" : "Support"}</Pill> },
    { id: "status", accessorFn: (u) => (u.authProviders.length && !s.audit.some((a) => a.action === "admin_user.invite" && a.targetId === u.id) ? "Active" : "Invited"), meta: { label: "Status" }, header: "Status" },
    { accessorKey: "createdAt", meta: { label: "Added" }, header: ({ column }) => <SortHeader label="Added" column={column} />, cell: ({ row }) => <span className="tnum">{fmtDateYear(row.original.createdAt)}</span> },
    {
      id: "actions",
      enableHiding: false,
      header: "",
      cell: ({ row }) => {
        const u = row.original
        if (u.id === me) return <span className="t-caption text-muted-ink">You can&apos;t change your own access</span>
        const next = u.staffRole === "admin" ? "support" : "admin"
        return (
          <div className="flex gap-1.5">
            <ReasonButton perm="users" label={`Make ${next === "admin" ? "Admin" : "Support"}`} title={`Make ${u.firstName} ${next === "admin" ? "an Admin" : "Support"}?`} onConfirm={(r) => { useStore.getState().adminStaff("role", { userId: u.id, role: next }, r); toast("Role changed") }} />
            <ReasonButton perm="users" label="Remove" variant="destructive" title={`Remove ${u.firstName}'s admin access?`} description="They can't sign in to the console any more." presets={["Left Vitalos", "Changed team"]} onConfirm={(r) => { useStore.getState().adminStaff("remove", { userId: u.id }, r); toast("Access removed") }} />
          </div>
        )
      },
    },
  ]
  return (
    <AdminPage id="A-21" title="Admin users" perm="users" description="Vitalos staff with access to this console." actions={<Invite />}>
      <DataTable label="Admin users" data={staff} columns={columns} getRowId={(r) => r.id} initialSort={[{ id: "name", desc: false }]} facets={[{ column: "staffRole", label: "Role", options: [{ value: "admin", label: "Admin" }, { value: "support", label: "Support" }] }]} searchPlaceholder="Search staff" emptyTitle="No admin users" emptyBody="Invite someone with a vitalos.co.uk address." />
    </AdminPage>
  )
}
