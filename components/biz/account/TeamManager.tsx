"use client"
import * as React from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/answerd/Button"
import { EmptyState } from "@/components/answerd/Feedback"
import { Field, TextInput } from "@/components/answerd/Fields"
import { PersonAvatar } from "@/components/answerd/Media"
import { BottomSheet } from "@/components/answerd/Sheet"
import { DataGate } from "@/components/app/helpers"
import { useStore } from "@/lib/store"
import { maskPhone, normaliseUkMobile } from "@/lib/format"
import { fmtDate } from "@/lib/time"
import { toast } from "@/lib/toast"
import type { BusinessMember } from "@/lib/types"

/** B-38 team: members with role, invite staff by name and phone (pending until they accept), remove with confirm. */
export function TeamManager({ businessId, readOnly }: { businessId: string; readOnly?: boolean }) {
  const s = useStore()
  const members = s.members.filter((m) => m.businessId === businessId).sort((a, b) => (a.role === b.role ? a.invitedAt.localeCompare(b.invitedAt) : a.role === "owner" ? -1 : 1))
  const [inviting, setInviting] = React.useState(false)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [errors, setErrors] = React.useState<{ name?: string; phone?: string }>({})
  const [removing, setRemoving] = React.useState<BusinessMember | null>(null)

  const invite = (e: React.FormEvent) => {
    e.preventDefault()
    const p = normaliseUkMobile(phone)
    const errs: typeof errors = {}
    if (!name.trim()) errs.name = "Enter their name"
    if (!p) errs.phone = "Enter a UK mobile number, like 07700 900123"
    else if (members.some((m) => m.phone.replace(/\s/g, "") === p.replace(/\s/g, ""))) errs.phone = "They're already on your team"
    setErrors(errs)
    if (errs.name || errs.phone) return
    s.inviteStaff(businessId, name.trim(), p!)
    toast(`Invite sent by SMS to ${maskPhone(p!)}`)
    setName("")
    setPhone("")
    setInviting(false)
  }

  return (
    <div className="space-y-4">
      <DataGate isEmpty={!members.length} rows={3} empty={<div className="card"><EmptyState title="No team yet" body="Invite staff to share the inbox and see their own jobs." /></div>}>
        <ul className="card divide-y divide-line">
          {members.map((m) => (
            <li key={m.id} className="flex min-h-16 items-center gap-3 px-4 py-3">
              <PersonAvatar name={m.name} size={40} tone={m.role === "owner" ? "navy" : "sky"} />
              <div className="min-w-0 flex-1">
                <p className="truncate t-label font-semibold text-navy">
                  {m.name}
                  {m.userId === s.session.userId && <span className="font-normal text-muted-ink"> (you)</span>}
                </p>
                <p className="t-caption text-muted-ink tnum">
                  {m.role === "owner" ? "Owner" : "Staff"} · {m.joinedAt ? `joined ${fmtDate(m.joinedAt)}` : `invited ${fmtDate(m.invitedAt)}, waiting to accept`}
                </p>
              </div>
              {!m.joinedAt && <span className="rounded-full bg-amber-tint px-2 py-0.5 t-caption text-amber-ink">Pending</span>}
              {!readOnly && m.role !== "owner" && (
                <Button variant="ghost" size="sm" onClick={() => setRemoving(m)} aria-label={`Remove ${m.name}`}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      </DataGate>
      <p className="t-caption text-muted-ink">Staff see Today, Inbox and Diary, and only their own jobs. They can&apos;t change your profile, desk or billing.</p>

      {!readOnly &&
        (inviting ? (
          <form className="card space-y-3 p-4" noValidate onSubmit={invite}>
            <p className="t-subhead">Invite staff</p>
            <Field label="Name" htmlFor="inv-name" error={errors.name}>
              <TextInput id="inv-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" aria-invalid={!!errors.name} />
            </Field>
            <Field label="Mobile number" htmlFor="inv-phone" hint="We'll text them a link to join" error={errors.phone}>
              <TextInput id="inv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="tnum" aria-invalid={!!errors.phone} />
            </Field>
            <Field label="Role" htmlFor="inv-role">
              <TextInput id="inv-role" value="Staff" readOnly aria-readonly className="bg-sky" />
            </Field>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setInviting(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Send invite
              </Button>
            </div>
          </form>
        ) : (
          <Button block onClick={() => setInviting(true)}>
            <UserPlus /> Invite staff
          </Button>
        ))}

      <BottomSheet
        open={!!removing}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.name ?? ""}?`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setRemoving(null)}>
              Keep
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (removing) s.removeMember(removing.id)
                toast(`${removing?.name} removed`)
                setRemoving(null)
              }}
            >
              Remove
            </Button>
          </div>
        }
      >
        <p className="t-body text-slate">{removing?.joinedAt ? "They'll lose access to your inbox and diary straight away. Their jobs stay in your diary." : "Their invite will stop working."}</p>
      </BottomSheet>
    </div>
  )
}
