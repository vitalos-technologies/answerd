"use client"
import * as React from "react"
import { Crown, KeyRound, Smartphone, UserPlus } from "lucide-react"
import { Panel, Pill, ReasonButton, ReasonDialog, adminInput, permsFor, type AdminPerm } from "@/components/admin/kit"
import { SuperPage } from "@/components/admin/super/ui"
import { lastSignIn } from "@/components/admin/super/metrics"
import { ROLE_LABEL } from "@/components/shells/AdminShell"
import { Button } from "@/components/answerd/Button"
import { useStore } from "@/lib/store"
import { addDays, fmtDate, fmtDateYear, fmtTime, ms } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { StaffRole, User } from "@/lib/types"
import { cn } from "@/lib/utils"

const PERMS: { perm: AdminPerm; label: string }[] = [
  { perm: "claims", label: "Approve claims and disputes" },
  { perm: "credentials", label: "Approve credentials" },
  { perm: "reviews", label: "Moderate reviews" },
  { perm: "reports", label: "Resolve reports" },
  { perm: "listings", label: "Edit, suspend and unpublish listings" },
  { perm: "merge", label: "Merge listings" },
  { perm: "customers", label: "Suspend or delete customers" },
  { perm: "desk_qa", label: "Rate desk conversations" },
  { perm: "imports", label: "Run imports" },
  { perm: "taxonomy", label: "Edit the taxonomy" },
  { perm: "places", label: "Set the Places cap" },
  { perm: "billing", label: "Refunds and billing changes" },
  { perm: "gate", label: "Override the monetise gate" },
  { perm: "featured", label: "Assign Featured slots" },
  { perm: "content", label: "Edit content" },
  { perm: "users", label: "Invite and remove admin users" },
  { perm: "settings", label: "Settings and the desk kill switch" },
  { perm: "support_view", label: "View a business as support" },
]

const SUPER_ONLY = ["Revenue, costs and growth", "Team roles and this matrix", "Pricing and rules", "Platform switches", "Integrations and secrets", "Impersonation and data requests", "Security log"]

function TwoFactor({ u }: { u: User }) {
  const f = u.twoFactor ?? []
  if (!f.length) return <Pill tone="bad">Not set up</Pill>
  return (
    <span className="flex flex-wrap gap-1">
      {f.includes("security_key") && <Pill tone="good" icon={<KeyRound aria-hidden />}>Security key</Pill>}
      {f.includes("authenticator") && <Pill tone="good" icon={<Smartphone aria-hidden />}>Authenticator</Pill>}
    </span>
  )
}

function Invite() {
  const [first, setFirst] = React.useState("")
  const [last, setLast] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<StaffRole>("support")
  const users = useStore((s) => s.users)
  return (
    <ReasonButton
      perm="users"
      size="md"
      variant="primary"
      label="Invite"
      icon={<UserPlus aria-hidden />}
      title="Invite a member of staff"
      description="They sign in with their vitalos.co.uk Google account. Super admins also need a security key."
      confirmLabel="Send invite"
      presets={["New support starter", "New ops lead", "New leadership hire"]}
      validate={() => {
        if (!first.trim()) return "Enter a first name."
        if (!/^[^@\s]+@vitalos\.co\.uk$/i.test(email.trim())) return "Use a vitalos.co.uk email address."
        if (users.some((u) => u.email?.toLowerCase() === email.trim().toLowerCase() && u.staffRole)) return "That person is already on the team."
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
        <label className="col-span-2 flex flex-col gap-1.5">
          <span className="t-label text-navy">Role</span>
          <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={adminInput}>
            <option value="support">Support: read-only, reviews</option>
            <option value="admin">Admin: the full console</option>
            <option value="super_admin">Super admin: Admin plus the owner&apos;s controls</option>
          </select>
        </label>
      </div>
    </ReasonButton>
  )
}

function RoleSelect({ u, isMe, lastSuper }: { u: User; isMe: boolean; lastSuper: boolean }) {
  const [next, setNext] = React.useState<StaffRole | null>(null)
  const id = React.useId()
  const locked = isMe || lastSuper
  return (
    <>
      <label htmlFor={id} className="sr-only">
        Role for {u.firstName} {u.lastName}
      </label>
      <select id={id} value={u.staffRole} disabled={locked} onChange={(e) => setNext(e.target.value as StaffRole)} className={cn(adminInput, "h-10 w-40")} aria-describedby={locked ? `${id}-why` : undefined}>
        {(["super_admin", "admin", "support"] as const).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </select>
      {locked && (
        <span id={`${id}-why`} className="mt-0.5 block t-caption text-muted-ink">
          {isMe ? "You can't change your own role" : "The last super admin keeps the role"}
        </span>
      )}
      <ReasonDialog
        open={!!next}
        onOpenChange={(v) => !v && setNext(null)}
        title={`Make ${u.firstName} ${next ? ROLE_LABEL[next] : ""}?`}
        description={next === "super_admin" ? "Super admins see revenue and costs, change pricing rules, flip platform switches and can impersonate users." : "Their access changes at their next page load."}
        confirmLabel="Change role"
        presets={["Changed team", "Promotion", "Access review"]}
        onConfirm={(reason) => {
          useStore.getState().adminStaff("role", { userId: u.id, role: next! }, reason)
          toast("Role changed")
        }}
      />
    </>
  )
}

function PermissionsMatrix() {
  const rolePerms = useStore((s) => s.settings.rolePerms)
  const saved = permsFor(rolePerms)
  const [draft, setDraft] = React.useState<{ admin: string[]; support: string[] } | null>(null)
  const [open, setOpen] = React.useState(false)
  const cur = draft ?? saved
  const dirty = !!draft && (draft.admin.join() !== saved.admin.join() || draft.support.join() !== saved.support.join())
  const toggle = (role: "admin" | "support", perm: string) => {
    const list = cur[role].includes(perm) ? cur[role].filter((p) => p !== perm) : [...cur[role], perm]
    setDraft({ ...cur, [role]: PERMS.map((p) => p.perm).filter((p) => list.includes(p)) })
  }
  return (
    <Panel
      title="Permissions"
      action={
        <div className="flex gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" className="h-10" onClick={() => setDraft(null)}>
              Discard
            </Button>
          )}
          <Button size="sm" className="h-10" disabled={!dirty} onClick={() => setOpen(true)}>
            Save changes
          </Button>
        </div>
      }
    >
      <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
        <caption className="sr-only">Permissions by role</caption>
        <thead>
          <tr className="border-b border-line text-left text-navy">
            <th className="py-2 font-semibold">Can…</th>
            <th className="w-28 py-2 text-center font-semibold">Super admin</th>
            <th className="w-28 py-2 text-center font-semibold">Admin</th>
            <th className="w-28 py-2 text-center font-semibold">Support</th>
          </tr>
        </thead>
        <tbody>
          {PERMS.map((p) => (
            <tr key={p.perm} className="border-b border-line last:border-0">
              <th scope="row" className="py-1.5 text-left font-normal text-navy">{p.label}</th>
              <td className="py-1.5 text-center">
                <input type="checkbox" checked disabled className="size-4 accent-blue" aria-label={`Super admin: ${p.label} (always)`} />
              </td>
              {(["admin", "support"] as const).map((r) => (
                <td key={r} className="py-1.5 text-center">
                  <label className="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg hover:bg-sky">
                    <input type="checkbox" checked={cur[r].includes(p.perm)} onChange={() => toggle(r, p.perm)} className="size-4 accent-blue" aria-label={`${ROLE_LABEL[r]}: ${p.label}`} />
                  </label>
                </td>
              ))}
            </tr>
          ))}
          {SUPER_ONLY.map((label) => (
            <tr key={label} className="border-b border-line bg-sky/60 last:border-0">
              <th scope="row" className="py-1.5 text-left font-normal text-navy">
                <Crown className="mr-1.5 inline size-3.5 text-amber-ink" aria-hidden />
                {label}
              </th>
              <td className="py-1.5 text-center">
                <input type="checkbox" checked disabled className="size-4 accent-blue" aria-label={`Super admin: ${label} (always)`} />
              </td>
              <td className="py-1.5 text-center t-caption text-muted-ink" colSpan={2}>
                Super admin only
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ReasonDialog
        open={open}
        onOpenChange={setOpen}
        title="Save permission changes?"
        description="Admin and Support access changes straight away. Every change lands in the audit log and the security log."
        confirmLabel="Save permissions"
        presets={["Quarterly access review", "Least privilege", "New process"]}
        onConfirm={(reason) => {
          const st = useStore.getState()
          if (draft && draft.admin.join() !== saved.admin.join()) st.setRolePerms("admin", draft.admin, reason)
          if (draft && draft.support.join() !== saved.support.join()) st.setRolePerms("support", draft.support, reason)
          setDraft(null)
          toast("Permissions saved")
        }}
      />
    </Panel>
  )
}

/** S-05: staff with role, last sign-in and 2FA; invite, change role, remove; editable permissions; quarterly access review. */
export default function TeamRoles() {
  const s = useStore()
  const me = s.session.impersonation?.byUserId ?? s.session.userId
  const staff = s.users.filter((u) => u.staffRole).sort((a, b) => ["super_admin", "admin", "support"].indexOf(a.staffRole!) - ["super_admin", "admin", "support"].indexOf(b.staffRole!) || a.firstName.localeCompare(b.firstName))
  const supers = staff.filter((u) => u.staffRole === "super_admin").length
  const reviewAt = s.settings.accessReviewAt
  const due = reviewAt ? addDays(reviewAt, 91) : s.clock
  const overdue = ms(due) <= ms(s.clock)
  return (
    <SuperPage id="S-05" title="Team and roles" description="Super admin > Admin > Support. Everyone signs in with a vitalos.co.uk Google account and a second factor." actions={<Invite />}>
      <Panel title={`Staff (${staff.length})`}>
        <table className="w-full text-[13.5px] [&_td]:pr-3 [&_th]:pr-3">
          <caption className="sr-only">Staff</caption>
          <thead>
            <tr className="border-b border-line text-left text-navy">
              <th className="py-2 font-semibold">Name</th>
              <th className="py-2 font-semibold">Role</th>
              <th className="py-2 font-semibold">Last sign-in</th>
              <th className="py-2 font-semibold">Two-factor</th>
              <th className="py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {staff.map((u) => {
              const last = lastSignIn(s, u.id)
              const isMe = u.id === me
              const lastSuper = u.staffRole === "super_admin" && supers <= 1
              return (
                <tr key={u.id} className="border-b border-line align-top last:border-0">
                  <td className="py-2.5">
                    <span className="block font-medium text-navy">
                      {u.firstName} {u.lastName}
                      {isMe ? " (you)" : ""}
                    </span>
                    <span className="block t-caption text-muted-ink">{u.email}</span>
                  </td>
                  <td className="py-2.5">
                    <RoleSelect u={u} isMe={isMe} lastSuper={lastSuper} />
                  </td>
                  <td className="py-2.5 tnum">{last ? `${fmtDate(last)}, ${fmtTime(last)}` : <span className="text-muted-ink">Not yet (invited)</span>}</td>
                  <td className="py-2.5">
                    <TwoFactor u={u} />
                  </td>
                  <td className="py-2.5 text-right">
                    {isMe || lastSuper ? (
                      <span className="t-caption text-muted-ink">{isMe ? "That's you" : "Last super admin"}</span>
                    ) : (
                      <ReasonButton perm="users" label="Remove" variant="destructive" title={`Remove ${u.firstName}'s access?`} description="They can't sign in to the console any more. Their audit history stays." presets={["Left Vitalos", "Changed team", "Access review"]} onConfirm={(r) => { useStore.getState().adminStaff("remove", { userId: u.id }, r); toast("Access removed") }} />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </Panel>

      <div className="mt-4 grid grid-cols-1 items-start gap-4 xl:grid-cols-[1.5fr_1fr]">
        <PermissionsMatrix />
        <Panel title="Quarterly access review">
          <p className="t-body text-slate">Check every person still needs their role and a second factor. Remove anyone who has left.</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px]">
            <dt className="text-muted-ink">Last review</dt>
            <dd className="text-navy tnum">{reviewAt ? fmtDateYear(reviewAt) : "Never"}</dd>
            <dt className="text-muted-ink">Next due</dt>
            <dd className="tnum">{overdue ? <Pill tone="bad">Overdue</Pill> : <span className="text-navy">{fmtDateYear(due)}</span>}</dd>
            <dt className="text-muted-ink">Without two-factor</dt>
            <dd className="text-navy tnum">{staff.filter((u) => !u.twoFactor?.length).length}</dd>
          </dl>
          <div className="mt-4">
            <ReasonButton perm="users" variant="primary" size="md" label="Record access review" title="Record this quarter's access review?" description="Confirms you checked every role and second factor today." confirmLabel="Record review" presets={["All roles checked, no changes", "Roles checked, changes made above"]} onConfirm={(r) => { useStore.getState().recordAccessReview(r); toast("Access review recorded") }} />
          </div>
        </Panel>
      </div>
    </SuperPage>
  )
}
